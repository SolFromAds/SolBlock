chrome.runtime.onInstalled.addListener((object) => {
  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.storage.local.set({ solAddress: "" });
  }
});

// Global state variables for ad-blocking
let adBlockEnabled = false;
let totalAdsBlocked = 0;
// Object to track blocked ad counts per tab
let pageAdsBlocked = {};

// Listener function to block ad requests and update counts.
function adBlockListener(details) {
  totalAdsBlocked++;
  const tabId = details.tabId;
  if (tabId >= 0) {
    pageAdsBlocked[tabId] = (pageAdsBlocked[tabId] || 0) + 1;
  }
  // Cancel the request (thus blocking the ad)
  return { cancel: true };
}

// Function to add or remove the ad blocking listener based on toggle state.
function updateAdBlockListener() {
  if (adBlockEnabled) {
    chrome.webRequest.onBeforeRequest.addListener(
      adBlockListener,
      {
        // Adjust these URL patterns to target the ad domains you want to block.
        urls: [
          "*://*.doubleclick.net/*",
          "*://*.adservice.google.com/*",
          "*://*.ads.example.com/*"
        ]
      },
      ["blocking"]
    );
  } else {
    chrome.webRequest.onBeforeRequest.removeListener(adBlockListener);
  }
}

// Listen for messages from the popup (or other parts of the extension)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleAdblock') {
    adBlockEnabled = !adBlockEnabled;
    updateAdBlockListener();
    sendResponse({ enabled: adBlockEnabled });
  } else if (message.action === 'getAdCounts') {
    const tabId = sender.tab ? sender.tab.id : null;
    const pageAds = tabId && pageAdsBlocked[tabId] ? pageAdsBlocked[tabId] : 0;
    sendResponse({ pageAds: pageAds, totalAds: totalAdsBlocked });
  }
});
