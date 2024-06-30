document.getElementById("addButton").addEventListener("click", () => {
    const url = document.getElementById("urlInput").value;
    if (url) {
        chrome.runtime.sendMessage({ action: "addPerpetuallyPinnedUrl", url: url}, (response) => {
            if (response.status === "Successfully added.") {
                document.getElementById("urlInput").value = "";
            }
        });
    } else {
        alert("Please enter a URL.");
    }
});