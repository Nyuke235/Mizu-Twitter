function decodeImage(file) {
    if (typeof createImageBitmap === "function") {
        return createImageBitmap(file).catch(() => decodeViaImg(file));
    }
    return decodeViaImg(file);
}

function decodeViaImg(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode failed")); };
        img.src = url;
    });
}

async function compressImage(file, maxDim = 1920, quality = 0.85) {
    const img = await decodeImage(file);
    const w = img.width;
    const h = img.height;

    if (!w || !h) {
        if (img.close) img.close();
        throw new Error("Image has no dimensions");
    }

    const scale = Math.min(1, maxDim / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    if (img.close) img.close();

    const isPng = file.type === "image/png";
    let dataUrl = canvas.toDataURL(isPng ? "image/png" : "image/jpeg", quality);

    if (isPng && dataUrl.length > 4000000) {
        const flat = document.createElement("canvas");
        flat.width = canvas.width;
        flat.height = canvas.height;
        const fctx = flat.getContext("2d");
        fctx.fillStyle = "#000000";
        fctx.fillRect(0, 0, flat.width, flat.height);
        fctx.drawImage(canvas, 0, 0);
        dataUrl = flat.toDataURL("image/jpeg", quality);
    }

    return dataUrl;
}

function updatePreview(dataUrl) {
    const preview = document.getElementById("bg-preview");
    preview.style.backgroundImage = dataUrl ? `url("${dataUrl}")` : "none";
    preview.classList.toggle("empty", !dataUrl);
}

async function initOptions() {
    const settings = await loadSettings();
    const fieldsContainer = document.getElementById("custom-theme-fields");

    const renderFields = () => {
        fieldsContainer.textContent = "";
        const custom = { ...DEFAULT_CUSTOM_THEME, ...settings.customTheme };

        CUSTOM_THEME_FIELDS.forEach(field => {
            const row = document.createElement("div");
            row.className = "custom-field";

            const label = document.createElement("label");
            label.textContent = field.label;

            const input = document.createElement("input");
            input.dataset.key = field.key;

            if (field.type === "range") {
                input.type = "range";
                input.min = field.min;
                input.max = field.max;
                input.step = field.step;
                input.value = custom[field.key];
            } else if (field.type === "text") {
                input.type = "text";
                input.value = custom[field.key];
            } else {
                input.type = "color";
                input.value = custom[field.key];
            }

            const valueOut = document.createElement("span");
            valueOut.className = "custom-field-value";
            if (field.type === "range") valueOut.textContent = custom[field.key];

            input.addEventListener("input", async () => {
                const value = field.type === "range"
                    ? Number(input.value)
                    : input.value;
                settings.customTheme = { ...settings.customTheme, [field.key]: value };
                if (field.type === "range") valueOut.textContent = value;
                await saveSettings({ customTheme: settings.customTheme });
            });

            row.append(label, input, valueOut);
            fieldsContainer.appendChild(row);
        });
    };

    renderFields();
    updatePreview(settings.customBackground);

    const fileInput = document.getElementById("custom-bg-file");
    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please choose an image file.");
            fileInput.value = "";
            return;
        }

        try {
            const dataUrl = await compressImage(file);
            settings.customBackground = dataUrl;
            await saveSettings({ customBackground: dataUrl });
            updatePreview(dataUrl);
        } catch (err) {
            console.warn("Mizu Twitter: image processing failed:", err);
            alert(
                `Could not load this image (${file.type || "unknown"}, ` +
                `${Math.round(file.size / 1024)} KB). Try a different file.`
            );
        } finally {
            fileInput.value = "";
        }
    });

    document.getElementById("custom-bg-clear").addEventListener("click", async () => {
        settings.customBackground = "";
        await saveSettings({ customBackground: "" });
        updatePreview("");
    });

    document.getElementById("custom-reset").addEventListener("click", async () => {
        settings.customTheme = { ...DEFAULT_CUSTOM_THEME };
        renderFields();
        await saveSettings({ customTheme: settings.customTheme });
    });
}

document.addEventListener("DOMContentLoaded", initOptions);
