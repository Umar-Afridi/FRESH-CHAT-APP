// ================= FINAL SLIM WALLET SYSTEM (PKR & ABBREVIATIONS) =================

const walletStructure = `
<div id="wallet-full-view" class="fixed inset-0 bg-[#f8f9fa] z-[8000] hidden flex-col transition-transform transform translate-x-full duration-300 ease-in-out">
    <!-- Top Header -->
    <div class="flex items-center justify-between px-4 py-3 pt-12 bg-white border-b border-gray-100">
        <i class="fa-solid fa-chevron-left text-2xl text-gray-800 cursor-pointer active:opacity-50" onclick="closeWallet()"></i>
        <div class="flex gap-10">
            <span id="tab-coin" onclick="switchWalletTab('coin')" class="text-base font-black pb-1 cursor-pointer border-b-4 border-purple-600 text-gray-900 transition-all">Coin</span>
            <span id="tab-diamond" onclick="switchWalletTab('diamond')" class="text-base font-bold pb-1 cursor-pointer border-b-4 border-transparent text-gray-400 transition-all">Diamond</span>
        </div>
        <i class="fa-regular fa-file-lines text-2xl text-gray-800 cursor-pointer"></i>
    </div>

    <!-- Main Balance Card -->
    <div class="p-4">
        <div id="wallet-card-bg" class="relative w-full h-28 rounded-2xl p-5 flex flex-col justify-center text-white overflow-hidden shadow-lg transition-all duration-500 bg-gradient-to-br from-yellow-400 to-orange-600">
            <div class="flex items-center gap-2 mb-1 relative z-10">
                <img id="wallet-top-icon" src="./coin_icon.png" class="w-5 h-5 object-contain" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3135/3135673.png'">
                <span id="wallet-top-label" class="text-xs font-bold tracking-wide uppercase">Coin</span>
                <div class="ml-auto flex items-center gap-1 opacity-80 text-[10px] font-bold">
                    <i class="fa-regular fa-circle-question"></i> FAQ
                </div>
            </div>
            <div id="wallet-display-balance" class="text-4xl font-black tracking-tight relative z-10">...</div>
        </div>
    </div>

    <!-- Content Section -->
    <div class="flex-1 overflow-y-auto px-4 pb-10">
        <div id="view-coin-recharge" class="block animate-fadeIn">
            <div class="flex items-center justify-between mb-3">
                <span class="text-[11px] font-black text-gray-400 uppercase tracking-widest">Recharge by</span>
                <span class="bg-white text-gray-500 px-2 py-0.5 rounded-full text-[9px] font-bold border border-gray-100"><i class="fa-solid fa-location-dot mr-1"></i> Pakistan</span>
            </div>
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                <div class="p-4 flex items-center justify-between bg-gray-50/50">
                    <div class="flex items-center gap-3"><img src="https://cdn-icons-png.flaticon.com/512/349/349221.png" class="w-10 h-6 object-contain"><span class="font-black text-gray-800 text-sm">Visa/Master Card</span></div>
                    <i class="fa-solid fa-chevron-up text-gray-300 text-xs"></i>
                </div>
                <div class="p-2 space-y-2" id="recharge-list-container"></div>
            </div>
        </div>

        <div id="view-diamond-exchange" class="hidden animate-fadeIn">
            <div class="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Exchange Diamond to Coins</div>
            <div class="grid grid-cols-1 gap-3" id="exchange-list-container"></div>
        </div>
    </div>

    <!-- Slim Toast Notification -->
    <div id="slim-toast" class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-2 rounded-full shadow-2xl border border-gray-100 hidden z-[9999] flex items-center justify-center min-w-[200px] animate-toastIn">
        <span id="toast-text" class="text-black text-xs font-bold text-center">Message</span>
    </div>

    <!-- Slim Confirmation Bar -->
    <div id="slim-confirm" class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white w-[90%] max-w-[320px] rounded-full shadow-2xl border border-gray-100 hidden z-[9999] p-1 flex items-center justify-between animate-toastIn">
        <span id="confirm-text" class="text-black text-[11px] font-bold ml-4 truncate flex-1">Confirm Purchase?</span>
        <div class="flex gap-1">
            <button onclick="handleConfirm(false)" class="bg-gray-100 text-gray-500 px-4 py-2 rounded-full text-[10px] font-black">No</button>
            <button onclick="handleConfirm(true)" class="bg-purple-600 text-white px-5 py-2 rounded-full text-[10px] font-black">Yes</button>
        </div>
    </div>
</div>

<style>
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes toastIn { from { opacity: 0; transform: translate(-50%, 0%); } to { opacity: 1; transform: translate(-50%, -50%); } }
.animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
.animate-toastIn { animation: toastIn 0.2s ease-out forwards; }

.exchange-card { display: flex; align-items: center; justify-content: space-between; background: white; padding: 12px; border-radius: 16px; border: 1px solid #eee; transition: 0.2s; }
.exchange-card:active { transform: scale(0.97); }
.exchange-card span { font-size: 16px; font-weight: 900; color: #333; margin-left: 10px; flex: 1; }
.exchange-card button { display: flex; align-items: center; background: #8b5cf6; color: white; padding: 6px 15px; border-radius: 20px; font-weight: 800; font-size: 11px; border:none; }
.recharge-item { display: flex; justify-content: space-between; align-items: center; background: #f9f9f9; padding: 12px; border-radius: 12px; transition: 0.2s; }
</style>
`;

