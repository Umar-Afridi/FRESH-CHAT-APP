// =========================================================================
// YARAAN - MODERN PULL TO REFRESH SYSTEM (FAST & COLOR CHANGING)
// File: refresh_system.js
// =========================================================================

window.initModernRefresh = function() {
    const homeView = document.getElementById('view-home');
    const loader = document.getElementById('modern-refresh-loader');
    const icon = loader.querySelector('i');

    if (!homeView || !loader) return;

    let startY = 0;
    let currentY = 0;
    let isRefreshing = false;

    homeView.addEventListener('touchstart', (e) => {
        if (homeView.scrollTop === 0 && !isRefreshing) {
            startY = e.touches[0].pageY;
            loader.style.transition = 'none';
        }
    }, {passive: true});

    homeView.addEventListener('touchmove', (e) => {
        if (homeView.scrollTop === 0 && startY > 0 && !isRefreshing) {
            currentY = e.touches[0].pageY;
            let diff = currentY - startY;

            if (diff > 0) {
                let move = Math.min(diff / 2.5, 70); 
                loader.style.transform = `translate(-50%, calc(-150% + ${move}px))`;
                icon.style.transform = `rotate(${diff}deg)`;
                
                // 💜 جب یوزر نیچے کھینچ رہا ہو تو رنگ پرپل (Purple) کر دیں
                icon.classList.remove('text-red-600');
                icon.classList.add('text-purple-600');
            }
        }
    }, {passive: true});

    homeView.addEventListener('touchend', (e) => {
        if (startY > 0 && !isRefreshing) {
            let diff = currentY - startY;
            loader.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

            if (diff > 80) {
                isRefreshing = true;
                loader.style.transform = `translate(-50%, 25px)`; 
                
                // ⚡ عام fa-spin کی بجائے ہماری نئی تیز fast-spin کلاس لگا دی
                icon.classList.add('fast-spin'); 

                if(typeof window.refreshHomeRooms === 'function') {
                    window.refreshHomeRooms();
                }

                // ⏱️ لوڈنگ ٹائم 1.5 سے کم کر کے 1.2 سیکنڈ کر دیا تاکہ جلدی فری ہو
                setTimeout(() => {
                    // ❤️ اوپر واپس جانے سے پہلے رنگ ریڈ (Red) کر دیں
                    icon.classList.remove('text-purple-600');
                    icon.classList.add('text-red-600');
                    loader.style.transform = `translate(-50%, -150%)`;
                    
                    setTimeout(() => {
                        icon.classList.remove('fast-spin');
                        isRefreshing = false;
                    }, 300);
                }, 1200); 
            } 
            else {
                // اگر یوزر نے پورا نہیں کھینچا تو واپس ریڈ کر کے چھپا دیں
                icon.classList.remove('text-purple-600');
                icon.classList.add('text-red-600');
                loader.style.transform = `translate(-50%, -150%)`;
            }
            startY = 0;
        }
    }, {passive: true});
};

// =========================================================================
// AUTO REFRESH ON APP OPEN (جب ایپ پہلی بار کھلے گی)
// =========================================================================
window.triggerAutoRefresh = function() {
    const loader = document.getElementById('modern-refresh-loader');
    if(!loader) return;
    const icon = loader.querySelector('i');

    loader.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    loader.style.transform = `translate(-50%, 25px)`;
    
    // 💜 شروع میں پرپل اور تیز سپن
    icon.classList.remove('text-red-600');
    icon.classList.add('text-purple-600', 'fast-spin');

    if(typeof window.refreshHomeRooms === 'function') {
        window.refreshHomeRooms();
    }

    setTimeout(() => {
        loader.style.transition = 'transform 0.3s ease-in';
        // ❤️ اوپر واپس جاتے وقت ریڈ (Red) کر دیں
        icon.classList.remove('text-purple-600');
        icon.classList.add('text-red-600');
        loader.style.transform = `translate(-50%, -150%)`;
        
        setTimeout(() => icon.classList.remove('fast-spin'), 300);
    }, 1200);
};