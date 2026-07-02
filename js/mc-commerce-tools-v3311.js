"use strict";

(function () {
    const STORAGE_KEY = "mommyCraftsCompareProducts";
    const MAX_COMPARE_ITEMS = 3;

    const state = {
        productsPromise: null,
        quickViewProduct: null,
        quickViewVariant: null,
        quickViewSize: ""
    };

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function readCompareIds() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(parsed)
                ? [...new Set(parsed.map((id) => String(id || "").trim()).filter(Boolean))].slice(0, MAX_COMPARE_ITEMS)
                : [];
        } catch (error) {
            console.warn("No se pudo leer la comparación de productos:", error);
            return [];
        }
    }

    function writeCompareIds(ids) {
        const normalized = [...new Set(ids.map((id) => String(id || "").trim()).filter(Boolean))].slice(0, MAX_COMPARE_ITEMS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        updateCompareUi();
        window.dispatchEvent(new CustomEvent("mc:compare-updated", { detail: normalized }));
    }

    function showToast(message) {
        if (window.Products?.showToast) {
            window.Products.showToast(message);
            return;
        }

        const toast = document.getElementById("toast");
        if (toast) {
            toast.textContent = message;
            toast.hidden = false;
            window.clearTimeout(showToast.timeoutId);
            showToast.timeoutId = window.setTimeout(() => {
                toast.hidden = true;
            }, 2200);
            return;
        }

        console.info(message);
    }

    function isCompared(productId) {
        return readCompareIds().includes(String(productId || ""));
    }

    function toggleCompare(productId) {
        const id = String(productId || "").trim();
        if (!id) return false;

        const ids = readCompareIds();
        const index = ids.indexOf(id);

        if (index >= 0) {
            ids.splice(index, 1);
            writeCompareIds(ids);
            showToast("Producto quitado de la comparación.");
            return false;
        }

        if (ids.length >= MAX_COMPARE_ITEMS) {
            showToast("Puedes comparar hasta 3 productos.");
            return false;
        }

        ids.push(id);
        writeCompareIds(ids);
        showToast("Producto agregado a la comparación.");
        return true;
    }

    function removeCompare(productId) {
        writeCompareIds(readCompareIds().filter((id) => id !== String(productId || "")));
    }

    async function loadProducts() {
        if (!state.productsPromise) {
            state.productsPromise = window.Products?.loadProducts
                ? window.Products.loadProducts()
                : Promise.resolve([]);
        }
        return state.productsPromise;
    }

    async function findProduct(productId) {
        const products = await loadProducts();
        return products.find((product) => String(product.id) === String(productId || "")) || null;
    }

    function formatPrice(value) {
        if (window.Products?.formatPrice) {
            return window.Products.formatPrice(value);
        }

        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }

    function getVariants(product) {
        return window.Products?.getSelectableVariants
            ? window.Products.getSelectableVariants(product)
            : [];
    }

    function getSizes(product) {
        return window.Products?.getProductSizes
            ? window.Products.getProductSizes(product)
            : Array.isArray(product?.tallas) ? product.tallas : [];
    }

    function getVariantPrice(product, variant) {
        return window.Products?.getVariantPrice
            ? window.Products.getVariantPrice(product, variant)
            : Number(variant?.precio ?? product?.precio ?? 0) || 0;
    }

    function getVariantImages(product, variant) {
        if (window.Products?.getVariantImages) {
            return window.Products.getVariantImages(product, variant).filter(Boolean);
        }

        return [variant?.imagen, ...(product?.imagenes || []), product?.imagenPrincipal].filter(Boolean);
    }

    function reviewMarkup(product) {
        const rating = Math.max(0, Math.min(5, Number(product?.valoracionPromedio || 0)));
        const count = Math.max(0, Number(product?.cantidadResenas || 0));
        const filled = Math.round(rating);
        const stars = Array.from({ length: 5 }, (_, index) => index < filled ? "★" : "☆").join("");
        const label = count > 0
            ? `${rating.toFixed(1)} · ${count} reseña${count === 1 ? "" : "s"}`
            : "Sin reseñas públicas todavía";

        return `
            <div class="mc-quick-view-review" aria-label="${escapeHtml(label)}">
                <span class="mc-quick-view-stars" aria-hidden="true">${stars}</span>
                <span>${escapeHtml(label)}</span>
            </div>
        `;
    }

    function enhanceCardTemplates() {
        document.querySelectorAll("template#product-card-template").forEach((template) => {
            const imageContainer = template.content.querySelector(".container-img");
            if (!imageContainer || imageContainer.querySelector(".mc-product-toolbox")) return;

            const toolbox = document.createElement("div");
            toolbox.className = "mc-product-toolbox";
            toolbox.setAttribute("aria-label", "Acciones rápidas del producto");
            toolbox.innerHTML = `
                <button class="mc-product-tool" type="button" data-mc-compare-card aria-label="Agregar a comparación" title="Comparar">
                    <i class="fa-regular fa-heart" aria-hidden="true"></i>
                </button>
                <button class="mc-product-tool" type="button" data-mc-quick-view aria-label="Abrir vista rápida" title="Vista rápida">
                    <i class="fa-regular fa-eye" aria-hidden="true"></i>
                </button>
                <button class="mc-product-tool" type="button" data-mc-open-category aria-label="Ver más de la misma categoría" title="Ver categoría">
                    <i class="fa-solid fa-plus" aria-hidden="true"></i>
                </button>
            `;
            imageContainer.appendChild(toolbox);
        });
    }

    function createHeaderSearch(actions, searchShell) {
        if (!actions || !searchShell || actions.querySelector("[data-mc-search-toggle]")) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "mc-header-icon";
        button.dataset.mcSearchToggle = "";
        button.setAttribute("aria-label", "Abrir búsqueda");
        button.setAttribute("aria-expanded", "false");
        button.innerHTML = '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>';

        const panel = document.createElement("div");
        panel.className = "mc-header-search-panel";
        panel.hidden = true;
        panel.appendChild(searchShell);

        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const opening = panel.hidden;
            panel.hidden = !opening;
            button.classList.toggle("is-active", opening);
            button.setAttribute("aria-expanded", String(opening));
            if (opening) {
                searchShell.querySelector("input")?.focus();
            }
        });

        document.addEventListener("click", (event) => {
            if (panel.hidden) return;
            if (panel.contains(event.target) || button.contains(event.target)) return;
            panel.hidden = true;
            button.classList.remove("is-active");
            button.setAttribute("aria-expanded", "false");
        });

        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape" || panel.hidden) return;
            panel.hidden = true;
            button.classList.remove("is-active");
            button.setAttribute("aria-expanded", "false");
            button.focus();
        });

        actions.prepend(panel);
        actions.prepend(button);
    }

    function createHeaderCompare(actions) {
        if (!actions || actions.querySelector(".mc-header-compare")) return;

        const link = document.createElement("a");
        link.className = "mc-header-icon mc-header-compare";
        link.href = "comparacion.html";
        link.setAttribute("aria-label", "Abrir comparación de productos");
        link.title = "Comparar productos";
        link.innerHTML = `
            <i class="fa-regular fa-heart" aria-hidden="true"></i>
            <span class="mc-compare-count" data-mc-compare-count hidden>0</span>
        `;

        const cart = actions.querySelector(".cart-button");
        actions.insertBefore(link, cart || null);
    }

    function orderHeaderActions(actions) {
        if (!actions) return;
        const desired = [
            actions.querySelector("[data-mc-search-toggle]"),
            actions.querySelector(".customer-account-menu"),
            actions.querySelector(".mc-header-compare"),
            actions.querySelector(".cart-button"),
            actions.querySelector(".mc-header-search-panel")
        ].filter(Boolean);

        const current = Array.from(actions.children).filter((element) => desired.includes(element));
        const alreadyOrdered = desired.length === current.length && desired.every((element, index) => current[index] === element);
        if (alreadyOrdered) return;

        desired.forEach((element) => actions.appendChild(element));
    }

    function moveHeaderActionsToHero(siteHeader, actions) {
        const hero = siteHeader?.querySelector(".container-hero .hero");
        const support = hero?.querySelector(":scope > .customer-support, .mc-header-right-group > .customer-support");
        if (!hero || !actions) return;

        let group = hero.querySelector(":scope > .mc-header-right-group");
        if (!group) {
            group = document.createElement("div");
            group.className = "mc-header-right-group";
            group.setAttribute("data-mc-header-right-group", "");
            hero.appendChild(group);
        }

        if (support && support.parentElement !== group) {
            group.appendChild(support);
        }

        if (actions.parentElement !== group) {
            group.appendChild(actions);
        }
    }

    function setupHeader() {
        document.querySelectorAll(".site-header").forEach((siteHeader) => {
            const actions = siteHeader.querySelector(".navbar-actions");
            if (!actions) return;

            const navbar = siteHeader.querySelector(".navbar");
            const searchShell = navbar?.querySelector(":scope > .search-shell") || null;

            actions.classList.add("mc-header-actions");
            navbar?.classList.add("mc-header-ready");
            createHeaderSearch(actions, searchShell);
            createHeaderCompare(actions);
            orderHeaderActions(actions);
            moveHeaderActionsToHero(siteHeader, actions);
        });

        updateCompareUi();
    }

    function ensureQuickViewModal() {
        if (document.getElementById("mc-quick-view")) return;

        const modal = document.createElement("div");
        modal.className = "mc-quick-view";
        modal.id = "mc-quick-view";
        modal.hidden = true;
        modal.innerHTML = `
            <div class="mc-quick-view-backdrop" data-mc-close-quick-view></div>
            <section class="mc-quick-view-dialog" role="dialog" aria-modal="true" aria-labelledby="mc-quick-view-title">
                <button class="mc-quick-view-close" type="button" data-mc-close-quick-view aria-label="Cerrar vista rápida">
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
                <div class="mc-quick-view-grid">
                    <div>
                        <img class="mc-quick-view-main-image" id="mc-quick-view-main-image" src="" alt="" />
                        <div class="mc-quick-view-thumbnails" id="mc-quick-view-thumbnails"></div>
                    </div>
                    <div>
                        <p class="mc-quick-view-category" id="mc-quick-view-category"></p>
                        <h2 class="mc-quick-view-title" id="mc-quick-view-title"></h2>
                        <div id="mc-quick-view-review"></div>
                        <div class="mc-quick-view-price" id="mc-quick-view-price"></div>
                        <p class="mc-quick-view-description" id="mc-quick-view-description"></p>

                        <div class="mc-quick-view-option" id="mc-quick-view-colors" hidden>
                            <strong>Color</strong>
                            <div class="mc-quick-view-choices" id="mc-quick-view-color-options"></div>
                        </div>

                        <div class="mc-quick-view-option" id="mc-quick-view-sizes" hidden>
                            <strong>Talla</strong>
                            <div class="mc-quick-view-choices" id="mc-quick-view-size-options"></div>
                        </div>

                        <div class="mc-quick-view-buy-row">
                            <label class="mc-quick-view-quantity">
                                Cantidad
                                <span class="mc-quick-view-quantity-control">
                                    <button type="button" data-mc-quantity-step="-1" aria-label="Disminuir cantidad">−</button>
                                    <input id="mc-quick-view-quantity" type="number" min="1" value="1" inputmode="numeric" />
                                    <button type="button" data-mc-quantity-step="1" aria-label="Aumentar cantidad">+</button>
                                </span>
                            </label>
                            <button class="btn-primary" id="mc-quick-view-add-cart" type="button">
                                <i class="fa-solid fa-cart-plus" aria-hidden="true"></i>
                                Agregar al carrito
                            </button>
                        </div>

                        <div class="mc-quick-view-secondary-actions">
                            <button class="mc-quick-view-compare" id="mc-quick-view-compare" type="button"></button>
                            <a class="mc-quick-view-link" id="mc-quick-view-full-link" href="#">
                                <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                                Ver producto completo
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        `;

        document.body.appendChild(modal);

        modal.addEventListener("click", (event) => {
            if (event.target.closest("[data-mc-close-quick-view]")) {
                closeQuickView();
            }
        });

        modal.querySelectorAll("[data-mc-quantity-step]").forEach((button) => {
            button.addEventListener("click", () => {
                const input = document.getElementById("mc-quick-view-quantity");
                const next = Math.max(1, (Number(input.value) || 1) + Number(button.dataset.mcQuantityStep || 0));
                input.value = String(next);
            });
        });

        document.getElementById("mc-quick-view-add-cart")?.addEventListener("click", addQuickViewToCart);
        document.getElementById("mc-quick-view-compare")?.addEventListener("click", () => {
            if (!state.quickViewProduct) return;
            toggleCompare(state.quickViewProduct.id);
            syncQuickViewCompareButton();
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !modal.hidden) {
                closeQuickView();
            }
        });
    }

    function closeQuickView() {
        const modal = document.getElementById("mc-quick-view");
        if (!modal) return;
        modal.hidden = true;
        document.body.classList.remove("mc-quick-view-open");
    }

    function syncQuickViewCompareButton() {
        const button = document.getElementById("mc-quick-view-compare");
        const product = state.quickViewProduct;
        if (!button || !product) return;

        const active = isCompared(product.id);
        button.classList.toggle("is-active", active);
        button.innerHTML = `
            <i class="fa-${active ? "solid" : "regular"} fa-heart" aria-hidden="true"></i>
            ${active ? "Quitar de comparación" : "Agregar a comparación"}
        `;
    }

    function renderQuickViewMedia(product, variant) {
        const mainImage = document.getElementById("mc-quick-view-main-image");
        const thumbnails = document.getElementById("mc-quick-view-thumbnails");
        const images = [...new Set(getVariantImages(product, variant))];
        const safeImages = images.length ? images : [product.imagenPrincipal || CONFIG.placeholderImage];

        mainImage.src = safeImages[0];
        mainImage.alt = product.nombre;
        thumbnails.innerHTML = "";

        safeImages.slice(0, 6).forEach((url, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `mc-quick-view-thumb${index === 0 ? " is-active" : ""}`;
            button.setAttribute("aria-label", `Ver imagen ${index + 1} de ${product.nombre}`);
            button.innerHTML = `<img src="${escapeHtml(url)}" alt="" />`;
            button.addEventListener("click", () => {
                mainImage.src = url;
                thumbnails.querySelectorAll(".mc-quick-view-thumb").forEach((item) => item.classList.remove("is-active"));
                button.classList.add("is-active");
            });
            thumbnails.appendChild(button);
        });
    }

    function renderQuickViewPrice(product, variant) {
        const current = getVariantPrice(product, variant);
        const original = Number(variant?.precioOriginal ?? product.precioOriginal ?? 0) || 0;
        document.getElementById("mc-quick-view-price").innerHTML = `
            <strong>${formatPrice(current)}</strong>
            ${original > current ? `<del>${formatPrice(original)}</del>` : ""}
        `;
    }

    function openQuickView(product) {
        ensureQuickViewModal();

        const variants = getVariants(product);
        const sizes = getSizes(product);
        state.quickViewProduct = product;
        state.quickViewVariant = variants[0] || product.variantes?.[0] || null;
        state.quickViewSize = "";

        document.getElementById("mc-quick-view-category").textContent = product.categoria || "Producto";
        document.getElementById("mc-quick-view-title").textContent = product.nombre;
        document.getElementById("mc-quick-view-review").innerHTML = reviewMarkup(product);
        document.getElementById("mc-quick-view-description").textContent = product.descripcion || "Sin descripción disponible.";
        document.getElementById("mc-quick-view-full-link").href = window.ProductLinks.detail(product);
        document.getElementById("mc-quick-view-quantity").value = "1";

        const colorSection = document.getElementById("mc-quick-view-colors");
        const colorOptions = document.getElementById("mc-quick-view-color-options");
        colorOptions.innerHTML = "";
        colorSection.hidden = variants.length === 0;

        variants.forEach((variant, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `mc-quick-view-color${index === 0 ? " is-active" : ""}`;
            button.title = variant.nombre;
            button.setAttribute("aria-label", `Seleccionar color ${variant.nombre}`);
            const swatch = variant.colorHex || "#f4d9e8";
            button.innerHTML = `<span style="background:${escapeHtml(swatch)}"></span>`;
            button.addEventListener("click", () => {
                state.quickViewVariant = variant;
                colorOptions.querySelectorAll(".mc-quick-view-color").forEach((item) => item.classList.remove("is-active"));
                button.classList.add("is-active");
                renderQuickViewMedia(product, variant);
                renderQuickViewPrice(product, variant);
            });
            colorOptions.appendChild(button);
        });

        const sizeSection = document.getElementById("mc-quick-view-sizes");
        const sizeOptions = document.getElementById("mc-quick-view-size-options");
        sizeOptions.innerHTML = "";
        sizeSection.hidden = sizes.length === 0;

        sizes.forEach((size) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "mc-quick-view-size";
            button.textContent = size;
            button.addEventListener("click", () => {
                state.quickViewSize = size;
                sizeOptions.querySelectorAll(".mc-quick-view-size").forEach((item) => item.classList.remove("is-active"));
                button.classList.add("is-active");
            });
            sizeOptions.appendChild(button);
        });

        renderQuickViewMedia(product, state.quickViewVariant);
        renderQuickViewPrice(product, state.quickViewVariant);
        syncQuickViewCompareButton();

        const modal = document.getElementById("mc-quick-view");
        modal.hidden = false;
        document.body.classList.add("mc-quick-view-open");
        modal.querySelector(".mc-quick-view-close")?.focus();
    }

    async function openQuickViewById(productId) {
        const product = await findProduct(productId);
        if (!product) {
            showToast("No pudimos cargar ese producto.");
            return;
        }
        openQuickView(product);
    }

    function addQuickViewToCart() {
        const product = state.quickViewProduct;
        if (!product) return;

        const sizes = getSizes(product);
        if (sizes.length && !state.quickViewSize) {
            showToast("Selecciona una talla antes de agregar el producto.");
            return;
        }

        const quantity = Math.max(1, Number(document.getElementById("mc-quick-view-quantity")?.value) || 1);
        const variant = state.quickViewVariant;
        const customization = {};

        if (state.quickViewSize) {
            customization.talla = state.quickViewSize;
            customization.size = state.quickViewSize;
        }

        if (variant?.selectable) {
            customization.productVariant = variant.nombre;
            customization.variantId = variant.id;
            customization.colorHex = variant.colorHex;
            customization.sku = variant.sku;
        }

        const cartProduct = {
            ...product,
            precio: getVariantPrice(product, variant),
            imagenPrincipal: variant?.imagen || product.imagenPrincipal
        };

        const added = window.Cart?.add(
            cartProduct,
            quantity,
            Object.keys(customization).length ? customization : null
        );

        if (added !== false) {
            showToast(`${product.nombre} fue agregado al carrito.`);
            closeQuickView();
        }
    }

    function updateCompareUi() {
        const ids = readCompareIds();

        document.querySelectorAll("[data-mc-compare-count]").forEach((badge) => {
            badge.textContent = String(ids.length);
            badge.hidden = ids.length === 0;
        });

        document.querySelectorAll("[data-mc-compare-card]").forEach((button) => {
            const productId = button.closest(".card-product")?.dataset.productId;
            const active = ids.includes(String(productId || ""));
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-label", active ? "Quitar de comparación" : "Agregar a comparación");
            button.innerHTML = `<i class="fa-${active ? "solid" : "regular"} fa-heart" aria-hidden="true"></i>`;
        });

        document.querySelectorAll("[data-mc-detail-compare]").forEach((button) => {
            const active = ids.includes(String(button.dataset.mcDetailCompare || ""));
            button.classList.toggle("is-active", active);
            button.innerHTML = `
                <i class="fa-${active ? "solid" : "regular"} fa-heart" aria-hidden="true"></i>
                ${active ? "Quitar de comparación" : "Agregar a comparación"}
            `;
        });

        syncQuickViewCompareButton();
    }

    function setupProductDetailCompare() {
        const actions = document.querySelector(".product-actions");
        if (!actions || actions.querySelector("[data-mc-detail-compare]")) return;

        const productId = new URLSearchParams(window.location.search).get("id");
        if (!productId) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn-secondary mc-detail-compare-button";
        button.dataset.mcDetailCompare = productId;
        button.addEventListener("click", () => toggleCompare(productId));
        actions.appendChild(button);
        updateCompareUi();
    }

    function bindDelegatedActions() {
        document.addEventListener("click", async (event) => {
            const compareButton = event.target.closest("[data-mc-compare-card]");
            if (compareButton) {
                event.preventDefault();
                event.stopPropagation();
                const productId = compareButton.closest(".card-product")?.dataset.productId;
                toggleCompare(productId);
                return;
            }

            const quickViewButton = event.target.closest("[data-mc-quick-view]");
            if (quickViewButton) {
                event.preventDefault();
                event.stopPropagation();
                const productId = quickViewButton.closest(".card-product")?.dataset.productId;
                await openQuickViewById(productId);
                return;
            }

            const categoryButton = event.target.closest("[data-mc-open-category]");
            if (categoryButton) {
                event.preventDefault();
                event.stopPropagation();
                const productId = categoryButton.closest(".card-product")?.dataset.productId;
                const product = await findProduct(productId);
                if (product?.categoria) {
                    window.location.href = `catalogo.html?categoria=${encodeURIComponent(product.categoria)}`;
                }
                return;
            }

            const removeButton = event.target.closest("[data-mc-compare-remove]");
            if (removeButton) {
                removeCompare(removeButton.dataset.mcCompareRemove);
                renderComparePage();
            }
        });
    }

    async function renderComparePage() {
        const container = document.getElementById("mc-compare-products");
        const summary = document.getElementById("mc-compare-summary");
        if (!container) return;

        const ids = readCompareIds();
        if (summary) {
            summary.textContent = `${ids.length} de ${MAX_COMPARE_ITEMS} productos agregados.`;
        }

        if (!ids.length) {
            container.innerHTML = `
                <div class="mc-compare-empty">
                    <i class="fa-regular fa-heart" aria-hidden="true"></i>
                    <h2>No hay productos en comparación</h2>
                    <p>Agrega productos desde las tarjetas del catálogo o desde la ficha individual. Puedes comparar hasta 3.</p>
                    <a class="btn-primary" href="catalogo.html">Ver catálogo</a>
                </div>
            `;
            return;
        }

        const products = await loadProducts();
        const selected = ids.map((id) => products.find((product) => String(product.id) === id)).filter(Boolean);

        container.innerHTML = selected.map((product) => {
            const sizes = getSizes(product);
            const variants = getVariants(product);
            return `
                <article class="mc-compare-card">
                    <button class="mc-compare-remove" type="button" data-mc-compare-remove="${escapeHtml(product.id)}" aria-label="Quitar ${escapeHtml(product.nombre)}">
                        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                    <a href="${window.ProductLinks.detail(product)}">
                        <img class="mc-compare-image" src="${escapeHtml(product.imagenPrincipal || CONFIG.placeholderImage)}" alt="${escapeHtml(product.nombre)}" />
                    </a>
                    <p class="mc-compare-category">${escapeHtml(product.categoria || "Producto")}</p>
                    <h2>${escapeHtml(product.nombre)}</h2>
                    <div class="mc-compare-card-price">${formatPrice(product.precio)}</div>
                    ${reviewMarkup(product)}
                    <ul class="mc-compare-specs">
                        <li><strong>Colores:</strong> ${variants.length ? escapeHtml(variants.map((variant) => variant.nombre).slice(0, 5).join(", ")) : "No aplica"}</li>
                        <li><strong>Tallas:</strong> ${sizes.length ? escapeHtml(sizes.join(", ")) : "No aplica"}</li>
                        <li><strong>Categoría:</strong> ${escapeHtml(product.categoria || "General")}</li>
                    </ul>
                    <div class="mc-compare-card-actions">
                        <button class="btn-secondary" type="button" data-mc-compare-quick-view="${escapeHtml(product.id)}">
                            <i class="fa-regular fa-eye" aria-hidden="true"></i>
                            Vista rápida
                        </button>
                        <a class="btn-primary" href="${window.ProductLinks.detail(product)}">Ver producto</a>
                    </div>
                </article>
            `;
        }).join("");

        container.querySelectorAll("[data-mc-compare-quick-view]").forEach((button) => {
            button.addEventListener("click", () => openQuickViewById(button.dataset.mcCompareQuickView));
        });
    }

    function observeDynamicElements() {
        const observer = new MutationObserver((records) => {
            let headerChanged = false;
            let cardsChanged = false;
            let detailChanged = false;

            records.forEach((record) => {
                record.addedNodes.forEach((node) => {
                    if (!(node instanceof Element)) return;

                    if (node.matches(".customer-account-menu, .navbar-actions") || node.querySelector(".customer-account-menu, .navbar-actions")) {
                        headerChanged = true;
                    }

                    if (node.matches(".card-product") || node.querySelector(".card-product")) {
                        cardsChanged = true;
                    }

                    if (node.matches(".product-actions") || node.querySelector(".product-actions")) {
                        detailChanged = true;
                    }
                });
            });

            if (headerChanged) setupHeader();
            if (detailChanged) setupProductDetailCompare();
            if (cardsChanged || headerChanged || detailChanged) updateCompareUi();
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    function init() {
        enhanceCardTemplates();
        ensureQuickViewModal();
        bindDelegatedActions();
        setupHeader();
        setupProductDetailCompare();
        updateCompareUi();
        renderComparePage();
        observeDynamicElements();

        window.addEventListener("products:loaded", () => {
            updateCompareUi();
            renderComparePage();
        });
    }

    window.MommyCraftsCompare = Object.freeze({
        read: readCompareIds,
        toggle: toggleCompare,
        remove: removeCompare,
        contains: isCompared,
        maxItems: MAX_COMPARE_ITEMS
    });

    init();
})();
