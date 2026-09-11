// ==========================================
// STREAMLY VIDEO PLAYER
// ==========================================


// ==========================================
// عناصر صفحه
// ==========================================

const video = document.getElementById("video");

const API_BASE = "https://siraplayer-beta-01.onrender.com";

const input = document.getElementById("videoUrl");
const loadBtn = document.getElementById("loadBtn");

const playBtn = document.getElementById("playBtn");

const backBtn = document.getElementById("backBtn");
const forwardBtn = document.getElementById("forwardBtn");

const muteBtn = document.getElementById("muteBtn");
const volume = document.getElementById("volume");

const progress = document.getElementById("progress");

const currentTimeText =
    document.getElementById("currentTime");

const durationText =
    document.getElementById("duration");

const quality =
    document.getElementById("quality");

const speed =
    document.getElementById("speed");

const subtitleBtn =
    document.getElementById("subtitleBtn");

const brightnessBtn =
    document.getElementById("brightnessBtn");

const brightnessPanel =
    document.getElementById("brightnessPanel");

const brightness =
    document.getElementById("brightness");

const brightnessValue =
    document.getElementById("brightnessValue");

const fullscreenBtn =
    document.getElementById("fullscreenBtn");

const status =
    document.getElementById("status");

const playerContainer =
    document.querySelector(".video-container");


// ==========================================
// تنظیمات
// ==========================================

const SEEK_TIME = 5;

const PLAYBACK_SPEEDS = [
    0.5,
    0.75,
    1,
    1.25,
    1.5,
    1.75,
    2
];

let wasPlayingBeforeSeek = false;

let controlsTimer = null;

let mouseNearBottom = false;


// ==========================================
// بارگذاری ویدیو
// ==========================================

loadBtn.addEventListener("click", loadVideo);


input.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        loadVideo();
    }

});


async function loadVideo() {

    const url = input.value.trim();


    if (!url) {

        setStatus(
            "لطفاً لینک ویدیو را وارد کنید."
        );

        return;
    }


    // فعلاً MP4
    if (!url.toLowerCase().includes(".mp4")) {

        setStatus(
            "فعلاً لینک مستقیم MP4 پشتیبانی می‌شود."
        );

        return;
    }


    setStatus(
        "در حال بارگذاری ویدیو..."
    );


    // توقف ویدئوی قبلی
    video.pause();

    video.removeAttribute("src");

    video.load();


    // ساخت URL پروکسی
    // const proxyUrl =
    //     "/api/proxy?url=" +
    //     encodeURIComponent(url);


    // video.src = proxyUrl;

    const API_BASE = "https://siraplayer-beta-01.onrender.com";

    video.src =
        `${API_BASE}/api/proxy?url=${encodeURIComponent(videoUrl)}`;

    video.addEventListener("loadedmetadata", () => {
    setStatus("ویدئو آماده پخش است", "success");
}, { once: true });

    // تنظیمات اولیه
    video.playbackRate = 1;

    speed.value = "1";

    video.volume =
        Number(volume.value);


    progress.value = 0;

    currentTimeText.textContent = "00:00";

    durationText.textContent = "00:00";


    // وقتی اطلاعات ویدیو آماده شد
    video.addEventListener(
        "loadedmetadata",
        handleMetadata,
        { once: true }
    );


    // خطا
    video.addEventListener("error", () => {
    setStatus(
        "❌ ویدئو قابل پخش نیست. ممکن است لینک منقضی شده باشد یا سرور اجازه پخش مستقیم ندهد.",
        "error"
    );
});


    try {

        await video.play();

        playBtn.textContent = "⏸";

        setStatus(
            "ویدیو در حال پخش است."
        );

    } catch (error) {

        playBtn.textContent = "▶";

        setStatus(
            "ویدیو آماده است؛ دکمه Play را بزنید."
        );

    }

}


// ==========================================
// Metadata
// ==========================================

