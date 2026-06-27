"use strict";

(function () {
    const ACCOUNT_SECTIONS = [
        {
            id: "perfil",
            label: "Mis datos",
            icon: "fa-user"
        },
        {
            id: "seguridad-cuenta",
            label: "Seguridad",
            icon: "fa-shield-halved"
        },
        {
            id: "pedidos",
            label: "Mis pedidos",
            icon: "fa-bag-shopping"
        }
    ];

    function closeAccountMenuOnOutsideClick() {
        document.addEventListener("click", (event) => {
            document
                .querySelectorAll("details.customer-account-menu[open]")
                .forEach((menu) => {
                    if (!menu.contains(event.target)) {
                        menu.removeAttribute("open");
                    }
                });
        });

        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") return;

            document
                .querySelectorAll("details.customer-account-menu[open]")
                .forEach((menu) => menu.removeAttribute("open"));
        });
    }

    function initAccountHub() {
        const hub = document.querySelector(".account-dashboard-grid");

        if (!hub || hub.dataset.enhanced === "true") return;

        const sections = ACCOUNT_SECTIONS
            .map((item) => ({
                ...item,
                element: document.getElementById(item.id)
            }))
            .filter((item) => item.element);

        if (!sections.length) return;

        hub.dataset.enhanced = "true";
        hub.classList.add("account-hub");

        const nav = document.createElement("nav");
        nav.className = "account-hub-nav";
        nav.setAttribute("aria-label", "Secciones de mi cuenta");

        sections.forEach((item) => {
            const button = document.createElement("button");
            button.type = "button";
            button.dataset.accountTarget = item.id;
            button.innerHTML = `
                <i class="fa-solid ${item.icon}" aria-hidden="true"></i>
                <strong>${item.label}</strong>
                <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
            `;
            nav.appendChild(button);
        });

        hub.prepend(nav);

        function activate(id, updateHistory = true) {
            const requested = sections.find((item) => item.id === id) || sections[0];

            sections.forEach((item) => {
                const active = item.id === requested.id;
                item.element.hidden = !active;
                item.element.classList.toggle("is-active", active);
            });

            nav.querySelectorAll("[data-account-target]").forEach((button) => {
                const active = button.dataset.accountTarget === requested.id;
                button.classList.toggle("is-active", active);
                button.setAttribute("aria-current", active ? "page" : "false");
            });

            if (updateHistory) {
                history.replaceState(null, "", `#${requested.id}`);
            }
        }

        nav.addEventListener("click", (event) => {
            const button = event.target.closest("[data-account-target]");
            if (!button) return;

            activate(button.dataset.accountTarget);

            if (window.innerWidth <= 760) {
                hub.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });

        window.addEventListener("hashchange", () => {
            activate(location.hash.slice(1), false);
        });

        activate(location.hash.slice(1), false);
    }

    function keepActiveModalStepVisible() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type !== "attributes" || mutation.attributeName !== "class") {
                    return;
                }

                const step = mutation.target;
                if (!step.classList.contains("step") || !step.classList.contains("active")) {
                    return;
                }

                step.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center"
                });
            });
        });

        document.querySelectorAll(".modal-steps .step").forEach((step) => {
            observer.observe(step, { attributes: true });
        });
    }

    function markMobileViewport() {
        const media = window.matchMedia("(max-width: 760px)");

        const sync = () => {
            document.documentElement.classList.toggle("is-mobile-layout", media.matches);
        };

        sync();
        media.addEventListener?.("change", sync);
    }

    document.addEventListener("DOMContentLoaded", () => {
        closeAccountMenuOnOutsideClick();
        initAccountHub();
        keepActiveModalStepVisible();
        markMobileViewport();
    });
})();
