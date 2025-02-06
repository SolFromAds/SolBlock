document.addEventListener('DOMContentLoaded', function() {
  // Query the active tab using lastFocusedWindow to avoid returning the popup's URL.
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, function(tabs) {
    if (tabs.length > 0 && tabs[0].url) {
      try {
        var url = new URL(tabs[0].url);
        document.getElementById('currentWebsite').textContent = url.hostname;
      } catch (e) {
        console.error("Error parsing URL:", e);
        document.getElementById('currentWebsite').textContent = "Unknown";
      }
    } else {
      document.getElementById('currentWebsite').textContent = "No active tab";
    }
  });

  // Toggle the ad blocking functionality when the button is clicked.
  var toggleButton = document.getElementById('toggleAdblock');
  toggleButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'toggleAdblock' }, function(response) {
      if (response && typeof response.enabled !== "undefined") {
        toggleButton.textContent = response.enabled ? 'ON' : 'OFF';
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
