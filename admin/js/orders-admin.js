"use strict";

let adminOrders = [];
let currentOrderId = "";

document.addEventListener(
    "admin:ready",
    () => {
        document.getElementById("orders-refresh")
            .addEventListener("click", loadOrders);

        document.getElementById("orders-search")
            .addEventListener("input", debounce(loadOrders, 300));

        document.getElementById("orders-status")
            .addEventListener("change", loadOrders);

        document.getElementById("orders-table")
            .addEventListener("click", (event) => {
                const button = event.target.closest("[data-order-id]");
                if (button) openOrder(button.dataset.orderId);
            });

        document.getElementById("order-save")
            .addEventListener("click", saveOrder);

        document.getElementById("order-sync-payment")
            .addEventListener("click", syncPayment);

        loadOrders();
    }
);

function debounce(callback, delay) {
    let timeout;

    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(...args), delay);
    };
}

function cleanNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function decimal(value, digits = 2) {
    return new Intl.NumberFormat("es-CL", {
        maximumFractionDigits: digits
    }).format(cleanNumber(value));
}

function safeUrl(value) {
    try {
        const url = new URL(String(value || ""));
        return ["http:", "https:"].includes(url.protocol)
            ? url.href
            : "";
    } catch {
        return "";
    }
}

function customizationOf(item) {
    const customization = item?.personalizacion ?? item?.customization;
    return customization && typeof customization === "object"
        ? customization
        : null;
}

function assetOf(customization, type) {
    if (!customization) return null;

    if (type === "preview") {
        return (
            customization.assets?.preview ||
            customization.finalPreview?.asset ||
            customization.previewAsset ||
            null
        );
    }

    return (
        customization.assets?.original ||
        customization.image?.asset ||
        customization.originalAsset ||
        null
    );
}

function renderAsset(asset, title, icon) {
    const url = safeUrl(asset?.url);
    const downloadUrl = safeUrl(asset?.downloadUrl || asset?.url);

    if (!url) {
        return `
            <div class="order-asset-card unavailable">
                <div class="order-asset-placeholder">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div>
                    <strong>${AdminUI.escapeHtml(title)}</strong>
                    <p>No disponible para este pedido.</p>
                </div>
            </div>
        `;
    }

    const dimensions = asset?.width && asset?.height
        ? `${asset.width} × ${asset.height} px`
        : "Dimensiones no informadas";

    const size = asset?.bytes
        ? `${decimal(asset.bytes / 1024 / 1024, 2)} MB`
        : "";

    return `
        <article class="order-asset-card">
            <a href="${AdminUI.escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
                <img src="${AdminUI.escapeHtml(url)}" alt="${AdminUI.escapeHtml(title)}">
            </a>

            <div class="order-asset-content">
                <strong>${AdminUI.escapeHtml(title)}</strong>
                <p>${AdminUI.escapeHtml(asset?.fileName || "Archivo de personalización")}</p>
                <small>${AdminUI.escapeHtml([dimensions, size].filter(Boolean).join(" · "))}</small>

                <div class="order-asset-actions">
                    <a class="admin-button secondary small" href="${AdminUI.escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
                        <i class="fa-solid fa-eye"></i>
                        Ver
                    </a>

                    <a class="admin-button small" href="${AdminUI.escapeHtml(downloadUrl)}" download>
                        <i class="fa-solid fa-download"></i>
                        Descargar
                    </a>
                </div>
            </div>
        </article>
    `;
}

function renderTransform(label, transform = {}) {
    return `
        <div class="order-spec-row">
            <span>${AdminUI.escapeHtml(label)}</span>
            <strong>
                X ${decimal(transform.x)} px ·
                Y ${decimal(transform.y)} px ·
                Escala ${decimal(transform.scale || 1)} ·
                Rotación ${decimal(transform.rotation)}°
            </strong>
        </div>
    `;
}

