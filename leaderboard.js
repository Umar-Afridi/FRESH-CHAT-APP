// ==========================================
// LEADERBOARD, HOME TOP 3 (ANIMATED) & TIME RESET LOGIC
// ==========================================

// 1. Time Logic (12 AM to 5 AM Dead Zone & PKT Time)
window.getLeaderboardTimeKeys = () => {
    let now = new Date();
    let pktTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (5 * 60 * 60 * 1000));
    let hour = pktTime.getHours();

    // 🔥 5 AM Reset Fix: اب گفٹ ضائع نہیں ہوں گے۔ 12 سے 5 تک کل کا دن کاؤنٹ ہوگا!
    let targetDate = new Date(pktTime);
    if (hour >= 0 && hour < 5) {
        targetDate.setDate(targetDate.getDate() - 1);
    }
    let dailyStr = targetDate.getFullYear() + '-' + String(targetDate.getMonth() + 1).padStart(2, '0') + '-' + String(targetDate.getDate()).padStart(2, '0');

    // Weekly and Monthly keys
    let weekStr = pktTime.getFullYear() + '-W' + Math.ceil(pktTime.getDate() / 7);
    let monthStr = pktTime.getFullYear() + '-' + String(pktTime.getMonth() + 1).padStart(2, '0');

    return { daily: dailyStr, weekly: weekStr, monthly: monthStr };
};

let currentLbMainTab = 0;
let currentLbSubTab = 'daily';

window.openLeaderboard = async (tabIndex = 0) => {
    document.getElementById('leaderboard-modal').style.display = 'flex';
    document.getElementById('my-rank-dp').src = window.currentUser.photoURL || 'https://placehold.co/100';
    document.getElementById('my-rank-name').innerText = window.currentUser.displayName || 'User';
    switchMainTab(tabIndex);
};

window.closeLeaderboard = () => { document.getElementById('leaderboard-modal').style.display = 'none'; };

window.switchMainTab = (index) => {
    currentLbMainTab = index;
    document.querySelectorAll('.lb-m-tab').forEach((t, i) => {
        if(i === index) t.classList.add('active'); else t.classList.remove('active');
    });
    fetchAllLeaderboardsVIP();
};

window.switchSubTab = (type) => {
    currentLbSubTab = type;
    document.querySelectorAll('.lb-s-tab').forEach(t => {
        if(t.innerText.toLowerCase() === type) t.classList.add('active'); else t.classList.remove('active');
    });
    fetchAllLeaderboardsVIP();
};

