document.getElementById("addButton").addEventListener("click", () => {
    const url = "https://" + document.getElementById("addUrl").value;
    if (url) {
        chrome.runtime.sendMessage({ action: "addPerpetuallyPinnedUrl", url: url}, (response) => {
            if (response.status === "success") {
                document.getElementById("addUrl").value = "";
            }
        });
    } else {
        alert("Please enter a URL.");
    }
});

document.getElementById("deleteButton").addEventListener("click", () => {
    const url = "https://" + document.getElementById("deleteUrl").value;
    if (url) {
        chrome.runtime.sendMessage({ action: "deletePerpetuallyPinnedUrl", url: url}, (response) => {
            if (response.status === "success") {
                document.getElementById("deleteUrl").value = "";
            }
        })
    } else {
        alert("Please enter a URL.");
    }
})