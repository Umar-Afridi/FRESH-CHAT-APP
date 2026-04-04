window.ROCKET_LEVELS = [ 
    { 
      level: 1, cost: 300000, img: './rocket1.png', anim: './rocket1.svg', 
      rewards: { 
          t1: { coins: 20000, exp: 30000, frame: './frames/rocket_lv1.svga', frameIcon: './frame_gold.png' }, 
          t2: { coins: 15000, exp: 30000, frame: './frames/rocket_lv1.svga', frameIcon: './frame_silver.png' }, 
          t3: { coins: 10000, exp: 30000, frame: null, frameIcon: null } 
      } 
    }, 
    { 
      level: 2, cost: 500000, img: './rocket2.png', anim: './rocket2.svg', 
      rewards: { 
          t1: { coins: 30000, exp: 60000, frame: './frames/rocket_lv2.svga', frameIcon: './frame_gold.png' }, 
          t2: { coins: 20000, exp: 60000, frame: './frames/rocket_lv2.svga', frameIcon: './frame_silver.png' }, 
          t3: { coins: 15000, exp: 60000, frame: null, frameIcon: null } 
      } 
    }, 
    { 
      level: 3, cost: 2000000, img: './rocket3.png', anim: './rocket3.svg', 
      rewards: { 
          t1: { coins: 40000, exp: 90000, frame: './frames/rocket_lv3.svga', frameIcon: './frame_gold.png' }, 
          t2: { coins: 30000, exp: 90000, frame: './frames/rocket_lv3.svga', frameIcon: './frame_silver.png' }, 
          t3: { coins: 20000, exp: 90000, frame: null, frameIcon: null } 
      } 
    }, 
    { 
      level: 4, cost: 4000000, img: './rocket4.png', anim: './rocket4.svg', 
      rewards: { 
          t1: { coins: 100000, exp: 120000, frame: './frames/rocket_lv4.svga', frameIcon: './frame_gold.png' }, 
          t2: { coins: 80000, exp: 120000, frame: './frames/rocket_lv4.svga', frameIcon: './frame_silver.png' }, 
          t3: { coins: 50000, exp: 120000, frame: null, frameIcon: null } 
      } 
    } 
];

window.currentRocketTargetLevel = 1; 
window.rocket_currentRoomExp = 0;
window.lastRocketLevel = 0;
window.rocketQueue = [];
window.isRocketFlying = false;
window.isRocketSequenceActive = false; 
window.isFirstRocketLoad = true; 
window.rocketAnimTimeout = null;

window.initRocketListener = function(rid) {
    document.getElementById('rocket-trigger-btn').classList.remove('hidden');
    window.isFirstRocketLoad = true;
    window.onValue(window.ref(window.db, `rooms/${rid}/roomExp`), (snap) => { 
        window.rocket_currentRoomExp = snap.val() || 0; 
        window.updateRocketUI(window.rocket_currentRoomExp, rid); 
    });
};

window.rocketLoopTimer = null;
window.currentRoomRocketAnim = null;
window.currentModalSvg = null; 

