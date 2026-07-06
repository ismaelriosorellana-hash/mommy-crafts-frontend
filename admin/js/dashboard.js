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
            lowStock,
            notifications,
            launchSecurity
        ] = await Promise.all([
            AdminAPI.request(
                "/admin/dashboard"
            ),
            AdminAPI.request(
                "/admin/pedidos"
            ),
            AdminAPI.request(
                "/admin/inventario/stock-bajo"
            ),
            AdminAPI.request(
                "/admin/notificaciones/estado"
            ).catch((error) => ({
                error: error.message
            })),
            AdminAPI.request(
                "/admin/seguridad/estado"
            ).catch((error) => ({
                error: error.message
            }))
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

        renderSystemStatus(
            metrics.sistema || null
        );

        renderNotificationStatus(
            notifications || null
        );

        renderLaunchSecurityStatus(
            launchSecurity || null
        );

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

function formatUptime(seconds) {
    const total =
        Number(seconds) ||
        0;

    const hours =
        Math.floor(total / 3600);

    const minutes =
        Math.floor((total % 3600) / 60);

    if (hours > 0) {
        return `${hours} h ${minutes} min`;
    }

    return `${minutes} min`;
}

function renderSystemStatus(system) {
    const apiStatus =
        document.getElementById(
            "metric-api-status"
        );

    const dbStatus =
        document.getElementById(
            "metric-db-status"
        );

    const backendVersion =
        document.getElementById(
            "metric-backend-version"
        );

    const frontendVersion =
        document.getElementById(
            "metric-frontend-version"
        );

    const detail =
        document.getElementById(
            "metric-system-detail"
        );

    if (!apiStatus || !dbStatus || !backendVersion || !frontendVersion || !detail) {
        return;
    }

    if (!system) {
        apiStatus.textContent =
            "Sin datos";
        dbStatus.textContent =
            "Sin datos";
        backendVersion.textContent =
            "--";
        frontendVersion.textContent =
            CONFIG.APP_VERSION ||
            "--";
        detail.textContent =
            "No fue posible leer el estado técnico desde el backend.";
        return;
    }

    const database =
        system.database ||
        {};

    apiStatus.textContent =
        "Operativa";

    dbStatus.textContent =
        database.ok
            ? "Conectada"
            : String(
                database.estado ||
                "Revisar"
            );

    backendVersion.textContent =
        system.version ||
        "--";

    frontendVersion.textContent =
        CONFIG.APP_VERSION ||
        "--";

    detail.textContent =
        `Entorno: ${system.entorno || "sin dato"}. ` +
        `API activa hace ${formatUptime(system.uptimeSegundos)}. ` +
        `Última revisión: ${AdminUI.dateTime(system.fecha)}.`;
}

function renderNotificationStatus(data) {
    const emailStatus =
        document.getElementById(
            "metric-notification-email"
        );

    const provider =
        document.getElementById(
            "metric-notification-provider"
        );

    const adminEmail =
        document.getElementById(
            "metric-notification-admin"
        );

    const whatsapp =
        document.getElementById(
            "metric-notification-whatsapp"
        );

    const detail =
        document.getElementById(
            "metric-notification-detail"
        );

    if (!emailStatus || !provider || !adminEmail || !whatsapp || !detail) {
        return;
    }

    if (!data || data.error) {
        emailStatus.textContent =
            "Sin datos";
        provider.textContent =
            "--";
        adminEmail.textContent =
            "--";
        whatsapp.textContent =
            "--";
        detail.textContent =
            data?.error ||
            "No fue posible leer el estado de notificaciones.";
        return;
    }

    const status =
        data.estado ||
        {};

    emailStatus.textContent =
        status.configured
            ? "Operativo"
            : status.enabled === false
                ? "Desactivado"
                : "Pendiente";

    provider.textContent =
        status.provider ||
        "--";

    adminEmail.textContent =
        status.adminEmailConfigured
            ? "Configurado"
            : "No configurado";

    whatsapp.textContent =
        status.whatsappSupportConfigured
            ? "Configurado"
            : "Manual";

    const from =
        status.fromMasked
            ? ` Remitente: ${status.fromMasked}.`
            : "";

    const adminCopies =
        Array.isArray(status.adminEmailsMasked) && status.adminEmailsMasked.length
            ? ` Avisos internos: ${status.adminEmailsMasked.join(", ")}.`
            : "";

    detail.textContent =
        `${status.mensaje || "Estado de notificaciones revisado."}${from}${adminCopies}`;
}


function launchStatusLabel(value) {
    if (value === "listo") {
        return "Listo";
    }

    if (value === "con_observaciones") {
        return "Con observaciones";
    }

    if (value === "bloqueado") {
        return "Revisar críticos";
    }

    return "Sin datos";
}

function renderLaunchSecurityStatus(data) {
    const statusEl =
        document.getElementById(
            "metric-launch-status"
        );

    const criticalEl =
        document.getElementById(
            "metric-launch-critical"
        );

    const warningsEl =
        document.getElementById(
            "metric-launch-warnings"
        );

    const okEl =
        document.getElementById(
            "metric-launch-ok"
        );

    const detail =
        document.getElementById(
            "metric-launch-detail"
        );

    const list =
        document.getElementById(
            "admin-launch-checks"
        );

    if (!statusEl || !criticalEl || !warningsEl || !okEl || !detail || !list) {
        return;
    }

    if (!data || data.error) {
        statusEl.textContent =
            "Sin datos";
        criticalEl.textContent =
            "--";
        warningsEl.textContent =
            "--";
        okEl.textContent =
            "--";
        detail.textContent =
            data?.error ||
            "No fue posible revisar la seguridad final desde el backend.";
        list.innerHTML = "";
        return;
    }

    const resumen =
        data.resumen ||
        {};

    statusEl.textContent =
        launchStatusLabel(
            data.estado
        );

    criticalEl.textContent =
        resumen.critical ??
        0;

    warningsEl.textContent =
        resumen.warnings ??
        0;

    okEl.textContent =
        resumen.ok ??
        0;

    const domains =
        data.dominios ||
        {};

    detail.textContent =
        `Estado ${launchStatusLabel(data.estado).toLowerCase()}. ` +
        `Frontend: ${domains.frontend || "sin configurar"}. ` +
        `Backend: ${domains.backend || "sin configurar"}. ` +
        `Última revisión: ${AdminUI.dateTime(data.fecha)}.`;

    const checks =
        Array.isArray(data.checks)
            ? data.checks
            : [];

    const visible = checks
        .filter((check) => !check.ok)
        .slice(0, 8);

    if (!visible.length) {
        list.innerHTML = `
            <div class="admin-alert success" style="margin-top:14px">
                No hay puntos críticos pendientes en la revisión automática. Continúa con la prueba completa de compra real antes del lanzamiento.
            </div>
        `;
        return;
    }

    list.innerHTML = `
        <div class="admin-launch-list" style="display:grid;gap:10px;margin-top:14px">
            ${visible.map((check) => `
                <div class="admin-alert ${check.severity === "warning" ? "warning" : "danger"}">
                    <strong>${AdminUI.escapeHtml(check.label)}</strong><br>
                    ${AdminUI.escapeHtml(check.message)}
                </div>
            `).join("")}
        </div>
    `;
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
