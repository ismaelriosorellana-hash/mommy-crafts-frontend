"use strict";

(function () {
    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function money(value) {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }

    function dateTime(value) {
        if (!value) return "—";
        return new Intl.DateTimeFormat("es-CL", {
            dateStyle: "medium",
            timeStyle: "short"
        }).format(new Date(value));
    }

    function statusLabel(value) {
        const labels = {
            pendiente: "Pendiente",
            confirmado: "Confirmado",
            en_produccion: "En producción",
            listo: "Listo para entrega",
            enviado: "Enviado",
            entregado: "Entregado",
            cancelado: "Cancelado",
            pagado: "Pagado",
            rechazado: "Pago rechazado",
            reembolsado: "Reembolsado"
        };
        return labels[value] || value || "Pendiente";
    }

    function showAlert(element, message, success = false) {
        if (!element) return;
        element.hidden = !message;
        element.textContent = message || "";
        element.classList.toggle("success", success);
    }

    function nextUrl() {
        const params = new URLSearchParams(location.search);
        const candidate = params.get("next") || "cuenta.html";

        if (
            candidate.startsWith("//") ||
            candidate.includes("..") ||
            !/^[a-z0-9][a-z0-9._/-]*(?:\?[^#]*)?(?:#.*)?$/i.test(candidate)
        ) {
            return "cuenta.html";
        }

        return candidate;
    }

    function initAccess() {
        if (CustomerAuth.getToken() && CustomerAuth.getUser()?.rol === "cliente") {
            location.replace(nextUrl());
            return;
        }

        const tabs = document.querySelectorAll("[data-auth-tab]");
        const loginPanel = document.getElementById("login-panel");
        const registerPanel = document.getElementById("register-panel");

        function select(mode) {
            const registration = mode === "registro";
            loginPanel.hidden = registration;
            registerPanel.hidden = !registration;
            tabs.forEach((tab) => {
                tab.classList.toggle(
                    "active",
                    tab.dataset.authTab === mode
                );
            });
        }

        tabs.forEach((tab) => {
            tab.addEventListener("click", () => select(tab.dataset.authTab));
        });

        const accessParams = new URLSearchParams(location.search);
        select(accessParams.get("modo") === "registro" ? "registro" : "login");

        if (accessParams.get("sesion") === "revocada") {
            showAlert(
                document.getElementById("login-error"),
                "Todas las sesiones fueron cerradas. Inicia sesión nuevamente.",
                true
            );
        }

        if (accessParams.get("sesion") === "expirada") {
            showAlert(
                document.getElementById("login-error"),
                "La sesión expiró o dejó de ser válida. Inicia sesión nuevamente."
            );
        }

        document.getElementById("customer-login-form")
            ?.addEventListener("submit", async (event) => {
                event.preventDefault();
                const button = document.getElementById("customer-login-submit");
                const errorBox = document.getElementById("login-error");
                showAlert(errorBox, "");
                button.disabled = true;
                button.textContent = "Ingresando...";

                try {
                    await CustomerAuth.login(
                        document.getElementById("customer-login-email").value.trim(),
                        document.getElementById("customer-login-password").value
                    );
                    location.replace(nextUrl());
                } catch (error) {
                    showAlert(errorBox, error.message);
                } finally {
                    button.disabled = false;
                    button.textContent = "Iniciar sesión";
                }
            });

        document.getElementById("customer-register-form")
            ?.addEventListener("submit", async (event) => {
                event.preventDefault();
                const button = document.getElementById("customer-register-submit");
                const errorBox = document.getElementById("register-error");
                const password = document.getElementById("customer-register-password").value;
                const confirmation = document.getElementById("customer-register-confirm").value;
                showAlert(errorBox, "");

                if (password !== confirmation) {
                    showAlert(errorBox, "Las contraseñas no coinciden.");
                    return;
                }

                button.disabled = true;
                button.textContent = "Creando cuenta...";

                try {
                    await CustomerAuth.register({
                        nombre: document.getElementById("customer-register-name").value.trim(),
                        email: document.getElementById("customer-register-email").value.trim(),
                        telefono: document.getElementById("customer-register-phone").value.trim(),
                        password
                    });
                    location.replace(nextUrl());
                } catch (error) {
                    showAlert(errorBox, error.message);
                } finally {
                    button.disabled = false;
                    button.textContent = "Crear mi cuenta";
                }
            });
    }

    function orderCard(order) {
        return `
            <article class="account-order-card">
                <div>
                    <h3>${escapeHtml(order.numeroPedido)}</h3>
                    <div class="account-order-meta">
                        <span><i class="fa-regular fa-calendar"></i> ${dateTime(order.fecha)}</span>
                        <span><i class="fa-solid fa-box"></i> ${Number(order.cantidadProductos) || 0} producto(s)</span>
                        <span><i class="fa-solid fa-truck"></i> ${order.metodoEntrega === "retiro" ? "Retiro" : "Envío"}</span>
                    </div>
                    <p>
                        <span class="account-status">${statusLabel(order.estadoPedido)}</span>
                        <span class="account-status">${statusLabel(order.estadoPago)}</span>
                    </p>
                </div>
                <div class="account-order-total">
                    <strong>${money(order.total)}</strong>
                    <a class="btn-secondary" href="pedido.html?id=${encodeURIComponent(order.id)}">Ver detalle</a>
                    ${order.puedePagar ? `
                        <button class="btn-primary customer-pay-button" type="button" data-pay-order="${escapeHtml(order.id)}">
                            Pagar con Mercado Pago
                        </button>
                    ` : ""}
                </div>
            </article>
        `;
    }

    async function initAccount() {
        if (!CustomerAuth.requireCustomer()) return;

        const list = document.getElementById("customer-orders-list");
        const form = document.getElementById("customer-profile-form");
        const errorBox = document.getElementById("profile-error");
        const successBox = document.getElementById("profile-success");
        const passwordForm = document.getElementById("customer-password-form");
        const passwordError = document.getElementById("password-error");
        const passwordSuccess = document.getElementById("password-success");
        const revokeButton = document.getElementById("customer-revoke-sessions");

        try {
            const [user, ordersData] = await Promise.all([
                CustomerAuth.getProfile(),
                CustomerAuth.getOrders()
            ]);

            document.getElementById("account-welcome").textContent =
                `Hola, ${String(user.nombre).split(/\s+/)[0]}`;
            document.getElementById("profile-email").textContent = user.email;
            document.getElementById("profile-name").value = user.nombre || "";
            document.getElementById("profile-rut").value = user.rut || "";
            document.getElementById("profile-phone").value = user.telefono || "";
            document.getElementById("profile-address").value = user.direccion || "";
            document.getElementById("profile-commune").value = user.comuna || "";

            const orders = ordersData.pedidos || [];
            list.innerHTML = orders.length
                ? orders.map(orderCard).join("")
                : `
                    <div class="account-empty">
                        <i class="fa-solid fa-bag-shopping"></i>
                        <p>Todavía no tienes pedidos vinculados a esta cuenta.</p>
                        <a class="btn-primary" href="catalogo.html">Explorar productos</a>
                    </div>
                `;

            list.addEventListener("click", async (event) => {
                const button = event.target.closest("[data-pay-order]");
                if (!button) return;

                button.disabled = true;
                const original = button.textContent;
                button.textContent = "Preparando pago...";

                try {
                    const result = await CustomerAuth.createPaymentPreference(
                        button.dataset.payOrder
                    );
                    location.href = result.checkoutUrl;
                } catch (error) {
                    alert(error.message || "No fue posible iniciar el pago.");
                    button.disabled = false;
                    button.textContent = original;
                }
            }, { once: true });
        } catch (error) {
            if (error.status === 401) {
                location.replace("acceso.html?modo=login&sesion=expirada");
                return;
            }
            list.innerHTML = `<div class="account-alert">${escapeHtml(error.message)}</div>`;
        }

        form?.addEventListener("submit", async (event) => {
            event.preventDefault();
            const button = document.getElementById("profile-submit");
            showAlert(errorBox, "");
            showAlert(successBox, "");
            button.disabled = true;
            button.textContent = "Guardando...";

            try {
                const user = await CustomerAuth.updateProfile({
                    nombre: document.getElementById("profile-name").value.trim(),
                    rut: document.getElementById("profile-rut").value.trim(),
                    telefono: document.getElementById("profile-phone").value.trim(),
                    direccion: document.getElementById("profile-address").value.trim(),
                    comuna: document.getElementById("profile-commune").value.trim()
                });
                document.getElementById("account-welcome").textContent =
                    `Hola, ${String(user.nombre).split(/\s+/)[0]}`;
                showAlert(successBox, "Tus datos se guardaron correctamente.", true);
            } catch (error) {
                showAlert(errorBox, error.message);
            } finally {
                button.disabled = false;
                button.textContent = "Guardar cambios";
            }
        });

        passwordForm?.addEventListener("submit", async (event) => {
            event.preventDefault();

            const currentPassword =
                document.getElementById("password-current").value;

            const newPassword =
                document.getElementById("password-new").value;

            const confirmation =
                document.getElementById("password-confirm").value;

            const button =
                document.getElementById("password-submit");

            showAlert(passwordError, "");
            showAlert(passwordSuccess, "");

            if (newPassword !== confirmation) {
                showAlert(
                    passwordError,
                    "La confirmación no coincide con la nueva contraseña."
                );
                return;
            }

            button.disabled = true;
            button.textContent = "Actualizando...";

            try {
                const data = await CustomerAuth.changePassword(
                    currentPassword,
                    newPassword
                );

                passwordForm.reset();

                showAlert(
                    passwordSuccess,
                    data.mensaje ||
                        "La contraseña se actualizó correctamente.",
                    true
                );
            } catch (error) {
                showAlert(
                    passwordError,
                    error.message
                );
            } finally {
                button.disabled = false;
                button.textContent = "Cambiar contraseña";
            }
        });

        revokeButton?.addEventListener("click", async () => {
            const confirmed = window.confirm(
                "Se cerrarán todas las sesiones de esta cuenta, incluida la actual. ¿Continuar?"
            );

            if (!confirmed) return;

            revokeButton.disabled = true;
            revokeButton.textContent = "Cerrando sesiones...";

            try {
                await CustomerAuth.revokeSessions();
                location.replace("acceso.html?modo=login&sesion=revocada");
            } catch (error) {
                showAlert(
                    passwordError,
                    error.message
                );
                revokeButton.disabled = false;
                revokeButton.textContent = "Cerrar todas mis sesiones";
            }
        });
    }

    function customizationBlock(customization) {
        if (!customization || typeof customization !== "object") return "";
        const preview =
            customization.assets?.finalPreview?.secureUrl ||
            customization.assets?.finalPreview?.url ||
            customization.finalPreviewUrl ||
            "";
        const mainText =
            customization.texts?.main?.value ||
            customization.mainText ||
            "";

        return `
            <div>
                <p><strong>Personalización</strong></p>
                ${mainText ? `<p>Texto: ${escapeHtml(mainText)}</p>` : ""}
                ${preview ? `<img class="customer-personalization-preview" src="${escapeHtml(preview)}" alt="Vista previa de la personalización">` : ""}
            </div>
        `;
    }

    function itemBlock(item) {
        return `
            <article class="customer-order-item">
                <img src="${escapeHtml(item.imagen || CONFIG.placeholderImage)}" alt="${escapeHtml(item.nombre)}">
                <div>
                    <h3>${escapeHtml(item.nombre)}</h3>
                    <p>Cantidad: ${Number(item.cantidad) || 1}</p>
                    ${item.color ? `<p>Color: ${escapeHtml(item.color)}</p>` : ""}
                    ${customizationBlock(item.personalizacion)}
                </div>
                <strong>${money(item.subtotal)}</strong>
            </article>
        `;
    }

    async function initOrder() {
        if (!CustomerAuth.requireCustomer()) return;
        const id = new URLSearchParams(location.search).get("id");
        const container = document.getElementById("customer-order-detail");

        if (!id) {
            container.innerHTML = '<section class="account-detail-card"><p>Falta el identificador del pedido.</p></section>';
            return;
        }

        try {
            const data = await CustomerAuth.getOrder(id);
            const order = data.pedido;
            document.getElementById("customer-order-title").textContent = order.numeroPedido;
            document.getElementById("customer-order-date").textContent = `Creado el ${dateTime(order.createdAt)}`;

            const history = Array.isArray(order.historial) ? order.historial : [];
            container.innerHTML = `
                <section class="account-detail-card">
                    <h2>Productos</h2>
                    ${(order.items || []).map(itemBlock).join("")}
                </section>
                <aside>
                    <section class="account-detail-card">
                        <h2>Resumen</h2>
                        <p>Estado: <span class="account-status">${statusLabel(order.estadoPedido)}</span></p>
                        <p>Pago: <span class="account-status">${statusLabel(order.estadoPago)}</span></p>
                        <p>Entrega: <strong>${order.entrega?.metodo === "retiro" ? "Retiro" : "Envío"}</strong></p>
                        ${order.entrega?.metodo === "envio" ? `<p>${escapeHtml(order.entrega?.direccion || "")}, ${escapeHtml(order.entrega?.comuna || "")}</p>` : ""}
                        <p>Subtotal: <strong>${money(order.subtotal)}</strong></p>
                        <p>Total: <strong>${money(order.total)}</strong></p>
                        ${order.metodoPago === "mercadopago" && order.estadoPago !== "pagado" && order.estadoPedido !== "cancelado" ? `
                            <button class="btn-primary customer-pay-button" id="customer-retry-payment" type="button">
                                Pagar con Mercado Pago
                            </button>
                        ` : ""}
                    </section>
                    <section class="account-detail-card" style="margin-top:1.6rem">
                        <h2>Seguimiento</h2>
                        <div class="account-timeline">
                            ${history.length ? history.slice().reverse().map((entry) => `
                                <div class="account-timeline-entry">
                                    <strong>${statusLabel(entry.estado)}</strong>
                                    ${entry.detalle ? `<p>${escapeHtml(entry.detalle)}</p>` : ""}
                                    <span>${dateTime(entry.fecha)}</span>
                                </div>
                            `).join("") : "<p>El pedido todavía no tiene actualizaciones.</p>"}
                        </div>
                    </section>
                </aside>
            `;

            document.getElementById("customer-retry-payment")
                ?.addEventListener("click", async (event) => {
                    const button = event.currentTarget;
                    button.disabled = true;
                    button.textContent = "Preparando pago...";

                    try {
                        const result = await CustomerAuth.createPaymentPreference(id);
                        location.href = result.checkoutUrl;
                    } catch (error) {
                        alert(error.message || "No fue posible iniciar el pago.");
                        button.disabled = false;
                        button.textContent = "Pagar con Mercado Pago";
                    }
                });
        } catch (error) {
            container.innerHTML = `<section class="account-detail-card"><div class="account-alert">${escapeHtml(error.message)}</div></section>`;
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        const page = document.body.dataset.accountPage;
        if (page === "access") initAccess();
        if (page === "account") initAccount();
        if (page === "order") initOrder();
    });
})();
