"use strict";

(function () {
    const STORAGE_KEY = "mc_admin_sidebar_compact";

    function enhanceSidebar() {
        const topbar = document.querySelector(".admin-topbar > div:first-child");
        if (!topbar || document.querySelector(".admin-sidebar-toggle")) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "admin-sidebar-toggle";
        button.setAttribute("aria-label", "Alternar tamaño del menú lateral");
        button.innerHTML = '<i class="fa-solid fa-angles-left" aria-hidden="true"></i>';

        const compact = localStorage.getItem(STORAGE_KEY) === "1";
        document.body.classList.toggle("admin-sidebar-compact", compact);
        button.setAttribute("aria-pressed", String(compact));

        button.addEventListener("click", () => {
            const next = !document.body.classList.contains("admin-sidebar-compact");
            document.body.classList.toggle("admin-sidebar-compact", next);
            button.setAttribute("aria-pressed", String(next));
            localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
        });

        topbar.insertBefore(button, topbar.querySelector("h1"));
    }

    function enhanceDashboardCards() {
        if (document.body.dataset.adminPage !== "dashboard") return;

        document
            .querySelectorAll(".admin-card:not(.admin-metric)")
            .forEach((card, index) => {
                if (card.dataset.collapsible === "true") return;

                const header = card.querySelector(":scope > .admin-card-header");
                if (!header) return;

                card.dataset.collapsible = "true";

                const button = document.createElement("button");
                button.type = "button";
                button.className = "admin-card-collapse";
                button.setAttribute("aria-label", "Mostrar u ocultar sección");
                button.setAttribute("aria-expanded", index === 0 ? "true" : "false");
                button.innerHTML = '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i>';

                if (index > 0) {
                    card.classList.add("is-collapsed");
                }

                button.addEventListener("click", () => {
                    const collapsed = card.classList.toggle("is-collapsed");
                    button.setAttribute("aria-expanded", String(!collapsed));
                });

                header.appendChild(button);
            });
    }

    function enhance() {
        enhanceSidebar();
        enhanceDashboardCards();
    }

    document.addEventListener("admin:ready", enhance);
    document.addEventListener("DOMContentLoaded", () => {
        if (document.querySelector(".admin-shell")) enhance();
    });
})();
