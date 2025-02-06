chrome.runtime.onInstalled.addListener((object) => {
  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.storage.local.set({ solAddress: "" });
    // Clear any previously set dynamic rules.
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1, 2, 3]
    });
  }
});

// Global state variables for ad blocking and counting.
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

// Listen to onRuleMatchedDebug to count blocked requests.
// (Requires the declarativeNetRequestFeedback permission.)
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  totalAdsBlocked++;
  const tabId = info.request.tabId;
  if (tabId >= 0) {
    pageAdsBlocked[tabId] = (pageAdsBlocked[tabId] || 0) + 1;
  }
});

// Function to update ad blocking rules.
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
      console.error(error);
      sendResponse({ enabled: adBlockEnabled });
    });
    return true; // indicates asynchronous response
  } else if (message.action === "getAdCounts") {
    const tabId = sender.tab ? sender.tab.id : null;
    const pageAds = tabId && pageAdsBlocked[tabId] ? pageAdsBlocked[tabId] : 0;
    sendResponse({ pageAds: pageAds, totalAds: totalAdsBlocked });
  } else if (message.action === "getAdBlockState") {
    sendResponse({ enabled: adBlockEnabled });
  }
});
