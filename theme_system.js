// ==========================================
// YARAAN - THEME SYSTEM (HTML, CSS & LOGIC)
// ==========================================

const themeSystemHTML = `
<style>
    /* Grid Layout */
    .theme-grid-new { 
        display: grid; 
        grid-template-columns: repeat(3, 1fr); 
        gap: 12px; 
        margin-top: 15px; 
        padding-bottom: 20px; 
    }
    
    /* Card Design - Fixed Height */
    .theme-card-new { 
        border-radius: 12px; 
        overflow: hidden; 
        position: relative; 
        height: 160px; /* فکس اونچائی */
        border: 2px solid transparent; 
        cursor: pointer; 
        background: #2a2a2a; 
        transition: transform 0.2s; 
        box-shadow: 0 4px 8px rgba(0,0,0,0.4); 
    }
    
    .theme-card-new:active { transform: scale(0.95); }
    .theme-card-new.active { border-color: #22c55e; } /* سبز بارڈر جب اپلائی ہو جائے */
    
    /* Image - یہ اب بٹن کے اوپر رہے گی، بٹن کو نہیں دبائے گی */
    .theme-card-new img { 
        position: absolute;
        top: 0;
        left: 0;
        width: 100%; 
        height: calc(100% - 32px); /* بٹن کے لیے 32px کی جگہ چھوڑ دی گئی ہے */
        object-fit: cover; 
    }
    
    /* Custom Upload Box */
    .theme-custom-add { 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center;
        color: #a855f7; 
        border: 2px dashed #a855f7; 
        background: #1a1a1a; 
    }
    
    /* USE Button - بالکل نیچے اور صاف شو ہوگا */
    .theme-btn { 
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%; 
        height: 32px; /* بٹن کی فکس اونچائی */
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px; 
        font-weight: 900; 
        text-transform: uppercase; 
        letter-spacing: 0.5px;
    }
    
    /* Official Red Tag */
    .official-tag { 
        position: absolute; 
        top: 0; left: 0; 
        width: 100%; 
        background: linear-gradient(to right, #dc2626, #ef4444); 
        color: white; font-size: 9px; font-weight: bold; 
        text-align: center; padding: 3px 0; z-index: 10; 
        text-transform: uppercase; letter-spacing: 1px; 
    }
</style>

<!-- Theme Modal Overlay -->
<div id="theme-modal" class="fixed inset-0 bg-black/70 z-[8000] flex-col justify-end transition-opacity duration-300" style="display: none;" onclick="window.closeThemeModal()">
    <div class="bg-white w-full rounded-t-3xl pt-5 px-5 pb-[env(safe-area-inset-bottom)] flex flex-col h-[70vh] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] transform transition-transform" onclick="event.stopPropagation()">
        
        <div class="flex justify-between items-center mb-2">
            <div class="flex gap-4 border-b-2 border-transparent">
                <span class="font-black text-gray-900 border-b-2 border-purple-600 pb-2 text-lg tracking-wide">Room Themes</span>
            </div>
            <button onclick="window.closeThemeModal()" class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <!-- Themes Grid -->
        <div class="theme-grid-new overflow-y-auto flex-1 pr-1" id="theme-list-container">
            
            <!-- 1. Custom Image Upload (Gallery) -->
            <div class="theme-card-new theme-custom-add" onclick="window.triggerCustomThemeUpload()">
                <i class="fa-solid fa-cloud-arrow-up text-3xl mb-1"></i>
                <span class="text-[10px] font-bold text-white uppercase tracking-widest">Gallery</span>
                <input type="file" id="custom-theme-upload" accept="image/*" class="hidden" onchange="window.uploadCustomTheme(event)">
            </div>

            <!-- 2. Theme 1 (Official) -->
            <div class="theme-card-new" onclick="window.toggleThemeStatus('theme1.webp', this)">
                <div class="official-tag">Official</div>
                <img src="./theme1.webp" onerror="this.src='https://placehold.co/200x300?text=Theme+1'">
                <div class="theme-btn bg-gray-800 text-white">Use</div>
            </div>
            
            <!-- 3. Other 7 Themes -->
            ${[2, 3, 4, 5, 6, 7, 8].map(num => `
            <div class="theme-card-new" onclick="window.toggleThemeStatus('theme${num}.webp', this)">
                <img src="./theme${num}.webp" onerror="this.src='https://placehold.co/200x300?text=Theme+${num}'">
                <div class="theme-btn bg-gray-800 text-white">Use</div>
            </div>
            `).join('')}

        </div>
    </div>
</div>
`;

