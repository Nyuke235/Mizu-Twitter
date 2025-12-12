function loadSettings() {
    return new Promise(resolve => {
        chrome.storage.local.get(DEFAULT_SETTINGS, (data) => {
            if (chrome.runtime.lastError || !data) {
                resolve({ ...DEFAULT_SETTINGS });
            } else {
                resolve({ ...DEFAULT_SETTINGS, ...data });
            }
        });
    });
}

function saveSettings(settings) {
    return new Promise(resolve => {
        chrome.storage.local.set(settings, () => resolve());
    });
}
