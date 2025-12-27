// Reiki positions data
const positions = [
    '前額（第三眼）',
    '左右雙耳',
    '後腦（後腦勺）',
    '喉嚨',
    '心臟',
    '太陽輪（胃部）',
    '臍輪（丹田/腹部）',
    '底輪（前面）',
    '左右肩膀',
    '胃輪（背面）',
    '臍輪（背面）',
    '底輪（背面）'
];

// State
let minutes = 0;
let seconds = 30;
let currentPosition = 0;
let timeRemaining = 0;
let totalTime = 0;
let timerInterval = null;
let isPaused = false;
let audioContext = null;

// HTML5 Audio for bell sound (better mobile compatibility)
let bellAudio = null;

// YouTube music playlist URL (with shuffle enabled)
const YOUTUBE_MUSIC_URL = 'https://youtube.com/playlist?list=OLAK5uy_kpKl1SovncvbH7phc-RP2YTvCNrjpLXKA&shuffle=1';

// Initialize audio for bell sound
function initBellAudio() {
    if (!bellAudio) {
        bellAudio = new Audio('476871__ancientoracle__bowl-bell-1-one-hit-fade.wav');
        bellAudio.preload = 'auto';
        bellAudio.volume = 0.8; // Adjust volume (0.0 to 1.0)
        console.log('Bell audio initialized');
    }
}

// Legacy: Initialize audio context (kept for compatibility)
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Play healing bell sound using HTML5 Audio
async function playBellSound() {
    try {
        // Initialize audio if not already done
        if (!bellAudio) {
            initBellAudio();
        }

        // Reset and play the audio
        bellAudio.currentTime = 0;

        // Play with error handling for mobile browsers
        const playPromise = bellAudio.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Bell sound played successfully');
                    // Add visual feedback
                    flashScreen();
                })
                .catch(error => {
                    console.error('Error playing bell sound:', error);
                    // Still show visual feedback even if sound fails
                    flashScreen();
                });
        }
    } catch (error) {
        console.error('Error in playBellSound:', error);
        // Fallback to visual feedback only
        flashScreen();
    }
}

// Visual feedback when bell rings
function flashScreen() {
    const container = document.querySelector('.container');
    if (container) {
        container.style.transition = 'box-shadow 0.3s ease';
        container.style.boxShadow = '0 0 40px rgba(107, 142, 127, 0.6), 0 10px 40px rgba(0, 0, 0, 0.08)';

        setTimeout(() => {
            container.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.08)';
        }, 600);
    }

    // Add vibration on mobile devices (if supported)
    if ('vibrate' in navigator) {
        // Vibrate pattern: vibrate for 200ms, pause 100ms, vibrate 200ms
        navigator.vibrate([200, 100, 200]);
    }
}

// Adjust minutes
function adjustMinutes(delta) {
    minutes = Math.max(0, Math.min(10, minutes + delta));
    document.getElementById('minutesDisplay').textContent = minutes;
    validateTime();
}

// Adjust seconds (in 10-second increments)
function adjustSeconds(delta) {
    seconds = seconds + delta;
    if (seconds >= 60) {
        seconds = 0;
    } else if (seconds < 0) {
        seconds = 50;
    }
    document.getElementById('secondsDisplay').textContent = seconds;
    validateTime();
}

// Validate that total time is at least 10 seconds
function validateTime() {
    const totalSeconds = minutes * 60 + seconds;
    if (totalSeconds < 10) {
        // Ensure minimum time is 10 seconds
        if (totalSeconds === 0) {
            seconds = 10;
            document.getElementById('secondsDisplay').textContent = seconds;
        }
    }
}

