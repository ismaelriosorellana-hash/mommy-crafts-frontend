"use strict";

(function () {
    const SETTINGS_CACHE_KEY = "mommycrafts_site_settings_cache_v1";

    const CSS_VARIABLES = {
        primary: "--color-primary",
        primaryDark: "--color-primary-dark",
        primaryDeep: "--color-primary-deep",
        primarySoft: "--color-primary-soft",
        secondary: "--color-secondary",
        accent: "--color-accent",
        background: "--color-background",
        surface: "--color-surface",
        surfaceSoft: "--color-surface-soft",
        text: "--color-text",
        textSoft: "--color-text-soft",
        border: "--color-border",
        headerBackground: "--color-header-background",
        footerBackground: "--color-footer-background",
        footerText: "--color-footer-text",
        buttonText: "--color-button-text"
    };

    function directImages(container) {
        return [...container.children].filter((child) => child.tagName === "IMG");
    }

    function updateBrandContainer(container, branding, colors) {
        const images = directImages(container);
        let logo = images[0] || null;
        if (!logo) {
            logo = document.createElement("img");
            container.prepend(logo);
        }

        logo.dataset.siteLogo = "";
        logo.src = branding.logo.url;
        logo.alt = branding.logo.alt || "Logo Mommy Crafts";
        logo.style.width = `${branding.logo.width}px`;
        logo.style.height = "auto";
        logo.style.maxWidth = "min(28vw, 240px)";
        logo.style.maxHeight = "none";
        logo.style.objectFit = "contain";
        logo.style.transform = `translate(${branding.logo.offsetX}px, ${branding.logo.offsetY}px)`;

        let titleImage = container.querySelector(":scope > img.logo-title, :scope > img[data-site-title-logo]") || images[1] || null;
        let titleText = container.querySelector(":scope > [data-site-title-text]") || container.querySelector(":scope > strong");

        container.style.gap = `${branding.title.gap}px`;

        if (branding.title.mode === "text") {
            if (titleImage) titleImage.hidden = true;
            if (!titleText) {
                titleText = document.createElement("strong");
                container.appendChild(titleText);
            }
            titleText.dataset.siteTitleText = "";
            titleText.hidden = false;
            titleText.textContent = branding.title.text || "Mommy Crafts";
            titleText.style.fontSize = `${branding.title.fontSize}px`;
            titleText.style.lineHeight = "1.1";
            titleText.style.color = colors.primaryDark || colors.text;
            titleText.style.transform = `translate(${branding.title.offsetX}px, ${branding.title.offsetY}px)`;
            titleText.style.whiteSpace = "nowrap";
        } else {
            if (titleText) titleText.hidden = true;
            if (!titleImage) {
                titleImage = document.createElement("img");
                container.appendChild(titleImage);
            }
            titleImage.dataset.siteTitleLogo = "";
            titleImage.hidden = false;
            titleImage.src = branding.title.url;
            titleImage.alt = branding.title.text || "Mommy Crafts";
            titleImage.style.width = `${branding.title.width}px`;
            titleImage.style.height = "auto";
            titleImage.style.maxWidth = container.classList.contains("brand-link")
                ? "min(65vw, 520px)"
                : "min(58vw, 320px)";
            titleImage.style.maxHeight = "none";
            titleImage.style.objectFit = "contain";
            titleImage.style.transform = `translate(${branding.title.offsetX}px, ${branding.title.offsetY}px)`;
        }
    }


    function safeAnnouncementUrl(value) {
        const url = String(value || "").trim();
        if (!url) return "";
        if (/^https:\/\//i.test(url) || /^(\/|\.\/|\.\.\/|[a-z0-9_-]+\.html(?:[?#].*)?$)/i.test(url)) return url;
        return "";
    }

    function createAnnouncementItem(item, linkColor) {
        const text = String(item?.text || "").trim();
        if (!text) return null;
        const url = safeAnnouncementUrl(item?.url);
        const element = document.createElement(url ? "a" : "span");
        element.className = "promo-banner-text";
        element.textContent = text;
        if (url) {
            element.href = url;
            element.style.color = linkColor;
            if (/^https:\/\//i.test(url)) {
                element.target = "_blank";
                element.rel = "noopener noreferrer";
            }
        }
        return element;
    }

    function applyAnnouncementBar(settings) {
        const config = settings?.announcementBar || {};
        const items = Array.isArray(config.items) ? config.items.filter((item) => String(item?.text || "").trim()) : [];
        document.querySelectorAll(".promo-banner").forEach((banner) => {
            banner.hidden = config.enabled === false || items.length === 0;
            if (banner.hidden) return;
            banner.style.background = config.backgroundColor || "#71364F";
            banner.style.color = config.textColor || "#FFFFFF";
            banner.style.setProperty("--promo-duration", `${Math.max(6, Number(config.speedSeconds) || 22)}s`);
            let track = banner.querySelector(".promo-banner-track");
            if (!track) {
                track = document.createElement("div");
                track.className = "promo-banner-track";
                banner.appendChild(track);
            }
            track.replaceChildren();
            for (let copy = 0; copy < 2; copy += 1) {
                const loop = document.createElement("div");
                loop.className = "promo-banner-loop";
                if (copy === 1) loop.setAttribute("aria-hidden", "true");
                items.forEach((item) => {
                    const node = createAnnouncementItem(item, config.linkColor || config.textColor || "#FFFFFF");
                    if (node) loop.appendChild(node);
                });
                track.appendChild(loop);
            }
        });
    }


    function isProductMobileNavbarActions(selector) {
        // Conserva el nombre por compatibilidad. Desde v3.38.0,
        // el editor visual no desplaza las acciones del header en ningún móvil.
        return selector === ".site-header .navbar-actions"
            && window.matchMedia("(max-width: 820px)").matches;
    }

    function resetProductMobileNavbarActions(element) {
        if (!element) return;
        element.style.setProperty("translate", "0px 0px", "important");
        element.style.setProperty("transform", "none", "important");
        element.style.setProperty("position", "static", "important");
        element.style.setProperty("inset", "auto", "important");
        element.style.setProperty("margin", "0", "important");
    }

    function applyElementPosition(selector, value) {
        const isProductMobileActions = isProductMobileNavbarActions(selector);
        const offsetX = isProductMobileActions ? 0 : Number(value?.offsetX) || 0;
        const offsetY = isProductMobileActions ? 0 : Number(value?.offsetY) || 0;

        document.querySelectorAll(selector).forEach((element) => {
            element.style.setProperty("translate", `${offsetX}px ${offsetY}px`, "important");
            if (isProductMobileActions) resetProductMobileNavbarActions(element);
        });
    }

    function applyHeaderLayout(settings) {
        const layout = settings?.headerLayout || {};
        const groups = {
            social: layout.social,
            brand: layout.brand,
            support: layout.support,
            actions: layout.actions
        };

        for (const [name, value] of Object.entries(groups)) {
            const offsetX = Number(value?.offsetX) || 0;
            const offsetY = Number(value?.offsetY) || 0;
            document.documentElement.style.setProperty(`--mc-header-${name}-x`, `${offsetX}px`);
            document.documentElement.style.setProperty(`--mc-header-${name}-y`, `${offsetY}px`);
        }

        applyElementPosition(".container-hero .social-icons-header", layout.social);
        applyElementPosition(".container-hero .container-logo", layout.brand);
        applyElementPosition(".container-hero .customer-support", layout.support);
        applyElementPosition(".site-header .navbar-actions", layout.actions);
    }

    function apply(settings) {
        const colors = settings?.colors || {};
        applyAnnouncementBar(settings);
        applyHeaderLayout(settings);
        for (const [key, variable] of Object.entries(CSS_VARIABLES)) {
            if (colors[key]) document.documentElement.style.setProperty(variable, colors[key]);
        }

        const branding = settings?.branding;
        if (!branding?.logo || !branding?.title) return;

        document.querySelectorAll(".brand-link, .account-brand, .content-brand, .legal-brand")
            .forEach((container) => updateBrandContainer(container, branding, colors));

        document.querySelectorAll('link[rel~="icon"]').forEach((link) => {
            link.href = branding.logo.url;
        });

        document.dispatchEvent(new CustomEvent("site:settings-applied", { detail: settings }));
    }

    function markReady() {
        document.body?.classList.add("mc-site-settings-ready");
        document.documentElement.classList.add("mc-site-settings-ready");
    }

    function readCachedSettings() {
        try {
            const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function saveCachedSettings(settings) {
        try {
            localStorage.setItem(
                SETTINGS_CACHE_KEY,
                JSON.stringify(settings)
            );
        } catch {
            /* Cache visual opcional. */
        }
    }

    function applyCachedSettings() {
        const cached = readCachedSettings();
        if (!cached) return false;
        apply(cached);
        return true;
    }

    async function load() {
        const hadCache = applyCachedSettings();

        if (hadCache) {
            markReady();
        }

        try {
            const settings = window.API?.request
                ? await window.API.request("/configuracion-sitio", { timeoutMs: 30000 })
                : null;
            if (settings) {
                apply(settings);
                saveCachedSettings(settings);
            }
        } catch (error) {
            console.warn("No fue posible cargar la apariencia personalizada:", error);
        } finally {
            markReady();
        }
    }

    window.SiteSettings = Object.freeze({ apply, load, applyCachedSettings });
    document.addEventListener("DOMContentLoaded", load, { once: true });
})();
