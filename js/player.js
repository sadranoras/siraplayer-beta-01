// Video Player Class
class VideoPlayer {
    constructor() {
        this.video = document.getElementById('videoPlayer');
        this.hls = null;
        this.currentQuality = '1080';
        this.currentSubtitle = 'off';
        this.isPlaying = false;
        
        this.initElements();
        this.initEventListeners();
        this.initKeyboardShortcuts();
    }

    initElements() {
        // Buttons
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.rewindBtn = document.getElementById('rewindBtn');
        this.forwardBtn = document.getElementById('forwardBtn');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.qualityBtn = document.getElementById('qualityBtn');
        this.subtitleBtn = document.getElementById('subtitleBtn');
        this.volumeBtn = document.getElementById('volumeBtn');
        this.brightnessBtn = document.getElementById('brightnessBtn');
        this.loadVideoBtn = document.getElementById('loadVideo');

        // Inputs
        this.videoUrlInput = document.getElementById('videoUrl');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.brightnessSlider = document.getElementById('brightnessSlider');

        // Displays
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.progressBar = document.getElementById('progressBar');
        this.progressFilled = document.getElementById('progressFilled');
        this.currentQualityEl = document.getElementById('currentQuality');

        // Dropdowns
        this.qualityOptions = document.getElementById('qualityOptions');
        this.subtitleOptions = document.getElementById('subtitleOptions');

        // Icons
        this.iconPlay = this.playPauseBtn.querySelector('.icon-play');
        this.iconPause = this.playPauseBtn.querySelector('.icon-pause');
        this.iconVolumeHigh = this.volumeBtn.querySelector('.icon-volume-high');
        this.iconVolumeMute = this.volumeBtn.querySelector('.icon-volume-mute');
    }

    initEventListeners() {
        // Video events
        this.video.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
        this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.video.addEventListener('play', () => this.onPlay());
        this.video.addEventListener('pause', () => this.onPause());
        this.video.addEventListener('ended', () => this.onEnded());

        // Button clicks
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.rewindBtn.addEventListener('click', () => this.seek(-5));
        this.forwardBtn.addEventListener('click', () => this.seek(5));
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.loadVideoBtn.addEventListener('click', () => this.loadVideo());

        // Quality selector
        this.qualityBtn.addEventListener('click', () => this.toggleDropdown(this.qualityOptions));
        this.qualityOptions.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeQuality(e.target.dataset.quality));
        });

        // Subtitle selector
        this.subtitleBtn.addEventListener('click', () => this.toggleDropdown(this.subtitleOptions));
        this.subtitleOptions.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeSubtitle(e.target.dataset.subtitle));
        });

        // Volume control
        this.volumeBtn.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('input', (e) => this.changeVolume(e.target.value));

        // Brightness control
        this.brightnessSlider.addEventListener('input', (e) => this.changeBrightness(e.target.value));

        // Progress bar click
        this.progressBar.addEventListener('click', (e) => this.seekToPosition(e));

        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.quality-selector')) {
                this.qualityOptions.classList.add('hidden');
            }
            if (!e.target.closest('.subtitle-selector')) {
                this.subtitleOptions.classList.add('hidden');
            }
        });
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'arrowleft':
                    this.seek(-5);
                    break;
                case 'arrowright':
                    this.seek(5);
                    break;
                case 'arrowup':
                    e.preventDefault();
                    this.changeVolume(Math.min(100, parseInt(this.volumeSlider.value) + 10));
                    break;
                case 'arrowdown':
                    e.preventDefault();
                    this.changeVolume(Math.max(0, parseInt(this.volumeSlider.value) - 10));
                    break;
                case 'f':
                    this.toggleFullscreen();
                    break;
                case 'm':
                    this.toggleMute();
                    break;
            }
        });
    }

    // HLS Loading
    loadVideo() {
        const url = this.videoUrlInput.value.trim();
        if (!url) {
            alert('لطفاً لینک ویدئو را وارد کنید!');
            return;
        }

        // Cleanup previous HLS instance
        if (this.hls) {
            this.hls.destroy();
        }

        // Check if HLS
        if (url.includes('.m3u8')) {
            if (Hls.isSupported()) {
                this.hls = new Hls();
                this.hls.loadSource(url);
                this.hls.attachMedia(this.video);
                this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    this.video.play();
                });
            } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
                this.video.src = url;
                this.video.addEventListener('loadedmetadata', () => {
                    this.video.play();
                });
            }
        } else {
            this.video.src = url;
            this.video.load();
        }
    }

    // Playback Controls
    togglePlay() {
        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }
    }

    seek(seconds) {
        this.video.currentTime += seconds;
    }

    seekToPosition(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        this.video.currentTime = pos * this.video.duration;
    }

    toggleFullscreen() {
        const container = document.querySelector('.video-container');
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    // Quality Control
    changeQuality(quality) {
        this.currentQuality = quality;
        this.currentQualityEl.textContent = `${quality}p`;
        this.qualityOptions.classList.add('hidden');
        
        // در نسخه واقعی اینجا باید کیفیت HLS تغییر کند
        console.log(`Quality changed to ${quality}p`);
    }

    // Subtitle Control
    changeSubtitle(lang) {
        this.currentSubtitle = lang;
        this.subtitleOptions.classList.add('hidden');
        
        if (lang === 'off') {
            this.video.textTracks[0].mode = 'hidden';
        } else {
            // Load subtitle track
            console.log(`Subtitle changed to ${lang}`);
        }
    }

    // Volume Control
    changeVolume(value) {
        this.video.volume = value / 100;
        this.volumeSlider.value = value;
        
        if (value === 0) {
            this.iconVolumeHigh.classList.add('hidden');
            this.iconVolumeMute.classList.remove('hidden');
        } else {
            this.iconVolumeMute.classList.add('hidden');
            this.iconVolumeHigh.classList.remove('hidden');
        }
    }

    toggleMute() {
        if (this.video.volume > 0) {
            this.video.dataset.lastVolume = this.video.volume;
            this.changeVolume(0);
        } else {
            this.changeVolume(this.video.dataset.lastVolume * 100 || 100);
        }
    }

    // Brightness Control
    changeBrightness(value) {
        this.video.style.filter = `brightness(${value}%)`;
    }

    // Event Handlers
    onLoadedMetadata() {
        this.durationEl.textContent = this.formatTime(this.video.duration);
    }

    onTimeUpdate() {
        this.currentTimeEl.textContent = this.formatTime(this.video.currentTime);
        const progress = (this.video.currentTime / this.video.duration) * 100;
        this.progressFilled.style.width = `${progress}%`;
    }

    onPlay() {
        this.isPlaying = true;
        this.iconPlay.classList.add('hidden');
        this.iconPause.classList.remove('hidden');
    }

    onPause() {
        this.isPlaying = false;
        this.iconPause.classList.add('hidden');
        this.iconPlay.classList.remove('hidden');
    }

    onEnded() {
        this.iconPause.classList.add('hidden');
        this.iconPlay.classList.remove('hidden');
    }

    // UI Helpers
    toggleDropdown(dropdown) {
        dropdown.classList.toggle('hidden');
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// Initialize Player
document.addEventListener('DOMContentLoaded', () => {
    const player = new VideoPlayer();
});