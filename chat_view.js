// =====================================================================
// FILE: chat_view.js
// DESCRIPTION: WhatsApp/Modern Style Direct Message (DM) Chat View
// =====================================================================

// 1. Inject HTML and CSS into Body
const chatViewHTML = `
<style>
    /* Chat View Custom Styles */
    #full-chat-view {
        background-color: #f4f5f7;
    }
    .dm-bubble-me {
        background-color: #b2ece4; /* Light Cyan/Teal like screenshot */
        color: #000000;
        border-radius: 20px 20px 0 20px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        padding: 10px 14px;
        font-size: 14px;
        line-height: 1.4;
        max-width: 75%;
        word-wrap: break-word;
    }
    .dm-bubble-friend {
        background-color: #ffffff;
        color: #000000;
        border-radius: 20px 20px 20px 0;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        padding: 10px 14px;
        font-size: 14px;
        line-height: 1.4;
        max-width: 75%;
        word-wrap: break-word;
    }
    .chat-date-divider {
        text-align: center;
        font-size: 11px;
        color: #888;
        margin: 15px 0;
    }
    
    /* 🔴 FIX: فل پروفائل کو ہمیشہ سب سے اوپر رکھنے کے لیے */
    #full-profile-view {
        z-index: 99999 !important;
    }
</style>

<!-- 🔴 FIX: Chat View کا Z-index کم کر دیا (3900) تاکہ پروفائل اور ایموجی اس کے اوپر کھلیں -->
<div id="full-chat-view" class="fixed inset-0 z-[3900] hidden flex-col transition-transform transform translate-x-full duration-300 ease-in-out">
    
    <!-- Top Header -->
    <div class="bg-white flex items-center justify-between p-3 pt-10 shadow-sm border-b border-gray-100 z-20">
        <div class="flex items-center gap-3 w-full">
            <button onclick="closeDirectChat()" class="text-gray-700 p-1 active:scale-90 transition flex-shrink-0">
                <i class="fa-solid fa-chevron-left text-lg"></i>
            </button>
            
            <div class="flex-1 flex items-center gap-3 cursor-pointer" id="dm-top-profile-area">
                <!-- Data will be injected here via JS -->
            </div>
            
            <button class="text-gray-500 p-2 hover:bg-gray-100 rounded-full transition flex-shrink-0">
                <i class="fa-solid fa-ellipsis-vertical text-lg"></i>
            </button>
        </div>
    </div>

    <!-- Messages Area -->
    <div id="dm-message-list" class="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-2">
        <!-- Messages will load here -->
    </div>

    <!-- Fixed Bottom Input Area -->
    <div class="w-full shrink-0 relative z-20 bg-[#f4f5f7] border-t border-gray-200">
        <div class="flex items-center gap-2.5 px-3 py-2" style="padding-bottom: max(10px, env(safe-area-inset-bottom));">
            
            <!-- Image Upload Icon -->
            <button onclick="document.getElementById('dm-image-upload').click()" class="text-gray-500 text-2xl active:scale-90 transition p-1">
                <i class="fa-regular fa-image"></i>
            </button>
            <input type="file" id="dm-image-upload" accept="image/*" class="hidden" onchange="sendDirectImage(event)">

            <!-- Emoji Icon (Focuses input to open Keyboard) -->
            <button onclick="document.getElementById('dm-text-input').focus()" class="text-gray-500 text-2xl active:scale-90 transition p-1">
                <i class="fa-regular fa-face-smile"></i>
            </button>

            <!-- Text Input & Send Button -->
            <form id="dm-input-form" class="flex-1 flex items-center gap-2" onsubmit="sendDirectMessage(event)">
                <div class="flex-1 bg-white rounded-full flex items-center px-4 py-1 shadow-sm border border-gray-300">
                    <input type="text" id="dm-text-input" placeholder="Type a message..." class="w-full bg-transparent border-none outline-none text-sm text-gray-800 h-9" autocomplete="off">
                </div>
                <button type="submit" class="bg-[#7c3aed] text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-md active:scale-95 transition flex-shrink-0">
                    Send
                </button>
            </form>

        </div>
    </div>

</div>
`;

document.body.insertAdjacentHTML('beforeend', chatViewHTML);

// =====================================================================
// 2. Chat Logic & Realtime DB Functions
// =====================================================================

window.currentChatFriendId = null;
let friendDataCache = null;

