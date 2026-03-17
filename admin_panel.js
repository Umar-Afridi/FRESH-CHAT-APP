// =====================================================================
// FILE: admin_panel.js
// DESCRIPTION: Full Screen Official Admin Panel with Modern COMPACT UI
// =====================================================================

const adminPanelHTML = `
<div id="full-admin-view" class="fixed inset-0 bg-[#0f0c29] z-[9999] hidden flex-col transition-transform transform translate-x-full duration-300 ease-in-out font-['Montserrat']">
    
    <!-- Top Header (Compact) -->
    <div class="flex justify-between items-center p-3 pt-10 border-b border-red-500/20 bg-[#1f1a2a] shadow-md">
        <button onclick="closeAdminPanel()" class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-sm active:scale-90 transition">
            <i class="fa-solid fa-chevron-left text-sm"></i>
        </button>
        <h2 class="font-black text-base text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400 uppercase tracking-widest drop-shadow-md flex items-center">
            <i class="fa-solid fa-shield-halved mr-1.5 text-red-500"></i>Official Panel
        </h2>
        <div class="w-8"></div> <!-- Spacer for perfect centering -->
    </div>

    <div class="flex-1 overflow-y-auto pb-8">
        <!-- Search Section (Fixed Overflow & Size) -->
        <div class="p-4">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 ml-1">Search User by ID</p>
            <div class="flex items-center bg-[#2a1b3c] rounded-full border border-red-500/30 p-1 shadow-[0_0_10px_rgba(239,68,68,0.15)]">
                <div class="pl-3 text-red-400"><i class="fa-solid fa-magnifying-glass text-sm"></i></div>
                <input type="number" id="admin-search-id" class="flex-1 bg-transparent border-none outline-none text-white px-2 py-1.5 text-sm font-bold placeholder-gray-500" placeholder="Enter ID...">
                <button onclick="searchUserForAdmin()" class="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-full px-5 py-2 text-xs font-bold shadow-md hover:from-red-500 hover:to-red-400 active:scale-95 transition">Search</button>
            </div>
        </div>

        <!-- Target User Result Box (Compact) -->
        <div id="admin-target-user" class="hidden flex-col px-4 mb-4">
            
            <div class="bg-gradient-to-br from-[#1f1a2a] to-[#2a1b3c] rounded-2xl p-3 flex items-center gap-4 border border-red-500/20 shadow-lg relative overflow-hidden">
                <div class="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-xl pointer-events-none"></div>
                
                <div class="relative">
                    <img id="admin-target-dp" src="" class="w-14 h-14 rounded-full border-2 border-red-500 object-cover shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                </div>
                
                <div class="flex flex-col z-10">
                    <h3 id="admin-target-name" class="text-white font-black text-base mb-0.5">User Name</h3>
                    <div class="flex items-center gap-2">
                        <span class="bg-red-500/20 text-red-400 text-[9px] px-2 py-0.5 rounded-full font-bold border border-red-500/30" id="admin-target-uid-display">ID: <span>0000</span></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Action Grid (Compact) -->
        <div class="px-4">
            <h4 class="text-gray-400 text-[10px] font-bold uppercase mb-3 tracking-wider ml-1 flex items-center gap-1.5">
                <i class="fa-solid fa-bolt text-red-500"></i> Administrative Actions
            </h4>
            
            <div class="grid grid-cols-2 gap-3">
                
                <!-- Warn -->
                <div class="bg-orange-500/10 border border-orange-500/30 p-3.5 rounded-xl flex flex-col items-center justify-center cursor-pointer active:scale-95 transition hover:bg-orange-500/20" onclick="adminAction('warn')">
                    <div class="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center mb-2">
                        <i class="fa-solid fa-triangle-exclamation text-orange-500 text-lg"></i>
                    </div>
                    <span class="text-orange-500 font-bold text-[10px] uppercase tracking-wide">Send Warning</span>
                </div>

                <!-- Coins -->
                <div class="bg-green-500/10 border border-green-500/30 p-3.5 rounded-xl flex flex-col items-center justify-center cursor-pointer active:scale-95 transition hover:bg-green-500/20" onclick="adminAction('coins')">
                    <div class="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                        <i class="fa-solid fa-coins text-green-500 text-lg"></i>
                    </div>
                    <span class="text-green-500 font-bold text-[10px] uppercase tracking-wide">Send Coins</span>
                </div>

                <!-- Official Toggle (Head Admin Only) -->
                <div id="btn-make-official" class="bg-purple-500/10 border border-purple-500/30 p-3.5 rounded-xl flex flex-col items-center justify-center cursor-pointer active:scale-95 transition hover:bg-purple-500/20" onclick="adminAction('official')">
                    <div class="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mb-2">
                        <i class="fa-solid fa-certificate text-purple-500 text-lg"></i>
                    </div>
                    <span class="text-purple-500 font-bold text-[10px] uppercase tracking-wide text-center">Toggle Official</span>
                </div>

                <!-- Ban -->
                <div id="btn-ban-user" class="bg-red-500/10 border border-red-500/30 p-3.5 rounded-xl flex flex-col items-center justify-center cursor-pointer active:scale-95 transition hover:bg-red-500/20" onclick="adminAction('ban')">
                    <div class="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center mb-2">
                        <i class="fa-solid fa-ban text-red-500 text-lg"></i>
                    </div>
                    <span class="text-red-500 font-bold text-[10px] uppercase tracking-wide">Ban User</span>
                </div>

                <!-- Unban -->
                <div id="btn-unban-user" class="bg-blue-500/10 border border-blue-500/30 p-3.5 rounded-xl flex flex-col items-center justify-center cursor-pointer active:scale-95 transition hover:bg-blue-500/20" onclick="adminAction('unban')">
                    <div class="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
                        <i class="fa-solid fa-unlock text-blue-500 text-lg"></i>
                    </div>
                    <span class="text-blue-500 font-bold text-[10px] uppercase tracking-wide">Unban User</span>
                </div>

                <!-- Recover ID -->
                <div class="bg-teal-500/10 border border-teal-500/30 p-3.5 rounded-xl flex flex-col items-center justify-center cursor-pointer active:scale-95 transition hover:bg-teal-500/20" onclick="adminAction('recover')">
                    <div class="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center mb-2">
                        <i class="fa-solid fa-trash-arrow-up text-teal-500 text-lg"></i>
                    </div>
                    <span class="text-teal-500 font-bold text-[10px] uppercase tracking-wide text-center">Recover ID</span>
                </div>
                
                <!-- Delete ID -->
                <div class="col-span-2 bg-gray-500/10 border border-gray-500/30 p-3 rounded-xl flex flex-row items-center justify-center gap-3 cursor-pointer active:scale-95 transition hover:bg-gray-500/20 mt-1" onclick="adminAction('delete')">
                    <i class="fa-solid fa-trash text-gray-400 text-base"></i>
                    <span class="text-gray-400 font-bold text-[10px] uppercase tracking-wide">Delete Account Permanently</span>
                </div>

            </div>
        </div>
    </div>
</div>
`;

