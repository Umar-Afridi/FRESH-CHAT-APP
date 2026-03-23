// =========================================================================
// UNIVERSAL NATIVE EDGE SWIPE SYSTEM (ANDROID STYLE BACK GESTURE)
// File: edge_swipe.js
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. آٹومیٹک ببل HTML جنریٹ کرنا (تاکہ index.html کلین رہے)
    const bubbleHTML = `
    <div id="edge-swipe-bubble" style="position: fixed; top: 50%; width: 44px; height: 44px; background: rgba(200, 200, 200, 0.85); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(0,0,0,0.3); z-index: 99999999; pointer-events: none; opacity: 0; transform: scale(0.5); transition: opacity 0.2s, transform 0.2s;">
        <i id="edge-swipe-arrow" class="fa-solid fa-chevron-left" style="color: #111; font-size: 18px; font-weight: 900;"></i>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', bubbleHTML);

    let edgeStartX = 0;
    let edgeStartY = 0;
    let edgeStartSide = ''; // 'left' or 'right'
    let isEdgeSwipingActive = false;
    
    const edgeBubble = document.getElementById('edge-swipe-bubble');
    const edgeArrow = document.getElementById('edge-swipe-arrow');

    // 2. ٹچ اسٹارٹ (Touch Start) ایونٹ
    document.addEventListener('touchstart', (e) => {
        let touch = e.touches[0];
        let screenWidth = window.innerWidth;

        // کنارے (Edge) سے 20px کے اندر ٹچ کو پکڑیں
        if (touch.clientX < 20) {
            edgeStartSide = 'left';
        } else if (touch.clientX > screenWidth - 20) {
            edgeStartSide = 'right';
        } else {
            return; // بیچ میں ٹچ ہو تو اگنور کریں
        }

        isEdgeSwipingActive = true;
        edgeStartX = touch.clientX;
        edgeStartY = touch.clientY;

        edgeBubble.style.top = (edgeStartY - 22) + 'px'; 
        edgeBubble.style.transition = 'none'; 
        edgeBubble.style.opacity = '1';
        edgeBubble.style.transform = 'scale(0.8)';

        if (edgeStartSide === 'left') {
            edgeBubble.style.left = '-22px';
            edgeBubble.style.right = 'auto';
            edgeArrow.className = 'fa-solid fa-chevron-left';
        } else {
            edgeBubble.style.right = '-22px';
            edgeBubble.style.left = 'auto';
            edgeArrow.className = 'fa-solid fa-chevron-right';
        }
    }, {passive: true});

    // 3. ٹچ موو (Touch Move) ایونٹ
    document.addEventListener('touchmove', (e) => {
        if (!isEdgeSwipingActive) return;
        
        let touch = e.touches[0];
        let pullDistance = edgeStartSide === 'left' ? (touch.clientX - edgeStartX) : (edgeStartX - touch.clientX);

        if (pullDistance > 0) {
            let moveX = Math.min(pullDistance * 0.6, 60); 
            let scale = Math.min(0.8 + (pullDistance / 100), 1.1); 

            if (edgeStartSide === 'left') {
                edgeBubble.style.transform = `translateX(${moveX}px) scale(${scale})`;
            } else {
                edgeBubble.style.transform = `translateX(-${moveX}px) scale(${scale})`;
            }
        }
    }, {passive: true});

    // 4. ٹچ اینڈ (Touch End) ایونٹ
    document.addEventListener('touchend', (e) => {
        if (!isEdgeSwipingActive) return;
        
        let touch = e.changedTouches[0];
        let pullDistance = edgeStartSide === 'left' ? (touch.clientX - edgeStartX) : (edgeStartX - touch.clientX);

        edgeBubble.style.transition = 'opacity 0.3s, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        edgeBubble.style.transform = 'translateX(0) scale(0.5)';
        edgeBubble.style.opacity = '0';
        
        isEdgeSwipingActive = false;

        // اگر 50px سے زیادہ کھینچا ہے تو بیک ایکشن چلائیں
        if (pullDistance > 50) {
            window.executeUniversalBackAction();
        }
    });
});

// =========================================================================
// UNIVERSAL BACK ENGINE
// =========================================================================
window.executeUniversalBackAction = () => {
    const isOpen = (id) => {
        const el = document.getElementById(id);
        return el && !el.classList.contains('hidden') && el.style.display !== 'none' && !el.classList.contains('translate-x-full') && !el.classList.contains('translate-y-full');
    };

    // 1. Top Layers (Popups & Sheets)
    if (isOpen('gift-modal')) { document.getElementById('gift-modal').classList.add('hidden'); return; }
    if (isOpen('emoji-sheet')) { if(typeof window.closeEmojiSheet === 'function') window.closeEmojiSheet(); return; }
    if (isOpen('mic-action-sheet')) { if(typeof window.closeMicSheet === 'function') window.closeMicSheet(new Event('')); return; }
    if (isOpen('half-profile-sheet')) { if(typeof window.closeHalfProfile === 'function') window.closeHalfProfile(new Event('')); return; }
    if (isOpen('room-users-modal')) { if(typeof window.closeRoomUsers === 'function') window.closeRoomUsers(); return; }
    if (isOpen('friend-profile-modal')) { if(typeof window.closeFriendProfile === 'function') window.closeFriendProfile(); return; }
    
    // 2. Sub Sheets
    if (isOpen('sub-sheet-name')) { window.closeSubSheet('sub-sheet-name'); return; }
    if (isOpen('sub-sheet-notice')) { window.closeSubSheet('sub-sheet-notice'); return; }
    if (isOpen('sub-sheet-type')) { window.closeSubSheet('sub-sheet-type'); return; }
    if (isOpen('sub-sheet-mic')) { window.closeSubSheet('sub-sheet-mic'); return; }
    if (isOpen('sub-sheet-lock-menu')) { window.closeSubSheet('sub-sheet-lock-menu'); return; }
    if (isOpen('sub-sheet-set-password')) { window.closeSubSheet('sub-sheet-set-password'); return; }
    if (isOpen('sub-sheet-admin-list')) { window.closeSubSheet('sub-sheet-admin-list'); return; }

    // 3. Medium Modals
    if (isOpen('room-settings-modal')) { window.closeRoomSettings(); return; }
    if (isOpen('theme-modal')) { window.closeThemeModal(); return; }
    if (isOpen('game-history-modal')) { window.closeGameHistory(); return; }
    if (isOpen('game-modal')) { window.closeGame(); return; }
    if (isOpen('store-modal')) { window.closeStoreModal(); return; }
    if (isOpen('prophouse-modal')) { if(typeof window.closePropHouse === 'function') window.closePropHouse(); return; }
    if (isOpen('wallet-full-view')) { if(typeof window.closeWallet === 'function') window.closeWallet(); return; }

    // 4. Full Screen Views
    if (isOpen('full-profile-view')) { window.closeFullProfileView(); return; }
    if (isOpen('view-system-chat')) { window.closeSystemChatView(); return; }
    if (isOpen('admin-search-view')) { window.closeAdminSearch(); return; }
    if (isOpen('admin-panel-modal')) { document.getElementById('admin-panel-modal').style.display='none'; return; }
    if (isOpen('cp-ranking-modal')) { window.closeCPRankingModal(); return; }
    if (isOpen('global-search-view')) { window.closeGlobalSearch(); return; }
    if (isOpen('edit-profile-view')) { window.closeEditProfileScreen(); return; }
    if (isOpen('level-system-modal')) { window.closeLevelModal(); return; }
    if (isOpen('svip-full-modal')) { if(typeof window.closeSVIPModal === 'function') window.closeSVIPModal(); return; }
    
    // Leaderboard Tabs
    if (isOpen('leaderboard-modal')) { 
        let tabs = document.querySelectorAll('.lb-m-tab');
        let activeIndex = 0;
        tabs.forEach((t, i) => { if(t.classList.contains('active')) activeIndex = i; });
        if (activeIndex > 0) { window.switchMainTab(activeIndex - 1); return; }
        else { window.closeLeaderboard(); return; } 
    }

    // 5. Room Minimize
    const roomView = document.getElementById('view-room'); 
    if (roomView && roomView.style.display === 'flex') { 
        if(typeof window.toggleExitMenu === 'function') window.toggleExitMenu(); 
        return; 
    }

    // 6. Main Home Tabs
    const profileView = document.getElementById('view-profile'); 
    if (profileView && profileView.style.display === 'flex') { window.switchTab('view-home', document.getElementById('btn-home')); return; } 
    
    const inboxView = document.getElementById('view-inbox'); 
    if (inboxView && inboxView.style.display === 'flex') { window.switchTab('view-home', document.getElementById('btn-home')); return; }

    const homeView = document.getElementById('view-home');
    if (homeView && homeView.style.display === 'flex') {
        let tabs =['following', 'popular', 'recent']; 
        // Note: currentHomeTab must be globally available from index.html
        let currentIndex = typeof currentHomeTab !== 'undefined' ? tabs.indexOf(currentHomeTab) : 1; 
        if (currentIndex > 0) { window.switchHomeTab(tabs[currentIndex - 1]); return; }
    }
};