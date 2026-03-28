// ==========================================
// NEW HYBRID GIFT ANIMATION SYSTEM (WEBM + SVG TRAJECTORY)
// ==========================================

const giftAssets = {
    // 🔴 OLD WEBM GIFTS
    'Drink': { file: './drink.webm', type: 'webm' },
    'Couple': { file: './couple.webm', type: 'webm' },
    'King Queen': { file: './king,queen.webm', type: 'webm' },
    'Romance': { file: './romance.webm', type: 'webm' },
    'My Love': { file: './my,love.webm', type: 'webm' },
    'Drinking Couple': { file: './drinking,couple.webm', type: 'webm' },
    'Proposal': { file: './proposal.webm', type: 'webm' },
    'Dragon': { file: './dragon.webm', type: 'webm' },
    
    // 🟢 4 NEW SVG GIFTS
    'Kiss': { file: './kiss_gift.svg', type: 'svg' },
    'Diamond': { file: './Diamond_gift.svg', type: 'svg' },
    'Ring': { file: './ring_gift.svg', type: 'svg' },
    'Heart': { file: './heart_gift.svg', type: 'svg' }
};

let currentGiftAnimationId = null;

window.playGiftAnimation = function(senderUid, senderName, receiverUidsArr, giftName, timestamp, giftType) {
    if (Date.now() - timestamp > 15000) return;

    let giftObj = giftAssets[giftName];
    if (!giftObj) return;

    if (giftObj.type === 'svg' || giftType === 'svg') {
        playSVGTrajectoryAnimation(senderUid, receiverUidsArr, giftObj.file);
    } else {
        playWebmAnimation(giftObj.file);
    }
};

