// ==============================================================
// YARAAN - FINAL LEVEL SYSTEM (1 to 150) WITH BEAUTIFUL UI & AUTO-CLAIM
// ==============================================================

window.getExpForLevel = function(lvl) {
    if(lvl <= 1) return 0;
    return Math.floor(Math.pow(lvl, 2.5) * 2000); 
};

window.getUserLevel = function(exp) {
    let xp = exp || 0;
    let lvl = 1;
    while(xp >= window.getExpForLevel(lvl + 1) && lvl < 150) { lvl++; }
    return lvl;
};

window.getLevelTier = function(lvl) {
    return Math.min(15, Math.ceil(lvl / 10)); 
};

window.renderLevelHTML = function(exp) {
    let lvl = window.getUserLevel(exp);
    let tier = window.getLevelTier(lvl);
    return `<div class="user-level-badge tier-${tier}"><span>LV.${lvl}</span></div>`;
};

window.updateLevelBadgeUI = function(badgeId, exp) {
    let lvl = window.getUserLevel(exp);
    let tier = window.getLevelTier(lvl);
    let badgeEl = document.getElementById(badgeId);
    if(badgeEl) {
        // پرانی کلاسز ڈیلیٹ ہونے سے روکنے کے لیے نیا طریقہ
        for(let i=1; i<=15; i++) {
            badgeEl.classList.remove('tier-' + i);
        }
        if(!badgeEl.classList.contains('user-level-badge')) {
            badgeEl.classList.add('user-level-badge');
        }
        badgeEl.classList.add(`tier-${tier}`);
        
        badgeEl.innerHTML = `<span>LV.${lvl}</span>`;
        badgeEl.style.backgroundImage = 'none';
    }
};

// ================= REWARD DATA LOGIC =================
window.getLevelRewardDetails = function(lvl) {
    let rewards =[];
    
    if (lvl === 10) { rewards.push({type: 'coins', val: 50000, img: './coin_icon.png', name: '50k Coins'}); }
    else if (lvl === 20) { 
        rewards.push({type: 'vip', val: 'name-vip-green', img: './green_vip.png', name: 'VIP Green'}); 
        rewards.push({type: 'coins', val: 100000, img: './coin_icon.png', name: '100k Coins'}); 
    }
    else if (lvl === 30) { 
        rewards.push({type: 'vip', val: 'name-vip-yellow', img: './yellow_vip.png', name: 'VIP Yellow'}); 
        rewards.push({type: 'coins', val: 150000, img: './coin_icon.png', name: '150k Coins'}); 
    }
    else if (lvl === 40) { rewards.push({type: 'coins', val: 300000, img: './coin_icon.png', name: '300k Coins'}); }
    else if (lvl === 50) { 
        rewards.push({type: 'vip', val: 'name-vip-pink', img: './pink_vip.png', name: 'VIP Pink'}); 
        rewards.push({type: 'coins', val: 500000, img: './coin_icon.png', name: '500k Coins'}); 
    }
    else if (lvl === 60) { rewards.push({type: 'coins', val: 1000000, img: './coin_icon.png', name: '1M Coins'}); }
    else if (lvl === 70) { 
        rewards.push({type: 'vip', val: 'name-vip-colorful', img: './colorful_vip.png', name: 'VIP Colorful'}); 
        rewards.push({type: 'coins', val: 5000000, img: './coin_icon.png', name: '5M Coins'}); 
    }
    else if (lvl === 80) { rewards.push({type: 'coins', val: 10000000, img: './coin_icon.png', name: '10M Coins'}); }
    else if (lvl === 90) { rewards.push({type: 'coins', val: 20000000, img: './coin_icon.png', name: '20M Coins'}); }
    else if (lvl === 100) { 
        rewards.push({type: 'vip', val: 'name-vip-colorful', img: './colorful_vip.png', name: 'VIP Supreme'}); 
        rewards.push({type: 'coins', val: 50000000, img: './coin_icon.png', name: '50M Coins'}); 
    }
    else if (lvl > 100 && lvl % 10 === 0) {
        rewards.push({type: 'vip', val: 'name-vip-colorful', img: './colorful_vip.png', name: 'VIP God'}); 
        rewards.push({type: 'coins', val: lvl * 1000000, img: './coin_icon.png', name: `${lvl}M Coins`}); 
    }
    else { 
        rewards.push({type: 'coins', val: lvl * 1000, img: './coin_icon.png', name: `${(lvl*1000).toLocaleString()} Coins`}); 
    }
    return rewards;
};

