let LAST_SETTINGS = { ...DEFAULT_SETTINGS };

initializeSettings();

async function initializeSettings() {
    try {
        const keys = Object.keys(DEFAULT_SETTINGS);
        const data = await getStorageValues(keys);
        LAST_SETTINGS = { ...data };
        applySettings(LAST_SETTINGS);
    } catch (err) {
        console.warn("Failed to initialize settings:", err);
    }

    const observer = new MutationObserver(() => {
        try {
            applySettings(LAST_SETTINGS);
        } catch (err) {
            console.warn("Observer failed:", err);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // load background image (CSP-proof)
    const bgImgURL = chrome.runtime.getURL("images/backgrounds/remiliascarlet.jpg");
    document.documentElement.style.setProperty("--mizu-bg-url", `url("${bgImgURL}")`);
    const overlay = document.createElement("div");
    overlay.id = "x-background-overlay";
    document.body.prepend(overlay);
}

function getStorageValues(keys) {
    return new Promise((resolve) => {
        try {
            chrome.storage.local.get(keys, (data) => {
                if (chrome.runtime.lastError) {
                    console.warn("Storage error:", chrome.runtime.lastError);
                    resolve({ ...DEFAULT_SETTINGS });
                } else {
                    const settings = keys.reduce((acc, key) => {
                        acc[key] = data[key] !== undefined ? data[key] : DEFAULT_SETTINGS[key];
                        return acc;
                    }, {});
                    resolve(settings);
                }
            });
        } catch (err) {
            console.error("Failed to get storage:", err);
            resolve({ ...DEFAULT_SETTINGS });
        }
    });
}

function applySettings(settings) {
    const body = document.body;
    Object.entries(settings).forEach(([key, enabled]) => {
        body.classList.toggle(key, !!enabled);
    });

    if (settings.hideForYouPage) {
        const tabList = document.querySelector('[data-testid="ScrollSnap-List"]');
        const prevBtn = document.querySelector('[data-testid="ScrollSnap-prevButtonWrapper"]');
        const nextBtn = document.querySelector('[data-testid="ScrollSnap-nextButtonWrapper"]');

        if (tabList) {
            // Remove "For you" tab
            const forYouTab = Array.from(tabList.querySelectorAll('[role="tab"]'))
                .find(tab => tab.textContent.trim() === "For you");
            if (forYouTab) forYouTab.remove();

            if (prevBtn) prevBtn.style.display = "none";
            if (nextBtn) nextBtn.style.display = "none";

            tabList.style.scrollPadding = "0";
            tabList.style.paddingLeft = "0";
            tabList.style.paddingRight = "0";

            tabList.style.display = "flex";
            tabList.style.justifyContent = "center";
            tabList.style.width = "100%";

            tabList.style.flexGrow = "0";

            const followingTab = Array.from(tabList.querySelectorAll('[role="tab"]'))
                .find(tab => tab.textContent.trim() === "Following");
            if (followingTab) {
                followingTab.setAttribute("aria-selected", "true");
                followingTab.tabIndex = 0;
                followingTab.style.margin = "0 auto";
            }
        }
    }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "UPDATE_SETTINGS" && msg.settings) {
        LAST_SETTINGS = { ...LAST_SETTINGS, ...msg.settings };
        applySettings(LAST_SETTINGS);
    }
    sendResponse({ success: true });
});

try {
    chrome.runtime.sendMessage({ from: "content", subject: "showPageAction" });
} catch (err) {
    console.warn("Could not activate extension icon:", err);
}
