//event listener doesnt work somehow
window.onload = async function () {
    //console.log("Stud.IP-Script Inserted")
    let settings = await chrome.storage.sync.get(null);

    // Read if this modifications should be done immediately 
    if (settings.hasOwnProperty('studip_insert_download') && settings['studip_insert_download']) {
        insertDownloadButton();
        insert_collection_duration();
        insert_download_all_button();
    }
    if (settings.hasOwnProperty('studip_plain_videoplayer') && settings['studip_plain_videoplayer']) {
        strip_flowcast();
    }
    let token = grab_token();
    await chrome.storage.sync.set({'token': token});
    //test_token()
    
    chrome.runtime.onMessage.addListener(message_handler);
}

function videoplayer_present() {
    return document.getElementById("mediaplayer") != undefined
}

function message_handler(request, sender, sendResponse) {
    if (request.function === "insertDownloadButton") {
        insertDownloadButton();
        insert_collection_duration();
        insert_download_all_button();
    }
    if (request.function === "plain_video_player") {
        strip_flowcast();
    }
    
}

//############################
//## Insert Download Button ##
//############################
function download_button_present() {
    // check if download_btn is present
    //dom selection
    let sidebar_actions = document.getElementById("sidebar-actions")

    //stop if download buttons are already there
    return sidebar_actions.innerText.includes("Download")
}

function get_video_url() {
    //grab url from video element
    let video_element = document.getElementById("mediaplayer")
    return video_element.src
}

function createDownloadLinkElement(text, url) {
    const download_image_url = "background-image:url(https://studip.uni-hannover.de/assets/images/icons/blue/download.svg);background-size:16px 16px;"
    let list_element = document.createElement('li')
    list_element.style = download_image_url
    let link = document.createElement('a')
    link.href = url
    link.innerText = text
    link.addEventListener("click", download_on_click)
    list_element.appendChild(link)
    return list_element
}

function download_on_click(event) {
    //replace the href download and instead use the chrome download api
    //this allows to change the title

    //prevent onclick download
    event.preventDefault();

    let video_title = document.querySelector("#layout_content > h2").innerText.slice(2)
    let url = this.href
    chrome.runtime.sendMessage({
        "function": "download_video",
        "url": url,
        "title": video_title
    });
    return false;
}

