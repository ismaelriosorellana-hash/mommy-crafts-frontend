"use strict";

(function () {
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

    function apply(settings) {
        const colors = settings?.colors || {};
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

    async function load() {
        try {
            const settings = window.API?.request
                ? await window.API.request("/configuracion-sitio", { timeoutMs: 30000 })
                : null;
            if (settings) apply(settings);
        } catch (error) {
            console.warn("No fue posible cargar la apariencia personalizada:", error);
        }
    }

    window.SiteSettings = Object.freeze({ apply, load });
    document.addEventListener("DOMContentLoaded", load, { once: true });
})();
