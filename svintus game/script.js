// ========== ИНИЦИАЛИЗАЦИЯ TELEGRAM ==========
const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation();
}

// ========== БАЗА ДАННЫХ ==========
let gameData = {
    coins: 0,
    level: 1,
    multiplier: 1,
    maxEnergy: 1000,
    currentEnergy: 1000,
    regenPerSec: 5,
    totalTaps: 0,
    activePig: 0,
    ownedPigs: [true, false, false, false, false, false, false, false, false, false, false, false, false],
    offlineEarning: {
        level: 0,
        rate: 0,
        basePrice: 500,
        price: 500
    },
    lastOfflineTime: Date.now(),
    offlineCollected: 0,
    upgradeLevels: {
        multiplier: { level: 0, basePrice: 100, price: 100 },
        energy: { level: 0, basePrice: 150, price: 150 },
        regen: { level: 0, basePrice: 200, price: 200 }
    }
};

// ========== КОЛЛЕКЦИЯ СВИНОВ (ТРАТА ЭНЕРГИИ УВЕЛИЧЕНА В 2 РАЗА) ==========
const pigsCollection = [
    { 
        id: 0, 
        name: 'Дикий кабан', 
        emoji: '🐗', 
        multiplier: 1, 
        price: 0, 
        energyCost: 4, // было 2
        desc: 'Обычный лесной кабан. Начинает с малого, но старается!'
    },
    { 
        id: 1, 
        name: 'Золотой хряк', 
        emoji: '🐗✨', 
        multiplier: 2, 
        price: 500, 
        energyCost: 6, // было 3
        desc: 'Шерсть отливает золотом. Приносит удачу и монеты.'
    },
    { 
        id: 2, 
        name: 'Барон Свинтус', 
        emoji: '👑🐗', 
        multiplier: 3, 
        price: 2000, 
        energyCost: 8, // было 4
        desc: 'Аристократ среди свиней. В короне и с манерами.'
    },
    { 
        id: 3, 
        name: 'Кибер-свин', 
        emoji: '🤖🐗', 
        multiplier: 5, 
        price: 5000, 
        energyCost: 10, // было 5
        desc: 'Наполовину свин, наполовину робот. Механическое сердце.'
    },
    { 
        id: 4, 
        name: 'Магма-боров', 
        emoji: '🌋🐗', 
        multiplier: 8, 
        price: 10000, 
        energyCost: 12, // было 6
        desc: 'Рожден в вулкане. Копыта плавят камни.'
    },
    { 
        id: 5, 
        name: 'Космо-свин', 
        emoji: '🚀🐗', 
        multiplier: 12, 
        price: 20000, 
        energyCost: 14, // было 7
        desc: 'Побывал на Луне. В скафандре и очень умный.'
    },
    { 
        id: 6, 
        name: 'Драко-свин', 
        emoji: '🐉🐗', 
        multiplier: 18, 
        price: 50000, 
        energyCost: 16, // было 8
        desc: 'Скрестили с драконом. Дышит огнем и хрюкает басом.'
    },
    { 
        id: 7, 
        name: 'Свинтус Всевластный', 
        emoji: '⚡🐗⚡', 
        multiplier: 30, 
        price: 100000, 
        energyCost: 20, // было 10
        desc: 'Повелитель всех свиней. Молнии сверкают в глазах.'
    },
    { 
        id: 8, 
        name: 'Ледяной вепрь', 
        emoji: '❄️🐗', 
        multiplier: 40, 
        price: 200000, 
        energyCost: 24, // было 12
        desc: 'Из вечной мерзлоты. Дыхание превращает воду в лед.'
    },
    { 
        id: 9, 
        name: 'Огненный хряк', 
        emoji: '🔥🐗', 
        multiplier: 55, 
        price: 500000, 
        energyCost: 30, // было 15
        desc: 'Пылает ярким пламенем. Сжигает все на своем пути.'
    },
    { 
        id: 10, 
        name: 'Алмазный боров', 
        emoji: '💎🐗', 
        multiplier: 75, 
        price: 1000000, 
        energyCost: 36, // было 18
        desc: 'Весь усыпан алмазами. Самый драгоценный свин.'
    },
    { 
        id: 11, 
        name: 'Радужный свин', 
        emoji: '🌈🐗', 
        multiplier: 100, 
        price: 2500000, 
        energyCost: 44, // было 22
        desc: 'После дождя появляется. Приносит счастье и радугу.'
    },
    { 
        id: 12, 
        name: 'ТУРБО СВИН', 
        emoji: '⚡🏎️🐗⚡', 
        multiplier: 150, 
        price: 5000000, 
        energyCost: 60, // было 30
        desc: 'САМЫЙ БЫСТРЫЙ! Сверхзвуковой свин с турбонаддувом!'
    }
];