function insertDownloadButton() {
    if(!videoplayer_present()) return; //video player is not present -> do nothing

    //dom selection
    let sidebar_actions = document.getElementById("sidebar-actions")
    let sidebar_actions_list = sidebar_actions.children[1].children[0]

    if(download_button_present()){
        //if download button is present then modify it
        for (let child of sidebar_actions_list.children) {
            //grab the link element of the li tags
            let a_tag = child.children[0]

            //if the link contains the download add event listener
            if(a_tag.innerText.includes("Download")) {
                a_tag.addEventListener("click", download_on_click)
            }
        }
        return; 
    } 


    //stop if download buttons are already there
    if (sidebar_actions.innerText.includes("Download")) return

    //grab url from video element
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

//#####################################
//## Total video collection duration ##
//#####################################
function fold_time(tt) {
    //folds time tuple 
    //[HH, MM, SS]
    //[13, 632, 853] -> [23, 46, 13]
    tt[1] += Math.floor(tt[2] / 60)
    tt[0] += Math.floor(tt[1] / 60)
    return [tt[0], tt[1] % 60, tt[2] % 60]
}

function insert_collection_duration() {
    //video player is present -> this is not the summary page -> do nothing
    if(videoplayer_present()) return;

    // calculates total video collection duration
    let video_durations = document.getElementsByClassName("media-table-duration");
    let total_time = [0, 0, 0]; //hours, minutes, seconds

    //for each duration elements, split the time string and add it up
    for (let duration of video_durations) {
        let time = duration.innerText.split(":");
        for (let i = 0; i < 3; i++) {
            total_time[i] += parseInt(time[i], 10);
        }
    }
    total_time = fold_time(total_time);

    // get language of site and change text corresponding
    let name = undefined;
    if(document.documentElement.lang == "de-DE") {
        name = "Gesamtlaufzeit der Videos";
    } else {
        name = "Total video runtime";
    }

    let sidebar_template =
    `
    <div class="sidebar-widget">
        <div class="sidebar-widget-header">Extra</div>
        <div class="sidebar-widget-content">
            <ul class="widget-list widget-links" aria-label="Aktionen" id="extra-action-list">
                <li style="background-image:url(https://studip.uni-hannover.de/assets/images/icons/blue/video2.svg);background-size:16px 16px;">
                ${name} ${total_time[0]}:${total_time[1]}:${total_time[2]}
                </li>
            </ul>
        </div>
    </div>
    `;
    let sidebar = document.querySelector("#layout-sidebar > section").innerHTML += sidebar_template;
}

//########################
//## Download-all Button##
//########################
async function insert_download_all_button() {
    //video player is present -> this is not the summary page -> do nothing
    if(videoplayer_present()) return;

    let first_url = await get_test_video_url();
    let res = await chrome.runtime.sendMessage({"function": "validate_token", "url": first_url});

    let extra_list = document.getElementById("extra-action-list");
    if(res.valid) {
        //show download all button
        let li_template =
        `
        <li  style="background-image:url(https://studip.uni-hannover.de/assets/images/icons/blue/download.svg);background-size:16px 16px;">
            <a id="download-all-button" href="#">Download all Videos (720p)</a>
        </li>
        `;
        extra_list.innerHTML += li_template;
        document.getElementById("download-all-button").addEventListener("click", download_all_videos);
    }else {
        //show error message if token isn't valid
        let error_message = "Download all isn't available. Please open a video and come back!"
        let li_template =
        `
        <li  style="background-image:url(https://studip.uni-hannover.de/assets/images/icons/blue/exclaim.svg);background-size:16px 16px;">
            ${error_message}
        </li>
        `;
        extra_list.innerHTML += li_template;
    }
    
}

async function download_all_videos() {
    //console.log("download");
    let collection = await get_video_collection();
    //console.log(collection);
    chrome.runtime.sendMessage({"function": "download_collection" ,"collection":collection});
}

function grab_token() {
    //grabs the token from the videoplayer
    if(!videoplayer_present()) return; //video player is not present -> do nothing
    let url = get_video_url();
    const token_regex = /(?<=token=).*$/;
    let token = url.match(token_regex)[0];
    //console.log(token);
    return token;
}


async function get_test_video_url() {
    //grabs first url to test the token
    let storage = await chrome.storage.sync.get(['token']);
    let token = storage['token'];

    let first_row = document.getElementsByClassName("media-table-row")[0];
    let node = first_row.id;
    let url = `https://flowcasts.uni-hannover.de/nodes/${node}/res0720.mp4?token=${token}`
    return url;
}

async function get_video_collection() {
    //returns video collection
    /* format:
    {
        "title":<course_title>,
        "videos": [
            {"title": <video_title>, "url": <url>},
            ...
        ]
    }
    */
    let storage = await chrome.storage.sync.get(['token']);
    let token = storage['token'];
    let course_title = document.querySelector("#layout_context_title").innerText;
    let video_table = document.getElementsByClassName("media-table-row");
    let video = [];
    for(let item of video_table) {
        let title = item.querySelector("td:nth-child(2) > div > div:nth-child(1) > a").innerText;
        let node = item.id;
        let url = `https://flowcasts.uni-hannover.de/nodes/${node}/res0720.mp4?token=${token}`;
        item = {"title": title, "url": url};
        video.push(item);
    }
    
    return {"title": course_title, "videos": video.reverse()};
}

//########################
//## Plain Video Player ##
//########################
function strip_flowcast() {
    if(!videoplayer_present()) return; //video player is not present -> do nothing
    
    let video_element = document.getElementById("mediaplayer");
    let parent_node = video_element.parentNode;

    //create new Videoelement without event listeners
    let new_video = document.createElement("video");
    new_video.src = video_element.src;
    new_video.id = "mediaplayer";
    new_video.setAttribute("controls", "controls");
    new_video.setAttribute("controls", "controls");

    parent_node.appendChild(new_video);

    //remove old video element
    video_element.remove();

    //remove 10sec jumpers
    let jumpers = document.getElementsByClassName("jumper");
    while (jumpers.length > 0) {
        jumpers[0].remove();
    }
    document.getElementById("toolbar-panel").remove();
}