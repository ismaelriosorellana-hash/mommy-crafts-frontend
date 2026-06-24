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

        loadDashboard();
    }
);

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
