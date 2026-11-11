// DOM Elements
const lockScreen = document.getElementById('lock-screen');
const desktop = document.getElementById('desktop');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const errorMsg = document.getElementById('error-msg');
const clock = document.getElementById('clock');
const videoPlayerContainer = document.getElementById('video-player-container');

// State
let windows = [];
let zIndexCounter = 100;
let emailOpened = false;
let startTime = localStorage.getItem('gameStartTime') ? parseInt(localStorage.getItem('gameStartTime')) : null;
let timerInterval = null;
let gameCompleted = localStorage.getItem('gameCompleted') === 'true';
let endTime = localStorage.getItem('gameEndTime') ? parseInt(localStorage.getItem('gameEndTime')) : null;

// Initialize
function init() {
    updateClock();
    setInterval(updateClock, 60000);
    updateNotepadLockIndicator();
    initMobileSync();

    if (gameCompleted) {
        showCompletionScreen();
    }
}

// Timer Logic
window.initTimer = function () {
    if (startTime && !gameCompleted) {
        document.getElementById('start-overlay').classList.add('hidden');
        const connScreen = document.getElementById('connect-screen');
        if (connScreen) connScreen.classList.add('hidden');
        document.getElementById('game-timer').classList.remove('hidden');
        startTimerInterval();
    } else if (gameCompleted) {
        document.getElementById('start-overlay').classList.add('hidden');
        const connScreen = document.getElementById('connect-screen');
        if (connScreen) connScreen.classList.add('hidden');
        document.getElementById('game-timer').classList.add('hidden');
        showCompletionScreen();
    }
}

window.startInvestigation = function () {
    if (gameCompleted) return; // Don't let player play again
    
    document.getElementById('start-overlay').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('start-overlay').classList.add('hidden');
        showConnectionScreen();
    }, 400);
}

window.proceedToWorkstation = function (skipPhone = false) {
    startTime = window.Date.now();
    localStorage.setItem('gameStartTime', startTime);
    const connScreen = document.getElementById('connect-screen');
    if (connScreen) {
        connScreen.style.opacity = '0';
        setTimeout(() => {
            connScreen.classList.add('hidden');
            document.getElementById('game-timer').classList.remove('hidden');
            startTimerInterval();
        }, 300);
    } else {
        document.getElementById('game-timer').classList.remove('hidden');
        startTimerInterval();
    }
}

function startTimerInterval() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}

function updateTimer() {
    if (!startTime) return;
    const now = gameCompleted ? endTime : window.Date.now();
    const elapsed = now - startTime;
    document.getElementById('timer-val').textContent = formatElapsedTime(elapsed);
}

function formatElapsedTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

window.submitAccusation = function () {
    const input = document.getElementById('culprit-name-input');
    const errorDiv = document.getElementById('accusation-error');
    const name = input.value.trim().toLowerCase();

    // The Culprit: Masato Kurosawa
    if (name === 'masato kurosawa') {
        completeGame();
    } else {
        errorDiv.textContent = '❌ That is not the correct perpetrator. Check the evidence again.';
        errorDiv.classList.remove('hidden');
        setTimeout(() => errorDiv.classList.add('hidden'), 3000);
    }
}

function completeGame() {
    gameCompleted = true;
    endTime = window.Date.now();
    localStorage.setItem('gameCompleted', 'true');
    localStorage.setItem('gameEndTime', endTime);
    clearInterval(timerInterval);
    displayFinalTime();
    showCompletionScreen();
}

function displayFinalTime() {
    if (startTime && endTime) {
        const elapsed = endTime - startTime;
        const formatted = formatElapsedTime(elapsed);
        document.getElementById('timer-val').textContent = formatted;
        document.getElementById('timer-val').style.color = '#ffd700'; // Gold for completion
        
        const finalTimeVal = document.getElementById('final-time-val');
        if (finalTimeVal) finalTimeVal.textContent = formatted;
    }
}

function showCompletionScreen() {
    // Hide game elements to focus on the completion screen
    if (desktop) desktop.classList.add('hidden');
    if (lockScreen) lockScreen.classList.add('hidden');
    document.getElementById('game-timer').classList.add('hidden');
    
    displayFinalTime();
    
    const overlay = document.getElementById('completion-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

// Hint/Notification System
window.showHint = function (message, title = 'DECRYPTION HINT') {
    const container = document.getElementById('hint-container');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'hint-card';

    card.innerHTML = `
        <div class="hint-header">
            <div class="hint-title"><span>🔍</span> ${title}</div>
            <button class="hint-close">✕</button>
        </div>
        <div class="hint-body">${message}</div>
        <div class="hint-footer">
            <span class="hint-type-tag">CONFIDENTIAL</span>
            <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
    `;

    // Close button logic
    card.querySelector('.hint-close').onclick = () => {
        card.classList.add('removing');
        setTimeout(() => card.remove(), 400);
    };

    container.appendChild(card);

    // Auto remove after some time
    const duration = message.length > 100 ? 15000 : 8000;
    setTimeout(() => {
        if (card.parentElement) {
            card.classList.add('removing');
            setTimeout(() => card.remove(), 400);
        }
    }, duration);
}

window.showLockScreenHint = function() {
    showHint('CIPHER: kdfnwrehu\n\n"I was used by an ancient roman hand,\nTo hide plain words across the land.\nEach letter walks 3 steps behind,\nBackward it moves not hard to find."', 'PASSWORD RECOVERY');
}

// Update Notepad Lock Indicator
function updateNotepadLockIndicator() {
    const lockIndicator = document.getElementById('notepad-lock-indicator');
    if (lockIndicator) {
        if (calculatorPuzzleSolved) {
            lockIndicator.style.display = 'none';
        } else {
            lockIndicator.style.display = 'flex';
        }
    }
}

// Lock Screen Logic
function attemptLogin() {
    const password = passwordInput.value.trim().toLowerCase();
    if (password === 'hacktober') {
        unlockDesktop();
    } else {
        showLoginError();
    }
}

function unlockDesktop() {
    lockScreen.classList.add('hidden');
    desktop.classList.remove('hidden');
    // Play startup sound (optional/placeholder)
}

function showLoginError() {
    errorMsg.classList.remove('hidden');
    passwordInput.value = '';
    passwordInput.focus();
    setTimeout(() => {
        errorMsg.classList.add('hidden');
    }, 3000);
}

if (loginBtn) loginBtn.addEventListener('click', attemptLogin);
if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') attemptLogin();
    });
}

// Clock
function updateClock() {
    const now = new window.Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    if (clock) clock.innerText = `${hours}:${minutes} ${ampm}`;
}

// Window Management
window.openWindow = function (appName) {
    // Check if trying to open Notepad before solving calculator puzzle
    if (appName === 'notepad' && !calculatorPuzzleSolved) {
        showHint('The encryption on this terminal is still active. Solve the calculator puzzle to bypass.', 'SYSTEM ACCESS DENIED');
        return;
    }

    const win = document.getElementById(`window-${appName}`);
    if (win) {
        win.classList.remove('hidden');
        bringToFront(win);
    } else {
        console.error(`Window not found for app: ${appName}`);
    }

    // Trigger Phase 2 Phone Call once user opens a window
    checkTriggerPhase2Call(appName);
}

window.closeWindow = function (appName) {
    const win = document.getElementById(`window-${appName}`);
    if (win) {
        win.classList.add('hidden');
        // Stop video if closing file explorer
        if (appName === 'file-explorer') {
            const video = videoPlayerContainer.querySelector('video');
            if (video) video.pause();
        }
    }
}

