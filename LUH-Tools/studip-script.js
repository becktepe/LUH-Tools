window.onload = function() {
    // Read if this insert should be done immediately 
    chrome.storage.sync.get(['studip_auto'], function (items) {
        if (items['studip_auto']) {
            insertDownloadButton()
        }
    });
    chrome.runtime.onMessage.addListener(message_handler);
}

function message_handler(request, sender, sendResponse){
    if(request.function === "insertDownloadButton") {
        insertDownloadButton();
    }
}

function script_already_executed(){
    // check if download_btn is present
    //dom selection
    let sidebar_actions = document.getElementById("sidebar-actions")

    //stop if download buttons are already there
    return sidebar_actions.innerText.includes("Download")
}

const download_image_url = "background-image:url(https://studip.uni-hannover.de/assets/images/icons/blue/download.svg);background-size:16px 16px;"

function createDownloadLinkElement(text, url) {
    let list_element = document.createElement('li')
    list_element.style = download_image_url
    let link = document.createElement('a')
    link.href = url
    link.innerText = text
    list_element.appendChild(link)
    return list_element
}

function insertDownloadButton() {
    //dom selection
    let sidebar_actions = document.getElementById("sidebar-actions")
    let sidebar_actions_list = sidebar_actions.children[1].children[0]

    //stop if download buttons are already there
    if (sidebar_actions.innerText.includes("Download")) return

    //grab and modify url from video element
    let video_element = document.getElementById("mediaplayer")
    let url = video_element.getAttribute("src")

    //only insert download links for given quality and below
    //higher resolution files are not on the server
    const quality_regex = /res\d\d\d\d\.mp4/
    let original_quality = url.match(quality_regex)[0].slice(3, -4)
    let quality_list = ["0480", "0720", "1080"].filter(quality => quality <= original_quality)

    for (let quality of quality_list) {
        //modify url
        let new_url = url.replace(quality_regex, `res${quality}.mp4`)
        let list_element = createDownloadLinkElement(`Download: ${parseInt(quality, 10)}p`, new_url)
        sidebar_actions_list.appendChild(list_element)
    }
}
