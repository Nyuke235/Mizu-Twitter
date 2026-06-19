const DEFAULT_CUSTOM_THEME = {
    "--font-main": '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
    "--color-text-main": "#ffffff",
    "--color-text-muted": "#8899a6",
    "--color-tweet-text": "#ffffff",
    "--color-placeholder": "#8899a6",
    "--color-link": "#1d9bf0",
    "--color-link-hover": "#4fb3ff",
    "--color-accent": "#1d9bf0",
    "--color-glow": "#1d9bf0",
    "--color-icon": "#1d9bf0",
    "--color-surface-1": "#1e2732",
    "--color-surface-2": "#263341",
    "--color-surface-3": "#2f3f52",
    "--color-surface-1-hover": "#2a3a4a",
    "--color-surface-2-hover": "#34475c",
    "--color-surface-3-hover": "#3f546b",
    "--color-surface-bg": "#000000",
    "panelOpacity": 0.4,
    "--surface-blur": 2,
    "--radius-btn": 20,
    "--overlay-opacity": 0.35,
};

const CUSTOM_THEME_FIELDS = [
    { key: "--font-main", label: "Font family", type: "text" },
    { key: "--color-text-main", label: "Main text", type: "color" },
    { key: "--color-text-muted", label: "Muted text", type: "color" },
    { key: "--color-tweet-text", label: "Tweet text", type: "color" },
    { key: "--color-placeholder", label: "Placeholder", type: "color" },
    { key: "--color-link", label: "Link", type: "color" },
    { key: "--color-link-hover", label: "Link hover", type: "color" },
    { key: "--color-accent", label: "Accent", type: "color" },
    { key: "--color-glow", label: "Glow", type: "color" },
    { key: "--color-icon", label: "Icons", type: "color" },
    { key: "--color-surface-1", label: "Button gradient 1", type: "color" },
    { key: "--color-surface-2", label: "Button gradient 2", type: "color" },
    { key: "--color-surface-3", label: "Button gradient 3", type: "color" },
    { key: "--color-surface-1-hover", label: "Button hover 1", type: "color" },
    { key: "--color-surface-2-hover", label: "Button hover 2", type: "color" },
    { key: "--color-surface-3-hover", label: "Button hover 3", type: "color" },
    { key: "--color-surface-bg", label: "Panel background", type: "color" },
    { key: "panelOpacity", label: "Panel opacity", type: "range", min: 0, max: 1, step: 0.05 },
    { key: "--surface-blur", label: "Panel blur (px)", type: "range", min: 0, max: 20, step: 1 },
    { key: "--radius-btn", label: "Button radius (px)", type: "range", min: 0, max: 40, step: 1 },
    { key: "--overlay-opacity", label: "Background opacity", type: "range", min: 0, max: 1, step: 0.05 },
];

function hexToRgba(hex, alpha) {
    const h = String(hex).replace("#", "");
    const r = parseInt(h.substring(0, 2), 16) || 0;
    const g = parseInt(h.substring(2, 4), 16) || 0;
    const b = parseInt(h.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildCustomThemeVars(raw) {
    const v = { ...DEFAULT_CUSTOM_THEME, ...(raw || {}) };
    const vars = {};

    Object.keys(DEFAULT_CUSTOM_THEME).forEach((key) => {
        if (key === "panelOpacity") return;

        if (key === "--color-surface-bg") {
            vars[key] = hexToRgba(v["--color-surface-bg"], v.panelOpacity);
        } else if (key === "--surface-blur" || key === "--radius-btn") {
            vars[key] = `${v[key]}px`;
        } else if (key === "--overlay-opacity") {
            vars[key] = String(v[key]);
        } else {
            vars[key] = v[key];
        }
    });

    return vars;
}

const DEFAULT_SETTINGS = {
    hideSidebar: true,
    hideFooter: true,
    hideGrok : true,
    hidePremium: true,
    hideCommunities: true,
    hideBusiness: true,
    hideExplore: true,
    hideCreatorStudio: true,
    hideForYouPage: false,
    hideViewCount: false,
    hideReactionCount: false,

    theme: "th_default_twitter",
    customTheme: { ...DEFAULT_CUSTOM_THEME },
    customBackground: ""
};