window.minimizeWindow = function (appName) {
    const win = document.getElementById(`window-${appName}`);
    if (win) {
        win.classList.add('hidden');
    }
}

window.maximizeWindow = function (appName) {
    const win = document.getElementById(`window-${appName}`);
    if (win) {
        if (win.style.width === '100%') {
            // Restore (values hardcoded for simplicity, could be saved state)
            if (appName === 'file-explorer') {
                win.style.width = '700px'; win.style.height = '500px';
            } else if (appName === 'internet-explorer') {
                win.style.width = '800px'; win.style.height = '600px';
            } else {
                win.style.width = '600px'; win.style.height = '400px';
            }
            win.style.top = '50px';
            win.style.left = '200px';
        } else {
            win.style.width = '100%';
            win.style.height = 'calc(100% - 30px)';
            win.style.top = '0';
            win.style.left = '0';
        }
    }
}

function bringToFront(win) {
    zIndexCounter++;
    win.style.zIndex = zIndexCounter;
}

// Draggable Windows
const draggables = document.querySelectorAll('.window');
draggables.forEach(win => {
    const header = win.querySelector('.title-bar');
    if (header) {
        header.addEventListener('mousedown', (e) => {
            bringToFront(win);

            let shiftX = e.clientX - win.getBoundingClientRect().left;
            let shiftY = e.clientY - win.getBoundingClientRect().top;

            function moveAt(pageX, pageY) {
                win.style.left = pageX - shiftX + 'px';
                win.style.top = pageY - shiftY + 'px';
            }

            function onMouseMove(event) {
                moveAt(event.pageX, event.pageY);
            }

            document.addEventListener('mousemove', onMouseMove);

            win.onmouseup = function () {
                document.removeEventListener('mousemove', onMouseMove);
                win.onmouseup = null;
            };
        });
    }
    win.addEventListener('mousedown', () => bringToFront(win));
});


// File Explorer Specifics with Navigation History
const fileIcon = document.querySelector('.icon-img.file-explorer-icon');
const videoFile = document.querySelector('.file-item');
const explorerContent = document.querySelector('.explorer-content');

// Navigation state for file explorer
let explorerHistory = [];
let currentView = 'root'; // 'root' or 'video'

if (videoFile) {
    videoFile.addEventListener('click', () => {
        if (videoPlayerContainer) {
            explorerHistory.push('root'); // Save current view to history
            currentView = 'video';
            videoPlayerContainer.classList.remove('hidden');
            // Hide file list
            videoFile.style.display = 'none';
        }
    });
}

window.closeVideo = function () {
    if (videoPlayerContainer) {
        videoPlayerContainer.classList.add('hidden');
        const video = videoPlayerContainer.querySelector('video');
        if (video) video.pause();
        // Show file list again
        if (videoFile) videoFile.style.display = 'flex';
        currentView = 'root';
        explorerHistory.pop(); // Remove from history
    }
}

// Back button functionality for file explorer
window.explorerBack = function () {
    if (currentView === 'video') {
        // If we're viewing a video, go back to file list
        window.closeVideo();
    } else if (explorerHistory.length > 0) {
        // Future: handle folder navigation
        explorerHistory.pop();
    }
}
// comment
// Tokyo Police Login Logic
const policeUsername = 'police_admin';
const policePassword = '28481211';

window.policeLogin = function () {
    const usernameInput = document.getElementById('police-username');
    const passwordInput = document.getElementById('police-password');
    const errorMsg = document.getElementById('police-error-msg');
    const loginView = document.getElementById('police-login-view');
    const databaseView = document.getElementById('police-database-view');

    const enteredUsername = usernameInput.value.trim();
    const enteredPassword = passwordInput.value.trim();

    if (enteredUsername === policeUsername && enteredPassword === policePassword) {
        // Successful login
        errorMsg.classList.add('hidden');
        loginView.classList.add('hidden');
        databaseView.classList.remove('hidden');
        // Clear inputs
        usernameInput.value = '';
        passwordInput.value = '';
    } else {
        // Failed login - show cryptic error message that hints at the solution
        errorMsg.textContent = '❌ Access Denied! Enter different admin ID  or check Password(The User ID contains the word admin, Password: 8 numeric digits)';
        errorMsg.classList.remove('hidden');
        passwordInput.value = '';
        passwordInput.focus();

        // Hide error after 5 seconds
        setTimeout(() => {
            errorMsg.classList.add('hidden');
        }, 5000);
    }
}

window.policeLogout = function () {
    const loginView = document.getElementById('police-login-view');
    const databaseView = document.getElementById('police-database-view');

    loginView.classList.remove('hidden');
    databaseView.classList.add('hidden');
}

// Add Enter key support for police login
const policePasswordInput = document.getElementById('police-password');
const policeUsernameInput = document.getElementById('police-username');

if (policePasswordInput) {
    policePasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.policeLogin();
    });
}

if (policeUsernameInput) {
    policeUsernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.policeLogin();
    });
}

// Document Viewer Logic
let currentPage = 1;
const documentPassword = 'iamalive';

