"use strict";

(function () {
    const TOTAL_STEPS = 6;

    const ICONS = Object.freeze({
        "Librería": "fa-solid fa-book-open",
        "Tazas": "fa-solid fa-mug-hot",
        "Vasos": "fa-solid fa-glass-water",
        "Botellas": "fa-solid fa-bottle-water",
        "Vestuario": "fa-solid fa-shirt",
        "Accesorios": "fa-solid fa-bag-shopping",
        "Otros": "fa-solid fa-box-open"
    });

    const state = {
        step: 1,
        products: [],
        category: "",
        product: null,
        variant: null,
        style: "",
        imageName: "",
        activeText: "main",
        image: { x: 0, y: 0, scale: 1, rotation: 0 },
        main: { x: 0, y: 0, scale: 1, rotation: 0 },
        secondary: { x: 0, y: 0, scale: 1, rotation: 0 }
    };

    const $ = (selector) => document.querySelector(selector);

    const els = () => ({
        overlay: $("#modal-personalizar"),
        close: $("#modal-close"),
        next: $("#btn-next"),
        previous: $("#btn-prev"),
        edit: $("#btn-editar"),
        send: $("#btn-enviar"),
        body: $(".modal-body"),
        footer: $("#modal-footer"),
        summary: $("#modal-summary"),
        summaryList: $("#summary-list"),
        categories: $("#customization-category-grid"),
        products: $("#customizable-products-grid"),
        categoryTitle: $("#selected-customization-category"),
        basePrice: $("#customization-base-price"),
        colors: $("#color-selection-area"),
        productImage: $("#preview-product-image"),
        userImage: $("#preview-user-image"),
        mainText: $("#preview-main-text"),
        secondaryText: $("#preview-secondary-text"),
        file: $("#file-input"),
        upload: $("#upload-area"),
        imageControls: $("#image-editor-controls"),
        textControls: $("#text-editor-controls"),
        runningTotal: $("#customization-running-total"),
        breakdown: $("#customization-price-breakdown"),
        finalTotal: $("#customization-final-total")
    });

    const normalize = (value) => window.Products.normalizeText(value);
    const money = (value) => window.Products.formatPrice(Number(value) || 0);

    function categoryProducts(category) {
        return state.products.filter((product) =>
            window.Products.matchesCategory(product, category)
        );
    }

    function categoryBase(category) {
        return Number(
            CONFIG.CUSTOMIZATION_PRICING?.categoryBase?.[category]
        ) || 0;
    }

    function productOverride(product) {
        const name = normalize(product?.nombre);
        const overrides =
            CONFIG.CUSTOMIZATION_PRICING?.productBaseOverrides || {};

        for (const [key, value] of Object.entries(overrides)) {
            if (name.includes(normalize(key))) {
                return Number(value) || 0;
            }
        }

        return 0;
    }

    function pricing() {
        const custom = state.product?.personalizationPricing || {};
        const extras = CONFIG.CUSTOMIZATION_PRICING?.extras || {};

        return {
            base:
                Number(custom.base) ||
                productOverride(state.product) ||
                categoryBase(state.category) ||
                Number(state.product?.precio) ||
                0,
            image:
                Number(custom.image) ||
                Number(extras.image) ||
                0,
            mainText:
                Number(custom.mainText) ||
                Number(extras.mainText) ||
                0,
            secondaryText:
                Number(custom.secondaryText) ||
                Number(extras.secondaryText) ||
                0
        };
    }

    function priceSummary() {
        const costs = pricing();
        const lines = [];

        if (state.product) {
            lines.push({
                label: `Precio base · ${state.category}`,
                value: costs.base
            });
        }

        if (state.imageName) {
            lines.push({
                label: "Agregar una imagen",
                value: costs.image
            });
        }

        if ($("#texto-principal")?.value.trim()) {
            lines.push({
                label: "Texto principal",
                value: costs.mainText
            });
        }

        if ($("#texto-secundario")?.value.trim()) {
            lines.push({
                label: "Texto secundario",
                value: costs.secondaryText
            });
        }

        return {
            costs,
            lines,
            total: lines.reduce(
                (sum, line) => sum + line.value,
                0
            )
        };
    }

    function updatePrice() {
        const current = els();
        const result = priceSummary();

        if (current.basePrice) {
            current.basePrice.textContent = money(
                state.product
                    ? result.costs.base
                    : categoryBase(state.category)
            );
        }

        if (current.runningTotal) {
            current.runningTotal.textContent = money(result.total);
        }
    }

    function renderBreakdown() {
        const current = els();
        const result = priceSummary();

        if (!current.breakdown) return;

        current.breakdown.innerHTML = "";

        result.lines.forEach((line) => {
            const row = document.createElement("div");
            const term = document.createElement("dt");
            const value = document.createElement("dd");

            term.textContent = line.label;
            value.textContent = money(line.value);

            row.append(term, value);
            current.breakdown.appendChild(row);
        });

        if (current.finalTotal) {
            current.finalTotal.textContent = money(result.total);
        }
    }

    function applyImage() {
        const image = els().userImage;
        if (!image) return;

        const transform = state.image;

        image.style.transform = `
            translate(
                calc(-50% + ${transform.x}px),
                calc(-50% + ${transform.y}px)
            )
            scale(${transform.scale})
            rotate(${transform.rotation}deg)
        `;
    }

    function textState(type) {
        return type === "main"
            ? state.main
            : state.secondary;
    }

    function textElement(type) {
        return type === "main"
            ? els().mainText
            : els().secondaryText;
    }

    function applyText(type) {
        const element = textElement(type);
        const transform = textState(type);

        if (!element) return;

        element.style.transform = `
            translate(
                calc(-50% + ${transform.x}px),
                ${transform.y}px
            )
            scale(${transform.scale})
            rotate(${transform.rotation}deg)
        `;
    }

    function resetTransforms() {
        Object.assign(state.image, {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0
        });

        Object.assign(state.main, {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0
        });

        Object.assign(state.secondary, {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0
        });

        applyImage();
        applyText("main");
        applyText("secondary");
    }

    function counters() {
        [
            ["texto-principal", "count-principal", 60],
            ["texto-secundario", "count-secundario", 80],
            ["instrucciones", "count-instrucciones", 300]
        ].forEach(([inputId, counterId, max]) => {
            const input = document.getElementById(inputId);
            const output = document.getElementById(counterId);

            if (input && output) {
                output.textContent = `${input.value.length} / ${max}`;
            }
        });
    }

    function stepUI() {
        document
            .querySelectorAll(".modal-step-content")
            .forEach((content) => {
                content.classList.toggle(
                    "active",
                    Number(content.dataset.stepContent) === state.step
                );
            });

        document
            .querySelectorAll(".modal-steps .step")
            .forEach((stepElement) => {
                const number = Number(stepElement.dataset.step);

                stepElement.classList.toggle(
                    "active",
                    number === state.step
                );

                stepElement.classList.toggle(
                    "done",
                    number < state.step
                );
            });

        const current = els();

        if (current.previous) {
            current.previous.disabled = state.step === 1;
        }

        if (current.next) {
            current.next.textContent =
                state.step === TOTAL_STEPS
                    ? "Ver resumen"
                    : "Siguiente";
        }
    }

    function reset() {
        const current = els();

        Object.assign(state, {
            step: 1,
            products: [],
            category: "",
            product: null,
            variant: null,
            style: "",
            imageName: "",
            activeText: "main"
        });

        document
            .querySelectorAll('input[name="estilo"]')
            .forEach((input) => {
                input.checked = false;
            });

        [
            "texto-principal",
            "texto-secundario",
            "instrucciones"
        ].forEach((id) => {
            const field = document.getElementById(id);
            if (field) field.value = "";
        });

        if (current.file) current.file.value = "";

        if (current.userImage) {
            current.userImage.src = "";
            current.userImage.hidden = true;
        }

        if (current.productImage) {
            current.productImage.src = CONFIG.placeholderImage;
            current.productImage.alt = "Selecciona un producto";
        }

        if (current.upload) current.upload.hidden = false;
        if (current.imageControls) current.imageControls.hidden = true;
        if (current.textControls) current.textControls.hidden = true;

        if (current.mainText) {
            current.mainText.textContent = "Tu texto aquí";
            current.mainText.hidden = true;
            current.mainText.style.color = "";
        }

        if (current.secondaryText) {
            current.secondaryText.textContent = "";
            current.secondaryText.hidden = true;
            current.secondaryText.style.color = "";
        }

        if (current.body) current.body.hidden = false;
        if (current.footer) current.footer.hidden = false;
        if (current.summary) current.summary.hidden = true;

        if (current.categories) {
            current.categories.innerHTML = `
                <p class="loading-products">
                    Cargando tipos de producto...
                </p>
            `;
        }

        if (current.products) {
            current.products.innerHTML = `
                <p class="loading-products">
                    Selecciona primero un tipo de producto.
                </p>
            `;
        }

        if (current.categoryTitle) {
            current.categoryTitle.textContent = "Selecciona un tipo";
        }

        if (current.basePrice) {
            current.basePrice.textContent = money(0);
        }

        if (current.colors) {
            current.colors.innerHTML =
                "<p>Primero selecciona un producto.</p>";
        }

        resetTransforms();
        counters();
        stepUI();
        updatePrice();
    }

    function renderCategories() {
        const current = els();
        if (!current.categories) return;

        current.categories.innerHTML = "";
        const fragment = document.createDocumentFragment();

        CONFIG.CUSTOMIZATION_CATEGORIES.forEach((category) => {
            const products = categoryProducts(category);
            const button = document.createElement("button");
            const icon = document.createElement("i");
            const content = document.createElement("span");
            const name = document.createElement("strong");
            const count = document.createElement("span");
            const base = document.createElement("span");

            button.type = "button";
            button.className = "customization-category-card";
            button.dataset.category = category;
            button.disabled = products.length === 0;

            icon.className = ICONS[category] || "fa-solid fa-box";
            icon.setAttribute("aria-hidden", "true");

            content.className = "customization-category-content";
            name.textContent = category;

            count.className = "customization-category-count";
            count.textContent =
                products.length === 1
                    ? "1 producto disponible"
                    : `${products.length} productos disponibles`;

            base.className = "customization-category-price";
            base.textContent = `Desde ${money(categoryBase(category))}`;

            content.append(name, count, base);
            button.append(icon, content);

            button.addEventListener("click", () => {
                selectCategory(category);
            });

            fragment.appendChild(button);
        });

        current.categories.appendChild(fragment);
    }

    function selectCategory(category) {
        const current = els();

        state.category = category;
        state.product = null;
        state.variant = null;

        document
            .querySelectorAll(".customization-category-card")
            .forEach((card) => {
                card.classList.toggle(
                    "selected",
                    card.dataset.category === category
                );
            });

        if (current.categoryTitle) {
            current.categoryTitle.textContent = category;
        }

        if (current.colors) {
            current.colors.innerHTML =
                "<p>Primero selecciona un producto.</p>";
        }

        if (current.productImage) {
            current.productImage.src = CONFIG.placeholderImage;
            current.productImage.alt = "Selecciona un producto";
        }

        renderProducts();
        updatePrice();
    }

    function renderProducts() {
        const current = els();
        if (!current.products) return;

        const products = categoryProducts(state.category);
        current.products.innerHTML = "";

        if (products.length === 0) {
            current.products.innerHTML = `
                <p class="customization-empty">
                    No hay productos personalizables disponibles en esta categoría.
                </p>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();

        products.forEach((product) => {
            const button = document.createElement("button");
            const image = document.createElement("img");
            const content = document.createElement("span");
            const name = document.createElement("strong");
            const action = document.createElement("span");

            button.type = "button";
            button.className = "customizable-product-card";
            button.dataset.productId = product.id;

            image.src =
                product.imagenPrincipal ||
                CONFIG.placeholderImage;
            image.alt = "";

            content.className =
                "customizable-product-card-content";

            name.textContent = product.nombre;

            action.className = "customizable-product-action";
            action.textContent = "Seleccionar producto";

            content.append(name, action);
            button.append(image, content);

            button.addEventListener("click", () => {
                selectProduct(product);
            });

            fragment.appendChild(button);
        });

        current.products.appendChild(fragment);
    }

    function selectProduct(product) {
        state.product = product;
        state.variant =
            product.variantes?.[0] || {
                nombre: "Estándar",
                imagen: product.imagenPrincipal
            };

        document
            .querySelectorAll(".customizable-product-card")
            .forEach((card) => {
                card.classList.toggle(
                    "selected",
                    card.dataset.productId === product.id
                );
            });

        updatePreview();
        renderColors();
        updatePrice();
    }

    function updatePreview() {
        const image = els().productImage;
        if (!image) return;

        image.src =
            state.variant?.imagen ||
            state.product?.imagenPrincipal ||
            CONFIG.placeholderImage;

        image.alt = state.product?.nombre || "";
    }

    function renderColors() {
        const area = els().colors;
        if (!area) return;

        area.innerHTML = "";

        if (!state.product) {
            area.innerHTML = "<p>Primero selecciona un producto.</p>";
            return;
        }

        const variants =
            state.product.variantes?.length
                ? state.product.variantes
                : [{
                    nombre: "Estándar",
                    imagen: state.product.imagenPrincipal
                }];

        const grid = document.createElement("div");
        grid.className = "color-options-grid";

        variants.forEach((variant, index) => {
            const button = document.createElement("button");
            const image = document.createElement("img");
            const label = document.createElement("span");

            button.type = "button";
            button.className =
                `color-option-card${index === 0 ? " selected" : ""}`;

            image.src =
                variant.imagen ||
                state.product.imagenPrincipal;
            image.alt = variant.nombre;

            const swatch = document.createElement("span");
            swatch.className = "modal-color-swatch";

            if (variant.colorHex) {
                swatch.style.background = variant.colorHex;
            } else {
                swatch.style.backgroundImage = `url("${variant.imagen}")`;
            }

            label.textContent = variant.nombre;
            button.append(image, swatch, label);

            button.addEventListener("click", () => {
                grid
                    .querySelectorAll(".color-option-card")
                    .forEach((card) => {
                        card.classList.remove("selected");
                    });

                button.classList.add("selected");
                state.variant = variant;
                updatePreview();
            });

            grid.appendChild(button);
        });

        area.appendChild(grid);
    }

    function validStep() {
        if (state.step === 1) {
            return Boolean(state.category);
        }

        if (state.step === 2) {
            return Boolean(state.product);
        }

        if (state.step === 3) {
            const selected = document.querySelector(
                'input[name="estilo"]:checked'
            );

            if (!selected) return false;
            state.style = selected.value;
        }

        if (state.step === 4) {
            return Boolean(state.variant);
        }

        return true;
    }

    function shake() {
        const content = document.querySelector(
            `.modal-step-content[data-step-content="${state.step}"]`
        );

        content?.classList.add("shake");

        window.setTimeout(() => {
            content?.classList.remove("shake");
        }, 450);
    }

    function updateText() {
        const current = els();
        const main = $("#texto-principal")?.value.trim() || "";
        const secondary = $("#texto-secundario")?.value.trim() || "";

        if (current.mainText) {
            current.mainText.textContent = main || "Tu texto aquí";
            current.mainText.hidden = !main;
        }

        if (current.secondaryText) {
            current.secondaryText.textContent = secondary;
            current.secondaryText.hidden = !secondary;
        }

        if (current.textControls) {
            current.textControls.hidden = !main && !secondary;
        }

        counters();
        updatePrice();
    }

    function loadImage(file) {
        const current = els();
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("La imagen supera 5 MB.");
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            if (!current.userImage) return;

            current.userImage.src = event.target.result;
            current.userImage.hidden = false;

            if (current.upload) current.upload.hidden = true;
            if (current.imageControls) current.imageControls.hidden = false;

            state.imageName = file.name;

            Object.assign(state.image, {
                x: 0,
                y: 0,
                scale: 1,
                rotation: 0
            });

            applyImage();
            updatePrice();
        };

        reader.readAsDataURL(file);
    }

    function removeImage() {
        const current = els();

        if (current.file) current.file.value = "";

        if (current.userImage) {
            current.userImage.src = "";
            current.userImage.hidden = true;
        }

        if (current.upload) current.upload.hidden = false;
        if (current.imageControls) current.imageControls.hidden = true;

        state.imageName = "";
        updatePrice();
    }

    function addSummary(list, label, value) {
        const item = document.createElement("li");
        const strong = document.createElement("strong");

        strong.textContent = `${label}: `;
        item.append(strong, document.createTextNode(value));
        list.appendChild(item);
    }

    function showSummary() {
        const current = els();

        if (!current.summaryList || !state.product) return;

        current.summaryList.innerHTML = "";

        addSummary(current.summaryList, "Tipo", state.category);
        addSummary(current.summaryList, "Producto", state.product.nombre);
        addSummary(current.summaryList, "Color", state.variant?.nombre || "Estándar");
        addSummary(current.summaryList, "Estilo", state.style || "Sin definir");
        addSummary(current.summaryList, "Imagen", state.imageName || "Sin imagen");
        addSummary(
            current.summaryList,
            "Texto principal",
            $("#texto-principal")?.value.trim() || "Sin texto"
        );
        addSummary(
            current.summaryList,
            "Texto secundario",
            $("#texto-secundario")?.value.trim() || "Sin texto"
        );
        addSummary(
            current.summaryList,
            "Instrucciones",
            $("#instrucciones")?.value.trim() || "Sin instrucciones"
        );

        renderBreakdown();

        if (current.body) current.body.hidden = true;
        if (current.footer) current.footer.hidden = true;
        if (current.summary) current.summary.hidden = false;
    }

    function addToCart() {
        if (!state.product) return;

        const result = priceSummary();

        const customization = {
            category: state.category,
            productVariant: state.variant?.nombre || "Estándar",
            style: state.style,
            imageName: state.imageName,
            mainText: $("#texto-principal")?.value.trim() || "",
            secondaryText: $("#texto-secundario")?.value.trim() || "",
            instructions: $("#instrucciones")?.value.trim() || "",
            basePrice: result.costs.base,
            priceBreakdown: result.lines,
            totalPrice: result.total,
            imageTransform: { ...state.image },
            mainTextTransform: { ...state.main },
            secondaryTextTransform: { ...state.secondary }
        };

        const pricedProduct = {
            ...state.product,
            precio: result.total,
            precioOriginal: 0,
            imagenPrincipal:
                state.variant?.imagen ||
                state.product.imagenPrincipal
        };

        window.Cart.add(
            pricedProduct,
            1,
            customization
        );

        window.Products.showToast(
            `${state.product.nombre} fue agregado por ${money(result.total)}.`
        );

        close();
    }

    function categoryFor(product) {
        return CONFIG.CUSTOMIZATION_CATEGORIES.find((category) =>
            window.Products.matchesCategory(product, category)
        ) || "";
    }

    async function open(preselected = null) {
        const current = els();
        if (!current.overlay) return;

        reset();

        current.overlay.classList.add("active");
        current.overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");

        try {
            const allProducts = await window.Products.loadProducts();

            state.products = allProducts.filter((product) =>
                window.Products.isCustomizableProduct(product) &&
                Number(product.stock) > 0
            );

            renderCategories();

            if (preselected?.personalizable) {
                const product = state.products.find(
                    (item) => item.id === preselected.id
                );

                const category = product && categoryFor(product);

                if (product && category) {
                    selectCategory(category);
                    selectProduct(product);
                }
            }
        } catch (error) {
            if (current.categories) {
                current.categories.innerHTML = `
                    <p class="customization-empty">
                        No fue posible cargar los productos: ${error.message}
                    </p>
                `;
            }
        }
    }

    function close() {
        const overlay = els().overlay;
        if (!overlay) return;

        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
    }

    function drag(element, getTransform, applyTransform) {
        if (!element) return;

        let active = false;
        let startX = 0;
        let startY = 0;
        let initialX = 0;
        let initialY = 0;

        element.addEventListener("pointerdown", (event) => {
            if (element.hidden) return;

            const transform = getTransform();

            active = true;
            startX = event.clientX;
            startY = event.clientY;
            initialX = transform.x;
            initialY = transform.y;

            element.setPointerCapture?.(event.pointerId);
            event.preventDefault();
        });

        element.addEventListener("pointermove", (event) => {
            if (!active) return;

            const transform = getTransform();

            transform.x = initialX + event.clientX - startX;
            transform.y = initialY + event.clientY - startY;

            applyTransform();
        });

        const stop = () => {
            active = false;
        };

        element.addEventListener("pointerup", stop);
        element.addEventListener("pointercancel", stop);
    }

    function bind() {
        const current = els();
        if (!current.overlay) return;

        current.close?.addEventListener("click", close);

        current.overlay.addEventListener("click", (event) => {
            if (event.target === current.overlay) close();
        });

        current.next?.addEventListener("click", () => {
            if (!validStep()) {
                shake();
                return;
            }

            if (state.step < TOTAL_STEPS) {
                state.step += 1;
                stepUI();

                if (state.step === 6) {
                    updateText();
                }
            } else {
                showSummary();
            }
        });

        current.previous?.addEventListener("click", () => {
            if (state.step > 1) {
                state.step -= 1;
                stepUI();
            }
        });

        current.edit?.addEventListener("click", () => {
            if (current.body) current.body.hidden = false;
            if (current.footer) current.footer.hidden = false;
            if (current.summary) current.summary.hidden = true;

            state.step = 1;
            stepUI();
        });

        current.send?.addEventListener("click", addToCart);

        current.file?.addEventListener("change", () => {
            loadImage(current.file.files?.[0]);
        });

        current.upload?.addEventListener("dragover", (event) => {
            event.preventDefault();
            current.upload.classList.add("drag-over");
        });

        current.upload?.addEventListener("dragleave", () => {
            current.upload.classList.remove("drag-over");
        });

        current.upload?.addEventListener("drop", (event) => {
            event.preventDefault();
            current.upload.classList.remove("drag-over");
            loadImage(event.dataTransfer.files?.[0]);
        });

        $("#btn-zoom-in")?.addEventListener("click", () => {
            state.image.scale = Math.min(2.5, state.image.scale + 0.1);
            applyImage();
        });

        $("#btn-zoom-out")?.addEventListener("click", () => {
            state.image.scale = Math.max(0.3, state.image.scale - 0.1);
            applyImage();
        });

        $("#btn-rotate-left")?.addEventListener("click", () => {
            state.image.rotation -= 15;
            applyImage();
        });

        $("#btn-reset-image")?.addEventListener("click", () => {
            Object.assign(state.image, {
                x: 0,
                y: 0,
                scale: 1,
                rotation: 0
            });
            applyImage();
        });

        $("#btn-remove-img-editor")?.addEventListener("click", removeImage);
        $("#texto-principal")?.addEventListener("input", updateText);
        $("#texto-secundario")?.addEventListener("input", updateText);
        $("#instrucciones")?.addEventListener("input", counters);

        $("#btn-select-main")?.addEventListener("click", () => {
            state.activeText = "main";
        });

        $("#btn-select-secondary")?.addEventListener("click", () => {
            state.activeText = "secondary";
        });

        $("#btn-text-zoom-in")?.addEventListener("click", () => {
            const transform = textState(state.activeText);
            transform.scale = Math.min(3, transform.scale + 0.1);
            applyText(state.activeText);
        });

        $("#btn-text-zoom-out")?.addEventListener("click", () => {
            const transform = textState(state.activeText);
            transform.scale = Math.max(0.3, transform.scale - 0.1);
            applyText(state.activeText);
        });

        $("#btn-text-rotate-left")?.addEventListener("click", () => {
            const transform = textState(state.activeText);
            transform.rotation -= 15;
            applyText(state.activeText);
        });

        $("#btn-text-reset")?.addEventListener("click", () => {
            Object.assign(textState(state.activeText), {
                x: 0,
                y: 0,
                scale: 1,
                rotation: 0
            });
            applyText(state.activeText);
        });

        $("#btn-text-color")?.addEventListener("click", () => {
            const input = document.createElement("input");
            input.type = "color";
            input.value = "#2f292c";

            input.addEventListener("input", () => {
                const target = textElement(state.activeText);
                if (target) target.style.color = input.value;
            });

            input.click();
        });

        drag(current.userImage, () => state.image, applyImage);
        drag(current.mainText, () => state.main, () => applyText("main"));
        drag(
            current.secondaryText,
            () => state.secondary,
            () => applyText("secondary")
        );
    }

    window.Customization = Object.freeze({
        open,
        close
    });

    document.addEventListener("DOMContentLoaded", () => {
        bind();

        document.addEventListener("click", (event) => {
            const trigger = event.target.closest(
                "[data-open-customization]"
            );

            if (trigger) {
                event.preventDefault();
                open();
            }
        });

        window.Products?.loadProducts().catch(() => {});
    });
})();
