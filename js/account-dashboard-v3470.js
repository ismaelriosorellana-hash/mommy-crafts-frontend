"use strict";

(function () {
    const overview = document.getElementById("customer-account-overview");
    const nextStep = document.getElementById("customer-next-step");

    if (!overview || !nextStep) return;

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function dateShort(value) {
        if (!value) return "—";
        try {
            return new Intl.DateTimeFormat("es-CL", {
                dateStyle: "medium"
            }).format(new Date(value));
        } catch {
            return "—";
        }
    }

    function hasCustomerSession() {
        return Boolean(
            window.CustomerAuth?.getToken?.() &&
            window.CustomerAuth?.getUser?.()?.rol === "cliente"
        );
    }

    function isPaymentPending(order) {
        return [
            "pendiente",
            "pendiente_comprobante",
            "rechazado",
            "vencido"
        ].includes(order?.estadoPago);
    }

    function isDesignStage(order) {
        return [
            "validacion_diseno",
            "en_revision",
            "diseno_enviado",
            "enviado_diseno",
            "cambios_solicitados",
            "corregido"
        ].includes(order?.estadoPedido);
    }

    function isActiveOrder(order) {
        if (!order) return false;
        if (["entregado", "cancelado"].includes(order.estadoPedido)) return false;
        if (["reembolsado"].includes(order.estadoPago)) return false;
        return true;
    }

    function orderDate(order) {
        return new Date(order?.fecha || order?.createdAt || 0).getTime() || 0;
    }

    function sortedOrders(orders) {
        return [...orders].sort((a, b) => orderDate(b) - orderDate(a));
    }

    function renderOverview(orders) {
        const active = orders.filter(isActiveOrder).length;
        const pendingPayments = orders.filter(isPaymentPending).length;
        const design = orders.filter(isDesignStage).length;
        const last = sortedOrders(orders)[0];

        overview.innerHTML = `
            <article class="account-overview-card-v3470">
                <span>Pedidos activos</span>
                <strong>${active}</strong>
                <small>${active === 1 ? "Hay un pedido en curso." : active > 1 ? "Tienes pedidos en preparación." : "No hay pedidos pendientes."}</small>
            </article>
            <article class="account-overview-card-v3470">
                <span>Pagos pendientes</span>
                <strong>${pendingPayments}</strong>
                <small>${pendingPayments ? "Revisa si debes completar o reintentar un pago." : "No tienes pagos pendientes."}</small>
            </article>
            <article class="account-overview-card-v3470">
                <span>Último movimiento</span>
                <strong>${last ? escapeHtml(last.numeroPedido || "Pedido") : "—"}</strong>
                <small>${last ? `Último pedido registrado: ${dateShort(last.fecha || last.createdAt)}.` : "Cuando compres, aparecerá aquí."}</small>
            </article>
        `;
    }

    function nextStepData(orders) {
        const ordered = sortedOrders(orders);
        const pendingPayment = ordered.find(isPaymentPending);
        if (pendingPayment) {
            return {
                icon: "fa-credit-card",
                title: `Tienes un pago por revisar: ${pendingPayment.numeroPedido || "pedido"}`,
                text: "Completa el pago, reintenta Mercado Pago o revisa el detalle si hubo un rechazo.",
                href: `pedido.html?id=${encodeURIComponent(pendingPayment.id || pendingPayment._id || "")}`,
                cta: "Ver pedido"
            };
        }

        const design = ordered.find(isDesignStage);
        if (design) {
            return {
                icon: "fa-wand-magic-sparkles",
                title: `Diseño en revisión: ${design.numeroPedido || "pedido"}`,
                text: "Mantente atento al diseño final o a una solicitud de cambios antes de fabricar.",
                href: `pedido.html?id=${encodeURIComponent(design.id || design._id || "")}`,
                cta: "Revisar diseño"
            };
        }

        const active = ordered.find(isActiveOrder);
        if (active) {
            return {
                icon: "fa-truck-fast",
                title: `Pedido en curso: ${active.numeroPedido || "pedido"}`,
                text: "Puedes revisar el avance, productos incluidos y datos de entrega.",
                href: `pedido.html?id=${encodeURIComponent(active.id || active._id || "")}`,
                cta: "Ver avance"
            };
        }

        if (ordered.length) {
            return {
                icon: "fa-bag-shopping",
                title: "Tu historial está al día",
                text: "No tienes acciones pendientes. Puedes repetir una compra o explorar nuevos productos.",
                href: "catalogo.html",
                cta: "Explorar productos"
            };
        }

        return {
            icon: "fa-heart",
            title: "Comienza tu primera compra personalizada",
            text: "Explora productos, personaliza tu diseño y guarda todo en tu cuenta.",
            href: "catalogo.html",
            cta: "Ver catálogo"
        };
    }

    function renderNextStep(orders) {
        const data = nextStepData(orders);
        nextStep.hidden = false;
        nextStep.innerHTML = `
            <i class="fa-solid ${escapeHtml(data.icon)}" aria-hidden="true"></i>
            <div>
                <strong>${escapeHtml(data.title)}</strong>
                <p>${escapeHtml(data.text)}</p>
            </div>
            <a class="btn-secondary" href="${escapeHtml(data.href)}">${escapeHtml(data.cta)}</a>
        `;
    }

    function enhanceOrderCards() {
        const list = document.getElementById("customer-orders-list");
        if (!list) return;
        list.querySelectorAll(".account-order-card").forEach((card, index) => {
            if (index === 0) {
                card.classList.add("is-account-highlight-v3470");
            }
            if (card.querySelector(".account-order-action-row-v3470")) return;
            const detailLink = card.querySelector('a[href^="pedido.html"]');
            if (!detailLink) return;
            const orderNumber = card.querySelector("h3")?.textContent?.trim() || "";
            const row = document.createElement("div");
            row.className = "account-order-action-row-v3470";
            row.innerHTML = `
                <a class="btn-secondary" href="${detailLink.getAttribute("href")}">Detalle</a>
                <a class="btn-secondary" href="seguimiento-pedido.html?pedido=${encodeURIComponent(orderNumber)}">Seguimiento</a>
            `;
            card.querySelector(".account-order-total")?.appendChild(row);
        });
    }

    async function init() {
        if (!hasCustomerSession()) return;

        try {
            const data = await CustomerAuth.getOrders();
            const orders = Array.isArray(data?.pedidos) ? data.pedidos : [];
            renderOverview(orders);
            renderNextStep(orders);
            window.setTimeout(enhanceOrderCards, 250);
            window.setTimeout(enhanceOrderCards, 1200);
        } catch {
            overview.innerHTML = `
                <article class="account-overview-card-v3470">
                    <span>Cuenta</span>
                    <strong>—</strong>
                    <small>No fue posible cargar el resumen. Tus pedidos siguen disponibles en el listado.</small>
                </article>
            `;
        }
    }

    document.addEventListener("DOMContentLoaded", init);
}());
