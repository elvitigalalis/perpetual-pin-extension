chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(["perpetuallyPinnedUrls"], (result) => {
        if (!result.perpetuallyPinnedUrls) {
            chrome.storage.sync.set({perpetuallyPinnedUrls: []}, () => {
                console.log("No pinned tabs.")
            });
        }
    });

    pinStartupTabs();
});

chrome.windows.onCreated.addListener(() => {
    pinStartupTabs();
});

/*
The above two snippets of code pin tabs specified 
in the perpetuallyPinnedUrls array when the extension
is installed or when a new window is created.
*/

// FIXME- if tab is already pinned, it will delete the new tab and navigate to the pinned tab.
chrome.tabs.onCreated.addListener((tab) => {
    console.log("New tab created.");
    if (tab.url) {
        console.log("GGs")
        perpetuallyPinSpecificTab(tab);
    }
    else if (!tab.url & tab.url !== "chrome://newtab/") {
        console.log("New tab initialized without URL");
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, newTab) {
            console.log("New tab URL " + newTab.url);
            if (newTab.url !== "chrome://newtab/") {

                perpetuallyPinSpecificTab(newTab);
            }
         }); 
    }
});
// DID NOT WORK ABOVE

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "addPerpetuallyPinnedUrl") {
        chrome.storage.sync.get(["perpetuallyPinnedUrls"], (result) => {
            const newUrls = [...result.perpetuallyPinnedUrls, request.url];
            chrome.storage.sync.set({perpetuallyPinnedUrls: newUrls }, () => {
                sendResponse({ status: "success" });
            });
        });
        return true;
    }
    else if (request.action === "deletePerpetuallyPinnedUrl") {
        chrome.storage.sync.get(["perpetuallyPinnedUrls"], (result) => {
            const newUrls = result.perpetuallyPinnedUrls.filter((url) => url !== request.url);
            chrome.storage.sync.set({perpetuallyPinnedUrls: newUrls }, () => {
                sendResponse({status: "success"});
            });
        });
        return true;
    }
})

setInterval(checkAndPinTabs, 5000);

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

function checkAndPinTabs() {
    chrome.storage.sync.get(["perpetuallyPinnedUrls"], 
    (result) => {
        if (!result.perpetuallyPinnedUrls) {
            return
        }
    });

    chrome.tabs.query({ currentWindow: true }, function(tabs) {
        const strippedPinUrls = result.perpetuallyPinnedUrls.map((url) => stripUrl(url));
        // const strippedCurrentUrls = tabs.map(tab => stripUrl(tab.url));
        const seenUrls = new Set();

        // Remove duplicate pinned tabs.
        tabs.forEach(tab => {
            const strippedUrl = stripUrl(tab.url);

            if (seenUrls.has(strippedUrl)) {
                chrome.tabs.remove(tab.id);
            } else if (tab.pinned) {
                seenUrls.add(strippedUrl);
            }
        })

        // Open tabs in perpetuallyPinnedUrls that are not currently opened.
        strippedPinUrls.forEach((url) => {
            if (!seenUrls.has(url)) {
                const originalUrl = result.perpetuallyPinnedUrls.find(originalUrl => stripUrl(originalUrl) === url);
                chrome.tabs.create({url: originalUrl, pinned: true});
            }
        })
    })
}

function perpetuallyPinSpecificTab(targetTab) {
    chrome.storage.sync.get(["perpetuallyPinnedUrls"], 
    (result) => {
        const strippedTabUrl = stripUrl(targetTab.url);
        console.log("Stripped URL: " + strippedTabUrl);

        const isTabPinned = result.perpetuallyPinnedUrls.includes(strippedTabUrl);
        console.log("Is tab pinned: " + isTabPinned);

        if (true) {
            chrome.tabs.update(targetTab.id, {pinned: true});
            console.log("Tab has been pinned.");
        }
    });
}

function stripUrl(url) {
    return url.replace(/^(https?:\/\/)?(www\.)?|\/$/g, '');
}
