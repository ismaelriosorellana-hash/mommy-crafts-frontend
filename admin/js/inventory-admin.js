"use strict";

let inventoryProducts = [];

document.addEventListener(
    "admin:ready",
    () => {
        document.getElementById(
            "inventory-refresh"
        ).addEventListener(
            "click",
            loadInventory
        );

        document.getElementById(
            "inventory-adjust-open"
        ).addEventListener(
            "click",
            () => {
                populateProductSelect();
                AdminUI.openModal(
                    "inventory-modal"
                );
            }
        );

        document.getElementById(
            "inventory-product"
        ).addEventListener(
            "change",
            populateVariantSelect
        );

        document.getElementById(
            "inventory-type"
        ).addEventListener(
            "change",
            syncQuantitySign
        );

        document.getElementById(
            "inventory-form"
        ).addEventListener(
            "submit",
            saveAdjustment
        );

        loadInventory();
    }
);

async function loadInventory() {
    const lowStock =
        document.getElementById(
            "low-stock-list"
        );

    const movements =
        document.getElementById(
            "inventory-movements"
        );

    AdminUI.showLoading(
        lowStock
    );

    AdminUI.showLoading(
        movements
    );

    try {
        const [
            low,
            list,
            products
        ] = await Promise.all([
            AdminAPI.request(
                "/admin/inventario/stock-bajo"
            ),
            AdminAPI.request(
                "/admin/inventario/movimientos"
            ),
            AdminAPI.request(
                "/admin/productos?activo=true"
            )
        ]);

        inventoryProducts =
            Array.isArray(products)
                ? products
                : [];

        renderLowStock(
            low.productos || [],
            low.limite
        );

        renderMovements(
            Array.isArray(list)
                ? list
                : []
        );
    } catch (error) {
        lowStock.innerHTML = `
            <div class="admin-empty">
                ${AdminUI.escapeHtml(error.message)}
            </div>
        `;

        movements.innerHTML = `
            <div class="admin-empty">
                No fue posible cargar movimientos.
            </div>
        `;
    }
}

function renderLowStock(products, limit) {
    const container =
        document.getElementById(
            "low-stock-list"
        );

    if (!products.length) {
        container.innerHTML = `
            <div class="admin-empty">
                No hay productos con stock igual o inferior a ${Number(limit) || 5}.
            </div>
        `;

        return;
    }

    container.innerHTML = products
        .map((product) => `
            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:12px;
                padding:12px 0;
                border-bottom:1px solid var(--admin-border)
            ">
                <div>
                    <strong>${AdminUI.escapeHtml(product.nombre)}</strong>
                    <div style="margin-top:4px;color:var(--admin-muted);font-size:.84rem">
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

function renderMovements(items) {
    const container =
        document.getElementById(
            "inventory-movements"
        );

    if (!items.length) {
        container.innerHTML = `
            <div class="admin-empty">
                Todavía no hay movimientos registrados.
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Stock</th>
                </tr>
            </thead>

            <tbody>
                ${items.slice(0, 50).map(
                    (item) => `
                    <tr>
                        <td>${AdminUI.dateTime(item.createdAt)}</td>
                        <td>
                            <strong>${AdminUI.escapeHtml(item.productoId?.nombre || "Producto")}</strong>
                            <div style="margin-top:4px;color:var(--admin-muted);font-size:.82rem">
                                ${AdminUI.escapeHtml(item.varianteNombre || "")}
                            </div>
                        </td>
                        <td>${AdminUI.escapeHtml(item.tipo)}</td>
                        <td>
                            <strong style="color:${Number(item.cantidad) < 0 ? "var(--admin-danger)" : "var(--admin-success)"}">
                                ${Number(item.cantidad) > 0 ? "+" : ""}${Number(item.cantidad)}
                            </strong>
                        </td>
                        <td>${Number(item.stockAnterior)} → ${Number(item.stockNuevo)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function populateProductSelect() {
    const select =
        document.getElementById(
            "inventory-product"
        );

    select.innerHTML = `
        <option value="">Selecciona un producto</option>
        ${inventoryProducts
            .map(
                (product) => `
                    <option value="${product._id}">
                        ${AdminUI.escapeHtml(product.nombre)}
                    </option>
                `
            )
            .join("")}
    `;

    populateVariantSelect();
}

function populateVariantSelect() {
    const productId =
        document.getElementById(
            "inventory-product"
        ).value;

    const product =
        inventoryProducts.find(
            (item) =>
                String(item._id) ===
                String(productId)
        );

    const select =
        document.getElementById(
            "inventory-variant"
        );

    select.innerHTML = `
        <option value="">Stock general</option>
        ${(product?.variantes || [])
            .map(
                (variant, index) => `
                    <option
                        value="${AdminUI.escapeHtml(variant._id || variant.id || variant.sku || `variant-${index}`)}"
                        data-name="${AdminUI.escapeHtml(variant.nombre || variant.color || "")}"
                    >
                        ${AdminUI.escapeHtml(variant.nombre || variant.color || `Variante ${index + 1}`)}
                    </option>
                `
            )
            .join("")}
    `;
}

function syncQuantitySign() {
    const type =
        document.getElementById(
            "inventory-type"
        ).value;

    const input =
        document.getElementById(
            "inventory-quantity"
        );

    const current =
        Math.abs(
            Number(input.value) || 0
        );

    if (!current) return;

    input.value =
        type === "salida"
            ? -current
            : current;
}

async function saveAdjustment(event) {
    event.preventDefault();

    const productId =
        document.getElementById(
            "inventory-product"
        ).value;

    const variantSelect =
        document.getElementById(
            "inventory-variant"
        );

    const quantityInput =
        document.getElementById(
            "inventory-quantity"
        );

    let quantity =
        Number(quantityInput.value);

    const type =
        document.getElementById(
            "inventory-type"
        ).value;

    if (
        type === "salida" &&
        quantity > 0
    ) {
        quantity *= -1;
    }

    if (!productId || !quantity) {
        AdminUI.toast(
            "Selecciona un producto e ingresa una cantidad distinta de cero.",
            "error"
        );

        return;
    }

    try {
        await AdminAPI.request(
            "/admin/inventario/ajustes",
            {
                method: "POST",
                body: {
                    productoId: productId,
                    varianteId:
                        variantSelect.value,
                    varianteNombre:
                        variantSelect.selectedOptions[0]
                            ?.dataset.name || "",
                    cantidad: quantity,
                    tipo,
                    motivo:
                        document.getElementById(
                            "inventory-reason"
                        ).value.trim()
                }
            }
        );

        AdminUI.toast(
            "Inventario actualizado.",
            "success"
        );

        document.getElementById(
            "inventory-form"
        ).reset();

        AdminUI.closeModal(
            "inventory-modal"
        );

        loadInventory();
    } catch (error) {
        AdminUI.toast(
            error.message,
            "error"
        );
    }
}