// 2. Fetch Leaderboard Data inside Modal
async function fetchAllLeaderboardsVIP() {
    const contentArea = document.getElementById('lb-content-area');
    
    if(contentArea.innerHTML.trim() === '') {
        contentArea.innerHTML = '<div class="flex justify-center mt-20"><i class="fa-solid fa-spinner fa-spin text-yellow-400 text-3xl"></i></div>';
    }

    const usersSnap = await window.get(window.ref(window.db, 'users'));
    const roomsSnap = await window.get(window.ref(window.db, 'rooms'));
    
    let uArr = [], rArr =[];
    let timeKeys = window.getLeaderboardTimeKeys();
    let timeKeyStr = timeKeys[currentLbSubTab]; 

    // اپنے یوزر کا ملک نکالیں
    let myC = window.myUserCountry || "Unknown";

    if(usersSnap.exists()) {
        usersSnap.forEach(s => { 
            let u = s.val(); u.uid = s.key;
            
            // 🔥🔥 STRICT LOCATION ISOLATION LOGIC 🔥🔥
            let uCountry = u.country || "Unknown";
            // اگر یوزر ایڈمن نہیں ہے، اور اس کا ملک میرے ملک سے نہیں ملتا، تو فوری سکپ کریں
            if (!window.currentUserIsOfficial && uCountry !== myC) {
                return; 
            }

            let uDailyMatch = (u.lastGiftDate === timeKeys.daily);
            let uWeeklyMatch = (u.lastGiftWeek === timeKeys.weekly);
            let uMonthlyMatch = (u.lastGiftMonth === timeKeys.monthly);

            u.exp_score = currentLbSubTab === 'daily' ? (uDailyMatch ? (Number(u.userExp_daily) || 0) : 0) : 
                          currentLbSubTab === 'weekly' ? (uWeeklyMatch ? (Number(u.userExp_weekly) || 0) : 0) : 
                          (uMonthlyMatch ? (Number(u.userExp_monthly) || 0) : 0);

            u.charm_score = currentLbSubTab === 'daily' ? (uDailyMatch ? (Number(u.charm_daily) || 0) : 0) : 
                            currentLbSubTab === 'weekly' ? (uWeeklyMatch ? (Number(u.charm_weekly) || 0) : 0) : 
                            (uMonthlyMatch ? (Number(u.charm_monthly) || 0) : 0);
                            
            uArr.push(u); 
        });
    }
    
    if(roomsSnap.exists()) {
        roomsSnap.forEach(s => { 
            let r = s.val(); r.id = s.key;
            
            // 🔥🔥 ROOMS COUNTRY FILTER 🔥🔥
            // ہم چیک کریں گے کہ کیا کمرے کا مالک ہماری اوپر والی (فلٹر شدہ) لسٹ میں موجود ہے یا نہیں
            let isOwnerInMyCountry = uArr.some(usr => usr.uid === r.owner);
            if (!window.currentUserIsOfficial && !isOwnerInMyCountry) {
                return; // اگر کمرے کا مالک میرے ملک کا نہیں ہے تو روم لیڈر بورڈ میں شو نہ کرو
            }

            let rDailyMatch = (r.lastGiftDate === timeKeys.daily);
            let rWeeklyMatch = (r.lastGiftWeek === timeKeys.weekly);
            let rMonthlyMatch = (r.lastGiftMonth === timeKeys.monthly);

            r.wealth_score = currentLbSubTab === 'daily' ? (rDailyMatch ? (Number(r.wealth_daily) || 0) : 0) : 
                             currentLbSubTab === 'weekly' ? (rWeeklyMatch ? (Number(r.wealth_weekly) || 0) : 0) : 
                             (rMonthlyMatch ? (Number(r.wealth_monthly) || 0) : 0);

            rArr.push(r); 
        });
    }

    let sortedData =[]; let icon = '🪙'; let myScore = 0; let myRank = "No ranking";

    if (currentLbMainTab === 0) {
        sortedData = [...uArr].sort((a,b) => b.exp_score - a.exp_score); icon = '🪙';
        let me = sortedData.findIndex(u => u.uid === window.currentUser.uid);
        if(me !== -1 && sortedData[me].exp_score > 0) { myRank = me + 1; myScore = sortedData[me].exp_score; }
    } else if (currentLbMainTab === 1) {
        sortedData =[...uArr].sort((a,b) => b.charm_score - a.charm_score); icon = '💎';
        let me = sortedData.findIndex(u => u.uid === window.currentUser.uid);
        if(me !== -1 && sortedData[me].charm_score > 0) { myRank = me + 1; myScore = sortedData[me].charm_score; }
    } else {
        sortedData = [...rArr].sort((a,b) => b.wealth_score - a.wealth_score); icon = '🎁';
        let me = sortedData.findIndex(r => r.owner === window.currentUser.uid);
        if(me !== -1 && sortedData[me].wealth_score > 0) { myRank = me + 1; myScore = sortedData[me].wealth_score; }
    }

    document.getElementById('my-rank-text').innerText = myRank !== "No ranking" ? `No. ${myRank}` : myRank;
    document.getElementById('my-rank-score').innerText = myScore.toLocaleString();

    renderVIPLeaderboard(sortedData.filter(d => (d.exp_score > 0 || d.charm_score > 0 || d.wealth_score > 0)), currentLbMainTab, icon);
}

