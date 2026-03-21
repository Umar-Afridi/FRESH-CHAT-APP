// ==========================================
// PROP WAREHOUSE SYSTEM (YARAAN APP)
// White Theme & Tabs (Frames, Chat Bubbles, Vehicles)
// ==========================================

let currentPropTab = 'frames';

// 1. Dynamic HTML Generation (تاکہ index.html کلین رہے)
function createPropHouseHTML() {
    if (document.getElementById('prophouse-modal')) return;

    const html = `
        <div id="prophouse-modal" class="fixed inset-0 z-[6000] bg-gray-50 flex-col hidden transition-opacity duration-300 opacity-0">
            <!-- White Header & Tabs -->
            <div class="bg-white px-5 pt-12 pb-0 shadow-sm z-10 border-b border-gray-200">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-extrabold text-gray-900 tracking-wider">PROP <span class="text-purple-600">WAREHOUSE</span></h2>
                    <button onclick="closePropHouse()" class="text-gray-400 hover:text-gray-800 text-2xl active:scale-95 transition">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <!-- 3 Tabs Navigation -->
                <div class="flex gap-6 overflow-x-auto scrollbar-hide">
                    <button id="ph-tab-frames" onclick="switchPropHouseTab('frames')" class="pb-2 text-sm font-bold border-b-2 border-purple-600 text-gray-900 transition whitespace-nowrap">Frames</button>
                    <button id="ph-tab-bubbles" onclick="switchPropHouseTab('bubbles')" class="pb-2 text-sm font-bold border-b-2 border-transparent text-gray-400 transition whitespace-nowrap">Chat Bubbles</button>
                    <button id="ph-tab-vehicles" onclick="switchPropHouseTab('vehicles')" class="pb-2 text-sm font-bold border-b-2 border-transparent text-gray-400 transition whitespace-nowrap">Vehicles</button>
                </div>
            </div>
            
            <!-- Items Grid Area -->
            <div id="ph-frame-grid" class="grid grid-cols-2 gap-4 flex-1 overflow-y-auto p-5 pb-20 items-start content-start"></div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

// 2. Tab Switching Logic
window.switchPropHouseTab = (tab) => {
    currentPropTab = tab;['frames', 'bubbles', 'vehicles'].forEach(t => {
        const btn = document.getElementById(`ph-tab-${t}`);
        if(btn) {
            if(t === tab) {
                btn.className = "pb-2 text-sm font-bold border-b-2 border-purple-600 text-gray-900 transition whitespace-nowrap";
            } else {
                btn.className = "pb-2 text-sm font-bold border-b-2 border-transparent text-gray-400 transition whitespace-nowrap";
            }
        }
    });
    renderPropHouseItems();
};

// 3. Open Prop House Function
window.openPropHouse = async () => {
    createPropHouseHTML(); // Ensure HTML exists
    
    const modal = document.getElementById('prophouse-modal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    setTimeout(() => { modal.classList.remove('opacity-0'); }, 10);

    await renderPropHouseItems();
};

// 4. Close Prop House Function
window.closePropHouse = () => {
    const modal = document.getElementById('prophouse-modal');
    if(modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }, 300);
    }
};

// 5. Main Render Logic
async function renderPropHouseItems() {
    const grid = document.getElementById('ph-frame-grid');
    grid.innerHTML = '<div class="text-gray-500 text-center w-full mt-10 col-span-2 font-bold"><i class="fa-solid fa-spinner fa-spin text-purple-500 mr-2"></i>Loading...</div>';
    
    if(!window.currentUser) return;

    const snap = await window.get(window.ref(window.db, `users/${window.currentUser.uid}`));
    const userData = snap.val() || {};
    
    let unlockedFrames = userData.unlockedFrames || {};
    let htmlContent = '';
    let hasItems = false;

    for (let [purchaseId, frameData] of Object.entries(unlockedFrames)) {
        // VIPs are handled in Level Center / VIP Modal, not here
        if (frameData.isVipName) continue;

        let isBubble = frameData.isBubble === true;
        let isVehicle = frameData.isVehicle === true;
        let isFrame = !isBubble && !isVehicle;

        // Filter based on selected tab
        if (currentPropTab === 'frames' && !isFrame) continue;
        if (currentPropTab === 'bubbles' && !isBubble) continue;
        if (currentPropTab === 'vehicles' && !isVehicle) continue;

        hasItems = true;
        let btnText, btnClass, btnAction, statusText;

        // Check if currently equipped
        let isEquipped = false;
        if (isFrame && userData.currentFrame === frameData.img) isEquipped = true;
        if (isBubble && userData.currentBubbleClass === frameData.bubbleClass) isEquipped = true;

        if (isEquipped) {
            btnText = "UNEQUIP";
            btnClass = "bg-red-500 text-white hover:bg-red-600 shadow-md";
            btnAction = isBubble ? `unequipBubble()` : `unequipFrame()`;
            statusText = `<span class="text-green-500 text-[10px] font-extrabold uppercase bg-green-50 px-2 py-0.5 rounded">Equipped</span>`;
        } else if (frameData.status === 'unused' || frameData.status === 'active') {
            btnText = "USE NOW";
            btnClass = "bg-purple-600 text-white hover:bg-purple-700 shadow-md";
            if(isBubble) {
                btnAction = `applyFrame('${purchaseId}', null, false, true, '${frameData.bubbleClass}')`;
            } else if(isVehicle) {
                btnAction = `Swal.fire({toast:true, icon:'info', title:'Vehicles Coming Soon', position:'top'})`;
            } else {
                btnAction = `applyFrame('${purchaseId}', '${frameData.img}', false, false, null)`;
            }
            statusText = `<span class="text-gray-400 text-[10px] font-extrabold uppercase bg-gray-100 px-2 py-0.5 rounded">Available</span>`;
        } else {
            statusText = `<span class="text-red-500 text-[10px] font-extrabold uppercase bg-red-50 px-2 py-0.5 rounded">Expired</span>`;
            btnText = "DELETE";
            btnClass = "bg-gray-200 text-gray-700 hover:bg-gray-300";
            btnAction = `deleteExpiredFrame('${purchaseId}', false)`;
        }

        let iconHtml = '';
        if (isBubble || isVehicle) {
            iconHtml = `<img src="${frameData.img}" class="w-14 h-14 object-contain drop-shadow-md" onerror="this.src='https://placehold.co/100'">`;
        } else {
            let displayImg = (frameData.img || '').endsWith('.mp4') ? frameData.img.replace('.mp4', '.png') : frameData.img;
            iconHtml = `
                <img src="${userData.photoURL || 'https://placehold.co/100'}" class="w-12 h-12 rounded-full object-cover border border-gray-200">
                <img src="${displayImg}" class="absolute inset-0 w-full h-full object-contain pointer-events-none" onerror="this.onerror=null; this.src=this.src.replace('/frames/', '/');">
            `;
        }

        htmlContent += `
        <div class="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center relative shadow-sm hover:shadow-md transition">
            <div class="w-16 h-16 relative mb-2 flex items-center justify-center">
                ${iconHtml}
            </div>
            <span class="text-gray-900 font-bold text-[13px] text-center w-full truncate px-1">${frameData.name}</span>
            <div class="mb-3 mt-1.5">${statusText}</div>
            <button onclick="${btnAction}" class="w-full ${btnClass} font-black text-[10px] py-2.5 rounded-xl transition active:scale-95 uppercase tracking-wider">${btnText}</button>
        </div>`;
    }

    if (!hasItems) {
        let msg = currentPropTab === 'bubbles' ? 'No chat bubbles found.' : (currentPropTab === 'vehicles' ? 'No vehicles found.' : 'No frames found.');
        grid.innerHTML = `
        <div class="flex flex-col items-center justify-center col-span-2 mt-16">
            <i class="fa-solid fa-box-open text-4xl text-gray-300 mb-3"></i>
            <span class="text-gray-400 text-sm font-medium">${msg}</span>
        </div>`;
    } else {
        grid.innerHTML = htmlContent;
    }
}

// 6. Action Functions
window.applyFrame = async (purchaseId, imgPath, isVipName = false, isBubble = false, bubbleClass = null) => {
    let expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000); 
    
    await window.update(window.ref(window.db, `users/${window.currentUser.uid}/unlockedFrames/${purchaseId}`), {
        activatedAt: Date.now(),
        expiry: expiryTime,
        status: 'active'
    });
    
    if (isBubble) {
        await window.update(window.ref(window.db, `users/${window.currentUser.uid}`), { currentBubbleClass: bubbleClass });
        Swal.fire({toast:true, icon:'success', title:'Chat Bubble Activated!', position:'top', showConfirmButton:false, timer:2000});
        renderPropHouseItems(); // Refresh List
    } else {
        await window.equipActiveFrame(imgPath, isVipName);
        Swal.fire({toast:true, icon:'success', title:'Activated! 7 Days Timer Started.', position:'top', showConfirmButton:false, timer:2000});
        renderPropHouseItems(); // Refresh List
    }
};

window.unequipBubble = async () => {
    await window.update(window.ref(window.db, `users/${window.currentUser.uid}`), { currentBubbleClass: null });
    Swal.fire({toast:true, icon:'info', title:'Bubble Removed', position:'top', showConfirmButton:false, timer:1500});
    renderPropHouseItems();
};

window.equipActiveFrame = async (imgPath, isVipName = false) => {
    if (isVipName) {
        await window.update(window.ref(window.db, `users/${window.currentUser.uid}`), { nameColorClass: imgPath }); 
    } else {
        await window.update(window.ref(window.db, `users/${window.currentUser.uid}`), { currentFrame: imgPath }); 
    }
    
    if(window.currentRoomId) { 
        const seatsSnap = await window.get(window.ref(window.db, `rooms/${window.currentRoomId}/seats`)); 
        if(seatsSnap.exists()) { 
            const seats = seatsSnap.val(); 
            Object.keys(seats).forEach(async (k) => { 
                if(seats[k].uid === window.currentUser.uid) { 
                    if (isVipName) {
                        await window.update(window.ref(window.db, `rooms/${window.currentRoomId}/seats/${k}`), { nameColorClass: imgPath }); 
                    } else {
                        await window.update(window.ref(window.db, `rooms/${window.currentRoomId}/seats/${k}`), { frame: imgPath }); 
                    }
                } 
            }); 
        } 
    } 
};

window.unequipFrame = async () => { 
    await window.update(window.ref(window.db, `users/${window.currentUser.uid}`), { currentFrame: null }); 
    if(window.currentRoomId) { 
        const seatsSnap = await window.get(window.ref(window.db, `rooms/${window.currentRoomId}/seats`)); 
        if(seatsSnap.exists()) { 
            const seats = seatsSnap.val(); 
            Object.keys(seats).forEach(async (k) => { 
                if(seats[k].uid === window.currentUser.uid) { 
                    await window.update(window.ref(window.db, `rooms/${window.currentRoomId}/seats/${k}`), { frame: null }); 
                } 
            }); 
        } 
    } 
    Swal.fire({toast:true, icon:'info', title:'Frame Removed', position:'top', showConfirmButton:false, timer:1500});
    renderPropHouseItems();
};

window.deleteExpiredFrame = async (purchaseId, wasEquipped) => {
    if (wasEquipped) await unequipFrame();
    await window.remove(window.ref(window.db, `users/${window.currentUser.uid}/unlockedFrames/${purchaseId}`));
    renderPropHouseItems();
};