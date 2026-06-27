"use strict";

document.addEventListener(
    "admin:ready",
    () => {
        const refresh =
            document.getElementById(
                "dashboard-refresh"
            );

        refresh?.addEventListener(
            "click",
            loadDashboard
        );

        bindSecurityControls();
        loadDashboard();
    }
);


function setSecurityMessage(
    element,
    message
) {
    if (!element) return;

    element.hidden =
        !message;

    element.textContent =
        message || "";
}

function bindSecurityControls() {
    const form =
        document.getElementById(
            "admin-password-form"
        );

    const errorBox =
        document.getElementById(
            "admin-password-error"
        );

    const successBox =
        document.getElementById(
            "admin-password-success"
        );

    const revokeButton =
        document.getElementById(
            "admin-revoke-sessions"
        );

    form?.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const currentPassword =
                document.getElementById(
                    "admin-password-current"
                ).value;

            const newPassword =
                document.getElementById(
                    "admin-password-new"
                ).value;

            const confirmation =
                document.getElementById(
                    "admin-password-confirm"
                ).value;

            const button =
                document.getElementById(
                    "admin-password-submit"
                );

            setSecurityMessage(
                errorBox,
                ""
            );

            setSecurityMessage(
                successBox,
                ""
            );

            if (
                newPassword !==
                confirmation
            ) {
                setSecurityMessage(
                    errorBox,
                    "La confirmación no coincide con la nueva contraseña."
                );

                return;
            }

            button.disabled =
                true;

            const original =
                button.innerHTML;

            button.textContent =
                "Actualizando...";

            try {
                const data =
                    await AdminAPI
                        .changePassword(
                            currentPassword,
                            newPassword
                        );

                AdminAPI.saveSession(
                    data.token,
                    data.usuario
                );

                form.reset();

                setSecurityMessage(
                    successBox,
                    data.mensaje ||
                    "La contraseña se actualizó correctamente."
                );

                AdminUI.toast(
                    "Contraseña actualizada.",
                    "success"
                );
            } catch (error) {
                setSecurityMessage(
                    errorBox,
                    error.message
                );
            } finally {
                button.disabled =
                    false;

                button.innerHTML =
                    original;
            }
        }
    );

    revokeButton?.addEventListener(
        "click",
        async () => {
            const confirmed =
                window.confirm(
                    "Se cerrarán todas las sesiones administrativas, incluida la actual. ¿Continuar?"
                );

            if (!confirmed) return;

            revokeButton.disabled =
                true;

            revokeButton.textContent =
                "Cerrando sesiones...";

            try {
                await AdminAPI
                    .revokeSessions();

                AdminAPI.clearSession();

                location.replace(
                    "login.html?sesion=revocada"
                );
            } catch (error) {
                setSecurityMessage(
                    errorBox,
                    error.message
                );

                revokeButton.disabled =
                    false;

                revokeButton.innerHTML = `
                    <i class="fa-solid fa-user-lock" aria-hidden="true"></i>
                    Cerrar todas las sesiones
                `;
            }
        }
    );
}

async function loadDashboard() {
    const ordersContainer =
        document.getElementById(
            "dashboard-orders"
        );

    const stockContainer =
        document.getElementById(
            "dashboard-stock"
        );

    AdminUI.showLoading(
        ordersContainer
    );

    AdminUI.showLoading(
        stockContainer
    );

    try {
        const [
            metrics,
            orders,
            lowStock
        ] = await Promise.all([
            AdminAPI.request(
                "/admin/dashboard"
            ),
            AdminAPI.request(
                "/admin/pedidos"
            ),
            AdminAPI.request(
                "/admin/inventario/stock-bajo"
            )
        ]);

        document.getElementById(
            "metric-sales"
        ).textContent =
            AdminUI.money(
                metrics.ventasHoy
            );

        document.getElementById(
            "metric-pending"
        ).textContent =
            metrics.pedidosPendientes ||
            0;

        document.getElementById(
            "metric-orders"
        ).textContent =
            metrics.pedidosHoy || 0;

        document.getElementById(
            "metric-low-stock"
        ).textContent =
            metrics.stockBajo || 0;

        renderRecentOrders(
            Array.isArray(orders)
                ? orders.slice(0, 6)
                : []
        );

        renderLowStock(
            lowStock.productos || []
        );
    } catch (error) {
        ordersContainer.innerHTML = `
            <div class="admin-empty">
                ${AdminUI.escapeHtml(
                    error.message
                )}
            </div>
        `;

        stockContainer.innerHTML = `
            <div class="admin-empty">
                No fue posible cargar las alertas.
            </div>
        `;

        AdminUI.toast(
            error.message,
            "error"
        );
    }
}

function renderRecentOrders(orders) {
    const container =
        document.getElementById(
            "dashboard-orders"
        );

    if (!orders.length) {
        container.innerHTML = `
            <div class="admin-empty">
                Todavía no hay pedidos registrados.
            </div>
        `;

        return;
    }

    container.innerHTML = orders
        .map((order) => `
            <a
                href="pedidos.html?id=${encodeURIComponent(order._id)}"
                style="
                    display:flex;
                    justify-content:space-between;
                    gap:14px;
                    padding:12px 0;
                    border-bottom:1px solid var(--admin-border)
                "
            >
                <div>
                    <strong>${AdminUI.escapeHtml(order.numeroPedido)}</strong>
                    <div style="margin-top:4px;color:var(--admin-muted);font-size:.84rem">
                        ${AdminUI.escapeHtml(order.cliente?.nombre || "Cliente")} ·
                        ${AdminUI.dateTime(order.createdAt)}
                    </div>
                </div>

                <div style="text-align:right">
                    <strong>${AdminUI.money(order.total)}</strong>
                    <div style="margin-top:5px">
                        <span class="admin-status ${AdminUI.statusClass(order.estadoPedido)}">
                            ${AdminUI.escapeHtml(
                                String(order.estadoPedido || "")
                                    .replaceAll("_", " ")
                            )}
                        </span>
                    </div>
                </div>
            </a>
        `)
        .join("");
}

function renderLowStock(products) {
    const container =
        document.getElementById(
            "dashboard-stock"
        );

    if (!products.length) {
        container.innerHTML = `
            <div class="admin-empty">
                No hay productos con stock bajo.
            </div>
        `;

        return;
    }

    container.innerHTML = products
        .slice(0, 8)
        .map((product) => `
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:12px;
                padding:11px 0;
                border-bottom:1px solid var(--admin-border)
            ">
                <div>
                    <strong>${AdminUI.escapeHtml(product.nombre)}</strong>
                    <div style="margin-top:3px;color:var(--admin-muted);font-size:.83rem">
                        ${AdminUI.escapeHtml(product.categoriaPrincipal || "Sin categoría")}
                    </div>
                </div>

                <span class="admin-status ${Number(product.stock) === 0 ? "danger" : "warning"}">
                    ${Number(product.stock) || 0} unidades
                </span>
            </div>
        `)
        .join("");
}
