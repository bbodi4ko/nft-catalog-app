const tg = window.Telegram.WebApp;
tg.expand();

// --- ДАННЫЕ И ИНИЦИАЛИЗАЦИЯ ---
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
function spin() {
    const wheel = document.getElementById('wheel');
    const resultText = document.getElementById('spin-result');
    const btn = document.querySelector('.spin-btn');
    
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