window.updateRocketUI = function(exp, rid) {
    let targetLevel = 0; 
    let nextThreshold = window.ROCKET_LEVELS[0].cost; 
    let prevThreshold = 0;

    for (let i = 0; i < window.ROCKET_LEVELS.length; i++) {
        if (exp >= window.ROCKET_LEVELS[i].cost) {
            targetLevel = window.ROCKET_LEVELS[i].level; 
            prevThreshold = window.ROCKET_LEVELS[i].cost;
            if (i < window.ROCKET_LEVELS.length - 1) { 
                nextThreshold = window.ROCKET_LEVELS[i+1].cost; 
            } else { 
                nextThreshold = exp * 1.5; 
            }
        }
    }
    
    let displayLevelIndex = 0;
    for (let i = 0; i < window.ROCKET_LEVELS.length; i++) {
        if (exp >= window.ROCKET_LEVELS[i].cost) {
            displayLevelIndex = Math.min(i + 1, window.ROCKET_LEVELS.length - 1);
        }
    }
    
    let displayData = window.ROCKET_LEVELS[displayLevelIndex];
    window.currentRocketTargetLevel = displayData.level; 
    window.currentRoomRocketAnim = displayData.anim; 

    const triggerImg = document.getElementById('main-rocket-icon'); 
    if (triggerImg && !triggerImg.src.includes(displayData.anim)) {
        let tempRoomImg = new Image();
        tempRoomImg.onload = function() { triggerImg.src = this.src; };
        tempRoomImg.src = displayData.anim + "?t=" + Date.now();
    }
    
    if(window.rocketLoopTimer) clearInterval(window.rocketLoopTimer);
    window.rocketLoopTimer = setInterval(() => {
        let cacheBuster = "?t=" + Date.now(); 
        let icon = document.getElementById('main-rocket-icon');
        if(icon && window.currentRoomRocketAnim) {
            let tempIcon = new Image();
            tempIcon.onload = function() { icon.src = this.src; };
            tempIcon.src = window.currentRoomRocketAnim + cacheBuster;
        }
    }, 2800); 
    
    let percentage = 0;
    if (targetLevel < 4) { 
        percentage = ((exp - prevThreshold) / (nextThreshold - prevThreshold)) * 100; 
    } else { 
        percentage = 100; 
    }
    percentage = Math.max(0, Math.min(100, percentage));
    
    let tubeFill = document.getElementById('rocket-tube-fill');
    let tubeText = document.getElementById('rocket-tube-text');
    if(tubeFill) tubeFill.style.height = `${percentage}%`; 
    if(tubeText) tubeText.innerText = `${Math.floor(percentage)}%`;

    if (window.isFirstRocketLoad) {
        window.lastRocketLevel = targetLevel;
        window.isFirstRocketLoad = false;
    } else if (targetLevel > window.lastRocketLevel) {
        let startLoop = Math.max(1, window.lastRocketLevel + 1);
        if (window.lastRocketLevel === 0 && targetLevel > 0) startLoop = 1;
        
        window.isRocketSequenceActive = true; 
        let batchIndex = 0;

        for(let lvl = startLoop; lvl <= targetLevel; lvl++) {
            const rData = window.ROCKET_LEVELS.find(r => r.level === lvl);
            if(rData) {
                let bannerWaitTime = (batchIndex < 2) ? 9000 : 3000;
                if(typeof window.broadcastRocketLaunch === "function"){
                    let shortId = window.currentRoomData?.ownerCustomId || rid;
                    window.broadcastRocketLaunch(rid, shortId, window.currentRoomData?.roomName || 'A Room', lvl, rData.img, bannerWaitTime);
                }

                window.rocketQueue.push({ 
                    animSrc: rData.anim, 
                    imgSrc: rData.img,   
                    targetLevel: lvl, 
                    isMaxLevel: (lvl === 4),
                    roomId: rid,
                    rewardData: rData.rewards
                });
                batchIndex++;
            }
        }

        if (!window.isRocketFlying) {
            window.isRocketFlying = true;
            setTimeout(() => {
                window.processRocketQueue();
            }, 9000);
        }
    } 
    else if (targetLevel === 4 && exp >= 3000000) {
        setTimeout(() => {
            window.set(window.ref(window.db, `rooms/${rid}/roomExp`), 0);
            window.push(window.ref(window.db, `rooms/${rid}/messages`), { 
                name: "System", text: "✨ Rocket Cycle Reset! Start again! ✨", type: 'system', timestamp: Date.now() 
            });
        }, 5000);
    }
    window.lastRocketLevel = targetLevel;
};

window.previewRocketModal = function(level) {
    const rData = window.ROCKET_LEVELS.find(r => r.level === level);
    if(!rData) return;

    window.currentModalSvg = rData.anim; 
    const bigRocket = document.getElementById('modal-big-rocket');
    let tempModalLoad = new Image();
    tempModalLoad.onload = function() { bigRocket.src = this.src; };
    tempModalLoad.onerror = function() { bigRocket.src = rData.img; }; 
    tempModalLoad.src = rData.anim + "?t=" + Date.now();
    
    document.querySelectorAll('.modal-level-btn').forEach(btn => btn.classList.remove('active'));
    let activeBtn = document.getElementById(`btn-lvl-${level}`);
    if(activeBtn) activeBtn.classList.add('active');
    
    if(rData.rewards) {
        document.getElementById('r-t1-coins').innerText = rData.rewards.t1.coins.toLocaleString();
        document.getElementById('r-t1-exp').innerText = rData.rewards.t1.exp.toLocaleString();
        document.getElementById('r-t2-coins').innerText = rData.rewards.t2.coins.toLocaleString();
        document.getElementById('r-t2-exp').innerText = rData.rewards.t2.exp.toLocaleString();
        document.getElementById('r-t3-coins').innerText = rData.rewards.t3.coins.toLocaleString();
        document.getElementById('r-t3-exp').innerText = rData.rewards.t3.exp.toLocaleString();
    }
};