function textDetails(customization, type) {
    const modern = customization?.texts?.[type];
    const legacyTransform = type === "main"
        ? customization?.mainTextTransform
        : customization?.secondaryTextTransform;
    const value = modern?.value ?? (
        type === "main"
            ? customization?.mainText
            : customization?.secondaryText
    ) ?? "";

    if (!value) return null;

    return {
        value,
        fontFamily:
            modern?.fontFamily ||
            legacyTransform?.fontFamily ||
            (type === "main"
                ? customization?.mainTextFont
                : customization?.secondaryTextFont) ||
            "No informada",
        fontSizePx:
            modern?.fontSizePx ??
            modern?.baseFontSizePx ??
            0,
        colorHex:
            modern?.colorHex ||
            legacyTransform?.color ||
            "#2f292c",
        x: modern?.x ?? legacyTransform?.x ?? 0,
        y: modern?.y ?? legacyTransform?.y ?? 0,
        scale: modern?.scale ?? legacyTransform?.scale ?? 1,
        rotation: modern?.rotation ?? legacyTransform?.rotation ?? 0
    };
}

function renderTextSpecification(title, specification) {
    if (!specification) {
        return `
            <div class="order-text-spec empty">
                <strong>${AdminUI.escapeHtml(title)}</strong>
                <p>No solicitado.</p>
            </div>
        `;
    }

    const color = /^#[0-9a-f]{6}$/i.test(specification.colorHex)
        ? specification.colorHex
        : "#2f292c";

    return `
        <article class="order-text-spec">
            <span class="order-text-label">${AdminUI.escapeHtml(title)}</span>

            <div
                class="order-text-sample"
                style="font-family:${AdminUI.escapeHtml(specification.fontFamily)};color:${AdminUI.escapeHtml(color)}"
            >
                ${AdminUI.escapeHtml(specification.value)}
            </div>

            <dl class="order-text-data">
                <div>
                    <dt>Tipografía</dt>
                    <dd>${AdminUI.escapeHtml(specification.fontFamily)}</dd>
                </div>
                <div>
                    <dt>Tamaño</dt>
                    <dd>${decimal(specification.fontSizePx)} px</dd>
                </div>
                <div>
                    <dt>Color</dt>
                    <dd>
                        <span class="order-color-chip" style="background:${AdminUI.escapeHtml(color)}"></span>
                        <code>${AdminUI.escapeHtml(color.toUpperCase())}</code>
                    </dd>
                </div>
                <div>
                    <dt>Posición</dt>
                    <dd>X ${decimal(specification.x)} · Y ${decimal(specification.y)}</dd>
                </div>
                <div>
                    <dt>Escala</dt>
                    <dd>${decimal(specification.scale || 1)}</dd>
                </div>
                <div>
                    <dt>Rotación</dt>
                    <dd>${decimal(specification.rotation)}°</dd>
                </div>
            </dl>
        </article>
    `;
}

function renderPriceBreakdown(customization) {
    const lines = Array.isArray(customization?.priceBreakdown)
        ? customization.priceBreakdown
        : [];

    if (!lines.length) return "";

    return `
        <div class="order-customization-pricing">
            <h5>Detalle del precio personalizado</h5>
            ${lines.map((line) => `
                <div>
                    <span>${AdminUI.escapeHtml(line.label || "Concepto")}</span>
                    <strong>${AdminUI.money(line.value)}</strong>
                </div>
            `).join("")}
            <div class="total">
                <span>Total personalizado</span>
                <strong>${AdminUI.money(customization.totalPrice)}</strong>
            </div>
        </div>
    `;
}

