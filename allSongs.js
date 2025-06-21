tsParticles.load({
    id: "tsparticles",
    options: {
        fullScreen: { enable: false },
        background: {
            color: {
                value: "transparent"
            }
        },
        particles: {
            number: {
                value: 60
            },
            color: {
                value: "#99daff"
            },
            shape: {
                type: "circle"
            },
            opacity: {
                value: 0.5
            },
            size: {
                value: 3
            },
            links: {
                enable: true,
                distance: 120,
                color: "#ffffff",
                opacity: 0.4,
                width: 1
            },
            move: {
                enable: true,
                speed: 1,
                direction: "none",
                outModes: {
                    default: "bounce"
                }
            }
        },
        interactivity: {
            events: {
                onHover: {
                    enable: true,
                    mode: "repulse"
                },
                resize: true
            },
            modes: {
                repulse: {
                    distance: 100,
                    duration: 0.4
                }
            }
        },
        detectRetina: true
    }
});






const songsContainer = document.querySelector(".songs-container ul");

let db;
let audio = new Audio(); // Single audio element to play songs
let currentlyPlayingId = null; // To track currently playing song

const request = indexedDB.open("MusicPlayerDB", 2);

////////////////////////////////////////////////

request.onsuccess = function (event) {
    db = event.target.result;
    loadSongsFromDB(); // Load songs after DB opens
};

request.onerror = function () {
    console.error("Failed to open IndexedDB");
};

function loadSongsFromDB() {
    const txn = db.transaction("songs", "readonly");
    const store = txn.objectStore("songs");
    const getAll = store.getAll();

    getAll.onsuccess = () => {
        const songs = getAll.result;

        if (songs.length === 0) {
            songsContainer.innerHTML = '<li style = "color: white">No songs found.</li>'; // want to give color here
            return;
        }

        songsContainer.innerHTML = "";//clear container before appending the song

        songs.forEach((song, index) => {
            const li = document.createElement("li");

            const icon = document.createElement("div");
            icon.classList.add("icon");
            icon.textContent = "🎵";

            const songDiv = document.createElement("div");
            songDiv.classList.add("song");

            const songName = document.createElement("div");
            songName.classList.add("song-name");
            songName.textContent = song.name;

            const playPauseDiv = document.createElement("div");
            playPauseDiv.classList.add("playpause-btn");
            playPauseDiv.textContent = "▶️";

            songDiv.addEventListener("click", () => {
                if (currentlyPlayingId === song.id && !audio.paused) {
                    audio.pause();
                    playPauseDiv.textContent = "▶️";
                    currentlyPlayingId = null;
                    return;
                }
                document.querySelectorAll(".playpause-btn").forEach(btn => {
                    btn.textContent = "▶️";
                });

                audio.src = song.dataUrl;
                audio.play().then(() => {
                    playPauseDiv.textContent = "⏸️";
                    currentlyPlayingId = song.id;
                    console.log("Playing: ", song.name);
                }).catch(err => {
                    console.warn("Playback error: ", err);
                });

                audio.onended = () => {
                    playPauseDiv.textContent = "▶️";
                    currentlyPlayingId = null;
                };


            });
            songDiv.appendChild(songName);
            songDiv.appendChild(playPauseDiv);
            li.appendChild(icon);
            li.appendChild(songDiv);

            songsContainer.appendChild(li);
        });
    };
};