window.openRocketDetails = () => {
    document.getElementById('rocket-details-modal').style.display = 'flex';
    window.previewRocketModal(window.currentRocketTargetLevel || 1);
};

window.closeRocketDetails = () => {
    document.getElementById('rocket-details-modal').style.display = 'none';
};

window.processRocketQueue = function() {
    if (window.rocketQueue.length === 0) {
        window.isRocketFlying = false;
        window.isRocketSequenceActive = false; 
        if(typeof window.processGlobalBannerQueue === 'function') {
            window.processGlobalBannerQueue(); 
        }
        return;
    }
    
    const nextRocket = window.rocketQueue.shift(); 
    window.playRocketAnimation(nextRocket.animSrc, nextRocket.imgSrc, nextRocket.targetLevel, nextRocket.isMaxLevel, nextRocket.roomId, nextRocket.rewardData);
};

window.playRocketAnimation = function(animSrc, imgSrc, targetLevel, isMaxLevel, rid, rewardData) {
    let oldLayer = document.getElementById('rocket-fullscreen-layer');
    if (oldLayer) oldLayer.remove();
    
    const layer = document.createElement('div');
    layer.id = 'rocket-fullscreen-layer'; 
    
    const viewRoom = document.getElementById('view-room');
    if (viewRoom) viewRoom.appendChild(layer);
    else document.documentElement.appendChild(layer); 
    
    layer.style.cssText = `position: absolute !important; top: 0 !important; bottom: 0 !important; left: 0 !important; right: 0 !important; width: 100% !important; height: 100% !important; z-index: 2147483647 !important; pointer-events: none !important; background: transparent !important; display: flex !important; align-items: center !important; justify-content: center !important; transform: translateZ(99999px) !important;`;
    
    const audio = document.getElementById('rocket-sound');
    if (audio && viewRoom && viewRoom.style.display !== 'none') {
        audio.currentTime = 0;
        let playPromise = audio.play();
        if (playPromise !== undefined) playPromise.catch(e => console.log(e));
    }

    const cacheBusterSrc = animSrc + "?t=" + Date.now();

    layer.innerHTML = `<img src="${cacheBusterSrc}" style="position: absolute !important; width: 100% !important; height: 100% !important; object-fit: contain !important; z-index: 2147483647 !important; pointer-events: none !important; transform: scale(1) !important; transform-origin: center center !important;">`;

    window.pendingRocketResetParams = isMaxLevel ? { rid: rid } : null;

    setTimeout(() => {
        if (window.pendingRocketResetParams) { 
            window.set(window.ref(window.db, `rooms/${window.pendingRocketResetParams.rid}/roomExp`), 0); 
            window.push(window.ref(window.db, `rooms/${window.pendingRocketResetParams.rid}/messages`), { 
                name: "System", text: "✨ Rocket Cycle Reset! Start again! ✨", type: 'system', timestamp: Date.now() 
            }); 
            window.pendingRocketResetParams = null;
        }
        
        let layerCheck = document.getElementById('rocket-fullscreen-layer');
        if(layerCheck) layerCheck.remove(); 
        
        // راکٹ اڑنے کے فوراً بعد ریوارڈز پروسیس کریں اور پاپ اپ دکھائیں
        window.processRocketRewards(rid, targetLevel, rewardData);

        window.processRocketQueue(); 
        
    }, 9500); 
};

window.resetRocketSystemOnExit = function() {
    if (window.rocketAnimTimeout) {
        clearTimeout(window.rocketAnimTimeout);
        window.rocketAnimTimeout = null;
    }
    window.rocketQueue = []; 
    window.isRocketFlying = false; 
};