function handleMetadata() {

    if (Number.isFinite(video.duration)) {

        durationText.textContent =
            formatTime(video.duration);

    }

    setStatus(
        "ویدیو آماده پخش است."
    );

}


// ==========================================
// خطای ویدیو
// ==========================================

function handleVideoError() {

    setStatus(
        "خطا در پخش ویدیو. ممکن است سرور مقصد دسترسی را مسدود کرده باشد."
    );

}


// ==========================================
// وضعیت
// ==========================================

function setStatus(message) {

    if (status) {
        status.textContent = message;
    }

}


// ==========================================
// Play / Pause
// ==========================================

playBtn.addEventListener("click", togglePlay);


async function togglePlay() {

    if (video.paused) {

        try {

            await video.play();

        } catch (error) {

            console.log(
                "Play error:",
                error
            );

        }

    } else {

        video.pause();

    }

}


video.addEventListener("play", () => {

    playBtn.textContent = "⏸";

});


video.addEventListener("pause", () => {

    playBtn.textContent = "▶";

});


video.addEventListener("ended", () => {

    playBtn.textContent = "▶";

});


// ==========================================
// ۵ ثانیه عقب
// ==========================================

backBtn.addEventListener("click", () => {

    seekBy(-SEEK_TIME);

});


// ==========================================
// ۵ ثانیه جلو
// ==========================================

forwardBtn.addEventListener("click", () => {

    seekBy(SEEK_TIME);

});


function seekBy(seconds) {

    if (!Number.isFinite(video.duration)) {
        return;
    }


    const newTime =
        video.currentTime + seconds;


    video.currentTime =
        Math.max(
            0,
            Math.min(
                video.duration,
                newTime
            )
        );

}


// ==========================================
// نوار زمان
// ==========================================


// شروع کشیدن نوار
progress.addEventListener(
    "pointerdown",
    () => {

        wasPlayingBeforeSeek =
            !video.paused;

        if (wasPlayingBeforeSeek) {
            video.pause();
        }

    }
);


// حرکت روی نوار
progress.addEventListener(
    "input",
    () => {

        if (!Number.isFinite(video.duration)) {
            return;
        }


        const newTime =
            (Number(progress.value) / 100) *
            video.duration;


        video.currentTime =
            newTime;


        currentTimeText.textContent =
            formatTime(newTime);

    }
);


// رها کردن نوار
progress.addEventListener(
    "pointerup",
    resumeAfterSeek
);


// اگر pointer خارج شد
progress.addEventListener(
    "pointercancel",
    resumeAfterSeek
);


async function resumeAfterSeek() {

    if (!Number.isFinite(video.duration)) {
        return;
    }


    const newTime =
        (Number(progress.value) / 100) *
        video.duration;


    video.currentTime =
        newTime;


    // اگر قبل از Seek پخش می‌شد
    if (wasPlayingBeforeSeek) {

        try {

            await video.play();

        } catch (error) {

            console.log(
                "Playback after seek failed:",
                error
            );

        }

    }

}


// ==========================================
// بروزرسانی نوار زمان
// ==========================================

video.addEventListener(
    "timeupdate",
    updateProgress
);


function updateProgress() {

    if (!Number.isFinite(video.duration)) {
        return;
    }


    const percentage =
        (video.currentTime /
            video.duration) * 100;


    progress.value =
        percentage;


    currentTimeText.textContent =
        formatTime(video.currentTime);


    durationText.textContent =
        formatTime(video.duration);

}


// ==========================================
// فرمت زمان
// ==========================================

function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return "00:00";
    }


    seconds =
        Math.floor(seconds);


    const hours =
        Math.floor(seconds / 3600);


    const minutes =
        Math.floor(
            (seconds % 3600) / 60
        );


    const secs =
        seconds % 60;


    if (hours > 0) {

        return (
            String(hours).padStart(2, "0") +
            ":" +
            String(minutes).padStart(2, "0") +
            ":" +
            String(secs).padStart(2, "0")
        );

    }


    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
    );

}


