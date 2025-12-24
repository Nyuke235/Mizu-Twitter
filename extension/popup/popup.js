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
        label.textContent = key;

        row.append(checkbox, label);
        container.appendChild(row);
    });

    container.addEventListener("change", async e => {
        const key = e.target.dataset.key;
        settings[key] = e.target.checked;
        await saveSettings(settings);

        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: "UPDATE_SETTINGS",
                settings: { [key]: settings[key] }
            });
        });
    });

    const themeSelect = document.getElementById("theme-select");
    themeSelect.value = settings.theme;
    updateThemeArtistFromSelect();

    themeSelect.addEventListener("change", async () => {
        settings.theme = themeSelect.value;
        await saveSettings(settings);
        updateThemeArtistFromSelect();
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: "UPDATE_SETTINGS",
                settings: { theme: settings.theme }
            });
        });
    });
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

    artistName.textContent = artist;
    artistBox.style.display = "block";
}

document.addEventListener("DOMContentLoaded", initPopup);
