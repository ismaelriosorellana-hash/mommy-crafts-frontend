"use strict";

document.addEventListener(
    "admin:ready",
    () => {
        document.getElementById("operations-refresh")
            ?.addEventListener("click", loadOperations);

        loadOperations();
    }
);

function statusLabel(value) {
    const labels = {
        pendiente: "Pendiente",
        confirmado: "Confirmado",
        validacion_diseno: "Validación de diseño",
        en_produccion: "En producción",
        listo: "Listo",
        enviado: "Enviado",
        entregado: "Entregado",
        cancelado: "Cancelado",
        pagado: "Pagado",
        pendiente_comprobante: "Pendiente comprobante",
        comprobante_recibido: "Comprobante recibido",
        en_revision: "En revisión",
        rechazado: "Rechazado",
        vencido: "Vencido",
        reembolsado: "Reembolsado"
    };

    return labels[value] || String(value || "Sin estado").replaceAll("_", " ");
}

function updateText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function syncLabel(dateValue) {
    const element = document.getElementById("operations-last-sync");
    if (!element) return;

    element.textContent = `Centro operativo actualizado: ${AdminUI.dateTime(dateValue || new Date())}.`;
}

function openOrderUrl(order) {
    const id = encodeURIComponent(order.id || "");
    return `pedidos.html?id=${id}`;
}

function renderOrderCard(order) {
    const action = order.accion || {};
    const badgeTone = ["warning", "danger", "info", "success"].includes(action.tone)
        ? action.tone
        : "";

    return `
        <article class="operation-item">
            <div>
                <h4>${AdminUI.escapeHtml(order.numeroPedido || "Pedido")}</h4>
                <p>
                    ${AdminUI.escapeHtml(order.cliente || "Cliente")} ·
                    ${Number(order.items) || 0} unidad${Number(order.items) === 1 ? "" : "es"} ·
                    ${AdminUI.money(order.total)}
                </p>
                <small>
                    Pago: ${AdminUI.escapeHtml(statusLabel(order.estadoPago))} ·
                    Estado: ${AdminUI.escapeHtml(statusLabel(order.estadoPedido))} ·
                    ${order.personalizado ? "Personalizado" : "Sin personalización"}
                </small>
                <small>${AdminUI.escapeHtml(action.detail || "")}</small>
                <div class="operation-actions">
                    <a class="admin-button secondary small" href="${AdminUI.escapeHtml(openOrderUrl(order))}">
                        Ver pedido
                    </a>
                </div>
            </div>
            <span class="operation-badge ${AdminUI.escapeHtml(badgeTone)}">
                ${AdminUI.escapeHtml(action.title || "Revisar")}
            </span>
        </article>
    `;
}

function renderOrderList(containerId, orders, emptyMessage) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!Array.isArray(orders) || !orders.length) {
        container.innerHTML = `
            <div class="admin-empty">
                ${AdminUI.escapeHtml(emptyMessage)}
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(renderOrderCard).join("");
}

function renderStock(products) {
    const container = document.getElementById("ops-stock");
    if (!container) return;

    if (!Array.isArray(products) || !products.length) {
        container.innerHTML = `
            <div class="admin-empty">
                No hay productos con stock bajo en este momento.
            </div>
        `;
        return;
    }

    container.innerHTML = products.map((product) => `
        <div class="operation-stock-item">
            <div>
                <strong>${AdminUI.escapeHtml(product.nombre || "Producto")}</strong>
                <span>${AdminUI.escapeHtml(product.categoria || "Sin categoría")}${product.sku ? ` · SKU ${AdminUI.escapeHtml(product.sku)}` : ""}</span>
            </div>
            <span class="admin-status ${Number(product.stock) === 0 ? "danger" : "warning"}">
                ${Number(product.stock) || 0} unidades
            </span>
        </div>
    `).join("");
}

function renderTopProducts(products) {
    const container = document.getElementById("ops-top-products");
    if (!container) return;

    if (!Array.isArray(products) || !products.length) {
        container.innerHTML = `
            <div class="admin-empty">
                Aún no hay ventas pagadas en los últimos 7 días.
            </div>
        `;
        return;
    }

    container.innerHTML = products.map((product, index) => `
        <div class="operation-product-row">
            <div>
                <strong>${index + 1}. ${AdminUI.escapeHtml(product.nombre || "Producto")}</strong>
                <span>${Number(product.unidades) || 0} unidades · ${AdminUI.money(product.ventas)}</span>
            </div>
            <span class="operation-badge success">Movimiento</span>
        </div>
    `).join("");
}

async function loadOperations() {
    const priorities = document.getElementById("ops-priorities");
    const stock = document.getElementById("ops-stock");
    const production = document.getElementById("ops-production-list");
    const top = document.getElementById("ops-top-products");

    [priorities, stock, production, top].forEach((container) => {
        if (container) AdminUI.showLoading(container);
    });

    try {
        const data = await AdminAPI.request("/admin/operaciones");
        const summary = data.resumen || {};

        updateText("ops-active", summary.activos || 0);
        updateText("ops-payments", summary.pagosPendientes || 0);
        updateText("ops-production", (summary.disenosPendientes || 0) + (summary.enProduccion || 0));
        updateText("ops-delivery", summary.porEntregar || 0);

        syncLabel(data.fecha);

        renderOrderList(
            "ops-priorities",
            data.prioridades || [],
            "No hay acciones urgentes por ahora."
        );

        renderOrderList(
            "ops-production-list",
            data.produccion || [],
            "No hay pedidos en diseño o producción."
        );

        renderStock(data.stock || []);
        renderTopProducts(data.topProductos7Dias || []);
    } catch (error) {
        syncLabel(new Date());
        const message = `No fue posible cargar el centro operativo: ${error.message}`;
        [priorities, stock, production, top].forEach((container) => {
            if (container) {
                container.innerHTML = `<div class="admin-empty">${AdminUI.escapeHtml(message)}</div>`;
            }
        });
        AdminUI.toast(error.message, "error");
    }
}