function renderVIPLeaderboard(dataList, tabType, icon) {
    const contentArea = document.getElementById('lb-content-area');
    if(dataList.length === 0) {
        contentArea.innerHTML = '<div class="text-center text-gray-400 mt-20 font-bold">No ranking for this period.</div>'; return;
    }

    let top1 = dataList[0], top2 = dataList[1], top3 = dataList[2];
    
    let podiumHTML = `<div class="lb-stage-bg">`;
    if(top2) podiumHTML += createVIPPodiumUser(top2, 2, tabType, icon);
    if(top1) podiumHTML += createVIPPodiumUser(top1, 1, tabType, icon);
    if(top3) podiumHTML += createVIPPodiumUser(top3, 3, tabType, icon);
    podiumHTML += `</div>`;

    let listHTML = `<div class="pb-5 pt-2">`;
    for(let i = 3; i < dataList.length; i++) {
        let d = dataList[i];
        let name = d.username || d.roomName;
        let pic = tabType === 2 ? d.roomCover : d.photoURL;
        if(!pic) pic = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
        let score = tabType === 0 ? d.exp_score : (tabType === 1 ? d.charm_score : d.wealth_score);
        let clickAct = tabType === 2 ? `onclick="joinRoom('${d.id}'); closeLeaderboard();"` : `onclick="openFullProfileView('${d.uid}')"`;

        let isOfficial = d.isOfficial || Number(d.customId) === 10005;
        let vBadgeHTML = isOfficial ? `<img src="./v_badge.svg" class="absolute -bottom-1 -right-1 w-5 h-5 bg-transparent drop-shadow-md z-10 object-contain" onerror="this.style.display='none'">` : '';

        listHTML += `
        <div class="vip-list-item cursor-pointer active:opacity-70 transition" ${clickAct}>
            <div class="flex items-center gap-4 pointer-events-none">
                <span class="text-gray-400 font-bold w-4 text-center">${i+1}</span>
                <div class="relative flex-shrink-0">
                    <img src="${pic}" class="w-12 h-12 rounded-full object-cover border-2 border-gray-600 shadow-md">
                    ${vBadgeHTML}
                </div>
                <div class="max-w-[120px]">
                    <span class="${d.nameColorClass || 'text-white'} font-bold text-sm truncate block">${name}</span>
                </div>
            </div>
            <div class="text-yellow-400 font-bold text-xs pointer-events-none">${score.toLocaleString()} ${icon}</div>
        </div>`;
    }
    listHTML += `</div>`;
    contentArea.innerHTML = podiumHTML + listHTML;
}

function createVIPPodiumUser(d, rank, tabType, icon) {
    let name = d.username || d.roomName;
    let pic = tabType === 2 ? d.roomCover : d.photoURL;
    if(!pic) pic = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    let score = tabType === 0 ? d.exp_score : (tabType === 1 ? d.charm_score : d.wealth_score);
    let crown = rank === 1 ? '<img src="https://cdn-icons-png.flaticon.com/512/3135/3135692.png" class="vip-crown">' : '';
    let badgeClass = rank === 1 ? 'bg-gold' : (rank === 2 ? 'bg-silver' : 'bg-bronze');
    let clickAct = tabType === 2 ? `onclick="joinRoom('${d.id}'); closeLeaderboard();"` : `onclick="openFullProfileView('${d.uid}')"`;
    
    let isOfficial = d.isOfficial || Number(d.customId) === 10005;
    let badgeSize = rank === 1 ? 'w-[26px] h-[26px]' : 'w-[22px] h-[22px]';
    let badgePos = rank === 1 ? 'bottom-0 -right-1' : 'bottom-0 -right-1';
    let vBadgeHTML = isOfficial ? `<img src="./v_badge.svg" class="absolute ${badgePos} ${badgeSize} bg-transparent drop-shadow-md z-20 object-contain" onerror="this.style.display='none'">` : '';

    return `
    <div class="vip-podium-item cursor-pointer active:scale-95 transition" ${clickAct}>
        ${crown}
        <div class="relative flex justify-center pointer-events-none">
            <img src="${pic}" class="vip-podium-dp rank-${rank}-dp">
            ${vBadgeHTML}
        </div>
        <div class="vip-rank-badge ${badgeClass} relative z-30 pointer-events-none">${rank}</div>
        <div class="mt-2 max-w-[80px] text-center pointer-events-none">
            <span class="${d.nameColorClass || 'text-white'} font-bold text-[10px] truncate block">${name}</span>
        </div>
        <span class="text-yellow-400 font-bold text-[9px] drop-shadow-md pointer-events-none">${score.toLocaleString()} ${icon}</span>
    </div>`;
}

