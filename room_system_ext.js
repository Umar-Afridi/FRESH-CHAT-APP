// ==============================================================
// YARAAN - ADVANCED ROOM & GLOBAL SEARCH SYSTEM (EXTERNAL FILE)
// Features: 6-Digit Unique Room IDs & Dual Search (User / Room)
// ==============================================================

// ================= 1. ROOM CREATION SYSTEM (6-DIGIT ID) =================

window.triggerCreateRoom = async () => { 
    if (!window.currentUser) return;
    
    // چیک کریں کہ کیا یوزر کا پہلے سے کوئی روم موجود ہے؟
    const userSnap = await window.get(window.ref(window.db, `users/${window.currentUser.uid}`));
    const userData = userSnap.val() || {};

    if (userData.ownedRoomId) {
        // اگر روم پہلے سے ہے، تو پرانے 6-digit ID سے روم میں انٹر ہو جاؤ
        window.joinRoom(userData.ownedRoomId);
    } else {
        // نیا روم بنانے کا فارم کھولو
        document.getElementById('cr-name').value = ""; 
        document.getElementById('cr-cover').value = ""; 
        document.getElementById('cr-preview').src = 'https://placehold.co/200x200?text=Cover'; 
        document.getElementById('create-room-view').classList.add('open'); 
    }
};

window.closeCreateRoom = () => { 
    document.getElementById('create-room-view').classList.remove('open'); 
};

window.finalizeCreateRoom = async () => { 
    const rName = document.getElementById('cr-name').value; 
    const rCover = document.getElementById('cr-cover').value; 
    
    if(!rName) return Swal.fire('Error', 'Room Name is required', 'error'); 
    
    Swal.fire({title: 'Creating Room...', allowOutsideClick: false, showConfirmButton: false, background: '#111', color: '#fff'});

    try {
        const myId = document.getElementById('profile-id').innerText; 
        
        // 1. 6-Digit Unique Room ID Generate کریں (100000 سے شروع ہوگا)
        const roomCountRef = window.ref(window.db, 'sys/roomCount');
        const result = await window.runTransaction(roomCountRef, (current) => (current || 0) + 1);
        const newRoomId = (100000 + result.snapshot.val()).toString();

        // 2. روم کا ڈیٹا 6-Digit ID کے نام سے Save کریں
        await window.update(window.ref(window.db, `rooms/${newRoomId}`), { 
            owner: window.currentUser.uid, 
            ownerName: window.currentUser.displayName, 
            ownerCustomId: myId,
            roomId: newRoomId, 
            active: true, 
            isLive: true, 
            roomName: rName, 
            roomCover: rCover || null 
        }); 

        // 3. یوزر کی پروفائل میں یہ ID محفوظ کر دیں
        await window.update(window.ref(window.db, `users/${window.currentUser.uid}`), {
            ownedRoomId: newRoomId
        });

        Swal.close();
        closeCreateRoom(); 
        
        // نئے بنے ہوئے 6-Digit آئی ڈی والے روم میں داخل ہو جائیں
        window.joinRoom(newRoomId); 

    } catch (error) {
        Swal.fire('Error', 'Failed to create room. ' + error.message, 'error');
    }
};


// ================= 2. ADVANCED GLOBAL SEARCH SYSTEM (USER / ROOM) =================

window.currentSearchTab = 'user'; // Default search mode

window.switchSearchTab = (tab) => {
    window.currentSearchTab = tab;
    const tabUser = document.getElementById('search-tab-user');
    const tabRoom = document.getElementById('search-tab-room');
    
    if(tab === 'user') {
        tabUser.className = "text-sm font-bold border-b-2 border-purple-600 text-purple-600 pb-1 cursor-pointer transition";
        tabRoom.className = "text-sm font-bold border-b-2 border-transparent text-gray-400 pb-1 cursor-pointer transition";
        document.getElementById('global-search-input').placeholder = "Search User ID...";
    } else {
        tabRoom.className = "text-sm font-bold border-b-2 border-purple-600 text-purple-600 pb-1 cursor-pointer transition";
        tabUser.className = "text-sm font-bold border-b-2 border-transparent text-gray-400 pb-1 cursor-pointer transition";
        document.getElementById('global-search-input').placeholder = "Search Room ID...";
    }
    
    // اگر ان پٹ میں کچھ لکھا ہے تو فوراً دوبارہ سرچ کرو
    if(document.getElementById('global-search-input').value.trim() !== '') {
        window.executeGlobalSearch();
    }
};

window.openGlobalSearch = () => {
    const view = document.getElementById('global-search-view');
    view.classList.remove('hidden');
    view.style.display = 'flex';
    setTimeout(() => { view.classList.remove('translate-x-full'); }, 10);
    
    document.getElementById('global-search-results').classList.add('hidden');
    document.getElementById('search-history-container').classList.remove('hidden');
    loadSearchHistory();
    
    setTimeout(() => { document.getElementById('global-search-input').focus(); }, 300);
};

window.closeGlobalSearch = () => {
    const view = document.getElementById('global-search-view');
    view.classList.add('translate-x-full');
    setTimeout(() => { 
        view.classList.add('hidden'); 
        view.style.display = 'none'; 
    }, 300);
};

window.clearGlobalSearchInput = () => {
    document.getElementById('global-search-input').value = '';
    document.getElementById('global-search-clear').classList.add('hidden');
    document.getElementById('global-search-results').classList.add('hidden');
    document.getElementById('search-history-container').classList.remove('hidden');
    loadSearchHistory();
};

function loadSearchHistory() {
    let history = JSON.parse(localStorage.getItem('yaraan_search_history') || '[]');
    const list = document.getElementById('search-history-list');
    list.innerHTML = '';
    history.forEach(item => {
        list.innerHTML += `<div onclick="document.getElementById('global-search-input').value='${item}'; executeGlobalSearch();" class="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer active:bg-gray-200 transition">${item}</div>`;
    });
}