document.body.insertAdjacentHTML('beforeend', walletStructure);

// --- Core Functions ---

let walletListener = null;
let confirmCallback = null;

// Number Formatter (K, M, B)
function formatWalletNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 10000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toLocaleString();
}

window.openRechargeModal = function() {
    const wallet = document.getElementById('wallet-full-view');
    wallet.classList.remove('hidden');
    wallet.style.display = 'flex';
    setTimeout(() => { wallet.classList.remove('translate-x-full'); }, 10);
    renderRechargeList();
    renderExchangeList();
    startLiveBalanceListener();
};

window.closeWallet = function() {
    const wallet = document.getElementById('wallet-full-view');
    wallet.classList.add('translate-x-full');
    if(walletListener) { walletListener(); walletListener = null; }
    setTimeout(() => { wallet.style.display = 'none'; }, 300);
};

function showSlimMsg(text, duration = 2000) {
    const toast = document.getElementById('slim-toast');
    document.getElementById('toast-text').innerText = text;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, duration);
}

function startLiveBalanceListener() {
    if (!window.currentUser || !window.db) return;
    const userRef = window.ref(window.db, `users/${window.currentUser.uid}`);
    walletListener = window.onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            window.currentCoins = data.coins || 0;
            window.currentDiamonds = data.diamonds || 0;
            updateWalletDisplay();
        }
    });
}

window.switchWalletTab = function(type) {
    const coinTab = document.getElementById('tab-coin');
    const diamTab = document.getElementById('tab-diamond');
    const coinView = document.getElementById('view-coin-recharge');
    const diamView = document.getElementById('view-diamond-exchange');
    const card = document.getElementById('wallet-card-bg');
    const label = document.getElementById('wallet-top-label');
    const icon = document.getElementById('wallet-top-icon');

    if (type === 'coin') {
        coinTab.className = "text-base font-black pb-1 cursor-pointer border-b-4 border-purple-600 text-gray-900";
        diamTab.className = "text-base font-bold pb-1 cursor-pointer border-b-4 border-transparent text-gray-400";
        coinView.classList.remove('hidden'); diamView.classList.add('hidden');
        card.className = "relative w-full h-28 rounded-2xl p-5 flex flex-col justify-center text-white overflow-hidden shadow-lg bg-gradient-to-br from-yellow-400 to-orange-600";
        label.innerText = "Coin"; icon.src = "./coin_icon.png";
    } else {
        diamTab.className = "text-base font-black pb-1 cursor-pointer border-b-4 border-purple-600 text-gray-900";
        coinTab.className = "text-base font-bold pb-1 cursor-pointer border-b-4 border-transparent text-gray-400";
        diamView.classList.remove('hidden'); coinView.classList.add('hidden');
        card.className = "relative w-full h-28 rounded-2xl p-5 flex flex-col justify-center text-white overflow-hidden shadow-lg bg-gradient-to-br from-purple-500 to-indigo-700";
        label.innerText = "Diamond"; icon.src = "./diamond.png";
    }
    updateWalletDisplay();
};

