"use strict";

(function () {
    const STORAGE_KEY = "mommyCraftsCart";
    const FREE_SHIPPING_THRESHOLD = Number(CONFIG.FREE_SHIPPING_THRESHOLD || 25000);

    function formatPrice(value) {
        return new Intl.NumberFormat(CONFIG.locale || "es-CL", {
            style: "currency",
            currency: CONFIG.currency || "CLP",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }

    function normalizeDelivery(value) {
        const raw = value && typeof value === "object" ? value : {};
        const shipping = raw.shipping ?? raw.envio ?? {};
        const pickup = raw.pickup ?? raw.retiro ?? {};

        return {
            diasPreparacion: Math.min(90, Math.max(1, Number(raw.diasPreparacion ?? raw.preparationDays ?? 3) || 3)),
            shipping: {
                enabled: shipping.enabled ?? shipping.habilitado ?? CONFIG.DELIVERY_DEFAULTS.shipping.enabled,
                instructions: shipping.instructions ?? shipping.instrucciones ?? CONFIG.DELIVERY_DEFAULTS.shipping.instructions
            },
            pickup: {
                enabled: pickup.enabled ?? pickup.habilitado ?? CONFIG.DELIVERY_DEFAULTS.pickup.enabled,
                instructions: pickup.instructions ?? pickup.instrucciones ?? CONFIG.DELIVERY_DEFAULTS.pickup.instructions
            }
        };
    }

    function normalizeItem(item, index = 0) {
        const product = item?.product || {};
        const productId = String(item?.productId ?? item?.id ?? item?._id ?? product?._id ?? product?.id ?? "");
        const customization = item?.customization ?? item?.personalizacion ?? null;
        const customizationKey = item?.customizationKey ?? (customization ? JSON.stringify(customization) : "");

        return {
            lineId: item?.lineId || item?.cartItemId || `${productId || "item"}::${customizationKey || index}`,
            productId,
            name: item?.name ?? item?.nombre ?? product?.nombre ?? "Producto",
            price: Number(item?.price ?? item?.precio ?? product?.precio ?? 0) || 0,
            image: item?.image ?? item?.imagenPrincipal ?? item?.imagenes?.[0] ?? product?.imagenPrincipal ?? product?.imagenes?.[0] ?? CONFIG.placeholderImage,
            quantity: Math.max(1, Number(item?.quantity ?? item?.cantidad ?? 1) || 1),
            customization,
            customizationKey,
            delivery: normalizeDelivery(item?.delivery ?? item?.entrega ?? product?.delivery ?? product?.entrega)
        };
    }

    function read() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(parsed) ? parsed.map(normalizeItem).filter((item) => item.productId) : [];
        } catch (error) {
            console.warn("No se pudo leer el carrito:", error);
            return [];
        }
    }

    function write(items) {
        const normalized = items.map(normalizeItem);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        updateCount();
        window.dispatchEvent(new CustomEvent("cart:updated", { detail: normalized }));
        if (document.body.dataset.page === "cart") renderCartPage();
    }

    function add(product, quantity = 1, customization = null) {
        if (!product?.id) return false;
        const items = read();
        const safeQuantity = Math.max(1, Number(quantity) || 1);
        const customizationKey = customization ? JSON.stringify(customization) : "";
        const existing = items.find((item) => item.productId === product.id && (item.customizationKey || "") === customizationKey);

        if (existing) {
            existing.quantity += safeQuantity;
        } else {
            items.push({
                lineId: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                productId: product.id,
                name: product.nombre,
                price: product.precio,
                image: product.imagenPrincipal,
                quantity: safeQuantity,
                customization,
                customizationKey,
                delivery: normalizeDelivery({ ...(product.delivery ?? product.entrega ?? {}), diasPreparacion: product.diasPreparacion ?? 3 })
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
        return read().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    }

    function total() {
        return read().reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
    }

    function updateCount() {
        document.querySelectorAll("#cart-count").forEach((element) => {
            element.textContent = String(count());
        });
    }

    function customizationDescription(customization) {
        if (!customization) return "";
        const parts = [];
        if (customization.productVariant) parts.push(`Color: ${customization.productVariant}`);
        if (customization.talla || customization.size) parts.push(`Talla: ${customization.talla || customization.size}`);
        if (customization.style) parts.push(`Estilo: ${customization.style}`);
        if (customization.mainText) parts.push(`Texto: ${customization.mainText}`);
        if (customization.secondaryText) parts.push(`Texto secundario: ${customization.secondaryText}`);
        if (customization.requestedName) parts.push(`Nombre solicitado: ${customization.requestedName}`);
        if (customization.observation) parts.push(`Observación: ${customization.observation}`);
        return parts.join(" · ");
    }

    function getDisplayImage(item) {
        const customization = item?.customization || {};
        return customization?.assets?.preview?.url ||
            customization?.finalPreview?.asset?.url ||
            customization?.assets?.images?.[0]?.url ||
            customization?.assets?.images?.[0]?.secure_url ||
            customization?.assets?.original?.url ||
            customization?.image?.asset?.url ||
            item?.image ||
            CONFIG.placeholderImage;
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
        const itemTotal = fragment.querySelector(".cart-item-total");

        article.dataset.lineId = item.lineId;
        const variantParam = item.customization?.variantId ? `&variante=${encodeURIComponent(item.customization.variantId)}` : "";
        const selectedSize = item.customization?.talla || item.customization?.size || "";
        const sizeParam = selectedSize ? `&talla=${encodeURIComponent(selectedSize)}` : "";
        const detailUrl = `producto.html?id=${encodeURIComponent(item.productId)}${variantParam}${sizeParam}`;
        imageLink.href = detailUrl;
        nameLink.href = detailUrl;
        image.src = getDisplayImage(item);
        image.alt = item.customization ? `Vista personalizada de ${item.name}` : item.name;
        image.addEventListener("error", () => { image.src = CONFIG.placeholderImage; }, { once: true });
        nameLink.textContent = item.name;
        unitPrice.textContent = `${formatPrice(item.price)} por unidad`;
        const description = customizationDescription(item.customization);
        customization.hidden = !description;
        customization.textContent = description;
        quantityInput.value = String(item.quantity);
        itemTotal.textContent = formatPrice(item.price * item.quantity);

        fragment.querySelector(".quantity-decrease")?.addEventListener("click", () => updateQuantity(item.lineId, Math.max(1, item.quantity - 1)));
        fragment.querySelector(".quantity-increase")?.addEventListener("click", () => updateQuantity(item.lineId, item.quantity + 1));
        quantityInput.addEventListener("change", () => updateQuantity(item.lineId, quantityInput.value));
        fragment.querySelector(".cart-item-remove")?.addEventListener("click", () => remove(item.lineId));
        return fragment;
    }

    function renderFreeShippingProgress(subtotalValue) {
        const bar = document.getElementById("free-shipping-progress-value");
        const message = document.getElementById("free-shipping-progress-message");
        const amount = document.getElementById("free-shipping-progress-amount");
        if (!bar || !message) return;
        const percentage = Math.min(100, Math.max(0, (subtotalValue / FREE_SHIPPING_THRESHOLD) * 100));
        const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalValue);
        bar.style.width = `${percentage}%`;
        bar.parentElement?.setAttribute("aria-valuenow", String(Math.round(percentage)));
        if (remaining === 0) {
            message.innerHTML = '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> ¡Desbloqueaste el envío gratis dentro de la Provincia de Santiago!';
            amount.textContent = `Meta alcanzada: ${formatPrice(FREE_SHIPPING_THRESHOLD)}`;
            bar.closest(".free-shipping-progress")?.classList.add("is-complete");
        } else {
            message.innerHTML = `<i class="fa-solid fa-truck-fast" aria-hidden="true"></i> Agrega <strong>${formatPrice(remaining)}</strong> para obtener envío gratis en Santiago.`;
            amount.textContent = `${formatPrice(subtotalValue)} de ${formatPrice(FREE_SHIPPING_THRESHOLD)}`;
            bar.closest(".free-shipping-progress")?.classList.remove("is-complete");
        }
    }

    async function renderSuggestions(items = read()) {
        const container = document.getElementById("cart-suggestions");
        const section = document.getElementById("cart-suggestions-section");
        if (!container || !section || !window.Products?.loadProducts) return;
        try {
            const products = await Products.loadProducts();
            const cartIds = new Set(items.map((item) => item.productId));
            const selected = [];
            const used = new Set(cartIds);
            for (const item of items) {
                const current = products.find((product) => product.id === item.productId);
                if (!current) continue;
                for (const product of Products.getRelatedProducts(current, 6)) {
                    if (!used.has(product.id)) {
                        selected.push(product);
                        used.add(product.id);
                    }
                    if (selected.length >= 5) break;
                }
                if (selected.length >= 5) break;
            }
            if (selected.length < 5) {
                for (const product of Products.getBestSellers(8)) {
                    if (!used.has(product.id)) {
                        selected.push(product);
                        used.add(product.id);
                    }
                    if (selected.length >= 5) break;
                }
            }
            container.replaceChildren();
            selected.forEach((product) => {
                const card = Products.createProductCard(product);
                if (card) container.appendChild(card);
            });
            section.hidden = selected.length === 0;
        } catch (error) {
            console.warn("No se pudieron cargar sugerencias:", error);
            section.hidden = true;
        }
    }

    function renderCartPage() {
        if (document.body.dataset.page !== "cart") return;
        const container = document.getElementById("cart-items");
        const subtotalElement = document.getElementById("cart-subtotal");
        const shippingElement = document.getElementById("cart-shipping");
        const totalElement = document.getElementById("cart-total");
        const checkoutLink = document.getElementById("btn-open-checkout");
        const productsCount = document.getElementById("cart-products-count");
        if (!container) return;

        const items = read();
        const subtotalValue = total();
        if (productsCount) productsCount.textContent = `${count()} producto${count() === 1 ? "" : "s"}`;
        container.replaceChildren();
        renderFreeShippingProgress(subtotalValue);

        if (!items.length) {
            const message = document.createElement("div");
            message.className = "cart-empty";
            message.innerHTML = '<div><i class="fa-solid fa-basket-shopping" aria-hidden="true"></i><h2>Tu carrito está vacío</h2><p>Explora el catálogo y agrega productos para comenzar.</p><a class="btn-primary" href="catalogo.html">Ver productos</a></div>';
            container.appendChild(message);
            subtotalElement.textContent = formatPrice(0);
            shippingElement.textContent = "Por calcular";
            totalElement.textContent = formatPrice(0);
            checkoutLink?.classList.add("is-disabled");
            checkoutLink?.setAttribute("aria-disabled", "true");
            renderSuggestions([]);
            return;
        }

        const fragment = document.createDocumentFragment();
        items.forEach((item) => {
            const row = createCartItem(item);
            if (row) fragment.appendChild(row);
        });
        container.appendChild(fragment);
        subtotalElement.textContent = formatPrice(subtotalValue);
        shippingElement.textContent = subtotalValue >= FREE_SHIPPING_THRESHOLD ? "Gratis en Santiago" : `Gratis desde ${formatPrice(FREE_SHIPPING_THRESHOLD)}`;
        totalElement.textContent = formatPrice(subtotalValue);
        checkoutLink?.classList.remove("is-disabled");
        checkoutLink?.removeAttribute("aria-disabled");
        renderSuggestions(items);
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
        normalizeDelivery,
        customizationDescription,
        getDisplayImage,
        formatPrice,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        renderCartPage
    });

    document.addEventListener("DOMContentLoaded", () => {
        updateCount();
        renderCartPage();
    });
})();
