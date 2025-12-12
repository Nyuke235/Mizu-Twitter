async function initPopup() {
    const settings = await loadSettings();
    const container = document.getElementById("settings");

    if (!container) return;

    Object.keys(DEFAULT_SETTINGS).forEach(key => {
        if (typeof DEFAULT_SETTINGS[key] !== "boolean") return;

        const row = document.createElement("div");
        row.className = "row";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = settings[key];
        checkbox.dataset.key = key;

        const label = document.createElement("label");
        label.textContent = key;

        row.appendChild(checkbox);
        row.appendChild(label);
        container.appendChild(row);
    });

    container.addEventListener("change", async (e) => {
        if (e.target.type === "checkbox") {
            const key = e.target.dataset.key;
            settings[key] = e.target.checked;

            await saveSettings(settings);

            try {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]?.id) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            type: "UPDATE_SETTINGS",
                            settings: { [key]: settings[key] }
                        });
                    }
                });
            } catch (err) {
                console.warn("Failed to send message to content script", err);
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", initPopup);
