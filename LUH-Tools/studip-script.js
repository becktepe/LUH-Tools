window.onload = async function () {
    console.log("Stud.IP-Script Inserted")

    let settings = await chrome.storage.sync.get(null);

    if (videoplayer_present()) {
        console.log("Videoplayer found")
        // Read if this modifications should be done immediately 
        if (settings.hasOwnProperty('studip_insert_download') && settings['studip_insert_download']) {
            insertDownloadButton()
        }
        if (settings.hasOwnProperty('studip_plain_videoplayer') && settings['studip_plain_videoplayer']) {
            strip_flowcast()
        }
        
    } else {
        //if mediaplayer is not present user is at the summary page
        insert_collection_duration()
    }
    chrome.runtime.onMessage.addListener(message_handler);
}

function videoplayer_present() {
    return document.getElementById("mediaplayer") != undefined
}

function message_handler(request, sender, sendResponse) {
    if (request.function === "insertDownloadButton") {
        insertDownloadButton();
    }
    if (request.function === "insert_video_duration") {
        insertDownloadButton();
    }
    if (request.function === "plain_video_player") {
        strip_flowcast();
    }
}

function script_already_executed() {
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

function strip_flowcast() {
    console.log("stripping")
    //grab and modify url from video element
    let video_element = document.getElementById("mediaplayer")
    video_element.setAttribute("controls", "controls")
    video_element.removeAttribute("disablepictureinpicture")

    //remove 10sec jumpers
    let jumpers = document.getElementsByClassName("jumper")
    while (jumpers.length > 0) {
        jumpers[0].remove()
    }
    document.getElementById("toolbar-panel").remove()
}

function insertDownloadButton() {
    //video player is not present -> do nothing
    if(!videoplayer_present()) return

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

function fold_time(time_tuple) {
    //[12, 615, 839] ->
    time_tuple[1] += Math.floor(time_tuple[2] / 60)
    time_tuple[2] %= 60
    time_tuple[0] += Math.floor(time_tuple[1] / 60)
    time_tuple[1] %= 60
    return time_tuple
}

function insert_collection_duration() {
    //video player is present -> this is not the summary page -> do nothing
    if(videoplayer_present()) return

    // calculates total video collection duration
    let video_durations = document.getElementsByClassName("media-table-duration")
    let total_time = [0, 0, 0] //hours, minutes, seconds

    //for each duration elements, split the time string and add it up
    for (let duration of video_durations) {
        let time = duration.innerText.split(":")
        for (let i = 0; i < 3; i++) {
            total_time[i] += parseInt(time[i], 10)
        }
    }
    total_time = fold_time(total_time)

    // get language of site and change text corresponding
    let name = undefined
    if(document.documentElement.lang == "de-DE") {
        name = "Gesamtlaufzeit der Videos"
    } else {
        name = "Total video runtime"
    }

    let sidebar_template =
    `
    <div class="sidebar-widget">
        <div class="sidebar-widget-header">Extra</div>
        <div class="sidebar-widget-content">
            <ul class="widget-list widget-links" aria-label="Aktionen">
                <li style="background-image:url(https://studip.uni-hannover.de/assets/images/icons/blue/video2.svg);background-size:16px 16px;">
                ${name} ${total_time[0]}:${total_time[1]}:${total_time[2]}
                </li>
            </ul>
        </div>
    </div>
    `
    let sidebar = document.querySelector("#layout-sidebar > section").innerHTML += sidebar_template;
}