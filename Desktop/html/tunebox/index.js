
let currentSong = new Audio();
let songs;
let currfolder;
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

async function getsongs(folder) {
  currfolder=folder;
  let a = await fetch(`http://127.0.0.1:3002/${folder}/`);
  let response = await a.text();

  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
   songs = [];

  for (const element of as) {
    if (element.href.endsWith(".mp3")) {
      const songFilename = element.textContent
        .replace(/^\\${folders}\\|^\/${folder}\//, '');
      songs.push(songFilename);
    }
  }
 const songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0];
  songUL.innerHTML = "";

  for (const song of songs) {
    let displayName = decodeURIComponent(song).replace(".mp3", "");

    const li = document.createElement("li");
    li.innerHTML = `
      <img class="invert music" src="img/music.svg" alt="">
      <div class="info"><div>${displayName}</div></div>
      <div class="playnow">
        <span>play now</span>
        <img class="invert play" src="img/play.svg" alt="">
      </div>
    `;

    
    li.querySelector(".playnow").addEventListener("click", () => {
      playMusic(song);   
    });

    songUL.appendChild(li);
  }

}

function playMusic(track,pause=false) {
  currentSong.src = `/${currfolder}/` + track;   
  if(!pause){
   
      currentSong.play();
              plays.src="img/pause.svg"
  }


          document.querySelector(".songinfo").innerHTML=decodeURI(track)

          document.querySelector(".songtime").innerHTML="00.00/00.00"

          
}


async function main() {
 await getsongs("songs/ncs");
playMusic(songs[0],true)

  
  plays.addEventListener("click",()=>{
    if(currentSong.paused){
        currentSong.play()
        plays.src="img/pause.svg"
    }
    else{
        currentSong.pause()
        plays.src="img/play.svg"
    }
  })

  currentSong.addEventListener("timeupdate",()=>{
    console.log(currentSong.currentTime,currentSong.duration)
    document.querySelector(".songtime").innerHTML=`${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`
  document.querySelector(".circle").style.left =( currentSong.currentTime/currentSong.duration)*100+"%";

})


// event on seekbar
document.querySelector(".seekbar").addEventListener("click", e => {
  let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
  document.querySelector(".circle").style.left = percent + "%";
  currentSong.currentTime = (currentSong.duration * percent) / 100;
});

// event in hamburger
document.querySelector(".hamburger").addEventListener("click",()=>{
  document.querySelector(".left").style.left='0'
})
// event of close
document.querySelector(".close").addEventListener("click",()=>{
  document.querySelector(".left").style.left="-120%"
})
// pre and next eventlistner
prev.addEventListener("click", () => {
    currentSong.pause();

    let currentTrack = decodeURIComponent(currentSong.src.split("/").pop());
    let index = songs.indexOf(currentTrack);

    if (index > 0) {
        
        playMusic(songs[index - 1]);
    } else {
        
        playMusic(songs[index]);
    }
});

next.addEventListener("click", () => {
    currentSong.pause();

    let currentTrack = decodeURIComponent(currentSong.src.split("/").pop());
    let index = songs.indexOf(currentTrack);

    if (index < songs.length - 1) {
      
        playMusic(songs[index + 1]);
    } else {
        
        playMusic(songs[index]);
    }
}); 
//  event on volume
const volumeImg = document.querySelector(".volume>img");
const volumeSlider = document.querySelector(".range").getElementsByTagName("input")[0];

let lastVolume = 0.3;  



volumeSlider.addEventListener("change", (e) => {
    const value = parseInt(e.target.value) / 100;
    currentSong.volume = value;
    console.log("setting volume to", e.target.value, "/ 100");

    if (value > 0) {
        lastVolume = value;
        volumeImg.src = volumeImg.src.replace("img/mute.svg", "img/volume.svg");
    } else {
        volumeImg.src = volumeImg.src.replace("img/volume.svg", "img/mute.svg");
    }
});

//   mute/unmute
volumeImg.addEventListener("click", () => {
    if (currentSong.volume > 0) {
        // mute
        lastVolume = currentSong.volume;   
        currentSong.volume = 0;
        volumeSlider.value = 0;
        volumeImg.src = volumeImg.src.replace("volume.svg", "mute.svg");
    } else {
        // unmute
        currentSong.volume = lastVolume;
        volumeSlider.value = lastVolume * 100;
        volumeImg.src = volumeImg.src.replace("mute.svg", "volume.svg");
    }
});
// load the playlist
Array.from(document.getElementsByClassName("card")).forEach(e => {
  e.addEventListener("click", async (event) => {
    await getsongs(`songs/${event.currentTarget.dataset.folder}`);
    playMusic(songs[0]);
  });
});



}

main();     