// Inject HTML into Body
document.body.insertAdjacentHTML('beforeend', adminPanelHTML);


// ================= 2. تمام جاوا سکرپٹ فنکشنز جو فائر بیس کے ساتھ کام کریں گے =================

let adminTargetUid = null;

// Open Panel Function
window.openAdminPanel = async function() {
    if (!window.currentUser) {
        Swal.fire({icon: 'error', title: 'Error', text: 'Please login first', background: '#111', color: '#fff'});
        return;
    }

    const view = document.getElementById('full-admin-view');
    view.classList.remove('hidden');
    view.style.display = 'flex';
    
    // Animation trigger
    setTimeout(() => { view.classList.remove('translate-x-full'); }, 10);
    
    // Reset Data
    document.getElementById('admin-target-user').classList.add('hidden');
    document.getElementById('admin-search-id').value = '';
    adminTargetUid = null;

    // Check Permissions (Head Official vs Normal Official)
    try {
        const userSnap = await window.get(window.ref(window.db, `users/${window.currentUser.uid}`));
        const userData = userSnap.val();
        const isHeadOfficial = (userData.customId === 10005);

        const makeOfficialBtn = document.getElementById('btn-make-official');
        if (makeOfficialBtn) {
            if (isHeadOfficial) {
                makeOfficialBtn.style.display = 'flex';
            } else {
                makeOfficialBtn.style.display = 'none';
            }
        }
    } catch(e) {
        console.error("Admin Auth Error:", e);
    }
};

// Close Panel Function
window.closeAdminPanel = function() {
    const view = document.getElementById('full-admin-view');
    view.classList.add('translate-x-full');
    setTimeout(() => { 
        view.classList.add('hidden'); 
        view.style.display = 'none'; 
    }, 300);
};

// Search User Function
window.searchUserForAdmin = async function() {
    const searchId = document.getElementById('admin-search-id').value.trim();
    if(!searchId) return;

    Swal.fire({title: 'Searching...', allowOutsideClick: false, showConfirmButton: false, background: '#111', color: '#fff'});

    try {
        const uidSnap = await window.get(window.ref(window.db, `idToUid/${searchId}`));
        if(!uidSnap.exists()) {
            Swal.fire({ icon: 'error', title: 'Not Found', text: 'No user exists with this ID.', background: '#111', color: '#fff' });
            return;
        }

        adminTargetUid = uidSnap.val();
        const userSnap = await window.get(window.ref(window.db, `users/${adminTargetUid}`));
        const userData = userSnap.val();

        document.getElementById('admin-target-dp').src = userData.photoURL || 'https://placehold.co/100';
        document.getElementById('admin-target-name').innerText = userData.username;
        document.getElementById('admin-target-uid-display').querySelector('span').innerText = searchId;

        document.getElementById('admin-target-user').classList.remove('hidden');
        document.getElementById('admin-target-user').classList.add('flex');
        
        Swal.close();

    } catch (error) {
        console.error("Search error:", error);
        Swal.fire({ icon: 'error', title: 'Error', text: error.message, background: '#111', color: '#fff' });
    }
};