function updateWalletDisplay() {
    const isDiamond = document.getElementById('tab-diamond').classList.contains('text-gray-900');
    const display = document.getElementById('wallet-display-balance');
    const value = isDiamond ? (window.currentDiamonds || 0) : (window.currentCoins || 0);
    display.innerText = formatWalletNumber(value);
}

function renderRechargeList() {
    const container = document.getElementById('recharge-list-container');
    // Prices changed to PKR (Rs.)
    const packages = [
        { amt: 189000, price: 300 },
        { amt: 945000, price: 1400, bonus: "+90,000 Bonus" },
        { amt: 4725000, price: 7000, bonus: "+900,000 Bonus" },
        { amt: 18900000, price: 28000, bonus: "+4,860,000 Bonus" }
    ];
    container.innerHTML = packages.map(p => `
        <div onclick="initiatePurchase(${p.amt}, ${p.price})" class="recharge-item">
            <div class="flex items-center gap-3">
                <img src="./coin_icon.png" class="w-8 h-8" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3135/3135673.png'">
                <div class="flex flex-col">
                    <span class="text-base font-black text-gray-800">${formatWalletNumber(p.amt)}</span>
                    ${p.bonus ? `<span class="text-orange-500 font-bold text-[9px]">${p.bonus}</span>` : ''}
                </div>
            </div>
            <button class="bg-indigo-600 text-white font-black px-4 py-1.5 rounded-full text-xs shadow-sm">Rs. ${p.price}</button>
        </div>
    `).join('');
}

function renderExchangeList() {
    const container = document.getElementById('exchange-list-container');
    const items = [
        { req: 1000, get: 330, label: "1000" },
        { req: 3000, get: 990, label: "3000" },
        { req: 10000, get: 3300, label: "10000" },
        { req: 30000, get: 9900, label: "30000" },
        { req: 100000, get: 33000, label: "100k" },
        { req: 300000, get: 99000, label: "300k" },
        { req: 1000000, get: 330000, label: "1M" }
    ];
    container.innerHTML = items.map(i => `
        <div onclick="exchangeDiamonds(${i.req}, ${i.get})" class="exchange-card">
            <img src="./coin_icon.png" class="w-6 h-6" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3135/3135673.png'">
            <span>${formatWalletNumber(i.get)}</span>
            <button><img src="./diamond.png" class="w-3 h-3 mr-1" onerror="this.src='https://cdn-icons-png.flaticon.com/512/616/616490.png'">${i.label}</button>
        </div>
    `).join('');
}

window.initiatePurchase = function(amount, price) {
    const confirmBox = document.getElementById('slim-confirm');
    document.getElementById('confirm-text').innerText = "Buy " + formatWalletNumber(amount) + " Coins?";
    confirmBox.classList.remove('hidden');
    confirmCallback = async (confirmed) => {
        confirmBox.classList.add('hidden');
        if (confirmed) {
            const newTotal = (window.currentCoins || 0) + amount;
            await window.update(window.ref(window.db, `users/${window.currentUser.uid}`), { coins: newTotal });
            window.showNotice("Recharge Successful");
        }
    };
};

window.exchangeDiamonds = async function(req, get) {
    if ((window.currentDiamonds || 0) < req) {
        window.showNotice("Low Diamonds!"); return;
    }
    const confirmBox = document.getElementById('slim-confirm');
    document.getElementById('confirm-text').innerText = "Convert " + formatWalletNumber(req) + " Diamonds?";
    confirmBox.classList.remove('hidden');
    confirmCallback = async (confirmed) => {
        confirmBox.classList.add('hidden');
        if (confirmed) {
            const newDiamonds = window.currentDiamonds - req;
            const newCoins = window.currentCoins + get;
            await window.update(window.ref(window.db, `users/${window.currentUser.uid}`), { 
                diamonds: newDiamonds, coins: newCoins 
            });
            showSlimMsg("Exchange Successful");
        }
    };
};

window.handleConfirm = (val) => { if(confirmCallback) confirmCallback(val); };