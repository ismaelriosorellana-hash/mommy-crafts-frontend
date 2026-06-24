"use strict";

let adminOrders = [];
let currentOrderId = "";

document.addEventListener(
    "admin:ready",
    () => {
        document.getElementById(
            "orders-refresh"
        ).addEventListener(
            "click",
            loadOrders
        );

        document.getElementById(
            "orders-search"
        ).addEventListener(
            "input",
            debounce(
                loadOrders,
                300
            )
        );

        document.getElementById(
            "orders-status"
        ).addEventListener(
            "change",
            loadOrders
        );

        document.getElementById(
            "orders-table"
        ).addEventListener(
            "click",
            (event) => {
                const button =
                    event.target.closest(
                        "[data-order-id]"
                    );

                if (button) {
                    openOrder(
                        button.dataset.orderId
                    );
                }
            }
        );

        document.getElementById(
            "order-save"
        ).addEventListener(
            "click",
            saveOrder
        );

        loadOrders();
    }
);

function debounce(callback, delay) {
    let timeout;

    return (...args) => {
        clearTimeout(timeout);
        timeout =
            setTimeout(
                () => callback(...args),
                delay
            );
    };
}

async function loadOrders() {
    const container =
        document.getElementById(
            "orders-table"
        );

    AdminUI.showLoading(
        container,
        "Cargando pedidos..."
    );

    try {
        const params =
            new URLSearchParams();

        const search =
            document.getElementById(
                "orders-search"
            ).value.trim();

        const status =
            document.getElementById(
                "orders-status"
            ).value;

        if (search) {
            params.set(
                "buscar",
                search
            );
        }

        if (status) {
            params.set(
                "estado",
                status
            );
        }

        adminOrders =
            await AdminAPI.request(
                `/admin/pedidos${params.toString() ? `?${params}` : ""}`
            );

        renderOrders();

        const requestedId =
            new URLSearchParams(
                location.search
            ).get("id");

        if (
            requestedId &&
            adminOrders.some(
                (item) =>
                    String(item._id) ===
                    requestedId
            )
        ) {
            openOrder(requestedId);
            history.replaceState(
                null,
                "",
                "pedidos.html"
            );
        }
    } catch (error) {
        container.innerHTML = `
            <div class="admin-empty">
                ${AdminUI.escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}

function renderOrders() {
    const container =
        document.getElementById(
            "orders-table"
        );

    if (!adminOrders.length) {
        container.innerHTML = `
            <div class="admin-empty">
                No se encontraron pedidos.
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Pago</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>

            <tbody>
                ${adminOrders.map(
                    (order) => `
                    <tr>
                        <td><strong>${AdminUI.escapeHtml(order.numeroPedido)}</strong></td>
                        <td>
                            <strong>${AdminUI.escapeHtml(order.cliente?.nombre || "—")}</strong>
                            <div style="margin-top:4px;color:var(--admin-muted);font-size:.82rem">
                                ${AdminUI.escapeHtml(order.cliente?.email || "")}
                            </div>
                        </td>
                        <td>${AdminUI.dateTime(order.createdAt)}</td>
                        <td><strong>${AdminUI.money(order.total)}</strong></td>
                        <td>
                            <span class="admin-status ${AdminUI.statusClass(order.estadoPago)}">
                                ${AdminUI.escapeHtml(order.estadoPago || "pendiente")}
                            </span>
                        </td>
                        <td>
                            <span class="admin-status ${AdminUI.statusClass(order.estadoPedido)}">
                                ${AdminUI.escapeHtml(String(order.estadoPedido || "").replaceAll("_", " "))}
                            </span>
                        </td>
                        <td>
                            <button class="admin-button secondary small" type="button" data-order-id="${order._id}">
                                Ver pedido
                            </button>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function openOrder(id) {
    const order =
        adminOrders.find(
            (item) =>
                String(item._id) ===
                String(id)
        );

    if (!order) return;

    currentOrderId =
        String(order._id);

    document.getElementById(
        "order-modal-title"
    ).textContent =
        order.numeroPedido;

    const items =
        (order.items || [])
            .map((item) => `
                <div style="
                    display:grid;
                    grid-template-columns:58px minmax(0,1fr) auto;
                    gap:12px;
                    align-items:center;
                    padding:12px 0;
                    border-bottom:1px solid var(--admin-border)
                ">
                    <img
                        src="${AdminUI.escapeHtml(item.imagen || CONFIG.placeholderImage)}"
                        alt=""
                        style="width:58px;height:58px;border-radius:11px;object-fit:cover;border:1px solid var(--admin-border)"
                    >

                    <div>
                        <strong>${AdminUI.escapeHtml(item.nombre)}</strong>
                        <div style="margin-top:4px;color:var(--admin-muted);font-size:.84rem">
                            ${item.color ? `Color: ${AdminUI.escapeHtml(item.color)} · ` : ""}
                            Cantidad: ${Number(item.cantidad) || 1}
                        </div>
                    </div>

                    <strong>${AdminUI.money(item.subtotal)}</strong>
                </div>
            `)
            .join("");

    document.getElementById(
        "order-detail"
    ).innerHTML = `
        <div class="admin-grid two">
            <section class="admin-card">
                <div class="admin-card-body">
                    <h4 style="margin-top:0">Cliente</h4>
                    <p><strong>${AdminUI.escapeHtml(order.cliente?.nombre || "")}</strong></p>
                    <p>${AdminUI.escapeHtml(order.cliente?.email || "")}</p>
                    <p>${AdminUI.escapeHtml(order.cliente?.telefono || "")}</p>
                    <p>${AdminUI.escapeHtml(order.cliente?.direccion || "")}, ${AdminUI.escapeHtml(order.cliente?.comuna || "")}</p>
                </div>
            </section>

            <section class="admin-card">
                <div class="admin-card-body">
                    <h4 style="margin-top:0">Resumen</h4>
                    <p>Subtotal: <strong>${AdminUI.money(order.subtotal)}</strong></p>
                    <p>Envío: <strong>${AdminUI.money(order.costoEnvio)}</strong></p>
                    <p>Total: <strong>${AdminUI.money(order.total)}</strong></p>
                </div>
            </section>
        </div>

        <h4 class="admin-section-title">Productos</h4>
        <div>${items || '<div class="admin-empty">Sin productos.</div>'}</div>

        <h4 class="admin-section-title">Actualizar pedido</h4>

        <div class="admin-form-grid">
            <div class="admin-field">
                <label for="order-status-edit">Estado del pedido</label>
                <select id="order-status-edit">
                    ${[
                        "pendiente",
                        "confirmado",
                        "en_produccion",
                        "listo",
                        "enviado",
                        "entregado",
                        "cancelado"
                    ].map(
                        (status) => `
                            <option value="${status}" ${status === order.estadoPedido ? "selected" : ""}>
                                ${status.replaceAll("_", " ")}
                            </option>
                        `
                    ).join("")}
                </select>
            </div>

            <div class="admin-field">
                <label for="order-payment-edit">Estado del pago</label>
                <select id="order-payment-edit">
                    ${[
                        "pendiente",
                        "pagado",
                        "rechazado",
                        "reembolsado"
                    ].map(
                        (status) => `
                            <option value="${status}" ${status === order.estadoPago ? "selected" : ""}>
                                ${status}
                            </option>
                        `
                    ).join("")}
                </select>
            </div>

            <div class="admin-field full">
                <label for="order-note-edit">Notas internas</label>
                <textarea id="order-note-edit">${AdminUI.escapeHtml(order.notasInternas || "")}</textarea>
            </div>
        </div>
    `;

    AdminUI.openModal(
        "order-modal"
    );
}

async function saveOrder() {
    if (!currentOrderId) return;

    const button =
        document.getElementById(
            "order-save"
        );

    button.disabled = true;

    try {
        const updated =
            await AdminAPI.request(
                `/admin/pedidos/${currentOrderId}`,
                {
                    method: "PATCH",
                    body: {
                        estadoPedido:
                            document.getElementById(
                                "order-status-edit"
                            ).value,
                        estadoPago:
                            document.getElementById(
                                "order-payment-edit"
                            ).value,
                        notasInternas:
                            document.getElementById(
                                "order-note-edit"
                            ).value
                    }
                }
            );

        AdminUI.toast(
            "Pedido actualizado.",
            "success"
        );

        AdminUI.closeModal(
            "order-modal"
        );

        loadOrders();
    } catch (error) {
        AdminUI.toast(
            error.message,
            "error"
        );
    } finally {
        button.disabled = false;
    }
}
