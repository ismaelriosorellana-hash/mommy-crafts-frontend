"use strict";

(function () {
    const SANTIAGO_SHIPPING_COST = 4000;
    const FREE_SHIPPING_THRESHOLD = Number(CONFIG.FREE_SHIPPING_THRESHOLD || 25000);
    let mercadoPagoAvailable = false;

    const read = () => window.Cart?.read?.() || [];
    const subtotal = () => window.Cart?.total?.() || 0;
    const formatPrice = (value) => window.Cart?.formatPrice?.(value) || `$${Number(value || 0).toLocaleString("es-CL")}`;
    const normalizeDelivery = (value) => window.Cart?.normalizeDelivery?.(value) || value || {};

    function selectedDeliveryMethod(form = document.getElementById("form-pedido")) {
        return form?.querySelector('input[name="metodo-entrega"]:checked')?.value || "envio";
    }

    function selectedShippingZone(form = document.getElementById("form-pedido")) {
        return form?.querySelector("#pedido-zona-envio")?.value || "santiago";
    }

    function qualifiesForFreeShipping() {
        return subtotal() >= FREE_SHIPPING_THRESHOLD;
    }

    function shippingCost(form = document.getElementById("form-pedido")) {
        return selectedDeliveryMethod(form) === "envio" &&
            selectedShippingZone(form) === "santiago" &&
            !qualifiesForFreeShipping()
            ? SANTIAGO_SHIPPING_COST
            : 0;
    }

    function checkoutTotal(form = document.getElementById("form-pedido")) {
        return subtotal() + shippingCost(form);
    }

    function deliveryAvailability(items = read()) {
        return {
            shipping: items.length > 0 && items.every((item) => normalizeDelivery(item.delivery).shipping?.enabled !== false),
            pickup: items.length > 0 && items.every((item) => normalizeDelivery(item.delivery).pickup?.enabled !== false)
        };
    }

    function deliveryInstructionDetails(items, method) {
        const key = method === "retiro" ? "pickup" : "shipping";
        return items.map((item) => ({
            title: `Instrucciones de ${method === "retiro" ? "retiro" : "envío"}: ${item.name}`,
            instruction: normalizeDelivery(item.delivery)[key]?.instructions || "Sin instrucciones adicionales."
        }));
    }

    function addBusinessDays(start, days) {
        const date = new Date(start);
        date.setHours(12, 0, 0, 0);
        let remaining = Math.max(0, Number(days) || 0);
        while (remaining > 0) {
            date.setDate(date.getDate() + 1);
            if (date.getDay() !== 0 && date.getDay() !== 6) remaining -= 1;
        }
        return date;
    }

    function dateInputValue(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    function updatePreferredDate() {
        const input = document.getElementById("pedido-fecha-preferida");
        const help = document.getElementById("pedido-fecha-ayuda");
        if (!input) return;
        if (selectedDeliveryMethod() !== "retiro") {
            input.value = "";
            input.disabled = true;
            input.required = false;
            return;
        }
        input.disabled = false;
        input.required = true;
        const days = Math.max(...read().map((item) => Number(item.delivery?.diasPreparacion || item.delivery?.preparationDays || 3)), 3);
        const minimum = addBusinessDays(new Date(), days);
        const value = dateInputValue(minimum);
        input.min = value;
        if (!input.value || input.value < value) input.value = value;
        if (help) help.textContent = `Primera fecha disponible: ${minimum.toLocaleDateString("es-CL")} (${days} días hábiles mínimos).`;
    }

    function updateThirdPartyFields() {
        const enabled = document.getElementById("pedido-tercero")?.checked === true;
        const container = document.getElementById("third-party-fields");
        if (container) container.hidden = !enabled;
        ["tercero-nombre", "tercero-telefono", "tercero-relacion"].forEach((id) => {
            const input = document.getElementById(id);
            if (input) input.required = enabled;
        });
    }

    function updateDeliveryForm() {
        const form = document.getElementById("form-pedido");
        if (!form) return;
        const items = read();
        const availability = deliveryAvailability(items);
        const shippingInput = form.querySelector('input[name="metodo-entrega"][value="envio"]');
        const pickupInput = form.querySelector('input[name="metodo-entrega"][value="retiro"]');
        const shippingOption = document.getElementById("delivery-shipping-option");
        const pickupOption = document.getElementById("delivery-pickup-option");
        shippingInput.disabled = !availability.shipping;
        pickupInput.disabled = !availability.pickup;
        shippingOption?.classList.toggle("is-disabled", !availability.shipping);
        pickupOption?.classList.toggle("is-disabled", !availability.pickup);
        if (shippingInput.checked && !availability.shipping) pickupInput.checked = availability.pickup;
        if (pickupInput.checked && !availability.pickup) shippingInput.checked = availability.shipping;

        const isShipping = selectedDeliveryMethod(form) === "envio";
        const addressFields = document.getElementById("shipping-address-fields");
        const address = document.getElementById("pedido-direccion");
        const commune = document.getElementById("pedido-comuna");
        const pickupDateField = document.getElementById("pickup-date-field");
        const preferredDate = document.getElementById("pedido-fecha-preferida");
        const shippingZone = document.getElementById("pedido-zona-envio");
        const shippingZoneHelp = document.getElementById("pedido-zona-envio-ayuda");
        if (addressFields) addressFields.hidden = !isShipping;
        if (address) address.required = isShipping;
        if (commune) commune.required = isShipping;
        if (shippingZone) { shippingZone.required = isShipping; shippingZone.disabled = !isShipping; }
        if (pickupDateField) pickupDateField.hidden = isShipping;
        if (preferredDate) { preferredDate.disabled = isShipping; preferredDate.required = !isShipping; if (isShipping) preferredDate.value = ""; }

        if (shippingZoneHelp && isShipping) {
            if (selectedShippingZone(form) === "santiago") {
                shippingZoneHelp.textContent = qualifiesForFreeShipping()
                    ? `Envío gratis desbloqueado por superar ${formatPrice(FREE_SHIPPING_THRESHOLD)}. Entrega entre 5 y 7 días hábiles.`
                    : `Costo de ${formatPrice(SANTIAGO_SHIPPING_COST)}. Será gratis al completar ${formatPrice(FREE_SHIPPING_THRESHOLD)} en productos.`;
            } else {
                shippingZoneHelp.textContent = "Envío por Chilexpress desde 5 días hábiles. El costo es por pagar y se coordina contigo.";
            }
        }
        if (!isShipping) updatePreferredDate();

        const instructions = document.getElementById("delivery-instructions");
        if (instructions) {
            instructions.replaceChildren();
            deliveryInstructionDetails(items, isShipping ? "envio" : "retiro").forEach((detail) => {
                const block = document.createElement("div");
                block.className = "delivery-instruction-product";
                block.innerHTML = `<strong>${escapeHtml(detail.title)}</strong><p>${escapeHtml(detail.instruction)}</p>`;
                instructions.appendChild(block);
            });
        }
        renderCheckoutSummary();
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/"/g, "&quot;");
    }

    function escapeHtml(value) {
        const span = document.createElement("span");
        span.textContent = String(value || "");
        return span.innerHTML;
    }

    function prefillCheckoutWithAccount() {
        const user = window.CustomerAuth?.getUser?.();
        const note = document.getElementById("checkout-account-note");
        const fields = {
            "pedido-nombre": user?.nombre,
            "pedido-rut": user?.rut,
            "pedido-email": user?.email,
            "pedido-telefono": user?.telefono,
            "pedido-direccion": user?.direccion,
            "pedido-comuna": user?.comuna
        };
        if (user?.rol === "cliente" && CustomerAuth.getToken()) {
            Object.entries(fields).forEach(([id, value]) => {
                const input = document.getElementById(id);
                if (input && value && !input.value) input.value = value;
            });
            const email = document.getElementById("pedido-email");
            if (email) email.readOnly = true;
            if (note) note.innerHTML = '<i class="fa-solid fa-circle-check" aria-hidden="true"></i><span>Este pedido quedará guardado en <a href="cuenta.html#pedidos">Mi cuenta</a>.</span>';
        } else {
            const email = document.getElementById("pedido-email");
            if (email) email.readOnly = false;
            if (note) note.innerHTML = '<i class="fa-regular fa-circle-user" aria-hidden="true"></i><span><a href="acceso.html?modo=login&next=finalizar-compra.html">Inicia sesión</a> antes de confirmar para consultar este pedido desde tu cuenta.</span>';
        }
    }

    function renderCheckoutItems() {
        const container = document.getElementById("checkout-items");
        if (!container) return;
        container.replaceChildren();
        read().forEach((item) => {
            const row = document.createElement("article");
            row.className = "checkout-summary-item";
            const image = window.Cart.getDisplayImage(item);
            row.innerHTML = `
                <div class="checkout-summary-image-wrap">
                    <img src="${escapeAttribute(image)}" alt="${escapeAttribute(item.name)}">
                    <span>${item.quantity}</span>
                </div>
                <div class="checkout-summary-item-info">
                    <strong>${escapeHtml(item.name)}</strong>
                    <small>${escapeHtml(window.Cart.customizationDescription(item.customization) || "Producto sin personalización")}</small>
                    <span>${formatPrice(item.price)} c/u</span>
                </div>
                <b>${formatPrice(item.price * item.quantity)}</b>
            `;
            row.querySelector("img")?.addEventListener("error", (event) => { event.currentTarget.src = CONFIG.placeholderImage; }, { once: true });
            container.appendChild(row);
        });
    }

    function renderCheckoutSummary() {
        const form = document.getElementById("form-pedido");
        const subtotalValue = subtotal();
        const cost = shippingCost(form);
        const method = selectedDeliveryMethod(form);
        const zone = selectedShippingZone(form);
        document.getElementById("checkout-subtotal").textContent = formatPrice(subtotalValue);
        document.getElementById("checkout-total").textContent = formatPrice(checkoutTotal(form));
        const shipping = document.getElementById("checkout-shipping");
        if (shipping) {
            shipping.textContent = method === "retiro"
                ? "Sin costo"
                : zone === "otras_zonas"
                    ? "Chilexpress por pagar"
                    : cost === 0
                        ? "Gratis"
                        : formatPrice(cost);
        }
        const freeNote = document.getElementById("checkout-free-shipping-note");
        if (freeNote) {
            const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalValue);
            freeNote.textContent = remaining === 0
                ? "Envío gratis desbloqueado para la Provincia de Santiago."
                : `Te faltan ${formatPrice(remaining)} para el envío gratis en Santiago.`;
            freeNote.classList.toggle("is-complete", remaining === 0);
        }
        renderCheckoutItems();
    }

    function dataUrlToBlob(dataUrl) {
        const [header, encoded] = String(dataUrl || "").split(",");
        const mime = header?.match(/data:([^;]+)/)?.[1] || "image/png";
        const binary = atob(encoded || "");
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
        return new Blob([bytes], { type: mime });
    }

    async function uploadSimpleCustomizations(items) {
        let changed = false;
        for (const item of items) {
            const customization = item.customization;
            const dataList = Array.isArray(customization?.imageDataList)
                ? customization.imageDataList.filter(Boolean)
                : customization?.imageData ? [customization.imageData] : [];
            if (customization?.type !== "light" || !dataList.length || customization.assets?.images?.length) continue;
            const formData = new FormData();
            formData.append("customizationId", `simple-${item.lineId}`);
            dataList.forEach((dataUrl, index) => {
                const blob = dataUrlToBlob(dataUrl);
                const name = customization.imageNames?.[index] || `referencia-${index + 1}.${blob.type.split("/")[1] || "png"}`;
                formData.append("imagenes", blob, name);
            });
            const uploaded = await API.request("/uploads/personalizacion-simple", { method: "POST", body: formData, timeoutMs: 70000 });
            customization.assets = { ...(customization.assets || {}), images: uploaded.assets || [] };
            delete customization.imageData;
            delete customization.imageDataList;
            changed = true;
        }
        if (changed) window.Cart.write(items);
        return items;
    }

    function selectedPaymentMethod(form = document.getElementById("form-pedido")) {
        return form?.querySelector('input[name="pedido-pago"]:checked')?.value || "transferencia";
    }

    function updatePaymentMethodUI() {
        const method = selectedPaymentMethod();
        const note = document.getElementById("payment-method-note");
        const submitButton = document.getElementById("btn-enviar-pedido");
        document.querySelectorAll(".payment-options label").forEach((label) => {
            const input = label.querySelector('input[name="pedido-pago"]');
            label.classList.toggle("is-selected", Boolean(input?.checked));
        });
        if (note) {
            note.classList.remove("error");
            if (method === "mercadopago") {
                note.textContent = mercadoPagoAvailable
                    ? "Serás redirigido al entorno seguro de Mercado Pago. El pedido se confirmará automáticamente cuando se apruebe el pago."
                    : "Mercado Pago todavía no está disponible. Selecciona transferencia bancaria.";
                note.classList.toggle("error", !mercadoPagoAvailable);
            } else {
                note.textContent = "El stock se reserva durante 3 horas mientras envías el comprobante. Mommy Crafts validará la transferencia.";
            }
        }
        if (submitButton) submitButton.innerHTML = method === "mercadopago"
            ? '<i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Ir a Mercado Pago'
            : '<i class="fa-solid fa-lock" aria-hidden="true"></i> Confirmar pedido';
    }

    async function loadMercadoPagoAvailability() {
        const option = document.getElementById("payment-option-mercadopago");
        const input = document.getElementById("pedido-pago-mercadopago");
        const availability = document.getElementById("mercadopago-availability");
        if (!option || !input || !availability) return;
        try {
            const status = await API.request(CONFIG.ENDPOINTS?.mercadoPagoEstado || "/pagos/mercadopago/estado", { timeoutMs: 25000 });
            mercadoPagoAvailable = Boolean(status?.available);
            input.disabled = !mercadoPagoAvailable;
            option.classList.toggle("is-disabled", !mercadoPagoAvailable);
            option.setAttribute("aria-disabled", String(!mercadoPagoAvailable));
            availability.textContent = mercadoPagoAvailable
                ? status.environment === "production" ? "Paga con tarjetas, saldo u otros medios disponibles." : "Modo de prueba habilitado. No se realizarán cobros reales."
                : status?.configured && !status?.webhookReady ? "Configuración pendiente de Webhook." : "Próximamente disponible.";
        } catch (error) {
            mercadoPagoAvailable = false;
            input.disabled = true;
            option.classList.add("is-disabled");
            option.setAttribute("aria-disabled", "true");
            availability.textContent = "No disponible temporalmente.";
        }
        updatePaymentMethodUI();
    }

    async function submitOrder(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const submitButton = form.querySelector('[type="submit"]');
        const formData = new FormData(form);
        const items = read();
        if (!items.length) { window.location.href = "carrito.html"; return; }
        if (!window.CustomerAuth?.getToken?.()) {
            alert("Para proteger el comprobante y la aprobación del diseño, inicia sesión antes de confirmar el pedido.");
            window.location.href = "acceso.html?modo=login&next=finalizar-compra.html";
            return;
        }
        const paymentMethod = String(formData.get("pedido-pago") || "transferencia");
        if (paymentMethod === "mercadopago" && !mercadoPagoAvailable) {
            alert("Mercado Pago todavía no está disponible. Selecciona transferencia bancaria.");
            return;
        }
        if (submitButton) { submitButton.disabled = true; submitButton.innerHTML = "Guardando pedido..."; }

        try {
            await uploadSimpleCustomizations(items);
            const response = await API.request("/pedidos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cliente: {
                        nombre: formData.get("nombre"), rut: formData.get("rut"), email: formData.get("email"), telefono: formData.get("telefono"),
                        direccion: formData.get("direccion"), comuna: formData.get("comuna")
                    },
                    items: items.map((item) => ({
                        lineaId: item.lineId, productoId: item.productId, nombre: item.name, imagen: window.Cart.getDisplayImage(item), cantidad: item.quantity,
                        precioUnitario: item.price, varianteId: item.customization?.variantId || "", color: item.customization?.productVariant || "",
                        sku: item.customization?.sku || "", talla: item.customization?.talla || item.customization?.size || "",
                        personalizacion: item.customization, entrega: item.delivery
                    })),
                    entrega: {
                        metodo: formData.get("metodo-entrega"),
                        direccion: formData.get("metodo-entrega") === "envio" ? formData.get("direccion") : "",
                        comuna: formData.get("metodo-entrega") === "envio" ? formData.get("comuna") : "",
                        zonaEnvio: formData.get("metodo-entrega") === "envio" ? formData.get("zona-envio") : "",
                        fechaPreferida: formData.get("metodo-entrega") === "retiro" ? formData.get("fecha-preferida") : "",
                        receptorTercero: {
                            habilitado: formData.get("receptor-tercero") === "on",
                            nombre: formData.get("tercero-nombre") || "", telefono: formData.get("tercero-telefono") || "", relacion: formData.get("tercero-relacion") || ""
                        }
                    },
                    metodoPago: paymentMethod,
                    observaciones: formData.get("observaciones"),
                    origen: "web"
                })
            });

            sessionStorage.setItem("mommycrafts_last_order", JSON.stringify({
                pedidoId: response.pedidoId, numeroPedido: response.numeroPedido, venceAt: response.venceAt, metodoPago: response.metodoPago
            }));

            if (paymentMethod === "mercadopago") {
                submitButton.innerHTML = "Preparando Mercado Pago...";
                try {
                    const preference = await API.request(`/pagos/mercadopago/pedidos/${encodeURIComponent(response.pedidoId)}/preferencia`, {
                        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", timeoutMs: 70000
                    });
                    sessionStorage.setItem("mommycrafts_pending_payment", JSON.stringify({ pedidoId: response.pedidoId, numeroPedido: response.numeroPedido }));
                    window.Cart.clear();
                    window.location.href = preference.checkoutUrl;
                    return;
                } catch (paymentError) {
                    window.Cart.clear();
                    alert(paymentError.message || "El pedido quedó guardado, pero no fue posible abrir Mercado Pago. Puedes reintentar desde el detalle del pedido.");
                    window.location.href = `pedido.html?id=${encodeURIComponent(response.pedidoId)}`;
                    return;
                }
            }
            window.Cart.clear();
            window.location.href = `pedido.html?id=${encodeURIComponent(response.pedidoId)}`;
        } catch (error) {
            alert(error.message || "No fue posible guardar el pedido.");
        } finally {
            if (submitButton) { submitButton.disabled = false; updatePaymentMethodUI(); }
        }
    }

    function init() {
        if (document.body.dataset.page !== "checkout") return;
        if (!read().length) {
            document.getElementById("checkout-empty")?.removeAttribute("hidden");
            document.getElementById("checkout-content")?.setAttribute("hidden", "");
            return;
        }
        prefillCheckoutWithAccount();
        updateThirdPartyFields();
        updateDeliveryForm();
        renderCheckoutSummary();
        loadMercadoPagoAvailability();
        updatePaymentMethodUI();
        document.getElementById("pedido-tercero")?.addEventListener("change", updateThirdPartyFields);
        document.querySelectorAll('input[name="metodo-entrega"]').forEach((input) => input.addEventListener("change", updateDeliveryForm));
        document.getElementById("pedido-zona-envio")?.addEventListener("change", updateDeliveryForm);
        document.querySelectorAll('input[name="pedido-pago"]').forEach((input) => input.addEventListener("change", updatePaymentMethodUI));
        const preferredDate = document.getElementById("pedido-fecha-preferida");
        preferredDate?.addEventListener("click", () => { if (!preferredDate.disabled) preferredDate.showPicker?.(); });
        document.getElementById("form-pedido")?.addEventListener("submit", submitOrder);
        window.addEventListener("cart:updated", () => {
            if (!read().length) window.location.href = "carrito.html";
            else { renderCheckoutSummary(); updateDeliveryForm(); }
        });
    }

    document.addEventListener("DOMContentLoaded", init, { once: true });
})();
