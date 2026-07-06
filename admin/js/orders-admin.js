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
                const copyButton = event.target.closest("[data-copy-order-id]");
                if (copyButton) {
                    event.preventDefault();
                    copyOrderSummary(copyButton.dataset.copyOrderId);
                    return;
                }

                const button = event.target.closest("[data-order-id]");
                if (button) openOrder(button.dataset.orderId);
            });

        const orderDetail = document.getElementById("order-detail");

        orderDetail.addEventListener("click", (event) => {
            const copyButton = event.target.closest("[data-copy-order-id]");
            if (copyButton) {
                event.preventDefault();
                copyOrderSummary(copyButton.dataset.copyOrderId);
                return;
            }

            if (event.target.closest("[data-notification-preview]")) {
                event.preventDefault();
                loadNotificationPreview();
                return;
            }

            if (event.target.closest("[data-notification-copy]")) {
                event.preventDefault();
                copyNotificationPreview();
                return;
            }

            if (event.target.closest("[data-notification-whatsapp]")) {
                event.preventDefault();
                openNotificationWhatsapp();
                return;
            }

            if (event.target.closest("[data-notification-send-email]")) {
                event.preventDefault();
                sendNotificationEmail();
            }
        });

        orderDetail.addEventListener("change", (event) => {
            if (event.target?.id === "order-notification-event") {
                loadNotificationPreview();
            }
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

const ORDER_STATUS_LABELS = Object.freeze({
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    validacion_diseno: "Validación de diseño",
    en_produccion: "En producción",
    listo: "Listo",
    enviado: "Enviado",
    entregado: "Entregado",
    cancelado: "Cancelado"
});

const PAYMENT_STATUS_LABELS = Object.freeze({
    pendiente: "Pendiente",
    pendiente_comprobante: "Pendiente comprobante",
    comprobante_recibido: "Comprobante recibido",
    en_revision: "En revisión",
    pagado: "Pagado",
    rechazado: "Rechazado",
    vencido: "Vencido",
    reembolsado: "Reembolsado"
});


const ORDER_NOTIFICATION_LABELS = Object.freeze({
    order_created: "Pedido recibido",
    payment_confirmed: "Pago confirmado",
    design_review: "Diseño en revisión",
    production_started: "Pedido en producción",
    ready: "Pedido listo",
    shipped: "Pedido enviado",
    delivered: "Pedido entregado",
    cancelled: "Pedido cancelado",
    status_update: "Estado actualizado"
});

const ORDER_NOTIFICATION_FLOW = [
    "order_created",
    "payment_confirmed",
    "design_review",
    "production_started",
    "ready",
    "shipped",
    "delivered",
    "cancelled",
    "status_update"
];

function notificationLabel(event) {
    const key = String(event || "").trim();
    return ORDER_NOTIFICATION_LABELS[key] || key.replaceAll("_", " ") || "Actualización";
}

function recommendedNotificationEvent(order) {
    const payment = String(order?.estadoPago || "").trim();
    const status = String(order?.estadoPedido || "").trim();

    if (status === "cancelado") return "cancelled";
    if (status === "entregado") return "delivered";
    if (status === "enviado") return "shipped";
    if (status === "listo") return "ready";
    if (status === "en_produccion") return "production_started";
    if (status === "validacion_diseno") return "design_review";
    if (payment === "pagado") return "payment_confirmed";
    if (status === "pendiente") return "order_created";

    return "status_update";
}

function selectedNotificationEvent() {
    const select = document.getElementById("order-notification-event");
    const value = String(select?.value || "").trim();
    return ORDER_NOTIFICATION_LABELS[value] ? value : "status_update";
}

function renderNotificationPreviewState(message, tone = "muted") {
    return `
        <div class="order-notification-preview ${AdminUI.escapeHtml(tone)}">
            ${AdminUI.escapeHtml(message)}
        </div>
    `;
}

function renderOrderCommunication(order) {
    const recommended = recommendedNotificationEvent(order);
    const email = order?.cliente?.email || "";
    const phone = order?.cliente?.telefono || "";

    return `
        <details class="admin-order-accordion order-communication-panel" open>
            <summary>
                <span>Comunicación con el cliente</span>
                <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
            </summary>
            <section class="admin-card">
                <div class="admin-card-body">
                    <div class="order-communication-head">
                        <div>
                            <h4>Notificaciones de pedido</h4>
                            <p>Prepara mensajes claros para correo o WhatsApp según el estado actual.</p>
                        </div>
                        <span class="order-priority info">Post-compra</span>
                    </div>

                    <div class="admin-form-grid">
                        <div class="admin-field">
                            <label for="order-notification-event">Tipo de mensaje</label>
                            <select id="order-notification-event">
                                ${ORDER_NOTIFICATION_FLOW.map((event) => `
                                    <option value="${AdminUI.escapeHtml(event)}" ${event === recommended ? "selected" : ""}>
                                        ${AdminUI.escapeHtml(notificationLabel(event))}
                                    </option>
                                `).join("")}
                            </select>
                        </div>

                        <div class="order-communication-targets">
                            <span><i class="fa-regular fa-envelope"></i> ${AdminUI.escapeHtml(email || "Sin correo")}</span>
                            <span><i class="fa-brands fa-whatsapp"></i> ${AdminUI.escapeHtml(phone || "Sin teléfono")}</span>
                        </div>
                    </div>

                    <div id="order-notification-preview-wrap">
                        ${renderNotificationPreviewState("Cargando mensaje sugerido...")}
                    </div>

                    <div class="order-communication-actions">
                        <button class="admin-button secondary small" type="button" data-notification-preview>
                            <i class="fa-solid fa-rotate"></i>
                            Actualizar vista previa
                        </button>
                        <button class="admin-button secondary small" type="button" data-notification-copy>
                            <i class="fa-regular fa-copy"></i>
                            Copiar texto
                        </button>
                        <button class="admin-button secondary small" type="button" data-notification-whatsapp>
                            <i class="fa-brands fa-whatsapp"></i>
                            Abrir WhatsApp
                        </button>
                        <button class="admin-button small" type="button" data-notification-send-email>
                            <i class="fa-regular fa-paper-plane"></i>
                            Enviar correo
                        </button>
                    </div>

                    <p class="order-communication-note">
                        El correo se enviará solo si el backend tiene configurado Resend. Si no, el sistema dejará el mensaje listo para copiar o enviar por WhatsApp.
                    </p>
                </div>
            </section>
        </details>
    `;
}

const ORDER_FLOW = [
    { key: "pendiente", label: "Recibido", icon: "fa-receipt" },
    { key: "confirmado", label: "Confirmado", icon: "fa-circle-check" },
    { key: "validacion_diseno", label: "Diseño", icon: "fa-pen-ruler" },
    { key: "en_produccion", label: "Producción", icon: "fa-gears" },
    { key: "listo", label: "Listo", icon: "fa-box" },
    { key: "enviado", label: "Entrega", icon: "fa-truck" },
    { key: "entregado", label: "Entregado", icon: "fa-house-circle-check" }
];

function orderStatusLabel(status) {
    const key = String(status || "").trim();
    return ORDER_STATUS_LABELS[key] || key.replaceAll("_", " ") || "Sin estado";
}

function paymentStatusLabel(status) {
    const key = String(status || "").trim();
    return PAYMENT_STATUS_LABELS[key] || key.replaceAll("_", " ") || "Sin estado";
}

function orderItemsCount(order) {
    return (order.items || []).reduce((total, item) => total + (Number(item.cantidad) || 1), 0);
}

function orderHasCustomization(order) {
    return (order.items || []).some((item) => {
        const resumen = item.personalizacionResumen?.tipo;
        return resumen && resumen !== "ninguna" || Boolean(customizationOf(item));
    });
}

function orderProgressIndex(order) {
    const status = String(order?.estadoPedido || "pendiente");
    if (status === "cancelado") return -1;
    const index = ORDER_FLOW.findIndex((step) => step.key === status);
    return index >= 0 ? index : 0;
}

function orderAgeLabel(order) {
    const createdAt = new Date(order?.createdAt || 0).getTime();
    if (!createdAt) return "Fecha no informada";

    const diff = Date.now() - createdAt;
    const hours = Math.floor(diff / 36e5);
    if (hours < 1) return "Hace menos de 1 hora";
    if (hours < 24) return `Hace ${hours} h`;

    const days = Math.floor(hours / 24);
    return days === 1 ? "Hace 1 día" : `Hace ${days} días`;
}

function orderUrgency(order) {
    const status = String(order?.estadoPedido || "");
    const payment = String(order?.estadoPago || "");

    if (status === "cancelado" || payment === "rechazado" || payment === "vencido") {
        return { tone: "danger", label: "Revisar" };
    }

    if (payment !== "pagado") {
        return { tone: "warning", label: "Pago pendiente" };
    }

    if (["validacion_diseno", "en_produccion"].includes(status)) {
        return { tone: "info", label: "En proceso" };
    }

    if (["listo", "enviado"].includes(status)) {
        return { tone: "success", label: "Coordinar entrega" };
    }

    return { tone: "info", label: "Operativo" };
}

function customerWhatsAppUrl(order) {
    const phone = whatsappDigits(order?.cliente?.telefono);
    if (!phone) return "";

    const message = encodeURIComponent(
        `Hola ${order.cliente?.nombre || ""}, te contactamos por tu pedido ${order.numeroPedido} en Mommy Crafts. Estado actual: ${orderStatusLabel(order.estadoPedido)}.`
    );

    return `https://wa.me/${phone}?text=${message}`;
}

function buildOrderSummaryText(order) {
    const products = (order.items || [])
        .map((item) => `- ${item.nombre} x${Number(item.cantidad) || 1}${item.color ? ` · ${item.color}` : ""}`)
        .join("\n");

    return [
        `Pedido: ${order.numeroPedido || "—"}`,
        `Cliente: ${order.cliente?.nombre || "—"}`,
        `Correo: ${order.cliente?.email || "—"}`,
        `Teléfono: ${order.cliente?.telefono || "—"}`,
        `Total: ${AdminUI.money(order.total)}`,
        `Pago: ${paymentStatusLabel(order.estadoPago)}`,
        `Estado: ${orderStatusLabel(order.estadoPedido)}`,
        "",
        "Productos:",
        products || "Sin productos registrados",
        "",
        `Entrega: ${order.entrega?.metodo === "retiro" ? "Retiro" : "Envío"}`,
        order.entrega?.direccion || order.cliente?.direccion
            ? `Dirección: ${order.entrega?.direccion || order.cliente?.direccion || ""}, ${order.entrega?.comuna || order.cliente?.comuna || ""}`
            : ""
    ].filter((line) => line !== "").join("\n");
}

async function copyOrderSummary(id) {
    const order = adminOrders.find((entry) => String(entry._id) === String(id));
    if (!order) return;

    const text = buildOrderSummaryText(order);

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const input = document.createElement("textarea");
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            input.remove();
        }

        AdminUI.toast("Resumen del pedido copiado.", "success");
    } catch {
        AdminUI.toast("No fue posible copiar el resumen.", "error");
    }
}

