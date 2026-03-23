// Status Check
const statusEl = document.getElementById('status');
chrome.storage.local.get("isAutoRunning", (data) => {
  if (data.isAutoRunning) {
    statusEl.textContent = "Status: Active";
    statusEl.className = "active";
  } else {
    statusEl.textContent = "Status: Inactive";
    statusEl.className = "inactive";
  }
});

// Start Logic
document.getElementById('startBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes('anime3rb.com/episode')) {
    alert('Please navigate to an anime episode page first.');
    return;
  }
  
  await chrome.storage.local.set({ isAutoRunning: true });
  try {
    await chrome.tabs.sendMessage(tab.id, { action: "manual_start" });
  } catch (e) {
    alert('Could not connect to the page. Try refreshing the tab.');
    await chrome.storage.local.set({ isAutoRunning: false });
    return;
  }
  window.close();
});

// Stop Logic
document.getElementById('stopBtn').addEventListener('click', async () => {
  await chrome.storage.local.set({ isAutoRunning: false });
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.url.includes('anime3rb.com/episode')) {
    try {
      await chrome.tabs.sendMessage(tab.id, { action: "stop_now" });
    } catch (e) {
      console.log("Could not connect to tab to stop.");
    }
  }
  window.close();
});