// ================= ZEGOCLOUD (REAL VOICE CHAT) FAST SYSTEM =================
// Configured for Custom UI (Android Webview & Web Compatible)

const ZEGO_APP_ID = 382127381; // آپ کی نئی APP ID
const ZEGO_SERVER_SECRET = "f9a1c2fd37891295a82855e064cc19ed357cc57be701d5072f67ca76857da23c"; // آپ کا نیا Secret

let zg = null;
let localZegoStream = null;
let publishedStreamId = null;
let currentSeatId = null;

// 💡 1. AUTO TOKEN GENERATOR (یہ خود ٹوکن بنائے گا، کسی سرور کی ضرورت نہیں)
function generateZegoToken(appId, serverSecret, userId) {
    try {
        const nonce = new Date().getTime().toString() + Math.floor(Math.random() * 100000).toString();
        const time = Math.floor(new Date().getTime() / 1000);
        const expire = time + (24 * 60 * 60); // 24 hours expiry
        
        const payloadObject = { app_id: appId, user_id: userId.toString(), nonce: nonce, privilege: { 1: 1, 2: 1 }, stream_id_list: null };
        const payload = JSON.stringify(payloadObject);
        
        const secret = CryptoJS.enc.Utf8.parse(serverSecret);
        const iv = CryptoJS.enc.Utf8.parse(serverSecret.substring(0, 16));
        const encrypted = CryptoJS.AES.encrypt(payload, secret, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        
        const encryptedBytes = encrypted.ciphertext;
        const buffer = new Uint8Array(28 + encryptedBytes.sigBytes);
        const dataView = new DataView(buffer.buffer);
        
        dataView.setUint32(0, expire, false);
        
        const ivBytes = CryptoJS.enc.Utf8.parse(serverSecret.substring(0, 16));
        for (let i = 0; i < 16; i++) { buffer[4 + i] = ivBytes.words[i >>> 2] >>> (24 - (i % 4) * 8) & 0xff; }
        
        dataView.setUint16(20, encryptedBytes.sigBytes, false);
        for (let i = 0; i < encryptedBytes.sigBytes; i++) { buffer[22 + i] = encryptedBytes.words[i >>> 2] >>> (24 - (i % 4) * 8) & 0xff; }
        
        return "04" + btoa(String.fromCharCode.apply(null, buffer));
    } catch(e) {
        console.error("Token Error:", e);
        return "";
    }
}

// 💡 2. SETUP ZEGO (بغیر کسی پوپ اپ کے خاموشی سے کنیکٹ ہوگا)
window.listenForSignals = async () => {
    try {
        // کرنٹ روم اور یوزر مین فائل سے آئیں گے
        const currentRoomId = window.currentRoomId;
        const currentUser = window.currentUser;

        if (!currentRoomId || !currentUser) return false;

        if (!zg) {
            zg = new window.ZegoExpressEngine(ZEGO_APP_ID, `wss://webliveroom${ZEGO_APP_ID}-api.zego.im/ws`);
            
            zg.on('roomStreamUpdate', async (roomID, updateType, streamList) => {
                if (updateType === 'ADD') {
                    for (let i = 0; i < streamList.length; i++) {
                        try {
                            const remoteStream = await zg.startPlayingStream(streamList[i].streamID);
                            const audio = document.createElement('audio');
                            audio.id = `zego-audio-${streamList[i].streamID}`;
                            audio.autoplay = true;
                            audio.playsInline = true; // Android کے لیے ضروری
                            audio.srcObject = remoteStream;
                            document.getElementById('remote-audio-container').appendChild(audio);
                        } catch(e) { console.error("Play stream error", e); }
                    }
                } else if (updateType === 'DELETE') {
                    streamList.forEach(stream => {
                        zg.stopPlayingStream(stream.streamID);
                        const audio = document.getElementById(`zego-audio-${stream.streamID}`);
                        if (audio) audio.remove();
                    });
                }
            });

            zg.on('soundLevelUpdate', (soundLevelList) => {
                soundLevelList.forEach(item => {
                    let uid = item.streamID.split('_')[1]; 
                    let seatId = null;
                    const currentRoomSeats = window.currentRoomSeats;
                    if(currentRoomSeats) {
                        for (let k in currentRoomSeats) { if (currentRoomSeats[k] && currentRoomSeats[k].uid === uid) { seatId = k; break; } }
                    }
                    if (seatId && item.soundLevel > 10) showRipple(seatId); else if (seatId) removeRipple(seatId);
                });
            });
        }

        const autoToken = generateZegoToken(ZEGO_APP_ID, ZEGO_SERVER_SECRET, currentUser.uid);
        await zg.loginRoom(currentRoomId, autoToken, { userID: currentUser.uid, userName: currentUser.displayName }, { userUpdate: true });
        zg.setSoundLevelDelegate(true, 100); 
        console.log("✅ Zego Login Done for Voice Chat");
        return true;
    } catch(e) {
        console.error("Zego Login failed silently.", e);
        return false;
    }
};

// 💡 3. SIT DOWN (مائیک پر بیٹھنے کا فنکشن)
window.sitDown = async (sid, def) => {
    const currentRoomId = window.currentRoomId;
    const currentUser = window.currentUser;
    const currentRoomSeats = window.currentRoomSeats;
    const db = window.db;
    const ref = window.ref;
    const set = window.set;
    const update = window.update;
    const child = window.child;
    const get = window.get;
    const onDisconnect = window.onDisconnect;

    const sr = ref(db, `rooms/${currentRoomId}/seats`);
    
    if (currentRoomSeats[sid] && (currentRoomSeats[sid].locked || currentRoomSeats[sid].uid)) return;
    
    // Firebase Data Update
    let unseatUpdates = {};
    ['seat1','seat2','seat3','seat4','seat5','seat6','seat7','seat8','seat9','seat10'].forEach(k => {
        if (currentRoomSeats[k] && currentRoomSeats[k].uid === currentUser.uid) { unseatUpdates[k] = null; }
    });

    const userSnap = await get(ref(db, `users/${currentUser.uid}`));
    const userData = userSnap.val() || {};
    
    await update(sr, unseatUpdates);
    const targetSeatRef = child(sr, sid);
    await set(targetSeatRef, {
        uid: currentUser.uid,
        name: currentUser.displayName,
        pic: currentUser.photoURL,
        frame: userData.currentFrame || null,
        isOfficial: userData.isOfficial || false,
        nameColorClass: userData.nameColorClass || null
    });
    onDisconnect(targetSeatRef).remove();
    
    currentSeatId = sid;
    window.currentSeatId = sid; // Global update
    
    const menuEl = document.getElementById(`menu-${sid}`);
    if (menuEl) menuEl.style.display = 'none';

    // Zego Voice Publish
    try {
        if (!zg) {
            await window.listenForSignals();
        }

        if (zg) {
            localZegoStream = await zg.createStream({camera: false, mic: true});
            publishedStreamId = "stream_" + currentUser.uid; 
            await zg.startPublishingStream(publishedStreamId, localZegoStream);
            
            if(window.Swal) {
                Swal.fire({toast: true, icon: 'success', title: 'Mic Connected!', position: 'bottom', showConfirmButton: false, timer: 1500, background: '#111', color: '#fff'});
            }
        }
    } catch (err) {
        console.error("Mic Error: Android Permissions might be needed.", err);
    }
};

// 💡 4. LEAVE SEAT
window.leaveSeat = async (sid) => {
    const currentRoomId = window.currentRoomId;
    const db = window.db;
    const ref = window.ref;
    const remove = window.remove;
    const onDisconnect = window.onDisconnect;

    const seatRef = ref(db, `rooms/${currentRoomId}/seats/${sid}`);
    cleanupRipples();
    onDisconnect(seatRef).cancel();
    await remove(seatRef);
    
    const menuEl = document.getElementById(`menu-${sid}`);
    if (menuEl) menuEl.style.display = 'none';
    
    if (currentSeatId === sid) {
        currentSeatId = null;
        window.currentSeatId = null;
        if (zg && publishedStreamId) {
            zg.stopPublishingStream(publishedStreamId);
            if (localZegoStream) { zg.destroyStream(localZegoStream); localZegoStream = null; }
            publishedStreamId = null;
        }
    }
};

// 💡 5. CLEANUP ON LEAVING ROOM
window.cleanupWebRTC = async () => {
    const currentRoomId = window.currentRoomId;
    cleanupRipples();
    if (zg && currentRoomId) {
        if (publishedStreamId) { zg.stopPublishingStream(publishedStreamId); publishedStreamId = null; }
        if (localZegoStream) { zg.destroyStream(localZegoStream); localZegoStream = null; }
        zg.logoutRoom(currentRoomId);
    }
    const container = document.getElementById('remote-audio-container');
    if (container) container.innerHTML = '';
};

// 💡 6. TOGGLE MIC / SPEAKER
window.toggleMic = () => {
    const btn = document.getElementById('btn-mic');
    window.isMicMuted = !window.isMicMuted;
    
    if (localZegoStream) zg.muteMicrophone(window.isMicMuted);
    
    if (window.isMicMuted) {
        btn.className = 'fa-solid fa-microphone-slash room-icon-btn text-gray-500';
        removeRipple(currentSeatId);
    } else {
        btn.className = 'fa-solid fa-microphone room-icon-btn text-white';
    }
};

window.toggleSpeaker = () => {
    const btn = document.getElementById('btn-speaker');
    window.isSpeakerMuted = !window.isSpeakerMuted;
    
    document.querySelectorAll('#remote-audio-container audio').forEach(a => {
        a.muted = window.isSpeakerMuted;
    });
    
    btn.className = window.isSpeakerMuted ? 'fa-solid fa-volume-xmark room-icon-btn text-gray-500' : 'fa-solid fa-volume-high room-icon-btn text-white';
};

// 💡 7. ANIMATIONS (RIPPLES)
function showRipple(seatId) {
    const seatContainer = document.getElementById(`cont-${seatId}`);
    if (!seatContainer) return;
    const visualRoot = seatContainer.querySelector('.visual-root');
    if (!visualRoot) return;
    if (!visualRoot.querySelector('.mic-ripple')) {
        const ripple = document.createElement('div');
        ripple.className = 'mic-ripple';
        visualRoot.appendChild(ripple);
    }
}

function removeRipple(seatId) {
    if (!seatId) return;
    const seatContainer = document.getElementById(`cont-${seatId}`);
    if (seatContainer) {
        const rip = seatContainer.querySelector('.mic-ripple');
        if (rip) rip.remove();
    }
}

function cleanupRipples() { 
    document.querySelectorAll('.mic-ripple').forEach(el => el.remove()); 
}

// آٹو سٹارٹ سگنلز جب پیج لوڈ ہو
setTimeout(() => { if (typeof listenForSignals === 'function') listenForSignals(); }, 1500);