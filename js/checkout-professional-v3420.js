"use strict";

(function () {
    const FREE_SHIPPING_THRESHOLD = Number(window.CONFIG?.FREE_SHIPPING_THRESHOLD || 25000);
    const SANTIAGO_SHIPPING_COST = 4000;

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    const cartItems = () => window.Cart?.read?.() || [];
    const subtotal = () => window.Cart?.total?.() || cartItems().reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
    const formatPrice = (value) => window.Cart?.formatPrice?.(value) || `$${Number(value || 0).toLocaleString("es-CL")}`;

    function isCheckoutPage() {
        return document.body?.dataset?.page === "checkout" && Boolean($("#form-pedido"));
    }

    function checkedDelivery() {
        return $('input[name="metodo-entrega"]:checked')?.value || "envio";
    }

    function checkedZone() {
        return $("#pedido-zona-envio")?.value || "santiago";
    }

    function shippingCost() {
        return checkedDelivery() === "envio" && checkedZone() === "santiago" && subtotal() < FREE_SHIPPING_THRESHOLD
            ? SANTIAGO_SHIPPING_COST
            : 0;
    }

    function total() {
        return subtotal() + shippingCost();
    }

    function injectProgress() {
        const heading = $(".checkout-heading");
        if (!heading || $(".checkout-progress-pro")) return;
        const progress = document.createElement("section");
        progress.className = "checkout-progress-pro";
        progress.setAttribute("aria-label", "Progreso de compra");
        progress.innerHTML = `
            <article class="checkout-progress-step is-done">
                <span class="checkout-progress-badge"><i class="fa-solid fa-check" aria-hidden="true"></i></span>
                <span><strong>Carrito listo</strong><small>Productos seleccionados</small></span>
            </article>
            <article class="checkout-progress-step is-active">
                <span class="checkout-progress-badge">2</span>
                <span><strong>Datos y entrega</strong><small>Completa lo necesario</small></span>
            </article>
            <article class="checkout-progress-step">
                <span class="checkout-progress-badge">3</span>
                <span><strong>Pago seguro</strong><small>Mercado Pago</small></span>
            </article>`;
        heading.insertAdjacentElement("afterend", progress);
    }

    function injectHelperCards() {
        const accountNote = $("#checkout-account-note");
        if (!accountNote || $(".checkout-helper-grid")) return;
        const helper = document.createElement("section");
        helper.className = "checkout-helper-grid";
        helper.setAttribute("aria-label", "Información importante antes de pagar");
        helper.innerHTML = `
            <article class="checkout-helper-card">
                <i class="fa-solid fa-palette" aria-hidden="true"></i>
                <div><strong>Diseño revisado antes de fabricar</strong><span>Si el producto es personalizado, se conserva la vista final para revisión del pedido.</span></div>
            </article>
            <article class="checkout-helper-card">
                <i class="fa-solid fa-truck-fast" aria-hidden="true"></i>
                <div><strong>Entrega coordinada</strong><span>El resumen considera envío, retiro y datos de la persona que recibe.</span></div>
            </article>`;
        accountNote.insertAdjacentElement("afterend", helper);
    }

    function injectSummaryTools() {
        const sticky = $(".checkout-summary-sticky");
        if (!sticky) return;
        if (!$('.checkout-shipping-meter')) {
            const meter = document.createElement("section");
            meter.className = "checkout-shipping-meter";
            meter.setAttribute("aria-live", "polite");
            meter.innerHTML = `
                <strong><span>Envío gratis</span><span class="checkout-meter-amount"></span></strong>
                <small class="checkout-meter-copy"></small>
                <div class="checkout-meter-track" aria-hidden="true"><span class="checkout-meter-fill"></span></div>`;
            const note = $("#checkout-free-shipping-note");
            if (note) note.insertAdjacentElement("afterend", meter);
            else sticky.appendChild(meter);
        }
        if (!$('.checkout-completion-card')) {
            const card = document.createElement("section");
            card.className = "checkout-completion-card";
            card.setAttribute("aria-live", "polite");
            card.innerHTML = `
                <h3>Antes de pagar</h3>
                <ul class="checkout-completion-list">
                    <li data-checkout-check="contacto"><i class="fa-regular fa-circle" aria-hidden="true"></i><span>Datos de contacto</span></li>
                    <li data-checkout-check="entrega"><i class="fa-regular fa-circle" aria-hidden="true"></i><span>Entrega o retiro</span></li>
                    <li data-checkout-check="terminos"><i class="fa-regular fa-circle" aria-hidden="true"></i><span>Términos aceptados</span></li>
                    <li data-checkout-check="pago"><i class="fa-regular fa-circle" aria-hidden="true"></i><span>Pago seguro disponible</span></li>
                </ul>`;
            const totals = $(".checkout-totals");
            if (totals) totals.insertAdjacentElement("afterend", card);
            else sticky.appendChild(card);
        }
        if (!$('.checkout-trust-card')) {
            const trust = document.createElement("section");
            trust.className = "checkout-trust-card";
            trust.innerHTML = `
                <h3>Compra con respaldo</h3>
                <ul class="checkout-trust-list">
                    <li><i class="fa-solid fa-shield-halved" aria-hidden="true"></i><span>Pago procesado en entorno seguro.</span></li>
                    <li><i class="fa-solid fa-receipt" aria-hidden="true"></i><span>Pedido asociado a tu cuenta.</span></li>
                    <li><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><span>Vista personalizada guardada en el resumen.</span></li>
                </ul>`;
            const security = $(".checkout-security");
            if (security) security.insertAdjacentElement("afterend", trust);
            else sticky.appendChild(trust);
        }
    }

    function injectMobilePaybar() {
        if ($(".checkout-mobile-paybar")) return;
        const bar = document.createElement("aside");
        bar.className = "checkout-mobile-paybar";
        bar.setAttribute("aria-label", "Pagar pedido");
        bar.innerHTML = `
            <div><small>Total a pagar</small><strong id="checkout-mobile-total">$0</strong></div>
            <button type="button" id="checkout-mobile-pay-button"><i class="fa-solid fa-lock" aria-hidden="true"></i> Pagar</button>`;
        document.body.appendChild(bar);
        $("#checkout-mobile-pay-button")?.addEventListener("click", () => {
            const form = $("#form-pedido");
            if (!form) return;
            if (typeof form.requestSubmit === "function") form.requestSubmit();
            else $("#btn-enviar-pedido")?.click();
        });
    }

    function getRequiredControls() {
        return $$("#form-pedido input, #form-pedido select, #form-pedido textarea")
            .filter((control) => control.required && !control.disabled && control.type !== "hidden");
    }

    function markInvalidStates() {
        getRequiredControls().forEach((control) => {
            const invalid = !control.checkValidity();
            control.classList.toggle("is-invalid", invalid);
        });
    }

    function sectionComplete(section) {
        const controls = $$("input, select, textarea", section).filter((control) => control.required && !control.disabled && control.type !== "hidden");
        if (!controls.length) return true;
        return controls.every((control) => control.checkValidity());
    }

    function updateSections() {
        $$(".checkout-form-section").forEach((section) => {
            const complete = sectionComplete(section);
            section.classList.toggle("is-complete", complete);
            section.classList.toggle("has-missing", !complete);
        });
    }

    function updateCompletionList() {
        const checks = {
            contacto: ["#pedido-nombre", "#pedido-rut", "#pedido-email", "#pedido-telefono"].every((id) => $(id)?.checkValidity()),
            entrega: checkedDelivery() === "retiro"
                ? Boolean($("#pedido-fecha-preferida")?.checkValidity())
                : ["#pedido-zona-envio", "#pedido-direccion", "#pedido-comuna"].every((id) => $(id)?.disabled || $(id)?.checkValidity()),
            terminos: $("#pedido-terminos")?.checked === true,
            pago: $("#pedido-pago-mercadopago")?.disabled === false
        };
        Object.entries(checks).forEach(([key, complete]) => {
            const row = $(`[data-checkout-check="${key}"]`);
            if (!row) return;
            row.classList.toggle("is-pending", !complete);
            const icon = $("i", row);
            if (icon) icon.className = complete ? "fa-solid fa-circle-check" : "fa-regular fa-circle";
        });
    }

    function updateShippingMeter() {
        const meter = $(".checkout-shipping-meter");
        if (!meter) return;
        const amount = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal());
        const progress = FREE_SHIPPING_THRESHOLD > 0 ? Math.min(100, (subtotal() / FREE_SHIPPING_THRESHOLD) * 100) : 100;
        meter.style.setProperty("--mc-meter-value", `${progress}%`);
        const amountEl = $(".checkout-meter-amount", meter);
        const copyEl = $(".checkout-meter-copy", meter);
        if (amount <= 0) {
            if (amountEl) amountEl.textContent = "Desbloqueado";
            if (copyEl) copyEl.textContent = "Tu compra cumple el mínimo para envío gratis dentro de Santiago.";
            meter.classList.add("is-complete");
        } else {
            if (amountEl) amountEl.textContent = `Faltan ${formatPrice(amount)}`;
            if (copyEl) copyEl.textContent = `Agrega ${formatPrice(amount)} en productos para liberar envío gratis dentro de Santiago.`;
            meter.classList.remove("is-complete");
        }
    }

    function updateMobilePaybar() {
        const totalEl = $("#checkout-mobile-total");
        const btn = $("#checkout-mobile-pay-button");
        if (totalEl) totalEl.textContent = formatPrice(total());
        if (btn) btn.disabled = $("#btn-enviar-pedido")?.disabled === true;
    }

    function formatRut(value) {
        const clean = String(value || "").replace(/[^0-9kK]/g, "").toUpperCase();
        if (clean.length <= 1) return clean;
        const body = clean.slice(0, -1);
        const dv = clean.slice(-1);
        const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return `${withDots}-${dv}`;
    }

    function formatPhone(value) {
        const digits = String(value || "").replace(/\D/g, "");
        const local = digits.startsWith("56") ? digits.slice(2) : digits;
        const trimmed = local.slice(0, 9);
        if (!trimmed) return "";
        if (trimmed.length <= 1) return `+56 ${trimmed}`;
        if (trimmed.length <= 5) return `+56 ${trimmed.slice(0, 1)} ${trimmed.slice(1)}`;
        return `+56 ${trimmed.slice(0, 1)} ${trimmed.slice(1, 5)} ${trimmed.slice(5, 9)}`.trim();
    }

    function bindInputPolish() {
        const rut = $("#pedido-rut");
        rut?.addEventListener("blur", () => { rut.value = formatRut(rut.value); refresh(); });
        const phoneIds = ["#pedido-telefono", "#tercero-telefono"];
        phoneIds.forEach((id) => {
            const input = $(id);
            input?.addEventListener("blur", () => { input.value = formatPhone(input.value); refresh(); });
        });
    }

    function bindValidation() {
        const form = $("#form-pedido");
        if (!form || form.dataset.checkoutProBound === "true") return;
        form.dataset.checkoutProBound = "true";
        form.addEventListener("input", refresh);
        form.addEventListener("change", () => window.setTimeout(refresh, 0));
        form.addEventListener("invalid", (event) => {
            event.target?.classList?.add("is-invalid");
            const section = event.target?.closest?.(".checkout-form-section");
            section?.classList?.add("has-missing");
        }, true);
        form.addEventListener("submit", () => {
            markInvalidStates();
            window.setTimeout(refresh, 50);
        }, true);
    }

    function refresh() {
        if (!isCheckoutPage()) return;
        markInvalidStates();
        updateSections();
        updateCompletionList();
        updateShippingMeter();
        updateMobilePaybar();
    }

    function init() {
        if (!isCheckoutPage()) return;
        injectProgress();
        injectHelperCards();
        injectSummaryTools();
        injectMobilePaybar();
        bindInputPolish();
        bindValidation();
        window.setTimeout(refresh, 0);
        window.setTimeout(refresh, 400);
        window.addEventListener("cart:updated", refresh);
    }

    document.addEventListener("DOMContentLoaded", init, { once: true });
})();
