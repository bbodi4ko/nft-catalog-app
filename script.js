const tg = window.Telegram.WebApp;
tg.expand();

// Данные
let userBalance = localStorage.getItem('balance') ? parseInt(localStorage.getItem('balance')) : 100;
let inventory = localStorage.getItem('inventory') ? JSON.parse(localStorage.getItem('inventory')) : [];
let lastSpinTime = localStorage.getItem('lastSpinTime') ? parseInt(localStorage.getItem('lastSpinTime')) : 0;
let timerInterval = null;
const COOLDOWN = 24 * 60 * 60 * 1000; // 24 часа

// Призы (порядок важен для цветов!)
const prizes = [
    { name: "5 Звёзд", type: 'stars', value: 5, chance: 40 },
    { name: "10 Звёзд", type: 'stars', value: 10, chance: 25 },
    { name: "Скидка 5%", type: 'discount', value: 5, chance: 15 },
    { name: "25 Звёзд", type: 'stars', value: 25, chance: 10 },
    { name: "Скидка 10%", type: 'discount', value: 10, chance: 5 },
    { name: "50 Звёзд", type: 'stars', value: 50, chance: 3 },
    { name: "Скидка 15%", type: 'discount', value: 15, chance: 2 }
];

// Инициализация
updateUI();

// Данные пользователя из ТГ
if (tg.initDataUnsafe?.user) {
    const user = tg.initDataUnsafe.user;
    document.getElementById('username').innerText = user.first_name;
    if (user.photo_url) {
        document.querySelector('.avatar img').src = user.photo_url;
    }
}

// --- ФУНКЦИИ ---

function switchTab(tabName, element) {
    // Вкладки
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    
    // Меню
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');

    // Логика таймера
    if (tabName === 'roulette') {
        checkTimer(); // Запуск таймера
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(checkTimer, 1000);
    } else {
        if (timerInterval) clearInterval(timerInterval);
    }
}

function buyItem(name, price, image) {
    if (userBalance >= price) {
        userBalance -= price;
        inventory.push({ name: name, image: image });
        saveData();
        updateUI();
        tg.showAlert(`Куплено: ${name}`);
    } else {
        tg.showAlert(`Нужно ${price} звезд, а у вас ${userBalance}`);
    }
}

function spin() {
    const now = Date.now();
    if (now - lastSpinTime < COOLDOWN) return; // Защита от клика

    const wheel = document.getElementById('wheel');
    const resultText = document.getElementById('spin-result');
    const btn = document.getElementById('spin-btn');

    btn.disabled = true;
    resultText.innerText = "Крутим...";

    // 1. Выбираем приз математически
    const random = Math.random() * 100;
    let currentSum = 0;
    let wonPrize = prizes[0];
    let index = 0;

    for (let i = 0; i < prizes.length; i++) {
        currentSum += prizes[i].chance;
        if (random <= currentSum) {
            wonPrize = prizes[i];
            index = i;
            break;
        }
    }

    // 2. Считаем угол
    const segment = 360 / 8; // 45 градусов
    const offset = Math.floor(Math.random() * 20) - 10; // Случайность
    const rotate = (360 * 5) - (index * segment) - (segment / 2) + offset;

    // 3. Крутим
    wheel.style.transform = `rotate(${rotate}deg)`;

    // 4. Результат
    setTimeout(() => {
        lastSpinTime = Date.now();
        localStorage.setItem('lastSpinTime', lastSpinTime);

        if (wonPrize.type === 'stars') {
            userBalance += wonPrize.value;
            resultText.innerText = `Выпало: ${wonPrize.name}`;
        } else {
            inventory.push({ name: wonPrize.name, image: "https://cdn-icons-png.flaticon.com/512/879/879757.png" });
            resultText.innerText = `Приз: ${wonPrize.name}`;
        }
        
        saveData();
        updateUI();
        checkTimer(); // Сразу включаем режим таймера на кнопке
        tg.hapticFeedback.notificationOccurred('success');
    }, 4100);
}

function checkTimer() {
    const btn = document.getElementById('spin-btn');
    if (!btn) return;

    const now = Date.now();
    const diff = COOLDOWN - (now - lastSpinTime);

    if (diff > 0) {
        btn.disabled = true;
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        btn.innerText = `Ждать: ${h}ч ${m}м ${s}с`;
    } else {
        btn.disabled = false;
        btn.innerText = "Крутить!";
    }
}

function saveData() {
    localStorage.setItem('balance', userBalance);
    localStorage.setItem('inventory', JSON.stringify(inventory));
}

function updateUI() {
    document.getElementById('balance').innerText = userBalance;
    const invDiv = document.getElementById('inventory');
    
    if (inventory.length > 0) {
        invDiv.innerHTML = "";
        inventory.forEach(item => {
            invDiv.innerHTML += `
                <div class="inventory-item">
                    <img src="${item.image}">
                    <div>${item.name}</div>
                </div>`;
        });
    }
}
