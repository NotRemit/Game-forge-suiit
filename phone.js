// Tokyo Metropolitan Police - Mobile Terminal Engine
// Handles sensor events (DeviceMotion shake, DeviceOrientation ear tilt), Web Audio, Speech, and PC sync

const STATE = {
    connected: false,
    activeScreen: 'screen-standby',
    currentCall: null, // 1 or 2
    isCallActive: false,
    isHeldToEar: false,
    shakeProgress: 0,
    simulatedEar: false,
    speechActive: false
};

// Audio & Sensor Contexts
let audioCtx = null;
let ringtoneInterval = null;
let staticNode = null;
let staticGain = null;
let speechUtterance = null;
let callTimerInterval = null;
let callSeconds = 0;

// Motion Sensor State
let lastAcc = { x: null, y: null, z: null };
const SHAKE_THRESHOLD = 18; // Acceleration delta threshold

// Broadcast & Sync
const broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('scribe_sigil_sync') : null;

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    initClock();
    initSensors();
    initSync();
    sendHeartbeat();
    setInterval(sendHeartbeat, 2500);
    setInterval(pollServerState, 600);
});

// Clock Display
function initClock() {
    function updateClock() {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const el = document.getElementById('current-clock');
        if (el) el.textContent = `${hrs}:${mins}`;
    }
    updateClock();
    setInterval(updateClock, 10000);
}

// Audio Engine (Web Audio API)
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Synthesize Phone Ringtone
function startRingtone() {
    stopRingtone();
    const ctx = getAudioContext();

    function playToneBurst() {
        try {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();

            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(440, ctx.currentTime);
            osc2.frequency.setValueAtTime(480, ctx.currentTime);

            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.start();
            osc2.start();
            osc1.stop(ctx.currentTime + 1.2);
        } catch (e) {
            console.warn('Audio ringtone error:', e);
        }

        // Haptic Vibration if supported
        if (navigator.vibrate) {
            navigator.vibrate([400, 200, 400, 200, 800]);
        }
    }

    playToneBurst();
    ringtoneInterval = setInterval(playToneBurst, 3000);
}

function stopRingtone() {
    if (ringtoneInterval) {
        clearInterval(ringtoneInterval);
        ringtoneInterval = null;
    }
    if (navigator.vibrate) {
        navigator.vibrate(0);
    }
}

// Continuous Static Audio Generator (for scrambling / interference)
function startStaticAudio(volume = 0.15) {
    stopStaticAudio();
    try {
        const ctx = getAudioContext();
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        staticNode = ctx.createBufferSource();
        staticNode.buffer = noiseBuffer;
        staticNode.loop = true;

        // Bandpass filter to make it sound like gritty phone static
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
        filter.Q.setValueAtTime(1.0, ctx.currentTime);

        staticGain = ctx.createGain();
        staticGain.gain.setValueAtTime(volume, ctx.currentTime);

        staticNode.connect(filter);
        filter.connect(staticGain);
        staticGain.connect(ctx.destination);

        staticNode.start();
    } catch (e) {
        console.warn('Static audio error:', e);
    }
}

function adjustStaticVolume(volume) {
    if (volume <= 0.01) {
        stopStaticAudio();
        return;
    }
    if (staticGain && audioCtx) {
        try {
            staticGain.gain.cancelScheduledValues(audioCtx.currentTime);
            staticGain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.15);
        } catch (e) {}
    }
}

function stopStaticAudio() {
    if (staticGain && audioCtx) {
        try {
            staticGain.gain.cancelScheduledValues(audioCtx.currentTime);
            staticGain.gain.setValueAtTime(0, audioCtx.currentTime);
        } catch (e) {}
    }
    if (staticNode) {
        try { staticNode.stop(); } catch (e) {}
        try { staticNode.disconnect(); } catch (e) {}
        staticNode = null;
    }
}

// Sound FX: Beep / Hangup
function playBeep(freq = 600, duration = 0.2) {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {}
}

// Speech Synthesis Helper
function speakMessage(text, pitch = 0.6, rate = 0.85, onEndCallback = null) {
    if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        if (onEndCallback) setTimeout(onEndCallback, 4000);
        return;
    }

    window.speechSynthesis.cancel();
    speechUtterance = new SpeechSynthesisUtterance(text);
    speechUtterance.pitch = pitch;
    speechUtterance.rate = rate;
    speechUtterance.volume = 1.0;

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const deepVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('Natural') || v.name.includes('David')));
    if (deepVoice) speechUtterance.voice = deepVoice;

    speechUtterance.onend = () => {
        STATE.speechActive = false;
        if (onEndCallback) onEndCallback();
    };

    STATE.speechActive = true;
    window.speechSynthesis.speak(speechUtterance);
}

