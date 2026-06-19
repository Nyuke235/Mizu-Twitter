let LAST_SETTINGS = { ...DEFAULT_SETTINGS };

initializeSettings();

function isExtensionContextValid() {
    return !!(chrome.runtime && chrome.runtime.id);
}

async function initializeSettings() {
    chrome.runtime.sendMessage({ from: "content", subject: "showPageAction" });

    try {
        const keys = Object.keys(DEFAULT_SETTINGS);
        const data = await getStorageValues(keys);
        LAST_SETTINGS = { ...data };

        applySettings(LAST_SETTINGS);
    } catch (err) {
        console.warn("Mizu Twitter: Initialization failed:", err);
    }

    setupObserver();
}

function getStorageValues(keys) {
    return new Promise((resolve) => {
        try {
            chrome.storage.local.get(keys, (data) => {
                if (chrome.runtime.lastError) {
                    console.warn("Mizu Twitter: Storage error:", chrome.runtime.lastError);
                    resolve({ ...DEFAULT_SETTINGS });
                } else {
                    const settings = keys.reduce((acc, key) => {
                        acc[key] =
                            data[key] !== undefined ? data[key] : DEFAULT_SETTINGS[key];
                        return acc;
                    }, {});
                    resolve(settings);
                }
            });
        } catch (err) {
            console.error("Mizu Twitter: Failed to get storage:", err);
            resolve({ ...DEFAULT_SETTINGS });
        }
    });
}

function applySettings(settings) {
    const body = document.body;

    if (!body) return;

    if (!body.classList.contains("mizu")) {
        body.classList.add("mizu");
    }

    Object.entries(settings).forEach(([key, enabled]) => {
        if (typeof enabled === "boolean") {
            body.classList.toggle(key, enabled);
        }
    });

    const previousTheme = body.dataset.mizuTheme;
    if (previousTheme) {
        body.classList.remove(previousTheme);
    }

    const theme = settings.theme;
    body.classList.add(theme);
    body.dataset.mizuTheme = theme;

    if (theme === "th_custom") {
        applyCustomTheme(settings);
    } else {
        clearCustomTheme();
    }

    ensureBackgroundOverlay();
    applyBackground(theme, settings);

    enhanceDynamicUI();
    applyForYouTab(settings.hideForYouPage);
}

function applyCustomTheme(settings) {
    const vars = buildCustomThemeVars(settings.customTheme);
    Object.entries(vars).forEach(([key, value]) => {
        document.body.style.setProperty(key, value);
    });
}

function clearCustomTheme() {
    const vars = buildCustomThemeVars({});
    Object.keys(vars).forEach((key) => document.body.style.removeProperty(key));
}

function ensureBackgroundOverlay() {
    if (document.getElementById("x-background-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "x-background-overlay";
    document.body.prepend(overlay);
}

function applyBackground(theme, settings) {
    if (theme === "th_custom") {
        const dataUrl = settings && settings.customBackground;
        document.documentElement.style.setProperty(
            "--mizu-bg-url",
            dataUrl ? `url("${dataUrl}")` : "none"
        );
        return;
    }

    if (!isExtensionContextValid()) return;

    const imagePath = `images/backgrounds/${theme}.png`;
    const url = chrome.runtime.getURL(imagePath);

    document.documentElement.style.setProperty(
        "--mizu-bg-url",
        `url("${url}")`
    );
}

function enhanceDynamicUI() {
    tagPrimaryButtons();
    replaceHomeLogo();
}

function tagPrimaryButtons() {
    const buttons = document.querySelectorAll(
        '.css-175oi2r.r-sdzlij.r-1ny4l3l.r-1loqt21'
    );

    buttons.forEach((btn) => {
        if (!btn.classList.contains("mizu-btn")) {
            btn.classList.add("mizu-btn");
        }
    });
}

function replaceHomeLogo() {
    if (!isExtensionContextValid()) return;

    const homeLink = document.querySelector('header a[href="/home"]');
    if (!homeLink) return;

    if (homeLink.querySelector(".mizu-home-logo")) return;

    const img = document.createElement("img");
    img.className = "mizu-home-logo";
    img.alt = "Home";
    img.src = chrome.runtime.getURL("images/icontransparent.png");

    homeLink.prepend(img);
}

function applyForYouTab(hide) {
    const tabList = document.querySelector('[data-testid="ScrollSnap-List"]');
    if (!tabList) return;

    const forYouTab = [...tabList.querySelectorAll('[role="tab"]')]
        .find(tab => tab.textContent.trim() === "For you");

    if (!forYouTab) return;

    const wrapper = forYouTab.closest('[role="presentation"]') ?? forYouTab;
    wrapper.classList.toggle("mizu-hidden", hide);
}

function setupObserver() {
    let scheduled = false;

    const observer = new MutationObserver(() => {
        if (!isExtensionContextValid()) {
            observer.disconnect();
            return;
        }

        if (scheduled) return;

        scheduled = true;

        requestAnimationFrame(() => {
            enhanceDynamicUI();
            applyForYouTab(LAST_SETTINGS.hideForYouPage);
            scheduled = false;
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "UPDATE_SETTINGS" && msg.settings) {
        LAST_SETTINGS = { ...LAST_SETTINGS, ...msg.settings };

        applySettings(LAST_SETTINGS);
    }

    sendResponse({ success: true });
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;

    const updated = {};
    Object.keys(changes).forEach((key) => {
        updated[key] = changes[key].newValue;
    });

    LAST_SETTINGS = { ...LAST_SETTINGS, ...updated };
    applySettings(LAST_SETTINGS);
});