// ================= AUTO-CLAIM LISTENER =================
window.initLevelSystemListener = function() {
    if(!window.currentUser) return;
    
    window.onValue(window.ref(window.db, `users/${window.currentUser.uid}/userExp`), (snap) => {
        let exp = snap.val() || 0;
        window.currentUserExp = exp; 
        
        window.updateLevelBadgeUI('profile-level-badge', exp);
        window.updateLevelBadgeUI('hp-level-badge', exp);
        window.updateLevelBadgeUI('fpv-level-badge-container', exp);
        
        window.checkAndAutoClaimLevelRewards(exp);
    });
};

window.checkAndAutoClaimLevelRewards = async function(currentExp) {
    if (!window.currentUser) return;
    
    let currentLvl = window.getUserLevel(currentExp);
    if(currentLvl <= 1) return;

    let snap = await window.get(window.ref(window.db, `users/${window.currentUser.uid}/claimedLevelRewards`));
    let claimedData = snap.val() || {};

    let totalCoinsAdded = 0;
    let vipAdded =[];
    let newlyClaimed = false;

    for (let i = 2; i <= currentLvl; i++) {
        if (!claimedData[i]) {
            let rewards = window.getLevelRewardDetails(i);
            
            for(let r of rewards) {
                if(r.type === 'coins') {
                    totalCoinsAdded += r.val;
                }
                if(r.type === 'vip') {
                    let days = (i >= 70) ? 30 : (i >= 50 ? 14 : (i >= 30 ? 30 : 7));
                    let expiry = Date.now() + (days * 24 * 60 * 60 * 1000);
                    let uniqueId = 'vip_' + i + '_' + Date.now();
                    
                    await window.update(window.ref(window.db, `users/${window.currentUser.uid}/unlockedFrames/${uniqueId}`), {
                        name: r.name, img: r.val, icon: r.img, isVipName: true, purchasedAt: Date.now(), expiry: expiry, status: 'unused'
                    });
                    vipAdded.push(r);
                }
            }
            claimedData[i] = true;
            newlyClaimed = true;
        }
    }

    if (newlyClaimed) {
        let uSnap = await window.get(window.ref(window.db, `users/${window.currentUser.uid}`));
        let currentDbCoins = (uSnap.val().coins || 0) + totalCoinsAdded;
        await window.update(window.ref(window.db, `users/${window.currentUser.uid}`), { coins: currentDbCoins, claimedLevelRewards: claimedData });
        
        window.currentCoins = currentDbCoins; 
        if(document.getElementById('game-balance')) document.getElementById('game-balance').innerText = currentDbCoins.toLocaleString();

        // 🟢 YARAAN OFFICIAL MESSAGE
        let rewardsHTML = `
        <div style="background:#111827; padding:12px; border-radius:12px; border:1px solid #374151; margin-top:8px;">
            <p style="color:#10b981; font-weight:bold; font-size:12px; text-align:center; margin-bottom:8px;">🎉 Congratulations! Level ${currentLvl} Reached! 🎉</p>
            <div style="display:flex; flex-direction:column; gap:6px;">`;
        
        if(totalCoinsAdded > 0) {
            rewardsHTML += `<div style="display:flex; align-items:center; gap:8px; background:#1f2937; padding:6px; border-radius:8px;"><img src="./coin_icon.png" style="width:20px; height:20px;"><span style="color:#facc15; font-weight:bold; font-size:11px;">+${totalCoinsAdded.toLocaleString()} Coins</span></div>`;
        }
        for(let v of vipAdded) {
            rewardsHTML += `<div style="display:flex; align-items:center; gap:8px; background:#1f2937; padding:6px; border-radius:8px;"><img src="${v.img}" style="width:20px; height:20px; object-fit:contain;"><span style="color:#d946ef; font-weight:bold; font-size:11px;">+${v.name} Unlocked</span></div>`;
        }
        rewardsHTML += `</div><p style="color:#9ca3af; font-size:9px; text-align:center; margin-top:8px;">Rewards have been added to your account.</p></div>`;

        await window.push(window.ref(window.db, `users/${window.currentUser.uid}/inbox/system`), {
            fromName: 'YARAAN Official',
            icon: './v_badge.png',
            message: rewardsHTML,
            timestamp: Date.now()
        });

        let badge = document.getElementById('inbox-dot');
        if (badge) badge.classList.remove('hidden');

        if (document.getElementById('level-system-modal').style.display === 'flex') {
            window.openLevelModal();
        }
    }
};