// ========== ЗАГРУЗКА И СОХРАНЕНИЕ ==========
function loadGame() {
    if (tg && tg.CloudStorage) {
        tg.CloudStorage.getItem('svintusDataV3', (error, value) => {
            if (!error && value) {
                try {
                    const parsed = JSON.parse(value);
                    gameData = { ...gameData, ...parsed };
                    if (gameData.currentEnergy > gameData.maxEnergy) {
                        gameData.currentEnergy = gameData.maxEnergy;
                    }
                    calculateOfflineEarnings();
                    updateUI();
                } catch (e) {}
            } else {
                loadFromLocal();
            }
        });
    } else {
        loadFromLocal();
    }
}

function loadFromLocal() {
    const saved = localStorage.getItem('svintusDataV3');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameData = { ...gameData, ...parsed };
            if (gameData.currentEnergy > gameData.maxEnergy) {
                gameData.currentEnergy = gameData.maxEnergy;
            }
            calculateOfflineEarnings();
        } catch (e) {}
    }
}

function saveGame() {
    localStorage.setItem('svintusDataV3', JSON.stringify(gameData));
    
    if (tg && tg.CloudStorage) {
        tg.CloudStorage.setItem('svintusDataV3', JSON.stringify(gameData));
    }
}

// ========== РАСЧЕТ ОФЛАЙН ЗАРАБОТКА ==========
function calculateOfflineEarnings() {
    const now = Date.now();
    const timeDiff = now - gameData.lastOfflineTime;
    const hoursPassed = timeDiff / (1000 * 60 * 60);
    
    if (hoursPassed > 0 && gameData.offlineEarning.rate > 0) {
        const earned = Math.floor(gameData.offlineEarning.rate * hoursPassed);
        if (earned > 0) {
            gameData.offlineCollected = earned;
        }
    }
    
    gameData.lastOfflineTime = now;
}

// ========== ЗАБРАТЬ ОФЛАЙН МОНЕТЫ ==========
function collectOfflineEarnings() {
    if (gameData.offlineCollected > 0) {
        gameData.coins += gameData.offlineCollected;
        
        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
        
        gameData.offlineCollected = 0;
        updateUI();
        saveGame();
    }
}

