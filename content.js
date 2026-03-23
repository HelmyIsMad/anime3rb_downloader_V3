let activeTimeout = null;
let nextEpisodeUrl = null;
let finalEpisodeNum = null;

function getFinalEpisodeNum() {
    const episodeList = document.querySelector('div.video-data').parentNode.parentNode;
    if (!episodeList) return null;
    
    const links = episodeList.querySelectorAll('a');
    if (links.length === 0) return null;
    
    const lastLink = links[links.length - 1];
    const hrefParts = lastLink.href.split('/');
    const epNum = parseInt(hrefParts.pop());
    
    if (!isNaN(epNum)) {
        console.log("Final episode number:", epNum);
        return epNum;
    }
    return null;
}

async function saveNextEpisodeUrl() {
    finalEpisodeNum = getFinalEpisodeNum();
    if (finalEpisodeNum) {
        const currentUrlParts = window.location.href.split('/');
        const currentEpNum = parseInt(currentUrlParts.pop());
        
        if (!isNaN(currentEpNum) && currentEpNum < finalEpisodeNum) {
            nextEpisodeUrl = currentUrlParts.join('/') + '/' + (currentEpNum + 1);
            console.log("Next episode URL:", nextEpisodeUrl);
        } else {
            console.log("Already at final episode.");
            nextEpisodeUrl = null;
        }
    }
}

function cleanPage() {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(frame => frame.remove());
    if (iframes.length > 0) console.log(`Cleaned ${iframes.length} iframes.`);
}

async function startAutomation() {
    await saveNextEpisodeUrl();
    cleanPage();

    const downloadBtnHolder = document.querySelector('div.flex-grow.flex.flex-wrap.gap-4.justify-center'); 
    if (!downloadBtnHolder) {
        chrome.storage.local.set({ isAutoRunning: false });
        return;
    }

    const downloadLinks = downloadBtnHolder.querySelectorAll('a');
    const downloadBtn = downloadLinks[downloadLinks.length - 1];

    if (downloadBtn) {
        console.log("Target found. Clicking in 3s...");
        downloadBtn.target = "";
        activeTimeout = setTimeout(() => {
            downloadBtn.click();
            chrome.runtime.sendMessage({ action: "watch_download" }, () => {
                if (chrome.runtime.lastError) return;
            });
        }, 3000);
    } else {
        chrome.storage.local.set({ isAutoRunning: false });
    }
}

// Initial Check
chrome.storage.local.get("isAutoRunning", (data) => {
    if (data.isAutoRunning) {
        if (document.readyState === "complete") startAutomation();
        else window.addEventListener('load', startAutomation);
    }
});

// Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "manual_start") {
        startAutomation();
        sendResponse({status: "ok"});
    }
    
    if (request.action === "stop_now") {
        if (activeTimeout) clearTimeout(activeTimeout);
        console.log("Automator stopped.");
        sendResponse({status: "stopped"});
    }

    if (request.action === "download_complete") {
        sendResponse({status: "ok"});
        if (nextEpisodeUrl) {
            console.log("Next episode found. Navigating...");
            window.location.href = nextEpisodeUrl;
        } else {
            console.log("No next episode button found. Stopping.");
            chrome.storage.local.set({ isAutoRunning: false });
        }
    }
    return true; 
});