// Start healing session
function startSession() {
    currentPosition = 0;
    totalTime = minutes * 60 + seconds;

    // Ensure minimum time
    if (totalTime < 10) {
        alert('請設定至少10秒的時間');
        return;
    }

    timeRemaining = totalTime;
    isPaused = false;

    // Initialize bell audio on user interaction (critical for mobile autoplay policy)
    initBellAudio();

    // Pre-load audio by attempting a silent play (helps with mobile compatibility)
    if (bellAudio) {
        bellAudio.volume = 0;
        const playPromise = bellAudio.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    bellAudio.pause();
                    bellAudio.currentTime = 0;
                    bellAudio.volume = 0.8; // Restore volume
                    console.log('Bell audio unlocked successfully');
                })
                .catch(err => {
                    console.log('Bell audio preload attempt:', err.message);
                    bellAudio.volume = 0.8; // Restore volume anyway
                });
        }
    }

    document.getElementById('setupScreen').classList.add('hidden');
    document.getElementById('timerScreen').classList.remove('hidden');

    updateDisplay();
    startTimer();
}

// Start timer
function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
        if (!isPaused) {
            timeRemaining--;
            updateDisplay();

            if (timeRemaining <= 0) {
                completePosition();
            }
        }
    }, 1000);
}

// Update display
function updateDisplay() {
    // Update position info
    document.getElementById('positionNumber').textContent = `${currentPosition + 1} / ${positions.length}`;
    document.getElementById('positionName').textContent = positions[currentPosition];

    // Update timer text
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Update both timer displays (large and small)
    document.getElementById('timerTextLarge').textContent = timeText;
    document.getElementById('timerTextSmall').textContent = timeText;

    // Update progress bar
    const overallProgress = ((currentPosition * totalTime) + (totalTime - timeRemaining)) / (positions.length * totalTime) * 100;
    document.getElementById('progressFill').style.width = `${overallProgress}%`;

    // Update both circle progress indicators
    const circleProgress = (totalTime - timeRemaining) / totalTime;

    // Large circle (radius = 130)
    const circumferenceLarge = 2 * Math.PI * 130;
    const offsetLarge = circumferenceLarge * (1 - circleProgress);
    document.getElementById('circleProgressLarge').style.strokeDashoffset = offsetLarge;

    // Small circle (radius = 54)
    const circumferenceSmall = 2 * Math.PI * 54;
    const offsetSmall = circumferenceSmall * (1 - circleProgress);
    document.getElementById('circleProgressSmall').style.strokeDashoffset = offsetSmall;
}

// Complete current position
function completePosition() {
    playBellSound();

    currentPosition++;

    if (currentPosition >= positions.length) {
        completeSession();
    } else {
        timeRemaining = totalTime;
        updateDisplay();
    }
}

// Complete entire session
function completeSession() {
    clearInterval(timerInterval);
    document.getElementById('timerScreen').classList.add('hidden');
    document.getElementById('completionScreen').classList.remove('hidden');
}

// Pause/Resume timer
function pauseTimer() {
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    pauseBtn.textContent = isPaused ? '繼續' : '暫停';
}

// Skip to next position
function skipPosition() {
    if (currentPosition < positions.length - 1) {
        playBellSound();
        currentPosition++;
        timeRemaining = totalTime;
        updateDisplay();
    } else {
        completeSession();
    }
}

// Reset current session
function resetSession() {
    if (confirm('確定要重新開始嗎？')) {
        clearInterval(timerInterval);
        currentPosition = 0;
        timeRemaining = totalTime;
        isPaused = false;
        document.getElementById('pauseBtn').textContent = '暫停';
        updateDisplay();
        startTimer();
    }
}

// Reset to setup screen
function resetToSetup() {
    clearInterval(timerInterval);
    document.getElementById('completionScreen').classList.add('hidden');
    document.getElementById('setupScreen').classList.remove('hidden');
}

// Back to home/setup screen
function backToHome() {
    if (confirm('確定要回到首頁嗎？當前進度將會遺失。')) {
        clearInterval(timerInterval);
        isPaused = false;
        document.getElementById('pauseBtn').textContent = '暫停';
        document.getElementById('timerScreen').classList.add('hidden');
        document.getElementById('setupScreen').classList.remove('hidden');
    }
}

// Open YouTube music in new window
function openYouTubeMusic() {
    window.open(YOUTUBE_MUSIC_URL, '_blank', 'noopener,noreferrer');
}
