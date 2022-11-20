let media_collection = null;

//event listener doesn't work somehow
window.onload = async function main () {
    //console.log("Stud.IP-Script Inserted")
    let settings = await chrome.storage.sync.get(null);

    if(videoplayer_present()) {
        //always grab the token of a video player and save it
        save_token_of_video();
        if (settings.hasOwnProperty('studip_insert_download') && settings['studip_insert_download']) {
            insertDownloadButton();
        }
        if (settings.hasOwnProperty('studip_plain_videoplayer') && settings['studip_plain_videoplayer']) {
            strip_flowcast();
        }
    }else {
        //if in summary page then prepare the media collection
        await prepare_media_collection();
        console.log(media_collection);
        // Read if the modifications should be done
        if (settings.hasOwnProperty('studip_insert_download') && settings['studip_insert_download']) {
            insert_collection_duration();
            insert_download_all_button();
        }
    }
    
    
    chrome.runtime.onMessage.addListener(message_handler);
    //test();
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

function videoplayer_present() {
    return document.getElementById("mediaplayer") != undefined
}


//#region Insert Download Button

function download_button_present() {
    // check if download_btn is present
    //dom selection
    let sidebar_actions = document.getElementById("sidebar-actions")

    //stop if download buttons are already there
    return sidebar_actions.innerText.includes("Download")
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
    
    //select sidebar
    let sidebar_list = document.querySelector("#sidebar-actions > div > ul")

    if(download_button_present()){
        //if download button is present then modify it
        for (let child of sidebar_list.children) {
            //grab the link element of the li tags
            let a_tag = child.children[0]

            //if the link contains the "Download" add event listener
            if(a_tag.innerText.includes("Download")) {
                a_tag.addEventListener("click", download_on_click)
            }
        }
        return; 
    }

    //grab download links from videodata element
    let video_sources = document.getElementById("videodata").getAttribute("data-sources")
    let sources = JSON.parse(video_sources)
    /* download_links format
    {
        "src": "https://flowcasts.uni-hannover.de/nodes/xxx/res1080.mp4?token=xxx",
        "type": "video/mp4",
        "label": "1080p"
    }
    */
    for(let source of sources) {
        let list_element = createDownloadLinkElement(`Download: ${source.label}`, source.src)
        sidebar_list.appendChild(list_element)
    }
}
//#endregion


//#region Total video collection duration
function fold_time(tt) {
    //folds time tuple 
    //[HH, MM, SS]
    //[13, 632, 853] -> [23, 46, 13]
    tt[1] += Math.floor(tt[2] / 60)
    tt[0] += Math.floor(tt[1] / 60)
    return [tt[0], tt[1] % 60, tt[2] % 60]
}

async function insert_collection_duration() {
    //video player is present -> this is not the summary page -> do nothing
    if(videoplayer_present()) return;

    // calculates total video collection duration
    let video_durations = [...document.getElementsByClassName("media-table-duration")].map((element)=> 
        element.innerText.split(":").map((time)=> parseInt(time, 10))
    );
    let total_time = video_durations.reduce((prev, current) => 
        prev.map((num, idx)=>num + current[idx])
        ,[0,0,0]
    );

    total_time = fold_time(total_time);
    total_time = total_time.map(number => {return number.toString().padStart(2, "0")})

    
    let name = chrome.i18n.getMessage("total_runtime")

    let sidebar_template =
    `
    <div class="sidebar-widget">
        <div class="sidebar-widget-header">Extra</div>
        <div class="sidebar-widget-content">
            <ul class="widget-list widget-links" aria-label="Aktionen" id="extra-action-list">
                <li style="background-image:url(https://studip.uni-hannover.de/assets/images/icons/blue/video2.svg);background-size:16px 16px;">
                ${name}: ${total_time[0]}:${total_time[1]}:${total_time[2]}
                </li>
            </ul>
        </div>
    </div>
    `;
    let sidebar = document.querySelector("#layout-sidebar > section").innerHTML += sidebar_template;
}
//#endregion


//#region Download-all Button
/**
 * Grabs the media table parses it and if required generates the download links
 */
async function prepare_media_collection() {
    media_collection = parse_media_table();
    if(media_collection === null){
        throw "media_collection === null, this shouldn't happen!"
    }
    if(media_collection.videos === null){
        //TODO: do something if no videos were found
        return;
    } 
    if(media_collection.videos.reduce((prev, cur) => prev || cur.download_urls.length === 0, false)) {
        //at least one video doesn't have a download link 
        console.log("found at least one video without a download link")
        generate_download_links(media_collection)
    }
}

/**
 * Parses the html media table to an js object
 */
function parse_media_table() {
    //video player is present -> this is not the summary page -> do nothing
    if(videoplayer_present()) return;

    let media_collection = {
        course_title: null,
        videos: null,
        flowcast_token: null
    }

    media_collection.course_title = document.getElementById("layout_context_title").innerText

    let rows = [...document.querySelectorAll(".media-table-row")] //[...x] spread operator: HTMLcollection -> array
    let video_collection = rows.map((row) => {
        let video = {
            title: null,
            id: null,
            studip_url: null,
            download_urls: [],
        };
        video.title = row.querySelector(".media-table-infos").innerText;
        video.id = row.id;
        let links = [...row.querySelectorAll(".action-menu-item > a")].map((ele) =>{ return ele.href});
        for(let link of links) {
            if(link.includes("flowcastsplugin/media/player/")) {
                //video link
                video.studip_url = link;
            }else if(link.includes("flowcasts.uni-hannover.de/nodes/")) {
                //download link
                video.download_urls.push(link);
                if(media_collection.flowcast_token == null) {
                    //save the token only once
                    const token_regex = /(?<=token=).*$/;
                    media_collection.flowcast_token = link.match(token_regex)[0];
                }
            }
        }
        if(media_collection.flowcast_token != null) {
            //save the newly found token
            chrome.storage.sync.set({'flowcast_token': media_collection.flowcast_token}); 
        }
        return video;
    });
    media_collection.videos = video_collection.reverse();
    return media_collection;
}

/**
 * Generates download links with the token and the video id of each video
 * and saves them in the media collection
 * 
 * You could also fetch each video studip side and grab the download links from
 * there but we don't want to fetch that often 
 * 
 * WARNING: the used method may lead to a problem if the video is no available in 720p because it only generates the 720p version download link
 */
async function generate_download_links(media_collection) {

    if(media_collection === null || media_collection.videos === null) {
        console.log("generate_download_links: collection === null");
        return;
    }

    console.log("generating download links ...")
    if(media_collection.flowcast_token === null) {
        console.log("No token found in media_collection")
        //no token found in media collection
        //therefore get one from settings
        let storage = await chrome.storage.sync.get(['flowcast_token']);
        let token = storage.flowcast_token

        //validate the flowcast token
        //test if any video id is valid with the token found in settings
        let first_video_id = media_collection.videos[0].id
        let test_url = `https://flowcasts.uni-hannover.de/nodes/${first_video_id}/res0720.mp4?token=${token}`
        let response = await chrome.runtime.sendMessage({"function": "url_reachable", "url": test_url})

        if(response.valid) {
            //token is valid -> set media_collections token to the token
            console.log("token is valid")
            media_collection.flowcast_token = token;
        }else{
            //token is not valid -> fetch a new one by opening a video with fetch
            console.log("token is not valid")
            let token = null;
            token = await fetch_token(media_collection);
            if(token === null) {
                //TODO do something if token fetching did not work
                throw "while fetching a token something went wrong..."
            }else {
                media_collection.flowcast_token = token;
            }
        }
    }

    console.log("using token: " + media_collection.flowcast_token);
    //generate the 720p download link version of each video
    for(video of media_collection.videos) {
        if(video.download_urls.length > 0){
            //pop the links with quality other than 720p
            video.download_urls = video.download_urls.filter((url)=> {
                return url.includes("res0720")
            })
        }else {
            video.download_urls.push(
                `https://flowcasts.uni-hannover.de/nodes/${video.id}/res0720.mp4?token=${media_collection.flowcast_token}`
            )
        }

    } 
}

/**
 * Inserts download all Button.
 * 
 */
async function insert_download_all_button() {
    //video player is present -> this is not the summary page -> do nothing
    if(videoplayer_present()) return;
    
    if(media_collection.videos === null) {
        //no videos found to download
        return;
    }

    let extra_list = document.getElementById("extra-action-list");
    let text = chrome.i18n.getMessage("download_all_720")
    //show download all button
    let li_template =
    `
    <li style="background-image:url(https://studip.uni-hannover.de/assets/images/icons/blue/download.svg);background-size:16px 16px;">
        <a id="download-all" href="#">${text}</a>
    </li>
    `;
    extra_list.innerHTML += li_template;
    document.getElementById("download-all").addEventListener("click", download_all_videos);

}


async function download_all_videos() {
    document.getElementById("download-all").remove()

    console.log("downloading the collection");
    chrome.runtime.sendMessage({"function": "download_collection" ,"argument": media_collection});

    insert_cancel_download_button();
}

function insert_cancel_download_button() {
    let extra_list = document.getElementById("extra-action-list");
   
    //show download all button
    let li_template =
    `
    <li style="background-image:url(https://studip.uni-hannover.de/assets/images/icons/blue/decline/download.svg);background-size:16px 16px;">
        <a id="cancel-download" href="#">Cancel download ...</a>
    </li>
    `;
    extra_list.innerHTML += li_template;
    document.getElementById("cancel-download").addEventListener("click", cancel_all_downloads);
}

async function cancel_all_downloads() {
    document.getElementById("cancel-download").remove()

    console.log("cancel all download");
    chrome.runtime.sendMessage({"function": "cancel_downloads"});

    insert_download_all_button()
}

/**
 * If the media player is present this function grabs the token from it 
 * and saves it in the settings
 * @returns 
 */
function save_token_of_video() {
    //grabs the token from the videoplayer
    if(!videoplayer_present()) return; //video player is not present -> do nothing
    let url = document.getElementById("mediaplayer").src;
    const token_regex = /(?<=token=).*$/;
    let token = url.match(token_regex)[0];
    chrome.storage.sync.set({'flowcast_token': token}); 
}


/**
 * fetches a new token from a studip video of the collection and saves it in the media collection and settings
 * @param {*} media_collection 
 * @returns flowcast_token
 */
async function fetch_token(media_collection) {
    /* grab a token from a video
    1. selected a video and fetch the studip video url
    2. see if the response url is the media/player if not go back to 1 and take the next video
    3. parse the response to html and grab the token from the videodata div attribute "data-sources"
    5. save the token in local storage for next time
    */
    let token = null;
    console.log("fetching new token")
    for(let video of media_collection.videos) {
        token = await fetch(video.studip_url, {method: 'GET'}).then( (response) => {
            //if response url doesn't match flowcastsplugin/media/player/ then the video and therefore token isn't available
            if(!response.url.includes("flowcastsplugin/media/player/")) {
                throw "No player was found at url"
            }else {
                console.log(response)
                return response.text()
            }
            //"https://studip.uni-hannover.de/plugins.php/flowcastsplugin/media/player/*"
            
        }).then((text) => {
            //convert response text to html doc
            var parser = new DOMParser();
            var doc = parser.parseFromString(text, 'text/html');
            
            //grab video source
            let video_data = doc.getElementById("videodata")
            if(video_data == null) {
                throw "videodata element not found"
            }
            let sources = JSON.parse(video_data.getAttribute("data-sources"))
            /* thats how on element of the data-sources looks like
            {
                "src": "https://flowcasts.uni-hannover.de/nodes/xx/res0720.mp4?token=xxx",
                "type": "video/mp4",
                "label": "720p"
            }
            */
            let source_url = sources[0].src
            const token_regex = /(?<=token=).*$/;
            let token = source_url.match(token_regex)[0];
            console.log("new token: " + token)

            //save token in local storage
            chrome.storage.sync.set({'flowcast_token': token}); 

            return token;
        }).catch((msg) => {
            //request next video url, if there is an cache error
            //see "https://studip.uni-hannover.de/plugins.php/flowcastsplugin/media/player/mrolN0?cid=80637f73935fb348bde27b0deedf24e6"
            console.log(msg)
            return null;
        })
        if(token != null) {
            break
        }else {
            console.log("retry")
        }
    } 
    if(token === null) {
        console.log("No reachable studip video found...");
        return null;
    }
    return token;
}
//#endregion


//#region Plain Video Player
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
//#endregion