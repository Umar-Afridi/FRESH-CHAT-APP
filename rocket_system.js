window.ROCKET_LEVELS =[ 
    { level: 1, cost: 300000, img: './rocket1.png', anim: './rocket1.svg' }, 
    { level: 2, cost: 500000, img: './rocket2.png', anim: './rocket2.svg' }, 
    { level: 3, cost: 2000000, img: './rocket3.png', anim: './rocket3.svg' }, 
    { level: 4, cost: 4000000, img: './rocket4.png', anim: './rocket4.svg' } 
];

window.rocket_currentRoomExp = 0;
window.lastRocketLevel = 0;
window.rocketQueue =[];
window.isRocketFlying = false;
window.isFirstRocketLoad = true; 

window.initRocketListener = function(rid) {
    document.getElementById('rocket-trigger-btn').classList.remove('hidden');
    window.isFirstRocketLoad = true;
    window.onValue(window.ref(window.db, `rooms/${rid}/roomExp`), (snap) => { 
        window.rocket_currentRoomExp = snap.val() || 0; 
        window.updateRocketUI(window.rocket_currentRoomExp, rid); 
    });
};

window.updateRocketUI = function(exp, rid) {
    let targetLevel = 0; 
    let targetImg = window.ROCKET_LEVELS[0].img; 
    let nextThreshold = window.ROCKET_LEVELS[0].cost; 
    let prevThreshold = 0;

    for (let i = 0; i < window.ROCKET_LEVELS.length; i++) {
        if (exp >= window.ROCKET_LEVELS[i].cost) {
            targetLevel = window.ROCKET_LEVELS[i].level; 
            targetImg = window.ROCKET_LEVELS[i].img; 
            prevThreshold = window.ROCKET_LEVELS[i].cost;
            if (i < window.ROCKET_LEVELS.length - 1) { 
                nextThreshold = window.ROCKET_LEVELS[i+1].cost; 
            } else { 
                nextThreshold = exp * 1.5; 
            }
        }
    }
    
    const triggerImg = document.getElementById('main-rocket-icon'); 
    if (triggerImg) triggerImg.src = targetImg;
    document.getElementById('modal-big-rocket').src = targetImg;
    
    document.querySelectorAll('.modal-level-btn').forEach(btn => btn.classList.remove('active'));
    if(targetLevel >= 1) document.getElementById('btn-lvl-1').classList.add('active'); 
    if(targetLevel >= 2) document.getElementById('btn-lvl-2').classList.add('active'); 
    if(targetLevel >= 3) document.getElementById('btn-lvl-3').classList.add('active'); 
    if(targetLevel >= 4) document.getElementById('btn-lvl-4').classList.add('active');
    
    let percentage = 0;
    if (targetLevel < 4) { 
        percentage = ((exp - prevThreshold) / (nextThreshold - prevThreshold)) * 100; 
    } else { 
        percentage = 100; 
    }
    percentage = Math.max(0, Math.min(100, percentage));
    document.getElementById('rocket-tube-fill').style.height = `${percentage}%`; 
    document.getElementById('rocket-tube-text').innerText = `${Math.floor(percentage)}%`;

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
                name: "System", 
                text: "✨ Rocket Cycle Reset! Start again! ✨", 
                type: 'system', 
                timestamp: Date.now() 
            });
        }, 5000);
    }
    
    window.lastRocketLevel = targetLevel;
};

window.openRocketDetails = () => {
    document.getElementById('rocket-details-modal').style.display = 'flex';
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
    // 1. پرانی لیئر کو ریموو کریں
    let oldLayer = document.getElementById('rocket-fullscreen-layer');
    if (oldLayer) oldLayer.remove();
    
    // 2. نیا کنٹینر بنائیں
    const layer = document.createElement('div');
    layer.id = 'rocket-fullscreen-layer'; 
    
    document.documentElement.appendChild(layer); 
    
    // فل سکرین اور مائیکس کے اوپر شو کرنے کی سیٹنگ
    layer.style.cssText = `
        position: fixed !important; 
        top: 0 !important; 
        bottom: 0 !important; 
        left: 0 !important; 
        right: 0 !important; 
        width: 100vw !important; 
        height: 100vh !important; 
        z-index: 2147483647 !important; 
        pointer-events: none !important; 
        background: transparent !important; 
        display: flex !important; 
        align-items: center !important; 
        justify-content: center !important;
        transform: translateZ(99999px) !important; 
    `;
    
    const audio = document.getElementById('rocket-sound');
    if (audio) {
        audio.currentTime = 0;
        let playPromise = audio.play();
        if (playPromise !== undefined) playPromise.catch(e => console.log(e));
    }

    if(typeof window.broadcastRocketLaunch === "function"){
        window.broadcastRocketLaunch(rid, window.currentRoomData?.roomName || 'A Room', targetLevel, imgSrc);
    }

    const cacheBusterSrc = animSrc + "?t=" + Date.now();

    // 🚨 راکٹ کا سائز یہاں سے بڑا کیا گیا ہے (scale 1.4) 🚨
    layer.innerHTML = `
        <img src="${cacheBusterSrc}" style="
            position: absolute !important; 
            width: 100% !important; 
            height: 100% !important; 
            object-fit: contain !important; 
            z-index: 2147483647 !important; 
            pointer-events: none !important;
            transform: scale(1.4) !important; /* 👈 سائز اور بڑا کر دیا گیا ہے */
            transform-origin: center center !important;
        ">
    `;

    // 9.5 سیکنڈ کا ٹائمر
    setTimeout(() => {
        if (isMaxLevel) { 
            window.set(window.ref(window.db, `rooms/${rid}/roomExp`), 0); 
            window.push(window.ref(window.db, `rooms/${rid}/messages`), { 
                name: "System", 
                text: "✨ Rocket Cycle Reset! Start again! ✨", 
                type: 'system', 
                timestamp: Date.now() 
            }); 
        }
        
        layer.remove(); 
        window.isRocketFlying = false;
        
        window.processRocketQueue();
    }, 9500); 
};