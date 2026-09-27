let currentSong = new Audio();
let globalSongsList = []; 

function formatTime(seconds) {
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = Math.floor(seconds % 60);

    minutes = String(minutes).padStart(2, "0");
    remainingSeconds = String(remainingSeconds).padStart(2, "0");

    return `${minutes}:${remainingSeconds}`;
}

async function getSongs() {
    let a = await fetch("songs/");
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let songs = [];
    for (let index = 0; index < anchors.length; index++) {
        const element = anchors[index];
        if (element.href.endsWith(".mp3") || element.href.endsWith(".m4a")) {
            songs.push(element.href.split("/songs/")[1]);
        }
    }
    return songs;
}

const playMusic = (track) => {
    currentSong.src = "/songs/" + track;
    currentSong.play();
    document.querySelector("#play").src = "pause.svg";
    
    let displayName = decodeURIComponent(track).replace(".mp3", "").replace(".m4a", "");
    document.querySelector(".songinfo").innerHTML = displayName;
    document.querySelector(".songtime").innerHTML = "00:00/00:00";

    // --- FEATURE: HIGHLIGHT ACTIVE SONG IN LIBRARY ---
    Array.from(document.querySelector(".songList ul").getElementsByTagName("li")).forEach(e => {
        let targetSong = decodeURIComponent(e.dataset.song);
        if (targetSong === track) {
            e.classList.add("active-song");
        } else {
            e.classList.remove("active-song");
        }
    });
};

async function main() {
    // Get the list of all songs and save them to the global variable
    globalSongsList = await getSongs();
    console.log(globalSongsList);

    // Show all songs dynamically in the playlist UI
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";
    for (const song of globalSongsList) {
        let cleanName = decodeURIComponent(song)
            .replace(".mp3", "")
            .replace(".m4a", "");
        songUL.innerHTML += `
            <li data-song="${encodeURIComponent(song)}">
                <img class="invert" src="music.svg" alt="">
                <div class="info">
                    <div>${cleanName}</div>
                    <div>Aryan Choudhary</div>
                </div>
                <img class="invert" src="play.svg" alt="">
            </li>`;
    }

    // Attach event listeners to each library list item song
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            let song = decodeURIComponent(e.dataset.song);
            playMusic(song);
        });
    });

    // Grab playbar controls explicitly
    let playBtn = document.querySelector("#play");
    let previousBtn = document.querySelector("#previous");
    let nextBtn = document.querySelector("#next");

    // Attach an event listener to the playbar's main play button
    playBtn.addEventListener("click", () => {
        if (currentSong.paused) {
            if (!currentSong.src || currentSong.src === window.location.href) {
                if (globalSongsList.length > 0) {
                    playMusic(globalSongsList[0]);
                }
            } else {
                currentSong.play();
                playBtn.src = "pause.svg";
            }
        } else {
            currentSong.pause();
            playBtn.src = "play.svg";
        }
    });

    // --- NEXT BUTTON FUNCTIONALITY ---
    nextBtn.addEventListener("click", () => {
        currentSong.pause();
        
        let currentFileName = decodeURIComponent(currentSong.src.split("/songs/").pop());
        let index = globalSongsList.findIndex(song => decodeURIComponent(song) === currentFileName);
        
        if (index !== -1 && (index + 1) < globalSongsList.length) {
            playMusic(globalSongsList[index + 1]);
        } else if (globalSongsList.length > 0) {
            playMusic(globalSongsList[0]); // Loops back to first song
        }
    });

    // --- PREVIOUS BUTTON FUNCTIONALITY ---
    previousBtn.addEventListener("click", () => {
        currentSong.pause();

        let currentFileName = decodeURIComponent(currentSong.src.split("/songs/").pop());
        let index = globalSongsList.findIndex(song => decodeURIComponent(song) === currentFileName);
        
        if (index > 0) {
            playMusic(globalSongsList[index - 1]);
        } else if (globalSongsList.length > 0) {
            playMusic(globalSongsList[globalSongsList.length - 1]); // Loops to last song
        }
    });

    // --- FEATURE: AUTO-PLAY NEXT SONG ON END ---
    currentSong.addEventListener("ended", () => {
        let currentFileName = decodeURIComponent(currentSong.src.split("/songs/").pop());
        let index = globalSongsList.findIndex(song => decodeURIComponent(song) === currentFileName);
        
        if (index !== -1 && (index + 1) < globalSongsList.length) {
            playMusic(globalSongsList[index + 1]);
        } else if (globalSongsList.length > 0) {
            playMusic(globalSongsList[0]);
        }
    });

    // --- FEATURE: LIVE SEARCH BAR FILTERING ---
    let searchInput = document.querySelector("#searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            let query = e.target.value.toLowerCase();
            let songItems = document.querySelectorAll(".songList ul li");
            
            songItems.forEach(item => {
                let songTitle = item.querySelector(".info div").textContent.toLowerCase();
                if (songTitle.includes(query)) {
                    item.style.display = "flex"; // Show matching songs
                } else {
                    item.style.display = "none"; // Hide non-matching songs
                }
            });
        });
    }

    // --- FEATURE: KEYBOARD SHORTCUTS (SPACEBAR TO PLAY/PAUSE) ---
    document.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            e.preventDefault(); // Prevents browser from scrolling down
            if (currentSong.paused) {
                if (!currentSong.src || currentSong.src === window.location.href) {
                    if (globalSongsList.length > 0) {
                        playMusic(globalSongsList[0]);
                    }
                } else {
                    currentSong.play();
                    playBtn.src = "pause.svg";
                }
            } else {
                currentSong.pause();
                playBtn.src = "play.svg";
            }
        }
    });

    // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${formatTime(currentSong.currentTime)}/${formatTime(currentSong.duration)}`;
        if(currentSong.duration) {
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });
}

main();