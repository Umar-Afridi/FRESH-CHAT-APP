// ==========================================
// NEW WEBM GIFT ANIMATION SYSTEM (PERFECT GREEN/BLACK SCREEN REMOVAL + SOUND)
// ==========================================

const giftWebmAssets = {
    'Drink': './drink.webm',
    'Couple': './couple.webm',
    'King Queen': './king,queen.webm',
    'Romance': './romance.webm',
    'My Love': './my,love.webm',
    'Drinking Couple': './drinking,couple.webm',
    'Proposal': './proposal.webm',
    'Dragon': './dragon.webm'
};

let currentGiftAnimationId = null;

window.playGiftAnimation = function(senderName, giftName, timestamp) {
    // ٹائم لمٹ 15 سیکنڈ کر دی گئی ہے تاکہ انٹرنیٹ سلو ہونے پر بھی اینیمیشن لازمی پلے ہو
    if (Date.now() - timestamp > 15000) return;

    let webmSrc = giftWebmAssets[giftName];
    if (!webmSrc) {
        console.error("Gift WebM not found for:", giftName);
        return;
    }

    let containerEl = document.getElementById('gift-animation-container');
    let videoEl = document.getElementById('gift-video-player');
    let canvasEl = document.getElementById('gift-canvas-player');
    let textEl = document.getElementById('gift-animation-text');

    if (containerEl && videoEl && canvasEl) {
        // اگر پہلے سے کوئی اینیمیشن چل رہی ہے تو اسے روک دیں
        if (currentGiftAnimationId) cancelAnimationFrame(currentGiftAnimationId);
        
        const ctx = canvasEl.getContext('2d', { willReadFrequently: true });
        
        videoEl.src = webmSrc;
        videoEl.muted = false; // ساؤنڈ آن کرنے کے لیے
        videoEl.volume = 1.0;  // والیوم فل کرنے کے لیے
        videoEl.load();

        textEl.innerHTML = ''; // ٹیکسٹ ریموو کر دیا گیا ہے، اب سکرین پر شو نہیں ہوگا
        
        containerEl.classList.remove('hidden');
        containerEl.style.display = 'flex';

        // جب ویڈیو کا ڈیٹا لوڈ ہو جائے تو سائز سیٹ کریں
        videoEl.onloadedmetadata = () => {
            canvasEl.width = videoEl.videoWidth;
            canvasEl.height = videoEl.videoHeight;
            videoEl.play().catch(e => console.error("Video play/audio error (Click anywhere on screen first):", e));
        };

        videoEl.onplay = () => {
            function processFrame() {
                if (videoEl.paused || videoEl.ended) return;
                
                // 🔴 FIX: پچھلے فریم کو کینوس سے صاف کرنا لازمی ہے ورنہ براؤن/گرے دھبے (Trails) بنیں گے
                ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
                
                ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
                let frame = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
                let length = frame.data.length / 4;

                for (let i = 0; i < length; i++) {
                    let r = frame.data[i * 4 + 0];
                    let g = frame.data[i * 4 + 1];
                    let b = frame.data[i * 4 + 2];
                    let a = frame.data[i * 4 + 3];

                    // 🔴 FIX: GREEN SCREEN کو کناروں سے سموتھ (Feather) کرنا تاکہ کٹے ہوئے نشان نہ آئیں
                    if (g > 70 && g > r * 1.1 && g > b * 1.1) {
                        let maxOther = Math.max(r, b);
                        let diff = g - maxOther;
                        
                        if (diff > 40) {
                            frame.data[i * 4 + 3] = 0; // خالص سبز حصہ بالکل غائب
                        } else {
                            // کناروں کو ہلکا (Transparent) کرنا
                            frame.data[i * 4 + 3] = a * (diff / 40);
                            frame.data[i * 4 + 1] = maxOther; // کناروں سے سبز رنگت (Spill) ختم کرنا
                        }
                    }
                    // 🔴 FIX: BLACK SCREEN کو سموتھ کرنا تاکہ گاڑی کے ٹائر غائب نہ ہوں
                    else if (r < 30 && g < 30 && b < 30) {
                        let maxDark = Math.max(r, g, b);
                        if (maxDark < 10) {
                            frame.data[i * 4 + 3] = 0; // خالص کالا رنگ بالکل غائب
                        } else {
                            frame.data[i * 4 + 3] = a * ((maxDark - 10) / 20); // کناروں کو بلینڈ کرنا
                        }
                    }
                }
                ctx.putImageData(frame, 0, 0);
                currentGiftAnimationId = requestAnimationFrame(processFrame);
            }
            processFrame();
        };

        // ویڈیو ختم ہونے پر سکرین کلیئر کریں
        videoEl.onended = () => {
            closeGiftAnimation(containerEl, videoEl, ctx, canvasEl);
        };

        // 6 سیکنڈ بعد احتیاطاً خود بخود غائب کر دیں
        setTimeout(() => {
            closeGiftAnimation(containerEl, videoEl, ctx, canvasEl);
        }, 6000); 
    }
};

function closeGiftAnimation(container, video, ctx, canvas) {
    container.classList.add('hidden');
    container.style.display = 'none';
    video.pause();
    video.src = "";
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); // سکرین بالکل صاف
    if (currentGiftAnimationId) cancelAnimationFrame(currentGiftAnimationId);
}