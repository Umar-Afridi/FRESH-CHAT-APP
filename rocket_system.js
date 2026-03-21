window.ROCKET_LEVELS =[ 
    { level: 1, cost: 300000, img: './rocket1.png', anim: './rocket1.svg', 
      rewards: { t1: { coins: '20,000', exp: '30,000' }, t2: { coins: '15,000', exp: '30,000' }, t3: { coins: '10,000', exp: '30,000' } } 
    }, 
    { level: 2, cost: 500000, img: './rocket2.png', anim: './rocket2.svg', 
      rewards: { t1: { coins: '50,000', exp: '60,000' }, t2: { coins: '30,000', exp: '60,000' }, t3: { coins: '20,000', exp: '60,000' } } 
    }, 
    { level: 3, cost: 2000000, img: './rocket3.png', anim: './rocket3.svg', 
      rewards: { t1: { coins: '100,000', exp: '120,000' }, t2: { coins: '80,000', exp: '120,000' }, t3: { coins: '50,000', exp: '120,000' } } 
    }, 
    { level: 4, cost: 4000000, img: './rocket4.png', anim: './rocket4.svg', 
      rewards: { t1: { coins: '200,000', exp: '240,000' }, t2: { coins: '150,000', exp: '240,000' }, t3: { coins: '100,000', exp: '240,000' } } 
    } 
];

window.currentRocketTargetLevel = 1; // For tracking current room level

window.rocket_currentRoomExp = 0;
window.lastRocketLevel = 0;
window.rocketQueue =[];
window.isRocketFlying = false;
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

// راکٹ کو دوبارہ سٹارٹ کرنے کے لیے گلوبل ٹائمر
// راکٹ کو دوبارہ سٹارٹ کرنے کے لیے گلوبل ٹائمر
window.rocketLoopTimer = null;
window.currentRoomRocketAnim = null;
window.currentModalSvg = null; 

