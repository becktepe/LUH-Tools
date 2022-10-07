let color = '#3aa757';

/* chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  console.log('Default background color set to %cgreen', `color: ${color}`);
}); */


/* chrome.tabs.onActivated.addListener(getURL);

async function getURL() {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        let url = tabs[0].url;
        // use `url` here inside the callback because it's asynchronous!
        chrome.storage.sync.set({ url });
        console.log(url)
    });
}
*/
//var urlRegex = /^https?:\/\/qis\.verwaltung\.uni-hannover\.de.*/;

//chrome.action.onClicked.addListener(function (tab) {
//  // ...check the URL of the active tab against our pattern and...
//  if (urlRegex.test(tab.url)) {
//      // ...if it matches, send a message specifying a callback too
//      chrome.tabs.sendMessage(tab.id, {text: 'report_back'}, doStuffWithDom);
///  }
//  
//}); 

//chrome.tabs.onActivated.addListener(function(activeInfo) {
//  console.log(activeInfo.tabId);
//});

var studip_regex = "/^https?:\/\/studip\.uni-hannover\.de\/plugins\.php\/flowcastsplugin\/media\/player\/.*/";

const filter = {
  url: [
    {
      urlMatches: "^https://studip\.uni-hannover\.de/plugins.php/flowcastsplugin/media/player/.*",
      //urlMatches: "^https\:\/\/studip\.uni-hannover\.de//plugins.php/.*",
    },
  ],
};

chrome.webNavigation.onCompleted.addListener(() => {
  console.info("You are seeing a StudIP video player!");

}, filter);