const documentPages = [
    {
        title: "PAGE 1 - INCIDENT REPORT",
        content: `<p><span style="font-size: 24px; font-weight: 900;">H</span>IT AND RUN INCIDENT - CASE #2024-7743</p>
        
<p>DATE: October 15, 2024</p>
<p>TIME: 11:47 PM</p>
<p>LOCATION: Shibuya Crossing, Tokyo</p>

<p>VICTIM INFORMATION:
Name: Tanaka Hiroshi (田中 博)
Age: 34 years
Occupation: Software Engineer
Status: DECEASED</p>

<p>INCIDENT SUMMARY:
On the night of October 15th, 2024, at approximately 11:47 PM, 
the victim was struck by a vehicle while crossing at Shibuya 
Crossing. The vehicle fled the scene immediately after impact. 
Witness reports indicate a dark-colored sedan, possibly black 
or navy blue.</p>

<p>Initial investigation suggests the driver did not attempt to 
brake before impact. Security camera footage is being analyzed.</p>`
    },
    {
        title: "PAGE 2 - WITNESS STATEMENTS",
        content: `<p><span style="font-size: 24px; font-weight: 900;">E</span>YEWITNESS ACCOUNT - PRIMARY WITNESS</p>

<p>WITNESS: Yamamoto Keiko (山本 恵子)
Age: 28
Occupation: Nurse
Distance from incident: Approximately 15 meters</p>

<p>STATEMENT:
"I was waiting at the crossing when I heard a loud engine. 
The car was moving extremely fast - much faster than the speed 
limit. I saw the impact. The victim was thrown several meters. 
The driver didn't even slow down. They just kept going."</p>

<p>ADDITIONAL WITNESSES:
Three other witnesses corroborate the account. All describe 
hearing the victim scream before impact. Vehicle description 
matches: dark sedan, tinted windows, no visible plate number 
due to speed and poor lighting.</p>

<p>Audio recording of witness interview attached to evidence.</p>`
    },
    {
        title: "PAGE 3 - FORENSIC EVIDENCE",
        content: `<p><span style="font-size: 24px; font-weight: 900;">L</span>ABORATORY ANALYSIS & PHYSICAL EVIDENCE</p>

<p>EVIDENCE COLLECTED:
- Paint fragments (black metallic)
- Headlight glass shards
- Tire impression marks
- Victim's personal effects</p>

<p>FORENSIC FINDINGS:
Paint analysis indicates luxury vehicle, likely German 
manufacture. Headlight fragments match BMW 5-series models 
from 2020-2023. Tire marks suggest sudden acceleration 
post-impact, confirming intentional flight from scene.</p>

<p>MEDICAL EXAMINER REPORT:
Cause of death: Massive trauma, internal bleeding. Victim 
likely died within 2-3 minutes of impact. If immediate medical 
attention had been provided, survival was possible.</p>

<p>The driver's decision to flee directly contributed to the 
fatality.</p>`
    },
    {
        title: "PAGE 4 - INVESTIGATION STATUS",
        content: `<p><span style="font-size: 24px; font-weight: 900;">P</span>ROGRESS UPDATE & PENDING ACTIONS</p>

<p>CURRENT STATUS: ACTIVE INVESTIGATION</p>

<p>LEADS BEING PURSUED:
1. Traffic camera footage analysis (80% complete)
2. BMW dealership purchase records review
3. Body shop inspection for recent repairs
4. Social media analysis of victim's contacts</p>

<p>BREAKTHROUGH EVIDENCE:
Partial license plate captured on enhanced footage.
Running database matches on vehicles matching description.</p>

<p>DETECTIVE NOTES:
Someone knows what happened. Someone is hiding something.
The victim's family deserves answers. This case will not 
go cold.</p>

<p>NEXT STEPS:
- Interview vehicle owners matching description
- Review victim's recent communications
- Re-interview witnesses with photo lineup</p>

<p style="margin-top: 20px;"><strong>DIGITAL EVIDENCE LEAD:</strong></p>
<p>Victim's social media account discovered. Last active 30 minutes before incident.
Unusual activity detected. Investigating possible connection.</p>

<p style="background: #ffffcc; padding: 10px; border-left: 4px solid #ffcc00; margin: 15px 0;">
<strong>Instagram Profile:</strong> @tanaka_hiroshi_dev<br>
<strong>Link:</strong> instagram://profile/tanaka_hiroshi_dev<br>
<em>Note: Account access may contain crucial evidence</em>
</p>

<p>--- END OF REPORT ---</p>

<p style="color: red; font-weight: bold; margin-top: 30px;">
⚠️ If you have any information about this case, 
contact Tokyo Police immediately.</p>

<p style="margin-top: 30px; padding: 15px; background: #f0f0f0; border: 2px dashed #999; font-family: 'Courier New', monospace; font-size: 10px; word-break: break-all; line-height: 1.6;">
<strong style="color: #cc0000;">🔐 ENCRYPTED DATA FRAGMENT:</strong><br>
<span style="color: #0066cc;">01100100011100100010111000111011001110000010000100110111</span><br>
<em style="font-size: 9px; color: #666;">Binary sequence detected in victim's deleted files. Possible password or code. Convert to hexadecimal for analysis.</em>
</p>`
    }
];

window.openDocument = function () {
    const databaseView = document.getElementById('police-database-view');
    const documentViewer = document.getElementById('document-viewer');
    const docPasswordPrompt = document.getElementById('doc-password-prompt');
    const docContent = document.getElementById('doc-content');

    databaseView.classList.add('hidden');
    documentViewer.classList.remove('hidden');
    docPasswordPrompt.classList.remove('hidden');
    docContent.classList.add('hidden');
    currentPage = 1;
}

window.unlockDocument = function () {
    const passwordInput = document.getElementById('doc-password');
    const errorDiv = document.getElementById('doc-error');

    if (passwordInput.value === documentPassword) {
        document.getElementById('doc-password-prompt').classList.add('hidden');
        document.getElementById('doc-content').classList.remove('hidden');
        renderPage();
        passwordInput.value = '';
        errorDiv.classList.add('hidden');
    } else {
        errorDiv.textContent = '❌ Incorrect password. Access denied.';
        errorDiv.classList.remove('hidden');
        passwordInput.value = '';
        setTimeout(() => errorDiv.classList.add('hidden'), 3000);
    }
}

window.closeDocument = function () {
    document.getElementById('document-viewer').classList.add('hidden');
    document.getElementById('police-database-view').classList.remove('hidden');
    document.getElementById('doc-password').value = '';
}

function renderPage() {
    const pageNumber = document.getElementById('page-number');
    const docPages = document.getElementById('doc-pages');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    pageNumber.textContent = currentPage;
    const page = documentPages[currentPage - 1];

    docPages.innerHTML = `
        <h3 style="color: #0066cc; margin-bottom: 20px;">${page.title}</h3>
        ${page.content}
    `;

    // Update button states
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === 4;
    prevBtn.style.opacity = currentPage === 1 ? '0.5' : '1';
    nextBtn.style.opacity = currentPage === 4 ? '0.5' : '1';
}

window.nextPage = function () {
    if (currentPage < 4) {
        currentPage++;
        renderPage();
    }
}

window.prevPage = function () {
    if (currentPage > 1) {
        currentPage--;
        renderPage();
    }
}

// Add Enter key support for document password
const docPasswordInput = document.getElementById('doc-password');
if (docPasswordInput) {
    docPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.unlockDocument();
    });
}

// Audio Player Logic
let isReversed = false;
let currentAudio = null;

window.openAudioPlayer = function () {
    const databaseView = document.getElementById('police-database-view');
    const audioPlayer = document.getElementById('audio-player');

    databaseView.classList.add('hidden');
    audioPlayer.classList.remove('hidden');

    // Initialize with normal audio
    currentAudio = document.getElementById('evidence-audio');
    const audioReversed = document.getElementById('evidence-audio-reversed');

    // Setup event listeners for both audio elements
    [currentAudio, audioReversed].forEach(audio => {
        audio.addEventListener('loadedmetadata', updateTimeDisplay);
        audio.addEventListener('timeupdate', updateTimeDisplay);
        audio.addEventListener('timeupdate', updateProgressBar);
        audio.addEventListener('play', () => updateStatus('Playing'));
        audio.addEventListener('pause', () => updateStatus('Paused'));
        audio.addEventListener('ended', () => updateStatus('Ended'));
    });

    updateStatus('Ready');
}

window.closeAudioPlayer = function () {
    const audioPlayer = document.getElementById('audio-player');
    const databaseView = document.getElementById('police-database-view');
    const audio = document.getElementById('evidence-audio');
    const audioReversed = document.getElementById('evidence-audio-reversed');

    audio.pause();
    audioReversed.pause();
    audio.currentTime = 0;
    audioReversed.currentTime = 0;
    audioPlayer.classList.add('hidden');
    databaseView.classList.remove('hidden');
    isReversed = false;
    currentAudio = audio;
}

window.playAudio = function () {
    if (currentAudio) {
        currentAudio.play();
    }
}

window.pauseAudio = function () {
    if (currentAudio) {
        currentAudio.pause();
    }
}

window.skipForward = function () {
    if (currentAudio) {
        currentAudio.currentTime = Math.min(currentAudio.duration, currentAudio.currentTime + 5);
    }
}

window.skipBackward = function () {
    if (currentAudio) {
        currentAudio.currentTime = Math.max(0, currentAudio.currentTime - 5);
    }
}

