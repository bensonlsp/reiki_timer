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

// YouTube music playlist URL (with shuffle enabled)
const YOUTUBE_MUSIC_URL = 'https://youtube.com/playlist?list=OLAK5uy_kpKl1SovncvbH7phc-RP2YTvCNrjpLXKA&shuffle=1';

// Initialize audio context
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Play healing bell sound using Web Audio API
async function playBellSound() {
    try {
        if (!audioContext) {
            initAudioContext();
        }

        if (!audioContext) {
            console.error('AudioContext not initialized');
            return;
        }

        // Resume AudioContext if it was suspended (important for mobile and background tabs)
        if (audioContext.state === 'suspended') {
            try {
                await audioContext.resume();
                console.log('AudioContext resumed successfully');
            } catch (err) {
                console.error('Failed to resume AudioContext:', err);
                return;
            }
        }

        playBellTones();
    } catch (error) {
        console.error('Error playing bell sound:', error);
    }
}

// Play the actual bell tones
function playBellTones() {
    try {
        if (!audioContext) {
            console.error('AudioContext not available');
            return;
        }

        const now = audioContext.currentTime;

        // Create oscillators for a bell-like sound with increased volume
        const frequencies = [800, 1000, 1200, 1600];

        frequencies.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = freq;
            oscillator.type = 'sine';

            // Create envelope for bell sound with higher volume
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.6 / (index + 1), now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 2.5);

            oscillator.start(now);
            oscillator.stop(now + 2.5);
        });

        // Add a stronger lower frequency for depth
        const bass = audioContext.createOscillator();
        const bassGain = audioContext.createGain();

        bass.connect(bassGain);
        bassGain.connect(audioContext.destination);

        bass.frequency.value = 200;
        bass.type = 'sine';

        bassGain.gain.setValueAtTime(0, now);
        bassGain.gain.linearRampToValueAtTime(0.4, now + 0.01);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 3);

        bass.start(now);
        bass.stop(now + 3);

        // Add visual feedback
        flashScreen();

        console.log('Bell sound played, AudioContext state:', audioContext.state);
    } catch (error) {
        console.error('Error playing bell tones:', error);
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

    // Initialize and test audio on user interaction (critical for mobile)
    initAudioContext();

    // Play a very brief silent sound to unlock audio on mobile browsers
    if (audioContext) {
        const buffer = audioContext.createBuffer(1, 1, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);

        console.log('Audio unlocked, AudioContext state:', audioContext.state);
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
    document.getElementById('timerText').textContent =
        `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Update progress bar
    const overallProgress = ((currentPosition * totalTime) + (totalTime - timeRemaining)) / (positions.length * totalTime) * 100;
    document.getElementById('progressFill').style.width = `${overallProgress}%`;

    // Update circle progress (radius = 54 for new smaller circle)
    const circleProgress = (totalTime - timeRemaining) / totalTime;
    const circumference = 2 * Math.PI * 54;
    const offset = circumference * (1 - circleProgress);
    document.getElementById('circleProgress').style.strokeDashoffset = offset;
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
