// ================= NEW CP SYSTEM (CLEAN CODE - EDGE TO EDGE SVGs & EXACT UI) =================
// Developed for YARAAN App - External File

// CP Level Calculator
window.getCPLevel = function(cpAmount) {
    if (cpAmount >= 50000000) return 6;
    if (cpAmount >= 25000000) return 5;
    if (cpAmount >= 15000000) return 4;
    if (cpAmount >= 8000000)  return 3;
    if (cpAmount >= 3000000)  return 2;
    return 1;
};

// 1. CSS Injection for Popups & Bottom Bar
const cpPopupStyles = `
<style>
    .cp-popup-box {
        border-radius: 24px !important;
        padding: 0 !important;
        overflow: hidden !important; 
        background: transparent !important; 
        width: 85% !important;
        max-width: 320px !important;
    }
    .cp-popup-box .swal2-html-container {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
    }
    .cp-bottom-search-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        background: #ffffff;
        padding: 15px 20px 25px 20px;
        box-shadow: 0 -10px 25px rgba(0,0,0,0.08);
        z-index: 7000;
        display: flex;
        flex-direction: column;
        align-items: center;
        border-top-left-radius: 24px;
        border-top-right-radius: 24px;
        animation: slideUpCP 0.3s ease-out;
    }
    @keyframes slideUpCP {
        from { opacity: 0; transform: scale(0.98); }
        to { opacity: 1; transform: scale(1); }
    }
    .cp-bottom-search-text {
        font-size: 12px;
        color: #9ca3af;
        text-align: center;
        margin-bottom: 15px;
        line-height: 1.4;
    }
    .cp-bottom-search-btn {
        width: 100%;
        background: #fb7185;
        color: white;
        font-weight: bold;
        font-size: 16px;
        padding: 16px 0;
        border-radius: 30px;
        border: none;
        box-shadow: 0 5px 15px rgba(251,113,133,0.3);
        cursor: pointer;
        transition: transform 0.2s;
    }
    .cp-bottom-search-btn:active {
        transform: scale(0.98);
    }
    .swal2-actions.cp-hide-actions { display: none !important; }
</style>
`;
document.head.insertAdjacentHTML("beforeend", cpPopupStyles);

// ================= LONG PRESS LOGIC =================
window.cpPressTimer = null;
window.isCpLongPressed = false;

window.startCpPress = (uid, name, pic) => {
    window.isCpLongPressed = false;
    window.cpPressTimer = setTimeout(() => {
        window.isCpLongPressed = true;
        window.promptRemoveCP(uid, name, pic);
    }, 700); 
};

window.endCpPress = () => {
    if(window.cpPressTimer) clearTimeout(window.cpPressTimer);
};

window.handleCpPartnerClick = (uid) => {
    if (!window.isCpLongPressed) {
        window.openFullProfileView(uid);
    }
};
// ====================================================