window.fastForward = function () {
    if (!currentAudio) return;

    const rateDisplay = document.getElementById('playback-rate');
    const speedBtn = document.getElementById('speed-btn');

    if (currentAudio.playbackRate === 1.0) {
        currentAudio.playbackRate = 2.0;
        rateDisplay.textContent = '2.0x Fast';
        speedBtn.textContent = '⏩ Speed 1x';
    } else {
        currentAudio.playbackRate = 1.0;
        rateDisplay.textContent = '1.0x Normal';
        speedBtn.textContent = '⏩ Speed 2x';
    }
}

window.reverseAudio = function () {
    const audio = document.getElementById('evidence-audio');
    const audioReversed = document.getElementById('evidence-audio-reversed');
    const rateDisplay = document.getElementById('playback-rate');
    const reverseBtn = document.getElementById('reverse-btn');

    // Store current playback state
    const wasPlaying = !currentAudio.paused;
    const currentTime = currentAudio.currentTime;

    // Pause current audio
    currentAudio.pause();

    if (!isReversed) {
        // Switch to reversed audio
        isReversed = true;
        currentAudio = audioReversed;
        rateDisplay.textContent = 'REVERSED';
        reverseBtn.style.background = '#00d084';
        reverseBtn.textContent = '▶ Normal';

        // Try to match the time position (reversed audio plays from end)
        if (audioReversed.duration) {
            audioReversed.currentTime = audioReversed.duration - currentTime;
        }
    } else {
        // Switch back to normal audio
        isReversed = false;
        currentAudio = audio;
        rateDisplay.textContent = '1.0x Normal';
        reverseBtn.style.background = '#ff6b6b';
        reverseBtn.textContent = '⏪ Reverse';

        // Match the time position
        if (audio.duration && audioReversed.duration) {
            audio.currentTime = audioReversed.duration - audioReversed.currentTime;
        }
    }

    // Resume playback if it was playing
    if (wasPlaying) {
        currentAudio.play();
    }

    updateStatus(isReversed ? 'Reversed Mode' : 'Normal Mode');
}

// Suspects Database Logic
window.openSuspectsDatabase = function () {
    const databaseView = document.getElementById('police-database-view');
    const suspectsDatabase = document.getElementById('suspects-database');

    if (!emailOpened) {
        showHint('The investigation database is awaiting the official suspect list. Access the victim\'s emails for more intelligence.', 'DATABASE SYNC PENDING');
        return;
    }

    databaseView.classList.add('hidden');
    suspectsDatabase.classList.remove('hidden');

    // Clear any previous input/errors
    const input = document.getElementById('suspect-name-input');
    const errorDiv = document.getElementById('suspect-error');
    if (input) input.value = '';
    if (errorDiv) errorDiv.classList.add('hidden');
}

window.closeSuspectsDatabase = function () {
    const databaseView = document.getElementById('police-database-view');
    const suspectsDatabase = document.getElementById('suspects-database');

    suspectsDatabase.classList.add('hidden');
    databaseView.classList.remove('hidden');
}

function updateTimeDisplay() {
    if (!currentAudio) return;

    const currentTimeSpan = document.getElementById('current-time');
    const totalTimeSpan = document.getElementById('total-time');

    if (currentTimeSpan && totalTimeSpan) {
        currentTimeSpan.textContent = formatTime(currentAudio.currentTime);
        totalTimeSpan.textContent = formatTime(currentAudio.duration);
    }
}

function updateProgressBar() {
    if (!currentAudio) return;

    const progressBar = document.getElementById('audio-progress');
    if (progressBar && currentAudio.duration) {
        const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
        progressBar.style.width = progress + '%';
    }
}

function updateStatus(status) {
    const statusSpan = document.getElementById('audio-status');
    if (statusSpan) {
        statusSpan.textContent = status;
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Internet Explorer Logic
const ieFrame = document.getElementById('ie-frame');
const ieAddressInput = document.getElementById('ie-address-input');

// Sites that are known to block iframes
const BLOCKED_SITES = ['google.com', 'youtube.com', 'facebook.com', 'twitter.com', 'reddit.com'];

window.ieGo = function () {
    if (!ieFrame || !ieAddressInput) return;

    let url = ieAddressInput.value;
    const instagramPage = document.getElementById('instagram-page');

    // Check if it's an Instagram URL
    if (url.startsWith('instagram://')) {
        // Show Instagram page, hide iframe
        ieFrame.style.display = 'none';
        instagramPage.classList.remove('hidden');
        // Reset Instagram to login view
        document.getElementById('instagram-login').style.display = 'flex';
        document.getElementById('instagram-profile').classList.add('hidden');
        return;
    }

    // Hide Instagram page, show iframe
    instagramPage.classList.add('hidden');
    ieFrame.style.display = 'block';

    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }

    // Check for blocked sites
    const isBlocked = BLOCKED_SITES.some(site => url.includes(site));

    if (isBlocked) {
        renderIEError();
    } else {
        ieFrame.src = url;
    }
}

function renderIEError() {
    const errorHtml = `
        <html>
        <head>
            <style>
                body { font-family: Tahoma, sans-serif; font-size: 11px; padding: 30px; background: white; color: black; }
                h1 { font-weight: normal; font-size: 24px; color: #cc0000; margin-bottom: 25px; }
                li { margin-bottom: 5px; }
                .footer { color: #666; margin-top: 30px; font-size: 10px; }
            </style>
        </head>
        <body>
            <h1>The page cannot be displayed</h1>
            <p>The page you are looking for is currently unavailable. The Web site might be experiencing technical difficulties, or you may need to adjust your browser settings.</p>
            <hr color="#C0C0C0" size="1">
            <p>Please try the following:</p>
            <ul>
                <li>Click the <b>Refresh</b> button, or try again later.</li>
                <li>If you typed the page address in the Address bar, make sure that it is spelled correctly.</li>
                <li>To check your connection settings, click the <b>Tools</b> menu, and then click <b>Internet Options</b>. On the <b>Connections</b> tab, click <b>Settings</b>. (Not actually implemented)</li>
            </ul>
            <p class="footer">Cannot find server or DNS Error<br>Internet Explorer</p>
        </body>
        </html>
    `;
    ieFrame.srcdoc = errorHtml;
}

window.ieHome = function () {
    if (ieAddressInput) {
        ieAddressInput.value = 'https://en.wikipedia.org/wiki/tokyo';
        window.ieGo(); // Wikipedia usually allows framing
    }
}

window.ieRefresh = function () {
    if (ieFrame) ieFrame.contentWindow.location.reload();
}

window.ieBack = function () {
    try { ieFrame.contentWindow.history.back(); } catch (e) { console.log('Cross-origin restriction'); }
}

window.ieForward = function () {
    try { ieFrame.contentWindow.history.forward(); } catch (e) { console.log('Cross-origin restriction'); }
}

window.ieStop = function () {
    try { if (ieFrame.contentWindow.stop) ieFrame.contentWindow.stop(); } catch (e) { console.log('Cross-origin restriction'); }
}

if (ieAddressInput) {
    ieAddressInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.ieGo();
    });
}

// Instagram Login Logic
window.instagramLogin = function () {
    const usernameInput = document.getElementById('instagram-username');
    const passwordInput = document.getElementById('instagram-password');
    const errorDiv = document.getElementById('instagram-error');
    const loginPage = document.getElementById('instagram-login');
    const profilePage = document.getElementById('instagram-profile');

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Check credentials
    if ((username === 'tanaka_hiroshi_dev' || username === '@tanaka_hiroshi_dev') && password === 'dr.;8!7') {
        // Successful login
        errorDiv.classList.add('hidden');
        loginPage.style.display = 'none';
        profilePage.classList.remove('hidden');
        usernameInput.value = '';
        passwordInput.value = '';
    } else {
        // Failed login
        errorDiv.textContent = 'Sorry, your password was incorrect. Please double-check your password.';
        errorDiv.classList.remove('hidden');
        passwordInput.value = '';
        setTimeout(() => errorDiv.classList.add('hidden'), 3000);
    }
}

