let global_status_dot = document.getElementById("global-status-dot");
let global_status_text = document.getElementById("global-status-text");

let checkbox_qis_auto = document.getElementById("qis-auto");
let checkbox_studip_auto = document.getElementById("studip-auto");

const regex_qis_global = /^https?:\/\/qis\.verwaltung\.uni-hannover\.de.*/;
const regex_studip_global = /^https?:\/\/studip\.uni-hannover\.de.*/;

const regex_qis = /^https?:\/\/qis\.verwaltung\.uni-hannover\.de.*notenspiegelStudent&menu_open=n.*/;
const regex_studip = /^https?:\/\/studip\.uni-hannover\.de\/plugins\.php\/flowcastsplugin\/media\/player\/.*/;

//this is set on load to the last focused window
var tab = null;

window.addEventListener("load", async function init() {
  
  //load checkbox status
  chrome.storage.sync.get(['qis_auto', 'studip_auto'], function (items) {
    if (items != null) {
      checkbox_qis_auto.checked = items['qis_auto'];
      checkbox_studip_auto.checked = items['studip_auto'];
    } else {
      checkbox_qis_auto.checked = true;
      checkbox_studip_auto.checked = true;
      chrome.storage.sync.set({ 'studip_auto': true, 'qis_auto': true }, function () {
        console.log('Initialized settings');
      });
    }

    let slider_qis = document.querySelector("#slider-qis");
    let slider_studip = document.querySelector("#slider-studip");
    slider_qis.classList.add('no-animation');
    slider_studip.classList.add('no-animation');
    //skipping the animation
    setTimeout(()=>{
      slider_qis.classList.remove('no-animation');
      slider_studip.classList.remove('no-animation');
    }, 50);
  });

  let tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  tab = tabs[0];
  let on_qis = regex_qis_global.test(tab.url);
  let on_studip = regex_studip_global.test(tab.url);

  if (on_qis || on_studip) {
    global_status_enable();
  }
});

function global_status_enable(){
  global_status_dot.classList.add("status-dot-active");
  global_status_text.style.display = "none";
}

checkbox_qis_auto.addEventListener("change", async function () {
  let active = this.checked;
  if (this.checked) {
    let on_qis = regex_qis.test(tab.url)
    if(on_qis) {
      chrome.tabs.sendMessage(tab.id, { function: "mainQISCalculator" });
    }
  }
  chrome.storage.sync.set({ 'qis_auto': active });
})

checkbox_studip_auto.addEventListener("change", async function () {
  let active = this.checked;
  if (active) {
    let on_studip = regex_studip.test(tab.url)
    if(on_studip) {
      chrome.tabs.sendMessage(tab.id, { function: "insertDownloadButton" });
    }
  }
  chrome.storage.sync.set({ 'studip_auto': active });
})


//info popdown
let icon_info = document.getElementById("icon_info");
let popdown = document.getElementsByClassName("popdown")[0];

icon_info.addEventListener("click", () => {
  popdown.classList.toggle("active")
});


global_status_dot.addEventListener("click", async (event) => {
  if (event.detail === 4) {
    
    document.getElementById('header').classList.add('fade');
    global_status_text.innerText = "doesn't work on any site"
    chrome.scripting.executeScript({target: {tabId: tab.id}, func: roll})
  }
});

function roll() {
  const url_image = "https://imgl.krone.at/scaled/2347804/v0780ce/full.jpg"
  const url_video = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  console.log("roll");

  function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  
  color_roll()
  rolling()
  setInterval((rolling),2000);
  setInterval((color_roll),3000);

  async function rolling(){
    let images = document.getElementsByTagName("img");
    for(let image of images) {
      image.src = url_image;
    }
  }

  async function color_roll() {
    let elements = document.getElementsByTagName("*")
    for(let ele of elements) {
      ele.style.color = getRandomColor()
    }
  }
}





