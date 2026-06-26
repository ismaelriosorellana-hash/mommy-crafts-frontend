"use strict";

(function () {
    const STORAGE_KEY = "mommyCraftsCart";

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
            return;
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
                    normalizeDelivery(
                        product.delivery ??
                        product.entrega
                    )
            });
        }

        write(items);
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

        const detailUrl = `producto.html?id=${encodeURIComponent(item.productId)}`;
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

    function deliveryInstructions(items, method) {
        const key =
            method === "retiro"
                ? "pickup"
                : "shipping";

        const instructions = [
            ...new Set(
                items
                    .map(
                        (item) =>
                            normalizeDelivery(
                                item.delivery
                            )[key].instructions
                    )
                    .filter(Boolean)
            )
        ];

        return instructions.join("\n\n");
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

        const instructions =
            document.getElementById(
                "delivery-instructions"
            );

        if (instructions) {
            const methodLabel =
                isShipping
                    ? "Instrucciones de envío"
                    : "Instrucciones de retiro";

            instructions.innerHTML = `
                <strong>${methodLabel}</strong>
                ${deliveryInstructions(items, method)}
            `;
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

    function openCheckout() {
        const overlay = document.getElementById("modal-pedido");
        if (!overlay || read().length === 0) return;

        overlay.classList.add("active");
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");

        const summary = document.getElementById("pedido-producto-info");
        if (summary) {
            summary.innerHTML = `
                <strong>${count()} producto(s)</strong>
                <p>Total estimado: ${formatPrice(total())}</p>
            `;
        }

        updateDeliveryForm();
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
            `Total estimado: ${formatPrice(total())}`,
            "",
            `Entrega: ${deliveryMethod === "envio" ? "Envío" : "Retiro"}`,
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
        document
            .querySelectorAll(
                'input[name="metodo-entrega"]'
            )
            .forEach((input) => {
                input.addEventListener(
                    "change",
                    updateDeliveryForm
                );
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

                const whatsappWindow =
                    window.open(
                        "about:blank",
                        "_blank"
                    );

                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.dataset.originalText =
                        submitButton.innerHTML;
                    submitButton.innerHTML =
                        "Guardando pedido...";
                }

                try {
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
                                                : ""
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

                    const message =
                        buildWhatsAppOrder(
                            formData,
                            response.numeroPedido
                        );

                    const url =
                        `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;

                    clear();
                    closeCheckout();
                    form.reset();

                    if (
                        whatsappWindow &&
                        !whatsappWindow.closed
                    ) {
                        whatsappWindow.location.href =
                            url;
                    } else {
                        window.location.href =
                            url;
                    }
                } catch (error) {
                    whatsappWindow?.close();

                    alert(
                        error.message ||
                        "No fue posible guardar el pedido."
                    );
                } finally {
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.innerHTML =
                            submitButton.dataset
                                .originalText ||
                            "Finalizar pedido";
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
