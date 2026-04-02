// ==========================================
// LUCKY FRUIT GAME SYSTEM (EXTERNAL MODULE)
// ==========================================

window.gameTimer = 30;
window.isSpinning = false;
window.currentBet = 10000;
window.activeBets = {}; 

const ODDS = { 0: 5, 1: 5, 2: 5, 3: 5, 4: 0, 5: 0, 6: 10, 7: 15, 8: 25, 9: 45 };
const spinPath = [0, 1, 2, 3, 5, 9, 8, 7, 6, 4]; 

const ROUND_DURATION = 40; 
const BET_TIME = 30;
window.currentRoundId = 0;
window.resultHistory = []; 
window.detailedBetHistory = [];

// پھلوں کی تصویریں لانے کا فنکشن (ہسٹری کے لیے)
function getFruitImageById(id) {
    const imgs = {
        0: './orange.png', 1: './lemon.png', 2: './grapes.png', 3: './cherry.png',
        4: './small_bonus.png', 5: './big_bonus.png', 6: './apple.png',
        7: './melon.png', 8: './mango.png', 9: './berry.png'
    };
    return imgs[id] || './orange.png';
}

function getDeterministicWinner(roundId) {
    let hash = Math.sin(roundId) * 10000;
    let rand = hash - Math.floor(hash);
    
    // یوزر کی مرضی کی پرسنٹیج: 
    // دن میں ٹوٹل 2160 راؤنڈز ہوتے ہیں۔
    // 45x(id 9) = 30 بار (Weight: 138)
    // 25x(id 8) = 20 بار (Weight: 92)
    // 15x(id 7) = 60 بار (Weight: 277)
    // 10x(id 6) = 150 بار (Weight: 694)
    // Lucky(id 4,5) = 10 بار ٹوٹل (Weight: 23, 23)
    // باقی ماندہ 5x میں برابر تقسیم (Weight: 2188 each)
    const items =[
        {id: 9, weight: 138},
        {id: 8, weight: 92},
        {id: 7, weight: 277},
        {id: 6, weight: 694},
        {id: 4, weight: 23},
        {id: 5, weight: 23},
        {id: 0, weight: 2188},
        {id: 1, weight: 2188},
        {id: 2, weight: 2188},
        {id: 3, weight: 2189}
    ];

    let cumulative = 0;
    let randWeight = rand * 10000;
    let selectedId = 0;

    for (let i = 0; i < items.length; i++) {
        cumulative += items[i].weight;
        if (randWeight <= cumulative) {
            selectedId = items[i].id;
            break;
        }
    }

    return spinPath.indexOf(selectedId);
}

// آٹو ہسٹری جنریٹر (گیم بند کر کے کھولنے پر بھی رزلٹ شو ہوگا)
function generateGlobalHistory() {
    window.resultHistory = [];
    let now = Math.floor(Date.now() / 1000);
    let currentRoundStart = now - (now % ROUND_DURATION);
    
    for(let i=1; i<=8; i++) {
        let pastRoundId = currentRoundStart - (i * ROUND_DURATION);
        let winningPathIndex = getDeterministicWinner(pastRoundId);
        let fruitId = spinPath[winningPathIndex];
        window.resultHistory.push(getFruitImageById(fruitId));
    }
    updateHistoryStripUI();
}

// گیم کھلتے ہی پچھلے 8 رزلٹس آٹو لوڈ کر دو
setTimeout(generateGlobalHistory, 1000);

setInterval(() => {
    if (!window.currentUser) return;
    let now = Math.floor(Date.now() / 1000);
    let roundStart = now - (now % ROUND_DURATION);
    let newRoundId = roundStart;
    let elapsed = now - roundStart;

    if (window.currentRoundId !== newRoundId) {
        window.currentRoundId = newRoundId;
        resetGameLocally();
    }

    if (elapsed < BET_TIME) {
        window.isSpinning = false;
        let timeLeft = BET_TIME - elapsed;
        if(document.getElementById('game-timer')) {
            document.getElementById('game-timer').innerText = timeLeft;
        }
    } else if (elapsed === BET_TIME) {
        if(!window.isSpinning) {
            window.isSpinning = true;
            if(document.getElementById('game-timer')) document.getElementById('game-timer').innerText = "0";
            let winningPathIndex = getDeterministicWinner(window.currentRoundId);
            spinWheelSequential(winningPathIndex);
        }
    }
}, 1000);