// Screen Routing
function switchScreen(screenId) {
    // If leaving the static puzzle screens, kill all hissing audio immediately
    if (screenId !== 'screen-shake-reconnect' && screenId !== 'screen-call2-ear') {
        stopStaticAudio();
    }

    document.querySelectorAll('.screen-view').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });

    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
        STATE.activeScreen = screenId;
    }
}

// -------------------------------------------------------------------
// Sensor Interactions: Accelerometer Shake & Gyroscope Ear Proximity
// -------------------------------------------------------------------
function initSensors() {
    // Request permission on iOS 13+ if needed
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        // Will be triggered on first touch/call answer
    }

    // Accelerometer Shake Detection
    if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', handleMotion, false);
    }

    // Gyroscope / Orientation Tilt Detection (Hold to Ear)
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation, false);
    }
}

// Shake Handler (DeviceMotion)
function handleMotion(event) {
    if (STATE.activeScreen !== 'screen-shake-reconnect') return;

    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc) return;

    if (lastAcc.x !== null) {
        const deltaX = Math.abs(acc.x - lastAcc.x);
        const deltaY = Math.abs(acc.y - lastAcc.y);
        const deltaZ = Math.abs(acc.z - lastAcc.z);
        const magnitude = deltaX + deltaY + deltaZ;

        if (magnitude > SHAKE_THRESHOLD) {
            registerShakeEnergy(18);
        }
    }

    lastAcc.x = acc.x;
    lastAcc.y = acc.y;
    lastAcc.z = acc.z;
}

function registerShakeEnergy(amount) {
    STATE.shakeProgress = Math.min(100, STATE.shakeProgress + amount);
    updateShakeUI();

    // Haptic tick
    if (navigator.vibrate) navigator.vibrate(30);

    if (STATE.shakeProgress >= 100) {
        onShakeCompleted();
    }
}

function updateShakeUI() {
    const bar = document.getElementById('shake-progress-bar');
    const text = document.getElementById('shake-percent-text');
    if (bar) bar.style.width = `${STATE.shakeProgress}%`;
    if (text) text.textContent = Math.round(STATE.shakeProgress);
}

function registerHiddenTap() {
    registerShakeEnergy(20);
}

function onShakeCompleted() {
    // Trigger success buzz
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 300]);
    stopStaticAudio();
    playBeep(880, 0.3);

    // Notify PC / Server
    emitAction('SHAKE_COMPLETED');

    // Transition: incoming encrypted call 2!
    setTimeout(() => {
        triggerIncomingCall(2);
    }, 1200);
}

// Orientation Handler: Tilt / Acoustic Proximity
function handleOrientation(event) {
    if (STATE.activeScreen !== 'screen-call2-ear') return;

    const beta = event.beta; // Tilt front-to-back [-180, 180]

    // Phone held upright against ear: beta is typically between 55° and 115°
    const isUpright = (beta !== null && beta >= 55 && beta <= 115);
    setEarState(isUpright || STATE.simulatedEar);
}

function toggleSecretEar() {
    STATE.simulatedEar = !STATE.simulatedEar;
    setEarState(STATE.simulatedEar);
}

