"use strict";

(function () {
    const LOGO =
        "https://res.cloudinary.com/jo3bgrnh/image/upload/v1782320550/LOGO_MOMMY_CRAFTS_PNGG_mpgyfl.png";

    const pages = [
        {
            id: "dashboard",
            label: "Resumen",
            href: "index.html",
            icon: "fa-chart-pie"
        },
        {
            id: "productos",
            label: "Productos",
            href: "productos.html",
            icon: "fa-box-open"
        },
        {
            id: "pedidos",
            label: "Pedidos",
            href: "pedidos.html",
            icon: "fa-bag-shopping"
        },
        {
            id: "inventario",
            label: "Inventario",
            href: "inventario.html",
            icon: "fa-boxes-stacked"
        },
        {
            id: "reportes",
            label: "Reportes",
            href: "reportes.html",
            icon: "fa-chart-line"
        },
        {
            id: "banners",
            label: "Banners",
            href: "banners.html",
            icon: "fa-images"
        }
    ];

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function money(value) {
        return new Intl.NumberFormat(
            "es-CL",
            {
                style: "currency",
                currency: "CLP",
                maximumFractionDigits: 0
            }
        ).format(
            Number(value) || 0
        );
    }

    function dateTime(value) {
        if (!value) return "—";

        const date = new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "—";
        }

        return new Intl.DateTimeFormat(
            "es-CL",
            {
                dateStyle: "short",
                timeStyle: "short"
            }
        ).format(date);
    }

    function statusClass(status) {
        const value =
            String(status || "")
                .toLowerCase();

        if (
            [
                "pagado",
                "entregado",
                "activo",
                "confirmado",
                "listo"
            ].includes(value)
        ) {
            return "success";
        }

        if (
            [
                "pendiente",
                "en_produccion"
            ].includes(value)
        ) {
            return "warning";
        }

        if (
            [
                "cancelado",
                "rechazado",
                "agotado",
                "inactivo"
            ].includes(value)
        ) {
            return "danger";
        }

        return "info";
    }

    function toast(
        message,
        type = ""
    ) {
        let region =
            document.querySelector(
                ".admin-toast-region"
            );

        if (!region) {
            region =
                document.createElement(
                    "div"
                );

            region.className =
                "admin-toast-region";

            document.body.appendChild(
                region
            );
        }

        const item =
            document.createElement(
                "div"
            );

        item.className =
            `admin-toast ${type}`.trim();

        item.textContent =
            message;

        region.appendChild(item);

        window.setTimeout(
            () => item.remove(),
            3600
        );
    }

    function confirmAction(message) {
        return window.confirm(message);
    }

    function showLoading(
        container,
        message = "Cargando..."
    ) {
        container.innerHTML = `
            <div class="admin-empty">
                <span class="admin-loading">
                    <span class="admin-spinner"></span>
                    ${escapeHtml(message)}
                </span>
            </div>
        `;
    }

    function openModal(id) {
        const modal =
            document.getElementById(id);

        if (!modal) return;

        modal.hidden = false;
        document.body.style.overflow =
            "hidden";

        modal.querySelector(
            "input, select, textarea, button"
        )?.focus();
    }

    function closeModal(id) {
        const modal =
            document.getElementById(id);

        if (!modal) return;

        modal.hidden = true;
        document.body.style.overflow =
            "";
    }

    function bindModalClosers() {
        document.addEventListener(
            "click",
            (event) => {
                const close =
                    event.target.closest(
                        "[data-close-modal]"
                    );

                if (close) {
                    closeModal(
                        close.dataset.closeModal
                    );

                    return;
                }

                const modal =
                    event.target.classList
                        .contains(
                            "admin-modal"
                        )
                        ? event.target
                        : null;

                if (modal) {
                    closeModal(modal.id);
                }
            }
        );

        document.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key !== "Escape"
                ) {
                    return;
                }

                const modal =
                    document.querySelector(
                        ".admin-modal:not([hidden])"
                    );

                if (modal) {
                    closeModal(modal.id);
                }
            }
        );
    }

    function renderShell() {
        const page =
            document.body.dataset.adminPage ||
            "dashboard";

        const title =
            document.body.dataset.adminTitle ||
            "Administración";

        const user =
            AdminAPI.getUser();

        const nav =
            pages.map((item) => `
                <a
                    href="${item.href}"
                    class="${item.id === page ? "active" : ""}"
                >
                    <i class="fa-solid ${item.icon}" aria-hidden="true"></i>
                    <span>${item.label}</span>
                </a>
            `).join("");

        const content =
            document.getElementById(
                "admin-page-content"
            );

        if (!content) return;

        document.body.insertAdjacentHTML(
            "afterbegin",
            `
            <div class="admin-shell">
                <aside class="admin-sidebar">
                    <a class="admin-brand" href="index.html">
                        <img src="${LOGO}" alt="Mommy Crafts">
                        <div>
                            <strong>Mommy Crafts</strong>
                            <span>Panel administrador</span>
                        </div>
                    </a>

                    <nav class="admin-nav">
                        ${nav}
                    </nav>

                    <div class="admin-sidebar-footer">
                        <div class="admin-user-mini">
                            <strong>${escapeHtml(user?.nombre || "Administrador")}</strong>
                            <span>${escapeHtml(user?.email || "")}</span>
                            <button
                                class="admin-button secondary small"
                                id="admin-logout"
                                type="button"
                            >
                                <i class="fa-solid fa-right-from-bracket"></i>
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                </aside>

                <main class="admin-main">
                    <header class="admin-topbar">
                        <div style="display:flex;align-items:center;gap:12px">
                            <button
                                class="admin-mobile-menu"
                                id="admin-mobile-menu"
                                type="button"
                                aria-label="Abrir menú"
                            >
                                <i class="fa-solid fa-bars"></i>
                            </button>

                            <h1>${escapeHtml(title)}</h1>
                        </div>

                        <div class="admin-topbar-actions">
                            <a
                                href="../index.html"
                                class="admin-button secondary small"
                                target="_blank"
                            >
                                <i class="fa-solid fa-store"></i>
                                Ver tienda
                            </a>
                        </div>
                    </header>

                    <div class="admin-content" id="admin-content-slot"></div>
                </main>
            </div>
            `
        );

        document
            .getElementById(
                "admin-content-slot"
            )
            .appendChild(content);

        document
            .getElementById(
                "admin-logout"
            )
            ?.addEventListener(
                "click",
                () => {
                    AdminAPI.clearSession();
                    location.href =
                        "login.html";
                }
            );

        document
            .getElementById(
                "admin-mobile-menu"
            )
            ?.addEventListener(
                "click",
                () => {
                    document.body
                        .classList.toggle(
                            "admin-menu-open"
                        );
                }
            );

        document.addEventListener(
            "click",
            (event) => {
                if (
                    window.innerWidth >
                    820 ||
                    event.target.closest(
                        ".admin-mobile-menu"
                    ) ||
                    event.target.closest(
                        ".admin-sidebar"
                    )
                ) {
                    return;
                }

                document.body
                    .classList.remove(
                        "admin-menu-open"
                    );
            }
        );
    }

    async function guard() {
        if (!AdminAPI.getToken()) {
            location.replace(
                "login.html"
            );

            return false;
        }

        try {
            const data =
                await AdminAPI.me();

            AdminAPI.saveSession(
                AdminAPI.getToken(),
                data.usuario
            );

            return true;
        } catch {
            return false;
        }
    }

    async function init() {
        const authorized =
            await guard();

        if (!authorized) return;

        renderShell();
        bindModalClosers();

        document.dispatchEvent(
            new CustomEvent(
                "admin:ready"
            )
        );
    }

    window.AdminUI =
        Object.freeze({
            escapeHtml,
            money,
            dateTime,
            statusClass,
            toast,
            confirmAction,
            showLoading,
            openModal,
            closeModal
        });

    document.addEventListener(
        "DOMContentLoaded",
        init
    );
})();
