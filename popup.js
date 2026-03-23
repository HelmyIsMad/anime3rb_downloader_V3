// Start Logic
document.getElementById('startBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.storage.local.set({ isAutoRunning: true }, () => {
      chrome.tabs.sendMessage(tab.id, { action: "manual_start" }, (response) => {
        if (chrome.runtime.lastError) {
            console.log("Content script not active yet.");
        }
      });
      window.close();
  });
});

// Stop Logic
document.getElementById('stopBtn').addEventListener('click', () => {
  chrome.storage.local.set({ isAutoRunning: false }, () => {
      console.log("Automation disabled.");
      // Optional: Send message to current tab to stop any pending timeouts
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, { action: "stop_now" });
          }
      });
      window.close();
  });
});