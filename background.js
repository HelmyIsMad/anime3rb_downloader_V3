// 1. MUST be at the top level to wake up the service worker
chrome.downloads.onChanged.addListener((delta) => {
    // We only care about the 'complete' state
    if (delta.state && delta.state.current === "complete") {
        console.log("Download finished. Checking automation status...");

        // 2. Check storage to see if we should actually do anything
        chrome.storage.local.get("isAutoRunning", (data) => {
            if (data.isAutoRunning) {
                // 3. Find the anime tab by URL instead of relying on a saved ID
                chrome.tabs.query({ url: "*://anime3rb.com/episode/*" }, (tabs) => {
                    if (tabs.length > 0) {
                        // Send message to the first matching tab found
                        chrome.tabs.sendMessage(tabs[0].id, { action: "download_complete" }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.log("Tab found but not responding. Is it still loading?");
                            }
                        });
                    } else {
                        console.log("No active anime episodes found. Stopping.");
                        chrome.storage.local.set({ isAutoRunning: false });
                    }
                });
            }
        });
    }
});

// Listener for the content script to signal a start
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "watch_download") {
        sendResponse({ status: "confirmed" });
    }
    return true; 
});