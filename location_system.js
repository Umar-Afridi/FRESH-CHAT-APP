// =======================================================
// YARAAN - FAST AUTO LOCATION & FLAG SYSTEM (FIXED)
// =======================================================

function getFlagEmoji(countryCode) {
    if(!countryCode) return '';
    // Country code کو فلیگ ایموجی میں بدلنے کا لاجک
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

async function initUserLocation() {
    try {
        // چیک کریں کہ یوزر لاگ ان ہے یا نہیں
        if (!window.currentUser || !window.db) return;

        const uid = window.currentUser.uid;
        const userRef = window.ref(window.db, `users/${uid}`);
        
        const snap = await window.get(userRef);
        const userData = snap.exists() ? snap.val() : null;

        // اگر یوزر کے ڈیٹا بیس میں ملک سیٹ نہیں ہے یا Unknown ہے، تب ہی API کال کرو
        if (!userData || !userData.country || userData.country === 'Unknown') {
            console.log("Fetching new location data...");
            
            // انتہائی فاسٹ اور لائف ٹائم فری API
            const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
            const ipData = await response.json();

            if (ipData && ipData.country) {
                const countryName = ipData.country; // مثلاً: Pakistan
                const flag = getFlagEmoji(ipData.country_code); // مثلاً: 🇵🇰

                // فائر بیس میں سیو کریں
                await window.update(userRef, {
                    country: countryName,
                    flag: flag
                });

                // لائیو ایپ میں ویلیوز اپڈیٹ کریں تاکہ ریفریش کی ضرورت نہ پڑے
                window.myUserCountry = countryName;
                window.myUserFlag = flag;

                console.log("Location successfully saved:", countryName, flag);
            }
        }
    } catch (error) {
        console.error("Location System Error:", error);
    }
}

// ایپ لوڈ ہونے کے 3 سیکنڈ بعد بیک گراؤنڈ میں خاموشی سے چلے گا تاکہ ایپ سلو نہ ہو
setTimeout(initUserLocation, 3000);