function renderOrderInsights() {
    const total = adminOrders.length;
    const paid = adminOrders.filter((order) => order.estadoPago === "pagado").length;
    const pendingPayment = adminOrders.filter((order) => order.estadoPago !== "pagado").length;
    const production = adminOrders.filter((order) => ["validacion_diseno", "en_produccion"].includes(order.estadoPedido)).length;
    const ready = adminOrders.filter((order) => ["listo", "enviado"].includes(order.estadoPedido)).length;
    const revenue = adminOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

    return `
        <section class="orders-admin-insights" aria-label="Resumen operativo de pedidos">
            <article class="orders-admin-kpi">
                <span>Pedidos filtrados</span>
                <strong>${total}</strong>
                <small>Según búsqueda y estado actual</small>
            </article>

            <article class="orders-admin-kpi success">
                <span>Pagados</span>
                <strong>${paid}</strong>
                <small>${AdminUI.money(revenue)} en la vista actual</small>
            </article>

            <article class="orders-admin-kpi warning">
                <span>Pago pendiente</span>
                <strong>${pendingPayment}</strong>
                <small>Revisar comprobantes o Mercado Pago</small>
            </article>

            <article class="orders-admin-kpi info">
                <span>Producción / entrega</span>
                <strong>${production + ready}</strong>
                <small>${production} en proceso · ${ready} por entregar</small>
            </article>
        </section>
    `;
}

