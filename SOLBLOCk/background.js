// Initialize on installation.
chrome.runtime.onInstalled.addListener((object) => {
  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.storage.local.set({ solAddress: "", lastActiveTabUrl: "" });
    // Clear any previously set dynamic rules.
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1, 2, 3]
    });
  }
});

// Global state for ad blocking.
let adBlockEnabled = false;
let totalAdsBlocked = 0;
let pageAdsBlocked = {};

// Define ad blocking rules (adjust filters as needed).
const adBlockingRules = [
  {
    id: 1,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: "doubleclick.net",
      resourceTypes: ["main_frame", "sub_frame", "script", "image", "xmlhttprequest"]
    }
  },
  {
    id: 2,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: "adservice.google.com",
      resourceTypes: ["main_frame", "sub_frame", "script", "image", "xmlhttprequest"]
    }
  },
  {
    id: 3,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: "ads.example.com",
      resourceTypes: ["main_frame", "sub_frame", "script", "image", "xmlhttprequest"]
    }
  }
];

// Count blocked requests using onRuleMatchedDebug.
// (Requires the declarativeNetRequestFeedback permission.)
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  totalAdsBlocked++;
  const tabId = info.request.tabId;
  if (tabId >= 0) {
    pageAdsBlocked[tabId] = (pageAdsBlocked[tabId] || 0) + 1;
  }
});

// Update ad blocking rules based on the current toggle state.
function updateAdBlockRules() {
  if (adBlockEnabled) {
    return chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [],
      addRules: adBlockingRules
    });
  } else {
    return chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: adBlockingRules.map(rule => rule.id)
    });
  }
}

// Listen for messages from the popup.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleAdblock") {
    adBlockEnabled = !adBlockEnabled;
    updateAdBlockRules().then(() => {
      sendResponse({ enabled: adBlockEnabled });
    }).catch((error) => {
      console.error("Error updating dynamic rules:", error);
      sendResponse({ enabled: adBlockEnabled });
    });
    return true; // Inform Chrome that we'll respond asynchronously.
  } else if (message.action === "getAdCounts") {
    const tabId = sender.tab ? sender.tab.id : null;
    const pageAds = tabId && pageAdsBlocked[tabId] ? pageAdsBlocked[tabId] : 0;
    sendResponse({ pageAds: pageAds, totalAds: totalAdsBlocked });
  } else if (message.action === "getAdBlockState") {
    sendResponse({ enabled: adBlockEnabled });
  } else if (message.action === "getLastActiveTabUrl") {
    chrome.storage.local.get("lastActiveTabUrl", (data) => {
      sendResponse({ url: data.lastActiveTabUrl });
    });
    return true;
  }
});

// Track last active non-extension tab URL.
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url && !tab.url.startsWith("chrome-extension://")) {
      chrome.storage.local.set({ lastActiveTabUrl: tab.url });
    }
  });
});

// Also update if the active tab's URL changes.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active && tab.url && !tab.url.startsWith("chrome-extension://")) {
    chrome.storage.local.set({ lastActiveTabUrl: tab.url });
  }
});