function renderCustomization(item) {
    const customization = customizationOf(item);
    if (!customization) return "";

    if (customization.type === "light") {
        const assets = Array.isArray(customization.assets?.images)
            ? customization.assets.images
            : [];
        const summary = item.personalizacionResumen?.descripcion || "Opciones seleccionadas";

        return `
            <section class="order-customization-panel simple">
                <header class="order-customization-header">
                    <div>
                        <span>Personalización simple</span>
                        <strong>${AdminUI.escapeHtml(summary)}</strong>
                    </div>
                </header>

                ${customization.requestedName ? `
                    <div class="order-instructions">
                        <strong>Texto</strong>
                        <p>${AdminUI.escapeHtml(customization.requestedName)}</p>
                    </div>
                ` : ""}

                ${customization.observation ? `
                    <div class="order-instructions">
                        <strong>Indicaciones</strong>
                        <p>${AdminUI.escapeHtml(customization.observation)}</p>
                    </div>
                ` : ""}

                <div class="order-assets-grid">
                    ${assets.length
                        ? assets.map((asset, index) =>
                            renderAsset(asset, `Imagen del cliente ${index + 1}`, "fa-image")
                        ).join("")
                        : '<div class="admin-empty">Sin imágenes adjuntas.</div>'
                    }
                </div>
            </section>
        `;
    }

    const previewAsset = assetOf(customization, "preview");
    const originalAsset = assetOf(customization, "original");
    const mainText = textDetails(customization, "main");
    const secondaryText = textDetails(customization, "secondary");
    const imageTransform =
        customization.image?.transform ||
        customization.imageTransform ||
        {};

    return `
        <section class="order-customization-panel">
            <header class="order-customization-header">
                <div>
                    <span>Personalización del cliente</span>
                    <strong>${AdminUI.escapeHtml(customization.customizationId || "Sin identificador")}</strong>
                </div>

                <span class="admin-status info">
                    ${AdminUI.escapeHtml(customization.style || "Diseño personalizado")}
                </span>
            </header>

            <div class="order-customization-summary">
                <div><span>Categoría</span><strong>${AdminUI.escapeHtml(customization.category || "—")}</strong></div>
                <div><span>Variante</span><strong>${AdminUI.escapeHtml(customization.productVariant || item.color || "Estándar")}</strong></div>
                <div><span>SKU</span><strong>${AdminUI.escapeHtml(customization.sku || item.sku || "—")}</strong></div>
                <div><span>Archivo</span><strong>${AdminUI.escapeHtml(customization.imageName || originalAsset?.fileName || "Sin imagen original")}</strong></div>
            </div>

            <div class="order-assets-grid">
                ${renderAsset(previewAsset, "Vista previa final", "fa-wand-magic-sparkles")}
                ${renderAsset(originalAsset, "Imagen original del cliente", "fa-image")}
            </div>

            ${originalAsset ? `
                <div class="order-transform-box">
                    <h5>Ajuste de la imagen</h5>
                    ${renderTransform("Transformación", imageTransform)}
                </div>
            ` : ""}

            <div class="order-text-grid">
                ${renderTextSpecification("Texto principal", mainText)}
                ${renderTextSpecification("Texto secundario", secondaryText)}
            </div>

            ${customization.instructions ? `
                <div class="order-instructions">
                    <strong>Instrucciones adicionales</strong>
                    <p>${AdminUI.escapeHtml(customization.instructions)}</p>
                </div>
            ` : ""}

            ${renderPriceBreakdown(customization)}
        </section>
    `;
}

function orderDate(value) {
    if (!value) return "No informada";
    return new Intl.DateTimeFormat("es-CL", {
        dateStyle: "long",
        timeZone: "America/Santiago"
    }).format(new Date(value));
}

function whatsappDigits(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("56")) return digits;
    if (digits.length === 9) return `56${digits}`;
    return digits;
}

function designWhatsAppUrl(order, item) {
    const phone = whatsappDigits(order?.cliente?.telefono);
    if (!phone) return "";

    const message = encodeURIComponent(
        `Hola ${order.cliente?.nombre || ""}, publicamos el diseño final de ${item.nombre} para el pedido ${order.numeroPedido}. Ingresa a tu cuenta en Mommy Crafts para revisarlo, aprobarlo o solicitar cambios.`
    );

    return `https://wa.me/${phone}?text=${message}`;
}

