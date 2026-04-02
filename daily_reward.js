// --- START OF FILE daily_reward.js ---

const DAILY_REWARDS = [
    { day: 1, type: 'coin', amount: 500, img: './coin_icon.png' },
    { day: 2, type: 'coin', amount: 1000, img: './coin_icon.png' },
    { day: 3, type: 'coin', amount: 1500, img: './coin_icon.png' },
    { day: 4, type: 'coin', amount: 2000, img: './coin_icon.png' },
    { day: 5, type: 'coin', amount: 3000, img: './coin_icon.png' },
    { day: 6, type: 'coin', amount: 4500, img: './coin_icon.png' },
    { day: 7, type: 'frame', name: 'Premium Frame', img: './daily_frame.svg', id: 'dr_frame_1' } 
];

let currentStreak = 0;
let canClaimToday = false;
let todayString = "";

function getRewardDateString() {
    let now = new Date();
    let pktTime = new Date(now.getTime() + (5 * 60 * 60 * 1000) + (new Date().getTimezoneOffset() * 60000));
    pktTime.setHours(pktTime.getHours() - 5); 
    return pktTime.toISOString().split('T')[0];
}

function initDailyReward() {
    if (!window.currentUser) return;
    todayString = getRewardDateString();
    const drRef = window.ref(window.db, `users/${window.currentUser.uid}/dailyReward`);
    
    window.onValue(drRef, (snap) => {
        const data = snap.val() || {};
        currentStreak = data.streak || 0;
        let lastClaim = data.lastClaimDate || "";

        if (currentStreak >= 7 && lastClaim !== todayString) { currentStreak = 0; }
        
        canClaimToday = (lastClaim !== todayString);

        if (canClaimToday && !sessionStorage.getItem('dailyPopupShown')) {
            sessionStorage.setItem('dailyPopupShown', 'true');
            setTimeout(() => { openDailyRewardModal(); }, 1500); 
        }

        const dot = document.getElementById('daily-reward-dot');
        const icon = document.querySelector('#daily-reward-btn img');
        if (dot) {
            if (canClaimToday) {
                dot.classList.remove('hidden');
                if(icon) icon.classList.add('animate-bounce'); 
            } else {
                dot.classList.add('hidden');
                if(icon) icon.classList.remove('animate-bounce');
            }
        }
    });
}

window.openDailyRewardModal = () => {
    buildRewardGrid();
    document.getElementById('dr-view-main').classList.remove('hidden');
    document.getElementById('dr-view-main').classList.add('flex');
    document.getElementById('dr-view-success').classList.add('hidden');
    document.getElementById('dr-view-success').classList.remove('flex');

    const modal = document.getElementById('daily-reward-modal');
    const content = document.getElementById('dr-modal-content');
    const ribbon = document.getElementById('dr-header-ribbon');
    
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
        if(ribbon) { ribbon.classList.remove('scale-50', 'opacity-0'); ribbon.classList.add('scale-100', 'opacity-100'); }
    }, 10);
};

window.closeDailyRewardModal = () => {
    const modal = document.getElementById('daily-reward-modal');
    const content = document.getElementById('dr-modal-content');
    const ribbon = document.getElementById('dr-header-ribbon');
    
    modal.classList.add('opacity-0');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    if(ribbon) { ribbon.classList.remove('scale-100', 'opacity-100'); ribbon.classList.add('scale-50', 'opacity-0'); }
    
    setTimeout(() => { modal.classList.add('hidden'); modal.style.display = 'none'; }, 300);
};