window.openGame = () => {
    document.getElementById('game-modal').style.display = 'flex';
    if(document.getElementById('game-balance')) { 
        document.getElementById('game-balance').innerText = (window.currentCoins || 0).toLocaleString(); 
    }
    
    let today = new Date().toLocaleDateString();
    let savedData = JSON.parse(localStorage.getItem('luckyFruitWinnings') || '{"date":"","amount":0}');
    if (savedData.date !== today) { savedData.amount = 0; }
    let displayEl = document.getElementById('game-today-win');
    if(displayEl) displayEl.innerText = savedData.amount.toLocaleString();
};

window.closeGame = () => { 
    document.getElementById('game-modal').style.display = 'none'; 
};

window.selectChip = (amt, btn) => { 
    window.currentBet = amt; 
    document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('selected')); 
    btn.classList.add('selected'); 
};

// یہ فنکشن اماؤنٹ کو شارٹ کر کے بیٹ کے اوپر لکھے گا تاکہ ڈیزائن خراب نہ ہو (مثال: 5M)
function formatShortBet(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num;
}

window.placeBet = (index) => {
    if(window.isSpinning) return Swal.fire({toast:true, icon:'warning', title:'Wait for the next round!', position:'top', showConfirmButton:false, timer:1500});
    if(index === 4 || index === 5) return; 
    
    // اگر کوائنز کم ہیں تو خوبصورت ریچارج پاپ اپ شو کریں
    if((window.currentCoins || 0) < window.currentBet) { 
        Swal.fire({
            html: '<div class="text-[#a16207] font-bold text-lg mt-2 mb-4 leading-relaxed">Insufficient gold coins, please<br>recharge first.</div>',
            showCancelButton: true,
            confirmButtonText: 'Recharge',
            cancelButtonText: 'Cancel',
            customClass: {
                popup: 'bg-gradient-to-b from-[#fef3c7] to-[#fde68a] rounded-3xl border-2 border-[#f59e0b]',
                confirmButton: 'bg-[#7c3aed] text-white rounded-full px-8 py-2.5 font-black text-sm tracking-wider shadow-lg active:scale-95 transition-transform mx-2',
                cancelButton: 'bg-[#d1d5db] text-gray-700 rounded-full px-8 py-2.5 font-black text-sm tracking-wider shadow-md active:scale-95 transition-transform mx-2'
            },
            buttonsStyling: false,
            width: '320px',
            backdrop: 'rgba(0,0,0,0.6)'
        }).then((result) => {
            if (result.isConfirmed) {
                window.closeGame(); // گیم بند کریں
                if(typeof window.openRechargeModal === 'function') {
                    window.openRechargeModal(); // ریچارج پیج اوپن کریں
                }
            }
        });
        return; 
    }
    
    // کوائنز کاٹنا اور بیٹ لگانا
    window.currentCoins -= window.currentBet;
    window.update(window.ref(window.db, `users/${window.currentUser.uid}`), { coins: window.currentCoins });
    
    if(!window.activeBets[index]) window.activeBets[index] = 0;
    window.activeBets[index] += window.currentBet;
    
    const betBadge = document.getElementById(`bet-${index}`);
    if(betBadge) betBadge.innerText = formatShortBet(window.activeBets[index]);
    
    if(document.getElementById('game-balance')) { 
        document.getElementById('game-balance').innerText = window.currentCoins.toLocaleString(); 
    }
};

function resetGameLocally() {
    window.activeBets = {};
    document.querySelectorAll('.bet-overlay').forEach(el => el.innerText = '');
    if(document.getElementById('game-win')) document.getElementById('game-win').innerText = "0";
    document.querySelectorAll('.fruit-item').forEach(el => el.classList.remove('active'));
    const overlay = document.getElementById('game-result-overlay');
    if(overlay) {
        overlay.classList.replace('scale-100', 'scale-0');
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
    }
}

