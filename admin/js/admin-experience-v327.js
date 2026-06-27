"use strict";

(function () {
    function collapseButton(label = "Mostrar u ocultar sección") {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "admin-card-collapse";
        button.setAttribute("aria-label", label);
        button.setAttribute("aria-expanded", "true");
        button.innerHTML = '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i>';
        return button;
    }

    function bindCollapse(card, button) {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const collapsed = card.classList.toggle("is-collapsed");
            button.setAttribute("aria-expanded", String(!collapsed));
        });
    }

    function enhanceDashboardCards() {
        if (document.body.dataset.adminPage !== "dashboard") return;

        document.querySelectorAll(".admin-card:not(.admin-metric)").forEach((card, index) => {
            if (card.dataset.collapsible === "true") return;
            const header = card.querySelector(":scope > .admin-card-header");
            if (!header) return;

            card.dataset.collapsible = "true";
            const button = collapseButton();
            if (index > 0) {
                card.classList.add("is-collapsed");
                button.setAttribute("aria-expanded", "false");
            }
            bindCollapse(card, button);
            header.appendChild(button);
        });
    }

    function enhanceContentSections() {
        const page = document.body.dataset.adminPage;
        if (!["contenido", "apariencia"].includes(page)) return;

        const selector = page === "contenido"
            ? ".admin-content-manager > .admin-grid .admin-card, .admin-content-manager > .content-editor-card"
            : "[data-settings-section]";
        const cards = document.querySelectorAll(selector);

        cards.forEach((card, index) => {
            if (card.dataset.collapsible === "true") return;
            const header = card.querySelector(":scope > .admin-card-header");
            if (!header) return;

            card.dataset.collapsible = "true";
            const button = collapseButton();
            const headerActions = header.querySelector(":scope > button, :scope > label");
            const controls = document.createElement("div");
            controls.className = "admin-card-header-controls";

            if (headerActions) {
                const movable = [...header.children].filter((child) => child !== header.firstElementChild);
                movable.forEach((child) => controls.appendChild(child));
            }
            controls.appendChild(button);
            header.appendChild(controls);

            if (index > 0) {
                card.classList.add("is-collapsed");
                button.setAttribute("aria-expanded", "false");
            }
            bindCollapse(card, button);
        });
    }

    function enhanceRepeatableCards() {
        if (document.body.dataset.adminPage !== "contenido") return;

        document.querySelectorAll(".admin-repeatable-card").forEach((card, index) => {
            if (card.dataset.collapsible === "true") return;
            const header = card.querySelector(":scope > .admin-repeatable-header");
            const actions = header?.querySelector(".admin-repeatable-actions");
            if (!header || !actions) return;

            card.dataset.collapsible = "true";
            const button = collapseButton("Mostrar u ocultar este elemento");
            button.classList.add("admin-repeatable-collapse");
            actions.insertBefore(button, actions.firstChild);

            if (index > 0) {
                card.classList.add("is-collapsed");
                button.setAttribute("aria-expanded", "false");
            }
            bindCollapse(card, button);
        });
    }

    function enhance() {
        // El menú lateral conserva siempre su ancho completo en escritorio.
        localStorage.removeItem("mc_admin_sidebar_compact");
        document.body.classList.remove("admin-sidebar-compact");
        enhanceDashboardCards();
        enhanceContentSections();
        enhanceRepeatableCards();
    }

    document.addEventListener("admin:ready", enhance);
    document.addEventListener("admin:content-rendered", enhanceRepeatableCards);
    document.addEventListener("DOMContentLoaded", () => {
        if (document.querySelector(".admin-shell")) enhance();
    });
})();