window.instagramLogout = function () {
    const loginPage = document.getElementById('instagram-login');
    const profilePage = document.getElementById('instagram-profile');

    loginPage.style.display = 'flex';
    profilePage.classList.add('hidden');
}

window.showInstagramPasswordHint = function () {
    showHint('The digital footprint of the victim hides the key. One of the documents contains an unusual data fragment that might be relevant.', 'PASSWORD RECOVERY');
}

// Instagram DMs Logic
window.openInstagramDMs = function () {
    const profilePage = document.getElementById('instagram-profile');
    const dmsView = document.getElementById('instagram-dms');

    profilePage.classList.add('hidden');
    dmsView.classList.remove('hidden');

    // Reset DM view to show empty state
    document.getElementById('dm-empty-state').style.display = 'flex';
    document.getElementById('dm-thread-1').classList.add('hidden');
    document.getElementById('dm-thread-2').classList.add('hidden');
    document.getElementById('dm-thread-3').classList.add('hidden');
}

window.closeInstagramDMs = function () {
    const profilePage = document.getElementById('instagram-profile');
    const dmsView = document.getElementById('instagram-dms');

    dmsView.classList.add('hidden');
    profilePage.classList.remove('hidden');
}

window.openDMThread = function (threadNumber) {
    // Hide empty state
    document.getElementById('dm-empty-state').style.display = 'none';

    // Hide all threads
    document.getElementById('dm-thread-1').classList.add('hidden');
    document.getElementById('dm-thread-2').classList.add('hidden');
    document.getElementById('dm-thread-3').classList.add('hidden');

    // Show selected thread
    document.getElementById(`dm-thread-${threadNumber}`).classList.remove('hidden');
}

// Add Enter key support for Instagram login
const instagramUsernameInput = document.getElementById('instagram-username');
const instagramPasswordInput = document.getElementById('instagram-password');

if (instagramUsernameInput) {
    instagramUsernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.instagramLogin();
    });
}

if (instagramPasswordInput) {
    instagramPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.instagramLogin();
    });
}

// Calculator Logic
let calcCurrentValue = '0';
let calcPreviousValue = null;
let calcOperation = null;
let calculatorPuzzleSolved = localStorage.getItem('calculatorPuzzleSolved') === 'true';

window.calcNumber = function (num) {
    const display = document.getElementById('calc-display');
    if (calcCurrentValue === '0') {
        calcCurrentValue = num.toString();
    } else {
        calcCurrentValue += num.toString();
    }
    display.textContent = calcCurrentValue;
}

window.calcClear = function () {
    calcCurrentValue = '0';
    calcPreviousValue = null;
    calcOperation = null;
    document.getElementById('calc-display').textContent = '0';
}

window.calcDelete = function () {
    if (calcCurrentValue.length > 1) {
        calcCurrentValue = calcCurrentValue.slice(0, -1);
    } else {
        calcCurrentValue = '0';
    }
    document.getElementById('calc-display').textContent = calcCurrentValue;
}

window.calcDecimal = function () {
    if (!calcCurrentValue.includes('.')) {
        calcCurrentValue += '.';
        document.getElementById('calc-display').textContent = calcCurrentValue;
    }
}

function handleOperator(op) {
    if (calcPreviousValue !== null && calcOperation !== null) {
        // Perform pending calculation first
        calcEquals();
    }
    calcPreviousValue = parseFloat(calcCurrentValue);
    calcOperation = op;
    calcCurrentValue = '0';
}

window.calcAdd = function () {
    handleOperator('+');
}

window.calcSubtract = function () {
    handleOperator('-');
}

window.calcMultiply = function () {
    handleOperator('*');
}

window.calcDivide = function () {
    handleOperator('/');
}

window.calcEquals = function () {
    const display = document.getElementById('calc-display');
    if (calcPreviousValue !== null && calcOperation !== null) {
        const current = parseFloat(calcCurrentValue);
        let result;

        switch (calcOperation) {
            case '+':
                result = calcPreviousValue + current;
                break;
            case '-':
                result = calcPreviousValue - current;
                break;
            case '*':
                result = calcPreviousValue * current;
                break;
            case '/':
                if (current === 0) {
                    result = 'Error';
                } else {
                    result = calcPreviousValue / current;
                }
                break;
        }

        // Limit decimal places for display
        if (typeof result === 'number' && !Number.isInteger(result)) {
            result = parseFloat(result.toFixed(8));
        }

        calcCurrentValue = result.toString();
        calcPreviousValue = null;
        calcOperation = null;
        display.textContent = calcCurrentValue;

        // Easter egg
        if (result === 7734 || Math.floor(result) === 3000000) {
            // Unlock Notepad
            calculatorPuzzleSolved = true;
            localStorage.setItem('calculatorPuzzleSolved', 'true');
            updateNotepadLockIndicator(); // Update the lock icon immediately

            setTimeout(() => {
                showHint('I hold written thoughts, simple and plain,\n\nA Windows tool for jotting down your brain.\n\nNot fancy or complex, just text to see,\n\nWhat application could I possibly be?\n\n---\n\nWhen every option matters\n\nI refuse to choose small,\n\nMy answer is simple\n\nSelect all.', 'ENCRYPTED RIDDLE');
            }, 500);
        }
    }
}

