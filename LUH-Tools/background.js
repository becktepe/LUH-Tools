/* chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    console.log("Received download request");
    console.log(msg)
    
    download_video_collection(msg)
}); */

chrome.runtime.onMessage.addListener(message_handler);

function message_handler(request, sender, sendResponse) {
    if (request.function === "download_collection") {
        download_media_collection(request.argument);
    }
    if (request.function === "download_video") {
        download_video(request.url, request.title);
    }
    if (request.function === "url_reachable") {
        console.log("testing url..." + request.url);
        url_reachable(request.url).then( (response) => {
            console.log("url valid: " + response.valid);
            sendResponse(response);
        });
        return true;
    }
    if(request.function === "cancel_downloads") {
        console.log("cancel all downloads");
        cancel_all_downloads();
    }
}

function sanitize_filename_name(string) {
    string = string.trim();
    string = string.replace(/[^a-z0-9-_,. &()äöüß]/gi, '');
    return string;
}

function sanitize_folder_name(string) {
    string = string.trim();
    string = string.replaceAll(":", "").replaceAll(" ", "_");
    string = string.replaceAll("/", "-").replaceAll("&", "-");
    string = string.replace(/[^a-z0-9-_äöüß]/gi, '');
    return string;
}

let download_list = []
let download_ok = true;

async function download_media_collection(media_collection) {
    download_ok = true;
    let folder_name = sanitize_folder_name(media_collection.course_title);
    console.log("Downloading: " + folder_name);
    for(let video of media_collection.videos) {
        let video_title = sanitize_filename_name(video.title);
        //download_video(video.url, `Übung_Übung_Logik_und_Formale_Systeme/${video.title}.mp4`);
        let downloadId = await chrome.downloads.download(
            {"url": video.download_urls[0], 
            "filename": `${folder_name}/${video_title}.mp4`}
        )
        download_list.push(downloadId)
        if(!download_ok) {
            //clear list again
            cancel_all_downloads();
            break;
        }
    }
}

async function download_video(url, filename) {
    filename = sanitize_filename_name(filename)
    await chrome.downloads.download(
        {"url": url, "filename": `${filename}.mp4` },
        (downloadId) => {
            download_list.push(downloadId)
        }
    )
}

function cancel_all_downloads() {
    download_ok = false;
    for(let downloadId of download_list) {
        console.log("cancelling downloadID: " + downloadId)
        chrome.downloads.cancel(downloadId)
    }
    download_list = []
}

function url_reachable(url) {
    //Test if the token in the link is valid.
    //if the token is valid the website will return code 200
    //return true if website returns 200
    return new Promise(async (resolve, reject) => {
        let response = await fetch(url, {method: 'GET'});
        //console.log("token valid: " + response.ok);
        resolve({"valid": response.ok});
    });
}