function setEarState(isNearEar) {
    if (STATE.isHeldToEar === isNearEar) return;
    STATE.isHeldToEar = isNearEar;

    const clarity = document.getElementById('audio-clarity-status');

    if (isNearEar) {
        // PROXIMITY ENGAGED: Decrypt audio, completely stop static hiss
        if (clarity) {
            clarity.className = 'clarity-status clear';
            clarity.innerHTML = '● ACOUSTIC PROXIMITY ENGAGED — LISTENING';
        }

        stopStaticAudio();
        if (navigator.vibrate) navigator.vibrate(100);

        // Whisper secret code into player's ear (NO visual text on screen)
        speakMessage(
            "Good. You have learned how to listen. The key cast into the dark is: SHADOW7743. I repeat: S-H-A-D-O-W-7-7-4-3. Enter it into your workstation... and consider this your final mercy.",
            0.55,
            0.8
        );
    } else {
        // DISPERSED: Scrambled static
        if (clarity) {
            clarity.className = 'clarity-status scrambled';
            clarity.innerHTML = '~ ~ SCRAMBLED FREQUENCY HISS ~ ~';
        }

        adjustStaticVolume(0.25);
        if (speechUtterance && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }
}

// -------------------------------------------------------------------
// Call Flows: Call 1 (Loudspeaker Threat) & Call 2 (Ear Riddle & Key)
// -------------------------------------------------------------------
function triggerIncomingCall(callNum) {
    STATE.currentCall = callNum;
    const callerId = document.getElementById('caller-id-name');
    const speakerTag = document.getElementById('call-loudspeaker-tag');

    if (callNum === 1) {
        if (callerId) callerId.textContent = 'UNKNOWN CALLER';
        if (speakerTag) speakerTag.textContent = '🔊 LOUDSPEAKER ACTIVE';
    } else {
        if (callerId) callerId.textContent = 'RESTRICTED FREQUENCY';
        if (speakerTag) speakerTag.textContent = '🔒 ENCRYPTED WHISPER';
    }

    switchScreen('screen-incoming-call');
    startRingtone();
}

function answerCall() {
    stopRingtone();
    playBeep(440, 0.1);
    getAudioContext(); // Ensure AudioContext unlocked by user click

    // Request iOS sensor permission on click if needed
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().catch(() => {});
    }
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().catch(() => {});
    }

    if (STATE.currentCall === 1) {
        startCall1();
    } else if (STATE.currentCall === 2) {
        startCall2();
    }
}

function declineCall() {
    stopRingtone();
    playBeep(220, 0.3);
    switchScreen('screen-standby');
}

// Call 1: Threatening Voice on Loudspeaker
function startCall1() {
    switchScreen('screen-call1-active');
    emitAction('CALL_1_ANSWERED');
    startCallTimer('call1-timer');

    const transcript = document.getElementById('call1-transcript');
    const fullText = "I told you to leave this alone. You have no idea whose files you are looking through. Stop playing detective and shut down this computer immediately... or I will shut it down for you.";
    
    if (transcript) transcript.textContent = `"${fullText}"`;

    // Speak threatening voice on loudspeaker
    speakMessage(fullText, 0.5, 0.82, () => {
        setTimeout(() => {
            hangupCall1();
        }, 1500);
    });
}

function hangupCall1() {
    stopCallTimer();
    playBeep(350, 0.2);
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    // Signal PC that call has ended -> PC begins 5s shutdown countdown
    emitAction('CALL_1_ENDED');
    switchScreen('screen-standby');
}

// Call 2: Riddle & Ear Proximity
function startCall2() {
    switchScreen('screen-call2-ear');
    startCallTimer('call2-timer');
    STATE.isHeldToEar = false;
    STATE.simulatedEar = false;

    // Start with background static
    startStaticAudio(0.25);

    // Initial voice riddle (telling player to hold phone to ear)
    const riddle = "You broadcast my voice into open air... foolish. A secret is not a bell to be rung in public. Press this vessel where thoughts enter in darkness, against the chamber of your mind... and only then shall the shadow speak.";
    speakMessage(riddle, 0.6, 0.85);
}

function hangupCall2() {
    stopCallTimer();
    stopStaticAudio();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    playBeep(440, 0.2);

    emitAction('CALL_2_ENDED');
    switchScreen('screen-restored');
}

function returnToStandby() {
    stopCallTimer();
    stopStaticAudio();
    stopRingtone();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    switchScreen('screen-standby');
}

// Call Duration Counter
function startCallTimer(timerId) {
    stopCallTimer();
    callSeconds = 0;
    const el = document.getElementById(timerId);
    if (el) el.textContent = '00:00';

    callTimerInterval = setInterval(() => {
        callSeconds++;
        const mins = String(Math.floor(callSeconds / 60)).padStart(2, '0');
        const secs = String(callSeconds % 60).padStart(2, '0');
        if (el) el.textContent = `${mins}:${secs}`;
    }, 1000);
}

function stopCallTimer() {
    if (callTimerInterval) {
        clearInterval(callTimerInterval);
        callTimerInterval = null;
    }
}

// -------------------------------------------------------------------
// Synchronization & Server / P2P Relay
// -------------------------------------------------------------------
let phonePeer = null;
let phonePeerConn = null;

