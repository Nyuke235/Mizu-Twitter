chrome.runtime.onStartup.addListener(function () {
    chrome.action.disable();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.from === 'content' && request.subject === 'showPageAction') {
        if (sender.tab && sender.tab.id) {
            chrome.action.enable(sender.tab.id);
        }
    }
});
