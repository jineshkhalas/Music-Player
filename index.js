const fileInput = document.querySelector("#fileInput");
const fileDisplay = document.querySelector(".file-display");
const songTitle = document.querySelector("#songTitle");
const seeker = document.querySelector("#seekbar");
const prevBtn = document.querySelector("#prevBtn");
const playBtn = document.querySelector("#playBtn");
const nextBtn = document.querySelector("#nextBtn");
const audio = document.querySelector("#audio");

let db; // reference to database of indexedDB
let songs = [];
let currentIndex = 0;
let isPlaying = false;

////////////////////////////////////////////////

// Create or open IndexedDB database
const request = indexedDB.open("MusicPlayerDB", 2);

request.onupgradeneeded = function (e) {
    db = e.target.result;

    // Reset the "songs" store during upgrade (useful for dev/test)
    if (db.objectStoreNames.contains("songs")) {
        db.deleteObjectStore("songs");
    }

    // Create a new object store with auto-generated key "id"
    db.createObjectStore("songs", {
        keyPath: "id",
        autoIncrement: true
    });
};

request.onsuccess = function (e) {
    db = e.target.result;

    // Load stored songs into memory once DB is ready
    loadSongsFromDB();
};

request.onerror = function () {
    console.error("IndexedDB failed to open.");
};

////////////////////////////////////////////////

function loadSongsFromDB(shouldAutoplay = true) {
    const txn = db.transaction("songs", "readonly"); // Start read-only transaction
    const store = txn.objectStore("songs");          // Access the "songs" store
    const getAll = store.getAll();                   // Read all stored entries

    getAll.onsuccess = () => {
        songs = getAll.result;                       // Store songs in memory
        console.log("Songs loaded:", songs);

        if (songs.length > 0) {
            currentIndex = 0;
            if (shouldAutoplay) {
                loadSong(currentIndex);  // Only autoplay if flag is true
            } else {
                audio.src = ""; // reset audio if not autoplaying
                songTitle.textContent = "🎵 Songs updated. Ready to play.";
                playBtn.textContent = "▶️ Play";
                isPlaying = false;
            }
        } else {
            songTitle.textContent = "🎵 No songs loaded";
        }
    };
}

////////////////////////////////////////////////

// When user clicks "choose songs", then triggers file input
fileDisplay.addEventListener("click", () => fileInput.click());

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file); // Read file as base64 string
    });
}

fileInput.addEventListener("change", async () => {
    const files = Array.from(fileInput.files);

    if (files.length === 0) return;

    for (const file of files) {
        await readFileAsDataURL(file).then((dataUrl) => {
            const txn = db.transaction("songs", "readwrite"); // Start write transaction
            const store = txn.objectStore("songs");           // Access "songs" store

            const song = {
                name: file.name,
                dataUrl: dataUrl
            };

            // Use put() to add or update entry without key conflict
            const addRequest = store.put(song);

            addRequest.onsuccess = () => {
                console.log(`✅ Stored: ${file.name}`);
            };

            addRequest.onerror = () => {
                console.error(`❌ Failed to store: ${file.name}`);
            };
        });
    }

    loadSongsFromDB(false); // Refresh list after storing new files
});

////////////////////////////////////////////////

function loadSong(index) {
    const song = songs[index];
    if (!song) return;

    audio.src = song.dataUrl; // directly use stored base64
    songTitle.textContent = `🎵 ${song.name}`;

    setTimeout(() => {
        // Autoplay might be blocked unless triggered by user
        audio.play().then(() => {
            isPlaying = true;
            playBtn.textContent = "⏸️ Pause";
            console.log("Now playing:", song.name);
        }).catch(err => {
            console.warn("Autoplay blocked or failed:", err);
            playBtn.textContent = "▶️ Play";
        });
    }, 100);
}

////////////////////////////////////////////////

playBtn.addEventListener("click", () => {
    if (!audio.src) return; // do nothing if no song is loaded

    if (isPlaying) {
        audio.pause();
        playBtn.textContent = "▶️ Play";
    } else {
        audio.play().then(() => {
            playBtn.textContent = "⏸️ Pause";
        }).catch(err => {
            console.warn("Playback error:", err);
        });
    }

    isPlaying = !isPlaying; // flip play state
});

prevBtn.addEventListener("click", () => {
    if (songs.length === 0) return;

    currentIndex = (currentIndex - 1 + songs.length) % songs.length;
    loadSong(currentIndex);
});

nextBtn.addEventListener("click", () => {
    if (songs.length === 0) return;

    currentIndex = (currentIndex + 1) % songs.length;
    loadSong(currentIndex);
});

seeker.addEventListener("input", () => {
    if (audio.duration) {
        const seekTo = (seeker.value / 100) * audio.duration;
        audio.currentTime = seekTo;
    }
});

audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
        seeker.value = (audio.currentTime / audio.duration) * 100;
    }
});

audio.addEventListener("ended", () => {
    nextBtn.click(); // next song when current song is over
});



//////////////////////////////////
//canvas

const canvas = document.getElementById("musicCanvas");
const ctx = canvas.getContext("2d");

const barCount = 21;
const barWidth = 5;
const barGap = 8;
const bars = [];


for (let i = 0; i < barCount; i++) {
    bars.push({
        x: i * (barWidth + barGap) + (canvas.width - (barCount * (barWidth + barGap))) / 2,
        height: Math.random() * canvas.height,
        speed: Math.random() * 0.5 + 0.2,
        offset: Math.random() * Math.PI * 3
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#38b6ff";

    const time = performance.now() / 150;

    for (let i = 0; i < bars.length; i++) {
        const bar = bars[i];
        const height = (Math.sin(time * bar.speed + bar.offset) * 0.5 + 0.5) * canvas.height * 0.8;
        const y = (canvas.height - height) / 2;

        ctx.fillRect(bar.x, y, barWidth, height);
    }

    requestAnimationFrame(draw);
}

draw();