function initSync() {
    if (broadcastChannel) {
        broadcastChannel.onmessage = (event) => {
            handleSyncEvent(event.data);
        };
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'scribe_sigil_event' && e.newValue) {
            try {
                handleSyncEvent(JSON.parse(e.newValue));
            } catch (err) {}
        }
    });

    initPhonePeerP2P();
}

function initPhonePeerP2P() {
    const urlParams = new URLSearchParams(window.location.search);
    const session = urlParams.get('session');
    if (!session || typeof Peer === 'undefined') return;

    try {
        phonePeer = new Peer();
        phonePeer.on('open', () => {
            const targetPeerId = 'sigil-' + session;
            phonePeerConn = phonePeer.connect(targetPeerId);

            phonePeerConn.on('open', () => {
                const statusEl = document.getElementById('connection-status-text');
                if (statusEl) {
                    statusEl.className = 'status-connected';
                    statusEl.textContent = 'ONLINE & PAIRED (P2P)';
                }
                phonePeerConn.send({ action: 'PHONE_PING' });
            });

            phonePeerConn.on('data', (data) => {
                handleSyncEvent(data);
            });
        });

        phonePeer.on('error', (err) => {
            console.warn('Phone P2P warning:', err);
        });
    } catch (e) {}
}

function sendHeartbeat() {
    fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
        body: JSON.stringify({ action: 'PHONE_PING' })
    }).catch(() => {});

    if (phonePeerConn && phonePeerConn.open) {
        phonePeerConn.send({ action: 'PHONE_PING' });
    }
}

function pollServerState() {
    fetch('/api/state', {
        headers: { 'Bypass-Tunnel-Reminder': 'true' }
    })
        .then(res => res.json())
        .then(data => {
            handleServerState(data);
        })
        .catch(() => {});
}

function handleServerState(state) {
    if (!state) return;

    // Call 1 triggered from PC
    if (state.call_1_triggered && !state.call_1_ended && STATE.activeScreen === 'screen-standby') {
        triggerIncomingCall(1);
    }

    // PC has locked down -> Phone screen enters static & requires shake!
    if (state.pc_locked && (STATE.activeScreen === 'screen-standby' || STATE.activeScreen === 'screen-call1-active')) {
        stopRingtone();
        stopCallTimer();
        STATE.shakeProgress = 0;
        updateShakeUI();
        startStaticAudio(0.3);
        switchScreen('screen-shake-reconnect');
    }

    // Call 2 triggered
    if (state.call_2_triggered && !state.call_2_ended && STATE.activeScreen === 'screen-shake-reconnect') {
        triggerIncomingCall(2);
    }

    // PC Unlocked -> Stop static hissing and recover
    if (state.pc_recovered) {
        stopStaticAudio();
        stopRingtone();
        stopCallTimer();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (STATE.activeScreen === 'screen-call2-ear' || STATE.activeScreen === 'screen-shake-reconnect') {
            switchScreen('screen-restored');
        }
    }
}

function handleSyncEvent(eventData) {
    if (!eventData) return;
    const evt = eventData.event || eventData.action;

    if (evt === 'TRIGGER_CALL_1' && STATE.activeScreen === 'screen-standby') {
        triggerIncomingCall(1);
    } else if (evt === 'PC_LOCKED' || evt === 'LOCK_PC') {
        STATE.shakeProgress = 0;
        updateShakeUI();
        startStaticAudio(0.3);
        switchScreen('screen-shake-reconnect');
    } else if (evt === 'PC_UNLOCKED' || evt === 'UNLOCK_PC') {
        stopStaticAudio();
        stopRingtone();
        stopCallTimer();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        switchScreen('screen-restored');
    }
}

function emitAction(actionName, extra = {}) {
    const payload = { action: actionName, event: actionName, timestamp: Date.now(), ...extra };

    // 1. Post to Server Relay (if server is present)
    fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
        body: JSON.stringify(payload)
    }).catch(() => {});

    // 2. Direct P2P Channel (for Vercel without a server)
    if (phonePeerConn && phonePeerConn.open) {
        phonePeerConn.send(payload);
    }

    // 3. Local BroadcastChannel (for same browser tabs)
    if (broadcastChannel) {
        broadcastChannel.postMessage(payload);
    }

    // 4. LocalStorage fallback
    localStorage.setItem('scribe_sigil_event', JSON.stringify({ event: actionName, t: Date.now(), ...extra }));
}