function renderOrderItem(item, order) {
    const whatsappUrl = designWhatsAppUrl(order, item);
    const canPublishDesign = order?.estadoPago === "pagado";

    return `
        <article class="order-product-item">
            <div class="order-product-main">
                <img
                    src="${AdminUI.escapeHtml(safeUrl(item.imagen) || CONFIG.placeholderImage)}"
                    alt=""
                >

                <div>
                    <strong>${AdminUI.escapeHtml(item.nombre)}</strong>
                    <div class="order-product-meta">
                        ${item.color ? `Color: ${AdminUI.escapeHtml(item.color)} · ` : ""}
                        Cantidad: ${Number(item.cantidad) || 1}
                        ${item.sku ? ` · SKU: ${AdminUI.escapeHtml(item.sku)}` : ""}
                    </div>
                </div>

                <strong>${AdminUI.money(item.subtotal)}</strong>
            </div>

            ${renderCustomization(item)}

            ${item.personalizacionResumen?.tipo !== "ninguna" ? `
                <section class="admin-design-workflow" data-line-id="${AdminUI.escapeHtml(item.lineaId)}">
                    <h5>Diseño final y aprobación</h5>

                    ${item.disenoFinal?.asset?.url ? `
                        <a href="${AdminUI.escapeHtml(item.disenoFinal.asset.url)}" target="_blank" rel="noopener">
                            <img src="${AdminUI.escapeHtml(item.disenoFinal.asset.url)}" alt="Diseño final">
                        </a>
                        ${whatsappUrl ? `
                            <a
                                class="admin-button secondary small"
                                href="${AdminUI.escapeHtml(whatsappUrl)}"
                                target="_blank"
                                rel="noopener"
                            >
                                Avisar por WhatsApp
                            </a>
                        ` : ""}
                    ` : ""}

                    <p>
                        Estado:
                        <strong>${AdminUI.escapeHtml(String(item.disenoFinal?.estado || "pendiente").replaceAll("_", " "))}</strong>
                    </p>

                    ${item.disenoFinal?.observacionesCliente ? `
                        <p>Observaciones del cliente: ${AdminUI.escapeHtml(item.disenoFinal.observacionesCliente)}</p>
                    ` : ""}

                    ${!canPublishDesign ? `
                        <p class="admin-help-text">
                            Primero debes confirmar el pago para publicar el diseño final.
                        </p>
                    ` : ""}

                    <input class="design-file" type="file" accept="image/jpeg,image/png,image/webp" ${canPublishDesign ? "" : "disabled"}>

                    <textarea
                        class="design-message"
                        maxlength="1500"
                        placeholder="Mensaje para el cliente"
                        ${canPublishDesign ? "" : "disabled"}
                    >${AdminUI.escapeHtml(item.disenoFinal?.mensaje || "Te enviamos el diseño final para que lo revises y confirmes desde tu cuenta.")}</textarea>

                    <select class="design-channel" ${canPublishDesign ? "" : "disabled"}>
                        <option value="cuenta">Publicar en la cuenta del cliente</option>
                        <option value="whatsapp">Cuenta + coordinación manual por WhatsApp</option>
                    </select>

                    <p class="admin-help-text">
                        El correo automático se habilitará cuando exista el dominio corporativo. Por ahora, el diseño quedará disponible en la cuenta y puedes avisar por WhatsApp.
                    </p>

                    <button class="admin-button small upload-final-design" type="button" ${canPublishDesign ? "" : "disabled"}>
                        Publicar diseño para el cliente
                    </button>
                </section>
            ` : ""}
        </article>
    `;
}