// ================= BEAUTIFUL LEVEL MODAL UI (FULL SCREEN & FIXED BADGE) =================
window.openLevelModal = async () => {
    const modal = document.getElementById('level-system-modal');
    modal.style.display = 'flex';
    setTimeout(() => { modal.classList.remove('translate-x-full'); }, 10);
    
    let currentExp = window.currentUserExp || 0;
    let currentLvl = window.getUserLevel(currentExp);
    let prevExp = window.getExpForLevel(currentLvl);
    let nextExp = window.getExpForLevel(currentLvl + 1);
    
    if (currentLvl >= 150) { nextExp = currentExp; } 
    let percent = currentLvl >= 150 ? 100 : ((currentExp - prevExp) / (nextExp - prevExp)) * 100;
    
    let topBadgeHtml = window.renderLevelHTML(currentExp).replace('class="user-level-badge', 'class="user-level-badge" style="transform: scale(1.6); position: relative; top: -5px; z-index: 10;"');
    document.getElementById('modal-current-level-badge').innerHTML = topBadgeHtml;
    
    document.getElementById('modal-exp-current').innerText = `${currentExp.toLocaleString()} EXP`;
    document.getElementById('modal-exp-needed').innerText = currentLvl >= 150 ? "MAX LEVEL" : `${nextExp.toLocaleString()} Needed`;
    document.getElementById('modal-level-bar').style.width = `${Math.min(100, Math.max(0, percent))}%`;

    const snap = await window.get(window.ref(window.db, `users/${window.currentUser.uid}/claimedLevelRewards`));
    const claimedData = snap.val() || {};
    const rewardsList = document.getElementById('level-rewards-list');
    rewardsList.innerHTML = '';

    for(let i = 2; i <= 150; i++) {
        let rewards = window.getLevelRewardDetails(i);
        let isClaimed = claimedData[i] === true;
        
        let statusBadge = '';
        let boxStyle = '';
        
        // 🔥 FIX: Added 'whitespace-nowrap' and 'flex-shrink-0' so the text NEVER cuts or wraps
        if (isClaimed) { 
            statusBadge = `<span class="whitespace-nowrap flex-shrink-0 bg-green-500/20 border border-green-500/50 text-green-400 text-[10px] px-3 py-1.5 rounded-full font-black tracking-wider"><i class="fa-solid fa-check mr-1"></i> CLAIMED</span>`; 
            boxStyle = 'bg-white/10 border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.1)]'; 
        } else { 
            statusBadge = `<span class="whitespace-nowrap flex-shrink-0 bg-black/50 text-gray-500 border border-gray-600/50 text-[10px] px-3 py-1.5 rounded-full font-bold"><i class="fa-solid fa-lock mr-1"></i> LOCKED</span>`; 
            boxStyle = 'bg-black/40 border-white/5'; 
        }

        let dummyBadge = `<div class="user-level-badge tier-${window.getLevelTier(i)}"><span>LV.${i}</span></div>`;

        let rewardsBoxesHtml = `<div class="flex flex-wrap gap-2 mt-2">`;
        rewards.forEach(r => {
            let bgColor = r.type === 'vip' ? 'bg-purple-900/40 border-purple-500/50' : 'bg-yellow-900/30 border-yellow-500/30';
            let iconFallback = r.type === 'vip' ? 'https://cdn-icons-png.flaticon.com/512/5025/5025812.png' : 'https://cdn-icons-png.flaticon.com/512/3135/3135673.png';
            rewardsBoxesHtml += `
            <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${bgColor} shadow-sm">
                <img src="${r.img}" class="w-4 h-4 object-contain drop-shadow-sm" onerror="this.src='${iconFallback}'">
                <span class="text-[10px] font-bold text-gray-200 tracking-wide">${r.name}</span>
            </div>`;
        });
        rewardsBoxesHtml += `</div>`;

        // 🔥 FIX: Changed 'items-start' to 'items-center' for perfect vertical alignment
        rewardsList.innerHTML += `
        <div class="rounded-xl p-3.5 mb-3 border ${boxStyle} flex justify-between items-center transition-all gap-2">
            <div class="flex flex-col flex-1 min-w-0">
                <div class="flex items-center gap-3 mb-1">
                    ${dummyBadge}
                    <span class="text-white font-black text-sm tracking-widest">LEVEL ${i}</span>
                </div>
                ${rewardsBoxesHtml}
            </div>
            <div>${statusBadge}</div>
        </div>`;
    }
};

window.closeLevelModal = () => { 
    const modal = document.getElementById('level-system-modal');
    modal.classList.add('translate-x-full');
    setTimeout(() => { 
        modal.style.display = 'none'; 
    }, 300);
};