// Email Client Logic
const emailMessages = {
    1: {
        from: 'unknown_sender@darkmail.net',
        subject: '❗ URGENT: Final Warning',
        date: 'October 15, 2024 - 9:30 PM',
        body: `<div style="color: #d00; font-weight: bold; margin-bottom: 20px;">FINAL WARNING</div>
        
<p>Hiroshi,</p>

<p>This is your LAST CHANCE. The deadline is midnight tonight.</p>

<p>50 million yen. Wire transfer to the account I provided. No excuses. No delays.</p>

<p>I know your route home from work. I know you pass through Shibuya Crossing at 11:40 PM every night after your late shifts. Very predictable.</p>

<p>If the money isn't in my account by midnight, there will be consequences. I'm watching.</p>

<p>You think you can just leak confidential corporate data and get away with it? You're naive.</p>

<p style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ff0000;">
<strong>TIMELINE:</strong><br>
- Payment due: October 15, 11:59 PM<br>
- If not received: Immediate action<br>
- Your usual commute time: 11:40 PM Shibuya Crossing
</p>

<p>Don't test me.</p>

<p>- M.K.</p>`
    },
    2: {
        from: 'unknown_sender@darkmail.net',
        subject: 'Re: The Information You Have',
        date: 'October 14, 2024 - 11:45 PM',
        body: `<p>Hiroshi,</p>

<p>I know where you live. I know your route home. I know what time you leave work.</p>

<p>You walk through Shibuya Crossing every single night around 11:40 PM. Such a predictable routine.</p>

<p>I've been following you for weeks. You don't even notice. Too absorbed in your phone.</p>

<p>The data you leaked? It's worth millions. You think 50 million yen is unreasonable? That's a bargain compared to what I could do with that information.</p>

<p style="background: #ffe8e8; padding: 10px; border-left: 3px solid #cc0000;">
<strong>You leaked the Project Horizon proposal to my competitor.</strong> My company, Tech Corp, was supposed to win that bid. But somehow, they knew our exact pricing strategy. I know it was you who gave them the information.
</p>

<p>I saw you at the Royal Golf Club last week, didn't I? You pretended not to recognize me. Smart. But not smart enough.</p>

<p>Pay up, or I'll make sure everyone knows it was YOU who compromised the company's security. Your career will be over. Your reputation destroyed.</p>

<p>Or maybe something worse. Accidents happen all the time in busy intersections, don't they?</p>

<p>Think about it.</p>

<p>- M.K.</p>`
    },
    3: {
        from: 'unknown_sender@darkmail.net',
        subject: 'Payment Required',
        date: 'October 13, 2024 - 3:20 PM',
        body: `<p>Tanaka Hiroshi,</p>

<p>50 million yen. That's the price for my silence.</p>

<p><strong>Wire Transfer Details:</strong><br>
Bank: Tokyo Metropolitan Bank<br>
Account: [REDACTED]<br>
Account Name: [ENCRYPTED]<br>
Reference: TH-DATA-2024</p>

<p>You have 3 days. October 15th, midnight deadline.</p>

<p>Don't even think about going to the police. I have copies of everything. The leaked files, your access logs, the emails to your "friend" at the competitor company.</p>

<p>If I don't get paid, everyone gets the evidence. Your company, the media, the authorities.</p>

<p>Your choice: Pay up and this stays between us, or refuse and watch your life fall apart.</p>

<p>I'll be in touch.</p>

<p>- M.K.</p>`
    },
    4: {
        from: 'unknown_sender@darkmail.net',
        subject: 'You Made a Mistake',
        date: 'October 12, 2024 - 8:15 AM',
        body: `<p>Hiroshi,</p>

<p>Did you really think no one would notice?</p>

<p>The project data you "accidentally" sent to your friend at the competitor company? I have proof. Screenshots, timestamps, logs. Everything.</p>

<p>One click and I can ruin you. Your career, your reputation, your future. All gone.</p>

<p>But I'm reasonable. I'm willing to keep this quiet... for a price.</p>

<p>Check your next email for payment details.</p>

<p>Don't try to be clever. Don't try to trace me. I'm always watching.</p>

<p>- M.K.</p>`
    },
    5: {
        from: 'noreply@techdeals.jp',
        subject: 'Limited Time: 40% Off Premium Software Suite!',
        date: 'October 11, 2024 - 2:45 PM',
        body: `<div style="background: linear-gradient(to bottom, #0066cc, #0052a3); padding: 20px; color: white; text-align: center;">
<h2 style="margin: 0;">🎉 EXCLUSIVE OFFER JUST FOR YOU! 🎉</h2>
</div>

<p>Hi Tanaka-san,</p>

<p>Great news! For a limited time, get <strong>40% OFF</strong> our premium developer tools suite!</p>

<p><strong>What's included:</strong></p>
<ul>
<li>Advanced Code Editor Pro</li>
<li>Cloud Deployment Manager</li>
<li>Database Optimization Tools</li>
<li>24/7 Premium Support</li>
</ul>

<p style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107;">
<strong>Limited Time Offer:</strong> Use code <strong>TECH40</strong> at checkout!<br>
Expires: October 15, 2024
</p>

<p>Don't miss out on this amazing deal!</p>

<p>Best regards,<br>
TechDeals Team<br>
www.techdeals.jp</p>`
    },
    6: {
        from: 'yamamoto@techcorp.co.jp',
        subject: 'Re: Q4 Project Status Update',
        date: 'October 10, 2024 - 4:20 PM',
        body: `<p>Tanaka-san,</p>

<p>Thank you for your status update on the Q4 projects.</p>

<p>The team review meeting has been scheduled for <strong>October 20th at 2:00 PM</strong> in Conference Room B. Please prepare a brief presentation covering:</p>

<ul>
<li>Current progress on assigned modules</li>
<li>Any blockers or challenges</li>
<li>Timeline estimates for completion</li>
</ul>

<p>Also, please remember to submit your timesheet for last week by end of day Friday.</p>

<p>If you have any questions, feel free to reach out.</p>

<p>Best regards,<br>
Yamamoto Kenji<br>
Project Manager, Tech Corp International<br>
yamamoto@techcorp.co.jp</p>`
    }

};

window.emailLogin = function () {
    const emailInput = document.getElementById('email-address');
    const passwordInput = document.getElementById('email-password');
    const errorDiv = document.getElementById('email-error');
    const loginView = document.getElementById('email-login');
    const inboxView = document.getElementById('email-inbox');

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    // Check credentials (email can be the address, password is "help" from document)
    if ((email === 't.hiroshi.evidence@outlook.com' || email.includes('hiroshi')) && password.toLowerCase() === 'help') {
        errorDiv.classList.add('hidden');
        loginView.style.display = 'none';
        inboxView.classList.remove('hidden');

        if (!emailOpened) {
            emailOpened = true;
            showHint('New intelligence has been decrypted. The suspect database for Tokyo Metropolitan Police is now accessible.', 'INTELLIGENCE UPDATE');
        }
    } else {
        errorDiv.textContent = '❌ Incorrect email or password. Hint: The password is hidden in the document pages.';
        errorDiv.classList.remove('hidden');
        setTimeout(() => errorDiv.classList.add('hidden'), 4000);
    }
}

window.emailLogout = function () {
    const loginView = document.getElementById('email-login');
    const inboxView = document.getElementById('email-inbox');
    const messageView = document.getElementById('email-message');

    loginView.style.display = 'flex';
    inboxView.classList.add('hidden');
    messageView.classList.add('hidden');
}

window.showEmailPasswordHint = function () {
    showHint('Four pages hold the truth you seek,\n\nBold and large, they stand apart,\n\nCombine them all, the answer\'s clear,\n\nThe password waits for you right here.', 'FILE RECOVERY RIDDLE');
}

window.openEmailMessage = function (messageId) {
    const inboxView = document.getElementById('email-inbox');
    const messageView = document.getElementById('email-message');
    const messageContent = document.getElementById('email-message-content');

    const message = emailMessages[messageId];
    if (message) {
        messageContent.innerHTML = `
            <div style="border-bottom: 1px solid #ddd; padding-bottom: 15px; margin-bottom: 20px;">
                <h2 style="margin: 0 0 10px 0;">${message.subject}</h2>
                <div style="font-size: 13px; color: #666;">
                    <strong>From:</strong> ${message.from}<br>
                    <strong>Date:</strong> ${message.date}
                </div>
            </div>
            <div style="line-height: 1.6;">
                ${message.body}
            </div>
        `;

        inboxView.classList.add('hidden');
        messageView.classList.remove('hidden');
    }
}

window.closeEmailMessage = function () {
    const inboxView = document.getElementById('email-inbox');
    const messageView = document.getElementById('email-message');

    messageView.classList.add('hidden');
    inboxView.classList.remove('hidden');
}

// Add Enter key support for email login
const emailAddressInput = document.getElementById('email-address');
const emailPasswordInput = document.getElementById('email-password');

if (emailAddressInput) {
    emailAddressInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.emailLogin();
    });
}

if (emailPasswordInput) {
    emailPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.emailLogin();
    });
}