async function loadOrders() {
    const container = document.getElementById("orders-table");
    AdminUI.showLoading(container, "Cargando pedidos...");

    try {
        const params = new URLSearchParams();
        const search = document.getElementById("orders-search").value.trim();
        const status = document.getElementById("orders-status").value;

        if (search) params.set("buscar", search);
        if (status) params.set("estado", status);

        adminOrders = await AdminAPI.request(
            `/admin/pedidos${params.toString() ? `?${params}` : ""}`
        );

        renderOrders();

        const requestedId = new URLSearchParams(location.search).get("id");

        if (
            requestedId &&
            adminOrders.some((item) => String(item._id) === requestedId)
        ) {
            openOrder(requestedId);
            history.replaceState(null, "", "pedidos.html");
        }
    } catch (error) {
        container.innerHTML = `
            <div class="admin-empty">
                ${AdminUI.escapeHtml(error.message)}
            </div>
        `;
    }
}

function renderOrders() {
    const container = document.getElementById("orders-table");

    if (!adminOrders.length) {
        container.innerHTML = `
            <div class="admin-empty">No se encontraron pedidos.</div>
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
                ${adminOrders.map((order) => `
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
    const order = adminOrders.find(
        (item) => String(item._id) === String(id)
    );

    if (!order) return;

    currentOrderId = String(order._id);
    document.getElementById("order-modal-title").textContent = order.numeroPedido;

    const syncButton = document.getElementById("order-sync-payment");
    syncButton.hidden = order.metodoPago !== "mercadopago";

    const items = (order.items || [])
        .map((item) => renderOrderItem(item, order))
        .join("");

    document.getElementById("order-detail").innerHTML = `
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
                    <p>
                        Método de entrega:
                        <strong>
                            ${order.entrega?.metodo === "retiro" ? "Retiro" : "Envío"}
                        </strong>
                    </p>
                    ${order.entrega?.metodo === "envio" ? `
                        <p>
                            Dirección:
                            <strong>
                                ${AdminUI.escapeHtml(order.entrega?.direccion || order.cliente?.direccion || "—")},
                                ${AdminUI.escapeHtml(order.entrega?.comuna || order.cliente?.comuna || "—")}
                            </strong>
                        </p>
                    ` : ""}
                </div>
            </section>
        </div>

        <h4 class="admin-section-title">Entrega</h4>

        <section class="admin-card">
            <div class="admin-card-body">
                <p>
                    <strong>
                        ${order.entrega?.metodo === "retiro" ? "Retiro coordinado" : "Envío a domicilio"}
                    </strong>
                </p>

                <div class="order-instructions">
                    <strong>Instrucciones aplicables</strong>
                    <p>${AdminUI.escapeHtml(order.entrega?.instrucciones || "El pedido no registra instrucciones de entrega.")}</p>
                </div>
            </div>
        </section>

        ${order.metodoPago === "transferencia" ? `
            <h4 class="admin-section-title">Transferencia bancaria</h4>

            <section class="admin-card">
                <div class="admin-card-body">
                    <p>
                        Estado:
                        <strong>${AdminUI.escapeHtml(String(order.estadoPago || "").replaceAll("_", " "))}</strong>
                    </p>

                    <p>
                        Vence:
                        <strong>${order.transferencia?.venceAt ? AdminUI.dateTime(order.transferencia.venceAt) : "—"}</strong>
                    </p>

                    ${order.transferencia?.comprobante?.url ? `
                        <p>
                            <a
                                class="admin-button secondary small"
                                href="${AdminUI.escapeHtml(order.transferencia.comprobante.url)}"
                                target="_blank"
                                rel="noopener"
                            >
                                Ver comprobante
                            </a>
                        </p>
                    ` : "<p>Aún no hay comprobante.</p>"}

                    <div class="admin-field full">
                        <label for="transfer-note">Observaciones de validación</label>
                        <textarea id="transfer-note">${AdminUI.escapeHtml(order.transferencia?.observaciones || "")}</textarea>
                    </div>

                    <div class="admin-toolbar-group" style="margin-top:12px">
                        <button class="admin-button small transfer-action" data-action="aprobar" type="button">
                            Confirmar pago
                        </button>

                        <button class="admin-button secondary small transfer-action" data-action="extender" type="button">
                            Extender 3 horas
                        </button>

                        <button class="admin-button danger small transfer-action" data-action="rechazar" type="button">
                            Rechazar
                        </button>

                        <label class="admin-checkbox">
                            <input id="transfer-retry" type="checkbox">
                            Permitir nuevo comprobante
                        </label>
                    </div>
                </div>
            </section>
        ` : ""}

        ${order.observaciones ? `
            <h4 class="admin-section-title">Nota del cliente</h4>
            <section class="admin-card">
                <div class="admin-card-body">
                    <p>${AdminUI.escapeHtml(order.observaciones)}</p>
                </div>
            </section>
        ` : ""}

        ${order.entrega?.receptorTercero?.habilitado ? `
            <h4 class="admin-section-title">Persona que recibe</h4>
            <section class="admin-card">
                <div class="admin-card-body">
                    <p><strong>${AdminUI.escapeHtml(order.entrega.receptorTercero.nombre)}</strong></p>
                    <p>${AdminUI.escapeHtml(order.entrega.receptorTercero.telefono)}</p>
                    <p>${AdminUI.escapeHtml(order.entrega.receptorTercero.relacion)}</p>
                </div>
            </section>
        ` : ""}

        <h4 class="admin-section-title">Fecha preferida</h4>
        <section class="admin-card">
            <div class="admin-card-body">
                <p>${orderDate(order.entrega?.fechaPreferida)}</p>
            </div>
        </section>

        ${order.metodoPago === "mercadopago" ? `
            <h4 class="admin-section-title">Mercado Pago</h4>
            <section class="admin-card">
                <div class="admin-card-body">
                    <div class="order-customization-summary">
                        <div><span>Preferencia</span><strong>${AdminUI.escapeHtml(order.mercadoPago?.preferenceId || "—")}</strong></div>
                        <div><span>ID del pago</span><strong>${AdminUI.escapeHtml(order.mercadoPago?.paymentId || "Aún no informado")}</strong></div>
                        <div><span>Estado externo</span><strong>${AdminUI.escapeHtml(order.mercadoPago?.status || "Pendiente")}</strong></div>
                        <div><span>Detalle</span><strong>${AdminUI.escapeHtml(order.mercadoPago?.statusDetail || "—")}</strong></div>
                    </div>
                </div>
            </section>
        ` : ""}

        <h4 class="admin-section-title">Productos y personalizaciones</h4>
        <div class="order-products-list">
            ${items || '<div class="admin-empty">Sin productos.</div>'}
        </div>

        <h4 class="admin-section-title">Actualizar pedido</h4>

        <div class="admin-form-grid">
            <div class="admin-field">
                <label for="order-status-edit">Estado del pedido</label>
                <select id="order-status-edit">
                    ${[
                        "pendiente",
                        "confirmado",
                        "validacion_diseno",
                        "en_produccion",
                        "listo",
                        "enviado",
                        "entregado",
                        "cancelado"
                    ].map((status) => `
                        <option value="${status}" ${status === order.estadoPedido ? "selected" : ""}>
                            ${status.replaceAll("_", " ")}
                        </option>
                    `).join("")}
                </select>
            </div>

            <div class="admin-field">
                <label for="order-payment-edit">Estado del pago</label>
                <select id="order-payment-edit">
                    ${[
                        "pendiente",
                        "pendiente_comprobante",
                        "comprobante_recibido",
                        "en_revision",
                        "pagado",
                        "rechazado",
                        "vencido",
                        "reembolsado"
                    ].map((status) => `
                        <option value="${status}" ${status === order.estadoPago ? "selected" : ""}>
                            ${status}
                        </option>
                    `).join("")}
                </select>
            </div>

            <div class="admin-field full">
                <label for="order-note-edit">Notas internas</label>
                <textarea id="order-note-edit">${AdminUI.escapeHtml(order.notasInternas || "")}</textarea>
            </div>
        </div>
    `;

    document.querySelectorAll(".upload-final-design").forEach((button) => {
        button.addEventListener("click", async () => {
            const block = button.closest("[data-line-id]");
            const file = block.querySelector(".design-file")?.files?.[0];

            if (!file) {
                AdminUI.toast("Selecciona la imagen del diseño.", "error");
                return;
            }

            const formData = new FormData();
            formData.append("archivo", file);
            formData.append("mensaje", block.querySelector(".design-message")?.value || "");
            formData.append("canal", block.querySelector(".design-channel")?.value || "cuenta");

            button.disabled = true;

            try {
                const updated = await AdminAPI.request(
                    `/admin/pedidos/${encodeURIComponent(currentOrderId)}/items/${encodeURIComponent(block.dataset.lineId)}/diseno`,
                    {
                        method: "POST",
                        body: formData
                    }
                );

                const index = adminOrders.findIndex(
                    (entry) => String(entry._id) === String(currentOrderId)
                );

                if (index >= 0) adminOrders[index] = updated;
                openOrder(currentOrderId);
                AdminUI.toast("Diseño publicado en la cuenta del cliente.", "success");
            } catch (error) {
                AdminUI.toast(error.message, "error");
                button.disabled = false;
            }
        });
    });

    document.querySelectorAll(".transfer-action").forEach((button) => {
        button.addEventListener("click", async () => {
            const action = button.dataset.action;
            const allowRetry = document.getElementById("transfer-retry")?.checked === true;

            if (
                action === "rechazar" &&
                !window.confirm(
                    allowRetry
                        ? "Se rechazará el comprobante y se abrirá un nuevo plazo de 3 horas."
                        : "Se cancelará el pedido y se liberará el stock. ¿Continuar?"
                )
            ) {
                return;
            }

            button.disabled = true;

            try {
                const updated = await AdminAPI.request(
                    `/admin/pedidos/${encodeURIComponent(currentOrderId)}/transferencia`,
                    {
                        method: "POST",
                        body: {
                            accion: action,
                            permitirReenvio: allowRetry,
                            observaciones: document.getElementById("transfer-note")?.value || "",
                            canal: "manual"
                        }
                    }
                );

                const index = adminOrders.findIndex(
                    (entry) => String(entry._id) === String(currentOrderId)
                );

                if (index >= 0) adminOrders[index] = updated;
                renderOrders();
                openOrder(currentOrderId);
                AdminUI.toast("Transferencia actualizada.", "success");
            } catch (error) {
                AdminUI.toast(error.message, "error");
                button.disabled = false;
            }
        });
    });

    AdminUI.openModal("order-modal");
}

async function syncPayment() {
    if (!currentOrderId) return;

    const button = document.getElementById("order-sync-payment");
    button.disabled = true;
    const original = button.innerHTML;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando';

    try {
        const updated = await AdminAPI.request(
            `/admin/pedidos/${encodeURIComponent(currentOrderId)}/sincronizar-pago`,
            {
                method: "POST",
                body: {}
            }
        );

        const index = adminOrders.findIndex(
            (order) => String(order._id) === String(currentOrderId)
        );

        if (index >= 0) adminOrders[index] = updated;
        renderOrders();
        openOrder(currentOrderId);
        AdminUI.toast("Pago sincronizado correctamente.");
    } catch (error) {
        AdminUI.toast(error.message, "error");
    } finally {
        button.disabled = false;
        button.innerHTML = original;
    }
}

async function saveOrder() {
    if (!currentOrderId) return;

    const button = document.getElementById("order-save");
    button.disabled = true;

    try {
        await AdminAPI.request(
            `/admin/pedidos/${currentOrderId}`,
            {
                method: "PATCH",
                body: {
                    estadoPedido: document.getElementById("order-status-edit").value,
                    estadoPago: document.getElementById("order-payment-edit").value,
                    notasInternas: document.getElementById("order-note-edit").value
                }
            }
        );

        AdminUI.toast("Pedido actualizado.", "success");
        AdminUI.closeModal("order-modal");
        loadOrders();
    } catch (error) {
        AdminUI.toast(error.message, "error");
    } finally {
        button.disabled = false;
    }
}
