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
    const wheel = document.getElementById('wheel');
    const resultText = document.getElementById('spin-result');
    const btn = document.querySelector('.spin-btn');

    // 1. Блокируем кнопку
    btn.disabled = true;
    resultText.innerText = "Выбираем приз...";
    
    // 2. Запускаем визуальную анимацию
    wheel.style.transform = "rotate(1080deg)"; // 3 оборота

    // 3. Вычисляем выигрыш (заранее)
    const random = Math.random() * 100; // Число от 0 до 100
    let currentSum = 0;
    let wonPrize = null;

    // Проходим по списку и смотрим, куда попало число
    for (let prize of prizes) {
        currentSum += prize.chance;
        if (random <= currentSum) {
            wonPrize = prize;
            break;
        }
    }

    // 4. Через 3 секунды показываем результат
    setTimeout(() => {
        wheel.style.transform = "rotate(0deg)"; // Сброс круга
        
        if (wonPrize.type === 'stars') {
            // Если выиграли звезды - добавляем к балансу
            userBalance += wonPrize.value;
            resultText.innerHTML = `Выпало: <b style="color:#fbbf24">${wonPrize.name}</b>!`;
            tg.showAlert(`Поздравляем! Ваш баланс пополнен на ${wonPrize.value} звезд.`);
        } else {
            // Если выиграли СКИДКУ - добавляем её в инвентарь как предмет
            inventory.push({ 
                name: wonPrize.name, 
                image: "https://cdn-icons-png.flaticon.com/512/879/879757.png" // Картинка купона
            });
            resultText.innerHTML = `Выпало: <b style="color:#a855f7">${wonPrize.name}</b>!`;
            tg.showAlert(`Вау! Вы выиграли ${wonPrize.name}. Купон добавлен в ваш профиль.`);
        }

        saveData();
        updateUI();
        
        // Разблокируем кнопку
        btn.disabled = false;
        tg.hapticFeedback.notificationOccurred('success');
    }, 3000);
}
    // Блокируем кнопку, чтобы не жали много раз
    btn.disabled = true;

    // Анимация
    wheel.style.transform = "rotate(1080deg)"; 
    
    setTimeout(() => {
        const reward = Math.floor(Math.random() * 200) + 50; 
        userBalance += reward;
        saveData();
        updateUI();
        
        // Сброс и разблокировка
        wheel.style.transform = "rotate(0deg)"; 
        resultText.innerText = `Вы выиграли ${reward} звёзд!`;
        btn.disabled = false;
        
        // Вибрация телефона
        tg.hapticFeedback.notificationOccurred('success'); 
    }, 3000);
}

// 4. Вспомогательные функции
function saveData() {
    localStorage.setItem('balance', userBalance);
    localStorage.setItem('inventory', JSON.stringify(inventory));
}

function updateUI() {
    document.getElementById('balance').innerText = userBalance;
    
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


