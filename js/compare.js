"use strict";

(function () {
    const STORAGE_KEY = "mommyCraftsCompare";
    const MAX_ITEMS = 3;
    const state = {
        products: null,
        productsPromise: null,
        quickView: {
            product: null,
            variant: null,
            size: ""
        }
    };

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function showMessage(message) {
        if (window.Products?.showToast) {
            window.Products.showToast(message);
            return;
        }
        console.log(message);
    }

    function readIds() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(parsed)
                ? parsed.map((item) => String(item || "").trim()).filter(Boolean)
                : [];
        } catch (error) {
            console.warn("No se pudo leer la comparación:", error);
            return [];
        }
    }

    function writeIds(ids) {
        const normalized = [...new Set(ids.map((item) => String(item || "").trim()).filter(Boolean))].slice(0, MAX_ITEMS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        updateBadges();
        refreshCompareButtons();
        window.dispatchEvent(new CustomEvent("compare:updated", { detail: normalized }));
        if (document.body.dataset.page === "compare") {
            renderComparePage();
        }
    }

    function contains(productId) {
        return readIds().includes(String(productId || ""));
    }

    function add(productId) {
        const id = String(productId || "");
        if (!id) return false;
        const ids = readIds();
        if (ids.includes(id)) {
            showMessage("Este producto ya está en comparación.");
            return true;
        }
        if (ids.length >= MAX_ITEMS) {
            showMessage("Puedes comparar hasta 3 productos a la vez.");
            return false;
        }
        ids.push(id);
        writeIds(ids);
        showMessage("Producto agregado a comparación.");
        return true;
    }

    function remove(productId) {
        writeIds(readIds().filter((id) => id !== String(productId || "")));
    }

    function toggle(productId) {
        const id = String(productId || "");
        if (!id) return false;
        if (contains(id)) {
            remove(id);
            showMessage("Producto quitado de comparación.");
            return false;
        }
        return add(id);
    }

    function updateBadges() {
        const count = readIds().length;
        document.querySelectorAll("[data-compare-count]").forEach((badge) => {
            badge.textContent = String(count);
            badge.hidden = count <= 0;
        });
    }

    async function ensureProducts() {
        if (state.products) return state.products;
        if (!state.productsPromise) {
            if (window.Products?.loadProducts) {
                state.productsPromise = window.Products.loadProducts().then((products) => {
                    state.products = products || [];
                    return state.products;
                });
            } else {
                state.productsPromise = Promise.resolve([]);
            }
        }
        return state.productsPromise;
    }

    async function resolveProduct(productId) {
        const products = await ensureProducts();
        return products.find((product) => String(product.id) === String(productId || "")) || null;
    }

    function formatPrice(value) {
        if (window.Products?.formatPrice) return window.Products.formatPrice(value);
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }

    function getSelectableVariants(product) {
        return window.Products?.getSelectableVariants
            ? window.Products.getSelectableVariants(product)
            : [];
    }

    function getProductSizes(product) {
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
        return window.Products?.getVariantImages
            ? window.Products.getVariantImages(product, variant)
            : [variant?.imagen, ...(product?.imagenes || [])].filter(Boolean);
    }

    function injectHeaderActions() {
        document.querySelectorAll(".navbar-actions").forEach((actions) => {
            if (!actions.querySelector(".compare-button")) {
                const compareLink = document.createElement("a");
                compareLink.className = "icon-btn compare-button";
                compareLink.href = "comparacion.html";
                compareLink.setAttribute("aria-label", "Abrir comparación de productos");
                compareLink.innerHTML = `
                    <i class="fa-regular fa-heart" aria-hidden="true"></i>
                    <span class="badge" data-compare-count hidden>0</span>
                `;
                actions.insertBefore(compareLink, actions.querySelector(".cart-button") || actions.firstChild);
            }

            const searchShell = actions.parentElement?.querySelector?.(".search-shell");
            if (searchShell && !actions.querySelector(".search-action-btn")) {
                const searchButton = document.createElement("button");
                searchButton.type = "button";
                searchButton.className = "icon-btn search-action-btn";
                searchButton.dataset.openSearchPanel = "";
                searchButton.setAttribute("aria-label", "Abrir búsqueda");
                searchButton.setAttribute("aria-expanded", "false");
                searchButton.innerHTML = '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>';

                const wrapper = document.createElement("div");
                wrapper.className = "header-search-popover";
                wrapper.hidden = true;
                searchShell.classList.add("search-shell-popover");
                searchShell.hidden = false;
                wrapper.appendChild(searchShell);

                actions.insertBefore(wrapper, actions.firstChild);
                actions.insertBefore(searchButton, wrapper);

                searchButton.addEventListener("click", (event) => {
                    event.stopPropagation();
                    const isOpen = wrapper.classList.toggle("is-open");
                    wrapper.hidden = false;
                    searchButton.setAttribute("aria-expanded", String(isOpen));
                    if (isOpen) {
                        searchShell.querySelector("input")?.focus();
                    } else {
                        wrapper.hidden = true;
                    }
                });

                document.addEventListener("click", (event) => {
                    if (!wrapper.classList.contains("is-open")) return;
                    if (wrapper.contains(event.target) || searchButton.contains(event.target)) return;
                    wrapper.classList.remove("is-open");
                    wrapper.hidden = true;
                    searchButton.setAttribute("aria-expanded", "false");
                });
            }
        });

        updateBadges();
    }

    function enhanceProductCardTemplates() {
        document.querySelectorAll("template#product-card-template").forEach((template) => {
            const container = template.content.querySelector(".container-img");
            if (!container || container.querySelector(".product-card-actions")) return;

            const actions = document.createElement("div");
            actions.className = "product-card-actions";
            actions.innerHTML = `
                <button class="product-card-action-btn" type="button" data-compare-product aria-label="Agregar a comparación">
                    <i class="fa-regular fa-heart" aria-hidden="true"></i>
                </button>
                <button class="product-card-action-btn" type="button" data-quick-view-product aria-label="Vista rápida del producto">
                    <i class="fa-regular fa-eye" aria-hidden="true"></i>
                </button>
                <button class="product-card-action-btn" type="button" data-same-category-product aria-label="Ver más de esta categoría">
                    <i class="fa-solid fa-plus" aria-hidden="true"></i>
                </button>
            `;
            container.appendChild(actions);
        });
    }

    function buildRatingMarkup(product) {
        const sales = Number(product?.ventas || 0);
        return `
            <div class="quick-view-rating" aria-label="Reseñas del producto">
                <span class="quick-view-stars" aria-hidden="true">★★★★★</span>
                <span>${sales > 0 ? `${sales} venta${sales === 1 ? "" : "s"} registradas` : "Sin reseñas públicas aún"}</span>
            </div>
        `;
    }

    function ensureQuickViewModal() {
        if (document.getElementById("quick-view-modal")) return;

        const modal = document.createElement("div");
        modal.className = "quick-view-modal";
        modal.id = "quick-view-modal";
        modal.hidden = true;
        modal.innerHTML = `
            <div class="quick-view-backdrop" data-close-quick-view></div>
            <section class="quick-view-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-view-title">
                <button class="quick-view-close" type="button" data-close-quick-view aria-label="Cerrar vista rápida">
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
                <div class="quick-view-layout">
                    <div class="quick-view-gallery">
                        <img id="quick-view-main-image" alt="" src="" />
                        <div class="quick-view-thumbs" id="quick-view-thumbs"></div>
                    </div>
                    <div class="quick-view-copy">
                        <p class="quick-view-category" id="quick-view-category"></p>
                        <h2 id="quick-view-title"></h2>
                        <div id="quick-view-rating"></div>
                        <div class="quick-view-price" id="quick-view-price"></div>
                        <p class="quick-view-description" id="quick-view-description"></p>
                        <div class="quick-view-options" id="quick-view-colors" hidden>
                            <span class="quick-view-label">Color</span>
                            <div class="quick-view-swatches" id="quick-view-color-options"></div>
                        </div>
                        <div class="quick-view-options" id="quick-view-sizes" hidden>
                            <span class="quick-view-label">Talla</span>
                            <div class="quick-view-sizes-grid" id="quick-view-size-options"></div>
                        </div>
                        <div class="quick-view-actions-row">
                            <label class="quick-view-quantity">
                                <span>Cantidad</span>
                                <div class="quick-view-qty-controls">
                                    <button type="button" data-qty-step="-1" aria-label="Restar una unidad">−</button>
                                    <input id="quick-view-quantity" type="number" min="1" value="1" inputmode="numeric" />
                                    <button type="button" data-qty-step="1" aria-label="Agregar una unidad">+</button>
                                </div>
                            </label>
                            <button class="btn-primary quick-view-add-cart" id="quick-view-add-cart" type="button">
                                <i class="fa-solid fa-cart-plus" aria-hidden="true"></i>
                                Agregar al carrito
                            </button>
                        </div>
                        <div class="quick-view-footer-links">
                            <button class="btn-ghost" type="button" id="quick-view-compare-toggle">
                                <i class="fa-regular fa-heart" aria-hidden="true"></i>
                                Comparar producto
                            </button>
                            <a class="btn-ghost" id="quick-view-see-more" href="#">
                                <i class="fa-solid fa-up-right-from-square" aria-hidden="true"></i>
                                Ver ficha completa
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        `;

        document.body.appendChild(modal);

        modal.addEventListener("click", (event) => {
            if (event.target.closest("[data-close-quick-view]")) {
                closeQuickView();
            }
        });

        modal.querySelectorAll("[data-qty-step]").forEach((button) => {
            button.addEventListener("click", () => {
                const input = document.getElementById("quick-view-quantity");
                const step = Number(button.dataset.qtyStep || 0);
                const current = Math.max(1, Number(input.value) || 1);
                input.value = String(Math.max(1, current + step));
            });
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !modal.hidden) {
                closeQuickView();
            }
        });

        document.getElementById("quick-view-add-cart")?.addEventListener("click", handleQuickViewAddToCart);
        document.getElementById("quick-view-compare-toggle")?.addEventListener("click", () => {
            if (!state.quickView.product) return;
            toggle(state.quickView.product.id);
            syncQuickViewCompareButton();
        });
    }

    function closeQuickView() {
        const modal = document.getElementById("quick-view-modal");
        if (!modal) return;
        modal.hidden = true;
        document.body.classList.remove("quick-view-open");
    }

    function syncQuickViewCompareButton() {
        const button = document.getElementById("quick-view-compare-toggle");
        if (!button || !state.quickView.product) return;
        const active = contains(state.quickView.product.id);
        button.classList.toggle("is-active", active);
        button.innerHTML = `
            <i class="fa-${active ? "solid" : "regular"} fa-heart" aria-hidden="true"></i>
            ${active ? "Quitar de comparación" : "Comparar producto"}
        `;
    }

    function renderQuickView(product) {
        ensureQuickViewModal();
        const modal = document.getElementById("quick-view-modal");
        const selectableVariants = getSelectableVariants(product);
        const sizes = getProductSizes(product);
        const initialVariant = selectableVariants[0] || product.variantes?.[0] || null;

        state.quickView.product = product;
        state.quickView.variant = initialVariant;
        state.quickView.size = "";

        document.getElementById("quick-view-category").textContent = product.categoria || "Producto";
        document.getElementById("quick-view-title").textContent = product.nombre;
        document.getElementById("quick-view-rating").innerHTML = buildRatingMarkup(product);
        document.getElementById("quick-view-description").textContent = product.descripcion || "Sin descripción disponible.";
        document.getElementById("quick-view-see-more").href = `producto.html?id=${encodeURIComponent(product.id)}`;

        const colorSection = document.getElementById("quick-view-colors");
        const colorOptions = document.getElementById("quick-view-color-options");
        colorOptions.innerHTML = "";

        const sizeSection = document.getElementById("quick-view-sizes");
        const sizeOptions = document.getElementById("quick-view-size-options");
        sizeOptions.innerHTML = "";

        function renderPriceAndGallery() {
            const variant = state.quickView.variant;
            const mainImage = document.getElementById("quick-view-main-image");
            const thumbs = document.getElementById("quick-view-thumbs");
            const priceBox = document.getElementById("quick-view-price");
            const currentPrice = getVariantPrice(product, variant);
            const originalPrice = Number(variant?.precioOriginal ?? product.precioOriginal ?? 0) || 0;
            priceBox.innerHTML = `
                <strong>${formatPrice(currentPrice)}</strong>
                ${originalPrice > currentPrice ? `<span>${formatPrice(originalPrice)}</span>` : ""}
            `;

            const images = getVariantImages(product, variant).filter(Boolean);
            const main = images[0] || product.imagenPrincipal || CONFIG.placeholderImage;
            mainImage.src = main;
            mainImage.alt = product.nombre;
            thumbs.innerHTML = "";
            images.slice(0, 5).forEach((url, index) => {
                const thumb = document.createElement("button");
                thumb.type = "button";
                thumb.className = `quick-view-thumb ${index === 0 ? "is-active" : ""}`;
                thumb.innerHTML = `<img src="${escapeHtml(url)}" alt="" />`;
                thumb.addEventListener("click", () => {
                    mainImage.src = url;
                    thumbs.querySelectorAll(".quick-view-thumb").forEach((item) => item.classList.remove("is-active"));
                    thumb.classList.add("is-active");
                });
                thumbs.appendChild(thumb);
            });
        }

        if (selectableVariants.length) {
            colorSection.hidden = false;
            selectableVariants.forEach((variant) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "quick-view-swatch";
                button.title = variant.nombre;
                button.setAttribute("aria-label", `Seleccionar color ${variant.nombre}`);
                button.innerHTML = `<span style="background:${escapeHtml(variant.colorHex || '#f4d4da')}"></span>`;
                button.addEventListener("click", () => {
                    state.quickView.variant = variant;
                    colorOptions.querySelectorAll(".quick-view-swatch").forEach((item) => item.classList.remove("is-active"));
                    button.classList.add("is-active");
                    renderPriceAndGallery();
                });
                if (String(initialVariant?.id || "") === String(variant.id || "")) {
                    button.classList.add("is-active");
                }
                colorOptions.appendChild(button);
            });
        } else {
            colorSection.hidden = true;
        }

        if (sizes.length) {
            sizeSection.hidden = false;
            sizes.forEach((size) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "quick-view-size-btn";
                button.textContent = size;
                button.addEventListener("click", () => {
                    state.quickView.size = size;
                    sizeOptions.querySelectorAll(".quick-view-size-btn").forEach((item) => item.classList.remove("is-active"));
                    button.classList.add("is-active");
                });
                sizeOptions.appendChild(button);
            });
        } else {
            sizeSection.hidden = true;
        }

        document.getElementById("quick-view-quantity").value = "1";
        renderPriceAndGallery();
        syncQuickViewCompareButton();
        modal.hidden = false;
        document.body.classList.add("quick-view-open");
    }

    function handleQuickViewAddToCart() {
        const product = state.quickView.product;
        const variant = state.quickView.variant;
        const quantity = Math.max(1, Number(document.getElementById("quick-view-quantity")?.value) || 1);
        if (!product) return;

        const sizes = getProductSizes(product);
        if (sizes.length && !state.quickView.size) {
            showMessage("Selecciona una talla antes de agregar el producto.");
            return;
        }

        const customization = {};
        if (state.quickView.size) {
            customization.talla = state.quickView.size;
            customization.size = state.quickView.size;
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
            precioOriginal: Number(variant?.precioOriginal ?? product.precioOriginal ?? 0) || 0,
            imagenPrincipal: variant?.imagen || product.imagenPrincipal
        };

        const ok = window.Cart?.add(cartProduct, quantity, Object.keys(customization).length ? customization : null);
        if (ok) {
            showMessage(`${product.nombre} fue agregado al carrito.`);
            closeQuickView();
        }
    }

    async function openQuickViewById(productId) {
        const product = await resolveProduct(productId);
        if (!product) {
            showMessage("No pudimos cargar ese producto.");
            return;
        }
        renderQuickView(product);
    }

    function refreshCompareButtons() {
        document.querySelectorAll("[data-compare-product]").forEach((button) => {
            const card = button.closest(".card-product");
            const productId = card?.dataset.productId || button.dataset.productId;
            const active = contains(productId);
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-label", active ? "Quitar de comparación" : "Agregar a comparación");
            button.innerHTML = `<i class="fa-${active ? "solid" : "regular"} fa-heart" aria-hidden="true"></i>`;
        });

        document.querySelectorAll("[data-product-compare-toggle]").forEach((button) => {
            const productId = button.dataset.productCompareToggle;
            const active = contains(productId);
            button.classList.toggle("is-active", active);
            button.innerHTML = `
                <i class="fa-${active ? "solid" : "regular"} fa-heart" aria-hidden="true"></i>
                ${active ? "Quitar de comparación" : "Comparar producto"}
            `;
        });
    }

    function bindProductCardActions() {
        document.addEventListener("click", async (event) => {
            const compareButton = event.target.closest("[data-compare-product]");
            if (compareButton) {
                event.preventDefault();
                event.stopPropagation();
                const productId = compareButton.closest(".card-product")?.dataset.productId || compareButton.dataset.productId;
                toggle(productId);
                return;
            }

            const quickButton = event.target.closest("[data-quick-view-product]");
            if (quickButton) {
                event.preventDefault();
                event.stopPropagation();
                const productId = quickButton.closest(".card-product")?.dataset.productId;
                openQuickViewById(productId);
                return;
            }

            const categoryButton = event.target.closest("[data-same-category-product]");
            if (categoryButton) {
                event.preventDefault();
                event.stopPropagation();
                const productId = categoryButton.closest(".card-product")?.dataset.productId;
                const product = await resolveProduct(productId);
                if (product?.categoria) {
                    window.location.href = `catalogo.html?categoria=${encodeURIComponent(product.categoria)}`;
                }
                return;
            }

            const removeButton = event.target.closest("[data-compare-remove]");
            if (removeButton) {
                event.preventDefault();
                remove(removeButton.dataset.compareRemove);
                return;
            }
        });
    }

    async function injectProductPageCompareButton() {
        const detail = document.querySelector(".product-actions");
        const addButton = document.getElementById("btn-add-cart");
        if (!detail || !addButton || detail.querySelector("[data-product-compare-toggle]")) return;

        const params = new URLSearchParams(window.location.search);
        const productId = params.get("id");
        if (!productId) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn-secondary product-compare-toggle";
        button.dataset.productCompareToggle = productId;
        button.addEventListener("click", () => toggle(productId));
        detail.insertBefore(button, addButton.nextSibling);
        refreshCompareButtons();
    }

    async function renderComparePage() {
        const root = document.getElementById("compare-products-root");
        const meta = document.getElementById("compare-products-meta");
        if (!root) return;
        const ids = readIds();
        if (!ids.length) {
            root.innerHTML = `
                <div class="compare-empty-state">
                    <i class="fa-regular fa-heart" aria-hidden="true"></i>
                    <h2>Aún no agregas productos para comparar</h2>
                    <p>Desde las tarjetas o desde la ficha del producto puedes guardar hasta 3 artículos y verlos lado a lado.</p>
                    <a class="btn-primary" href="catalogo.html">Explorar catálogo</a>
                </div>
            `;
            if (meta) meta.textContent = "Agrega hasta 3 productos para comparar características, precio y estilo.";
            return;
        }

        const products = await ensureProducts();
        const selected = ids.map((id) => products.find((product) => String(product.id) === id)).filter(Boolean);
        root.innerHTML = selected.map((product) => {
            const sizes = getProductSizes(product);
            const colors = getSelectableVariants(product);
            return `
                <article class="compare-card">
                    <button class="compare-remove-btn" type="button" data-compare-remove="${escapeHtml(product.id)}" aria-label="Quitar ${escapeHtml(product.nombre)} de comparación">
                        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                    <a class="compare-card-image" href="producto.html?id=${encodeURIComponent(product.id)}">
                        <img src="${escapeHtml(product.imagenPrincipal || CONFIG.placeholderImage)}" alt="${escapeHtml(product.nombre)}" />
                    </a>
                    <div class="compare-card-copy">
                        <p class="compare-card-category">${escapeHtml(product.categoria || "Producto")}</p>
                        <h3>${escapeHtml(product.nombre)}</h3>
                        <div class="compare-card-price">${formatPrice(product.precio)}</div>
                        ${buildRatingMarkup(product)}
                        <p class="compare-card-description">${escapeHtml((product.descripcion || "Sin descripción disponible.").slice(0, 180))}</p>
                        <ul class="compare-card-specs">
                            <li><strong>Estado:</strong> ${product.stock > 0 ? "En stock" : "Consultar disponibilidad"}</li>
                            <li><strong>Tallas:</strong> ${sizes.length ? escapeHtml(sizes.join(", ")) : "No aplica"}</li>
                            <li><strong>Colores:</strong> ${colors.length ? escapeHtml(colors.map((variant) => variant.nombre).slice(0, 4).join(", ")) : "No aplica"}</li>
                            <li><strong>Categoría:</strong> ${escapeHtml(product.categoria || "General")}</li>
                        </ul>
                        <div class="compare-card-actions">
                            <a class="btn-primary" href="producto.html?id=${encodeURIComponent(product.id)}">Ver producto</a>
                            <button class="btn-secondary" type="button" data-quick-view-product data-product-id="${escapeHtml(product.id)}">Vista rápida</button>
                        </div>
                    </div>
                </article>
            `;
        }).join("");

        if (meta) {
            meta.textContent = `${selected.length} de ${MAX_ITEMS} productos listos para comparar.`;
        }

        root.querySelectorAll("[data-quick-view-product]").forEach((button) => {
            button.addEventListener("click", () => openQuickViewById(button.dataset.productId));
        });
    }

    function initComparePage() {
        if (document.body.dataset.page !== "compare") return;
        renderComparePage();
    }

    function init() {
        enhanceProductCardTemplates();
        injectHeaderActions();
        ensureQuickViewModal();
        bindProductCardActions();
        refreshCompareButtons();
        initComparePage();
        injectProductPageCompareButton();
        window.addEventListener("products:rendered", refreshCompareButtons);
        window.addEventListener("compare:updated", refreshCompareButtons);
        document.addEventListener("DOMContentLoaded", () => {
            injectHeaderActions();
            injectProductPageCompareButton();
            initComparePage();
        });
    }

    window.Compare = Object.freeze({
        read: readIds,
        add,
        remove,
        toggle,
        contains,
        count: () => readIds().length
    });

    init();
})();
