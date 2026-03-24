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

                    // 🔴 FIX: GREEN SCREEN کو نرم (Soft) کر دیا تاکہ مین گفٹ بالکل نہ کٹے
                    if (g > 90 && g > r * 1.3 && g > b * 1.3) {
                        let maxOther = Math.max(r, b);
                        let diff = g - maxOther;
                        
                        if (diff > 60) {
                            frame.data[i * 4 + 3] = 0; // صرف تیز سبز رنگ غائب ہوگا
                        } else {
                            // کناروں پر ہلکا سا بیک گراؤنڈ رہنے دیا ہے تاکہ مین چیز کی کٹنگ نہ ہو
                            frame.data[i * 4 + 3] = a * (diff / 60);
                            frame.data[i * 4 + 1] = maxOther + 10; // ہلکا سا اوریجنل کلر باقی رہے گا
                        }
                    }
                    // 🔴 FIX: BLACK SCREEN کو بہت نارمل کٹ کرنا تاکہ گفٹ کے کالے حصے (شیڈو، ٹائر وغیرہ) محفوظ رہیں
                    else if (r < 15 && g < 15 && b < 15) {
                        let maxDark = Math.max(r, g, b);
                        if (maxDark < 6) {
                            frame.data[i * 4 + 3] = 0; // صرف 100% فل کالا رنگ غائب ہوگا
                        } else {
                            // تھوڑا سا گہرا حصہ (شیڈو/بیک گراؤنڈ) ہلکا سا نظر آئے گا تاکہ گفٹ خراب نہ ہو
                            frame.data[i * 4 + 3] = a * ((maxDark - 6) / 9); 
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