function renderOrderProgress(order) {
    const progressIndex = orderProgressIndex(order);
    const cancelled = String(order?.estadoPedido || "") === "cancelado";

    if (cancelled) {
        return `
            <div class="order-admin-progress cancelled">
                <span><i class="fa-solid fa-ban"></i> Pedido cancelado</span>
            </div>
        `;
    }

    return `
        <div class="order-admin-progress">
            ${ORDER_FLOW.map((step, index) => `
                <span class="${index <= progressIndex ? "active" : ""}">
                    <i class="fa-solid ${step.icon}"></i>
                    ${AdminUI.escapeHtml(step.label)}
                </span>
            `).join("")}
        </div>
    `;
}

function renderOrderHero(order) {
    const whatsappUrl = customerWhatsAppUrl(order);
    const urgency = orderUrgency(order);
    const customized = orderHasCustomization(order);

    return `
        <section class="order-admin-hero">
            <div class="order-admin-hero-main">
                <span class="order-priority ${AdminUI.escapeHtml(urgency.tone)}">
                    ${AdminUI.escapeHtml(urgency.label)}
                </span>

                <h4>${AdminUI.escapeHtml(order.numeroPedido || "Pedido")}</h4>

                <p>
                    ${AdminUI.escapeHtml(order.cliente?.nombre || "Cliente sin nombre")} ·
                    ${orderItemsCount(order)} unidad${orderItemsCount(order) === 1 ? "" : "es"} ·
                    ${customized ? "Incluye personalización" : "Sin personalización"}
                </p>
            </div>

            <div class="order-admin-hero-actions">
                ${whatsappUrl ? `
                    <a class="admin-button secondary small" href="${AdminUI.escapeHtml(whatsappUrl)}" target="_blank" rel="noopener">
                        <i class="fa-brands fa-whatsapp"></i>
                        WhatsApp
                    </a>
                ` : ""}

                <button class="admin-button secondary small" type="button" data-copy-order-id="${AdminUI.escapeHtml(order._id)}">
                    <i class="fa-regular fa-copy"></i>
                    Copiar resumen
                </button>
            </div>

            ${renderOrderProgress(order)}
        </section>
    `;
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
                        ${item.talla || item.personalizacion?.talla || item.personalizacion?.size ? `Talla: ${AdminUI.escapeHtml(item.talla || item.personalizacion?.talla || item.personalizacion?.size)} · ` : ""}
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
            <div class="admin-empty">
                <i class="fa-regular fa-folder-open" aria-hidden="true"></i>
                <p>No se encontraron pedidos con los filtros actuales.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        ${renderOrderInsights()}

        <div class="orders-admin-table-heading">
            <div>
                <h3>Pedidos activos</h3>
                <p class="orders-last-sync">Vista actualizada hace unos segundos.</p>
            </div>
            <span>${adminOrders.length} resultado${adminOrders.length === 1 ? "" : "s"}</span>
        </div>

        <table class="admin-table orders-admin-table">
            <thead>
                <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Avance</th>
                    <th>Total</th>
                    <th>Pago</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>

            <tbody>
                ${adminOrders.map((order) => {
                    const urgency = orderUrgency(order);
                    const whatsappUrl = customerWhatsAppUrl(order);
                    const hasCustomization = orderHasCustomization(order);
                    const units = orderItemsCount(order);

                    return `
                    <tr>
                        <td data-label="Pedido">
                            <div class="orders-admin-order-code">
                                <strong>${AdminUI.escapeHtml(order.numeroPedido)}</strong>
                                <span class="order-priority ${AdminUI.escapeHtml(urgency.tone)}">${AdminUI.escapeHtml(urgency.label)}</span>
                            </div>
                            <small>${AdminUI.escapeHtml(orderAgeLabel(order))}</small>
                        </td>
                        <td data-label="Cliente">
                            <strong>${AdminUI.escapeHtml(order.cliente?.nombre || "—")}</strong>
                            <div class="orders-admin-client-meta">
                                ${AdminUI.escapeHtml(order.cliente?.email || "")}
                                ${order.cliente?.telefono ? `<br>${AdminUI.escapeHtml(order.cliente.telefono)}` : ""}
                            </div>
                        </td>
                        <td data-label="Avance">
                            <div class="orders-admin-mini-progress">
                                ${renderOrderProgress(order)}
                            </div>
                            <small>
                                ${units} unidad${units === 1 ? "" : "es"}
                                ${hasCustomization ? " · personalizado" : ""}
                            </small>
                        </td>
                        <td data-label="Total"><strong>${AdminUI.money(order.total)}</strong></td>
                        <td data-label="Pago">
                            <span class="admin-status ${AdminUI.statusClass(order.estadoPago)}">
                                ${AdminUI.escapeHtml(paymentStatusLabel(order.estadoPago))}
                            </span>
                        </td>
                        <td data-label="Estado">
                            <span class="admin-status ${AdminUI.statusClass(order.estadoPedido)}">
                                ${AdminUI.escapeHtml(orderStatusLabel(order.estadoPedido))}
                            </span>
                        </td>
                        <td data-label="Acciones">
                            <div class="orders-admin-actions">
                                <button class="admin-button secondary small" type="button" data-order-id="${AdminUI.escapeHtml(order._id)}">
                                    Ver
                                </button>
                                <button class="admin-button secondary small" type="button" data-copy-order-id="${AdminUI.escapeHtml(order._id)}" title="Copiar resumen">
                                    <i class="fa-regular fa-copy"></i>
                                </button>
                                ${whatsappUrl ? `
                                    <a class="admin-button secondary small" href="${AdminUI.escapeHtml(whatsappUrl)}" target="_blank" rel="noopener" title="Contactar por WhatsApp">
                                        <i class="fa-brands fa-whatsapp"></i>
                                    </a>
                                ` : ""}
                            </div>
                        </td>
                    </tr>
                `;}).join("")}
            </tbody>
        </table>
    `;

    document.dispatchEvent(new CustomEvent("orders:rendered"));
}

function openOrder(id) {
    const order = adminOrders.find(
        (item) => String(item._id) === String(id)
    );

    if (!order) return;

    currentOrderId = String(order._id);
    window.currentOrderNotificationPreview = null;
    document.getElementById("order-modal-title").textContent = order.numeroPedido;

    const syncButton = document.getElementById("order-sync-payment");
    syncButton.hidden = order.metodoPago !== "mercadopago";

    const items = (order.items || [])
        .map((item) => renderOrderItem(item, order))
        .join("");

    document.getElementById("order-detail").innerHTML = `
        ${renderOrderHero(order)}
        ${renderOrderCommunication(order)}

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
                    <p>Envío: <strong>${String(order.entrega?.modalidadEnvio || "").toLowerCase().includes("chilexpress") ? "Por pagar a Chilexpress" : AdminUI.money(order.costoEnvio)}</strong></p>
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

        <details class="admin-order-accordion">
            <summary>
                <span>Entrega</span>
                <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
            </summary>
            <section class="admin-card">
                <div class="admin-card-body">
                    <p>
                        <strong>
                            ${order.entrega?.metodo === "retiro" ? "Retiro coordinado" : "Envío a domicilio"}
                        </strong>
                    </p>
                    ${order.entrega?.metodo === "envio" ? `
                        <p>Zona: <strong>${order.entrega?.zonaEnvio === "santiago" ? "Provincia de Santiago" : "Otros sectores de Chile"}</strong></p>
                        <p>Modalidad: <strong>${String(order.entrega?.modalidadEnvio || "").toLowerCase().includes("chilexpress") ? "Chilexpress por pagar" : "Envío local $4.000"}</strong></p>
                    ` : ""}
                    <div class="order-instructions">
                        <strong>Instrucciones aplicables</strong>
                        <p>${AdminUI.escapeHtml(order.entrega?.instrucciones || "El pedido no registra instrucciones de entrega.")}</p>
                    </div>
                </div>
            </section>
        </details>

        ${order.metodoPago === "transferencia" ? `
            <details class="admin-order-accordion">
                <summary>
                    <span>Transferencia bancaria</span>
                    <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
                </summary>
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
            </details>
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

        <details class="admin-order-accordion">
            <summary>
                <span>${order.entrega?.metodo === "retiro" ? "Fecha preferida" : "Fecha estimada"}</span>
                <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
            </summary>
            <section class="admin-card">
                <div class="admin-card-body">
                    ${order.entrega?.metodo === "retiro"
                        ? `<p>${orderDate(order.entrega?.fechaPreferida)}</p>`
                        : `<p>Desde: <strong>${orderDate(order.entrega?.fechaMinima)}</strong></p>
                           ${order.entrega?.fechaEstimadaHasta ? `<p>Hasta: <strong>${orderDate(order.entrega.fechaEstimadaHasta)}</strong></p>` : ""}`}
                </div>
            </section>
        </details>

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

        <details class="admin-order-accordion">
            <summary>
                <span>Productos y personalizaciones</span>
                <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
            </summary>
            <div class="order-products-list">
                ${items || '<div class="admin-empty">Sin productos.</div>'}
            </div>
        </details>

        <details class="admin-order-accordion">
            <summary>
                <span>Actualizar pedido</span>
                <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
            </summary>
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
        </details>
    `;

    loadNotificationPreview();

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


async function loadNotificationPreview() {
    if (!currentOrderId) return null;

    const wrap = document.getElementById("order-notification-preview-wrap");
    const event = selectedNotificationEvent();
    if (!wrap) return null;

    wrap.innerHTML = renderNotificationPreviewState("Preparando mensaje...");

    try {
        const preview = await AdminAPI.request(
            `/admin/pedidos/${encodeURIComponent(currentOrderId)}/notificaciones/${encodeURIComponent(event)}`
        );

        window.currentOrderNotificationPreview = preview;
        wrap.innerHTML = `
            <article class="order-notification-preview ready">
                <div class="order-notification-meta">
                    <span>${AdminUI.escapeHtml(preview.etiqueta || notificationLabel(event))}</span>
                    <strong>${AdminUI.escapeHtml(preview.asunto || "Actualización de pedido")}</strong>
                </div>
                <textarea id="order-notification-text" readonly>${AdminUI.escapeHtml(preview.whatsappTexto || preview.texto || "")}</textarea>
                <div class="order-notification-links">
                    ${preview.seguimientoUrl ? `<a href="${AdminUI.escapeHtml(safeUrl(preview.seguimientoUrl))}" target="_blank" rel="noopener">Ver seguimiento del cliente</a>` : ""}
                    ${preview.correoPara ? `<span>Correo: ${AdminUI.escapeHtml(preview.correoPara)}</span>` : `<span>Correo no registrado</span>`}
                </div>
            </article>
        `;

        return preview;
    } catch (error) {
        window.currentOrderNotificationPreview = null;
        wrap.innerHTML = renderNotificationPreviewState(error.message, "danger");
        return null;
    }
}

async function getNotificationPreview() {
    return window.currentOrderNotificationPreview || await loadNotificationPreview();
}

async function copyNotificationPreview() {
    const preview = await getNotificationPreview();
    const text = preview?.whatsappTexto || preview?.texto || "";

    if (!text) {
        AdminUI.toast("No hay mensaje para copiar.", "error");
        return;
    }

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const input = document.createElement("textarea");
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            input.remove();
        }

        AdminUI.toast("Mensaje copiado.", "success");
    } catch {
        AdminUI.toast("No fue posible copiar el mensaje.", "error");
    }
}

