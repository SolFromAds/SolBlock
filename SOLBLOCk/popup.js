document.addEventListener('DOMContentLoaded', function() {
  // Retrieve the active tab using windows.getLastFocused to avoid the popup itself.
  chrome.windows.getLastFocused({ populate: true }, function(window) {
    if (window && window.tabs) {
      // Find the active tab that isn't the extension's popup.
      const activeTab = window.tabs.find(tab => tab.active && tab.url && !tab.url.startsWith('chrome-extension://'));
      if (activeTab && activeTab.url) {
        try {
          const url = new URL(activeTab.url);
          document.getElementById('currentWebsite').textContent = url.hostname;
        } catch (e) {
          console.error("Error parsing URL:", e);
          document.getElementById('currentWebsite').textContent = "Unknown";
        }
      } else {
        document.getElementById('currentWebsite').textContent = "No active tab";
      }
    }
  });

  // Check the current ad block state from background and update UI.
  chrome.runtime.sendMessage({ action: 'getAdBlockState' }, function(response) {
    const toggleButton = document.getElementById('toggleAdblock');
    const statusElement = document.getElementById('adBlockStatus');
    if (response && typeof response.enabled !== "undefined") {
      statusElement.textContent = response.enabled ? "Ad-blocking is enabled" : "Ad-blocking is disabled";
      toggleButton.textContent = response.enabled ? 'ON' : 'OFF';
    }
  });

  // Toggle the ad blocking functionality when the button is clicked.
  var toggleButton = document.getElementById('toggleAdblock');
  toggleButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'toggleAdblock' }, function(response) {
      const statusElement = document.getElementById('adBlockStatus');
      if (response && typeof response.enabled !== "undefined") {
        toggleButton.textContent = response.enabled ? 'ON' : 'OFF';
        statusElement.textContent = response.enabled ? "Ad-blocking is enabled" : "Ad-blocking is disabled";
      } else {
        console.error("No valid response from background.");
      }
    });
  });

  // Function to update the ad counts from the background service worker.
  function updateAdCounts() {
    chrome.runtime.sendMessage({ action: 'getAdCounts' }, function(response) {
      if (response) {
        document.getElementById('pageAdCount').textContent = response.pageAds;
        document.getElementById('totalAdCount').textContent = response.totalAds;
      }
    });
  }

  // Update ad counts immediately and then every 5 seconds.
  updateAdCounts();
  setInterval(updateAdCounts, 5000);
});
