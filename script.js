const tg = window.Telegram.WebApp;
tg.expand();

// --- ДАННЫЕ И ИНИЦИАЛИЗАЦИЯ --
let userBalance = localStorage.getItem('balance') ? parseInt(localStorage.getItem('balance')) : 100;
let inventory = localStorage.getItem('inventory') ? JSON.parse(localStorage.getItem('inventory')) : [];

// Сразу обновляем интерфейс
updateUI();

// === ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ И АВАТАРКИ ===
if (tg.initDataUnsafe?.user) {
    const user = tg.initDataUnsafe.user;

    // 1. Имя
    document.getElementById('username').innerText = user.first_name;

    // 2. Фото (Аватарка)
    // Проверяем, отдал ли телеграм ссылку на фото
    if (user.photo_url) {
        document.querySelector('.avatar img').src = user.photo_url;
    } else {
        console.log("У пользователя нет фото или настройки приватности скрывают его");
    }
}

// --- ФУНКЦИИ ---

// 1. Переключение вкладок
function switchTab(tabName, element) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
}

// 2. Покупка предмета
function buyItem(name, price, image) {
    if (userBalance >= price) {
        userBalance -= price;
        inventory.push({ name: name, image: image });
        
        saveData();
        updateUI();
        
        tg.showAlert(`Ура! Вы купили ${name}.`);
    } else {
        tg.showAlert(`Не хватает звезд! У вас ${userBalance}, а нужно ${price}.`);
    }
}

// 3. Рулетка
function // --- КОНФИГУРАЦИЯ РУЛЕТКИ ---
// Сумма всех chance должна быть равна 100
const prizes = [
    { name: "5 Звёзд", type: 'stars', value: 5, chance: 40 },
    { name: "10 Звёзд", type: 'stars', value: 10, chance: 25 },
    { name: "Скидка 5%", type: 'discount', value: 5, chance: 15 },
    { name: "25 Звёзд", type: 'stars', value: 25, chance: 10 },
    { name: "Скидка 10%", type: 'discount', value: 10, chance: 5 },
    { name: "50 Звёзд", type: 'stars', value: 50, chance: 3 },
    { name: "Скидка 15%", type: 'discount', value: 15, chance: 2 }
];