// ==========================================================================
// MOBILE TERMINAL SYNC, CALL 1 (LOUDSPEAKER), SHAKE SENSOR & CALL 2 (EAR RIDDLE)
// ==========================================================================

let phoneLinkUrl = '';
let qrCodeObj = null;
let qrCodeModalObj = null;
let syncBroadcast = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('scribe_sigil_sync') : null;
let isPhoneConnected = false;
let hackerCallTriggered = false;
let hackerCallEnded = false;
let pcLockdownActive = false;
let countdownTimer = null;

// ===================================================================
// Cloud Relay (MQTT over Secure WebSocket) - Zero Backend / Vercel
// ===================================================================
class CloudRelay {
    constructor(sessionId, role, onMessage, onStatusChange) {
        this.sessionId = (sessionId || 'sigil_default').toLowerCase().trim();
        this.role = role; // 'pc' or 'phone'
        this.onMessage = onMessage;
        this.onStatusChange = onStatusChange;
        this.client = null;
        this.connected = false;
        this.brokers = [
            { host: 'broker.hivemq.com', port: 8884, path: '/mqtt' },
            { host: 'broker.emqx.io', port: 8084, path: '/mqtt' }
        ];
        this.brokerIdx = 0;
        this.subTopic = this.role === 'pc' ? `sigil/${this.sessionId}/to_pc` : `sigil/${this.sessionId}/to_phone`;
        this.pubTopic = this.role === 'pc' ? `sigil/${this.sessionId}/to_phone` : `sigil/${this.sessionId}/to_pc`;
        this.connect();
    }

    connect() {
        if (typeof Paho === 'undefined' || !Paho.MQTT) {
            setTimeout(() => this.connect(), 1500);
            return;
        }
        const b = this.brokers[this.brokerIdx];
        const clientId = `sigil_${this.role}_${Math.random().toString(36).substring(2, 9)}`;
        try {
            this.client = new Paho.MQTT.Client(b.host, b.port, b.path, clientId);
            this.client.onConnectionLost = (resp) => {
                this.connected = false;
                if (this.onStatusChange) this.onStatusChange(false);
                if (resp && resp.errorCode !== 0) {
                    console.log(`[CloudRelay] ${this.role} lost connection:`, resp.errorMessage);
                    this.brokerIdx = (this.brokerIdx + 1) % this.brokers.length;
                    setTimeout(() => this.connect(), 2000);
                }
            };
            this.client.onMessageArrived = (message) => {
                try {
                    const data = JSON.parse(message.payloadString);
                    if (this.onMessage) this.onMessage(data);
                } catch (e) {
                    console.warn(`[CloudRelay] ${this.role} parse error:`, e);
                }
            };
            this.client.connect({
                useSSL: true,
                timeout: 5,
                keepAliveInterval: 30,
                cleanSession: true,
                onSuccess: () => {
                    this.connected = true;
                    this.client.subscribe(this.subTopic, {
                        onSuccess: () => {
                            console.log(`[CloudRelay] ${this.role} subscribed to ${this.subTopic}`);
                            if (this.onStatusChange) this.onStatusChange(true);
                        }
                    });
                },
                onFailure: (err) => {
                    this.connected = false;
                    if (this.onStatusChange) this.onStatusChange(false);
                    console.warn(`[CloudRelay] ${this.role} connect failed to ${b.host}:`, err);
                    this.brokerIdx = (this.brokerIdx + 1) % this.brokers.length;
                    setTimeout(() => this.connect(), 2500);
                }
            });
        } catch (e) {
            setTimeout(() => this.connect(), 3000);
        }
    }

    send(data) {
        if (!this.client || !this.connected) return false;
        try {
            const payload = typeof data === 'string' ? data : JSON.stringify(data);
            const msg = new Paho.MQTT.Message(payload);
            msg.destinationName = this.pubTopic;
            this.client.send(msg);
            return true;
        } catch (e) {
            return false;
        }
    }
}

// Unique Game Session for P2P connection (works on Vercel without a backend)
let gameSessionId = localStorage.getItem('scribe_game_session');
if (!gameSessionId) {
    gameSessionId = Math.random().toString(36).substring(2, 8).toLowerCase();
    localStorage.setItem('scribe_game_session', gameSessionId);
} else {
    gameSessionId = gameSessionId.toLowerCase().trim();
}

let cloudRelay = null;
let pcPeer = null;
let activePeerConn = null;

function initPeerP2P() {
    if (typeof Peer === 'undefined') return;
    try {
        const myPeerId = 'sigil-' + gameSessionId;
        pcPeer = new Peer(myPeerId);

        pcPeer.on('open', (id) => {
            console.log('PC P2P Host ready, ID:', id);
        });

        pcPeer.on('connection', (conn) => {
            activePeerConn = conn;
            activePeerConn.on('open', () => {
                updateConnectionUI(true);
            });
            activePeerConn.on('data', (data) => {
                handlePCEventSync(data);
            });
            activePeerConn.on('close', () => {
                updateConnectionUI(false);
            });
        });
    } catch (e) {
        console.warn('PeerJS init error:', e);
    }
}

function getDirectPhoneUrl() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal) {
        // Vercel, Netlify, custom domain, production HTTPS:
        // window.location.origin is clean https://your-app.vercel.app with NO port 8000!
        return `${window.location.origin}/phone.html`;
    }
    // Localhost dev:
    const port = window.location.port ? `:${window.location.port}` : ':8000';
    return `http://${window.location.hostname}${port}/phone.html`;
}

function initMobileSync() {
    // Setup Enter key for lockdown recovery input
    const overrideInput = document.getElementById('override-code-input');
    if (overrideInput) {
        overrideInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.submitOverrideCode();
        });
    }

    // Setup Sync listeners
    if (syncBroadcast) {
        syncBroadcast.onmessage = (event) => {
            handlePCEventSync(event.data);
        };
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'scribe_sigil_event' && e.newValue) {
            try {
                handlePCEventSync(JSON.parse(e.newValue));
            } catch (err) {}
        }
    });

    // Cloud Relay for cross-network Vercel synchronization
    cloudRelay = new CloudRelay(gameSessionId, 'pc', (eventData) => {
        handlePCEventSync(eventData);
    }, (connected) => {
        console.log('[PC CloudRelay] status:', connected);
    });

    // Start background polling to relay server (for local Python server)
    setInterval(pollStateFromServer, 700);

    // Initialize WebRTC P2P (for Vercel serverless)
    initPeerP2P();

    // Initial pairing check & display
    loadPairingUrl();
}

function showConnectionScreen() {
    const connScreen = document.getElementById('connect-screen');
    if (connScreen) connScreen.classList.remove('hidden');

    loadPairingUrl();
}

function loadPairingUrl() {
    fetch('/api/ip')
        .then(res => {
            if (!res.ok) throw new Error('Not local server');
            return res.json();
        })
        .then(data => {
            let targetUrl = data.phone_url;
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

            if (!isLocal) {
                // Production / Vercel: Always use direct clean origin without port 8000
                targetUrl = `${window.location.origin}/phone.html`;
            }

            const sep = targetUrl.includes('?') ? '&' : '?';
            setupQRDisplay(`${targetUrl}${sep}session=${gameSessionId}`, data.phone_connected);
        })
        .catch(() => {
            // Vercel / Static hosting fallback: direct clean origin URL
            const targetUrl = `${getDirectPhoneUrl()}?session=${gameSessionId}`;
            setupQRDisplay(targetUrl, false);
        });
}