async function openNotificationWhatsapp() {
    const preview = await getNotificationPreview();
    const url = safeUrl(preview?.whatsappUrl);

    if (!url) {
        AdminUI.toast("Este pedido no tiene teléfono válido para WhatsApp.", "error");
        return;
    }

    window.open(url, "_blank", "noopener");
}

async function sendNotificationEmail() {
    if (!currentOrderId) return;

    const button = document.querySelector("[data-notification-send-email]");
    const event = selectedNotificationEvent();
    const original = button?.innerHTML || "";

    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando';
    }

    try {
        const result = await AdminAPI.request(
            `/admin/pedidos/${encodeURIComponent(currentOrderId)}/notificaciones/${encodeURIComponent(event)}`,
            {
                method: "POST",
                body: { email: true }
            }
        );

        const sent = Boolean(result?.correo?.sent);
        const skipped = Boolean(result?.correo?.skipped);
        const reason = result?.correo?.reason || "";

        if (sent) {
            AdminUI.toast("Correo enviado al cliente.", "success");
        } else if (skipped) {
            AdminUI.toast(reason || "Correo no enviado: mensaje preparado.", "info");
        } else {
            AdminUI.toast(reason || "No fue posible enviar el correo.", "error");
        }

        await loadOrders();
        if (currentOrderId) openOrder(currentOrderId);
    } catch (error) {
        AdminUI.toast(error.message, "error");
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = original;
        }
    }
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