// =====================================
// 1. SVG CURVED TRAJECTORY ANIMATION (BOTTOM DROP & PERFECT SPACING)
// =====================================
function playSVGTrajectoryAnimation(senderUid, receiverUids, svgFile) {
    function getSeatCenter(uid) {
        let seats = window.currentRoomSeats || {};
        for (let i = 1; i <= 10; i++) {
            if (seats[`seat${i}`] && seats[`seat${i}`].uid === uid) {
                let seatEl = document.getElementById(`cont-seat${i}`);
                if(seatEl) {
                    let rect = seatEl.getBoundingClientRect();
                    return {
                        x: rect.left + (rect.width / 2),
                        y: rect.top + (rect.height / 2)
                    };
                }
            }
        }
        return null; 
    }

    // 🔥 آپ کی ڈرائنگ کے مطابق: گفٹ پہلے نیچے آئے گا (سکرین کے 65% نچلے حصے پر)
    let dropPointX = window.innerWidth / 2;
    let dropPointY = window.innerHeight * 0.65; // یہ جگہ لائیو پٹی اور چیٹ کے بالکل اوپر بنتی ہے

    let senderPos = getSeatCenter(senderUid);
    
    // 🔥 فکس: اگر گفٹ سینڈ کرنے والا مائیک پر نہیں بیٹھا (senderPos === null)، 
    // تو گفٹ سکرین کے بالکل درمیان میں اوپر (Top Center) سے نکلے گا۔
    let startX = senderPos ? senderPos.x : (window.innerWidth / 2); // سکرین کا بالکل درمیانی حصہ
    let startY = senderPos ? senderPos.y : 60; // اوپر سے تھوڑا سا نیچے (ریڈ سرکل والی جگہ)

    // ہر ریسیور کے لیے گفٹ نکالنا
    receiverUids.forEach((rUid, index) => {
        // 🔥 وقفہ (Delay) فکس: 100ms کو بڑھا کر 400ms کر دیا گیا ہے۔ 
        // اب اگر 3 لوگوں کو گفٹ دیا ہے تو وہ ایک کے پیچھے ایک خوبصورتی سے نکلیں گے (مکس نہیں ہوں گے)
        setTimeout(() => {
            let receiverPos = getSeatCenter(rUid);

            let endX = receiverPos ? receiverPos.x : dropPointX;
            let endY = receiverPos ? receiverPos.y : dropPointY;

            let el = document.createElement('img');
            el.src = svgFile;
            el.className = 'svg-gift-fly';
            
            el.style.transform = `translate3d(${startX - 30}px, ${startY - 30}px, 0px) scale(0.1)`;
            document.body.appendChild(el);

            let isSelfGift = (senderUid === rUid);
            let animationFrames =[];

            if (isSelfGift) {
                // اپنی ڈی پی -> نیچے سکرین کے سینٹر میں -> واپس اوپر اپنی ڈی پی
                animationFrames =[
                    { transform: `translate3d(${startX - 30}px, ${startY - 30}px, 0) scale(0.2)`, opacity: 1, offset: 0 },
                    { transform: `translate3d(${dropPointX - 30}px, ${dropPointY - 30}px, 0) scale(2.5)`, opacity: 1, offset: 0.5 },
                    { transform: `translate3d(${startX - 30}px, ${startY - 30}px, 0) scale(0.5)`, opacity: 1, offset: 1 }
                ];
            } else {
                // اپنی ڈی پی -> نیچے سکرین کے سینٹر میں -> کراس کر کے اوپر ریسیور کی ڈی پی
                animationFrames =[
                    { transform: `translate3d(${startX - 30}px, ${startY - 30}px, 0) scale(0.2)`, opacity: 1, offset: 0 },
                    { transform: `translate3d(${dropPointX - 30}px, ${dropPointY - 30}px, 0) scale(2.5)`, opacity: 1, offset: 0.5 },
                    { transform: `translate3d(${endX - 30}px, ${endY - 30}px, 0) scale(0.5)`, opacity: 1, offset: 1 }
                ];
            }

            el.animate(animationFrames, {
                duration: 1200, 
                easing: 'ease-in-out', // سموتھ باؤنس ایفیکٹ
                fill: 'forwards'
            }).onfinish = () => el.remove();

        }, index * 400); // 400ms کا گیپ ہر گفٹ کے درمیان
    });
}
// =====================================
// 2. WEBM FULLSCREEN ANIMATION
// =====================================
function playWebmAnimation(webmSrc) {
    let containerEl = document.getElementById('gift-animation-container');
    let videoEl = document.getElementById('gift-video-player');
    let canvasEl = document.getElementById('gift-canvas-player');
    let textEl = document.getElementById('gift-animation-text');

    if (containerEl && videoEl && canvasEl) {
        if (currentGiftAnimationId) cancelAnimationFrame(currentGiftAnimationId);
        
        const ctx = canvasEl.getContext('2d', { willReadFrequently: true });
        
        videoEl.src = webmSrc;
        videoEl.muted = false; 
        videoEl.volume = 1.0; 
        videoEl.load();

        textEl.innerHTML = ''; 
        
        containerEl.classList.remove('hidden');
        containerEl.style.display = 'flex';

        canvasEl.style.mixBlendMode = 'screen'; 
        canvasEl.style.opacity = '1';

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
                
                let frame = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
                let length = frame.data.length / 4;
                let isGreenScreen = false;

                if (length > 100) {
                    let sampleR = frame.data[400 + 0];
                    let sampleG = frame.data[400 + 1];
                    let sampleB = frame.data[400 + 2];
                    if (sampleG > 120 && sampleG > sampleR * 1.5 && sampleG > sampleB * 1.5) {
                        isGreenScreen = true;
                    }
                }

                if (isGreenScreen) {
                    canvasEl.style.mixBlendMode = 'normal'; 
                    for (let i = 0; i < length; i++) {
                        let r = frame.data[i * 4 + 0];
                        let g = frame.data[i * 4 + 1];
                        let b = frame.data[i * 4 + 2];

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

        videoEl.onended = () => {
            closeGiftAnimation(containerEl, videoEl, ctx, canvasEl);
        };

        setTimeout(() => {
            closeGiftAnimation(containerEl, videoEl, ctx, canvasEl);
        }, 8000); 
    }
}

function closeGiftAnimation(container, video, ctx, canvas) {
    container.classList.add('hidden');
    container.style.display = 'none';
    video.pause();
    video.src = "";
    canvas.style.mixBlendMode = 'normal'; 
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); 
    if (currentGiftAnimationId) cancelAnimationFrame(currentGiftAnimationId);
}