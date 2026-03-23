let activeTimeout = null;
let nextEpisodeUrl = null;

async function getNextEpisodeUrl() {
    const iframe = document.querySelector('iframe');
    if (!iframe) return null;

    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const nextBtn = iframeDoc.querySelector('a.next-episode, a[href*="next"], button.next-episode, button[data-next]');
        
        if (nextBtn && nextBtn.href) {
            return nextBtn.href;
        }
        return null;
    } catch (e) {
        console.log("Could not access iframe:", e);
        return null;
    }
}

async function saveNextEpisodeUrl() {
    nextEpisodeUrl = await getNextEpisodeUrl();
    if (nextEpisodeUrl) {
        console.log("Next episode URL saved:", nextEpisodeUrl);
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