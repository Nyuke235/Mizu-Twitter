let LAST_SETTINGS = { ...DEFAULT_SETTINGS };
let POLITICAL_KEYWORDS = [];
let POLITICAL_WORDS_LOADED = false;

initializeSettings();

async function initializeSettings() {
    try {
        await loadPoliticalWords();
        const keys = Object.keys(DEFAULT_SETTINGS);
        const data = await getStorageValues(keys);
        LAST_SETTINGS = { ...data };
        applySettings(LAST_SETTINGS);
        filterPoliticalTweets();
    } catch (err) {
        console.warn("Failed to initialize settings:", err);
    }

    const observer = new MutationObserver(() => {
        try {
            applySettings(LAST_SETTINGS);
            filterPoliticalTweets();
        } catch (err) {
            console.warn("Observer failed:", err);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    ensureBackgroundOverlay();
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
                        acc[key] = data[key] !== undefined ? data[key] : DEFAULT_SETTINGS[key];
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
    Object.entries(settings).forEach(([key, enabled]) => {
        body.classList.toggle(key, !!enabled);
    });

    const theme = settings.theme || "default_twitter";

    body.classList.remove("matrix", "touhou_remiliascarlet", "touhou_yukari", "higurashi_rena", "umineko_beatrice");
    body.classList.add(`${settings.theme}`);

    applyBackground(theme);

    if (settings.hideForYouPage) {
        const tabList = document.querySelector('[data-testid="ScrollSnap-List"]');
        if (!tabList) return;

        const forYouTab = [...tabList.querySelectorAll('[role="tab"]')]
            .find(tab => tab.textContent.trim() === "For you");
        if (forYouTab) forYouTab.remove();
    }
}

function ensureBackgroundOverlay() {
    if (document.getElementById("x-background-overlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "x-background-overlay";
    document.body.prepend(overlay);
}

function applyBackground(theme) {
    const images = {
        touhou_remiliascarlet: "images/backgrounds/touhou_remiliascarlet.jpg",
        touhou_yukari: "images/backgrounds/touhou_yukari.png",
        higurashi_rena: "images/backgrounds/higurashi_rena.jpg",
        umineko_beatrice: "images/backgrounds/umineko_beatrice.png"
    };

    const imagePath = images[theme] || images.touhou_remiliascarlet;

    const url = chrome.runtime.getURL(imagePath);
    document.documentElement.style.setProperty("--mizu-bg-url", `url("${url}")`);
}

async function loadPoliticalWords() {
    try {
        const url = chrome.runtime.getURL("data/pol.json");
        const response = await fetch(url);
        const data = await response.json();

        POLITICAL_KEYWORDS = data.words.map(w => w.toLowerCase());
        POLITICAL_WORDS_LOADED = true;
    } catch (err) {
        console.warn("Mizu Twitter: Failed to load political words", err);
    }
}

function filterPoliticalTweets() {
    if (!LAST_SETTINGS.filterPolitics) return;
    if (!POLITICAL_WORDS_LOADED) return;

    const tweets = document.querySelectorAll("article");

    tweets.forEach(tweet => {
        if (tweet.dataset.mizuFiltered === "true") return;

        const text = tweet.innerText.toLowerCase();

        const isPolitical = POLITICAL_KEYWORDS.some(word =>
            text.includes(word)
        );

        if (isPolitical) {
            tweet.style.display = "none";
            tweet.dataset.mizuFiltered = "true";
        }
    });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "UPDATE_SETTINGS" && msg.settings) {
        LAST_SETTINGS = { ...LAST_SETTINGS, ...msg.settings };
        applySettings(LAST_SETTINGS);
        filterPoliticalTweets();
    }
    sendResponse({ success: true });
});
