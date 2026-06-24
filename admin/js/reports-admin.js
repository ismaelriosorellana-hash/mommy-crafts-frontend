"use strict";

document.addEventListener(
    "admin:ready",
    () => {
        const today =
            new Date();

        const from =
            new Date();

        from.setDate(
            today.getDate() - 30
        );

        document.getElementById(
            "report-from"
        ).value =
            formatInputDate(from);

        document.getElementById(
            "report-to"
        ).value =
            formatInputDate(today);

        document.getElementById(
            "report-apply"
        ).addEventListener(
            "click",
            loadReport
        );

        loadReport();
    }
);

function formatInputDate(date) {
    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2, "0"),
        String(
            date.getDate()
        ).padStart(2, "0")
    ].join("-");
}

async function loadReport() {
    const salesChart =
        document.getElementById(
            "sales-chart"
        );

    const productsChart =
        document.getElementById(
            "top-products-chart"
        );

    AdminUI.showLoading(
        salesChart
    );

    AdminUI.showLoading(
        productsChart
    );

    try {
        const params =
            new URLSearchParams({
                desde:
                    document.getElementById(
                        "report-from"
                    ).value,
                hasta:
                    document.getElementById(
                        "report-to"
                    ).value
            });

        const data =
            await AdminAPI.request(
                `/admin/reportes/ventas?${params}`
            );

        const summary =
            data.resumen || {};

        document.getElementById(
            "report-sales"
        ).textContent =
            AdminUI.money(
                summary.ventas
            );

        document.getElementById(
            "report-orders"
        ).textContent =
            summary.pedidos || 0;

        document.getElementById(
            "report-average"
        ).textContent =
            AdminUI.money(
                summary.ticketPromedio
            );

        document.getElementById(
            "report-units"
        ).textContent =
            summary.productosVendidos ||
            0;

        renderSalesChart(
            data.ventasPorDia || []
        );

        renderProductsChart(
            data.productosMasVendidos ||
            []
        );
    } catch (error) {
        salesChart.innerHTML = `
            <div class="admin-empty">
                ${AdminUI.escapeHtml(
                    error.message
                )}
            </div>
        `;

        productsChart.innerHTML = `
            <div class="admin-empty">
                No fue posible cargar los productos.
            </div>
        `;
    }
}

function renderSalesChart(items) {
    const container =
        document.getElementById(
            "sales-chart"
        );

    if (!items.length) {
        container.innerHTML = `
            <div class="admin-empty">
                No existen ventas para este período.
            </div>
        `;

        return;
    }

    const max =
        Math.max(
            ...items.map(
                (item) =>
                    Number(item.ventas) ||
                    0
            ),
            1
        );

    container.innerHTML = `
        <div class="admin-chart">
            ${items.map(
                (item) => `
                <div class="admin-chart-row">
                    <div class="admin-chart-label">
                        ${AdminUI.escapeHtml(item._id)}
                    </div>

                    <div class="admin-chart-track">
                        <div
                            class="admin-chart-bar"
                            style="width:${Math.max(2, (Number(item.ventas) / max) * 100)}%"
                        ></div>
                    </div>

                    <div class="admin-chart-value">
                        ${AdminUI.money(item.ventas)}
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function renderProductsChart(items) {
    const container =
        document.getElementById(
            "top-products-chart"
        );

    if (!items.length) {
        container.innerHTML = `
            <div class="admin-empty">
                Todavía no hay productos vendidos.
            </div>
        `;

        return;
    }

    const max =
        Math.max(
            ...items.map(
                (item) =>
                    Number(item.unidades) ||
                    0
            ),
            1
        );

    container.innerHTML = `
        <div class="admin-chart">
            ${items.map(
                (item) => `
                <div class="admin-chart-row">
                    <div
                        class="admin-chart-label"
                        title="${AdminUI.escapeHtml(item._id?.nombre || "Producto")}"
                    >
                        ${AdminUI.escapeHtml(
                            String(item._id?.nombre || "Producto").slice(0, 13)
                        )}
                    </div>

                    <div class="admin-chart-track">
                        <div
                            class="admin-chart-bar"
                            style="width:${Math.max(2, (Number(item.unidades) / max) * 100)}%"
                        ></div>
                    </div>

                    <div class="admin-chart-value">
                        ${Number(item.unidades) || 0} un.
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}
