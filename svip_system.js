// ==========================================
// SVIP SYSTEM LOGIC & UI (YARAAN APP) - FIXED WITH SWIPE, IMAGE LOADING & PERFECT CENTER TABS
// ==========================================

const SVIP_LEVELS =[
    { level: 1, req: 15000, name: "SVIP1", color: "from-teal-300 to-teal-500", theme: "silver" },
    { level: 2, req: 50000, name: "SVIP2", color: "from-green-400 to-green-600", theme: "green" },
    { level: 3, req: 100000, name: "SVIP3", color: "from-blue-400 to-blue-700", theme: "blue" },
    { level: 4, req: 150000, name: "SVIP4", color: "from-purple-400 to-purple-700", theme: "purple" },
    { level: 5, req: 200000, name: "SVIP5", color: "from-red-500 to-yellow-500", theme: "red" }
];

let currentUserTotalRecharge = 0;
let currentViewingSVIP = 1;
let svipTouchStartX = 0;
let svipTouchEndX = 0;

// ====== GLOBAL RECHARGE HOOK (یہ والیٹ سے کال ہوگا) ======
window.addRechargeToSVIP = async (rechargeAmount) => {
    if(!window.currentUser) return;
    const userRef = window.ref(window.db, `users/${window.currentUser.uid}`);
    const snap = await window.get(userRef);
    const data = snap.val() || {};
    
    let newTotal = (data.totalRecharge || 0) + rechargeAmount;
    
    // نیا لیول چیک کریں
    let newLevel = 0;
    for (let i = SVIP_LEVELS.length - 1; i >= 0; i--) {
        if (newTotal >= SVIP_LEVELS[i].req) {
            newLevel = SVIP_LEVELS[i].level;
            break;
        }
    }

    let updates = { totalRecharge: newTotal };
    if (newLevel > (data.svipLevel || 0)) {
        updates.svipLevel = newLevel;
        // نیا چیٹ ببل گفٹ کریں
        await checkAndGiveChatBubble(newLevel, data.unlockedFrames || {});
    }

    await window.update(userRef, updates);
};
// =========================================================

window.openSVIPModal = async () => {
    // بغیر کسی پوپ اپ کے سیدھا ڈیٹا لوڈ کریں گے
    const snap = await window.get(window.ref(window.db, `users/${window.currentUser.uid}`));
    const data = snap.val() || {};
    currentUserTotalRecharge = data.totalRecharge || 0; 
    
    let actualLevel = data.svipLevel || 0;
    currentViewingSVIP = actualLevel > 0 ? actualLevel : 1; 
    
    createSVIPModalHTML();
    renderSVIPUI(currentViewingSVIP);
    
    document.getElementById('svip-full-modal').style.display = 'flex';
};

window.closeSVIPModal = () => {
    document.getElementById('svip-full-modal').style.display = 'none';
};

window.changeSVIPView = (level) => {
    if(level >= 1 && level <= 5) {
        currentViewingSVIP = level;
        renderSVIPUI(level);
    }
};

// ====== SWIPE (TOUCH) LOGIC ======
window.handleSVIPTouchStart = (e) => {
    svipTouchStartX = e.changedTouches[0].screenX;
};

window.handleSVIPTouchEnd = (e) => {
    svipTouchEndX = e.changedTouches[0].screenX;
    let diff = svipTouchStartX - svipTouchEndX;
    
    if (diff > 50) { // Swipe Left (اگلے لیول پر جائیں)
        if (currentViewingSVIP < 5) changeSVIPView(currentViewingSVIP + 1);
    } else if (diff < -50) { // Swipe Right (پچھلے لیول پر جائیں)
        if (currentViewingSVIP > 1) changeSVIPView(currentViewingSVIP - 1);
    }
};

async function checkAndGiveChatBubble(level, unlockedFrames) {
    let bubbleId = `svip_bubble_lvl_${level}`;
    let hasBubble = false;
    for(let key in unlockedFrames) {
        if(unlockedFrames[key].isBubble && unlockedFrames[key].svipLevel === level) {
            hasBubble = true; break;
        }
    }
    if(!hasBubble) {
        let bubbleData = {
            name: `SVIP${level} Chat Bubble`,
            img: `./chat_bubble${level}.svg`, // صرف Prop House اور SVIP Modal میں آئیکن کے لیے
            isBubble: true,
            svipLevel: level,
            bubbleClass: `svip-bubble-${level}`, // یہ ہماری نئی کلر والی CSS کلاس کو کال کرے گا
            purchasedAt: Date.now(),
            expiry: 4102444800000, 
            status: 'unused'
        };
        await window.update(window.ref(window.db, `users/${window.currentUser.uid}/unlockedFrames/${bubbleId}`), bubbleData);
    }
}