window.updateRocketUI = function(exp, rid) {
    let targetLevel = 0; 
    let nextThreshold = window.ROCKET_LEVELS[0].cost; 
    let prevThreshold = 0;

    // 1. پہلے چیک کریں کہ کون سا لیول اچیو (Achieve) ہو چکا ہے
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
    
    // 2. یہ لاجک طے کرے گا کہ سکرین پر کون سا راکٹ کھڑا نظر آئے گا (Next Target)
    let displayLevelIndex = 0;
    for (let i = 0; i < window.ROCKET_LEVELS.length; i++) {
        if (exp >= window.ROCKET_LEVELS[i].cost) {
            displayLevelIndex = Math.min(i + 1, window.ROCKET_LEVELS.length - 1);
        }
    }
    
    let displayData = window.ROCKET_LEVELS[displayLevelIndex];
    window.currentRocketTargetLevel = displayData.level; 
    window.currentRoomRocketAnim = displayData.anim; 

    // 3. روم کے چھوٹے آئیکن پر SVG لگائیں (بغیر جھٹکے کے - PRELOAD TECHNIQUE)
    const triggerImg = document.getElementById('main-rocket-icon'); 
    if (triggerImg && !triggerImg.src.includes(displayData.anim)) {
        let tempRoomImg = new Image();
        tempRoomImg.onload = function() { triggerImg.src = this.src; };
        tempRoomImg.src = displayData.anim + "?t=" + Date.now();
    }
    
    // 4. آٹو ری سٹارٹ (Loop) سسٹم تاکہ راکٹ غائب نہ ہو اور کوئی سفید ڈبہ نہ آئے!
    if(window.rocketLoopTimer) clearInterval(window.rocketLoopTimer);
    window.rocketLoopTimer = setInterval(() => {
        let cacheBuster = "?t=" + Date.now(); 
        
        // روم کے چھوٹے آئیکن کو بیک گراؤنڈ میں لوڈ کر کے ری سٹارٹ کریں
        let icon = document.getElementById('main-rocket-icon');
        if(icon && window.currentRoomRocketAnim) {
            let tempIcon = new Image();
            tempIcon.onload = function() { icon.src = this.src; };
            tempIcon.src = window.currentRoomRocketAnim + cacheBuster;
        }
        
        // موڈل والے بڑے راکٹ کو بھی بیک گراؤنڈ میں لوڈ کر کے ری سٹارٹ کریں
        let modal = document.getElementById('rocket-details-modal');
        let modalIcon = document.getElementById('modal-big-rocket');
        if(modal && modal.style.display !== 'none' && modalIcon && window.currentModalSvg) {
            let tempModalIcon = new Image();
            tempModalIcon.onload = function() { modalIcon.src = this.src; };
            tempModalIcon.src = window.currentModalSvg + cacheBuster;
        }
    }, 2800); // 2.8 سیکنڈ بعد لوپ چلے گا
    
    // 5. پرسنٹیج ٹیوب کا لاجک
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

    // 6. راکٹ اڑانے کی کیو (Queue) کا سسٹم
    if (window.isFirstRocketLoad) {
        window.lastRocketLevel = targetLevel;
        window.isFirstRocketLoad = false;
    } else if (targetLevel > window.lastRocketLevel) {
        let startLoop = Math.max(1, window.lastRocketLevel + 1);
        if (window.lastRocketLevel === 0 && targetLevel > 0) startLoop = 1;
        
        for(let lvl = startLoop; lvl <= targetLevel; lvl++) {
            const rData = window.ROCKET_LEVELS.find(r => r.level === lvl);
            if(rData) {
                window.rocketQueue.push({ 
                    animSrc: rData.anim, 
                    imgSrc: rData.img,   
                    targetLevel: lvl, 
                    isMaxLevel: (lvl === 4),
                    roomId: rid 
                });
            }
        }
        window.processRocketQueue();

        if (rid) {
            window.get(window.ref(window.db, `rooms/${rid}/activeUsers`)).then(snap => {
                if (snap.exists()) {
                    Object.keys(snap.val()).forEach(uid => {
                        if (typeof window.addRocketRewardForUser === 'function' || typeof addRocketRewardForUser === 'function') {
                            let rewardFunc = window.addRocketRewardForUser || addRocketRewardForUser;
                            rewardFunc(uid, rid, targetLevel);
                        }
                    });
                }
            });
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

// Preview Modal Function (یہاں بھی پری لوڈ ٹیکنیک لگا دی گئی ہے)
window.previewRocketModal = function(level) {
    const rData = window.ROCKET_LEVELS.find(r => r.level === level);
    if(!rData) return;

    window.currentModalSvg = rData.anim; 
    
    // موڈل میں SVG لوڈ کریں (بیک گراؤنڈ میں لوڈ ہو کر پھر سکرین پر آئے گا)
    const bigRocket = document.getElementById('modal-big-rocket');
    let tempModalLoad = new Image();
    tempModalLoad.onload = function() { bigRocket.src = this.src; };
    tempModalLoad.onerror = function() { bigRocket.src = rData.img; }; // اگر SVG فیل ہو تو PNG چلا دے
    tempModalLoad.src = rData.anim + "?t=" + Date.now();
    
    document.querySelectorAll('.modal-level-btn').forEach(btn => btn.classList.remove('active'));
    let activeBtn = document.getElementById(`btn-lvl-${level}`);
    if(activeBtn) activeBtn.classList.add('active');
    
    if(rData.rewards) {
        document.getElementById('r-t1-coins').innerText = rData.rewards.t1.coins;
        document.getElementById('r-t1-exp').innerText = rData.rewards.t1.exp;
        document.getElementById('r-t2-coins').innerText = rData.rewards.t2.coins;
        document.getElementById('r-t2-exp').innerText = rData.rewards.t2.exp;
        document.getElementById('r-t3-coins').innerText = rData.rewards.t3.coins;
        document.getElementById('r-t3-exp').innerText = rData.rewards.t3.exp;
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
    if (window.isRocketFlying || window.rocketQueue.length === 0) return;
    window.isRocketFlying = true;
    
    const nextRocket = window.rocketQueue.shift(); 
    window.playRocketAnimation(nextRocket.animSrc, nextRocket.imgSrc, nextRocket.targetLevel, nextRocket.isMaxLevel, nextRocket.roomId);
};

window.playRocketAnimation = function(animSrc, imgSrc, targetLevel, isMaxLevel, rid) {
    let oldLayer = document.getElementById('rocket-fullscreen-layer');
    if (oldLayer) oldLayer.remove();
    
    const layer = document.createElement('div');
    layer.id = 'rocket-fullscreen-layer'; 
    
    // راکٹ کو روم کے اندر اپینڈ کریں تاکہ باہر نہ جائے
    const viewRoom = document.getElementById('view-room');
    if (viewRoom) {
        viewRoom.appendChild(layer);
    } else {
        document.documentElement.appendChild(layer); 
    }
    
    layer.style.cssText = `
        position: absolute !important; 
        top: 0 !important; 
        bottom: 0 !important; 
        left: 0 !important; 
        right: 0 !important; 
        width: 100% !important; 
        height: 100% !important; 
        z-index: 2147483647 !important; 
        pointer-events: none !important; 
        background: transparent !important; 
        display: flex !important; 
        align-items: center !important; 
        justify-content: center !important;
        transform: translateZ(99999px) !important; 
    `;
    
    // آواز صرف اس صورت میں چلے جب روم اوپن ہو
    const audio = document.getElementById('rocket-sound');
    if (audio && viewRoom && viewRoom.style.display !== 'none') {
        audio.currentTime = 0;
        let playPromise = audio.play();
        if (playPromise !== undefined) playPromise.catch(e => console.log(e));
    }

    // 🔥 یہ ہے وہ لائن جو گلوبل بینر کو ٹرگر کرتی ہے (باہر اور اندر ہر جگہ) 🔥
    if(typeof window.broadcastRocketLaunch === "function"){
        let shortId = window.currentRoomData?.ownerCustomId || rid;
        window.broadcastRocketLaunch(rid, shortId, window.currentRoomData?.roomName || 'A Room', targetLevel, imgSrc);
    }

    const cacheBusterSrc = animSrc + "?t=" + Date.now();

    layer.innerHTML = `
        <img src="${cacheBusterSrc}" style="
            position: absolute !important; 
            width: 100% !important; 
            height: 100% !important; 
            object-fit: contain !important; 
            z-index: 2147483647 !important; 
            pointer-events: none !important;
            transform: scale(1.4) !important; 
            transform-origin: center center !important;
        ">
    `;

    window.pendingRocketResetParams = isMaxLevel ? { rid: rid } : null;

    window.rocketAnimTimeout = setTimeout(() => {
        if (window.pendingRocketResetParams) { 
            window.set(window.ref(window.db, `rooms/${window.pendingRocketResetParams.rid}/roomExp`), 0); 
            window.push(window.ref(window.db, `rooms/${window.pendingRocketResetParams.rid}/messages`), { 
                name: "System", 
                text: "✨ Rocket Cycle Reset! Start again! ✨", 
                type: 'system', 
                timestamp: Date.now() 
            }); 
            window.pendingRocketResetParams = null;
        }
        
        let layerCheck = document.getElementById('rocket-fullscreen-layer');
        if(layerCheck) layerCheck.remove(); 
        
        window.isRocketFlying = false;
        window.processRocketQueue();
    }, 9500); 
};

// ==== ایگزٹ (Leave) یا Minimize پر راکٹ کو مکمل ختم کرنے کا فنکشن ====
window.resetRocketSystemOnExit = function() {
    if (window.rocketAnimTimeout) {
        clearTimeout(window.rocketAnimTimeout);
        window.rocketAnimTimeout = null;
    }
    window.rocketQueue =[]; // لائن صاف کر دی
    window.isRocketFlying = false; // سٹیٹس ری سیٹ کر دیا
};