// ========== ЭЛЕМЕНТЫ ИНТЕРФЕЙСА ==========
const coinDisplay = document.getElementById('coinDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const energyFill = document.getElementById('energyFill');
const energyText = document.getElementById('energyText');
const tapMultiplierSpan = document.getElementById('tapMultiplier');
const tapButton = document.getElementById('tapButton');
const currentPigEmoji = document.getElementById('currentPigEmoji');
const upgradesList = document.getElementById('upgradesList');
const pigsList = document.getElementById('pigsList');
const activePigName = document.getElementById('activePigName');
const activePigEmoji = document.getElementById('activePigEmoji');
const telegramShareButton = document.getElementById('telegramShareButton');

const offlineRateDisplay = document.getElementById('offlineRateDisplay');
const offlineCollectContainer = document.getElementById('offlineCollectContainer');
const offlineAmount = document.getElementById('offlineAmount');
const collectOfflineButton = document.getElementById('collectOfflineButton');
const offlineLevelDesc = document.getElementById('offlineLevelDesc');
const offlinePrice = document.getElementById('offlinePrice');
const upgradeOfflineButton = document.getElementById('upgradeOfflineButton');

const statCoins = document.getElementById('statCoins');
const statLevel = document.getElementById('statLevel');
const statMultiplier = document.getElementById('statMultiplier');
const statMaxEnergy = document.getElementById('statMaxEnergy');
const statRegen = document.getElementById('statRegen');
const statTotalTaps = document.getElementById('statTotalTaps');
const statPigsCollected = document.getElementById('statPigsCollected');
const statOfflineRate = document.getElementById('statOfflineRate');

const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// ========== ОБНОВЛЕНИЕ UI ==========
function updateUI() {
    const activePig = pigsCollection[gameData.activePig];
    
    coinDisplay.textContent = Math.floor(gameData.coins);
    levelDisplay.textContent = `Уровень ${gameData.level}`;
    
    const energyPercent = (gameData.currentEnergy / gameData.maxEnergy) * 100;
    energyFill.style.width = `${energyPercent}%`;
    energyText.textContent = `${Math.floor(gameData.currentEnergy)} / ${gameData.maxEnergy}`;
    
    tapMultiplierSpan.textContent = `+${gameData.multiplier} за тап (-${activePig.energyCost} энергии)`;
    currentPigEmoji.textContent = activePig.emoji;

    offlineRateDisplay.textContent = `${gameData.offlineEarning.rate} монет/час`;
    offlineLevelDesc.textContent = `Ур. ${gameData.offlineEarning.level}: +${gameData.offlineEarning.rate} монет/час`;
    offlinePrice.textContent = gameData.offlineEarning.price;
    statOfflineRate.textContent = gameData.offlineEarning.rate;
    
    if (gameData.offlineCollected > 0) {
        offlineCollectContainer.style.display = 'flex';
        offlineAmount.textContent = Math.floor(gameData.offlineCollected);
    } else {
        offlineCollectContainer.style.display = 'none';
    }

    statCoins.textContent = Math.floor(gameData.coins);
    statLevel.textContent = gameData.level;
    statMultiplier.textContent = gameData.multiplier;
    statMaxEnergy.textContent = gameData.maxEnergy;
    statRegen.textContent = gameData.regenPerSec;
    statTotalTaps.textContent = gameData.totalTaps;
    
    const ownedCount = gameData.ownedPigs.filter(Boolean).length;
    statPigsCollected.textContent = `${ownedCount}/${pigsCollection.length}`;

    renderUpgrades();
    renderPigs();
    saveGame();
    
    updateTelegramMainButton();
}

// ========== ТЕЛЕГРАМ ФУНКЦИИ ==========
function updateTelegramMainButton() {
    if (tg) {
        if (gameData.coins > 0) {
            telegramShareButton.style.display = 'block';
        }
        
        if (gameData.coins > 1000) {
            tg.MainButton.setText(`🎉 У тебя ${Math.floor(gameData.coins)} монет!`);
            tg.MainButton.show();
        } else {
            tg.MainButton.hide();
        }
    }
}

function shareGame() {
    if (tg) {
        const activePig = pigsCollection[gameData.activePig];
        const ownedCount = gameData.ownedPigs.filter(Boolean).length;
        const message = `🐗 Я собрал ${Math.floor(gameData.coins)} монет в Свинтусе!\nАктивный свин: ${activePig.emoji} ${activePig.name}\nСобрал ${ownedCount}/13 свинов!\nТрачу ${activePig.energyCost} энергии за тап!\nПрисоединяйся!`;
        
        if (tg.shareURL) {
            tg.shareURL('https://t.me/your_bot_username', message);
        } else {
            tg.sendData(JSON.stringify({ action: 'share', coins: gameData.coins }));
        }
    } else {
        alert('Поделиться можно только в Telegram!');
    }
}

function hapticFeedback() {
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
}

// ========== ОБРАБОТКА ТАПА ==========
function handleTap(e) {
    e.preventDefault();
    const activePig = pigsCollection[gameData.activePig];
    const energyCost = activePig.energyCost; // Теперь трата энергии в 2 раза больше
    
    if (gameData.currentEnergy < energyCost) return;

    gameData.currentEnergy -= energyCost;
    gameData.coins += gameData.multiplier;
    gameData.totalTaps += 1;

    const requiredCoins = gameData.level * 100;
    if (gameData.coins >= requiredCoins) {
        gameData.level += 1;
    }

    hapticFeedback();
    updateUI();
}

// ========== СОБЫТИЯ ==========
tapButton.addEventListener('click', handleTap);
tapButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleTap(e);
});

telegramShareButton.addEventListener('click', shareGame);
collectOfflineButton.addEventListener('click', collectOfflineEarnings);

upgradeOfflineButton.addEventListener('click', () => {
    const price = gameData.offlineEarning.price;
    
    if (gameData.coins >= price) {
        gameData.coins -= price;
        gameData.offlineEarning.level += 1;
        gameData.offlineEarning.rate = gameData.offlineEarning.level * 25;
        gameData.offlineEarning.price = Math.floor(gameData.offlineEarning.basePrice * Math.pow(1.8, gameData.offlineEarning.level));
        
        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
        
        updateUI();
    }
});

setInterval(() => {
    if (gameData.currentEnergy < gameData.maxEnergy) {
        gameData.currentEnergy = Math.min(gameData.maxEnergy, gameData.currentEnergy + gameData.regenPerSec);
        updateUI();
    }
}, 1000);

// ========== УЛУЧШЕНИЯ ==========
const upgradesConfig = [
    {
        id: 'multiplier',
        name: '🐷 Множитель тапа',
        desc: '+1 монете за тап',
        effect: () => { gameData.multiplier += 1; },
        priceKey: 'multiplier'
    },
    {
        id: 'energy',
        name: '🔋 Запас энергии',
        desc: '+200 к макс. энергии',
        effect: () => { 
            gameData.maxEnergy += 200;
            gameData.currentEnergy += 200;
        },
        priceKey: 'energy'
    },
    {
        id: 'regen',
        name: '⚡ Регенерация',
        desc: '+1 энергия/сек',
        effect: () => { gameData.regenPerSec += 1; },
        priceKey: 'regen'
    }
];

