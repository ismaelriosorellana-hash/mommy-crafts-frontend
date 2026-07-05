"use strict";

(function () {
    const params = new URLSearchParams(location.search);
    const pending = (() => {
        try {
            return JSON.parse(
                sessionStorage.getItem("mommycrafts_pending_payment") || "{}"
            );
        } catch {
            return {};
        }
    })();

    const orderId = params.get("pedido") || pending.pedidoId || "";
    const token = params.get("token") || pending.token || "";
    const paymentId = params.get("payment_id") || params.get("collection_id") || "";

    const card = document.getElementById("payment-result-card");
    const title = document.getElementById("payment-result-title");
    const message = document.getElementById("payment-result-message");
    const icon = document.getElementById("payment-result-icon");
    const kicker = card?.querySelector(".section-kicker");
    const orderBox = document.getElementById("payment-result-order");
    const retry = document.getElementById("payment-retry");
    const accountLink = document.getElementById("payment-account-link");

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
            reembolsado: "Reembolsado"
        };
        return labels[value] || value || "Pendiente";
    }

    function statusType(value) {
        if (["pagado", "confirmado", "entregado", "listo", "enviado"].includes(value)) {
            return "is-success";
        }
        if (["rechazado", "cancelado", "vencido", "reembolsado"].includes(value)) {
            return "is-danger";
        }
        return "is-warning";
    }

    function endpoint(suffix) {
        const query = token
            ? `?token=${encodeURIComponent(token)}`
            : "";
        return `/pagos/mercadopago/pedidos/${encodeURIComponent(orderId)}/${suffix}${query}`;
    }

    function orderPublicId(order) {
        return order?.numeroPedido || pending.numeroPedido || orderId || "—";
    }

    function orderDetailHref(order) {
        const id = order?.id || order?._id || orderId;
        return id ? `pedido.html?id=${encodeURIComponent(id)}` : "cuenta.html#pedidos";
    }

    function hasCustomerSession() {
        return Boolean(
            window.CustomerAuth?.getToken?.() &&
            window.CustomerAuth?.getUser?.()?.rol === "cliente"
        );
    }

    function isPersonalizedItem(item) {
        const summary = item?.personalizacionResumen || {};
        const personalization = item?.personalizacion || {};
        return Boolean(
            (summary.tipo && summary.tipo !== "ninguna") ||
            personalization.tipo ||
            personalization.mainText ||
            personalization.textoPrincipal ||
            personalization.assets?.preview ||
            personalization.assets?.finalPreview
        );
    }

    function assetUrl(asset) {
        if (!asset) return "";
        if (typeof asset === "string") return asset;
        return asset.secure_url || asset.url || asset.src || "";
    }

    function orderItemImage(item) {
        const customization = item?.personalizacion || {};
        const summary = item?.personalizacionResumen || {};
        const simpleAssets = Array.isArray(customization?.assets?.images)
            ? customization.assets.images
            : [];

        return assetUrl(summary.vistaPrevia) ||
            assetUrl(summary.preview) ||
            assetUrl(customization?.assets?.preview) ||
            assetUrl(customization?.assets?.finalPreview) ||
            assetUrl(customization?.finalPreview?.asset) ||
            assetUrl(customization?.finalPreviewUrl) ||
            assetUrl(simpleAssets[0]) ||
            assetUrl(customization?.assets?.original) ||
            assetUrl(customization?.image?.asset) ||
            item?.imagen ||
            window.CONFIG?.placeholderImage ||
            "";
    }

    function createProductList(order) {
        const items = Array.isArray(order?.items) ? order.items : [];
        if (!items.length) {
            return '<p class="payment-result-empty-products">El detalle de productos quedará disponible en tu cuenta cuando el pedido termine de sincronizarse.</p>';
        }

        return `
            <div class="payment-result-products-list">
                ${items.slice(0, 4).map((item) => {
                    const personalized = isPersonalizedItem(item);
                    return `
                        <article class="payment-result-product">
                            <img src="${escapeHtml(orderItemImage(item))}" alt="${escapeHtml(item.nombre || "Producto del pedido")}">
                            <div>
                                <strong>${escapeHtml(item.nombre || "Producto")}</strong>
                                <span>${Number(item.cantidad) || 1} unidad(es) · ${personalized ? "Personalizado" : "Sin personalización"}</span>
                            </div>
                        </article>
                    `;
                }).join("")}
                ${items.length > 4 ? `<p class="payment-result-empty-products">Y ${items.length - 4} producto(s) más en el detalle del pedido.</p>` : ""}
            </div>
        `;
    }

    function currentStep(order) {
        if (!order) return "received";
        if (["rechazado", "cancelado", "vencido", "reembolsado"].includes(order.estadoPago) || order.estadoPedido === "cancelado") {
            return "problem";
        }
        if (order.estadoPago !== "pagado") return "payment";
        if (["validacion_diseno", "en_revision"].includes(order.estadoPedido)) return "design";
        if (["en_produccion", "confirmado"].includes(order.estadoPedido)) return "production";
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

    function createTimeline(order) {
        const paidCopy = order?.estadoPago === "pagado"
            ? "Tu pago fue confirmado correctamente."
            : "El pago queda en revisión o pendiente de confirmación.";
        return `
            <section class="payment-result-next" aria-label="Próximos pasos del pedido">
                <h2>Qué pasa ahora</h2>
                <ol class="post-steps">
                    <li class="post-step ${stepClass(order, "received")}">
                        <span class="post-step-icon"><i class="fa-solid fa-receipt" aria-hidden="true"></i></span>
                        <span><strong>Pedido recibido</strong><span>Guardamos el detalle de productos, entrega y personalización.</span></span>
                    </li>
                    <li class="post-step ${stepClass(order, "payment")}">
                        <span class="post-step-icon"><i class="fa-solid fa-credit-card" aria-hidden="true"></i></span>
                        <span><strong>Pago seguro</strong><span>${paidCopy}</span></span>
                    </li>
                    <li class="post-step ${stepClass(order, "design")}">
                        <span class="post-step-icon"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i></span>
                        <span><strong>Revisión del diseño</strong><span>Si es personalizado, Mommy Crafts revisará la vista final antes de fabricar.</span></span>
                    </li>
                    <li class="post-step ${stepClass(order, "production")}">
                        <span class="post-step-icon"><i class="fa-solid fa-shirt" aria-hidden="true"></i></span>
                        <span><strong>Fabricación</strong><span>Prepararemos el producto cuando el pago y el diseño correspondan.</span></span>
                    </li>
                    <li class="post-step ${stepClass(order, "delivery")}">
                        <span class="post-step-icon"><i class="fa-solid fa-truck-fast" aria-hidden="true"></i></span>
                        <span><strong>Retiro o envío</strong><span>Coordinaremos la entrega según la opción elegida.</span></span>
                    </li>
                </ol>
            </section>
        `;
    }

    function createSideSummary(order, type) {
        const paymentLabel = statusLabel(order?.estadoPago);
        const orderLabel = statusLabel(order?.estadoPedido);
        const method = order?.entrega?.metodo || order?.metodoEntrega || "";
        const paymentClass = statusType(order?.estadoPago);
        const orderClass = statusType(order?.estadoPedido);
        const whatsappMessage = encodeURIComponent(
            `Hola, necesito ayuda con el pedido ${orderPublicId(order)}.`
        );
        const whatsappUrl = `${window.CONFIG?.social?.whatsapp || "https://wa.me/56954633848"}?text=${whatsappMessage}`;

        return `
            <aside class="payment-result-side">
                <section class="payment-result-side-card">
                    <h2>Resumen del pedido</h2>
                    <dl class="post-summary-list">
                        <div class="post-summary-row"><dt>Número</dt><dd><strong>${escapeHtml(orderPublicId(order))}</strong></dd></div>
                        <div class="post-summary-row"><dt>Total</dt><dd><strong>${money(order?.total)}</strong></dd></div>
                        <div class="post-summary-row"><dt>Pago</dt><dd><span class="post-status-pill ${paymentClass}">${escapeHtml(paymentLabel)}</span></dd></div>
                        <div class="post-summary-row"><dt>Pedido</dt><dd><span class="post-status-pill ${orderClass}">${escapeHtml(orderLabel)}</span></dd></div>
                        ${method ? `<div class="post-summary-row"><dt>Entrega</dt><dd><strong>${method === "retiro" ? "Retiro" : "Envío"}</strong></dd></div>` : ""}
                        ${order?.createdAt ? `<div class="post-summary-row"><dt>Creado</dt><dd><strong>${dateTime(order.createdAt)}</strong></dd></div>` : ""}
                    </dl>
                </section>

                <section class="payment-result-products">
                    <h2>Productos</h2>
                    ${createProductList(order)}
                </section>

                <section class="payment-result-support">
                    <h2>¿Necesitas ayuda?</h2>
                    <p>Escríbenos indicando el número de pedido. Así podremos revisar más rápido el pago, diseño o entrega.</p>
                    <a class="btn-secondary" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener">
                        <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Contactar por WhatsApp
                    </a>
                </section>
            </aside>
        `;
    }

    function ensureShell() {
        if (!card || card.dataset.postPurchaseReady === "true") return;
        card.dataset.postPurchaseReady = "true";
        card.innerHTML = `
            <div class="payment-result-shell">
                <section>
                    <section class="payment-result-primary">
                        <div class="payment-result-topline">
                            <div class="payment-result-icon loading" id="payment-result-icon">
                                <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                            </div>
                            <div>
                                <p class="section-kicker">Mercado Pago</p>
                                <h1 id="payment-result-title">Comprobando tu pago</h1>
                                <p id="payment-result-message">Estamos consultando el estado real del pedido.</p>
                            </div>
                        </div>
                        <div class="payment-result-order" id="payment-result-order" hidden></div>
                        <div class="payment-result-actions">
                            <button class="btn-primary" id="payment-retry" type="button" hidden>Intentar pago nuevamente</button>
                            <a class="btn-secondary" id="payment-account-link" href="cuenta.html#pedidos" hidden>Ver mis pedidos</a>
                            <a class="btn-secondary" href="catalogo.html">Seguir comprando</a>
                        </div>
                    </section>
                    <div id="payment-result-next-area"></div>
                </section>
                <div id="payment-result-side-area"></div>
            </div>
        `;
    }

    function getElements() {
        ensureShell();
        return {
            title: document.getElementById("payment-result-title"),
            message: document.getElementById("payment-result-message"),
            icon: document.getElementById("payment-result-icon"),
            orderBox: document.getElementById("payment-result-order"),
            retry: document.getElementById("payment-retry"),
            accountLink: document.getElementById("payment-account-link"),
            nextArea: document.getElementById("payment-result-next-area"),
            sideArea: document.getElementById("payment-result-side-area")
        };
    }

    function iconHtml(type) {
        if (type === "success") return '<i class="fa-solid fa-circle-check" aria-hidden="true"></i>';
        if (type === "failure") return '<i class="fa-solid fa-circle-xmark" aria-hidden="true"></i>';
        if (type === "loading") return '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>';
        return '<i class="fa-solid fa-clock" aria-hidden="true"></i>';
    }

    function setView(type, heading, detail, order) {
        const els = getElements();
        els.icon.className = `payment-result-icon ${type}`;
        els.icon.innerHTML = iconHtml(type);
        els.title.textContent = heading;
        els.message.textContent = detail;

        if (order) {
            els.orderBox.hidden = false;
            els.orderBox.innerHTML = `
                <article class="payment-result-stat">
                    <span>Número de pedido</span>
                    <strong>${escapeHtml(orderPublicId(order))}</strong>
                </article>
                <article class="payment-result-stat">
                    <span>Total pagado</span>
                    <strong>${money(order.total)}</strong>
                </article>
                <article class="payment-result-stat">
                    <span>Estado de pago</span>
                    <strong>${escapeHtml(statusLabel(order.estadoPago))}</strong>
                </article>
            `;
            els.nextArea.innerHTML = createTimeline(order);
            els.sideArea.innerHTML = createSideSummary(order, type);
        } else {
            els.orderBox.hidden = true;
            els.orderBox.innerHTML = "";
            els.nextArea.innerHTML = `
                <section class="payment-result-next">
                    <h2>Qué puedes hacer</h2>
                    <div class="post-payment-note">
                        <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
                        <span>Revisa tus pedidos desde tu cuenta o contáctanos si necesitas ayuda para identificar la compra.</span>
                    </div>
                </section>`;
            els.sideArea.innerHTML = createSideSummary(null, type);
        }

        els.retry.hidden = !(
            order &&
            order.metodoPago === "mercadopago" &&
            order.estadoPago !== "pagado" &&
            order.estadoPedido !== "cancelado"
        );

        els.accountLink.hidden = !hasCustomerSession();
        if (!els.accountLink.hidden && order) {
            els.accountLink.href = orderDetailHref(order);
            els.accountLink.textContent = "Ver detalle del pedido";
        }

        if (order?.estadoPago === "pagado") {
            els.nextArea.insertAdjacentHTML("beforeend", `
                <div class="post-payment-note">
                    <i class="fa-solid fa-heart" aria-hidden="true"></i>
                    <span>Guarda el número de pedido. Si tu compra incluye personalización, la vista final queda asociada al pedido para revisión antes de fabricar.</span>
                </div>
            `);
        }
    }

    function renderOrder(order) {
        if (order.estadoPago === "pagado") {
            sessionStorage.removeItem("mommycrafts_pending_payment");
            setView(
                "success",
                "Pago confirmado",
                "Recibimos tu pago. El pedido quedó registrado y ya puede avanzar a revisión y preparación.",
                order
            );
            return;
        }

        if (order.estadoPago === "rechazado") {
            setView(
                "failure",
                "El pago no fue aprobado",
                "Tu pedido quedó guardado y puedes volver a intentar el pago cuando quieras.",
                order
            );
            return;
        }

        if (order.estadoPago === "reembolsado") {
            setView(
                "failure",
                "Pago reembolsado",
                "El pago figura como reembolsado. Revisa el detalle del pedido o comunícate con Mommy Crafts.",
                order
            );
            return;
        }

        setView(
            "pending",
            "Pago pendiente",
            "Mercado Pago todavía está procesando el pago. Mantendremos este pedido guardado mientras se confirma el estado.",
            order
        );
    }

    async function synchronizeReturn() {
        if (!paymentId) return;

        await API.request(endpoint("retorno"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                paymentId,
                token
            })
        });
    }

    async function getStatus() {
        const data = await API.request(endpoint("estado"));
        renderOrder(data.pedido);
        return data.pedido;
    }

    async function init() {
        ensureShell();
        if (!orderId) {
            setView(
                "failure",
                "No encontramos el pedido",
                "Falta el identificador necesario para consultar el pago. Revisa tu cuenta o contáctanos con el correo usado en la compra."
            );
            return;
        }

        try {
            await synchronizeReturn();
            const order = await getStatus();

            if (order.estadoPago === "pendiente") {
                let attempts = 0;
                const interval = setInterval(async () => {
                    attempts += 1;
                    try {
                        const updated = await getStatus();
                        if (updated.estadoPago !== "pendiente" || attempts >= 8) {
                            clearInterval(interval);
                        }
                    } catch {
                        clearInterval(interval);
                    }
                }, 5000);
            }
        } catch (error) {
            setView(
                "failure",
                "No pudimos comprobar el pago",
                error.message || "Intenta nuevamente desde tu cuenta o comunícate con Mommy Crafts."
            );
        }
    }

    function bindRetry() {
        document.addEventListener("click", async (event) => {
            const button = event.target.closest("#payment-retry");
            if (!button) return;

            button.disabled = true;
            button.textContent = "Preparando pago...";

            try {
                const result = await API.request(endpoint("preferencia"), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ token })
                });
                location.href = result.checkoutUrl;
            } catch (error) {
                alert(error.message || "No fue posible iniciar el pago.");
                button.disabled = false;
                button.textContent = "Intentar pago nuevamente";
            }
        });
    }

    bindRetry();
    document.addEventListener("DOMContentLoaded", init);
})();
