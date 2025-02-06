document.getElementById("solana-form").addEventListener("submit", (e) => {
    e.preventDefault();
    let solanaAddress = document.getElementById("solana-address").value;
    chrome.storage.local.set({solAddress: solanaAddress}, () => {
        location.reload();
    });
})

// When solana.html page will load, if address already exists in storage, it will be printed on screen.
chrome.storage.local.get(["solAddress"], (responseFromStorage) => {
    if(responseFromStorage.solAddress) {
        document.getElementById("sol-address").innerText = responseFromStorage.solAddress;
    }
})