// Inject HTML into Body
document.body.insertAdjacentHTML('beforeend', themeSystemHTML);

// ================= LOGIC =================

let customThemeBase64 = null;

window.openThemeModal = async () => { 
    // Close other modal if open
    const roomSettings = document.getElementById('room-settings-modal');
    if (roomSettings) roomSettings.style.display = 'none';
    
    document.getElementById('theme-modal').style.display = 'flex'; 
    
    // Check Current Theme from Database
    const snap = await window.get(window.ref(window.db, `rooms/${window.currentRoomId}`));
    const currentTheme = (snap.exists() && snap.val().theme) ? snap.val().theme : 'theme1.webp';
    
    // سب سے پہلے سب بٹنز کو "USE" (گرے رنگ) پر سیٹ کریں
    document.querySelectorAll('.theme-card-new').forEach(card => {
        const btn = card.querySelector('.theme-btn');
        if(btn) {
            btn.innerText = "USE";
            btn.className = "theme-btn bg-gray-800 text-white";
            card.classList.remove('active');
        }
    });

    // جو تھیم اپلائی ہے اسے تلاش کر کے "USING" (سبز رنگ) کریں
    document.querySelectorAll('.theme-card-new').forEach(card => {
        const btn = card.querySelector('.theme-btn');
        const onclickAttr = card.getAttribute('onclick');
        if(onclickAttr && onclickAttr.includes(currentTheme)) {
            if(btn) {
                btn.innerText = "USING";
                btn.className = "theme-btn bg-green-500 text-white shadow-[0_-2px_10px_rgba(34,197,94,0.5)]";
                card.classList.add('active'); // Green border
            }
        }
    });
};

window.closeThemeModal = () => {
    document.getElementById('theme-modal').style.display = 'none';
};

window.toggleThemeStatus = async (themeData, element) => {
    const btn = element.querySelector('.theme-btn');
    
    // اگر پہلے سے اپلائی ہے تو کچھ نہ کرو
    if(btn && btn.innerText === "USING") {
        return; 
    } 
    
    // سب بٹنز کو دوبارہ "USE" پر سیٹ کر دو
    document.querySelectorAll('.theme-card-new').forEach(card => {
        const b = card.querySelector('.theme-btn');
        if(b) {
            b.innerText = "USE";
            b.className = "theme-btn bg-gray-800 text-white";
            card.classList.remove('active');
        }
    });
    
    // جس پر کلک کیا اسے فوراً "USING" (سبز) کر دو تاکہ یوزر کو پتہ چل جائے
    if(btn) {
        btn.innerText = "USING";
        btn.className = "theme-btn bg-green-500 text-white shadow-[0_-2px_10px_rgba(34,197,94,0.5)]";
        element.classList.add('active');
    }

    // تھیم اپلائی کرو اور تھوڑی دیر بعد پاپ اپ بند کر دو
    await window.applyTheme(themeData);
};

window.triggerCustomThemeUpload = () => {
    document.getElementById('custom-theme-upload').click();
};

window.uploadCustomTheme = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            customThemeBase64 = event.target.result;
            window.applyTheme(customThemeBase64);
        };
        reader.readAsDataURL(file);
    }
};

window.applyTheme = async (themeData) => { 
    if(!window.currentRoomId || window.currentRoomOwner !== window.currentUser.uid) return; 
    
    // Update Firebase
    await window.update(window.ref(window.db, `rooms/${window.currentRoomId}`), { theme: themeData }); 
    Swal.fire({toast:true, icon:'success', title:'Theme Applied', position:'top', timer:1500, showConfirmButton:false}); 
    
    // 0.4 سیکنڈ کے بعد پاپ اپ خود بخود بند ہو جائے گا
    setTimeout(() => {
        window.closeThemeModal();
    }, 400);
};