/* chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    console.log("Received download request");
    console.log(msg)
    
    download_video_collection(msg)
}); */

chrome.runtime.onMessage.addListener(message_handler);

function message_handler(request, sender, sendResponse) {
    if (request.function === "download_collection") {
        download_video_collection(request.collection);
    }
    if (request.function === "download_video") {
        download_video(request.url, request.title);
    }
    if (request.function === "validate_token") {
        console.log("validating token...");
        validate_token(request.url).then( (response) => {
            console.log("token valid: " + response.valid);
            //console.log("waited");
            sendResponse(response);
        });
        return true;
    }
}

function sanitize_filename_name(string) {
    string = string.trim();
    string = string.replace(/[^a-z0-9-_,. &()äöü]/gi, '');
    return string;
}

function sanitize_folder_name(string) {
    string = string.trim();
    string = string.replaceAll(":", "").replaceAll(" ", "_");
    string = string.replaceAll("/", "-").replaceAll("&", "-");
    string = string.replace(/[^a-z0-9-_äöü]/gi, '');
    return string;
}

async function download_video_collection(collection) {
    let folder_name = sanitize_folder_name(collection.title);
    console.log(folder_name);
    let videos = collection.videos;

    if (!await validate_token(videos[0].url)) return;

    for(let video of videos) {
        let video_title = sanitize_filename_name(video.title);
        //download_video(video.url, `Übung_Übung_Logik_und_Formale_Systeme/${video.title}.mp4`);
        await chrome.downloads.download(
            {"url": video.url, 
            "filename": `${folder_name}/${video_title}.mp4` }
        )
    }
}

async function download_video(url, filename) {
    filename = sanitize_filename_name(filename)
    await chrome.downloads.download(
        {"url": url, "filename": `${filename}.mp4` }
    )
}

function validate_token(url) {
    //Test if the token in the link is valid.
    //if the token is valid the website will return code 200
    //return true if website returns 200
    return new Promise(async (resolve, reject) => {
        let response = await fetch(url, {method: 'GET'});
        //console.log("token valid: " + response.ok);
        resolve({"valid": response.ok});
    });
}