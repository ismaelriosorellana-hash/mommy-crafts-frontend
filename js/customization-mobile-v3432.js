"use strict";
// Mommy Crafts · Personalización móvil estable v3.43.3
// Corrige congelamiento: elimina observer continuo y evita scroll smooth repetido.

(function () {
    const MODAL_SELECTOR = "#modal-personalizar";
    const MOBILE_QUERY = "(max-width: 760px)";

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    const isMobile = () => window.matchMedia?.(MOBILE_QUERY)?.matches;

    let pendingScroll = 0;

    function getActiveStep(modal) {
        return Number($(".modal-step-content.active", modal)?.dataset.stepContent || 1);
    }

    function getScrollContainer(modal) {
        return $(".modal-body-preview", modal) || $(".modal-body", modal);
    }

    function markReady(modal) {
        if (!modal) return;
        modal.classList.add("mc-customization-mobile-stable");
        $$(".customization-category-grid, .customizable-products-grid, .option-grid, .color-options-grid, .color-selection-grid, #color-selection-area", modal)
            .forEach((grid) => grid.setAttribute("data-mobile-scroll", "free"));
    }

    function scrollToStepTop(modal) {
        if (!isMobile() || !modal) return;
        window.clearTimeout(pendingScroll);
        pendingScroll = window.setTimeout(() => {
            const body = getScrollContainer(modal);
            const step = getActiveStep(modal);
            const stepTab = $(`.modal-steps .step[data-step="${step}"]`, modal);

            if (body && typeof body.scrollTo === "function") {
                body.scrollTo({ top: 0, left: 0, behavior: "auto" });
            }

            if (stepTab && typeof stepTab.scrollIntoView === "function") {
                stepTab.scrollIntoView({ inline: "center", block: "nearest", behavior: "auto" });
            }
        }, 80);
    }

    function bindStepButtons(modal) {
        if (modal.dataset.mcMobileStepButtonsBound === "true") return;
        modal.dataset.mcMobileStepButtonsBound = "true";

        ["btn-next", "btn-prev", "btn-editar"].forEach((id) => {
            const button = document.getElementById(id);
            if (!button) return;
            button.addEventListener("click", () => scrollToStepTop(modal));
        });

        modal.addEventListener("click", (event) => {
            if (!isMobile()) return;
            const card = event.target.closest(".customization-category-card, .customizable-product-card, .option-card, .color-option-card, .customization-size-option, .step");
            if (!card) return;
            scrollToStepTop(modal);
        });
    }

    function bindOpenState(modal) {
        if (modal.dataset.mcMobileOpenBound === "true") return;
        modal.dataset.mcMobileOpenBound = "true";

        const observer = new MutationObserver(() => {
            const isOpen = modal.getAttribute("aria-hidden") === "false" || modal.classList.contains("active");
            if (!isOpen || !isMobile()) return;
            markReady(modal);
            scrollToStepTop(modal);
        });

        observer.observe(modal, { attributes: true, attributeFilter: ["aria-hidden", "class"] });
    }

    function init() {
        const modal = $(MODAL_SELECTOR);
        if (!modal) return;
        markReady(modal);
        bindStepButtons(modal);
        bindOpenState(modal);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
}());
