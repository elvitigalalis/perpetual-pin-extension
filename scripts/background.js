chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(["perpetuallyPinnedUrls"], (result) => {
        if (!result.perpetuallyPinnedUrls) {
            chrome.storage.sync.set({perpetuallyPinnedUrls: []}, () => {
                console.log("No pinned tabs.")
            });
        }
    });

    autoPinNotPinnedTabsAndDeleteDuplicateTabs();
});

chrome.windows.onCreated.addListener(() => {
    autoPinNotPinnedTabsAndDeleteDuplicateTabs();
});

/*
The above two snippets of code pin tabs specified 
in the perpetuallyPinnedUrls array when the extension
is installed or when a new window is created.
*/

chrome.tabs.onCreated.addListener((tab) => {
    chrome.storage.sync.get(["perpetuallyPinnedUrls"], (result) => {
        if (!result.perpetuallyPinnedUrls) {
            return;
        }

        const strippedPerpetuallyPinnedUrls = result.perpetuallyPinnedUrls.map((url) => stripUrl(url));

        if (tab.url && strippedPerpetuallyPinnedUrls.includes(stripUrl(tab.url))) {
            navigateToPinnedTab(tab);
        } else {
            console.log("New tab initialized without URL");
            chrome.tabs.onUpdated.addListener(function onTabUpdate(tabId, changeInfo, newTab) {
                console.log("New tab URL: " + newTab.url);
                if (tabId === tab.id && changeInfo.url && strippedPerpetuallyPinnedUrls.includes(stripUrl(changeInfo.url))) {
                    navigateToPinnedTab(newTab);
                    chrome.tabs.onUpdated.removeListener(onTabUpdate);
                }
            }); 
        }
    });
});

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

setInterval(autoPinNotPinnedTabsAndDeleteDuplicateTabs, 1000);

// function pinStartupTabs() {
//     chrome.storage.sync.get(["perpetuallyPinnedUrls"], (result) => {
//         if (result.perpetuallyPinnedUrls) {
//             result.perpetuallyPinnedUrls.forEach((url) => {
//                 chrome.tabs.create({url: url, pinned: true}, (tab) => {
//                     console.log("Tab created.")
//                 });
//             });
//         }
//     });
// }

function autoPinNotPinnedTabsAndDeleteDuplicateTabs() {
    chrome.storage.sync.get(["perpetuallyPinnedUrls"], 
    (result) => {
        if (!result.perpetuallyPinnedUrls) {
            return
        }
    
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
                    chrome.tabs.create({url: originalUrl, pinned: true, active: false});
                }
            })
        })
    });
}

function navigateToPinnedTab(newTab) {
    chrome.tabs.query({ currentWindow: true, pinned: true }, (tabs) => {
        const strippedNewTabUrl = stripUrl(newTab.url);
        const existingPinnedTab = tabs.find(tab => stripUrl(tab.url) === strippedNewTabUrl);

        if (existingPinnedTab) {
            chrome.tabs.update(existingPinnedTab.id, { url: newTab.url, active:true }, () => {
                chrome.tabs.remove(newTab.id);
            })
        }
    })
}

// function perpetuallyPinASpecificTab(targetTab) {
//     chrome.storage.sync.get(["perpetuallyPinnedUrls"], 
//     (result) => {
//         const strippedTabUrl = stripUrl(targetTab.url);
//         console.log("Stripped URL: " + strippedTabUrl);

//         const isTabPinned = result.perpetuallyPinnedUrls.includes(strippedTabUrl);
//         console.log("Is tab pinned: " + isTabPinned);

//         if (true) {
//             chrome.tabs.update(targetTab.id, {pinned: true});
//             console.log("Tab has been pinned.");
//         }
//     });
// }

function stripUrl(url) {
    return url.replace(/^(https?:\/\/)?(www\.)?|\/$/g, '');
}