window.clearSearchHistory = () => {
    localStorage.removeItem('yaraan_search_history');
    loadSearchHistory();
};

window.executeGlobalSearch = async () => {
    const inputVal = document.getElementById('global-search-input').value.trim();
    if(!inputVal) return;

    // 1. Save to history
    let history = JSON.parse(localStorage.getItem('yaraan_search_history') || '[]');
    history = history.filter(item => item !== inputVal); 
    history.unshift(inputVal); 
    if(history.length > 10) history.pop(); 
    localStorage.setItem('yaraan_search_history', JSON.stringify(history));

    // 2. Setup UI
    document.getElementById('search-history-container').classList.add('hidden');
    const resultArea = document.getElementById('global-search-results');
    resultArea.classList.remove('hidden');
    resultArea.innerHTML = '<div class="text-center text-gray-500 mt-10 font-bold">Searching...</div>';

    try {
        if (window.currentSearchTab === 'user') {
            // ================= SEARCH USER LOGIC =================
            const uidSnap = await window.get(window.ref(window.db, `idToUid/${inputVal}`));
            
            if(!uidSnap.exists()) {
                resultArea.innerHTML = '<div class="text-center text-red-500 mt-10 font-bold">User not found!</div>';
                return;
            }

            const u = uidSnap.val();
            if(u === window.currentUser.uid) {
                resultArea.innerHTML = '<div class="text-center text-yellow-500 mt-10 font-bold">This is you!</div>';
                return;
            }

            const udSnap = await window.get(window.ref(window.db, `users/${u}`));
            const ud = udSnap.val() || {};

            const friendCheck = await window.get(window.ref(window.db, `users/${window.currentUser.uid}/friends/${u}`));
            let isFollowing = friendCheck.exists();
            
            let vBadgeHtml = (ud.isOfficial || Number(ud.customId) === 10005) ? `<img src="./v_badge.svg" class="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full p-[2px] shadow-sm">` : '';
            let genderIcon = ud.gender === 'female' ? '<i class="fa-solid fa-venus text-pink-500"></i>' : '<i class="fa-solid fa-mars text-blue-500"></i>';

            resultArea.innerHTML = `
            <div class="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-2 cursor-pointer active:bg-gray-50 transition" onclick="closeGlobalSearch(); setTimeout(() => openFullProfileView('${u}'), 200);">
                <div class="flex items-center gap-3 pointer-events-none">
                    <div class="relative">
                        <img src="${ud.photoURL || 'https://placehold.co/100'}" class="w-12 h-12 rounded-full border border-gray-200 object-cover">
                        ${vBadgeHtml}
                    </div>
                    <div class="flex flex-col">
                        <span class="text-gray-900 font-bold text-sm flex items-center gap-1">${ud.username} ${genderIcon}</span>
                        <span class="text-xs text-gray-500">User ID: ${inputVal}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${isFollowing ? 
                        `<button class="bg-gray-100 text-gray-500 text-xs px-4 py-1.5 rounded-full font-bold">Following</button>` : 
                        `<button onclick="event.stopPropagation(); sendReq('${u}', this)" class="bg-purple-100 text-purple-600 text-xs px-4 py-1.5 rounded-full font-bold border border-purple-200">Follow</button>`
                    }
                </div>
            </div>`;

        } else if (window.currentSearchTab === 'room') {
            // ================= SEARCH ROOM LOGIC =================
            // نئے 6 ڈیجٹ روم سسٹم میں روم کا آئی ڈی ڈائریکٹ فائر بیس پاتھ ہے
            const roomSnap = await window.get(window.ref(window.db, `rooms/${inputVal}`));
            
            if(!roomSnap.exists()) {
                resultArea.innerHTML = '<div class="text-center text-red-500 mt-10 font-bold">Room not found!</div>';
                return;
            }

            const rData = roomSnap.val() || {};
            const rCover = rData.roomCover || `https://ui-avatars.com/api/?name=${encodeURIComponent(rData.roomName)}&background=random`;
            const userCount = rData.activeUsers ? Object.keys(rData.activeUsers).length : 0;

            resultArea.innerHTML = `
            <div class="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-2 cursor-pointer active:bg-gray-50 transition" onclick="closeGlobalSearch(); setTimeout(() => window.fastJoinRoom('${inputVal}'), 200);">
                <div class="flex items-center gap-3 pointer-events-none">
                    <div class="relative">
                        <img src="${rCover}" class="w-14 h-14 rounded-xl border border-gray-200 object-cover">
                        ${rData.isLive ? `<span class="absolute -top-1 -right-1 bg-green-500 border-2 border-white w-4 h-4 rounded-full flex items-center justify-center"><span class="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span></span>` : ''}
                    </div>
                    <div class="flex flex-col">
                        <span class="text-gray-900 font-bold text-sm max-w-[150px] truncate">${rData.roomName || 'Yaraan Room'}</span>
                        <span class="text-[11px] text-gray-500 mt-0.5">Room ID: <span class="font-bold text-purple-600">${inputVal}</span></span>
                        <span class="text-[10px] text-gray-400 mt-0.5"><i class="fa-solid fa-users text-[9px] mr-1"></i>${userCount} active users</span>
                    </div>
                </div>
                <div class="flex items-center">
                    <button class="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs px-5 py-2 rounded-full font-bold shadow-md">Enter</button>
                </div>
            </div>`;
        }

    } catch (error) {
        console.error("Search Error:", error);
        resultArea.innerHTML = '<div class="text-center text-red-500 mt-10">Error fetching data</div>';
    }
};