function setupQRDisplay(url, isConnected) {
    phoneLinkUrl = url;

    const directLink = document.getElementById('phone-direct-url');
    if (directLink) {
        directLink.textContent = url;
        directLink.href = url;
    }

    const modalLink = document.getElementById('phone-modal-link');
    if (modalLink) {
        modalLink.textContent = url;
        modalLink.href = url;
    }

    const codeVal = document.getElementById('session-code-val');
    if (codeVal) {
        codeVal.textContent = gameSessionId.toUpperCase();
    }

    const modalCodeVal = document.getElementById('phone-modal-code');
    if (modalCodeVal) {
        modalCodeVal.textContent = gameSessionId.toUpperCase();
    }

    // Main QR Box
    const qrBox = document.getElementById('qrcode-box');
    if (qrBox && typeof QRCode !== 'undefined') {
        qrBox.innerHTML = '';
        try {
            qrCodeObj = new QRCode(qrBox, {
                text: url,
                width: 146,
                height: 146,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        } catch (e) {
            console.warn('QR code render error:', e);
        }
    }

    // Modal QR Box
    const qrModalBox = document.getElementById('qrcode-box-modal');
    if (qrModalBox && typeof QRCode !== 'undefined') {
        qrModalBox.innerHTML = '';
        try {
            qrCodeModalObj = new QRCode(qrModalBox, {
                text: url,
                width: 116,
                height: 116,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        } catch (e) {}
    }

    updateConnectionUI(isConnected);
}

function updateConnectionUI(connected) {
    isPhoneConnected = connected;

    const statusPill = document.getElementById('phone-status-indicator');
    const statusText = document.getElementById('phone-status-text');
    const modalStatus = document.getElementById('phone-modal-status');
    const trayIcon = document.getElementById('tray-phone-icon');

    if (connected) {
        if (statusPill) {
            statusPill.className = 'status-pill connected';
        }
        if (statusText) statusText.textContent = 'DETECTIVE TERMINAL PAIRED ✓';
        if (modalStatus) {
            modalStatus.textContent = 'Connected ✓';
            modalStatus.style.color = '#00ff88';
        }
        if (trayIcon) trayIcon.classList.add('active');
    } else {
        if (statusPill) {
            statusPill.className = 'status-pill waiting';
        }
        if (statusText) statusText.textContent = 'Awaiting Connection...';
        if (modalStatus) {
            modalStatus.textContent = 'Awaiting Connection...';
            modalStatus.style.color = '#ffb800';
        }
        if (trayIcon) trayIcon.classList.remove('active');
    }
}

function pollStateFromServer() {
    fetch('/api/state')
        .then(res => res.json())
        .then(state => {
            if (!state) return;
            updateConnectionUI(state.phone_connected);

            // Check if Call 1 ended from mobile -> begin 5-second shutdown countdown
            if (state.call_1_ended && !hackerCallEnded && !pcLockdownActive) {
                onCall1Ended();
            }

            // Check if PC unlocked remotely
            if (state.pc_recovered && pcLockdownActive) {
                unlockPCRestore();
            }
        })
        .catch(() => {});
}

function handlePCEventSync(eventData) {
    if (!eventData) return;
    const action = eventData.action || eventData.event;

    if (action === 'PHONE_PING' || action === 'PHONE_CONNECTED') {
        updateConnectionUI(true);
        if (cloudRelay) {
            cloudRelay.send({
                action: 'PC_ACK',
                event: 'PC_ACK',
                pcLockdownActive: pcLockdownActive,
                timestamp: Date.now()
            });
        }
    } else if (action === 'CALL_1_ENDED' && !hackerCallEnded && !pcLockdownActive) {
        onCall1Ended();
    } else if (action === 'PC_UNLOCKED' && pcLockdownActive) {
        unlockPCRestore();
    }
}

function emitSyncAction(actionName, extra = {}) {
    const payload = { action: actionName, event: actionName, timestamp: Date.now(), ...extra };

    // 1. Cloud Relay (MQTT over WebSocket for Vercel & Mobile Hotspot)
    if (cloudRelay) {
        cloudRelay.send(payload);
    }

    // 2. Post to Server Relay (if local server running)
    fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(() => {});

    // 3. Direct P2P Channel (for WebRTC if available)
    if (activePeerConn && activePeerConn.open) {
        activePeerConn.send(payload);
    }

    // 4. Local BroadcastChannel
    if (syncBroadcast) {
        syncBroadcast.postMessage(payload);
    }
    localStorage.setItem('scribe_sigil_event', JSON.stringify({ event: actionName, t: Date.now(), ...extra }));
}

// Trigger Call 1 when user opens any window (Tokyo Police, File Explorer, etc.)
function checkTriggerPhase2Call(appName) {
    if (hackerCallTriggered || pcLockdownActive) return;

    hackerCallTriggered = true;
    emitSyncAction('TRIGGER_CALL_1', { app: appName });

    showHint(
        '⚠️ FREQUENCY INTERCEPT: Unknown external carrier detected on field device.',
        'CARRIER INTERCEPT'
    );
}

// When Call 1 ends on phone: 5-second countdown to PC screen shutdown
function onCall1Ended() {
    if (hackerCallEnded || pcLockdownActive) return;
    hackerCallEnded = true;

    showHint(
        '⚠️ CARRIER LOSS: Remote host connection severed. System lockdown imminent in 5 seconds...',
        'SECURITY ALERT'
    );

    let secondsLeft = 5;
    countdownTimer = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
            clearInterval(countdownTimer);
            triggerPCLockdown();
        }
    }, 1000);
}

// Fullscreen PC Lockdown / Remote Takeover
function triggerPCLockdown() {
    pcLockdownActive = true;
    emitSyncAction('LOCK_PC');

    const lockdownScreen = document.getElementById('pc-lockdown-screen');
    if (lockdownScreen) {
        lockdownScreen.classList.remove('hidden');
    }

    const input = document.getElementById('override-code-input');
    if (input) {
        input.value = '';
        input.focus();
    }

    // Play Glitch Sound FX via Web Audio
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    } catch (e) {}
}

// Verify Emergency Override Code (SHADOW7743)
window.submitOverrideCode = function () {
    const input = document.getElementById('override-code-input');
    const code = input ? input.value.trim().toLowerCase() : '';
    const errorEl = document.getElementById('override-error-msg');

    if (code === 'shadow7743') {
        if (errorEl) errorEl.classList.add('hidden');
        unlockPCRestore();
    } else {
        if (errorEl) {
            errorEl.classList.remove('hidden');
            setTimeout(() => errorEl.classList.add('hidden'), 3500);
        }
        if (input) {
            input.value = '';
            input.focus();
        }
    }
};

function unlockPCRestore() {
    pcLockdownActive = false;
    emitSyncAction('UNLOCK_PC');

    const lockdownScreen = document.getElementById('pc-lockdown-screen');
    if (lockdownScreen) {
        lockdownScreen.classList.add('hidden');
    }

    showHint(
        'EMERGENCY OVERRIDE ACCEPTED: Workstation integrity re-established. Remote backdoor purged. You may now continue the investigation in Tokyo Police.',
        'ACCESS RESTORED'
    );
}

// System Tray Phone Modal Controls
window.openPhoneModal = function () {
    const modal = document.getElementById('phone-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closePhoneModal = function () {
    const modal = document.getElementById('phone-modal');
    if (modal) modal.classList.add('hidden');
};

init();
