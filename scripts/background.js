chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(["perpetuallyPinnedUrls"], (result) => {
        if (!result.perpetuallyPinnedUrls) {
            chrome.storage.sync.set({perpetuallyPinnedUrls: []}, () => {
                console.log("Perpetually pinned tab list is initialized, but null.")
            });
        }
    });

    pinStartupTabs();
    // Pins all wanted tabs on startup / window creation.
});

chrome.windows.onCreated.addListener(() => {
    pinStartupTabs();
});

// FIXME- if tab is already pinned, it will delete the new tab and navigate to the pinned tab.
chrome.tabs.onCreated.addListener((tab) => {
    chrome.storage.sync.get(["perpetuallyPinnedUrls"], (result) => {
        if (result.perpetuallyPinnedUrls.includes(tab.url)) {
            chrome.tabs.update(tab.id, {pinned: true})
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "addPerpetuallyPinnedUrl") {
        chrome.storage.sync.get(["perpetuallyPinnedUrls"], (result) => {
            const newUrls = [...result.perpetuallyPinnedUrls, request.url];
            chrome.storage.sync.set({perpetuallyPinnedUrls: newUrls }, () => {
                sendResponse({ status: "success" })
            });
        });
    }
})

// If a tab in perpetuallyPinnedUrls is not open, it will open it and pin it.
function pinStartupTabs() {
    chrome.storage.sync.get(["perpetuallyPinnedUrls"], (result) => {
        if (result.perpetuallyPinnedUrls) {
            result.perpetuallyPinnedUrls.forEach((url) => {
                chrome.tabs.create({url: url, pinned: true}, (tab) => {
                    console.log("Tab created.")
                });
            });
        }
    });
}