function buildRewardGrid() {
    const grid = document.getElementById('dr-grid');
    grid.innerHTML = '';

    DAILY_REWARDS.forEach((reward, index) => {
        let isClaimed = index < currentStreak;
        let isToday = (index === currentStreak && canClaimToday);
        let isDay7 = reward.day === 7;
        
        let colSpan = isDay7 ? "col-span-2" : "col-span-1";
        
        // Default 3D Box Style (Locked)
        let boxStyle = "bg-[#251240] border-b-4 border-[#150a21] shadow-inner opacity-70 grayscale";
        let extraClasses = "";
        let contentHTML = "";

        // اگر تصویر لوڈ نہ ہو تو یہ خوبصورت 3D آئیکن دکھے گا
        let defaultIcon = isDay7 
            ? `<div class="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-[0_5px_10px_rgba(0,0,0,0.5)] mb-1"><i class="fa-solid fa-image text-white text-xl"></i></div>`
            : `<div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white shadow-[0_5px_10px_rgba(0,0,0,0.5)] mb-1"><i class="fa-solid fa-coins text-white text-sm"></i></div>`;
            
        let imgHtml = `<img src="${reward.img}" class="w-8 h-8 object-contain mb-1 drop-shadow-md" style="display:none;" onload="this.style.display='block'; this.previousElementSibling.style.display='none';">`;

        // 1. اگر کلیم ہو چکا ہے (Claimed)
        if (isClaimed) {
            boxStyle = "bg-[#1f2937] border border-green-500/50 shadow-inner opacity-50 grayscale";
            contentHTML = `
                <div class="absolute top-0 left-0 bg-gray-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-br-lg rounded-tl-lg z-10">${reward.day}</div>
                <div class="w-full h-full flex flex-col items-center justify-center">
                    ${defaultIcon}${imgHtml}
                    <span class="text-gray-400 text-[11px] font-bold">Claimed</span>
                </div>
                <!-- بڑا سبز ٹک -->
                <div class="absolute inset-0 flex items-center justify-center z-20">
                    <div class="w-10 h-10 bg-green-500 rounded-full border-4 border-[#150a21] flex items-center justify-center shadow-lg">
                        <i class="fa-solid fa-check text-white text-xl"></i>
                    </div>
                </div>
            `;
        } 
        // 2. اگر آج کلیم کرنا ہے (Active / Today)
        else if (isToday) {
            boxStyle = "bg-gradient-to-b from-[#6b21a8] to-[#4c1d95] border-b-4 border-yellow-400 shadow-[0_10px_20px_rgba(250,204,21,0.4)]";
            extraClasses = "active-3d-box ring-2 ring-yellow-400"; 
            
            let btnText = isDay7 ? "REVEAL" : "CLAIM";
            
            contentHTML = `
                <div class="absolute top-0 left-0 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-br-lg rounded-tl-lg z-10 animate-pulse">TODAY</div>
                <div class="w-full h-full flex flex-col items-center justify-center pt-2" onclick="executeClaimDaily()">
                    ${defaultIcon}${imgHtml}
                    <!-- یہاں ڈبے کے اندر کلیم کا بٹن ہے -->
                    <div class="mt-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-md uppercase tracking-wider">${btnText}</div>
                </div>
            `;
        }
        // 3. اگر آنے والے دن ہیں (Locked)
        else {
            let amountText = isDay7 ? `<span class="text-purple-300 text-[11px] font-bold mt-1">Surprise</span>` : `<span class="text-gray-400 text-[12px] font-bold mt-1">+${reward.amount}</span>`;
            contentHTML = `
                <div class="absolute top-0 left-0 bg-gray-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded-br-lg rounded-tl-lg z-10">${reward.day}</div>
                <div class="w-full h-full flex flex-col items-center justify-center opacity-50">
                    ${defaultIcon}${imgHtml}
                    ${amountText}
                </div>
            `;
        }

        // 7ویں دن کا لے آؤٹ اگر کلیم نہیں ہوا
        if (isDay7 && !isClaimed && !isToday) {
            contentHTML = `
                <div class="absolute top-0 left-0 bg-purple-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded-br-lg rounded-tl-lg z-10">${reward.day}</div>
                <div class="w-full h-full flex flex-row items-center justify-center gap-3">
                    <i class="fa-solid fa-gift text-yellow-500 text-3xl drop-shadow-lg animate-pulse"></i>
                    <div class="flex flex-col">
                        <span class="text-yellow-400 font-black text-sm tracking-widest">MYSTERY</span>
                        <span class="text-white text-[10px] font-bold">Premium Frame</span>
                    </div>
                </div>
            `;
        } else if (isDay7 && isToday) {
            // 7ویں دن کا ایکٹیو لے آؤٹ
            contentHTML = `
                <div class="absolute top-0 left-0 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-br-lg rounded-tl-lg z-10 animate-pulse">TODAY</div>
                <div class="w-full h-full flex flex-row items-center justify-center gap-3 cursor-pointer" onclick="executeClaimDaily()">
                    <i class="fa-solid fa-gift text-white text-4xl drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-bounce"></i>
                    <div class="flex flex-col items-center">
                        <span class="text-yellow-400 font-black text-sm tracking-widest">CLAIM NOW</span>
                    </div>
                </div>
            `;
        }

        grid.innerHTML += `
            <div class="${colSpan} h-[90px] rounded-2xl relative overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ${boxStyle} ${extraClasses}">
                ${contentHTML}
            </div>
        `;
    });

    const mainBtn = document.getElementById('dr-main-btn');
    if (canClaimToday) {
        mainBtn.innerText = "CLAIM REWARD";
        mainBtn.classList.remove('opacity-50', 'pointer-events-none', 'grayscale');
        mainBtn.classList.add('animate-pulse');
    } else {
        mainBtn.innerText = "Come back tomorrow";
        mainBtn.classList.add('opacity-50', 'pointer-events-none', 'grayscale');
        mainBtn.classList.remove('animate-pulse');
    }
}