function getRealAvatar(d, isRoom) {
    if(!d) return 'https://ui-avatars.com/api/?name=?&background=random';
    let name = d.username || d.roomName || 'User';
    let pic = isRoom ? d.roomCover : d.photoURL;
    if(!pic || pic.trim() === '') {
        pic = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true`;
    }
    return pic;
}

// ==========================================
// 3. HOME PAGE ANIMATED SLIDER & EMPTY SLOTS
// ==========================================

let homeSliderInterval = null;

window.updateHomeTopDPs = async () => {
    const usersSnap = await window.get(window.ref(window.db, 'users'));
    const roomsSnap = await window.get(window.ref(window.db, 'rooms'));
    
    let uArr = [], rArr =[];
    let tKeys = window.getLeaderboardTimeKeys();

    if(usersSnap.exists()) {
        usersSnap.forEach(s => { 
            let u = s.val(); u.uid = s.key;
            
            // 🔥 STRICT LOCATION ISOLATION LOGIC (For Home Top 3 DPs) 🔥
            let uCountry = u.country || "Unknown";
            let myC = window.myUserCountry || "Unknown";
            
            // اگر یوزر آفیشل نہیں ہے اور اس کا ملک میرے ملک سے میچ نہیں کرتا،
            // تو اسے فوراً نکال دو! (تاکہ دوسرے ملک میں خانے 1, 2, 3 بالکل خالی شو ہوں)
            if (!window.currentUserIsOfficial && uCountry !== myC) {
                return; 
            }
            
            // Daily, Weekly, Monthly Scores Collect Karna
            u.exp_d = (u.lastGiftDate === tKeys.daily) ? (Number(u.userExp_daily) || 0) : 0;
            u.exp_w = (u.lastGiftWeek === tKeys.weekly) ? (Number(u.userExp_weekly) || 0) : 0;
            u.exp_m = (u.lastGiftMonth === tKeys.monthly) ? (Number(u.userExp_monthly) || 0) : 0;
            u.charm_d = (u.lastGiftDate === tKeys.daily) ? (Number(u.charm_daily) || 0) : 0;
            u.charm_w = (u.lastGiftWeek === tKeys.weekly) ? (Number(u.charm_weekly) || 0) : 0;
            u.charm_m = (u.lastGiftMonth === tKeys.monthly) ? (Number(u.charm_monthly) || 0) : 0;
            
            uArr.push(u); 
        });
    }
    if(roomsSnap.exists()) {
        roomsSnap.forEach(s => { 
            let r = s.val(); r.id = s.key;
            
            r.wealth_d = (r.lastGiftDate === tKeys.daily) ? (Number(r.wealth_daily) || 0) : 0;
            r.wealth_w = (r.lastGiftWeek === tKeys.weekly) ? (Number(r.wealth_weekly) || 0) : 0;
            r.wealth_m = (r.lastGiftMonth === tKeys.monthly) ? (Number(r.wealth_monthly) || 0) : 0;
            
            rArr.push(r); 
        });
    }
    
    // Sort all arrays
    let c_d =[...uArr].sort((a,b)=>b.exp_d - a.exp_d).slice(0,3);
    let c_w = [...uArr].sort((a,b)=>b.exp_w - a.exp_w).slice(0,3);
    let c_m = [...uArr].sort((a,b)=>b.exp_m - a.exp_m).slice(0,3);

    let ch_d = [...uArr].sort((a,b)=>b.charm_d - a.charm_d).slice(0,3);
    let ch_w = [...uArr].sort((a,b)=>b.charm_w - a.charm_w).slice(0,3);
    let ch_m = [...uArr].sort((a,b)=>b.charm_m - a.charm_m).slice(0,3);

    let r_d = [...rArr].sort((a,b)=>b.wealth_d - a.wealth_d).slice(0,3);
    let r_w = [...rArr].sort((a,b)=>b.wealth_w - a.wealth_w).slice(0,3);
    let r_m = [...rArr].sort((a,b)=>b.wealth_m - a.wealth_m).slice(0,3);

    // Render HTML
    renderHomeSlider('home-top-contrib', {daily: c_d, weekly: c_w, monthly: c_m}, false, 'exp_');
    renderHomeSlider('home-top-charm', {daily: ch_d, weekly: ch_w, monthly: ch_m}, false, 'charm_');
    renderHomeSlider('home-top-room', {daily: r_d, weekly: r_w, monthly: r_m}, true, 'wealth_');

    startHomeSliderAnimation();
};

// یہ فنکشن ایمپٹی سلاٹس (خالی گول خانے) بناتا ہے اگر کوئی گفٹ نہ ہو
function getSlotHTML(user, rank, isRoom, scoreProp) {
    let sizeClass = rank === 1 ? 'dp-rank-1' : (rank === 2 ? 'dp-rank-2' : 'dp-rank-3');
    
    if (user && user[scoreProp] > 0) {
        let pic = getRealAvatar(user, isRoom);
        // اینیمیشن ڈیلے ٹاپ 1 کے لیے
        let animStyle = rank === 1 ? 'style="animation-delay: 0s;"' : '';
        return `<img src="${pic}" class="home-top-dp ${sizeClass}" ${animStyle} onerror="this.src='https://placehold.co/100/333/FFF?text=?'">`;
    } else {
        // ایمپٹی سلاٹ (خالی خانہ)
        return `<div class="home-empty-dp ${sizeClass}">${rank}</div>`;
    }
}

function buildSlideHTML(top3Array, isRoom, scorePropPrefix) {
    let html = '';
    // ترتیب: ٹاپ 2 (Left), ٹاپ 1 (Center), ٹاپ 3 (Right)
    html += getSlotHTML(top3Array[1], 2, isRoom, scorePropPrefix);
    html += getSlotHTML(top3Array[0], 1, isRoom, scorePropPrefix);
    html += getSlotHTML(top3Array[2], 3, isRoom, scorePropPrefix);
    return html;
}

function renderHomeSlider(elementId, dataObj, isRoom, scorePropBase) {
    const container = document.getElementById(elementId);
    if(!container) return;
    
    // Create inner HTML for Daily, Weekly, Monthly
    let htmlDaily = buildSlideHTML(dataObj.daily, isRoom, scorePropBase + 'd');
    let htmlWeekly = buildSlideHTML(dataObj.weekly, isRoom, scorePropBase + 'w');
    let htmlMonthly = buildSlideHTML(dataObj.monthly, isRoom, scorePropBase + 'm');

    container.innerHTML = `
        <div class="lb-time-tag" id="tag-${elementId}">Daily</div>
        <div class="lb-slider-wrapper">
            <div class="lb-slide-track" id="track-${elementId}">
                <div class="lb-slide-item">${htmlDaily}</div>
                <div class="lb-slide-item">${htmlWeekly}</div>
                <div class="lb-slide-item">${htmlMonthly}</div>
            </div>
        </div>
    `;
}

function startHomeSliderAnimation() {
    if(homeSliderInterval) clearInterval(homeSliderInterval);
    
    let currentSlideIndex = 0;
    const timeLabels =['Daily', 'Weekly', 'Monthly'];

    homeSliderInterval = setInterval(() => {
        currentSlideIndex = (currentSlideIndex + 1) % 3;
        let offset = currentSlideIndex * 35; // 35px height per slide

        document.querySelectorAll('.lb-slide-track').forEach(track => {
            track.style.transform = `translateY(-${offset}px)`;
        });

        document.querySelectorAll('.lb-time-tag').forEach(tag => {
            tag.innerText = timeLabels[currentSlideIndex];
            // ہلکا سا پاپ اینیمیشن
            tag.style.transform = 'scale(1.2)';
            setTimeout(() => tag.style.transform = 'scale(1)', 200);
        });
    }, 4000); // ہر 4 سیکنڈ بعد اوپر سوائپ ہوگا
}