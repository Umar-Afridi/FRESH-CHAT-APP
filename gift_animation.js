// ==========================================
// NEW WEBM GIFT ANIMATION SYSTEM (ADVANCED BLENDING + GREEN SCREEN FIX)
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

        textEl.innerHTML = ''; 
        
        containerEl.classList.remove('hidden');
        containerEl.style.display = 'flex';

        // 🔥 MAGIC FIX: CSS Blend Mode (SCREEN)
        // یہ کالے بیک گراؤنڈ کو بالکل سموتھ شفاف کر دے گا اور گفٹ کے اپنے کلرز/سوٹ کو بالکل نہیں کاٹے گا۔
        canvasEl.style.mixBlendMode = 'screen'; 
        canvasEl.style.opacity = '1';

        // جب ویڈیو کا ڈیٹا لوڈ ہو جائے تو سائز سیٹ کریں
        videoEl.onloadedmetadata = () => {
            canvasEl.width = videoEl.videoWidth;
            canvasEl.height = videoEl.videoHeight;
            videoEl.play().catch(e => console.error("Video play error:", e));
        };

        videoEl.onplay = () => {
            function processFrame() {
                if (videoEl.paused || videoEl.ended) return;
                
                ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
                ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
                
                // ہم نے کالا رنگ کاٹنے والا کوڈ مکمل ختم کر دیا ہے کیونکہ mixBlendMode اسے خود ہینڈل کر رہا ہے۔
                // یہ لاجک صرف اس صورت میں چلے گی اگر کوئی ویڈیو "Green Screen" (ہرے پردے) والی ہو۔
                let frame = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
                let length = frame.data.length / 4;
                let isGreenScreen = false;

                // چیک کریں کہ کیا ویڈیو کا بیک گراؤنڈ ہرا (Green) ہے؟
                if (length > 100) {
                    let sampleR = frame.data[400 + 0];
                    let sampleG = frame.data[400 + 1];
                    let sampleB = frame.data[400 + 2];
                    if (sampleG > 120 && sampleG > sampleR * 1.5 && sampleG > sampleB * 1.5) {
                        isGreenScreen = true;
                    }
                }

                if (isGreenScreen) {
                    canvasEl.style.mixBlendMode = 'normal'; // گرین سکرین کے لیے نارمل موڈ
                    for (let i = 0; i < length; i++) {
                        let r = frame.data[i * 4 + 0];
                        let g = frame.data[i * 4 + 1];
                        let b = frame.data[i * 4 + 2];

                        // انتہائی نارمل گرین سکرین کٹنگ
                        if (g > 90 && g > r * 1.2 && g > b * 1.2) {
                            frame.data[i * 4 + 3] = 0; 
                        }
                    }
                    ctx.putImageData(frame, 0, 0);
                }

                currentGiftAnimationId = requestAnimationFrame(processFrame);
            }
            processFrame();
        };

        // ویڈیو ختم ہونے پر سکرین کلیئر کریں
        videoEl.onended = () => {
            closeGiftAnimation(containerEl, videoEl, ctx, canvasEl);
        };

        // 8 سیکنڈ بعد احتیاطاً خود بخود غائب کر دیں (اگر ویڈیو لمبی ہو)
        setTimeout(() => {
            closeGiftAnimation(containerEl, videoEl, ctx, canvasEl);
        }, 8000); 
    }
};

function closeGiftAnimation(container, video, ctx, canvas) {
    container.classList.add('hidden');
    container.style.display = 'none';
    video.pause();
    video.src = "";
    canvas.style.mixBlendMode = 'normal'; // ری سیٹ
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); // سکرین بالکل صاف
    if (currentGiftAnimationId) cancelAnimationFrame(currentGiftAnimationId);
}