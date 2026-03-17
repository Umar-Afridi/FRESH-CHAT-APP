// =========================================================================
// YARAAN - AUTOMATIC CP WEEKLY REWARDS SYSTEM
// =========================================================================

window.initCPRewardsSystem = function() {
    // ہر 1 منٹ بعد چیک کرے گا کہ کیا اتوار کی صبح 5 بج چکے ہیں؟
    setInterval(checkAndDistributeCPRewards, 60000);
    // ایپ کھلتے ہی ایک بار چیک کرے گا
    checkAndDistributeCPRewards();
};

async function checkAndDistributeCPRewards() {
    if (!window.currentUser) return;

    let now = new Date();
    // Convert to PKT (Pakistan Standard Time)
    let pktTime = new Date(now.getTime() + (5 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60000));
    
    // Check if today is Sunday (0) and time is 5 AM or later
    if (pktTime.getDay() === 0 && pktTime.getHours() >= 5) {
        
        let year = pktTime.getFullYear();
        let weekNo = Math.ceil(pktTime.getDate() / 7);
        let month = pktTime.getMonth() + 1;
        let currentWeekId = `${year}-M${month}-W${weekNo}`;

        // چیک کریں کہ کیا ریوارڈ مل چکا ہے؟
        let rewardFlagRef = window.ref(window.db, `sys/cpRewardsHistory/${currentWeekId}`);
        let flagSnap = await window.get(rewardFlagRef);

        if (!flagSnap.exists()) {
            console.log(`🏆 Triggering CP Rewards for Week: ${currentWeekId}`);
            
            // ڈبل ریوارڈ سے بچنے کے لیے فلیگ سیٹ کر دیں
            await window.set(rewardFlagRef, { distributedAt: Date.now(), byUser: window.currentUser.uid });
            
            // ریوارڈ بھیجنا شروع کریں
            await executeCPRewardsDistribution(currentWeekId);
        }
    }
}

async function executeCPRewardsDistribution(weekId) {
    try {
        var usersSnap = await window.get(window.ref(window.db, 'users'));
        if (!usersSnap.exists()) return;

        var couplesMap = new Map();
        
        // پچھلے ہفتے کا ڈیٹا نکالیں
        usersSnap.forEach(function(snap) {
            var u = snap.val();
            if (u.cp && u.cp.partnerUid) {
                var points = Math.floor((u.cp.cpGiftAmount_weekly || 0) / 3000);
                if (points > 0) {
                    var pairKey = [u.uid, u.cp.partnerUid].sort().join('_');
                    if (!couplesMap.has(pairKey)) {
                        couplesMap.set(pairKey, {
                            u1Uid: u.uid,
                            u2Uid: u.cp.partnerUid,
                            points: points
                        });
                    }
                }
            }
        });

        var couplesArr = Array.from(couplesMap.values());
        couplesArr.sort(function(a, b) { return b.points - a.points; });

        // صرف Top 10 کو ریوارڈ دیں گے
        let limit = Math.min(10, couplesArr.length);
        for (var i = 0; i < limit; i++) {
            var rank = i + 1;
            var couple = couplesArr[i];
            
            // دونوں پارٹنرز کو باری باری ریوارڈ بھیجیں
            await sendRewardToUser(couple.u1Uid, rank, weekId);
            await sendRewardToUser(couple.u2Uid, rank, weekId);
        }

        console.log("✅ Weekly CP Rewards Distributed Successfully!");
        
        // سب کا ویکلی سکور زیرو (0) کر دیں
        usersSnap.forEach(async function(snap) {
            var u = snap.val();
            if(u.cp && u.cp.cpGiftAmount_weekly > 0) {
                await window.update(window.ref(window.db, `users/${u.uid}/cp`), {
                    cpGiftAmount_weekly: 0
                });
            }
        });

    } catch (error) {
        console.error("❌ Error distributing CP rewards:", error);
    }
}

async function sendRewardToUser(uid, rank, weekId) {
    var userRef = window.ref(window.db, `users/${uid}`);
    var userSnap = await window.get(userRef);
    if (!userSnap.exists()) return;
    
    var userData = userSnap.val();
    var coins = 0;
    var frameFile = "";
    var frameName = "";

    // رینک کے حساب سے ریوارڈز
    if (rank === 1) {
        coins = 100000; frameFile = "./frame_gold.png"; frameName = "Gold CP Frame";
    } else if (rank === 2) {
        coins = 50000; frameFile = "./frame_silver.png"; frameName = "Silver CP Frame";
    } else if (rank === 3) {
        coins = 25000; frameFile = "./frame_bronze.png"; frameName = "Bronze CP Frame";
    } else if (rank >= 4 && rank <= 10) {
        coins = 0; frameFile = "./frame_purple.png"; frameName = "Purple CP Frame";
    }

    // 1. کوائنز ایڈ کریں
    if (coins > 0) {
        var currentCoins = userData.coins || 0;
        await window.update(userRef, { coins: currentCoins + coins });
    }

    // 2. فریم کو Prop Warehouse میں بھیجیں (UNUSED رکھ کر)
    if (frameFile) {
        var expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 Days Validation
        var purchaseId = `cp_reward_${rank}_${Date.now()}`;
        
        var unlockedFrames = userData.unlockedFrames || {};
        unlockedFrames[purchaseId] = {
            img: frameFile,
            expiry: expiryTime,
            status: 'unused', // سیدھا Prop House میں جائے گا
            name: frameName,
            purchasedAt: Date.now()
        };
        await window.update(userRef, { unlockedFrames: unlockedFrames });
    }

    // 3. YARAAN Official ان باکس میسج (جس سے Red Dot شو ہو گا)
    let notifMessage = `<div style="text-align:center;">
        <h3 style="color:#facc15; font-size:16px; font-weight:bold; margin-bottom:5px;">CP Star Weekly Rewards! 🏆</h3>
        <p style="color:#d1d5db; font-size:12px; margin-bottom:15px;">Congratulations! You and your partner ranked <b>TOP ${rank}</b> this week.</p>`;
    
    if(coins > 0) {
        notifMessage += `<div style="display:flex; align-items:center; justify-content:center; gap:8px; background:#111827; padding:10px; border-radius:10px; margin-bottom:10px; border:1px solid #facc15;">
            <img src="./coin_icon.png" style="width:25px; height:25px; object-fit:contain;" onerror="this.src='https://placehold.co/25?text=C'"> 
            <span style="font-size:16px; font-weight:bold; color:#facc15;">+${coins.toLocaleString()} Coins</span>
        </div>`;
    }

    notifMessage += `<div style="display:flex; align-items:center; justify-content:center; gap:8px; background:#111827; padding:10px; border-radius:10px; border:1px solid #c084fc;">
        <img src="${frameFile}" style="width:30px; height:30px; object-fit:contain;" onerror="this.src='https://placehold.co/30?text=F'"> 
        <span style="font-size:14px; font-weight:bold; color:#e9d5ff;">${frameName} (7 Days)</span>
    </div>
    <p style="color:#9ca3af; font-size:11px; margin-top:15px; background:#1f2937; padding:5px; border-radius:5px;">
        ✅ Coins added to your Wallet.<br>✅ Frame added to your <b>Prop Warehouse</b>. Go and equip it now!
    </p>
    </div>`;

    await window.set(window.ref(window.db, `users/${uid}/inbox/system/${Date.now()}`), {
        fromName: 'YARAAN Official',
        icon: './yaraan_dp.png',
        message: notifMessage,
        type: 'sys',
        timestamp: Date.now()
    });
}