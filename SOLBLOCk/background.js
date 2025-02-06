// On installation, initialize storage and remove any previous ad blocking rules.
chrome.runtime.onInstalled.addListener((object) => {
  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.storage.local.set({ solAddress: "" });
    // Clear any previously set dynamic rules (using our defined rule IDs).
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1, 2, 3]
    });
  }
});

// Global state variables for ad blocking and counting.
let adBlockEnabled = false;
let totalAdsBlocked = 0;
let pageAdsBlocked = {};

// Define ad blocking rules (adjust URL filters as needed).
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

// Listen to the onRuleMatchedDebug event to count blocked requests.
// (Requires "declarativeNetRequestFeedback" permission in the manifest.)
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  totalAdsBlocked++;
  const tabId = info.request.tabId;
  if (tabId >= 0) {
    pageAdsBlocked[tabId] = (pageAdsBlocked[tabId] || 0) + 1;
  }
});

// Function to update ad blocking rules based on the current toggle state.
function updateAdBlockRules() {
  if (adBlockEnabled) {
    // Add our ad blocking rules.
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [],
      addRules: adBlockingRules
    });
  } else {
    // Remove our ad blocking rules.
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: adBlockingRules.map(rule => rule.id)
    });
  }
}

// Listen for messages from your popup to toggle ad blocking or get counts.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleAdblock") {
    adBlockEnabled = !adBlockEnabled;
    updateAdBlockRules();
    sendResponse({ enabled: adBlockEnabled });
  } else if (message.action === "getAdCounts") {
    const tabId = sender.tab ? sender.tab.id : null;
    const pageAds = tabId && pageAdsBlocked[tabId] ? pageAdsBlocked[tabId] : 0;
    sendResponse({ pageAds: pageAds, totalAds: totalAdsBlocked });
  }
});