// Open Chat Function
window.openDirectChat = async (friendUid, friendName) => { 
    window.currentChatFriendId = friendUid; 
    
    // Hide main app header and nav
    document.getElementById('app-header').style.display = 'none'; 
    document.getElementById('bottom-nav').classList.add('hidden'); 
    
    // Show Chat View
    const chatView = document.getElementById('full-chat-view'); 
    chatView.classList.remove('hidden'); 
    chatView.style.display = 'flex'; 
    setTimeout(() => { chatView.classList.remove('translate-x-full'); }, 10);

    // Fetch Friend Data for Header (Safe Mode)
    const uSnap = await window.get(window.ref(window.db, `users/${friendUid}`));
    let pic = 'https://placehold.co/100';
    let vBadgeHtml = '';
    let fData = {}; // ہم نے اسے لوکل کر دیا ہے تاکہ کریش نہ ہو
    
    if(uSnap.exists()) {
        fData = uSnap.val();
        pic = fData.photoURL || pic;
        if(fData.isOfficial || fData.customId === 10005) {
            vBadgeHtml = `<img src="./v_badge.png" class="absolute -bottom-1 -right-1 w-5 h-5 bg-transparent object-contain z-10 drop-shadow-md">`;
        }
    }

    // Check Follow Status
    const myFollowCheck = await window.get(window.ref(window.db, `users/${window.currentUser.uid}/friends/${friendUid}`));
    let followStatusHtml = '';
    
    if(myFollowCheck.exists()) {
        followStatusHtml = `<span class="text-[10px] text-gray-400 font-bold flex items-center gap-1"><i class="fa-solid fa-check"></i> Followed</span>`;
    } else {
        followStatusHtml = `<button onclick="event.stopPropagation(); followBackFromChat('${friendUid}', '${friendName}')" class="bg-purple-100 text-purple-600 text-[10px] px-2 py-0.5 rounded-md font-bold">Follow</button>`;
    }

    // ================= نیا جینڈر (Gender) لاجک =================
    let genderIconHtml = '<i class="fa-solid fa-mars text-blue-500 text-[10px]"></i>'; // Default Male
    if (fData.gender === 'female') {
        genderIconHtml = '<i class="fa-solid fa-venus text-pink-500 text-[10px]"></i>'; // Female
    }
    // =========================================================

    // Inject Header HTML
    document.getElementById('dm-top-profile-area').innerHTML = `
        <div class="flex items-center gap-3 w-full" onclick="openFullProfileView('${friendUid}')">
            <div class="relative flex-shrink-0">
                <img src="${pic}" class="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm">
                ${vBadgeHtml}
            </div>
            <div class="flex flex-col min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                    <span class="font-extrabold text-gray-900 text-base truncate ${fData.nameColorClass || ''}">${friendName}</span>
                    ${genderIconHtml}
                </div>
                ${followStatusHtml}
            </div>
        </div>
    `;
    
    // Set up Realtime Listener for Messages
    const chatId =[window.currentUser.uid, friendUid].sort().join('_'); 
    const chatRef = window.ref(window.db, `direct_messages/${chatId}`); 
    const msgList = document.getElementById('dm-message-list');
    msgList.innerHTML = '<p class="text-center text-gray-400 text-xs mt-10">Loading messages...</p>'; 
    
    window.onValue(chatRef, (snap) => { 
        msgList.innerHTML = ''; 
        if(snap.exists()) { 
            let lastDate = "";

            Object.values(snap.val()).forEach(msg => { 
                const isMe = msg.uid === window.currentUser.uid; 
                
                // Format Date (MM-DD)
                let msgDate = new Date(msg.timestamp);
                let dateStr = String(msgDate.getMonth() + 1).padStart(2, '0') + '-' + String(msgDate.getDate()).padStart(2, '0');
                
                // Show Date Divider if date changes
                if (dateStr !== lastDate) {
                    msgList.innerHTML += `<div class="chat-date-divider">${dateStr}</div>`;
                    lastDate = dateStr;
                }

                // Content (Text vs Image)
                let contentHtml = '';
                if (msg.msgType === 'image') {
                    contentHtml = `<img src="${msg.text}" class="rounded-xl w-48 object-cover cursor-pointer" onclick="viewFullScreenImage('${msg.text}')">`;
                } else {
                    contentHtml = msg.text;
                }

                // Render Bubble
                if (isMe) {
                    msgList.innerHTML += `
                    <div class="flex justify-end items-end gap-2 mb-3">
                        <div class="dm-bubble-me">${contentHtml}</div>
                        <img src="${window.currentUser.photoURL}" class="w-8 h-8 rounded-full object-cover shadow-sm flex-shrink-0 border border-gray-200">
                    </div>`;
                } else {
                    msgList.innerHTML += `
                    <div class="flex justify-start items-end gap-2 mb-3">
                        <img src="${pic}" class="w-8 h-8 rounded-full object-cover shadow-sm flex-shrink-0 border border-gray-200 cursor-pointer" onclick="openFullProfileView('${friendUid}')">
                        <div class="dm-bubble-friend">${contentHtml}</div>
                    </div>`;
                }
            }); 
            
            // Auto Scroll to bottom
            setTimeout(() => { msgList.scrollTop = msgList.scrollHeight; }, 100);
        } else { 
            msgList.innerHTML = '<div class="flex flex-col items-center justify-center mt-20"><img src="https://cdn-icons-png.flaticon.com/512/1041/1041916.png" class="w-16 h-16 opacity-30 mb-2"><p class="text-gray-400 text-xs">Say Hi!</p></div>'; 
        } 
    }); 
};