window.executeClaimDaily = async () => {
    if (!canClaimToday) return;

    canClaimToday = false; 
    document.getElementById('dr-main-btn').innerText = "Processing...";

    const rewardIndex = currentStreak;
    const reward = DAILY_REWARDS[rewardIndex];
    const uid = window.currentUser.uid;
    
    let updates = { streak: currentStreak + 1, lastClaimDate: todayString };

    try {
        let successTitle = "";
        let successImg = reward.img; // اگر تصویر موجود نہ ہوئی تو نیچے Fallback یوز ہوگا

        if (reward.type === 'coin') {
            const userRef = window.ref(window.db, `users/${uid}`);
            const snap = await window.get(userRef);
            let currentCoins = snap.val().coins || 0;
            await window.update(userRef, { coins: currentCoins + reward.amount });
            successTitle = `+${reward.amount} Coins`;
        } 
        else if (reward.type === 'frame') {
            const uniqueId = reward.id + '_' + Date.now();
            const frameData = {
                name: reward.name,
                img: reward.img,
                purchasedAt: Date.now(),
                expiry: Date.now() + (7 * 24 * 60 * 60 * 1000), 
                status: 'active'
            };
            await window.update(window.ref(window.db, `users/${uid}/unlockedFrames/${uniqueId}`), frameData);
            await window.update(window.ref(window.db, `users/${uid}`), { currentFrame: reward.img });
            successTitle = `Premium Frame!`;
        }

        await window.update(window.ref(window.db, `users/${uid}/dailyReward`), updates);
        currentStreak++;

        // سیکنڈ سکرین دکھانے کا لاجک
        let successImgEl = document.getElementById('dr-success-img');
        successImgEl.src = successImg;
        // اگر تصویر لوڈ نہ ہو تو CSS کے ذریعے آئیکن دکھائیں
        successImgEl.onerror = function() {
            this.style.display = 'none';
            this.insertAdjacentHTML('afterend', `<i class="fa-solid fa-gift text-yellow-400 text-[100px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] z-20 absolute"></i>`);
        };

        document.getElementById('dr-success-title').innerText = successTitle;

        document.getElementById('dr-view-main').classList.add('hidden');
        document.getElementById('dr-view-main').classList.remove('flex');
        
        document.getElementById('dr-view-success').classList.remove('hidden');
        document.getElementById('dr-view-success').classList.add('flex');
        
    } catch(e) {
        console.log("Claim Error: ", e);
        canClaimToday = true; 
        document.getElementById('dr-main-btn').innerText = "CLAIM REWARD";
        if(window.showNotice) window.showNotice(`⚠️ Error claiming reward.`);
    }
};

setTimeout(() => {
    if (window.currentUser) initDailyReward();
}, 1000);

// --- END OF FILE daily_reward.js ---