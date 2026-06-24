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
            customizationKey
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
                customizationKey
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

        const customizationImages = Array.isArray(
            item.customization?.imageDataList
        )
            ? item.customization.imageDataList.filter(Boolean)
            : item.customization?.imageData
                ? [item.customization.imageData]
                : [];

        if (customizationImages.length) {
            const gallery =
                document.createElement("div");

            gallery.className =
                "cart-customization-preview-grid";

            customizationImages.forEach((source, index) => {
                const preview =
                    document.createElement("img");

                preview.className =
                    "cart-customization-preview";

                preview.src = source;
                preview.alt =
                    `Imagen de referencia ${index + 1} del cliente`;

                gallery.appendChild(preview);
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
    }

    function closeCheckout() {
        const overlay = document.getElementById("modal-pedido");
        if (!overlay) return;

        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
    }

    function buildWhatsAppOrder(formData) {
        const lines = ["Hola, quiero realizar el siguiente pedido:", ""];

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

        lines.push(
            `Total estimado: ${formatPrice(total())}`,
            "",
            `Nombre: ${formData.get("nombre")}`,
            `RUT: ${formData.get("rut")}`,
            `Correo: ${formData.get("email")}`,
            `Teléfono: ${formData.get("telefono")}`,
            `Dirección: ${formData.get("direccion")}`,
            `Comuna: ${formData.get("comuna")}`,
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
        document.getElementById("form-pedido")?.addEventListener(
            "submit",
            (event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const message = buildWhatsAppOrder(formData);
                const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
                window.open(url, "_blank", "noopener,noreferrer");
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