// 2. Load CP FPV UI (Main SVG & DPs)
window.loadCPData = function(userData) {
    let isMe = document.getElementById('fpv-edit-btn').style.display !== 'none';
    let container = document.getElementById('cp-svg-container');
    if (!container) return;

    // 🔥 FIX: زبردستی flex-col اپلائی کیا ہے تاکہ Love Store اور Card دائیں بائیں پچک نہ جائیں 🔥
    container.className = "w-full flex flex-col items-center relative px-2";

    let myPic = userData.photoURL || 'https://placehold.co/100';
    let myName = userData.username || 'User';

    // Top Header HTML (Love Store & Couple Title - 100% Fixed Layout)
    let headerHTML = `
        <div class="w-[calc(100%+20px)] -ml-[10px] mx-auto -mt-[50px] flex flex-col items-center">
            <div class="w-full bg-pink-50 rounded-xl p-3 flex justify-between items-center shadow-sm border border-pink-100 mb-3">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-store text-pink-400 text-lg"></i>
                    <span class="text-pink-500 font-bold text-[14px]">Love Store</span>
                </div>
                <button class="bg-white text-pink-500 font-bold text-[12px] px-5 py-1.5 rounded-full shadow-sm hover:bg-pink-100 active:scale-95 transition">Go</button>
            </div>
            <div class="w-full flex items-center gap-1.5 px-1 mb-1 mt-1">
                <span class="text-gray-800 font-extrabold text-[15px]">Couple</span>
                <div onclick="window.showCPRules()" class="w-[15px] h-[15px] rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-400 text-[9px] cursor-pointer active:scale-90 transition shadow-sm">
                    <i class="fa-solid fa-question"></i>
                </div>
            </div>
        </div>
    `;

    if (userData.cp && userData.cp.partnerUid) {
        let cpPts = userData.cp.cpGiftAmount || 0;
        let cpLevel = window.getCPLevel(cpPts);
        let partnerPic = userData.cp.partnerPic || 'https://placehold.co/100';
        let partnerName = userData.cp.partnerName || 'Partner';
        
        // Calculate Days & Date
        let cpTimestamp = userData.cp.timestamp || Date.now();
        let startDate = new Date(cpTimestamp);
        let formattedDate = `${startDate.getFullYear()}-${String(startDate.getMonth()+1).padStart(2,'0')}-${String(startDate.getDate()).padStart(2,'0')}`;
        let daysElapsed = Math.floor((Date.now() - cpTimestamp) / (1000 * 60 * 60 * 24));
        let daysText = daysElapsed === 0 ? "0 days" : `${daysElapsed} days`;

        let pressEvents = isMe ? `
            onmousedown="startCpPress('${userData.cp.partnerUid}', '${partnerName}', '${partnerPic}')"
            onmouseup="endCpPress()"
            onmouseleave="endCpPress()"
            ontouchstart="startCpPress('${userData.cp.partnerUid}', '${partnerName}', '${partnerPic}')"
            ontouchend="endCpPress()"
            ontouchmove="endCpPress()"
        ` : '';

        // پرائیویسی لاجک: اگر اپنی پروفائل ہے تو پوائنٹس شو ہوں گے ورنہ غائب
        let pointsPillHTML = isMe ? `
            <div class="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 bg-white px-1.5 py-[1px] rounded-full flex items-center justify-center gap-0.5 shadow-sm border border-pink-100 z-30 w-max pointer-events-none">
                <i class="fa-solid fa-heart text-pink-500 text-[6px] flex-shrink-0 mt-[1px]"></i>
                <span class="text-pink-500 text-[6.5px] font-black leading-tight whitespace-nowrap">${cpPts.toLocaleString()}</span>
            </div>
        ` : '';

        // w-[96%] کو w-full کر دیا گیا ہے تاکہ وائٹ سپیس ختم ہو جائے
        container.innerHTML = headerHTML + `
            <div class="relative w-full mx-auto flex justify-center items-center rounded-[20px] overflow-hidden shadow-md">
                <img src="./cp_lv${cpLevel}.svg" class="w-full h-auto drop-shadow-md z-10 pointer-events-none" onerror="this.src='https://placehold.co/350x200?text=CP+Level+${cpLevel}'">
                
                <!-- Left DP (User) -->
                <div class="absolute z-20 flex flex-col items-center" style="left: 22%; top: 50%; transform: translate(-50%, -50%);">
                    <img src="${myPic}" class="w-[55px] h-[55px] rounded-full object-cover border-[2.5px] border-white shadow-md">
                    <span class="text-gray-800 text-[9px] font-extrabold mt-1.5 bg-white/80 px-2.5 py-0.5 rounded-full backdrop-blur-sm shadow-sm truncate max-w-[65px]">${myName}</span>
                </div>

                <!-- Center Date & Days Display -->
                <div class="absolute z-20 flex flex-col items-center justify-center bg-white/20 backdrop-blur-md border border-white/40 rounded-full px-2 py-[2px] shadow-sm" style="left: 50%; top: 88%; transform: translate(-50%, -50%);">
                    <span class="text-white text-[7px] font-semibold tracking-wide drop-shadow-sm leading-tight">${formattedDate}-now</span>
                    <span class="text-white font-extrabold text-[8px] drop-shadow-md leading-tight">${daysText}</span>
                </div>

                <!-- Right DP (Partner) -->
                <div class="absolute z-20 flex flex-col items-center cursor-pointer transition" style="left: 78%; top: 50%; transform: translate(-50%, -50%);" 
                     ${pressEvents} 
                     onclick="handleCpPartnerClick('${userData.cp.partnerUid}')">
                    
                    <div class="relative w-[55px] h-[55px]">
                        <img src="${partnerPic}" class="w-full h-full rounded-full object-cover border-[2.5px] border-white shadow-md ${isMe ? 'active:scale-95' : 'hover:scale-105'}">
                        
                        ${pointsPillHTML}
                    </div>
                    <span class="text-gray-800 text-[9px] font-extrabold mt-3.5 bg-white/80 px-2.5 py-0.5 rounded-full backdrop-blur-sm shadow-sm truncate max-w-[65px]">${partnerName}</span>
                </div>
                
                ${isMe ? `<div class="absolute -bottom-7 w-full flex justify-center"><span class="text-[9px] text-gray-400 italic font-medium">Long press partner's DP to remove</span></div>` : ''}
            </div>
        `;
    } else {
        container.innerHTML = headerHTML + `
            <div class="relative w-full mx-auto flex justify-center items-center rounded-[20px] overflow-hidden shadow-md">
                <img src="./cp_main.svg" class="w-full h-auto drop-shadow-md z-10 pointer-events-none" onerror="this.src='https://placehold.co/350x200?text=CP+Main'">
                
                <div class="absolute z-20 flex flex-col items-center" style="left: 22%; top: 50%; transform: translate(-50%, -50%);">
                    <img src="${myPic}" class="w-[55px] h-[55px] rounded-full object-cover border-[2.5px] border-white shadow-md">
                    <span class="text-gray-800 text-[9px] font-extrabold mt-1.5 bg-white/80 px-2.5 py-0.5 rounded-full backdrop-blur-sm shadow-sm truncate max-w-[65px]">${myName}</span>
                </div>

                <div class="absolute z-20 flex flex-col items-center" style="left: 78%; top: 50%; transform: translate(-50%, -50%);">
                    ${isMe ? `
                    <div onclick="inviteCP()" class="w-[50px] h-[50px] rounded-full bg-white/40 backdrop-blur-md border-2 border-dashed border-pink-400 flex items-center justify-center cursor-pointer hover:bg-pink-100 transition shadow-sm active:scale-95">
                        <i class="fa-solid fa-plus text-xl text-pink-500 drop-shadow-sm"></i>
                    </div>
                    <span class="text-pink-600 text-[9px] font-black mt-2 bg-white/90 px-3 py-0.5 rounded-full shadow-sm">Invite</span>
                    ` : `
                    <div class="w-[50px] h-[50px] rounded-full bg-gray-100/40 backdrop-blur-md border-2 border-dashed border-gray-300 flex items-center justify-center shadow-sm">
                        <span class="text-gray-400 font-bold text-xs">?</span>
                    </div>
                    <span class="text-gray-500 text-[9px] font-bold mt-2 bg-white/80 px-2.5 py-0.5 rounded-full shadow-sm">Single</span>
                    `}
                </div>
            </div>
        `;
    }
};

// 3. GLOBAL SEARCH OVERRIDE (For CP ONLY & Navigation Fix)
window.isCpSearchMode = false;

window.inviteCP = () => {
    if (!window.currentUser) return Swal.fire('Error', 'Login Required', 'error');
    
    if (!window.cpSearchOverrideDone) {
        const originalSearch = window.executeGlobalSearch;
        
        window.executeGlobalSearch = async () => {
            await originalSearch(); 
            
            if (window.isCpSearchMode) {
                setTimeout(() => {
                    const resultArea = document.getElementById('global-search-results');
                    if (!resultArea) return;

                    const followBtn = resultArea.querySelector('button');
                    
                    if (followBtn) {
                        followBtn.style.display = 'none';
                        
                        const onclickStr = followBtn.getAttribute('onclick') || "";
                        const uidMatch = onclickStr.match(/sendReq\('([^']+)'/);
                        let targetUid = uidMatch ? uidMatch[1] : "unknown";
                        
                        const targetName = resultArea.querySelector('.text-gray-900').innerText.split(' ')[0];
                        const targetPic = resultArea.querySelector('img').src; 
                        const targetCustomId = document.getElementById('global-search-input').value; 
                        
                        const oldBar = document.getElementById('cp-search-bottom-bar');
                        if(oldBar) oldBar.remove();

                        const bottomBarHtml = `
                            <div id="cp-search-bottom-bar" class="cp-bottom-search-bar">
                                <p class="cp-bottom-search-text">Sending an invitation costs 6000 coins. Successful binding<br>rewards a showcase ring 1</p>
                                <button class="cp-bottom-search-btn" onclick="event.stopPropagation(); showCPConfirmationPopup('${targetUid}', '${targetName}', '${targetPic}', '${targetCustomId}')">
                                    Invite and bind CP
                                </button>
                            </div>
                        `;
                        resultArea.insertAdjacentHTML('beforeend', bottomBarHtml);
                        resultArea.style.paddingBottom = "150px";

                        const userCard = resultArea.querySelector('.flex.items-center.justify-between.bg-white');
                        if(userCard) {
                            userCard.removeAttribute('onclick');
                            userCard.style.cursor = 'default';
                        }
                    }
                }, 50); 
            }
        };

        const originalClose = window.closeGlobalSearch;
        window.closeGlobalSearch = () => {
            let wasCpMode = window.isCpSearchMode; 
            window.isCpSearchMode = false; 
            
            const oldBar = document.getElementById('cp-search-bottom-bar');
            if(oldBar) oldBar.remove();
            const resultArea = document.getElementById('global-search-results');
            if(resultArea) resultArea.style.paddingBottom = "0px";
            
            originalClose(); 
            
            // 🔥 Navigation Fix: اگر CP موڈ تھا تو واپس ڈائریکٹ فل پروفائل پر لے جاؤ
            if (wasCpMode) {
                setTimeout(() => {
                    window.openFullProfileView(window.currentUser.uid);
                }, 300); 
            }
        };

        window.cpSearchOverrideDone = true; 
    }

    window.isCpSearchMode = true; 
    window.closeFullProfileView(); 
    window.openGlobalSearch(); 
    Swal.fire({toast:true, icon:'info', title:'Search a user by ID to invite for CP', position:'top', showConfirmButton:false, timer:2500});
};

// 4. THE BEAUTIFUL INVITATION POPUP (Sender View)
window.showCPConfirmationPopup = async (targetUid, targetName, targetPic, targetId) => {
    if (targetUid === "unknown") {
        const uidSnap = await window.get(window.ref(window.db, `idToUid/${targetId}`));
        if(uidSnap.exists()) {
            targetUid = uidSnap.val();
        } else {
            return Swal.fire('Error', 'User ID not found properly.', 'error');
        }
    }

    window.closeGlobalSearch(); 

    const htmlContent = `
        <div style="display: flex; flex-direction: column; width: 100%; border-radius: 24px; overflow: hidden; background: #fff; box-shadow: 0 15px 30px rgba(0,0,0,0.15);">
            <div style="height: 170px; position: relative; background: #fff0f5; width: 100%;">
                <img src="./cp_become.svg" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;" onerror="this.style.display='none'">
                <div style="position: relative; z-index: 10; text-align: center; padding-top: 30px;">
                    <div style="color: #e11d48; font-weight: 900; font-size: 18px; margin-bottom: 10px; text-shadow: 0px 1px 2px rgba(255,255,255,0.8);">Form CP</div>
                    <p style="color: #374151; font-size: 15px; font-weight: 700; line-height: 1.3; margin: 0; padding: 0 10px;">Are you sure you want to invite them<br>to be your CP?</p>
                </div>
            </div>
            <div style="background: #ffffff; padding: 15px 20px 20px 20px; display: flex; flex-direction: column; align-items: center; position: relative;">
                <div style="margin-top: -45px; position: relative; z-index: 20; background: #fff; border-radius: 50%; padding: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <img src="${targetPic}" style="width: 75px; height: 75px; border-radius: 50%; object-fit: cover;">
                </div>
                <span style="color: #1f2937; font-weight: 800; font-size: 18px; margin-top: 10px; margin-bottom: 2px;">${targetName}</span>
                <span style="color: #9ca3af; font-size: 12px; font-weight: 500; margin-bottom: 20px;">ID: ${targetId}</span>
                <div style="display: flex; width: 100%; gap: 15px;">
                    <button onclick="Swal.close(); setTimeout(()=>window.openFullProfileView('${window.currentUser.uid}'), 300);" style="flex: 1; background: #fce7f3; color: #e11d48; font-weight: 800; font-size: 15px; border-radius: 30px; padding: 12px 0; border: none; cursor: pointer; outline: none;">Cancel</button>
                    <button onclick="window.processCPRequest('${targetUid}')" style="flex: 1; background: #fb7185; color: #fff; font-weight: 800; font-size: 15px; border-radius: 30px; padding: 12px 0; border: none; box-shadow: 0 4px 15px rgba(251,113,133,0.4); cursor: pointer; outline: none;">Invite</button>
                </div>
            </div>
        </div>
    `;

    Swal.fire({
        html: htmlContent, 
        showConfirmButton: false,
        allowOutsideClick: false, 
        allowEscapeKey: false,
        customClass: { popup: 'cp-popup-box', actions: 'swal2-actions cp-hide-actions' },
        background: 'transparent', backdrop: 'rgba(0,0,0,0.6)', padding: 0
    });
};

// 5. Send Request Logic
window.processCPRequest = async (targetUid) => {
    Swal.close(); // بند کرو فوراً
    
    try {
        const mySnap = await window.get(window.ref(window.db, `users/${window.currentUser.uid}`));
        const targetSnap = await window.get(window.ref(window.db, `users/${targetUid}`));
        
        if (mySnap.val().cp && mySnap.val().cp.partnerUid) return Swal.fire({ icon: 'error', title: 'Error', text: 'You are already in a CP.', background: '#111', color: '#fff' });
        if (targetSnap.val() && targetSnap.val().cp && targetSnap.val().cp.partnerUid) return Swal.fire({ icon: 'error', title: 'Error', text: 'This user is already in a CP.', background: '#111', color: '#fff' });

        await window.set(window.ref(window.db, `users/${targetUid}/inbox/cpRequests/${window.currentUser.uid}`), {
            fromName: window.currentUser.displayName,
            fromUid: window.currentUser.uid,
            fromPic: window.currentUser.photoURL,
            type: 'cpRequest',
            timestamp: Date.now()
        });

        Swal.fire({
            html: `
                <div style="padding: 25px 20px; text-align: center; background: #fff; border-radius: 24px;">
                    <p style="font-size: 16px; color: #1f2937; font-weight: 600; margin-bottom: 25px; line-height: 1.4;">The invitation has been sent<br>and is waiting to be received</p>
                    <button onclick="Swal.close(); setTimeout(()=>window.openFullProfileView('${window.currentUser.uid}'), 300);" style="width: 100%; background: #fb7185; color: white; padding: 14px; border-radius: 30px; font-weight: bold; border: none; font-size: 15px; cursor: pointer; box-shadow: 0 4px 15px rgba(251,113,133,0.4); outline: none;">Confirm</button>
                </div>
            `,
            showConfirmButton: false,
            allowOutsideClick: false, 
            allowEscapeKey: false,
            customClass: { popup: 'cp-popup-box' },
            background: 'transparent', backdrop: 'rgba(0,0,0,0.6)', padding: 0
        });

    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: error.message, background: '#111', color: '#fff' });
    }
};

// 6. THE BEAUTIFUL BREAKUP POPUP (Long Press View)
window.promptRemoveCP = (partnerUid, partnerName, partnerPic) => {
    const htmlContent = `
        <div style="display: flex; flex-direction: column; width: 100%; border-radius: 24px; overflow: hidden; background: #fff; box-shadow: 0 15px 30px rgba(0,0,0,0.15);">
            <div style="height: 170px; position: relative; background: #f3f4f6; width: 100%;">
                <img src="./cp_breakup.svg" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;" onerror="this.style.display='none'">
                <div style="position: relative; z-index: 10; text-align: center; padding-top: 30px;">
                    <div style="color: #4b5563; font-weight: 900; font-size: 18px; margin-bottom: 10px;">Break CP</div>
                    <p style="color: #374151; font-size: 15px; font-weight: 700; line-height: 1.3; margin: 0; padding: 0 10px;">Are you sure you want to end your<br>relationship with them?</p>
                </div>
            </div>
            <div style="background: #ffffff; padding: 15px 20px 20px 20px; display: flex; flex-direction: column; align-items: center; position: relative;">
                <div style="margin-top: -45px; position: relative; z-index: 20; background: #fff; border-radius: 50%; padding: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <img src="${partnerPic}" style="width: 75px; height: 75px; border-radius: 50%; object-fit: cover; filter: grayscale(40%);">
                </div>
                <span style="color: #1f2937; font-weight: 800; font-size: 18px; margin-top: 10px; margin-bottom: 25px;">${partnerName}</span>
                <div style="display: flex; width: 100%; gap: 15px;">
                    <button onclick="Swal.close();" style="flex: 1; background: #e5e7eb; color: #4b5563; font-weight: 800; font-size: 15px; border-radius: 30px; padding: 12px 0; border: none; cursor: pointer; outline: none;">Cancel</button>
                    <button onclick="window.executeBreakup('${partnerUid}', '${partnerName}', '${partnerPic}')" style="flex: 1; background: #374151; color: #fff; font-weight: 800; font-size: 15px; border-radius: 30px; padding: 12px 0; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.2); cursor: pointer; outline: none;">Breakup</button>
                </div>
            </div>
        </div>
    `;

    Swal.fire({
        html: htmlContent, 
        showConfirmButton: false,
        allowOutsideClick: false, 
        allowEscapeKey: false,
        customClass: { popup: 'cp-popup-box', actions: 'swal2-actions cp-hide-actions' },
        background: 'transparent', backdrop: 'rgba(0,0,0,0.6)', padding: 0
    });
};

// 7. Execute Breakup (Instant Clear)
window.executeBreakup = async (partnerUid, partnerName, partnerPic) => {
    Swal.close(); // سکرین فوراً کلئیر

    await window.update(window.ref(window.db, `users/${window.currentUser.uid}`), { cp: null });
    await window.update(window.ref(window.db, `users/${partnerUid}`), { cp: null });

    await window.set(window.ref(window.db, `users/${partnerUid}/inbox/cpNotifs/${Date.now()}`), {
        type: 'breakup',
        fromName: window.currentUser.displayName,
        fromPic: window.currentUser.photoURL,
        timestamp: Date.now()
    });

    Swal.fire({toast:true, icon: 'success', title: 'Relationship Ended.', position: 'top', timer: 2000, showConfirmButton: false});
    
    if (document.getElementById('full-profile-view') && !document.getElementById('full-profile-view').classList.contains('hidden') && window.viewingProfileUid === window.currentUser.uid) {
        window.openFullProfileView(window.currentUser.uid); 
    }
};


// 8. LIVE LISTENER FOR RECEIVER (GLOBAL FULL SCREEN POPUPS)
window.isCPPopupShowing = false; 
let cpListenerActive = false;

setInterval(() => {
    if (window.currentUser && window.db && !cpListenerActive) {
        cpListenerActive = true;
        
        // --- ONE UNIFIED LISTENER FOR INBOX ---
        const inboxRef = window.ref(window.db, `users/${window.currentUser.uid}/inbox`);

        window.onValue(inboxRef, async (snap) => {
            const data = snap.val();
            if (!data) return;

            // 1. Breakup Check
            if (data.cpNotifs && !window.isCPPopupShowing) {
                const notifKeys = Object.keys(data.cpNotifs);
                if (notifKeys.length > 0) {
                    const firstKey = notifKeys[0];
                    const notifData = data.cpNotifs[firstKey];
                    
                    if (notifData.type === 'breakup') {
                        window.isCPPopupShowing = true; // Lock set
                        
                        const htmlContent = `
                            <div style="display: flex; flex-direction: column; width: 100%; border-radius: 24px; overflow: hidden; background: #fff; box-shadow: 0 15px 30px rgba(0,0,0,0.15);">
                                <div style="height: 170px; position: relative; background: #f3f4f6; width: 100%;">
                                    <img src="./cp_breakup.svg" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;" onerror="this.style.display='none'">
                                    <div style="position: relative; z-index: 10; text-align: center; padding-top: 30px;">
                                        <div style="color: #4b5563; font-weight: 900; font-size: 18px; margin-bottom: 10px;">Relationship Ended</div>
                                        <p style="color: #374151; font-size: 15px; font-weight: 700; line-height: 1.3; margin: 0; padding: 0 10px;">${notifData.fromName} has ended the<br>CP relationship.</p>
                                    </div>
                                </div>
                                <div style="background: #ffffff; padding: 15px 20px 20px 20px; display: flex; flex-direction: column; align-items: center; position: relative;">
                                    <div style="margin-top: -45px; position: relative; z-index: 20; background: #fff; border-radius: 50%; padding: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                                        <img src="${notifData.fromPic}" style="width: 75px; height: 75px; border-radius: 50%; object-fit: cover; filter: grayscale(100%);">
                                    </div>
                                    <span style="color: #1f2937; font-weight: 800; font-size: 18px; margin-top: 10px; margin-bottom: 25px;">${notifData.fromName}</span>
                                    <div style="display: flex; width: 100%;">
                                        <!-- 🔥 Instant OK Button -->
                                        <button onclick="window.confirmBreakupOk('${firstKey}')" style="width: 100%; background: #374151; color: #fff; font-weight: 800; font-size: 15px; border-radius: 30px; padding: 12px 0; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.2); cursor: pointer; outline: none;">OK</button>
                                    </div>
                                </div>
                            </div>
                        `;

                        Swal.fire({
                            html: htmlContent, 
                            showConfirmButton: false,
                            allowOutsideClick: false, 
                            allowEscapeKey: false,
                            customClass: { popup: 'cp-popup-box', actions: 'swal2-actions cp-hide-actions' },
                            background: 'transparent', backdrop: 'rgba(0,0,0,0.8)', padding: 0
                        });
                        return; 
                    }
                }
            }

            // 2. CP Request Check
            if (data.cpRequests && !window.isCPPopupShowing) {
                const reqKeys = Object.keys(data.cpRequests);
                if (reqKeys.length > 0) {
                    window.isCPPopupShowing = true; // Lock set
                    const firstKey = reqKeys[0];
                    const reqData = data.cpRequests[firstKey];
                    
                    let targetId = "0000";
                    const senderSnap = await window.get(window.ref(window.db, `users/${reqData.fromUid}`));
                    if(senderSnap.exists()) targetId = senderSnap.val().customId || targetId;

                    const htmlContent = `
                        <div style="display: flex; flex-direction: column; width: 100%; border-radius: 24px; overflow: hidden; background: #fff; box-shadow: 0 15px 30px rgba(0,0,0,0.15);">
                            <div style="height: 170px; position: relative; background: #fff0f5; width: 100%;">
                                <img src="./cp_become.svg" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;" onerror="this.style.display='none'">
                                <div style="position: relative; z-index: 10; text-align: center; padding-top: 30px;">
                                    <div style="color: #e11d48; font-weight: 900; font-size: 18px; margin-bottom: 10px; text-shadow: 0px 1px 2px rgba(255,255,255,0.8);">Form CP</div>
                                    <p style="color: #374151; font-size: 15px; font-weight: 700; line-height: 1.3; margin: 0; padding: 0 10px;">Invite you to form CP</p>
                                </div>
                            </div>
                            <div style="background: #ffffff; padding: 15px 20px 20px 20px; display: flex; flex-direction: column; align-items: center; position: relative;">
                                <div style="margin-top: -45px; position: relative; z-index: 20; background: #fff; border-radius: 50%; padding: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                                    <img src="${reqData.fromPic}" style="width: 75px; height: 75px; border-radius: 50%; object-fit: cover;">
                                </div>
                                <span style="color: #1f2937; font-weight: 800; font-size: 18px; margin-top: 10px; margin-bottom: 2px;">${reqData.fromName}</span>
                                <span style="color: #9ca3af; font-size: 12px; font-weight: 500; margin-bottom: 20px;">ID: ${targetId}</span>
                                <div style="display: flex; width: 100%; gap: 15px;">
                                    <button onclick="window.confirmRejectCP('${firstKey}')" style="flex: 1; background: #fce7f3; color: #e11d48; font-weight: 800; font-size: 15px; border-radius: 30px; padding: 12px 0; border: none; cursor: pointer; outline: none;">Reject</button>
                                    <button onclick="window.confirmAcceptCP('${reqData.fromUid}', '${reqData.fromName}', '${reqData.fromPic}', '${firstKey}')" style="flex: 1; background: #fb7185; color: #fff; font-weight: 800; font-size: 15px; border-radius: 30px; padding: 12px 0; border: none; box-shadow: 0 4px 15px rgba(251,113,133,0.4); cursor: pointer; outline: none;">Accept</button>
                                </div>
                            </div>
                        </div>
                    `;

                    Swal.fire({
                        html: htmlContent, 
                        showConfirmButton: false,
                        allowOutsideClick: false, 
                        allowEscapeKey: false,
                        customClass: { popup: 'cp-popup-box', actions: 'swal2-actions cp-hide-actions' },
                        background: 'transparent', backdrop: 'rgba(0,0,0,0.8)', padding: 0
                    });
                }
            }
        });
    }
}, 3000);

// Global Handlers for the Popups (GUARANTEED CLEAR FIX)
window.confirmBreakupOk = (key) => {
    Swal.close(); // 1. سکرین فوراً کلئیر
    window.isCPPopupShowing = false; 
    
    // 2. ڈیٹا بیس سے ڈیلیٹ کرو تاکہ دوبارہ نہ آئے
    window.set(window.ref(window.db, `users/${window.currentUser.uid}/inbox/cpNotifs/${key}`), null).catch(e => console.error(e));
    
    // 3. اگر پروفائل اوپن ہے تو اسے ریفریش کرو
    if (document.getElementById('full-profile-view') && !document.getElementById('full-profile-view').classList.contains('hidden') && window.viewingProfileUid === window.currentUser.uid) {
        window.openFullProfileView(window.currentUser.uid); 
    }
};

window.confirmRejectCP = (key) => {
    Swal.close(); 
    window.isCPPopupShowing = false;
    window.set(window.ref(window.db, `users/${window.currentUser.uid}/inbox/cpRequests/${key}`), null).catch(e => console.error(e));
};

window.confirmAcceptCP = (uid, name, pic, key) => {
    Swal.close(); 
    window.isCPPopupShowing = false;
    window.acceptCP(uid, name, pic, `cpRequests/${key}`);
};

// 10. Accept CP functionality (FIXED CONGRATULATIONS POPUP)
window.acceptCP = async (partnerUid, partnerName, partnerPic, notifPath) => {
    try {
        // 1. Delete notification FIRST
        if (notifPath) {
            await window.set(window.ref(window.db, `users/${window.currentUser.uid}/inbox/${notifPath}`), null);
        }

        let currentTimestamp = Date.now();

        // 2. Update CP status in Database (Added timestamp for days calculation)
        await window.update(window.ref(window.db, `users/${window.currentUser.uid}`), { cp: { partnerUid: partnerUid, partnerName: partnerName, partnerPic: partnerPic, cpGiftAmount: 0, timestamp: currentTimestamp } });
        await window.update(window.ref(window.db, `users/${partnerUid}`), { cp: { partnerUid: window.currentUser.uid, partnerName: window.currentUser.displayName, partnerPic: window.currentUser.photoURL, cpGiftAmount: 0, timestamp: currentTimestamp } });
        
        window.isCPPopupShowing = true; // Lock again for the congratulations popup
        
        // 3. Show Congratulations Screen
        const htmlContent = `
            <div style="display: flex; flex-direction: column; width: 100%; border-radius: 24px; overflow: hidden; background: #fff; box-shadow: 0 15px 30px rgba(0,0,0,0.15);">
                <div style="height: 170px; position: relative; background: #fff0f5; width: 100%;">
                    <img src="./cp_become.svg" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;" onerror="this.style.display='none'">
                    <div style="position: relative; z-index: 10; text-align: center; padding-top: 30px;">
                        <div style="color: #e11d48; font-weight: 900; font-size: 18px; margin-bottom: 10px; text-shadow: 0px 1px 2px rgba(255,255,255,0.8);">Congratulations! ❤️</div>
                        <p style="color: #374151; font-size: 15px; font-weight: 700; line-height: 1.3; margin: 0; padding: 0 10px;">You and ${partnerName} are now CP Partners!</p>
                    </div>
                </div>
                <div style="background: #ffffff; padding: 15px 20px 20px 20px; display: flex; flex-direction: column; align-items: center; position: relative;">
                    <div style="margin-top: -45px; position: relative; z-index: 20; background: #fff; border-radius: 50%; padding: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <img src="${partnerPic}" style="width: 75px; height: 75px; border-radius: 50%; object-fit: cover;">
                    </div>
                    <span style="color: #1f2937; font-weight: 800; font-size: 18px; margin-top: 10px; margin-bottom: 20px;">${partnerName}</span>
                    <div style="display: flex; width: 100%;">
                        <button onclick="window.confirmCongratsOk()" style="width: 100%; background: #fb7185; color: #fff; font-weight: 800; font-size: 15px; border-radius: 30px; padding: 12px 0; border: none; box-shadow: 0 4px 15px rgba(251,113,133,0.4); cursor: pointer; outline: none;">OK</button>
                    </div>
                </div>
            </div>
        `;

        Swal.fire({
            html: htmlContent, 
            showConfirmButton: false,
            allowOutsideClick: false, 
            allowEscapeKey: false,
            customClass: { popup: 'cp-popup-box', actions: 'swal2-actions cp-hide-actions' },
            background: 'transparent', backdrop: 'rgba(0,0,0,0.8)', padding: 0
        });

        // 4. Handle OK button click
        window.confirmCongratsOk = () => {
            Swal.close(); // سکرین فوراً کلئیر
            window.isCPPopupShowing = false;
            if (document.getElementById('full-profile-view') && !document.getElementById('full-profile-view').classList.contains('hidden') && window.viewingProfileUid === window.currentUser.uid) {
                window.openFullProfileView(window.currentUser.uid); 
            }
        };

    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: error.message, background: '#111', color: '#fff' });
        window.isCPPopupShowing = false;
    }
};
// ================= CP RULES MODAL PAGE =================
window.showCPRules = function() {
    const rulesHTML = `
        <div class="text-left bg-[#fff0f5] px-5 h-screen min-h-screen overflow-y-auto pb-24 pt-12 relative w-full">
            <h2 class="text-2xl font-black text-pink-600 mb-6 text-center border-b border-pink-200 pb-3">Couple Privileges</h2>
            
            <h3 class="text-pink-600 font-black text-lg mb-2 flex items-center gap-2"><span class="text-2xl">01</span> What is Intimacy Level?</h3>
            <p class="text-gray-600 text-sm mb-3 leading-relaxed">Intimacy is a number that represents the closeness between you and your CP.</p>
            <ul class="text-gray-600 text-sm mb-6 list-disc pl-5 space-y-2">
                <li>Giving gifts to each other increases intimacy. <b class="text-pink-500">(1 Coin = +1 Intimacy)</b>.</li>
                <li>Stay active together in rooms to unlock higher levels and better rewards!</li>
            </ul>

            <!-- Levels Table -->
            <div class="rounded-xl overflow-hidden border border-pink-200 shadow-sm mb-8 w-full">
                <table class="w-full text-center border-collapse bg-white text-xs">
                    <tr class="bg-pink-200 text-pink-800 font-bold text-[12px] uppercase tracking-wide">
                        <th class="p-3 border-r border-pink-100">Level</th>
                        <th class="p-3">Intimacy Required</th>
                    </tr>
                    <tr class="border-b border-pink-50"><td class="p-3 font-bold text-pink-500 border-r border-pink-50 text-sm">LV 1</td><td class="p-3 text-gray-600 font-medium text-sm">0 - 2,999,999</td></tr>
                    <tr class="bg-pink-50/50 border-b border-pink-50"><td class="p-3 font-bold text-pink-500 border-r border-pink-50 text-sm">LV 2</td><td class="p-3 text-gray-600 font-medium text-sm">3,000,000</td></tr>
                    <tr class="border-b border-pink-50"><td class="p-3 font-bold text-pink-500 border-r border-pink-50 text-sm">LV 3</td><td class="p-3 text-gray-600 font-medium text-sm">8,000,000</td></tr>
                    <tr class="bg-pink-50/50 border-b border-pink-50"><td class="p-3 font-bold text-pink-500 border-r border-pink-50 text-sm">LV 4</td><td class="p-3 text-gray-600 font-medium text-sm">15,000,000</td></tr>
                    <tr class="border-b border-pink-50"><td class="p-3 font-bold text-pink-500 border-r border-pink-50 text-sm">LV 5</td><td class="p-3 text-gray-600 font-medium text-sm">25,000,000</td></tr>
                    <tr class="bg-pink-50/50"><td class="p-3 font-bold text-pink-500 border-r border-pink-50 text-sm">LV 6</td><td class="p-3 text-gray-600 font-medium text-sm">50,000,000</td></tr>
                </table>
            </div>

            <h3 class="text-pink-600 font-black text-lg mb-2 flex items-center gap-2"><span class="text-2xl">02</span> Privileges of CP</h3>
            <p class="text-gray-600 text-sm mb-4 leading-relaxed">Couples with different levels of intimacy enjoy different visual effects and backgrounds.</p>

            <!-- Privileges Table -->
            <div class="rounded-xl overflow-hidden border border-pink-200 shadow-sm mb-6 w-full">
                <table class="w-full text-center border-collapse bg-white text-xs">
                    <tr class="bg-pink-200 text-pink-800 font-bold text-[12px] uppercase tracking-wide">
                        <th class="p-3 border-r border-pink-100">Level</th>
                        <th class="p-3">Background & Effects</th>
                    </tr>
                    <tr class="border-b border-pink-50"><td class="p-3 font-bold text-pink-500 border-r border-pink-50 text-sm">LV 1 - 2</td><td class="p-3 text-gray-600 text-sm">Basic CP Background & Badges</td></tr>
                    <tr class="bg-pink-50/50 border-b border-pink-50"><td class="p-3 font-bold text-pink-500 border-r border-pink-50 text-sm">LV 3 - 4</td><td class="p-3 text-gray-600 text-sm">Advanced CP Cover Background</td></tr>
                    <tr class="border-b border-pink-50"><td class="p-3 font-bold text-pink-500 border-r border-pink-50 text-sm">LV 5 - 6</td><td class="p-3 text-gray-600 text-sm">Premium SVG Background & Moving Effects</td></tr>
                </table>
            </div>
            
            <div class="w-full flex justify-center mt-4">
                <button onclick="Swal.close()" class="bg-pink-500 text-white font-bold py-3.5 px-16 rounded-full shadow-lg active:scale-95 transition text-lg tracking-wide z-50 relative">I Understand</button>
            </div>
        </div>
    `;

    Swal.fire({
        html: rulesHTML,
        showConfirmButton: false,
        width: '100vw', // 🔥 سکرین کی مکمل چوڑائی فورس کرے گا
        padding: '0',
        background: '#fff0f5',
        backdrop: '#fff0f5', // 🔥 پس منظر بھی پنک کر دیا ہے تاکہ کوئی گیپ نہ رہے
        showCloseButton: true,
        grow: 'fullscreen',
        customClass: {
            container: '!p-0 !m-0', // 🔥 سائیڈ کے تمام گیپس (Gaps) ختم کر دے گا
            popup: '!w-screen !h-screen !max-w-none !m-0 !p-0 !rounded-none !border-0', // 🔥 مکمل ایج ٹو ایج سکرین
            htmlContainer: '!m-0 !p-0',
            closeButton: '!text-pink-600 !bg-pink-100 !rounded-full !w-8 !h-8 !top-4 !right-4 hover:!bg-pink-200 focus:!outline-none z-[6000]'
        }
    });
};