// Actions Engine
window.adminAction = async function(action) {
    if(!adminTargetUid) return;

    try {
        const currentAdminSnap = await window.get(window.ref(window.db, `users/${window.currentUser.uid}`));
        const currentAdminData = currentAdminSnap.val();
        const isHeadOfficial = (currentAdminData.customId === 10005);
        
        const targetSnap = await window.get(window.ref(window.db, `users/${adminTargetUid}`));
        const targetData = targetSnap.val();
        const isTargetOfficial = targetData.isOfficial || false;
        const isTargetHeadOfficial = (targetData.customId === 10005);
        
        // Rule 1: No one can touch Head Official
        if(isTargetHeadOfficial) {
            return Swal.fire({ icon: 'error', title: 'Access Denied', text: 'Cannot perform actions on Head Official.', background: '#111', color: '#fff' });
        }
        
        // Rule 2: Only Head Official can touch other Officials
        if(isTargetOfficial && !isHeadOfficial) {
            return Swal.fire({ icon: 'error', title: 'Access Denied', text: 'Only Head Official can perform actions on other Officials.', background: '#111', color: '#fff' });
        }

        if(action === 'warn') {
            const { value: message } = await Swal.fire({
                title: 'Send Warning',
                input: 'textarea',
                inputPlaceholder: 'Type warning message...',
                showCancelButton: true,
                background: '#111', color: '#fff'
            });
            
            if (message) {
                await window.set(window.ref(window.db, `users/${adminTargetUid}/inbox/system/${Date.now()}`), {
                    fromName: 'YARAAN Official',
                    icon: './yaraan_dp.png',
                    message: `WARNING: ${message}`,
                    type: 'sys'
                });
                Swal.fire({icon: 'success', title: 'Sent', text: 'Warning sent successfully.', background: '#111', color: '#fff'});
            }
        }
        else if(action === 'coins') {
            const { value: amount } = await Swal.fire({
                title: 'Send Coins',
                input: 'number',
                inputPlaceholder: 'Enter Amount',
                showCancelButton: true,
                background: '#111', color: '#fff'
            });
            
            if (amount) {
                const currentCoins = Number(targetData.coins) || 0;
                await window.update(window.ref(window.db, `users/${adminTargetUid}`), {
                    coins: currentCoins + parseInt(amount)
                });
                Swal.fire({icon: 'success', title: 'Sent', text: `Sent ${amount} coins.`, background: '#111', color: '#fff'});
            }
        }
        else if(action === 'ban') {
            const result = await Swal.fire({
                title: 'Ban User?',
                text: 'This user will not be able to login.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                background: '#111', color: '#fff'
            });
            if (result.isConfirmed) {
                await window.update(window.ref(window.db, `users/${adminTargetUid}`), { isBanned: true });
                Swal.fire({icon: 'success', title: 'Banned', text: 'User has been banned.', background: '#111', color: '#fff'});
            }
        }
        else if(action === 'unban') {
            await window.update(window.ref(window.db, `users/${adminTargetUid}`), { isBanned: null });
            Swal.fire({icon: 'success', title: 'Unbanned', text: 'User has been restored.', background: '#111', color: '#fff'});
        }
        else if(action === 'official') {
            if(!isHeadOfficial) return;
            const newStatus = !targetData.isOfficial;
            const officialFrameFile = './official_frame.mp4';
            
            await window.update(window.ref(window.db, `users/${adminTargetUid}`), {
                isOfficial: newStatus,
                currentFrame: newStatus ? officialFrameFile : null
            });
            Swal.fire({icon: 'success', title: 'Success', text: `User is now ${newStatus ? 'an Official' : 'a regular user'}.`, background: '#111', color: '#fff'});
        }
        else if(action === 'delete') {
            const result = await Swal.fire({
                title: 'Delete Account?',
                text: 'This action can be recovered later.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                background: '#111', color: '#fff'
            });
            if (result.isConfirmed) {
                await window.update(window.ref(window.db, `users/${adminTargetUid}`), { 
                    isBanned: true, 
                    isDeleted: true,
                    username: "YARAAN User"
                });
                Swal.fire({icon: 'success', title: 'Deleted', text: 'Account deleted successfully.', background: '#111', color: '#fff'});
            }
        }
        else if(action === 'recover') {
            await window.update(window.ref(window.db, `users/${adminTargetUid}`), { 
                isBanned: null, 
                isDeleted: null
            });
            Swal.fire({icon: 'success', title: 'Recovered', text: 'Account successfully recovered.', background: '#111', color: '#fff'});
        }

    } catch (error) {
        console.error("Admin action error:", error);
        Swal.fire({icon: 'error', title: 'Error', text: error.message, background: '#111', color: '#fff'});
    }
};