// ================= NEW: PROCESS REWARDS & SHOW POPUP =================
window.processRocketRewards = async function(rid, level, rewardData) {
    if(!rewardData) return;

    const activeSnap = await window.get(window.ref(window.db, `rooms/${rid}/activeUsers`));
    if(!activeSnap.exists()) return;

    const usersObj = activeSnap.val();
    let allUids = Object.keys(usersObj);
    
    // شفل کریں
    allUids.sort(() => 0.5 - Math.random());

    let top3 = allUids.slice(0, 3);
    let luckyUids = allUids.slice(3);

    let top1Uid = top3[0] || null;
    let top2Uid = top3[1] || null;
    let top3Uid = top3[2] || null;

    let popupTop3HTML = "";
    let popupLuckyHTML = "";

    // 1. Process TOP 1
    if (top1Uid) {
        let u1Data = await getUserDataForPopup(top1Uid);
        await distributeReward(top1Uid, rid, level, rewardData.t1.coins, rewardData.t1.exp, rewardData.t1.frame);
        popupTop3HTML += generateTopRankHTML(1, u1Data, rewardData.t1);
    }
    
    // 2. Process TOP 2
    if (top2Uid) {
        let u2Data = await getUserDataForPopup(top2Uid);
        await distributeReward(top2Uid, rid, level, rewardData.t2.coins, rewardData.t2.exp, rewardData.t2.frame);
        popupTop3HTML += generateTopRankHTML(2, u2Data, rewardData.t2);
    }

    // 3. Process TOP 3
    if (top3Uid) {
        let u3Data = await getUserDataForPopup(top3Uid);
        await distributeReward(top3Uid, rid, level, rewardData.t3.coins, rewardData.t3.exp, rewardData.t3.frame);
        popupTop3HTML += generateTopRankHTML(3, u3Data, rewardData.t3);
    }

    // 4. Process Lucky Users
    for (let uid of luckyUids) {
        let luckyCoins = Math.floor(Math.random() * (5000 - 500 + 1)) + 500; 
        let luData = await getUserDataForPopup(uid);
        await distributeReward(uid, rid, level, luckyCoins, 0, null);
        popupLuckyHTML += `
            <div class="flex justify-between items-center bg-white/10 px-3 py-1.5 rounded-lg mb-1">
                <span class="text-white text-[11px] font-bold">${luData.name}</span>
                <span class="text-yellow-400 text-[11px] font-bold">+${luckyCoins} Coins</span>
            </div>`;
    }

    if(luckyUids.length === 0) {
        popupLuckyHTML = '<p class="text-gray-400 text-xs text-center mt-2">No other viewers.</p>';
    }

    // پاپ اپ کے اندر ڈیٹا ڈالیں اور اوپن کریں
    document.getElementById('rocket-top3-rewards').innerHTML = popupTop3HTML;
    document.getElementById('rocket-lucky-list').innerHTML = popupLuckyHTML;
    
    const modal = document.getElementById('rocket-reward-result-modal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
};

window.closeRocketRewardPopup = function() {
    const modal = document.getElementById('rocket-reward-result-modal');
    modal.classList.add('hidden');
    modal.style.display = 'none';
};

// ہیلپر فنکشنز
async function getUserDataForPopup(uid) {
    const snap = await window.get(window.ref(window.db, `users/${uid}`));
    const d = snap.val() || {};
    return { name: d.username || 'User', pic: d.photoURL || 'https://placehold.co/50' };
}

// 🔴 AUTO EQUIP, 1 DAY VALIDITY & YARAAN REWARD
async function distributeReward(uid, rid, level, addCoins, addExp, frameUrl) {
    const uSnap = await window.get(window.ref(window.db, `users/${uid}`));
    if(!uSnap.exists()) return;
    const uData = uSnap.val();
    
    // XP اپڈیٹ
    let updates = {
        userExp: (uData.userExp || 0) + addExp
    };

    // اگر فریم ملا ہے تو (1 دن کی Validity اور Auto Equip)
    if(frameUrl) {
        let frameId = 'rocket_reward_' + Date.now();
        updates[`unlockedFrames/${frameId}`] = {
            name: `Rocket Lv.${level} Frame`,
            img: frameUrl,
            purchasedAt: Date.now(),
            status: 'active', 
            expiry: Date.now() + (24 * 60 * 60 * 1000) // 🔴 1 DAY (24 HOURS) VALIDITY 🔴
        };
        
        // 🔴 AUTO EQUIP: یوزر کی پروفائل پر فوراً اپلائی کر دو
        updates.currentFrame = frameUrl;
    }

    // ڈیٹا بیس میں XP اور Frame اپڈیٹ کریں
    await window.update(window.ref(window.db, `users/${uid}`), updates);
    if(typeof window.updateLevelBadgeUI === 'function') window.updateLevelBadgeUI('profile-level-badge', updates.userExp);

    // 🔴 سیٹ پر موجود یوزر کا فریم بھی فوراً اپلائی کریں تاکہ روم میں شو ہو
    if (frameUrl) {
        const seatsSnap = await window.get(window.ref(window.db, `rooms/${rid}/seats`));
        if (seatsSnap.exists()) {
            const seats = seatsSnap.val();
            for (let seatKey in seats) {
                if (seats[seatKey].uid === uid) {
                    await window.update(window.ref(window.db, `rooms/${rid}/seats/${seatKey}`), { frame: frameUrl });
                    break;
                }
            }
        }
    }

    // ان باکس میں کوائنز بھیجیں
    if (addCoins > 0) {
        const rewardRef = window.ref(window.db, `users/${uid}/inbox/rocketRewards/${rid}_${level}_${Date.now()}`);
        await window.set(rewardRef, {
            amount: addCoins,
            level: level,
            message: `Congratulations! You received a reward from the Rocket Launch in room (ID: ${rid}). Collect your coins now!`,
            claimed: false,
            timestamp: Date.now() // اس ٹائم کی بنیاد پر 24 گھنٹے بعد ڈیلیٹ ہوگا
        });
        
        if(typeof window.updateInboxBadge === 'function') {
            window.updateInboxBadge();
        }
    }
}

// 🔴 PREMIUM GRID BOX DESIGN (WITH XP ICON)
function generateTopRankHTML(rank, uData, rData) {
    let crown = '';
    let border = '';
    if(rank === 1) { crown = '👑'; border = 'border-yellow-400'; }
    if(rank === 2) { crown = '🥈'; border = 'border-gray-300'; }
    if(rank === 3) { crown = '🥉'; border = 'border-orange-500'; }

    let scale = rank === 1 ? 'transform scale-110 z-10' : 'transform scale-95 opacity-90';

    // 1000 کو 1k میں بدلنے کا فارمولا
    let formatNum = (num) => num >= 1000 ? (num/1000) + 'k' : num;

    // Box 1: Coins
    let coinsBox = `
        <div class="reward-grid-item">
            <img src="./coin_icon.png" onerror="this.src='https://placehold.co/20'">
            <span class="text-yellow-400">${formatNum(rData.coins)}</span>
        </div>`;

    // Box 2: XP (اب اس میں تصویر / آئیکن لگا دیا گیا ہے)
    // اگر آپ کے پاس 'xp_icon.png' نہیں ہے تو میں نے ایک خوبصورت سٹار آئیکن کا لنک ڈال دیا ہے
    let expBox = `
        <div class="reward-grid-item">
            <img src="./xp_icon.png" onerror="this.src='https://cdn-icons-png.flaticon.com/512/5753/5753381.png'">
            <span class="text-blue-400">${formatNum(rData.exp)}</span>
        </div>`;

    // Box 3: Frame Icon (صرف فریم کا آئیکن، کوئی ٹیکسٹ نہیں)
    let frameBox = '';
    if (rData.frameIcon) {
        frameBox = `
        <div class="reward-grid-item">
            <img src="${rData.frameIcon}" style="width: 24px; height: 24px;" onerror="this.src='https://placehold.co/20'">
        </div>`;
    }

    return `
    <div class="top-rank-box ${scale} w-full max-w-[100px] mt-3">
        <span class="absolute -top-5 text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">${crown}</span>
        <img src="${uData.pic}" class="w-10 h-10 rounded-full border-2 ${border} object-cover mt-1 mb-1.5 shadow-md bg-white/10">
        <span class="text-white text-[9px] font-bold w-[90%] truncate text-center mb-2">${uData.name}</span>
        
        <!-- Beautiful Grid Row -->
        <div class="flex flex-row items-center justify-center gap-1 w-full">
            ${coinsBox}
            ${expBox}
            ${frameBox}
        </div>
    </div>`;
}