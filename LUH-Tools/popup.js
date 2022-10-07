// Initialize button with users's preferred color
let qis_action = document.getElementById("qis")
let qis_status_dot = document.getElementById("qis_status_dot");
let btn_qis_calculate = document.getElementById("btn_qis_calculate");
let checkbox_qis_auto = document.getElementById("qis_auto");

let studip_action = document.getElementById("studip")
let studip_status_dot = document.getElementById("studip_status_dot");
let btn_studip_insert_download = document.getElementById("btn_studip_insert");
let checkbox_studip_auto = document.getElementById("studip_auto");

const QIS_regex = /^https?:\/\/qis\.verwaltung\.uni-hannover\.de.*notenspiegelStudent&menu_open=n.*/;
const studip_regex = /^https?:\/\/studip\.uni-hannover\.de\/plugins\.php\/flowcastsplugin\/media\/player\/.*/;

//on popup open prepare it
window.onload = function () {
  //check the auto checkboxes
  chrome.storage.sync.get(['qis_auto'], function(items) {
    checkbox_qis_auto.checked = items['qis_auto']
  });
  chrome.storage.sync.get(['studip_auto'], function(items) {
    checkbox_studip_auto.checked = items['studip_auto']
  });
  
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
    let url = tabs[0].url;
    if (QIS_regex.test(url)) {
      btn_qis_calculate.disabled = false
      qis_status_dot.style.backgroundColor = "green"

      //activate or deactivate if functions was already executed
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {function: "script_already_executed"}, function(response) {
          btn_qis_calculate.disabled = response['return']
        });
      });
      
    }
    if (studip_regex.test(url)) {
      btn_studip_insert_download.disabled = false
      studip_status_dot.style.backgroundColor = "green"

      //activate or deactivate if functions was already executed
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {function: "download_btn_present"}, function(response) {
          btn_studip_insert_download.disabled = response['return']
        });
      });
    }
  });
}

// When the button is clicked, inject setPageBackgroundColor into current page
btn_qis_calculate.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, {function: "mainQISCalculator"});
  btn_qis_calculate.disabled = true
});


btn_studip_insert_download.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, {function: "insertDownloadButton"});
  btn_studip_insert_download.disabled = true
});

checkbox_studip_auto.addEventListener("change", function(){
  let active = this.checked
  chrome.storage.sync.set({'studip_auto': active}, function() {
    console.log('studip_auto is set to ' + active);
  });
})

checkbox_qis_auto.addEventListener("change", function(){
  let active = this.checked
  chrome.storage.sync.set({'qis_auto': active}, function() {
    console.log('qis_auto is set to ' + active);
  });
})




