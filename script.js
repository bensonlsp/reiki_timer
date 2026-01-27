// Reiki positions data - Full 12 positions
const fullPositions = [
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

// Chakra activation - 7 main chakras (from crown to root)
const chakraPositions = [
    '頂輪（頭頂/百會）',
    '眉心輪（第三眼）',
    '喉輪（喉嚨）',
    '心輪（心臟）',
    '太陽輪（胃部）',
    '臍輪（丹田）',
    '海底輪（底輪）'
];

// Current active positions (will be set based on mode selection)
let positions = fullPositions;
let currentMode = 'full'; // 'full' or 'chakra'

// State
let minutes = 1;
let seconds = 0;
let currentPosition = 0;
let timeRemaining = 0;
let totalTime = 0;
let timerInterval = null;
let isPaused = false;
let audioContext = null;

// Audio settings
let bellVolume = 0.8;
let bellEnabled = true;
let bgMusicVolume = 0.5;
let bgMusicEnabled = false;

// HTML5 Audio for bell sound (better mobile compatibility)
let bellAudio = null;
let bgMusicAudio = null;

// YouTube Player control
let youtubePlayer = null;
let youtubePlayerReady = false;
let wasPlayingBeforeBell = false;
let youtubeIsPlaying = false;
let currentVideoIndex = 0;
let shuffledPlaylist = [];

// Meditation music videos (individual YouTube videos for better control)
const meditationVideos = [
    { id: 'M5DbYStWpBY', title: 'Lines to a Great Lord' },
    { id: 'dOekfnsDl5c', title: 'Harmonic Relation' },
    { id: '0EuJafFSEn4', title: 'Kyrie Opening' },
    { id: 'ePdM_WFRXyE', title: 'Foregather in the Name' },
    { id: 'yjgujSRifX0', title: 'Kyrie Fragments' },
    { id: 'GgXtRiNkT1U', title: 'Eleison Closing' },
    { id: 'VU4yuaVR5XQ', title: 'Brotherhood' },
    { id: 'ItdSEXT4ij8', title: 'Hallelyah' }
];

// YouTube music playlist URL (for external link)
const YOUTUBE_MUSIC_URL = 'https://youtube.com/playlist?list=OLAK5uy_kpKl1SovncvbH7phc-RP2YTvCNrjpLXKA&shuffle=1';

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Initialize audio for bell sound
function initBellAudio() {
    if (!bellAudio) {
        bellAudio = new Audio('476871__ancientoracle__bowl-bell-1-one-hit-fade.wav');
        bellAudio.preload = 'auto';
        bellAudio.volume = bellVolume;
        console.log('Bell audio initialized');
    }
}

// Mode selection functions
function selectMode(mode) {
    currentMode = mode;

    // Update positions based on mode
    if (mode === 'full') {
        positions = fullPositions;
    } else if (mode === 'chakra') {
        positions = chakraPositions;
    }

    // Update UI to show selected mode
    document.querySelectorAll('.mode-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('selected');

    // Update positions preview
    updatePositionsPreview();
}

function updatePositionsPreview() {
    const previewList = document.getElementById('positionsPreviewList');
    const previewTitle = document.getElementById('positionsPreviewTitle');

    if (currentMode === 'full') {
        previewTitle.textContent = '十二手式';
    } else {
        previewTitle.textContent = '七脈輪';
    }

    previewList.innerHTML = positions.map(pos => `<li>${pos}</li>`).join('');
}

// Bell volume control
function setBellVolume(value) {
    bellVolume = value / 100;
    if (bellAudio) {
        bellAudio.volume = bellVolume;
    }
    document.getElementById('bellVolumeValue').textContent = value + '%';
}

// Toggle bell sound
function toggleBellSound() {
    bellEnabled = !bellEnabled;
    const toggleBtn = document.getElementById('bellToggle');
    toggleBtn.textContent = bellEnabled ? '開' : '關';
    toggleBtn.classList.toggle('off', !bellEnabled);
}

// Preview bell sound
function previewBellSound() {
    // Initialize audio if not already done
    if (!bellAudio) {
        initBellAudio();
    }

    // Update volume and play
    bellAudio.volume = bellVolume;
    bellAudio.currentTime = 0;

    const playPromise = bellAudio.play();
    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                console.log('Preview bell sound played');
                // Visual feedback
                const previewBtn = document.querySelector('.preview-btn');
                if (previewBtn) {
                    previewBtn.classList.add('playing');
                    setTimeout(() => {
                        previewBtn.classList.remove('playing');
                    }, 1000);
                }
            })
            .catch(error => {
                console.error('Error playing preview:', error);
            });
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
    // Always show visual feedback
    flashScreen();

    // Check if bell sound is enabled
    if (!bellEnabled) {
        console.log('Bell sound is disabled');
        return;
    }

    try {
        // Initialize audio if not already done
        if (!bellAudio) {
            initBellAudio();
        }

        // Check if YouTube is playing - if so, pause it temporarily
        wasPlayingBeforeBell = isYouTubePlaying();
        if (wasPlayingBeforeBell) {
            console.log('Pausing YouTube for bell sound');
            pauseYouTube();
            // Small delay to ensure YouTube is paused
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Update volume
        bellAudio.volume = bellVolume;

        // Reset and play the audio
        bellAudio.currentTime = 0;

        // Play with error handling for mobile browsers
        const playPromise = bellAudio.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Bell sound played successfully');

                    // Resume YouTube after bell sound finishes (if it was playing)
                    if (wasPlayingBeforeBell) {
                        // Bell sound is about 3-4 seconds, wait a bit then resume
                        setTimeout(() => {
                            console.log('Resuming YouTube after bell');
                            resumeYouTube();
                        }, 3500);
                    }
                })
                .catch(error => {
                    console.error('Error playing bell sound:', error);
                    // Resume YouTube even if bell failed
                    if (wasPlayingBeforeBell) {
                        resumeYouTube();
                    }
                });
        }
    } catch (error) {
        console.error('Error in playBellSound:', error);
        // Resume YouTube even if there was an error
        if (wasPlayingBeforeBell) {
            resumeYouTube();
        }
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
                    bellAudio.volume = bellVolume; // Restore volume
                    console.log('Bell audio unlocked successfully');
                })
                .catch(err => {
                    console.log('Bell audio preload attempt:', err.message);
                    bellAudio.volume = bellVolume; // Restore volume anyway
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

// YouTube IFrame API callback - called automatically when API is ready
function onYouTubeIframeAPIReady() {
    console.log('YouTube IFrame API ready');
}

// Create YouTube player with a specific video
function createYouTubePlayer(videoId) {
    if (youtubePlayer) {
        // Player exists, just load new video
        youtubePlayer.loadVideoById(videoId);
        return;
    }

    const playerElement = document.getElementById('youtubePlayer');
    if (!playerElement) {
        console.error('YouTube player element not found');
        return;
    }

    console.log('Creating YouTube player with video:', videoId);

    youtubePlayer = new YT.Player('youtubePlayer', {
        height: '80',
        width: '100%',
        videoId: videoId,
        playerVars: {
            'autoplay': 1,
            'controls': 1,
            'rel': 0,
            'modestbranding': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    console.log('YouTube player ready');
    youtubePlayerReady = true;
    event.target.playVideo();
    updateNowPlaying();
}

function onPlayerStateChange(event) {
    // YT.PlayerState: PLAYING=1, PAUSED=2, ENDED=0, BUFFERING=3
    youtubeIsPlaying = (event.data === YT.PlayerState.PLAYING);
    console.log('YouTube state:', event.data, 'isPlaying:', youtubeIsPlaying);

    // When video ends, play next random video
    if (event.data === YT.PlayerState.ENDED) {
        playNextVideo();
    }
}

function onPlayerError(event) {
    console.error('YouTube player error:', event.data);
    // On error, try next video
    playNextVideo();
}

// Play next video in shuffled playlist
function playNextVideo() {
    currentVideoIndex++;
    if (currentVideoIndex >= shuffledPlaylist.length) {
        // Reshuffle and start over
        shuffledPlaylist = shuffleArray(meditationVideos);
        currentVideoIndex = 0;
    }

    const video = shuffledPlaylist[currentVideoIndex];
    console.log('Playing next video:', video.title);

    if (youtubePlayer && youtubePlayerReady) {
        youtubePlayer.loadVideoById(video.id);
        updateNowPlaying();
    }
}

// Update now playing display
function updateNowPlaying() {
    const nowPlayingEl = document.getElementById('nowPlaying');
    if (nowPlayingEl && shuffledPlaylist.length > 0) {
        const video = shuffledPlaylist[currentVideoIndex];
        nowPlayingEl.textContent = '♪ ' + video.title;
    }
}

// Check if YouTube is currently playing
function isYouTubePlaying() {
    return youtubeIsPlaying && bgMusicEnabled;
}

// Pause YouTube player
function pauseYouTube() {
    if (youtubePlayer && youtubePlayerReady) {
        try {
            youtubePlayer.pauseVideo();
        } catch (e) {
            console.log('Could not pause YouTube:', e);
        }
    }
}

// Resume YouTube player
function resumeYouTube() {
    if (youtubePlayer && youtubePlayerReady) {
        try {
            youtubePlayer.playVideo();
        } catch (e) {
            console.log('Could not resume YouTube:', e);
        }
    }
}

// Background music controls
function initBgMusic() {
    // Shuffle the playlist on init
    shuffledPlaylist = shuffleArray(meditationVideos);
    currentVideoIndex = 0;
}

function toggleBgMusic() {
    bgMusicEnabled = !bgMusicEnabled;
    const toggleBtn = document.getElementById('bgMusicToggle');

    toggleBtn.textContent = bgMusicEnabled ? '開' : '關';
    toggleBtn.classList.toggle('off', !bgMusicEnabled);

    // Show/hide YouTube embed and external button
    const youtubeEmbed = document.getElementById('youtubeEmbed');
    const youtubeExternal = document.getElementById('youtubeExternal');

    if (youtubeEmbed) {
        youtubeEmbed.style.display = bgMusicEnabled ? 'block' : 'none';

        // Create YouTube player when first enabled
        if (bgMusicEnabled && shuffledPlaylist.length > 0) {
            const video = shuffledPlaylist[currentVideoIndex];
            if (typeof YT !== 'undefined' && YT.Player) {
                createYouTubePlayer(video.id);
            } else {
                // Wait for API to be ready
                const checkAPI = setInterval(() => {
                    if (typeof YT !== 'undefined' && YT.Player) {
                        clearInterval(checkAPI);
                        createYouTubePlayer(video.id);
                    }
                }, 100);
                setTimeout(() => clearInterval(checkAPI), 10000);
            }
        }
    }
    if (youtubeExternal) {
        youtubeExternal.style.display = bgMusicEnabled ? 'none' : 'block';
    }
}

function setBgMusicVolume(value) {
    bgMusicVolume = value / 100;
    document.getElementById('bgMusicVolumeValue').textContent = value + '%';
    // Note: YouTube iframe volume cannot be controlled directly via JavaScript
    // This is just for UI feedback
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Set default mode
    selectMode('full');

    // Initialize background music listener
    initBgMusic();

    // Initialize volume displays
    const bellVolumeSlider = document.getElementById('bellVolumeSlider');
    const bgMusicVolumeSlider = document.getElementById('bgMusicVolumeSlider');

    if (bellVolumeSlider) {
        bellVolumeSlider.value = bellVolume * 100;
        document.getElementById('bellVolumeValue').textContent = Math.round(bellVolume * 100) + '%';
    }

    if (bgMusicVolumeSlider) {
        bgMusicVolumeSlider.value = bgMusicVolume * 100;
        document.getElementById('bgMusicVolumeValue').textContent = Math.round(bgMusicVolume * 100) + '%';
    }
});