function spinWheelSequential(finalResultPathIndex) {
    const resultFruitId = spinPath[finalResultPathIndex]; 
    const totalSteps = (3 * spinPath.length) + finalResultPathIndex;
    let currentStep = 0;
    let currentPathIndex = 0;

    function step() {
        document.querySelectorAll('.fruit-item').forEach(el => el.classList.remove('active'));
        const activeFruitId = spinPath[currentPathIndex];
        const el = document.getElementById(`f-${activeFruitId}`);
        if(el) el.classList.add('active');

        currentStep++;
        currentPathIndex = (currentPathIndex + 1) % spinPath.length;

        if (currentStep <= totalSteps) {
            let nextDelay = 50; 
            if (totalSteps - currentStep < 10) nextDelay = 100;
            if (totalSteps - currentStep < 5) nextDelay = 250;
            if (totalSteps - currentStep < 2) nextDelay = 400;
            setTimeout(step, nextDelay);
        } else {
            setTimeout(() => finalizeResult(resultFruitId), 500);
        }
    }
    step();
}

function finalizeResult(winningFruitId) {
    let winAmount = 0;
    let totalBetThisRound = 0;
    
    for(let key in window.activeBets) { totalBetThisRound += window.activeBets[key]; }

    if (winningFruitId === 4 || winningFruitId === 5) {
        let totalBonusBets = (window.activeBets[4]||0) + (window.activeBets[5]||0);
        winAmount = totalBonusBets * 5; 
    } else {
        const multiplier = ODDS[winningFruitId] || 0;
        if(window.activeBets[winningFruitId]) {
            winAmount = window.activeBets[winningFruitId] * multiplier;
        }
    }

    const winningImgElement = document.querySelector(`#f-${winningFruitId} img`);
    const winningImgSrc = winningImgElement ? winningImgElement.src : 'https://placehold.co/100?text=Win';

    if(winningImgSrc) {
        window.resultHistory.unshift(winningImgSrc);
        if(window.resultHistory.length > 8) window.resultHistory.pop();
        updateHistoryStripUI();
    }

    if(totalBetThisRound > 0) {
        const timeNow = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const roundId = Math.floor(1000 + Math.random() * 9000);
        
        let selectedFruitsArray =[];
        for(let key in window.activeBets) {
            let betImgElement = document.querySelector(`#f-${key} img`);
            let betImgSrc = betImgElement ? betImgElement.src : '';
            selectedFruitsArray.push({ img: betImgSrc, amount: window.activeBets[key] });
        }

        window.detailedBetHistory.unshift({
            round: roundId,
            time: timeNow,
            selected: selectedFruitsArray,
            winImg: winningImgSrc,
            totalWin: winAmount,
            status: winAmount > 0 ? 'WIN' : 'LOSE'
        });
        
        if(window.detailedBetHistory.length > 20) window.detailedBetHistory.pop(); 
    }

    const popup = document.getElementById('new-result-popup');
    const popupImg = document.getElementById('popup-fruit-img');
    const popupText = document.getElementById('popup-text');
    const popupCircle = document.getElementById('popup-circle');
    const popupAmount = document.getElementById('popup-amount');

    if(popup) {
        if(popupImg) popupImg.src = winningImgSrc;
        if(popupCircle) popupCircle.classList.remove('hidden');
        if(popupAmount) popupAmount.classList.add('hidden');

        if(winAmount > 0) {
            window.currentCoins += winAmount;
            window.update(window.ref(window.db, `users/${window.currentUser.uid}`), { coins: window.currentCoins });
            
            let savedData = JSON.parse(localStorage.getItem('luckyFruitWinnings') || '{"date":"","amount":0}');
            savedData.amount += winAmount;
            localStorage.setItem('luckyFruitWinnings', JSON.stringify(savedData));

            let gameBalanceEl = document.getElementById('game-balance');
            if(gameBalanceEl) gameBalanceEl.innerText = window.currentCoins.toLocaleString();
            
            let todayWinEl = document.getElementById('game-today-win');
            if(todayWinEl) todayWinEl.innerText = savedData.amount.toLocaleString();
            
            if(popupText) popupText.innerText = "Congratulations! You won";
            if(popupCircle) popupCircle.classList.add('hidden');
            if(popupAmount) {
                popupAmount.classList.remove('hidden');
                popupAmount.innerText = winAmount.toLocaleString();
            }
            
            if(typeof window.broadcastWin === "function"){
                window.broadcastWin(window.currentUser.displayName, winAmount, window.currentUser.photoURL);
            }
        } else if (totalBetThisRound > 0) {
            if(popupText) popupText.innerText = "You didn't win this round";
            if(popupCircle) popupCircle.innerText = "!";
        } else {
            if(popupText) popupText.innerText = "You didn't participate this round";
            if(popupCircle) popupCircle.innerText = "!";
        }

        popup.style.display = 'flex';
        setTimeout(() => { popup.style.display = 'none'; }, 4000);
    }
}