function spin() {
// --- КОНФИГУРАЦИЯ РУЛЕТКИ ---
// Важно: порядок здесь должен совпадать с порядком цветов в CSS conic-gradient
const prizes = [
    { name: "5 Звёзд", type: 'stars', value: 5, chance: 40 },   // Сектор 1 (0-45deg)
    { name: "10 Звёзд", type: 'stars', value: 10, chance: 25 }, // Сектор 2
    { name: "Скидка 5%", type: 'discount', value: 5, chance: 15 }, // Сектор 3
    { name: "25 Звёзд", type: 'stars', value: 25, chance: 10 }, // Сектор 4
    { name: "Скидка 10%", type: 'discount', value: 10, chance: 5 }, // Сектор 5
    { name: "50 Звёзд", type: 'stars', value: 50, chance: 3 },  // Сектор 6
    { name: "Скидка 15%", type: 'discount', value: 15, chance: 2 }, // Сектор 7
     // (Визуально есть 8-й сектор, но математически мы используем 7 призов. 
     // Если выпадет 8-й сектор по ошибке, добавим 5 звезд как бонус).
];

// Время последнего прокрута (берем из памяти или 0)
let lastSpinTime = localStorage.getItem('lastSpinTime') ? parseInt(localStorage.getItem('lastSpinTime')) : 0;
const COOLDOWN_TIME = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах

// --- ФУНКЦИЯ ВРАЩЕНИЯ ---
function spin() {
    // 1. Проверка времени перед стартом
    const now = Date.now();
    if (now - lastSpinTime < COOLDOWN_TIME) {
        tg.showAlert("Полегче! Колесо можно крутить только раз в 24 часа.");
        return;
    }

    const wheel = document.getElementById('wheel');
    const resultText = document.getElementById('spin-result');
    const btn = document.getElementById('spin-btn');

    btn.disabled = true;
    resultText.innerText = "Колесо крутится...";

    // 2. Математика: определяем победителя ЗАРАНЕЕ
    const random = Math.random() * 100;
    let currentSum = 0;
    let wonPrize = prizes[0]; // По умолчанию первый
    let prizeIndex = 0;

    for (let i = 0; i < prizes.length; i++) {
        currentSum += prizes[i].chance;
        if (random <= currentSum) {
            wonPrize = prizes[i];
            prizeIndex = i;
            break;
        }
    }

    // 3. Расчет угла остановки
    // У нас 8 визуальных секторов = 360 / 8 = 45 градусов на сектор.
    // Чтобы маркер (сверху) указал на нужный сектор, колесо должно докрутиться
    // так, чтобы этот сектор оказался наверху.
    const segmentAngle = 45; 
    // Добавляем немного случайности внутри сектора (+- 20 град), чтобы не всегда в центр попадало
    const randomOffset = Math.floor(Math.random() * 40) - 20; 
    
    // Формула: 5 полных оборотов + угол до нужного сектора
    // Мы вычитаем угол, потому что крутим по часовой стрелке, а индексы идут против.
    const targetRotation = (360 * 5) - (prizeIndex * segmentAngle) - (segmentAngle / 2) + randomOffset;

    // Запускаем анимацию
    wheel.style.transform = `rotate(${targetRotation}deg)`;

    // 4. Действия после остановки (через 4 секунды)
    setTimeout(() => {
        // Сохраняем время прокрута
        lastSpinTime = Date.now();
        localStorage.setItem('lastSpinTime', lastSpinTime);

        // Начисляем награду
        if (wonPrize.type === 'stars') {
            userBalance += wonPrize.value;
            resultText.innerHTML = `🎉 Выпало: <b>${wonPrize.name}</b>!`;
        } else {
            inventory.push({ 
                name: wonPrize.name, 
                image: "https://cdn-icons-png.flaticon.com/512/879/879757.png" 
            });
            resultText.innerHTML = `🎟 Выпало: <b>${wonPrize.name}</b>!`;
        }

        saveData();
        updateUI(); // Обновит баланс и запустит таймер на кнопке
        tg.hapticFeedback.notificationOccurred('success');

        // ВАЖНО: Колесо не сбрасываем в 0, чтобы оно не дергалось назад.
        // В следующий раз оно начнет крутиться с этой же позиции.

    }, 4100); // Чуть больше 4 секунд, чтобы анимация точно закончилась
}

// --- ФУНКЦИЯ ТАЙМЕРА (Добавьте её в конец script.js) ---
let timerInterval;

function checkSpinCooldown() {
    const btn = document.getElementById('spin-btn');
    if (!btn) return; // Если мы не на вкладке рулетки

    const now = Date.now();
    const timeLeft = COOLDOWN_TIME - (now - lastSpinTime);

    if (timeLeft > 0) {
        // Время еще не пришло
        btn.disabled = true;
        
        // Вычисляем часы, минуты, секунды
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        btn.innerText = `Жди: ${hours}ч ${minutes}м ${seconds}с`;
    } else {
        // Время пришло!
        btn.disabled = false;
        btn.innerText = "Крутить колесо!";
        if (timerInterval) clearInterval(timerInterval); // Останавливаем таймер
    }
}
function updateUI() {
    // --- ДОБАВЬТЕ ЭТУ СТРОКУ ---
    // Запускаем проверку таймера каждую секунду, если мы на вкладке рулетки
    if (document.getElementById('tab-roulette').classList.contains('active')) {
         if (timerInterval) clearInterval(timerInterval); // Очищаем старый
         timerInterval = setInterval(checkSpinCooldown, 1000); // Запускаем новый
         checkSpinCooldown(); // И сразу проверяем один раз
    }
    // ---------------------------

    document.getElementById('balance').innerText = userBalance;
    // ... остальной код функции ...
}
    
    const invContainer = document.getElementById('inventory');
    if (inventory.length > 0) {
        invContainer.innerHTML = "";
        inventory.forEach(item => {
            invContainer.innerHTML += `
                <div class="inventory-item">
                    <img src="${item.image}">
                    <div>${item.name}</div>
                </div>
            `;
        });
    }
}



