"use strict";
// customization-mobile-v3432

(function () {
    const MODAL_SELECTOR = "#modal-personalizar";
    const MOBILE_QUERY = "(max-width: 760px)";

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    const isMobile = () => window.matchMedia?.(MOBILE_QUERY)?.matches;

    function activeStep(modal) {
        return Number($(".modal-step-content.active", modal)?.dataset.stepContent || 1);
    }

    function scrollMobileModal(modal) {
        if (!isMobile() || !modal) return;

        const body = $(".modal-body-preview", modal) || $(".modal-body", modal);
        const step = activeStep(modal);
        const stepTab = $(`.modal-steps .step[data-step="${step}"]`, modal);

        window.requestAnimationFrame(() => {
            if (body && typeof body.scrollTo === "function") {
                body.scrollTo({ top: 0, left: 0, behavior: "auto" });
            }

            stepTab?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
        });
    }

    function markReady(modal) {
        if (!modal) return;
        modal.classList.add("mc-customization-mobile-stable");
        $$(".customization-category-grid, .customizable-products-grid, .option-grid, .color-options-grid", modal)
            .forEach((grid) => {
                grid.setAttribute("data-mobile-scroll", "free");
            });
    }

    function observe(modal) {
        const form = $(".customization-form", modal);
        if (!form || form.dataset.mcMobileObserved === "true") return;
        form.dataset.mcMobileObserved = "true";

        const observer = new MutationObserver(() => scrollMobileModal(modal));
        observer.observe(form, {
            subtree: true,
            attributes: true,
            attributeFilter: ["class", "hidden"]
        });
    }

    function bindOpen(modal) {
        if (modal.dataset.mcMobileStableBound === "true") return;
        modal.dataset.mcMobileStableBound = "true";

        const openObserver = new MutationObserver(() => {
            if (modal.getAttribute("aria-hidden") === "false" || modal.classList.contains("active")) {
                markReady(modal);
                scrollMobileModal(modal);
            }
        });

        openObserver.observe(modal, { attributes: true, attributeFilter: ["aria-hidden", "class"] });

        modal.addEventListener("click", (event) => {
            if (!isMobile()) return;
            const interactive = event.target.closest(".customization-category-card, .customizable-product-card, .option-card, .color-option-card, .customization-size-option, #btn-next, #btn-prev");
            if (!interactive) return;
            window.setTimeout(() => scrollMobileModal(modal), 90);
        }, true);
    }

    function init() {
        const modal = $(MODAL_SELECTOR);
        if (!modal) return;
        markReady(modal);
        observe(modal);
        bindOpen(modal);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
}());
