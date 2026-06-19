const SETTING_LABELS = {
    hideSidebar:       "Hide Sidebar",
    hideFooter:        "Hide Footer",
    hideGrok:          "Hide Grok / AI",
    hidePremium:       "Hide Premium Upsells",
    hideCommunities:   "Hide Communities",
    hideBusiness:      "Hide Business",
    hideExplore:       "Hide Explore",
    hideCreatorStudio: "Hide Creator Studio",
    hideForYouPage:    "Hide \"For You\" (show Following only)",
    hideViewCount:     "Hide View Count",
    hideReactionCount: "Hide Reaction Count",
};

async function initPopup() {
    const settings = await loadSettings();
    const container = document.getElementById("settings");

    Object.keys(DEFAULT_SETTINGS).forEach(key => {
        if (typeof DEFAULT_SETTINGS[key] !== "boolean") return;

        const row = document.createElement("div");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = settings[key];
        checkbox.dataset.key = key;

        const label = document.createElement("label");
        label.textContent = SETTING_LABELS[key] ?? key;

        row.append(checkbox, label);
        container.appendChild(row);
    });

    container.addEventListener("change", async e => {
        const key = e.target.dataset.key;
        settings[key] = e.target.checked;
        await saveSettings(settings);
        pushToContent({ [key]: settings[key] });
    });

    const themeSelect = document.getElementById("theme-select");
    themeSelect.value = settings.theme;
    updateThemeArtistFromSelect();
    updateCustomVisibility();

    themeSelect.addEventListener("change", async () => {
        settings.theme = themeSelect.value;
        await saveSettings(settings);
        updateThemeArtistFromSelect();
        updateCustomVisibility();
        pushToContent({ theme: settings.theme });
    });

    document.getElementById("open-custom-editor").addEventListener("click", () => {
        chrome.windows.create({
            url: chrome.runtime.getURL("options/options.html"),
            type: "popup",
            width: 640,
            height: 760
        });
    });
}

function pushToContent(partial) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (!tabs[0]) return;
        chrome.tabs.sendMessage(tabs[0].id, {
            type: "UPDATE_SETTINGS",
            settings: partial
        });
    });
}

function updateCustomVisibility() {
    const select = document.getElementById("theme-select");
    const panel = document.getElementById("custom-theme-panel");
    panel.classList.toggle("hidden", select.value !== "th_custom");
}

function updateThemeArtistFromSelect() {
    const select = document.getElementById("theme-select");
    const artistBox = document.getElementById("theme-artist");
    const artistName = document.getElementById("artist-name");

    const option = select.options[select.selectedIndex];
    const artist = option.dataset.artist;

    if (!artist) {
        artistBox.style.display = "none";
        return;
    }

    artistBox.style.display = "block";
    artistName.textContent = artist;
}

document.addEventListener("DOMContentLoaded", initPopup);