window.openGameHistory = () => {
    const listContainer = document.getElementById('game-history-list');
    if(!listContainer) return;
    listContainer.innerHTML = '';
    
    if(window.detailedBetHistory.length === 0) {
        listContainer.innerHTML = '<div class="text-center text-gray-500 mt-10 text-xs">No betting history yet.</div>';
    } else {
        window.detailedBetHistory.forEach(item => {
            const isWin = item.status === 'WIN';
            
            let betsHtml = '';
            item.selected.forEach(bet => {
                betsHtml += `<div class="flex items-center bg-[#5c2e0b] rounded px-2 py-1 shadow-inner border border-[#8b4513]">
                    <img src="${bet.img}" class="w-5 h-5 object-contain mr-1">
                    <span class="text-yellow-200 text-xs font-bold">${formatShortBet(bet.amount)}</span>
                </div>`;
            });

            listContainer.innerHTML += `
                <div class="relative bg-gradient-to-b from-[#b35e22] to-[#8b4513] p-4 rounded-xl mb-3 shadow-lg overflow-hidden border border-[#d2691e]">
                    <div class="flex justify-between items-center text-white font-bold mb-3 border-b border-white/20 pb-2">
                        <span class="text-sm">Round: ${item.round}</span>
                        <span class="text-[10px] font-normal opacity-80">${item.time}</span>
                    </div>
                    <div class="flex mb-3">
                        <span class="text-white/70 text-xs w-24 flex-shrink-0 pt-1">Selected fruits:</span>
                        <div class="flex flex-wrap gap-2 flex-1">${betsHtml}</div>
                    </div>
                    <div class="flex items-center mb-3">
                        <span class="text-white/70 text-xs w-24 flex-shrink-0">Winning fruits:</span>
                        <img src="${item.winImg}" class="w-8 h-8 drop-shadow-md">
                    </div>
                    <div class="flex items-center relative z-10">
                        <span class="text-white/70 text-xs w-24 flex-shrink-0">Win coins:</span>
                        <span class="text-yellow-300 font-bold text-sm">🪙 ${item.totalWin.toLocaleString()}</span>
                    </div>
                    <div class="absolute -bottom-6 -right-6 w-28 h-28 border-[4px] ${isWin ? 'border-green-400 text-green-400' : 'border-gray-300 text-gray-300'} opacity-30 rounded-full flex items-center justify-center -rotate-12 pointer-events-none">
                        <div class="border-[2px] ${isWin ? 'border-green-400' : 'border-gray-300'} w-[90%] h-[90%] rounded-full flex items-center justify-center">
                            <span class="font-black text-2xl uppercase tracking-widest">${item.status}</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    document.getElementById('game-history-modal').classList.remove('hidden');
    document.getElementById('game-history-modal').classList.add('flex');
};

window.closeGameHistory = () => {
    const histModal = document.getElementById('game-history-modal');
    if(histModal) {
        histModal.classList.add('hidden');
        histModal.classList.remove('flex');
    }
};

function updateHistoryStripUI() {
    const strip = document.getElementById('game-history-strip');
    if(!strip) return;
    strip.innerHTML = '<span class="history-label">Results:</span>';
    window.resultHistory.forEach((src, index) => {
        if(index === 0) {
            strip.innerHTML += `<div class="history-item newest"><img src="${src}"><div class="new-tag">new</div></div>`;
        } else {
            strip.innerHTML += `<div class="history-item"><img src="${src}"></div>`;
        }
    });
}

setInterval(() => {
    if(document.getElementById('round-number-display') && window.currentRoundId > 0) {
        let roundNum = Math.floor((Date.now() % 86400000) / 40000);
        document.getElementById('round-number-display').innerText = "Round " + roundNum + " of today";
    }
}, 1000);