// ==========================================
// صدا
// ==========================================

volume.addEventListener(
    "input",
    () => {

        const value =
            Number(volume.value);


        video.volume =
            value;


        video.muted =
            value === 0;


        updateMuteIcon();

    }
);


// ==========================================
// Mute
// ==========================================

muteBtn.addEventListener(
    "click",
    toggleMute
);


function toggleMute() {

    video.muted =
        !video.muted;


    updateMuteIcon();

}


function updateMuteIcon() {

    if (
        video.muted ||
        video.volume === 0
    ) {

        muteBtn.textContent = "🔇";

    } else {

        muteBtn.textContent = "🔊";

    }

}


// ==========================================
// سرعت پخش
// ==========================================

speed.addEventListener(
    "change",
    () => {

        const selectedSpeed =
            Number(speed.value);


        if (
            !PLAYBACK_SPEEDS.includes(
                selectedSpeed
            )
        ) {
            return;
        }


        video.playbackRate =
            selectedSpeed;


        setStatus(
            `سرعت پخش: ${selectedSpeed}x`
        );

    }
);


// ==========================================
// کیفیت
// ==========================================

quality.addEventListener(
    "change",
    () => {

        const selectedQuality =
            quality.value;


        if (
            selectedQuality === "auto"
        ) {

            setStatus(
                "کیفیت خودکار انتخاب شد."
            );

            return;
        }


        /*
            فعلاً این فقط انتخاب را ثبت می‌کند.

            برای تغییر واقعی کیفیت باید
            منابع جداگانه داشته باشیم:

            360p  -> video360.mp4
            720p  -> video720.mp4
            1080p -> video1080.mp4

            یا از HLS / m3u8 استفاده کنیم.
        */


        setStatus(
            `کیفیت ${selectedQuality}p انتخاب شد.`
        );

    }
);


// ==========================================
// زیرنویس
// ==========================================

subtitleBtn.addEventListener(
    "click",
    () => {

        /*
            در مرحله بعد می‌توانیم
            فایل WebVTT را به video اضافه کنیم.
        */

        setStatus(
            "سیستم زیرنویس آماده اتصال به فایل VTT است."
        );

    }
);


// ==========================================
// روشنایی
// ==========================================

brightnessBtn.addEventListener(
    "click",
    () => {

        brightnessPanel.classList.toggle(
            "show"
        );

    }
);


brightness.addEventListener(
    "input",
    () => {

        const value =
            Number(brightness.value);


        video.style.filter =
            `brightness(${value}%)`;


        brightnessValue.textContent =
            `${value}%`;

    }
);


// ==========================================
// Fullscreen
// ==========================================

fullscreenBtn.addEventListener(
    "click",
    toggleFullscreen
);


async function toggleFullscreen() {

    try {

        if (!document.fullscreenElement) {

            await playerContainer.requestFullscreen();

        } else {

            await document.exitFullscreen();

        }

    } catch (error) {

        console.log(
            "Fullscreen error:",
            error
        );

    }

}


// ==========================================
// تشخیص تغییر Fullscreen
// ==========================================

document.addEventListener(
    "fullscreenchange",
    () => {

        if (document.fullscreenElement) {

            showControls();

        } else {

            playerContainer.classList.remove(
                "controls-hidden"
            );

            clearTimeout(
                controlsTimer
            );

        }

    }
);


// ==========================================
// نمایش کنترل‌های Fullscreen
// ==========================================

function showControls() {

    playerContainer.classList.remove(
        "controls-hidden"
    );


    clearTimeout(
        controlsTimer
    );


    controlsTimer =
        setTimeout(() => {

            if (
                document.fullscreenElement &&
                !mouseNearBottom
            ) {

                playerContainer.classList.add(
                    "controls-hidden"
                );

            }

        }, 2500);

}


// ==========================================
// حرکت موس در Fullscreen
// ==========================================

