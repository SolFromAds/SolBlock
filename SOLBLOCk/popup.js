document.addEventListener('DOMContentLoaded', function() {
  // Request the last active non-extension tab URL from background.
  chrome.runtime.sendMessage({ action: 'getLastActiveTabUrl' }, function(response) {
    if (response && response.url) {
      try {
        const url = new URL(response.url);
        document.getElementById('currentWebsite').textContent = url.hostname;
      } catch (e) {
        console.error("Error parsing URL from background:", e);
        document.getElementById('currentWebsite').textContent = "Unknown";
      }
    } else {
      document.getElementById('currentWebsite').textContent = "No active tab";
    }
  });

  // Query the current ad block state.
  chrome.runtime.sendMessage({ action: 'getAdBlockState' }, function(response) {
    const toggleButton = document.getElementById('toggleAdblock');
    const statusElement = document.getElementById('adBlockStatus');
    if (response && typeof response.enabled !== "undefined") {
      statusElement.textContent = response.enabled ? "Ad-blocking is enabled" : "Ad-blocking is disabled";
      toggleButton.textContent = response.enabled ? 'ON' : 'OFF';
    } else {
      statusElement.textContent = "Ad-blocking status unknown";
    }
  });

  // When the toggle button is clicked, ask the background to flip the state.
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

  // Function to update the ad counts.
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

