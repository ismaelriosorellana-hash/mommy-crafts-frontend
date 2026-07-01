"use strict";

(function () {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    function currentPageName() {
        const value = location.pathname.split("/").pop();
        return value || "index.html";
    }

    function markActiveNavigation() {
        const page = currentPageName();
        document.querySelectorAll("#main-menu a, .content-site-nav a, .account-header-links a")
            .forEach((link) => {
                const target = String(link.getAttribute("href") || "").split(/[?#]/)[0];
                if (!target || target === "#") return;
                const active = target === page || (page === "" && target === "index.html");
                link.classList.toggle("is-active", active);
                if (active) link.setAttribute("aria-current", "page");
            });
    }

    function updateHeaderState() {
        const header = document.querySelector(".site-header");
        if (!header) return;
        header.classList.toggle("is-scrolled", window.scrollY > 14);
    }

    function revealTargets() {
        const direct = [
            ".banner",
            ".theme-service-strip",
            ".theme-promo-grid",
            ".section-header",
            ".free-shipping-progress",
            ".catalog-heading",
            ".catalog-toolbar",
            ".product-detail-grid",
            ".cart-layout",
            ".checkout-heading",
            ".checkout-layout",
            ".content-hero-inner",
            ".content-section-card",
            ".account-hero",
            ".account-panel",
            ".account-auth-card",
            ".payment-result-card"
        ];
        const groups = [
            ".categories-grid",
            ".carousel-track",
            ".container-products",
            ".catalog-products-grid",
            ".container-features",
            ".theme-service-strip",
            ".theme-promo-grid",
            ".content-contact-cards",
            ".account-orders-list"
        ];

        direct.forEach((selector) => {
            document.querySelectorAll(selector).forEach((element) => element.classList.add("theme-reveal"));
        });
        groups.forEach((selector) => {
            document.querySelectorAll(selector).forEach((element) => element.classList.add("theme-reveal-group"));
        });
    }

    function observeReveals() {
        revealTargets();
        const items = document.querySelectorAll(".theme-reveal, .theme-reveal-group");
        if (!items.length) return;
        if (reducedMotion || !("IntersectionObserver" in window)) {
            items.forEach((item) => item.classList.add("theme-visible"));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("theme-visible");
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: "0px 0px -4%" });

        items.forEach((item) => observer.observe(item));
    }

    function observeDynamicContent() {
        const hosts = document.querySelectorAll([
            "#categories-grid",
            "#productos-tendencias",
            "#productos-mas-vendidos",
            "#productos-nuevos",
            "#catalog-products",
            "#related-products",
            "#cart-suggestions",
            "#cart-items",
            "#checkout-summary-items"
        ].join(","));

        if (!hosts.length || !("MutationObserver" in window)) return;

        const observer = new MutationObserver(() => {
            revealTargets();
            document.querySelectorAll(".theme-reveal-group:not(.theme-visible)")
                .forEach((element) => element.classList.add("theme-visible"));
        });

        hosts.forEach((host) => observer.observe(host, { childList: true, subtree: false }));
    }

    function addHeroDepth() {
        const banner = document.querySelector(".banner");
        if (!banner || reducedMotion || window.matchMedia("(max-width: 820px)").matches) return;

        banner.addEventListener("pointermove", (event) => {
            const rect = banner.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            banner.style.setProperty("--theme-hero-x", `${x * 7}px`);
            banner.style.setProperty("--theme-hero-y", `${y * 7}px`);
            const background = banner.querySelector(".banner-background");
            if (background) background.style.translate = `${x * 8}px ${y * 8}px`;
        });

        banner.addEventListener("pointerleave", () => {
            const background = banner.querySelector(".banner-background");
            if (background) background.style.translate = "0 0";
        });
    }

    function decorateExternalLinks() {
        document.querySelectorAll(".theme-promo-card a, .section-link").forEach((link) => {
            if (link.querySelector("span") || link.textContent.includes("→")) return;
            const arrow = document.createElement("span");
            arrow.className = "theme-link-arrow";
            arrow.setAttribute("aria-hidden", "true");
            arrow.textContent = "→";
            link.appendChild(arrow);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.body.classList.add("theme-playful-boutique");
        markActiveNavigation();
        updateHeaderState();
        observeReveals();
        observeDynamicContent();
        addHeroDepth();
        decorateExternalLinks();
        window.addEventListener("scroll", updateHeaderState, { passive: true });
    });
})();