function createSVIPModalHTML() {
    if (document.getElementById('svip-full-modal')) return;

    const html = `
    <div id="svip-full-modal" ontouchstart="handleSVIPTouchStart(event)" ontouchend="handleSVIPTouchEnd(event)" class="fixed inset-0 z-[9999] hidden flex-col bg-[#0a0a0a] text-white overflow-hidden font-sans">
        
        <!-- Top Section -->
        <div class="relative w-full h-[50%] bg-[#111] overflow-hidden flex flex-col items-center flex-shrink-0" id="svip-bg-container">
            
            <!-- SVG Background -->
            <img src="./svip_bg.svg" class="absolute inset-0 w-full h-full object-cover z-0" onerror="this.style.display='none'">
            <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#0a0a0a] z-10"></div>
            
            <!-- Header -->
            <div class="w-full p-4 pt-6 flex justify-between items-center z-50 relative">
                <i class="fa-solid fa-chevron-left text-2xl cursor-pointer drop-shadow-lg p-2" onclick="closeSVIPModal()"></i>
                <h2 class="text-xl font-extrabold tracking-widest drop-shadow-lg">SVIP</h2>
                <i class="fa-regular fa-circle-question text-xl drop-shadow-lg p-2"></i>
            </div>
            
            <!-- TABS (Animated Carousel Style) -->
            <div class="w-full h-12 relative z-40 overflow-hidden mt-2" id="svip-tabs">
                <span onclick="changeSVIPView(1)" class="absolute transform -translate-x-1/2 transition-all duration-300 cursor-pointer" id="tab-svip-1">SVIP1</span>
                <span onclick="changeSVIPView(2)" class="absolute transform -translate-x-1/2 transition-all duration-300 cursor-pointer" id="tab-svip-2">SVIP2</span>
                <span onclick="changeSVIPView(3)" class="absolute transform -translate-x-1/2 transition-all duration-300 cursor-pointer" id="tab-svip-3">SVIP3</span>
                <span onclick="changeSVIPView(4)" class="absolute transform -translate-x-1/2 transition-all duration-300 cursor-pointer" id="tab-svip-4">SVIP4</span>
                <span onclick="changeSVIPView(5)" class="absolute transform -translate-x-1/2 transition-all duration-300 cursor-pointer" id="tab-svip-5">SVIP5</span>
            </div>

            <!-- Main SVIP SVG Medal (Size Reduced to w-44 h-44) -->
            <div class="absolute inset-0 flex items-center justify-center z-30 pointer-events-none mt-16">
                <img id="svip-main-emblem" src="./svip_1.svg" class="w-44 h-44 object-contain drop-shadow-[0_15px_25px_rgba(255,215,0,0.4)] animate-pulse transition-opacity duration-300" style="opacity: 0; color: transparent;" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';">
            </div>
        </div>

        <!-- Bottom Section (Progress and Identification) -->
        <div class="flex-1 bg-[#0a0a0a] w-full px-5 relative z-20 flex flex-col items-center pb-5">
            
            <!-- Progress Box -->
            <div class="w-full bg-[#1a150e] border border-[#3a2a18] rounded-2xl p-5 -mt-8 shadow-2xl relative z-50">
                <div class="flex justify-between text-xs text-yellow-500 font-bold mb-2">
                    <span id="svip-progress-dot" class="animate-pulse">●</span>
                    <span id="svip-target-text">SVIP1</span>
                </div>
                <div class="w-full bg-black rounded-full h-1.5 mb-3 overflow-hidden">
                    <div id="svip-progress-bar" class="h-full bg-gradient-to-r from-yellow-300 to-yellow-600 rounded-full transition-all duration-1000" style="width: 0%;"></div>
                </div>
                <div class="flex justify-between items-end">
                    <span class="text-[10px] text-gray-400 w-2/3 leading-tight" id="svip-req-desc">You need ...</span>
                    <span class="text-xs text-yellow-500 font-bold" id="svip-points-text">0/15,000</span>
                </div>
            </div>

            <div class="mt-6 mb-4 flex items-center justify-center gap-4 w-full">
                <div class="h-px bg-gradient-to-r from-transparent to-yellow-600 w-16"></div>
                <span class="text-yellow-500 font-black tracking-widest text-[11px] italic">IDENTIFICATION</span>
                <div class="h-px bg-gradient-to-l from-transparent to-yellow-600 w-16"></div>
            </div>

            <!-- Bottom 3 Icons -->
            <div class="grid grid-cols-3 gap-3 w-full max-w-sm">
                <!-- Box 1: Medal -->
                <div class="bg-gradient-to-b from-[#2a2015] to-[#15100a] border border-[#3a2a18] rounded-xl p-2 flex flex-col items-center justify-center shadow-lg h-28">
                    <img id="priv-medal-img" src="./svip_1.svg" class="w-14 h-14 object-contain drop-shadow-md mb-2 transition-opacity duration-300" style="opacity: 0; color: transparent;" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';">
                    <span class="text-gray-300 text-[10px] font-bold text-center">SVIP Medal</span>
                </div>
                
                <!-- Box 2: Badge (Size Increased to w-28 h-14) -->
                <div class="bg-gradient-to-b from-[#2a2015] to-[#15100a] border border-[#3a2a18] rounded-xl p-2 flex flex-col items-center justify-center shadow-lg h-28">
                    <img id="priv-badge-img" src="./svip1_badge.svg" class="w-28 h-14 object-contain drop-shadow-md mb-1 transition-opacity duration-300" style="opacity: 0; color: transparent;" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';">
                    <span class="text-gray-300 text-[10px] font-bold text-center">SVIP Badge</span>
                </div>
                
                <!-- Box 3: Chat Bubble -->
                <div class="bg-gradient-to-b from-[#2a2015] to-[#15100a] border border-[#3a2a18] rounded-xl p-2 flex flex-col items-center justify-center shadow-lg h-28 relative">
                    <div class="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                    <img id="priv-bubble-img" src="./chat_bubble1.svg" class="w-16 h-12 object-contain drop-shadow-md mb-2 transition-opacity duration-300" style="opacity: 0; color: transparent;" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';">
                    <span class="text-gray-300 text-[10px] font-bold text-center leading-tight">Chat Bubble</span>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function renderSVIPUI(level) {
    for(let i=1; i<=5; i++) {
        let tab = document.getElementById(`tab-svip-${i}`);
        
        // ریاضی (Math) کی مدد سے بالکل سینٹر لانا
        let offset = i - level;
        let leftPosition = 50 + (offset * 25); // 25% کا فاصلہ
        if (tab) tab.style.left = `${leftPosition}%`;

        if(i === level) {
            // Active Tab (بالکل سینٹر، بڑا اور واضح)
            if (tab) tab.className = "absolute top-0 transform -translate-x-1/2 transition-all duration-300 cursor-pointer text-white text-[22px] font-black border-b-[3px] border-yellow-500 pb-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] z-50";
        } else {
            // Inactive Tabs (سائیڈز پر، چھوٹے اور بلر)
            if (tab) tab.className = "absolute top-2 transform -translate-x-1/2 transition-all duration-300 cursor-pointer text-white/30 text-[12px] font-medium border-b-2 border-transparent pb-1 blur-[0.5px] z-10";
        }
    }

    const svipData = SVIP_LEVELS[level - 1];
    
    let emblem = document.getElementById('svip-main-emblem');
    let medal = document.getElementById('priv-medal-img');
    let badge = document.getElementById('priv-badge-img');
    let bubble = document.getElementById('priv-bubble-img');
    let imgs = [emblem, medal, badge, bubble];

    // 1. سب کو سمودھ طریقے سے غائب کریں (CSS Transition)
    imgs.forEach(img => { if(img) img.style.opacity = '0'; });

    // 2. 150 ملی سیکنڈ بعد سورس تبدیل کر کے واپس شو کروا دیں (Onload اور Cache کا مسئلہ حل)
    setTimeout(() => {
        if(emblem) emblem.src = `./svip_${level}.svg`;
        if(medal) medal.src = `./svip_${level}.svg`;
        if(badge) badge.src = `./svip${level}_badge.svg`;
        if(bubble) bubble.src = `./chat_bubble${level}.svg`;

        imgs.forEach(img => { if(img) img.style.opacity = '1'; });
    }, 150);

    let requiredRecharge = svipData.req;
    document.getElementById('svip-target-text').innerText = `SVIP${level}`;
    
    let percentage = 0;
    let diff = requiredRecharge - currentUserTotalRecharge;
    
    if (currentUserTotalRecharge >= requiredRecharge) {
        percentage = 100;
        document.getElementById('svip-req-desc').innerText = `You have unlocked SVIP${level} privileges!`;
    } else {
        percentage = (currentUserTotalRecharge / requiredRecharge) * 100;
        if(diff < 0) diff = 0;
        document.getElementById('svip-req-desc').innerText = `You need ${diff.toLocaleString()} more points to reach SVIP${level}`;
    }
    
    document.getElementById('svip-progress-bar').style.width = `${percentage}%`;
    document.getElementById('svip-points-text').innerText = `${currentUserTotalRecharge.toLocaleString()} / ${requiredRecharge.toLocaleString()}`;
}