document.addEventListener(
    "mousemove",
    (event) => {

        if (!document.fullscreenElement) {
            return;
        }


        const screenHeight =
            window.innerHeight;


        const mouseY =
            event.clientY;


        // 150 پیکسل پایین صفحه
        mouseNearBottom =
            mouseY >=
            screenHeight - 150;


        if (mouseNearBottom) {

            showControls();

        }

    }
);


// ==========================================
// کنترل کامل با کیبورد
// ==========================================

document.addEventListener(
    "keydown",
    handleKeyboard
);


function handleKeyboard(event) {

    /*
        اگر کاربر در input باشد،
        کلیدهای پلیر اجرا نشوند.
    */

    if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "SELECT" ||
        event.target.tagName === "TEXTAREA"
    ) {

        return;

    }


    // ======================================
    // Space = Play / Pause
    // ======================================

    if (event.code === "Space") {

        event.preventDefault();

        togglePlay();

        return;

    }


    // ======================================
    // Arrow Left = ۵ ثانیه عقب
    // ======================================

    if (event.code === "ArrowLeft") {

        event.preventDefault();

        seekBy(-SEEK_TIME);

        return;

    }


    // ======================================
    // Arrow Right = ۵ ثانیه جلو
    // ======================================

    if (event.code === "ArrowRight") {

        event.preventDefault();

        seekBy(SEEK_TIME);

        return;

    }


    // ======================================
    // M = Mute
    // ======================================

    if (
        event.key.toLowerCase() === "m"
    ) {

        event.preventDefault();

        toggleMute();

        return;

    }


    // ======================================
    // F = Fullscreen
    // ======================================

    if (
        event.key.toLowerCase() === "f"
    ) {

        event.preventDefault();

        toggleFullscreen();

        return;

    }


    // ======================================
    // [ = کاهش سرعت
    // ] = افزایش سرعت
    // ======================================

    if (
        event.key === "[" ||
        event.key === "]"
    ) {

        event.preventDefault();

        changePlaybackSpeed(
            event.key === "]"
                ? 1
                : -1
        );

        return;

    }


    // ======================================
    // Arrow Up = زیاد کردن صدا
    // Arrow Down = کم کردن صدا
    // ======================================

    if (event.code === "ArrowUp") {

        event.preventDefault();

        changeVolume(0.05);

        return;

    }


    if (event.code === "ArrowDown") {

        event.preventDefault();

        changeVolume(-0.05);

        return;

    }

}


// ==========================================
// تغییر سرعت با کیبورد
// ==========================================

function changePlaybackSpeed(direction) {

    let currentIndex =
        PLAYBACK_SPEEDS.indexOf(
            video.playbackRate
        );


    if (currentIndex === -1) {
        currentIndex = 2;
    }


    currentIndex += direction;


    currentIndex =
        Math.max(
            0,
            Math.min(
                PLAYBACK_SPEEDS.length - 1,
                currentIndex
            )
        );


    const newSpeed =
        PLAYBACK_SPEEDS[currentIndex];


    video.playbackRate =
        newSpeed;


    speed.value =
        String(newSpeed);


    setStatus(
        `سرعت پخش: ${newSpeed}x`
    );

}


// ==========================================
// تغییر صدا با کیبورد
// ==========================================

function changeVolume(amount) {

    let newVolume =
        video.volume + amount;


    newVolume =
        Math.max(
            0,
            Math.min(
                1,
                newVolume
            )
        );


    video.volume =
        newVolume;


    video.muted =
        newVolume === 0;


    volume.value =
        newVolume;


    updateMuteIcon();

}


// ==========================================
// کلیک روی ویدیو = Play / Pause
// ==========================================

video.addEventListener(
    "click",
    () => {

        togglePlay();

    }
);


// ==========================================
// دوبار کلیک روی ویدیو = Fullscreen
// ==========================================

video.addEventListener(
    "dblclick",
    () => {

        toggleFullscreen();

    }
);