function renderUpgrades() {
    upgradesList.innerHTML = '';
    upgradesConfig.forEach(cfg => {
        const upgrade = gameData.upgradeLevels[cfg.priceKey];
        const price = upgrade.price;
        const canBuy = gameData.coins >= price;

        const item = document.createElement('div');
        item.className = 'upgrade-item';
        item.innerHTML = `
            <div class="upgrade-info">
                <h4>${cfg.name}</h4>
                <p>${cfg.desc} (ур. ${upgrade.level})</p>
            </div>
            <div class="upgrade-price" data-id="${cfg.id}" style="opacity: ${canBuy ? 1 : 0.5}">
                🐷 ${price}
            </div>
        `;
        upgradesList.appendChild(item);
    });

    document.querySelectorAll('.upgrade-price').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            buyUpgrade(btn.dataset.id);
        });
    });
}

function buyUpgrade(id) {
    const cfg = upgradesConfig.find(u => u.id === id);
    if (!cfg) return;
    
    const upgrade = gameData.upgradeLevels[cfg.priceKey];
    const price = upgrade.price;

    if (gameData.coins >= price) {
        gameData.coins -= price;
        cfg.effect();
        upgrade.level += 1;
        upgrade.price = Math.floor(upgrade.basePrice * Math.pow(1.5, upgrade.level));
        
        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
        
        updateUI();
    }
}

// ========== СВИНЫ ==========
function renderPigs() {
    pigsList.innerHTML = '';
    
    pigsCollection.forEach((pig, index) => {
        const isOwned = gameData.ownedPigs[index];
        const isActive = gameData.activePig === index;
        const canBuy = gameData.coins >= pig.price && !isOwned;
        
        const item = document.createElement('div');
        item.className = `pig-item ${!isOwned ? 'locked' : ''} ${isActive ? 'active-pig' : ''}`;
        item.dataset.id = index;
        
        item.innerHTML = `
            <div class="pig-info">
                <h4>${pig.emoji} ${pig.name}</h4>
                <p><small>${pig.desc}</small></p>
                <p style="margin-top: 5px;">⚡ Множитель: +${pig.multiplier} | 🔋 Энергии: -${pig.energyCost}</p>
            </div>
            ${!isOwned ? 
                `<div class="pig-price" style="opacity: ${canBuy ? 1 : 0.5}">🐷 ${pig.price.toLocaleString()}</div>` : 
                `<div class="pig-price" style="background: #4a6b4a; border-color: #7fb07f;">✅ В коллекции</div>`
            }
        `;
        
        pigsList.appendChild(item);
    });

    document.querySelectorAll('.pig-item').forEach(item => {
        item.addEventListener('click', () => {
            const pigId = parseInt(item.dataset.id);
            handlePigClick(pigId);
        });
    });
}

function handlePigClick(pigId) {
    const pig = pigsCollection[pigId];
    
    if (gameData.ownedPigs[pigId]) {
        gameData.activePig = pigId;
        gameData.multiplier = pig.multiplier;
        activePigName.textContent = pig.name;
        activePigEmoji.textContent = pig.emoji;
        
        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.selectionChanged();
        }
        
        updateUI();
    } else {
        if (gameData.coins >= pig.price) {
            gameData.coins -= pig.price;
            gameData.ownedPigs[pigId] = true;
            gameData.activePig = pigId;
            gameData.multiplier = pig.multiplier;
            activePigName.textContent = pig.name;
            activePigEmoji.textContent = pig.emoji;
            
            if (tg && tg.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('success');
            }
            
            updateUI();
        }
    }
}

// ========== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ==========
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(`${tabId}Tab`).classList.add('active');
        
        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.selectionChanged();
        }
    });
});

// ========== ИНИЦИАЛИЗАЦИЯ ==========
if (tg) {
    const user = tg.initDataUnsafe?.user;
    if (user) {
        console.log(`Привет, ${user.first_name} ${user.last_name || ''}!`);
    }
}

setInterval(saveGame, 5000);

window.addEventListener('beforeunload', () => {
    gameData.lastOfflineTime = Date.now();
    saveGame();
});

const startPig = pigsCollection[gameData.activePig];
activePigName.textContent = startPig.name;
activePigEmoji.textContent = startPig.emoji;

loadGame();
updateUI();