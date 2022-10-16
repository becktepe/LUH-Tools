let global_status_dot = document.getElementById("global-status-dot");
let global_status_text = document.getElementById("global-status-text");

let checkbox_qis_grade_insert = document.getElementById("qis_grade_insert");
let checkbox_studip_insert_download = document.getElementById("studip_insert_download");
let checkbox_studip_total_video_time = document.getElementById("studip_total_video_time");
let checkbox_studip_plain_videoplayer = document.getElementById("studip_plain_videoplayer");

const regex_qis_global = /^https?:\/\/qis\.verwaltung\.uni-hannover\.de.*/;
const regex_studip_global = /^https?:\/\/studip\.uni-hannover\.de.*/;

const regex_qis = /^https?:\/\/qis\.verwaltung\.uni-hannover\.de.*notenspiegelStudent&menu_open=n.*/;
const regex_studip = /^https?:\/\/studip\.uni-hannover\.de\/plugins\.php\/flowcastsplugin\/media\/.*/;

//this is global and set on load to the last focused window
var tab = null;

window.addEventListener("load", async function init() {
  //insert manifest version
  var manifestData = chrome.runtime.getManifest();
  document.getElementById("version").innerText = manifestData.version;

  await load_settings();

  //skipping the slider animation
  {
    let sliders = document.getElementsByClassName("slider")
    for (let slider of sliders) {
      slider.classList.add('no-animation');
    }
    setTimeout(() => {
      for (let slider of sliders) {
        slider.classList.remove('no-animation');
      }
    }, 50);
  }

  set_global_status_dot();

});

async function load_settings() {
  //loads settings status and sets the sliders
  //['qis_grade_insert', 'studip_insert_download', 'studip_plain_videoplayer', 'studip_total_video_time']
  let settings = await chrome.storage.sync.get(null);

  console.log(JSON.stringify(settings, null, 2))

  //if a settings doesn't exist init it with true
  if (!settings.hasOwnProperty("qis_grade_insert")) {
    settings["qis_grade_insert"] = true;
  }

  if (!settings.hasOwnProperty("studip_insert_download")) {
    settings["studip_insert_download"] = true;
  }

  if (!settings.hasOwnProperty("studip_total_video_time")) {
    settings["studip_total_video_time"] = true;
  }

  if (!settings.hasOwnProperty("studip_plain_videoplayer")) {
    settings["studip_plain_videoplayer"] = true;
  }

  console.log(JSON.stringify(settings, null, 2))
  //write back settings
  chrome.storage.sync.set(settings);

  //set checkboxes
  checkbox_qis_grade_insert.checked = settings['qis_grade_insert'];
  checkbox_studip_insert_download.checked = settings['studip_insert_download'];
  checkbox_studip_total_video_time.checked = settings['studip_total_video_time'];
  checkbox_studip_plain_videoplayer.checked = settings['studip_plain_videoplayer'];

  add_checkbox_event_listeners()

}

async function set_global_status_dot() {
  //set global status dot based on URL
  let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  tab = tabs[0];
  let on_qis = regex_qis_global.test(tab.url);
  let on_studip = regex_studip_global.test(tab.url);
  if (on_qis || on_studip) {
    global_status_dot.classList.add("status-dot-active");
    global_status_text.style.display = "none";
  }
}

function add_checkbox_event_listeners() {
  let checkboxes = document.getElementsByTagName("input");
  for (let checkbox of checkboxes) {
    checkbox.addEventListener("change", handle_checkbox_change)
  }
}

async function handle_checkbox_change(event) {
  console.log("change")
  let id = this.id
  let is_active = this.checked;
  if (is_active) {
    //call content script functions
    let on_qis = regex_qis.test(tab.url)
    if (on_qis) {
      chrome.tabs.sendMessage(tab.id, { function: "mainQISCalculator" });
    }

    let on_studip = regex_studip.test(tab.url)
    if (on_studip) {
      //call function based on elements id
      switch (id) {
        case "studip_insert_download":
          chrome.tabs.sendMessage(tab.id, { function: "insertDownloadButton" });
          break;
        case "studip_total_video_time":
          chrome.tabs.sendMessage(tab.id, { function: "insert_video_duration" });
          break;
        case "studip_plain_videoplayer":
          chrome.tabs.sendMessage(tab.id, { function: "plain_video_player" });
          break;
      }
    }
  }
  let setting = {}
  setting[id] = is_active
  //set storage with the same name as the id of the element
  await chrome.storage.sync.set(setting);
  let settings = await chrome.storage.sync.get(null);
  console.log(JSON.stringify(settings, null, 2))
}
/* 
checkbox_qis_grade_insert.addEventListener("change", async function () {
  let active = this.checked;
  if (this.checked) {
    let on_qis = regex_qis.test(tab.url)
    if(on_qis) {
      chrome.tabs.sendMessage(tab.id, { function: "mainQISCalculator" });
    }
  }
  chrome.storage.sync.set({ 'qis_auto': active });
})

checkbox_studip_insert_download.addEventListener("change", async function () {
  let active = this.checked;
  if (active) {
    let on_studip = regex_studip.test(tab.url)
    if(on_studip) {
      chrome.tabs.sendMessage(tab.id, { function: "insertDownloadButton" });
    }
  }
  chrome.storage.sync.set({ 'studip_auto': active });
}) */


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
    chrome.scripting.executeScript({ target: { tabId: tab.id }, func: roll })
  }
});

function roll() {

  //const url_image = "https://imgl.krone.at/scaled/2347804/v0780ce/full.jpg"
  const url_image = "https://media.tenor.com/yheo1GGu3FwAAAAM/rick-roll-rick-ashley.gif"
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
  setInterval((rolling), 2000);
  setInterval((color_roll), 3000);

  async function rolling() {
    let images = document.getElementsByTagName("img");
    for (let image of images) {
      image.src = url_image;
    }
  }

  async function color_roll() {
    let elements = document.getElementsByTagName("*")
    for (let ele of elements) {
      ele.style.color = getRandomColor()
      //ele.style.backgroundColor = getRandomColor()
    }
  }
}





