// ==========================================
// NEW WEBP GIFT ANIMATION SYSTEM (FIXED)
// ==========================================

// چونکہ فائلز روٹ میں ہیں، اس لیے پاتھ ./ کے ساتھ ہیں
const giftWebpAssets = {
    'Rose': './rose.webp',
    'Ring': './ring.webp',
    'Car': './car.webp',
    'Rocket': './rocket_gift.webp',
    'Crown': './crown.webp',
    'Castle': './castle.webp',
    'Yacht': './yacht.webp',
    'Dragon': './dragon.webp'
};

window.playGiftAnimation = function(senderName, giftName, timestamp) {
    // اگر میسج 3 سیکنڈ سے پرانا ہے تو پلے نہ کرو (تاکہ روم جوائن کرتے ہی پرانے گفٹ پلے نہ ہوں)
    if (Date.now() - timestamp > 3000) return;

    let webpSrc = giftWebpAssets[giftName];
    if (!webpSrc) {
        console.error("Gift WebP not found for:", giftName);
        return;
    }

    let containerEl = document.getElementById('gift-animation-container');
    let imgEl = document.getElementById('gift-animation-player');
    let textEl = document.getElementById('gift-animation-text');

    if (containerEl) {
        // پہلے src خالی کر کے فوراً نیا src دیں تاکہ WebP اینیمیشن دوبارہ شروع سے پلے ہو
        imgEl.src = "";
        setTimeout(() => {
            imgEl.src = webpSrc;
        }, 50);

        // ٹیکسٹ اپڈیٹ کریں
        textEl.innerHTML = `${senderName} sent <br><span class="text-yellow-400 text-4xl">${giftName}</span>!`;
        
        // سکرین پر شو کروائیں
        containerEl.classList.remove('hidden');
        containerEl.style.display = 'flex';
        
        // 6 سیکنڈ بعد اینیمیشن غائب کر دیں
        setTimeout(() => {
            containerEl.classList.add('hidden');
            containerEl.style.display = 'none';
            imgEl.src = ""; // ریم (RAM) فری کرنے کے لیے
        }, 6000); 
    }
};