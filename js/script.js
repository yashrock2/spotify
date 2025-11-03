// Global variables
console.log('Lets write JavaScript');
let currentSong = new Audio();
let songs;
let currFolder;
let lastVolume = 0.5; // Store the last non-zero volume for mute/unmute

/**
 * Converts total seconds into a formatted "MM:SS" string.
 */
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

/**
 * Fetches the list of songs for a given folder.
 */
async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    
    // Extract MP3 filenames from the directory listing HTML
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    // Show all the songs in the playlist (Sidebar)
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    if (songUL) {
        songUL.innerHTML = "";
        for (const song of songs) {
            // NOTE: I'm replacing "Harry" with a placeholder for the artist, adjust as needed.
            songUL.innerHTML += `<li><img class="invert" width="34" src="img/music.svg" alt="">
                            <div class="info">
                                <div> ${song.replaceAll("%20", " ")}</div>
                                <div>Yash Nayak</div> 
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="img/play.svg" alt="">
                            </div> </li>`;
        }

        // Attach an event listener to each song
        Array.from(songUL.getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", element => {
                playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
            });
        });
    }

    return songs;
}

/**
 * Plays a specific track.
 */
const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    
    const play = document.getElementById("play"); 

    if (!pause) {
        currentSong.play();
        if (play) play.src = "img/pause.svg";
    } else {
        if (play) play.src = "img/play.svg";
    }
    
    const songInfo = document.querySelector(".songinfo");
    const songTime = document.querySelector(".songtime");

    if (songInfo) songInfo.innerHTML = decodeURI(track);
    if (songTime) songTime.innerHTML = "00:00 / 00:00";
}

/**
 * Displays the album cards using a manually defined list of folders.
 * 🟢 FIX: Takes a list of folders to avoid server directory listing issues.
 */
async function displayAlbums(folders) { 
    console.log("displaying albums");
    let cardContainer = document.querySelector(".cardContainer");
    if (cardContainer) cardContainer.innerHTML = ""; // Clear existing content

    // Loop through the provided folder names
    for (const folder of folders) {
        try {
            // Fetch the info.json file for album metadata
            let meta = await fetch(`/songs/${folder}/info.json`);
            
            if (meta.ok) {
                let response = await meta.json();
                
                if (cardContainer) {
                    // Create the album card HTML
                    cardContainer.innerHTML += ` <div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h2>${response.title}</h2>
                        <p>${response.description}</p>
                    </div>`;
                }
            } else {
                console.warn(`info.json not found for folder: ${folder}. Status: ${meta.status}`);
            }
        } catch (error) {
            console.error(`Failed to fetch or parse JSON for folder: ${folder}. Error:`, error);
        }
    }

    // Attach event listeners to the newly created album cards
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            console.log("Fetching Songs");
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0]);
        });
    });
}

/**
 * Main function to initialize the application and attach all listeners.
 */
async function main() {
    // 🟢 FIX 1: Declare play, previous, and next variables globally or here to avoid ReferenceError
    const play = document.getElementById("play");
    const previous = document.getElementById("previous");
    const next = document.getElementById("next");
    
    // Initial load: Get the list of all the songs for the default playlist
    await getSongs("songs/ncs");
    
    // 🟢 Safety Check: Only try to play if songs were found (prevents the 404 error)
    if (songs && songs.length > 0) {
        playMusic(songs[0], true);
    } else {
        document.querySelector(".songinfo").innerHTML = "No tracks available. Add MP3s to /songs/ncs/";
    }


    // 🟢 FIX 2: Define your album folders list manually
    const albumFolders = [
        "Angry_mood", 
        "Bright_mood", 
        "Chill_mood", 
        "Dark_mood",
        "Diljit",
        "Funky_mood",
        "Karan_aujla",
        "Love_mood",
        "ncs" // Added "ncs" as a card
    ];
    // Display all the albums on the page
    await displayAlbums(albumFolders);


    // --- Event Listeners ---

    // Play/Pause Listener
    if (play) {
        play.addEventListener("click", () => {
            if (currentSong.paused) {
                currentSong.play();
                play.src = "img/pause.svg";
            } else {
                currentSong.pause();
                play.src = "img/play.svg";
            }
        });
    }

    // Timeupdate Listener (updates seekbar and time display)
    currentSong.addEventListener("timeupdate", () => {
        const songTime = document.querySelector(".songtime");
        const circle = document.querySelector(".circle");
        
        if (songTime) {
            songTime.innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        }
        if (circle && currentSong.duration) {
            circle.style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });

    // Seekbar Listener
    const seekbar = document.querySelector(".seekbar");
    if (seekbar) {
        seekbar.addEventListener("click", e => {
            let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
            const circle = document.querySelector(".circle");
            if (circle) circle.style.left = percent + "%";
            currentSong.currentTime = ((currentSong.duration) * percent) / 100;
        });
    }

    // Hamburger and Close Listeners
    const leftPanel = document.querySelector(".left");
    if (document.querySelector(".hamburger") && leftPanel) {
        document.querySelector(".hamburger").addEventListener("click", () => {
            leftPanel.style.left = "0";
        });
    }
    if (document.querySelector(".close") && leftPanel) {
        document.querySelector(".close").addEventListener("click", () => {
            leftPanel.style.left = "-120%";
        });
    }

    // Previous Listener
    if (previous) {
        previous.addEventListener("click", () => {
            currentSong.pause();
            let currentTrack = currentSong.src.split("/").slice(-1)[0];
            let index = songs.indexOf(currentTrack);
            if ((index - 1) >= 0) {
                playMusic(songs[index - 1]);
            }
        });
    }

    // Next Listener
    if (next) {
        next.addEventListener("click", () => {
            currentSong.pause();
            let currentTrack = currentSong.src.split("/").slice(-1)[0];
            let index = songs.indexOf(currentTrack);
            if ((index + 1) < songs.length) {
                playMusic(songs[index + 1]);
            }
        });
    }

    // Volume Range Slider Listener
    const volumeRangeInput = document.querySelector(".range input");
    if (volumeRangeInput) {
        volumeRangeInput.addEventListener("change", (e) => {
            currentSong.volume = parseInt(e.target.value) / 100;
            if (currentSong.volume > 0) {
                 lastVolume = currentSong.volume;
            }
            const volumeIcon = document.querySelector(".volume > img");
            if (volumeIcon) {
                if (currentSong.volume > 0) {
                    volumeIcon.src = volumeIcon.src.replace("mute.svg", "volume.svg");
                } else {
                    volumeIcon.src = volumeIcon.src.replace("volume.svg", "mute.svg");
                }
            }
        });
    }

    // Mute/Unmute Listener
    const volumeIcon = document.querySelector(".volume > img");
    if (volumeIcon && volumeRangeInput) {
        volumeIcon.addEventListener("click", e => {
            if (e.target.src.includes("volume.svg")) {
                // Mute
                lastVolume = currentSong.volume; 
                e.target.src = e.target.src.replace("volume.svg", "mute.svg");
                currentSong.volume = 0;
                volumeRangeInput.value = 0;
            } else {
                // Unmute
                e.target.src = e.target.src.replace("mute.svg", "volume.svg");
                // Restore volume or set to 10% if lastVolume was zero
                currentSong.volume = lastVolume > 0 ? lastVolume : 0.10; 
                volumeRangeInput.value = Math.round(currentSong.volume * 100); 
            }
        });
    }
}

main(); // Execute the main function