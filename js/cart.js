"use strict";

(function () {
    const STORAGE_KEY = "mommyCraftsCart";
    const SANTIAGO_SHIPPING_COST = 4000;
    let mercadoPagoAvailable = false;

    function formatPrice(value) {
        return new Intl.NumberFormat(CONFIG.locale || "es-CL", {
            style: "currency",
            currency: CONFIG.currency || "CLP",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }


    function normalizeDelivery(value) {
        const raw =
            value &&
            typeof value === "object"
                ? value
                : {};

        const shipping =
            raw.shipping ??
            raw.envio ??
            {};

        const pickup =
            raw.pickup ??
            raw.retiro ??
            {};

        return {
            diasPreparacion:
                Math.min(
                    90,
                    Math.max(
                        1,
                        Number(raw.diasPreparacion ?? raw.preparationDays ?? 3) || 3
                    )
                ),
            shipping: {
                enabled:
                    shipping.enabled ??
                    shipping.habilitado ??
                    CONFIG.DELIVERY_DEFAULTS.shipping.enabled,
                instructions:
                    shipping.instructions ??
                    shipping.instrucciones ??
                    CONFIG.DELIVERY_DEFAULTS.shipping.instructions
            },
            pickup: {
                enabled:
                    pickup.enabled ??
                    pickup.habilitado ??
                    CONFIG.DELIVERY_DEFAULTS.pickup.enabled,
                instructions:
                    pickup.instructions ??
                    pickup.instrucciones ??
                    CONFIG.DELIVERY_DEFAULTS.pickup.instructions
            }
        };
    }

    function normalizeItem(item, index = 0) {
        const product = item?.product || {};
        const productId = String(
            item?.productId ??
            item?.id ??
            item?._id ??
            product?._id ??
            product?.id ??
            ""
        );

        const customization = item?.customization ?? item?.personalizacion ?? null;
        const customizationKey =
            item?.customizationKey ??
            (customization ? JSON.stringify(customization) : "");

        return {
            lineId:
                item?.lineId ||
                item?.cartItemId ||
                `${productId || "item"}::${customizationKey || index}`,
            productId,
            name:
                item?.name ??
                item?.nombre ??
                product?.nombre ??
                "Producto",
            price: Number(
                item?.price ??
                item?.precio ??
                product?.precio ??
                0
            ) || 0,
            image:
                item?.image ??
                item?.imagenPrincipal ??
                item?.imagenes?.[0] ??
                product?.imagenPrincipal ??
                product?.imagenes?.[0] ??
                CONFIG.placeholderImage,
            quantity: Math.max(
                1,
                Number(item?.quantity ?? item?.cantidad ?? 1) || 1
            ),
            customization,
            customizationKey,
            delivery:
                normalizeDelivery(
                    item?.delivery ??
                    item?.entrega ??
                    product?.delivery ??
                    product?.entrega
                )
        };
    }

    function read() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            if (!Array.isArray(parsed)) return [];

            return parsed
                .map(normalizeItem)
                .filter((item) => item.productId);
        } catch (error) {
            console.warn("No se pudo leer el carrito:", error);
            return [];
        }
    }

    function write(items) {
        const normalized = items.map(normalizeItem);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        updateCount();

        window.dispatchEvent(new CustomEvent("cart:updated", {
            detail: normalized
        }));

        if (document.body.dataset.page === "cart") {
            renderCartPage();
        }
    }

    function add(product, quantity = 1, customization = null) {
        if (!product?.id) {
            console.error("No se puede agregar un producto sin ID.");
            return false;
        }

        const items = read();
        const safeQuantity = Math.max(1, Number(quantity) || 1);
        const customizationKey = customization
            ? JSON.stringify(customization)
            : "";

        const existing = items.find(
            (item) =>
                item.productId === product.id &&
                (item.customizationKey || "") === customizationKey
        );

        if (existing) {
            existing.quantity += safeQuantity;
        } else {
            items.push({
                lineId:
                    window.crypto?.randomUUID?.() ||
                    `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                productId: product.id,
                name: product.nombre,
                price: product.precio,
                image: product.imagenPrincipal,
                quantity: safeQuantity,
                customization,
                customizationKey,
                delivery:
                    normalizeDelivery({
                        ...(product.delivery ?? product.entrega ?? {}),
                        diasPreparacion:
                            product.diasPreparacion ?? 3
                    })
            });
        }

        write(items);
        return true;
    }

    function remove(lineId) {
        write(read().filter((item) => item.lineId !== lineId));
    }

    function updateQuantity(lineId, quantity) {
        const items = read();
        const item = items.find((entry) => entry.lineId === lineId);
        if (!item) return;

        item.quantity = Math.max(1, Number(quantity) || 1);
        write(items);
    }

    function clear() {
        write([]);
    }

    function count() {
        return read().reduce(
            (total, item) => total + (Number(item.quantity) || 0),
            0
        );
    }

    function total() {
        return read().reduce(
            (sum, item) =>
                sum +
                (Number(item.price) || 0) *
                (Number(item.quantity) || 0),
            0
        );
    }

    function updateCount() {
        document.querySelectorAll("#cart-count").forEach((element) => {
            element.textContent = String(count());
        });
    }

    function customizationDescription(customization) {
        if (!customization) return "";

        const parts = [];
        if (customization.productVariant) {
            parts.push(`Color: ${customization.productVariant}`);
        }
        if (customization.talla || customization.size) {
            parts.push(`Talla: ${customization.talla || customization.size}`);
        }
        if (customization.style) {
            parts.push(`Estilo: ${customization.style}`);
        }
        if (customization.mainText) {
            parts.push(`Texto: ${customization.mainText}`);
        }
        if (customization.secondaryText) {
            parts.push(`Texto secundario: ${customization.secondaryText}`);
        }
        if (customization.requestedName) {
            parts.push(
                `Nombre solicitado: ${customization.requestedName}`
            );
        }
        if (customization.observation) {
            parts.push(
                `Observación: ${customization.observation}`
            );
        }
        const imageNames = Array.isArray(customization.imageNames)
            ? customization.imageNames.filter(Boolean)
            : customization.imageName
                ? [customization.imageName]
                : [];

        if (imageNames.length) {
            parts.push(
                `${imageNames.length === 1 ? "Imagen de referencia" : "Imágenes de referencia"}: ${imageNames.join(", ")}`
            );
        }

        return parts.join("\n");
    }

    function createCartItem(item) {
        const template = document.getElementById("cart-item-template");
        if (!template) return null;

        const fragment = template.content.cloneNode(true);
        const article = fragment.querySelector(".cart-item");
        const imageLink = fragment.querySelector(".cart-item-image-link");
        const image = fragment.querySelector(".cart-item-image");
        const nameLink = fragment.querySelector(".cart-item-name");
        const customization = fragment.querySelector(".cart-item-customization");
        const unitPrice = fragment.querySelector(".cart-item-unit-price");
        const quantityInput = fragment.querySelector(".quantity-input");
        const decrease = fragment.querySelector(".quantity-decrease");
        const increase = fragment.querySelector(".quantity-increase");
        const itemTotal = fragment.querySelector(".cart-item-total");
        const removeButton = fragment.querySelector(".cart-item-remove");

        article.dataset.lineId = item.lineId;

        const variantParam = item.customization?.variantId
            ? `&variante=${encodeURIComponent(item.customization.variantId)}`
            : "";
        const sizeParam = item.customization?.talla || item.customization?.size
            ? `&talla=${encodeURIComponent(item.customization.talla || item.customization.size)}`
            : "";
        const detailUrl = `producto.html?id=${encodeURIComponent(item.productId)}${variantParam}${sizeParam}`;
        imageLink.href = detailUrl;
        nameLink.href = detailUrl;

        image.src = item.image || CONFIG.placeholderImage;
        image.alt = item.name;
        image.addEventListener("error", () => {
            image.src = CONFIG.placeholderImage;
        }, { once: true });

        nameLink.textContent = item.name;
        unitPrice.textContent = `${formatPrice(item.price)} por unidad`;

        const customizationText =
            customizationDescription(
                item.customization
            );

        if (customizationText) {
            customization.hidden = false;
            customization.textContent =
                customizationText;
        }

        const customizationImages = [];
        const finalPreview =
            item.customization?.assets?.preview?.url ||
            item.customization?.finalPreview?.asset?.url ||
            "";
        const originalImage =
            item.customization?.assets?.original?.url ||
            item.customization?.image?.asset?.url ||
            "";

        if (finalPreview) {
            customizationImages.push({
                source: finalPreview,
                label: "Vista previa final"
            });
        }

        if (originalImage) {
            customizationImages.push({
                source: originalImage,
                label: "Archivo original"
            });
        }

        if (!customizationImages.length) {
            const legacyImages = Array.isArray(
                item.customization?.imageDataList
            )
                ? item.customization.imageDataList.filter(Boolean)
                : item.customization?.imageData
                    ? [item.customization.imageData]
                    : [];

            legacyImages.forEach((source, index) => {
                customizationImages.push({
                    source,
                    label: `Imagen de referencia ${index + 1}`
                });
            });
        }

        if (customizationImages.length) {
            const gallery =
                document.createElement("div");

            gallery.className =
                "cart-customization-preview-grid";

            customizationImages.forEach(({ source, label }) => {
                const card = document.createElement("figure");
                const preview = document.createElement("img");
                const caption = document.createElement("figcaption");

                card.className = "cart-customization-preview-card";
                preview.className = "cart-customization-preview";
                preview.src = source;
                preview.alt = label;
                caption.textContent = label;

                card.append(preview, caption);
                gallery.appendChild(card);
            });

            customization.after(gallery);
        }

        quantityInput.value = String(item.quantity);
        itemTotal.textContent = formatPrice(item.price * item.quantity);

        decrease.addEventListener("click", () => {
            updateQuantity(item.lineId, Math.max(1, item.quantity - 1));
        });

        increase.addEventListener("click", () => {
            updateQuantity(item.lineId, item.quantity + 1);
        });

        quantityInput.addEventListener("change", () => {
            updateQuantity(item.lineId, quantityInput.value);
        });

        removeButton.addEventListener("click", () => {
            remove(item.lineId);
        });

        return fragment;
    }

    function renderCartPage() {
        if (document.body.dataset.page !== "cart") return;

        const container = document.getElementById("cart-items");
        const subtotal = document.getElementById("cart-subtotal");
        const totalElement = document.getElementById("cart-total");
        const checkoutButton = document.getElementById("btn-open-checkout");
        if (!container) return;

        const items = read();
        container.innerHTML = "";

        if (items.length === 0) {
            const message = document.createElement("p");
            message.className = "cart-empty";
            message.id = "cart-empty";
            message.textContent = "Tu carrito está vacío.";
            container.appendChild(message);

            subtotal.textContent = formatPrice(0);
            totalElement.textContent = formatPrice(0);
            checkoutButton.disabled = true;
            return;
        }

        const fragment = document.createDocumentFragment();
        items.forEach((item) => {
            const row = createCartItem(item);
            if (row) fragment.appendChild(row);
        });
        container.appendChild(fragment);

        const subtotalValue = total();
        subtotal.textContent = formatPrice(subtotalValue);
        totalElement.textContent = formatPrice(subtotalValue);
        checkoutButton.disabled = false;
    }


    function deliveryAvailability(items = read()) {
        return {
            shipping:
                items.length > 0 &&
                items.every(
                    (item) =>
                        normalizeDelivery(
                            item.delivery
                        ).shipping.enabled !== false
                ),
            pickup:
                items.length > 0 &&
                items.every(
                    (item) =>
                        normalizeDelivery(
                            item.delivery
                        ).pickup.enabled !== false
                )
        };
    }

    function selectedDeliveryMethod(form) {
        return (
            form?.querySelector(
                'input[name="metodo-entrega"]:checked'
            )?.value ||
            "envio"
        );
    }

    function selectedShippingZone(form = document.getElementById("form-pedido")) {
        return form?.querySelector("#pedido-zona-envio")?.value || "santiago";
    }

    function shippingCost(form = document.getElementById("form-pedido")) {
        return selectedDeliveryMethod(form) === "envio" &&
            selectedShippingZone(form) === "santiago"
            ? SANTIAGO_SHIPPING_COST
            : 0;
    }

    function checkoutTotal(form = document.getElementById("form-pedido")) {
        return total() + shippingCost(form);
    }

    function deliveryInstructionDetails(items, method) {
        const key = method === "retiro" ? "pickup" : "shipping";
        return items.map((item) => ({
            product: item.name,
            title: `Instrucciones de ${method === "retiro" ? "retiro" : "envío"}: ${item.name}`,
            instruction: normalizeDelivery(item.delivery)[key].instructions || "Sin instrucciones adicionales."
        }));
    }

    function deliveryInstructions(items, method) {
        const details = deliveryInstructionDetails(items, method)
            .map((detail) => `${detail.title}\n${detail.instruction}`);

        return [...new Set(details)].join("\n\n");
    }


    function updateDeliveryForm() {
        const form =
            document.getElementById(
                "form-pedido"
            );

        if (!form) return;

        const items = read();
        const availability =
            deliveryAvailability(items);

        const shippingInput =
            form.querySelector(
                'input[name="metodo-entrega"][value="envio"]'
            );

        const pickupInput =
            form.querySelector(
                'input[name="metodo-entrega"][value="retiro"]'
            );

        const shippingOption =
            document.getElementById(
                "delivery-shipping-option"
            );

        const pickupOption =
            document.getElementById(
                "delivery-pickup-option"
            );

        shippingInput.disabled =
            !availability.shipping;

        pickupInput.disabled =
            !availability.pickup;

        shippingOption?.classList.toggle(
            "is-disabled",
            !availability.shipping
        );

        pickupOption?.classList.toggle(
            "is-disabled",
            !availability.pickup
        );

        if (
            shippingInput.checked &&
            !availability.shipping
        ) {
            pickupInput.checked =
                availability.pickup;
        }

        if (
            pickupInput.checked &&
            !availability.pickup
        ) {
            shippingInput.checked =
                availability.shipping;
        }

        const method =
            selectedDeliveryMethod(form);

        const addressFields =
            document.getElementById(
                "shipping-address-fields"
            );

        const address =
            document.getElementById(
                "pedido-direccion"
            );

        const commune =
            document.getElementById(
                "pedido-comuna"
            );

        const isShipping =
            method === "envio";
        const pickupDateField = document.getElementById("pickup-date-field");
        const preferredDate = document.getElementById("pedido-fecha-preferida");
        const shippingZone = document.getElementById("pedido-zona-envio");
        const shippingZoneHelp = document.getElementById("pedido-zona-envio-ayuda");

        if (addressFields) {
            addressFields.hidden =
                !isShipping;
        }

        if (address) {
            address.required =
                isShipping;
        }

        if (commune) {
            commune.required =
                isShipping;
        }

        if (shippingZone) {
            shippingZone.required = isShipping;
            shippingZone.disabled = !isShipping;
        }

        if (pickupDateField) pickupDateField.hidden = isShipping;
        if (preferredDate) {
            preferredDate.disabled = isShipping;
            preferredDate.required = !isShipping;
            if (isShipping) preferredDate.value = "";
        }

        if (shippingZoneHelp && isShipping) {
            shippingZoneHelp.textContent = selectedShippingZone(form) === "santiago"
                ? "El costo de $4.000 se agrega al total. Entrega estimada entre 5 y 7 días hábiles desde la confirmación."
                : "Envío por Chilexpress desde 5 días hábiles. El costo es por pagar y se coordina contigo.";
        }

        if (!isShipping) updatePreferredDate();

        const instructions =
            document.getElementById(
                "delivery-instructions"
            );

        if (instructions) {
            instructions.replaceChildren();
            deliveryInstructionDetails(items, method).forEach((detail) => {
                const block = document.createElement("div");
                block.className = "delivery-instruction-product";
                const title = document.createElement("strong");
                const text = document.createElement("p");
                title.textContent = detail.title;
                text.textContent = detail.instruction;
                block.append(title, text);
                instructions.appendChild(block);
            });
        }
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
            for (const [id, value] of Object.entries(fields)) {
                const input = document.getElementById(id);
                if (input && value && !input.value) input.value = value;
            }

            const email = document.getElementById("pedido-email");
            if (email) email.readOnly = true;

            if (note) {
                note.innerHTML = `
                    <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
                    <span>Este pedido quedará guardado en <a href="cuenta.html#pedidos">Mi cuenta</a>.</span>
                `;
            }
        } else {
            const email = document.getElementById("pedido-email");
            if (email) email.readOnly = false;

            if (note) {
                note.innerHTML = `
                    <i class="fa-regular fa-circle-user" aria-hidden="true"></i>
                    <span><a href="acceso.html?modo=login&next=carrito.html">Inicia sesión</a> antes de confirmar para consultar este pedido desde tu cuenta.</span>
                `;
            }
        }
    }

    function renderCheckoutSummary() {
        const summary = document.getElementById("pedido-producto-info");
        if (!summary) return;

        const form = document.getElementById("form-pedido");
        const cost = shippingCost(form);
        const zone = selectedShippingZone(form);
        const method = selectedDeliveryMethod(form);

        summary.innerHTML = `
            <strong>${count()} producto(s)</strong>
            <p>Subtotal: ${formatPrice(total())}</p>
            <p>Envío: ${method === "retiro" ? "Sin costo" : zone === "santiago" ? formatPrice(cost) : "Por pagar a Chilexpress"}</p>
            <p><strong>Total estimado: ${formatPrice(checkoutTotal(form))}</strong></p>
        `;
    }

    function openCheckout() {
        const overlay = document.getElementById("modal-pedido");
        if (!overlay || read().length === 0) return;

        overlay.classList.add("active");
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");

        updateDeliveryForm();
        renderCheckoutSummary();
        updatePreferredDate();
        updateThirdPartyFields();
        prefillCheckoutWithAccount();
    }

    function closeCheckout() {
        const overlay = document.getElementById("modal-pedido");
        if (!overlay) return;

        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
    }

    function buildWhatsAppOrder(formData, orderNumber = "") {
        const lines = ["Hola, quiero realizar el siguiente pedido:", ""];

        if (orderNumber) {
            lines.push(`N.º de pedido: ${orderNumber}`, "");
        }

        read().forEach((item, index) => {
            lines.push(
                `${index + 1}. ${item.name}`,
                `Cantidad: ${item.quantity}`,
                `Precio: ${formatPrice(item.price * item.quantity)}`
            );

            const customization = customizationDescription(item.customization);
            if (customization) lines.push(customization);
            lines.push("");
        });

        const deliveryMethod =
            formData.get("metodo-entrega") === "retiro"
                ? "retiro"
                : "envio";

        lines.push(
            `Total estimado: ${formatPrice(total() + (deliveryMethod === "envio" && formData.get("zona-envio") === "santiago" ? SANTIAGO_SHIPPING_COST : 0))}`,
            "",
            `Entrega: ${deliveryMethod === "envio" ? "Envío" : "Retiro"}`,
            deliveryMethod === "envio"
                ? `Zona: ${formData.get("zona-envio") === "santiago" ? "Provincia de Santiago · $4.000 · 5 a 7 días hábiles" : "Otros sectores de Chile · Chilexpress por pagar · desde 5 días hábiles"}`
                : `Fecha preferida: ${formData.get("fecha-preferida") || "Por coordinar"}`,
            `Instrucciones: ${deliveryInstructions(read(), deliveryMethod)}`,
            "",
            `Nombre: ${formData.get("nombre")}`,
            `RUT: ${formData.get("rut")}`,
            `Correo: ${formData.get("email")}`,
            `Teléfono: ${formData.get("telefono")}`,
            `Dirección: ${deliveryMethod === "envio" ? formData.get("direccion") : "No aplica"}`,
            `Comuna: ${deliveryMethod === "envio" ? formData.get("comuna") : "No aplica"}`,
            `Forma de pago: ${formData.get("pedido-pago")}`,
            `Observaciones: ${formData.get("observaciones") || "Sin observaciones"}`
        );

        return lines.join("\n");
    }


    function addBusinessDays(start, days) {
        const date = new Date(start);
        date.setHours(12, 0, 0, 0);
        let remaining = Math.max(0, Number(days) || 0);
        while (remaining > 0) {
            date.setDate(date.getDate() + 1);
            const weekday = date.getDay();
            if (weekday !== 0 && weekday !== 6) remaining -= 1;
        }
        return date;
    }

    function dateInputValue(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function updatePreferredDate() {
        const input = document.getElementById("pedido-fecha-preferida");
        const help = document.getElementById("pedido-fecha-ayuda");
        if (!input) return;
        const form = document.getElementById("form-pedido");
        if (selectedDeliveryMethod(form) !== "retiro") {
            input.value = "";
            input.disabled = true;
            input.required = false;
            return;
        }
        input.disabled = false;
        input.required = true;
        const days = Math.max(...read().map(item => Number(item.delivery?.diasPreparacion || item.delivery?.preparationDays || 3)), 3);
        const minimum = addBusinessDays(new Date(), days);
        const value = dateInputValue(minimum);
        input.min = value;
        if (!input.value || input.value < value) input.value = value;
        if (help) help.textContent = `Primera fecha disponible: ${minimum.toLocaleDateString("es-CL")} (${days} días hábiles mínimos). Puedes elegir una fecha posterior.`;
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
        if (changed) write(items);
        return items;
    }

    function selectedPaymentMethod(form = document.getElementById("form-pedido")) {
        return form?.querySelector('input[name="pedido-pago"]:checked')?.value || "transferencia";
    }

    function updatePaymentMethodUI() {
        const form = document.getElementById("form-pedido");
        const method = selectedPaymentMethod(form);
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
                    ? "Serás redirigido al entorno seguro de Mercado Pago. El pedido se confirmará automáticamente cuando Mercado Pago apruebe el pago."
                    : "Mercado Pago todavía no está disponible. Selecciona transferencia bancaria.";
                note.classList.toggle("error", !mercadoPagoAvailable);
            } else {
                note.textContent = "El comprobante no confirma el pago automáticamente. Mommy Crafts validará que la transferencia haya sido recibida.";
            }
        }

        if (submitButton) {
            submitButton.innerHTML = method === "mercadopago"
                ? '<i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Ir a Mercado Pago'
                : '<i class="fa-solid fa-lock" aria-hidden="true"></i> Confirmar pedido';
        }
    }

    async function loadMercadoPagoAvailability() {
        const option = document.getElementById("payment-option-mercadopago");
        const input = document.getElementById("pedido-pago-mercadopago");
        const availability = document.getElementById("mercadopago-availability");

        if (!option || !input || !availability) return;

        try {
            const status = await API.request(
                CONFIG.ENDPOINTS?.mercadoPagoEstado || "/pagos/mercadopago/estado",
                { timeoutMs: 25000 }
            );

            mercadoPagoAvailable = Boolean(status?.available);
            input.disabled = !mercadoPagoAvailable;
            option.classList.toggle("is-disabled", !mercadoPagoAvailable);
            option.setAttribute("aria-disabled", String(!mercadoPagoAvailable));

            if (mercadoPagoAvailable) {
                availability.textContent = status.environment === "production"
                    ? "Paga con tarjetas, saldo u otros medios disponibles."
                    : "Modo de prueba habilitado. No se realizarán cobros reales.";
            } else if (status?.configured && !status?.webhookReady) {
                availability.textContent = "Configuración pendiente de Webhook.";
            } else {
                availability.textContent = "Próximamente disponible.";
            }
        } catch (error) {
            mercadoPagoAvailable = false;
            input.disabled = true;
            option.classList.add("is-disabled");
            option.setAttribute("aria-disabled", "true");
            availability.textContent = "No disponible temporalmente.";
            console.warn("No se pudo consultar Mercado Pago:", error.message);
        }

        updatePaymentMethodUI();
    }

    function initCheckout() {
        document.getElementById("btn-open-checkout")?.addEventListener(
            "click",
            openCheckout
        );
        document.getElementById("modal-pedido-close")?.addEventListener(
            "click",
            closeCheckout
        );
        document.getElementById("modal-pedido")?.addEventListener(
            "click",
            (event) => {
                if (event.target.id === "modal-pedido") closeCheckout();
            }
        );
        document.getElementById("pedido-tercero")?.addEventListener("change", updateThirdPartyFields);

        document
            .querySelectorAll('input[name="pedido-pago"]')
            .forEach((input) => {
                input.addEventListener("change", updatePaymentMethodUI);
            });

        loadMercadoPagoAvailability();
        updatePaymentMethodUI();

        document
            .querySelectorAll(
                'input[name="metodo-entrega"]'
            )
            .forEach((input) => {
                input.addEventListener("change", () => {
                    updateDeliveryForm();
                    renderCheckoutSummary();
                });
            });

        document.getElementById("pedido-zona-envio")?.addEventListener("change", () => {
            updateDeliveryForm();
            renderCheckoutSummary();
        });

        const preferredDateInput = document.getElementById("pedido-fecha-preferida");
        preferredDateInput?.addEventListener("click", () => {
            if (!preferredDateInput.disabled) preferredDateInput.showPicker?.();
        });

        document.getElementById("form-pedido")?.addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();

                const form =
                    event.currentTarget;

                const submitButton =
                    form.querySelector(
                        '[type="submit"]'
                    );

                const formData =
                    new FormData(form);

                const items = read();

                if (!items.length) {
                    alert(
                        "Tu carrito está vacío."
                    );

                    return;
                }

                if (!window.CustomerAuth?.getToken?.()) {
                    alert("Para proteger el comprobante y la aprobación del diseño, inicia sesión antes de confirmar el pedido.");
                    location.href = "acceso.html?modo=login&next=carrito.html";
                    return;
                }

                const paymentMethod = String(
                    formData.get("pedido-pago") || "transferencia"
                );

                if (paymentMethod === "mercadopago" && !mercadoPagoAvailable) {
                    alert("Mercado Pago todavía no está disponible. Selecciona transferencia bancaria.");
                    return;
                }

                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.dataset.originalText =
                        submitButton.innerHTML;
                    submitButton.innerHTML =
                        "Guardando pedido...";
                }

                try {
                    await uploadSimpleCustomizations(items);

                    const response =
                        await API.request(
                            "/pedidos",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },
                                body: JSON.stringify({
                                    cliente: {
                                        nombre:
                                            formData.get(
                                                "nombre"
                                            ),
                                        rut:
                                            formData.get(
                                                "rut"
                                            ),
                                        email:
                                            formData.get(
                                                "email"
                                            ),
                                        telefono:
                                            formData.get(
                                                "telefono"
                                            ),
                                        direccion:
                                            formData.get(
                                                "direccion"
                                            ),
                                        comuna:
                                            formData.get(
                                                "comuna"
                                            )
                                    },
                                    items:
                                        items.map(
                                            (item) => ({
                                                lineaId:
                                                    item.lineId,
                                                productoId:
                                                    item.productId,
                                                nombre:
                                                    item.name,
                                                imagen:
                                                    item.image,
                                                cantidad:
                                                    item.quantity,
                                                precioUnitario:
                                                    item.price,
                                                varianteId:
                                                    item.customization
                                                        ?.variantId ||
                                                    "",
                                                color:
                                                    item.customization
                                                        ?.productVariant ||
                                                    "",
                                                sku:
                                                    item.customization
                                                        ?.sku ||
                                                    "",
                                                talla:
                                                    item.customization?.talla ||
                                                    item.customization?.size ||
                                                    "",
                                                personalizacion:
                                                    item.customization,
                                                entrega:
                                                    item.delivery
                                            })
                                        ),
                                    entrega: {
                                        metodo:
                                            formData.get(
                                                "metodo-entrega"
                                            ),
                                        direccion:
                                            formData.get(
                                                "metodo-entrega"
                                            ) === "envio"
                                                ? formData.get(
                                                    "direccion"
                                                )
                                                : "",
                                        comuna:
                                            formData.get(
                                                "metodo-entrega"
                                            ) === "envio"
                                                ? formData.get(
                                                    "comuna"
                                                )
                                                : "",
                                        zonaEnvio:
                                            formData.get("metodo-entrega") === "envio"
                                                ? formData.get("zona-envio")
                                                : "",
                                        fechaPreferida:
                                            formData.get("metodo-entrega") === "retiro"
                                                ? formData.get("fecha-preferida")
                                                : "",
                                        receptorTercero: {
                                            habilitado:
                                                formData.get("receptor-tercero") === "on",
                                            nombre:
                                                formData.get("tercero-nombre") || "",
                                            telefono:
                                                formData.get("tercero-telefono") || "",
                                            relacion:
                                                formData.get("tercero-relacion") || ""
                                        }
                                    },
                                    metodoPago:
                                        formData.get(
                                            "pedido-pago"
                                        ),
                                    observaciones:
                                        formData.get(
                                            "observaciones"
                                        ),
                                    origen: "web"
                                })
                            }
                        );

                    sessionStorage.setItem(
                        "mommycrafts_last_order",
                        JSON.stringify({
                            pedidoId: response.pedidoId,
                            numeroPedido: response.numeroPedido,
                            venceAt: response.venceAt,
                            metodoPago: response.metodoPago
                        })
                    );

                    if (paymentMethod === "mercadopago") {
                        if (submitButton) submitButton.innerHTML = "Preparando Mercado Pago...";

                        try {
                            const preference = await API.request(
                                `/pagos/mercadopago/pedidos/${encodeURIComponent(response.pedidoId)}/preferencia`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: "{}",
                                    timeoutMs: 70000
                                }
                            );

                            sessionStorage.setItem(
                                "mommycrafts_pending_payment",
                                JSON.stringify({
                                    pedidoId: response.pedidoId,
                                    numeroPedido: response.numeroPedido
                                })
                            );

                            clear();
                            closeCheckout();
                            form.reset();
                            window.location.href = preference.checkoutUrl;
                            return;
                        } catch (paymentError) {
                            clear();
                            closeCheckout();
                            form.reset();
                            alert(
                                paymentError.message ||
                                "El pedido quedó guardado, pero no fue posible abrir Mercado Pago. Puedes reintentar desde el detalle del pedido."
                            );
                            window.location.href = `pedido.html?id=${encodeURIComponent(response.pedidoId)}`;
                            return;
                        }
                    }

                    clear();
                    closeCheckout();
                    form.reset();
                    window.location.href = `pedido.html?id=${encodeURIComponent(response.pedidoId)}`;
                } catch (error) {

                    alert(
                        error.message ||
                        "No fue posible guardar el pedido."
                    );
                } finally {
                    if (submitButton) {
                        submitButton.disabled = false;
                        updatePaymentMethodUI();
                    }
                }
            }
        );
    }

    window.Cart = Object.freeze({
        read,
        write,
        add,
        remove,
        updateQuantity,
        clear,
        count,
        total,
        updateCount,
        renderCartPage
    });

    document.addEventListener("DOMContentLoaded", () => {
        updateCount();
        renderCartPage();
        initCheckout();
    });
})();
