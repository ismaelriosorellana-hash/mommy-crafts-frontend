
"use strict";

(function () {
    const form = document.getElementById("tracking-form");
    const orderInput = document.getElementById("tracking-order-number");
    const emailInput = document.getElementById("tracking-email");
    const result = document.getElementById("tracking-result");
    const side = document.getElementById("tracking-side");
    const sessionButton = document.getElementById("tracking-session-button");
    const params = new URLSearchParams(location.search);

    const moneyFormatter = new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
    });

    function money(value) {
        return moneyFormatter.format(Number(value) || 0);
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/"/g, "&quot;");
    }

    function dateTime(value) {
        if (!value) return "—";
        try {
            return new Intl.DateTimeFormat("es-CL", {
                dateStyle: "medium",
                timeStyle: "short"
            }).format(new Date(value));
        } catch {
            return "—";
        }
    }

    function dateOnly(value) {
        if (!value) return "—";
        try {
            return new Intl.DateTimeFormat("es-CL", {
                dateStyle: "long",
                timeZone: "America/Santiago"
            }).format(new Date(value));
        } catch {
            return "—";
        }
    }

    function statusLabel(value) {
        const labels = {
            pendiente: "Pendiente",
            pendiente_comprobante: "Pendiente de comprobante",
            comprobante_recibido: "Comprobante recibido",
            en_revision: "En revisión",
            confirmado: "Confirmado",
            validacion_diseno: "Validación de diseño",
            en_produccion: "En fabricación",
            listo: "Listo para entrega",
            enviado: "Enviado",
            entregado: "Entregado",
            cancelado: "Cancelado",
            pagado: "Pagado",
            rechazado: "Pago rechazado",
            vencido: "Plazo vencido",
            reembolsado: "Reembolsado",
            enviado_diseno: "Diseño enviado",
            diseno_enviado: "Diseño enviado",
            diseno_aprobado: "Diseño aprobado",
            cambios_solicitados: "Cambios solicitados",
            corregido: "Diseño corregido",
            aprobado: "Aprobado"
        };
        return labels[value] || value || "Pendiente";
    }

    function statusType(value) {
        if (["pagado", "confirmado", "listo", "enviado", "entregado", "aprobado", "diseno_aprobado"].includes(value)) {
            return "is-success";
        }
        if (["rechazado", "cancelado", "vencido", "reembolsado"].includes(value)) {
            return "is-danger";
        }
        return "is-warning";
    }

    function hasSession() {
        return Boolean(
            window.CustomerAuth?.getToken?.() &&
            window.CustomerAuth?.getUser?.()?.rol === "cliente"
        );
    }

    function assetUrl(asset) {
        if (!asset) return "";
        if (typeof asset === "string") return asset;
        return asset.secure_url || asset.url || asset.src || "";
    }

    function orderItemImage(item) {
        const customization = item?.personalizacion || item?.customization || {};
        const summary = item?.personalizacionResumen || item?.customizationSummary || {};
        const simpleAssets = Array.isArray(customization?.assets?.images)
            ? customization.assets.images
            : [];
        return assetUrl(summary.vistaPrevia) ||
            assetUrl(summary.preview) ||
            assetUrl(customization?.assets?.preview) ||
            assetUrl(customization?.assets?.finalPreview) ||
            assetUrl(customization?.finalPreview?.asset) ||
            assetUrl(customization?.finalPreviewUrl) ||
            assetUrl(customization?.summaryPreviewUrl) ||
            assetUrl(customization?.previewUrl) ||
            assetUrl(simpleAssets[0]) ||
            assetUrl(customization?.assets?.original) ||
            assetUrl(customization?.image?.asset) ||
            item?.imagen || item?.image ||
            window.CONFIG?.placeholderImage || "";
    }

    function personalizationText(item) {
        const summary = item?.personalizacionResumen || {};
        const personalization = item?.personalizacion || {};
        const values = [
            summary.label,
            summary.detalle,
            summary.tipo && summary.tipo !== "ninguna" ? `Personalización: ${statusLabel(summary.tipo)}` : "",
            personalization.requestedName,
            personalization.mainText,
            personalization.secondaryText,
            personalization.texts?.main?.value,
            personalization.texts?.secondary?.value
        ].filter((value) => String(value || "").trim());
        return values.length ? values.slice(0, 3).join(" · ") : "Producto sin personalización registrada";
    }

    function normalizeOrder(payload) {
        return payload?.pedido || payload?.order || payload || null;
    }

    async function tryPublicLookup(number, email) {
        const query = `numeroPedido=${encodeURIComponent(number)}&email=${encodeURIComponent(email)}`;
        const attempts = [
            `/pedidos/seguimiento?${query}`,
            `/pedidos/seguimiento/${encodeURIComponent(number)}?email=${encodeURIComponent(email)}`,
            `/seguimiento-pedido?${query}`
        ];

        let lastError = null;
        for (const endpoint of attempts) {
            try {
                const data = await API.request(endpoint, {
                    timeoutMs: 30000,
                    retries: 0
                });
                return normalizeOrder(data);
            } catch (error) {
                lastError = error;
                if (![404, 405].includes(Number(error.status))) {
                    throw error;
                }
            }
        }

        const unavailable = new Error(
            "El seguimiento público todavía no está disponible para esta consulta. Inicia sesión o escríbenos por WhatsApp con tu número de pedido."
        );
        unavailable.status = lastError?.status || 404;
        throw unavailable;
    }

    async function getOrderByQuery() {
        const id = params.get("id") || params.get("pedidoId") || "";
        const number = params.get("pedido") || params.get("numeroPedido") || "";
        const email = params.get("email") || "";

        if (id && hasSession()) {
            return normalizeOrder(await CustomerAuth.getOrder(id));
        }

        if (number && email) {
            orderInput.value = number;
            emailInput.value = email;
            return tryPublicLookup(number, email);
        }

        if (number) {
            orderInput.value = number;
        }

        return null;
    }

    function currentStep(order) {
        if (!order) return "received";
        if (["rechazado", "cancelado", "vencido", "reembolsado"].includes(order.estadoPago) || order.estadoPedido === "cancelado") {
            return "problem";
        }
        if (order.estadoPago !== "pagado") return "payment";
        if (["validacion_diseno", "en_revision", "diseno_enviado", "cambios_solicitados", "corregido"].includes(order.estadoPedido)) return "design";
        if (["confirmado", "en_produccion", "aprobado", "diseno_aprobado"].includes(order.estadoPedido)) return "production";
        if (["listo", "enviado", "entregado"].includes(order.estadoPedido)) return "delivery";
        return "design";
    }

    function stepClass(order, step) {
        const orderSteps = ["received", "payment", "design", "production", "delivery"];
        const current = currentStep(order);
        if (current === "problem") return step === "payment" ? "is-current" : "";
        const currentIndex = orderSteps.indexOf(current);
        const stepIndex = orderSteps.indexOf(step);
        if (stepIndex < currentIndex) return "is-done";
        if (stepIndex === currentIndex) return "is-current";
        return "";
    }

    function renderSteps(order) {
        const paymentCopy = order?.estadoPago === "pagado"
            ? "Pago confirmado. Tu compra puede avanzar al siguiente paso."
            : "Esperamos la confirmación del pago para avanzar.";
        return `
            <ol class="tracking-steps" aria-label="Estado del pedido">
                <li class="tracking-step ${stepClass(order, "received")}">
                    <span class="tracking-step-icon"><i class="fa-solid fa-receipt" aria-hidden="true"></i></span>
                    <span><strong>Pedido recibido</strong><span>Guardamos productos, entrega y personalización.</span></span>
                </li>
                <li class="tracking-step ${stepClass(order, "payment")}">
                    <span class="tracking-step-icon"><i class="fa-solid fa-credit-card" aria-hidden="true"></i></span>
                    <span><strong>Pago</strong><span>${escapeHtml(paymentCopy)}</span></span>
                </li>
                <li class="tracking-step ${stepClass(order, "design")}">
                    <span class="tracking-step-icon"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i></span>
                    <span><strong>Revisión del diseño</strong><span>Si corresponde, revisamos la vista final antes de fabricar.</span></span>
                </li>
                <li class="tracking-step ${stepClass(order, "production")}">
                    <span class="tracking-step-icon"><i class="fa-solid fa-shirt" aria-hidden="true"></i></span>
                    <span><strong>Fabricación</strong><span>Preparamos tu producto cuando pago y diseño estén listos.</span></span>
                </li>
                <li class="tracking-step ${stepClass(order, "delivery")}">
                    <span class="tracking-step-icon"><i class="fa-solid fa-truck-fast" aria-hidden="true"></i></span>
                    <span><strong>Retiro o envío</strong><span>Coordinamos la entrega según la opción seleccionada.</span></span>
                </li>
            </ol>
        `;
    }

    function renderProducts(order) {
        const items = Array.isArray(order?.items) ? order.items : [];
        if (!items.length) {
            return `
                <div class="tracking-empty">
                    <i class="fa-solid fa-box-open" aria-hidden="true"></i>
                    <p>El detalle de productos aparecerá cuando el pedido termine de sincronizarse.</p>
                </div>
            `;
        }
        return `
            <div class="tracking-products">
                ${items.map((item) => `
                    <article class="tracking-product">
                        <a class="tracking-product-image" href="${escapeAttribute(orderItemImage(item))}" target="_blank" rel="noopener" aria-label="Ver imagen de ${escapeAttribute(item.nombre || "producto")}">
                            <img src="${escapeAttribute(orderItemImage(item))}" alt="${escapeAttribute(item.nombre || "Producto del pedido")}">
                        </a>
                        <div>
                            <h3>${escapeHtml(item.nombre || item.name || "Producto")}</h3>
                            <p>Cantidad: ${Number(item.cantidad || item.quantity) || 1}</p>
                            ${item.color ? `<small>Color: ${escapeHtml(item.color)}</small>` : ""}
                            ${item.talla || item.size ? `<small>Talla: ${escapeHtml(item.talla || item.size)}</small>` : ""}
                            <small>${escapeHtml(personalizationText(item))}</small>
                        </div>
                        <strong class="tracking-product-price">${money(item.subtotal || item.total || item.precio || item.price)}</strong>
                    </article>
                `).join("")}
            </div>
        `;
    }

    function renderHistory(order) {
        const history = Array.isArray(order?.historial) ? order.historial : [];
        if (!history.length) {
            return '<p class="tracking-help">Todavía no hay actualizaciones registradas. La línea de estado se actualizará cuando el pedido avance.</p>';
        }
        return `
            <div class="tracking-history">
                ${history.slice().reverse().map((entry) => `
                    <div class="tracking-history-entry">
                        <strong>${escapeHtml(statusLabel(entry.estado))}</strong>
                        ${entry.detalle ? `<p>${escapeHtml(entry.detalle)}</p>` : ""}
                        <span>${dateTime(entry.fecha)}</span>
                    </div>
                `).join("")}
            </div>
        `;
    }

    function whatsappUrl(order) {
        const number = order?.numeroPedido || orderInput.value || "mi pedido";
        const message = encodeURIComponent(`Hola, necesito consultar el estado del pedido ${number}.`);
        return `${window.CONFIG?.social?.whatsapp || "https://wa.me/56954633848"}?text=${message}`;
    }

    function renderOrder(order) {
        if (!order) return;
        const number = order.numeroPedido || order.id || order._id || "Pedido";
        const paymentClass = statusType(order.estadoPago);
        const orderClass = statusType(order.estadoPedido);
        const method = order.entrega?.metodo || order.metodoEntrega || "";

        result.innerHTML = `
            <section class="tracking-result-card">
                <div class="tracking-status-header">
                    <div>
                        <span class="tracking-order-number"><i class="fa-solid fa-hashtag" aria-hidden="true"></i>${escapeHtml(number)}</span>
                        <h2 style="margin-top:1.3rem">Estado de tu pedido</h2>
                        <p class="tracking-help">Última consulta: ${dateTime(new Date())}</p>
                    </div>
                    <div style="display:grid;gap:.7rem;justify-items:start">
                        <span class="tracking-status-pill ${orderClass}">${escapeHtml(statusLabel(order.estadoPedido))}</span>
                        <span class="tracking-status-pill ${paymentClass}">${escapeHtml(statusLabel(order.estadoPago))}</span>
                    </div>
                </div>
                ${renderSteps(order)}
                <h2 style="margin-top:2.4rem">Productos del pedido</h2>
                ${renderProducts(order)}
            </section>
        `;

        side.innerHTML = `
            <section class="tracking-side-card">
                <h2>Resumen</h2>
                <dl class="tracking-summary-list">
                    <div class="tracking-summary-row"><dt>Número</dt><dd>${escapeHtml(number)}</dd></div>
                    <div class="tracking-summary-row"><dt>Total</dt><dd>${money(order.total)}</dd></div>
                    ${order.subtotal ? `<div class="tracking-summary-row"><dt>Subtotal</dt><dd>${money(order.subtotal)}</dd></div>` : ""}
                    ${method ? `<div class="tracking-summary-row"><dt>Entrega</dt><dd>${method === "retiro" ? "Retiro" : "Envío"}</dd></div>` : ""}
                    ${order.entrega?.fechaPreferida ? `<div class="tracking-summary-row"><dt>Fecha preferida</dt><dd>${dateOnly(order.entrega.fechaPreferida)}</dd></div>` : ""}
                    ${order.createdAt ? `<div class="tracking-summary-row"><dt>Creado</dt><dd>${dateTime(order.createdAt)}</dd></div>` : ""}
                </dl>
                <div class="tracking-actions">
                    ${order.id || order._id ? `<a class="btn-secondary" href="pedido.html?id=${encodeURIComponent(order.id || order._id)}">Ver detalle completo</a>` : ""}
                    <a class="btn-secondary" href="${escapeAttribute(whatsappUrl(order))}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> WhatsApp</a>
                </div>
            </section>
            <section class="tracking-side-card" style="margin-top:1.6rem">
                <h2>Historial</h2>
                ${renderHistory(order)}
            </section>
        `;
    }

    function renderEmpty() {
        result.innerHTML = `
            <section class="tracking-empty">
                <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
                <h2>Busca tu pedido</h2>
                <p>Ingresa el número de pedido y el correo usado en la compra. Si tienes sesión iniciada, también puedes revisar desde “Mi cuenta”.</p>
            </section>
        `;
        side.innerHTML = `
            <section class="tracking-side-card">
                <h2>Estados habituales</h2>
                ${renderSteps({ estadoPago: "pendiente", estadoPedido: "pendiente" })}
            </section>
        `;
    }

    function renderError(message) {
        result.innerHTML = `
            <section class="tracking-result-card">
                <div class="tracking-notice is-error">
                    <strong>No pudimos consultar el pedido.</strong><br>
                    ${escapeHtml(message)}
                </div>
                <div class="tracking-actions">
                    <a class="btn-primary" href="acceso.html?modo=login&next=cuenta.html#pedidos">Iniciar sesión</a>
                    <a class="btn-secondary" href="${escapeAttribute(whatsappUrl(null))}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
                </div>
            </section>
        `;
    }

    async function submitLookup(event) {
        event?.preventDefault?.();
        const number = orderInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        if (!number || !email) return;
        const button = form.querySelector("button[type='submit']");
        const original = button.textContent;
        button.disabled = true;
        button.textContent = "Consultando...";
        result.innerHTML = `
            <section class="tracking-empty">
                <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                <p>Consultando el estado del pedido...</p>
            </section>
        `;
        try {
            const order = await tryPublicLookup(number, email);
            renderOrder(order);
            const url = new URL(location.href);
            url.searchParams.set("pedido", number);
            url.searchParams.set("email", email);
            history.replaceState(null, "", url.toString());
        } catch (error) {
            renderError(error.message || "Revisa el número de pedido y el correo ingresado.");
        } finally {
            button.disabled = false;
            button.textContent = original;
        }
    }

    async function init() {
        if (sessionButton) {
            sessionButton.hidden = !hasSession();
        }
        renderEmpty();
        form?.addEventListener("submit", submitLookup);
        try {
            const order = await getOrderByQuery();
            if (order) renderOrder(order);
        } catch (error) {
            renderError(error.message || "No fue posible cargar el seguimiento del pedido.");
        }
    }

    document.addEventListener("DOMContentLoaded", init);
})();