// Close Chat Function
window.closeDirectChat = () => {
    const chatView = document.getElementById('full-chat-view');
    if(chatView) {
        chatView.classList.add('translate-x-full');
        setTimeout(() => {
            chatView.classList.add('hidden');
            chatView.style.display = 'none';
        }, 300);
    }
    
    document.getElementById('app-header').style.display = 'flex';
    document.getElementById('bottom-nav').classList.remove('hidden');
    window.currentChatFriendId = null;
};

// Text Message Send Function
window.sendDirectMessage = async (e) => { 
    e.preventDefault(); 
    const input = document.getElementById('dm-text-input'); 
    const text = input.value.trim(); 
    
    if(text && window.currentChatFriendId) { 
        const chatId =[window.currentUser.uid, window.currentChatFriendId].sort().join('_'); 
        
        // --- 5 MESSAGE LIMIT LOGIC ---
        const myFollowCheck = await window.get(window.ref(window.db, `users/${window.currentUser.uid}/friends/${window.currentChatFriendId}`));
        const theirFollowCheck = await window.get(window.ref(window.db, `users/${window.currentChatFriendId}/friends/${window.currentUser.uid}`));
        
        if (!myFollowCheck.exists() || !theirFollowCheck.exists()) {
            const msgsSnap = await window.get(window.ref(window.db, `direct_messages/${chatId}`));
            let myMsgCount = 0;
            
            if(msgsSnap.exists()) {
                Object.values(msgsSnap.val()).forEach(m => {
                    if(m.uid === window.currentUser.uid && m.type !== 'system') myMsgCount++;
                });
            }
            
            if(myMsgCount >= 5) {
                input.value = '';
                return Swal.fire({
                    icon: 'warning', title: 'Limit Reached!', 
                    text: 'You can only send 5 messages until you both follow each other.', 
                    background: '#111', color: '#fff'
                });
            }
        }
        // ------------------------------

        window.push(window.ref(window.db, `direct_messages/${chatId}`), { 
            uid: window.currentUser.uid, 
            text: text, 
            type: 'chat', 
            msgType: 'text',
            timestamp: Date.now() 
        }); 
        
        input.value = ''; 
    } 
};

// Image Message Send Function
window.sendDirectImage = (e) => {
    const file = e.target.files[0];
    if (!file || !window.currentChatFriendId) return;

    Swal.fire({title: 'Sending Image...', allowOutsideClick: false, showConfirmButton: false, background: '#111', color: '#fff'});

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = async function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);

            const chatId =[window.currentUser.uid, window.currentChatFriendId].sort().join('_'); 
            await window.push(window.ref(window.db, `direct_messages/${chatId}`), { 
                uid: window.currentUser.uid, 
                text: compressedBase64, 
                type: 'chat', 
                msgType: 'image',
                timestamp: Date.now() 
            });

            Swal.close();
            document.getElementById('dm-image-upload').value = "";
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
};

// Full Screen Image Viewer
window.viewFullScreenImage = (base64Str) => {
    Swal.fire({
        imageUrl: base64Str,
        imageAlt: 'Chat Image',
        showConfirmButton: false,
        showCloseButton: true,
        width: 'auto',
        background: 'rgba(0,0,0,0.9)',
        backdrop: `rgba(0,0,0,0.9)`,
        customClass: { image: 'rounded-lg max-h-[80vh] object-contain' }
    });
};