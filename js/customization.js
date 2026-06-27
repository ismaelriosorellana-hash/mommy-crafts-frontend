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
        imageFile: null,
        uploading: false,
        previewWidth: 420,
        activeText: "main",
        selectedObject: null,
        image: { x: 0, y: 0, scale: 1, rotation: 0 },
        main: {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            fontFamily: "'Dancing Script', cursive",
            color: "#372a32"
        },
        secondary: {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            fontFamily: "'Caveat', cursive",
            color: "#372a32"
        },
        autoAdvanceTimer: 0,
        summaryPreviewUrl: "",
        summaryPreviewGeneration: 0
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
        preview: $("#product-preview"),
        selectedObjectName: $("#selected-object-name"),
        fontFamily: $("#text-font-family"),
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


function configuredCategoryBase(category) {
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

function productBasePrice(product, category = "") {
    const custom = product?.personalizationPricing || {};

    return (
        Number(custom.base) ||
        Number(product?.precio) ||
        productOverride(product) ||
        configuredCategoryBase(category) ||
        0
    );
}

function categoryBase(category) {
    const prices = categoryProducts(category)
        .map((product) => productBasePrice(product, category))
        .filter((value) => Number.isFinite(value) && value > 0);

    return prices.length
        ? Math.min(...prices)
        : configuredCategoryBase(category);
}

    function pricing() {
        const custom = state.product?.personalizationPricing || {};
        const extras = CONFIG.CUSTOMIZATION_PRICING?.extras || {};

        return {
            base:
                productBasePrice(
                    state.product,
                    state.category
                ),
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

        element.style.fontFamily =
            transform.fontFamily ||
            "'Dancing Script', cursive";

        element.style.color =
            transform.color ||
            "#372a32";
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
            rotation: 0,
            fontFamily: "'Dancing Script', cursive",
            color: "#372a32"
        });

        Object.assign(state.secondary, {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            fontFamily: "'Caveat', cursive",
            color: "#372a32"
        });

        applyImage();
        applyText("main");
        applyText("secondary");
    }


function selectedTextType() {
    return ["main", "secondary"].includes(
        state.selectedObject
    )
        ? state.selectedObject
        : null;
}

function updateSelectionUI() {
    const current = els();
    const selectedText = selectedTextType();

    current.userImage?.classList.toggle(
        "editor-object-selected",
        state.selectedObject === "image"
    );

    current.mainText?.classList.toggle(
        "editor-object-selected",
        state.selectedObject === "main"
    );

    current.secondaryText?.classList.toggle(
        "editor-object-selected",
        state.selectedObject === "secondary"
    );

    const imageSelected =
        state.step === 5 &&
        state.selectedObject === "image" &&
        current.userImage &&
        !current.userImage.hidden;

    if (current.imageControls) {
        current.imageControls.hidden =
            !imageSelected;
    }

    const textElementSelected =
        selectedText &&
        state.step === 6 &&
        !textElement(selectedText)?.hidden;

    if (current.textControls) {
        current.textControls.hidden =
            !textElementSelected;
    }

    if (
        textElementSelected &&
        current.selectedObjectName
    ) {
        current.selectedObjectName.textContent =
            selectedText === "main"
                ? "Texto principal"
                : "Texto secundario";
    }

    if (
        textElementSelected &&
        current.fontFamily
    ) {
        current.fontFamily.value =
            textState(selectedText).fontFamily ||
            "'Dancing Script', cursive";

        current.fontFamily.style.fontFamily =
            current.fontFamily.value;
    }
}

function selectObject(type) {
    const current = els();

    if (
        type === "image" &&
        (
            state.step !== 5 ||
            !current.userImage ||
            current.userImage.hidden
        )
    ) {
        return;
    }

    if (
        ["main", "secondary"].includes(type) &&
        (
            state.step !== 6 ||
            textElement(type)?.hidden
        )
    ) {
        return;
    }

    state.selectedObject = type;

    if (["main", "secondary"].includes(type)) {
        state.activeText = type;
    }

    updateSelectionUI();
}

function deselectObject() {
    state.selectedObject = null;
    updateSelectionUI();
}

function clearTextStep() {
    [
        "texto-principal",
        "texto-secundario",
        "instrucciones"
    ].forEach((id) => {
        const field = document.getElementById(id);
        if (field) field.value = "";
    });

    const current = els();

    if (current.mainText) {
        current.mainText.textContent = "Tu texto aquí";
        current.mainText.hidden = true;
    }

    if (current.secondaryText) {
        current.secondaryText.textContent = "";
        current.secondaryText.hidden = true;
    }

    Object.assign(state.main, {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        fontFamily: "'Dancing Script', cursive",
        color: "#372a32"
    });

    Object.assign(state.secondary, {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        fontFamily: "'Caveat', cursive",
        color: "#372a32"
    });

    if (["main", "secondary"].includes(state.selectedObject)) {
        state.selectedObject = null;
    }

    applyText("main");
    applyText("secondary");
    counters();
    updateSelectionUI();
}

function clearImageStep() {
    removeImage();

    Object.assign(state.image, {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0
    });

    applyImage();
}

function clearVariantStep() {
    state.variant = null;

    document
        .querySelectorAll(".color-option-card")
        .forEach((card) => {
            card.classList.remove("selected");
            card.setAttribute("aria-checked", "false");
        });

    updatePreview();
}

function clearStyleStep() {
    state.style = "";

    document
        .querySelectorAll('input[name="estilo"]')
        .forEach((input) => {
            input.checked = false;
        });
}

function clearProductStep() {
    state.product = null;
    state.variant = null;

    document
        .querySelectorAll(".customizable-product-card")
        .forEach((card) => {
            card.classList.remove("selected");
        });

    const current = els();

    if (current.colors) {
        current.colors.innerHTML =
            "<p>Primero selecciona un producto.</p>";
    }

    if (current.productImage) {
        current.productImage.src =
            CONFIG.placeholderImage;

        current.productImage.alt =
            "Selecciona un producto";
    }
}

function clearStepsAfter(step) {
    window.clearTimeout(state.autoAdvanceTimer);

    if (step < 6) clearTextStep();
    if (step < 5) clearImageStep();
    if (step < 4) clearVariantStep();
    if (step < 3) clearStyleStep();
    if (step < 2) clearProductStep();

    updatePrice();
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

        if (
            state.step !== 5 &&
            state.selectedObject === "image"
        ) {
            state.selectedObject = null;
        }

        if (
            state.step !== 6 &&
            ["main", "secondary"].includes(
                state.selectedObject
            )
        ) {
            state.selectedObject = null;
        }

        updateSelectionUI();
    }


function advanceToStep(nextStep, delay = 180) {
    window.clearTimeout(state.autoAdvanceTimer);

    state.autoAdvanceTimer = window.setTimeout(() => {
        if (nextStep < 1 || nextStep > TOTAL_STEPS) return;
        state.step = nextStep;
        stepUI();

        if (state.step === 6) {
            updateText();
        }
    }, delay);
}

    function reset() {
        const current = els();
        clearSummaryPreview();
        window.clearTimeout(state.autoAdvanceTimer);

        Object.assign(state, {
            step: 1,
            products: [],
            category: "",
            product: null,
            variant: null,
            style: "",
            imageName: "",
            imageFile: null,
            uploading: false,
            previewWidth: 420,
            activeText: "main",
            selectedObject: null
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
                advanceToStep(2);
            });

            fragment.appendChild(button);
        });

        current.categories.appendChild(fragment);
    }

    function selectCategory(category) {
        const current = els();

        clearStepsAfter(1);
        state.category = category;

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
            const basePrice = document.createElement("span");
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

            basePrice.className = "customizable-product-price";
            basePrice.textContent =
                `Desde ${money(productBasePrice(product, state.category))}`;

            action.className = "customizable-product-action";
            action.textContent = "Seleccionar producto";

            content.append(name, basePrice, action);
            button.append(image, content);

            button.addEventListener("click", () => {
                selectProduct(product);
                advanceToStep(3);
            });

            fragment.appendChild(button);
        });

        current.products.appendChild(fragment);
    }

    function selectProduct(product) {
        clearStepsAfter(2);
        state.product = product;

        const selectableVariants =
            window.Products
                .getSelectableVariants(product);

        state.variant =
            selectableVariants[0] ||
            product.variantes?.[0] || {
                id: "standard",
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

        const selectableVariants =
            window.Products
                .getSelectableVariants(
                    state.product
                );

        const variants =
            selectableVariants.length
                ? selectableVariants
                : [{
                    id: "standard",
                    nombre: "Estándar",
                    imagen: state.product.imagenPrincipal
                }];

        const grid = document.createElement("div");
        grid.className = "color-options-grid";

        variants.forEach((variant, index) => {
            const button = document.createElement("button");
            const image = document.createElement("img");
            const label = document.createElement("span");
            const selectionMark = document.createElement("span");

            const isSelected =
                state.variant?.id ===
                variant.id;

            button.type = "button";
            button.className =
                `color-option-card${isSelected ? " selected" : ""}`;
            button.dataset.variantId = variant.id;
            button.setAttribute("role", "radio");
            button.setAttribute(
                "aria-checked",
                String(isSelected)
            );

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

            selectionMark.className =
                "color-option-selected-mark";
            selectionMark.setAttribute(
                "aria-hidden",
                "true"
            );
            selectionMark.innerHTML =
                '<i class="fa-solid fa-check"></i>';

            label.textContent = variant.nombre;
            button.append(
                image,
                swatch,
                label,
                selectionMark
            );

            button.addEventListener("click", () => {
                grid
                    .querySelectorAll(".color-option-card")
                    .forEach((card) => {
                        const selected =
                            card === button;

                        card.classList.toggle(
                            "selected",
                            selected
                        );

                        card.setAttribute(
                            "aria-checked",
                            String(selected)
                        );
                    });

                clearStepsAfter(4);
                state.variant = variant;
                updatePreview();
                updatePrice();
                advanceToStep(5);
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

        if (
            state.selectedObject === "main" &&
            !main
        ) {
            state.selectedObject = null;
        }

        if (
            state.selectedObject === "secondary" &&
            !secondary
        ) {
            state.selectedObject = null;
        }

        applyText("main");
        applyText("secondary");
        updateSelectionUI();
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
            state.imageFile = file;

            Object.assign(state.image, {
                x: 0,
                y: 0,
                scale: 1,
                rotation: 0
            });

            applyImage();
            updatePrice();
            selectObject("image");
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
        state.imageFile = null;

        if (state.selectedObject === "image") {
            state.selectedObject = null;
        }

        updateSelectionUI();
        updatePrice();
    }

    function clearSummaryPreview() {
        state.summaryPreviewGeneration += 1;

        if (state.summaryPreviewUrl) {
            URL.revokeObjectURL(state.summaryPreviewUrl);
            state.summaryPreviewUrl = "";
        }

        document
            .querySelector(".customization-summary-preview")
            ?.remove();
    }

    function addSummary(list, label, value) {
        const item = document.createElement("li");
        const strong = document.createElement("strong");

        strong.textContent = `${label}: `;
        item.append(strong, document.createTextNode(value));
        list.appendChild(item);
    }

    async function showSummary() {
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

        const previewShape = current.preview?.querySelector(
            ".preview-product-shape"
        );
        const measuredWidth = previewShape?.getBoundingClientRect().width;

        if (measuredWidth) {
            state.previewWidth = measuredWidth;
        }

        clearSummaryPreview();
        const previewGeneration = state.summaryPreviewGeneration;

        const previewCard = document.createElement("figure");
        previewCard.className = "customization-summary-preview";
        previewCard.innerHTML = `
            <div class="customization-summary-preview-loading">
                Preparando la vista previa final...
            </div>
            <figcaption>
                Vista previa referencial. Mommy Crafts enviará el diseño modelado para tu aprobación antes de producir.
            </figcaption>
        `;

        current.summaryList.before(previewCard);

        if (current.body) current.body.hidden = true;
        if (current.footer) current.footer.hidden = true;
        if (current.summary) current.summary.hidden = false;

        try {
            await document.fonts?.ready;

            const rendered = await createFinalPreviewBlob(
                $("#texto-principal")?.value.trim() || "",
                $("#texto-secundario")?.value.trim() || ""
            );

            const generatedUrl = URL.createObjectURL(rendered.blob);

            if (
                previewGeneration !== state.summaryPreviewGeneration ||
                !previewCard.isConnected
            ) {
                URL.revokeObjectURL(generatedUrl);
                return;
            }

            state.summaryPreviewUrl = generatedUrl;

            const image = document.createElement("img");
            image.src = state.summaryPreviewUrl;
            image.alt = `Vista previa final de ${state.product.nombre}`;

            previewCard.querySelector(".customization-summary-preview-loading")?.replaceWith(image);
        } catch (error) {
            console.warn("No fue posible generar la vista previa del resumen:", error);
            const loading = previewCard.querySelector(".customization-summary-preview-loading");
            if (loading) {
                loading.textContent = "No fue posible generar la imagen del resumen. Puedes volver a editar o intentar agregar el producto nuevamente.";
            }
        }
    }


    function createCustomizationId() {
        return window.crypto?.randomUUID?.() ||
            `personalizacion-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function blobFromCanvas(canvas, type = "image/png", quality = 0.96) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                        return;
                    }

                    reject(
                        new Error(
                            "No fue posible generar la vista previa final."
                        )
                    );
                },
                type,
                quality
            );
        });
    }

    async function loadCanvasImage(source) {
        if (!source) {
            throw new Error("No se encontró la imagen del producto.");
        }

        let objectUrl = "";

        try {
            if (!source.startsWith("data:") && !source.startsWith("blob:")) {
                const response = await fetch(source, {
                    mode: "cors",
                    cache: "force-cache"
                });

                if (!response.ok) {
                    throw new Error(
                        `No fue posible cargar una imagen de referencia (${response.status}).`
                    );
                }

                objectUrl = URL.createObjectURL(await response.blob());
                source = objectUrl;
            }

            const image = new Image();
            image.decoding = "async";

            await new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = () => reject(
                    new Error("Una de las imágenes no pudo procesarse.")
                );
                image.src = source;
            });

            return {
                image,
                release() {
                    if (objectUrl) URL.revokeObjectURL(objectUrl);
                }
            };
        } catch (error) {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            throw error;
        }
    }

    function drawContainedImage(context, image, box) {
        const ratio = Math.min(
            box.width / image.naturalWidth,
            box.height / image.naturalHeight
        );

        const width = image.naturalWidth * ratio;
        const height = image.naturalHeight * ratio;
        const x = box.x + (box.width - width) / 2;
        const y = box.y + (box.height - height) / 2;

        context.drawImage(image, x, y, width, height);
    }

    function splitTextLines(context, text, maxWidth) {
        const words = String(text || "").split(/\s+/).filter(Boolean);
        const lines = [];
        let line = "";

        for (const word of words) {
            const candidate = line ? `${line} ${word}` : word;

            if (
                line &&
                context.measureText(candidate).width > maxWidth
            ) {
                lines.push(line);
                line = word;
            } else {
                line = candidate;
            }
        }

        if (line) lines.push(line);
        return lines.length ? lines : [""];
    }

    function textSpecification(type, value) {
        const transform = textState(type);
        const element = textElement(type);
        const computed = element
            ? window.getComputedStyle(element)
            : null;

        const baseSize = Number.parseFloat(
            computed?.fontSize || (type === "main" ? "24" : "17")
        ) || (type === "main" ? 24 : 17);

        return {
            value,
            fontFamily: transform.fontFamily || "'Dancing Script', cursive",
            baseFontSizePx: Math.round(baseSize * 100) / 100,
            fontSizePx:
                Math.round(baseSize * transform.scale * 100) / 100,
            colorHex: transform.color || "#372a32",
            x: Math.round(transform.x * 100) / 100,
            y: Math.round(transform.y * 100) / 100,
            scale: Math.round(transform.scale * 1000) / 1000,
            rotation: Math.round(transform.rotation * 100) / 100
        };
    }

    function drawTextOnCanvas(
        context,
        canvas,
        previewWidth,
        type,
        specification
    ) {
        if (!specification.value) return;

        const ratio = canvas.width / previewWidth;
        const baseY = type === "main" ? 0.36 : 0.52;
        const element = textElement(type);
        const computed = element
            ? window.getComputedStyle(element)
            : null;
        const weight = computed?.fontWeight || (type === "main" ? "700" : "500");
        const outputFontSize = Math.max(
            18,
            specification.fontSizePx * ratio
        );
        const maxWidth = canvas.width * 0.70;

        context.save();
        context.translate(
            canvas.width / 2 + specification.x * ratio,
            canvas.height * baseY + specification.y * ratio
        );
        context.rotate(specification.rotation * Math.PI / 180);
        context.fillStyle = specification.colorHex;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = `${weight} ${outputFontSize}px ${specification.fontFamily}`;

        const lines = splitTextLines(
            context,
            specification.value,
            maxWidth
        );
        const lineHeight = outputFontSize * 1.16;
        const firstY = -((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, index) => {
            context.fillText(
                line,
                0,
                firstY + index * lineHeight,
                maxWidth
            );
        });

        context.restore();
    }

    async function createFinalPreviewBlob(mainText, secondaryText) {
        const current = els();
        const shape = current.preview?.querySelector(".preview-product-shape");
        const previewWidth = Math.max(
            1,
            shape?.getBoundingClientRect().width ||
            state.previewWidth ||
            420
        );
        const size = 1254;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", {
            alpha: false
        });

        canvas.width = size;
        canvas.height = size;

        const background = context.createRadialGradient(
            size * 0.5,
            size * 0.38,
            0,
            size * 0.5,
            size * 0.5,
            size * 0.72
        );
        background.addColorStop(0, "#ffffff");
        background.addColorStop(0.66, "#f8eff2");
        background.addColorStop(1, "#ecdbe1");
        context.fillStyle = background;
        context.fillRect(0, 0, size, size);

        const productSource =
            current.productImage?.currentSrc ||
            current.productImage?.src ||
            state.variant?.imagen ||
            state.product?.imagenPrincipal;

        const product = await loadCanvasImage(productSource);

        try {
            drawContainedImage(
                context,
                product.image,
                {
                    x: 0,
                    y: 0,
                    width: size,
                    height: size
                }
            );
        } finally {
            product.release();
        }

        const ratio = size / previewWidth;

        if (state.imageFile && current.userImage?.src) {
            const customerImage = await loadCanvasImage(current.userImage.src);

            try {
                const maxSide = size * 0.45;
                const baseRatio = Math.min(
                    maxSide / customerImage.image.naturalWidth,
                    maxSide / customerImage.image.naturalHeight
                );
                const width =
                    customerImage.image.naturalWidth *
                    baseRatio *
                    state.image.scale;
                const height =
                    customerImage.image.naturalHeight *
                    baseRatio *
                    state.image.scale;

                context.save();
                context.translate(
                    size * 0.50 + state.image.x * ratio,
                    size * 0.45 + state.image.y * ratio
                );
                context.rotate(state.image.rotation * Math.PI / 180);
                context.drawImage(
                    customerImage.image,
                    -width / 2,
                    -height / 2,
                    width,
                    height
                );
                context.restore();
            } finally {
                customerImage.release();
            }
        }

        const mainSpec = textSpecification("main", mainText);
        const secondarySpec = textSpecification("secondary", secondaryText);

        drawTextOnCanvas(
            context,
            canvas,
            previewWidth,
            "main",
            mainSpec
        );
        drawTextOnCanvas(
            context,
            canvas,
            previewWidth,
            "secondary",
            secondarySpec
        );

        return {
            blob: await blobFromCanvas(canvas),
            width: size,
            height: size,
            mainSpec,
            secondarySpec
        };
    }

    async function uploadCustomizationAssets(
        customizationId,
        previewBlob
    ) {
        const formData = new FormData();
        formData.append("customizationId", customizationId);
        formData.append(
            "preview",
            previewBlob,
            `vista-previa-${customizationId}.png`
        );

        if (state.imageFile) {
            formData.append(
                "original",
                state.imageFile,
                state.imageFile.name
            );
        }

        return API.request(
            "/uploads/personalizacion",
            {
                method: "POST",
                body: formData,
                timeoutMs: 60000
            }
        );
    }

    async function addToCart() {
        if (!state.product || state.uploading) return;

        const current = els();
        const originalButtonText = current.send?.textContent || "Agregar al carrito";
        const mainText = $("#texto-principal")?.value.trim() || "";
        const secondaryText = $("#texto-secundario")?.value.trim() || "";
        const instructions = $("#instrucciones")?.value.trim() || "";
        const result = priceSummary();
        const customizationId = createCustomizationId();

        state.uploading = true;
        deselectObject();

        if (current.send) {
            current.send.disabled = true;
            current.send.textContent = "Preparando personalización...";
        }

        try {
            await document.fonts?.ready;

            const rendered = await createFinalPreviewBlob(
                mainText,
                secondaryText
            );

            if (current.send) {
                current.send.textContent = "Guardando imágenes...";
            }

            const upload = await uploadCustomizationAssets(
                customizationId,
                rendered.blob
            );

            const customization = {
                version: 2,
                customizationId: upload.customizationId || customizationId,
                category: state.category,
                productVariant: state.variant?.nombre || "Estándar",
                variantId: state.variant?.id || "",
                sku: state.variant?.sku || "",
                style: state.style,
                imageName: state.imageName,
                mainText,
                secondaryText,
                instructions,
                basePrice: result.costs.base,
                priceBreakdown: result.lines,
                totalPrice: result.total,
                imageTransform: { ...state.image },
                mainTextTransform: { ...state.main },
                secondaryTextTransform: { ...state.secondary },
                mainTextFont: state.main.fontFamily,
                secondaryTextFont: state.secondary.fontFamily,
                assets: {
                    original: upload.assets?.original || null,
                    preview: upload.assets?.preview || null
                },
                image: {
                    fileName: state.imageName,
                    transform: { ...state.image },
                    asset: upload.assets?.original || null
                },
                texts: {
                    main: rendered.mainSpec,
                    secondary: rendered.secondarySpec
                },
                finalPreview: {
                    width: rendered.width,
                    height: rendered.height,
                    asset: upload.assets?.preview || null
                },
                createdAt: new Date().toISOString()
            };

            const pricedProduct = {
                ...state.product,
                precio: result.total,
                precioOriginal: 0,
                imagenPrincipal:
                    upload.assets?.preview?.url ||
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
        } catch (error) {
            console.error("No fue posible guardar la personalización:", error);
            alert(
                error.message ||
                "No fue posible preparar la personalización. Revisa la conexión con el backend y Cloudinary."
            );
        } finally {
            state.uploading = false;

            if (current.send) {
                current.send.disabled = false;
                current.send.textContent = originalButtonText;
            }
        }
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
        window.clearTimeout(state.autoAdvanceTimer);
        clearSummaryPreview();
        const overlay = els().overlay;
        if (!overlay) return;

        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
    }


function drag(
    element,
    type,
    getTransform,
    applyTransform
) {
    if (!element) return;

    let active = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    element.addEventListener("pointerdown", (event) => {
        if (element.hidden) return;

        if (
            type === "image" &&
            state.step !== 5
        ) {
            return;
        }

        if (
            ["main", "secondary"].includes(type) &&
            state.step !== 6
        ) {
            return;
        }

        selectObject(type);

        const transform = getTransform();

        active = true;
        startX = event.clientX;
        startY = event.clientY;
        initialX = transform.x;
        initialY = transform.y;

        element.setPointerCapture?.(event.pointerId);
        event.preventDefault();
        event.stopPropagation();
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

        document
            .querySelectorAll('input[name="estilo"]')
            .forEach((input) => {
                input.addEventListener("change", () => {
                    if (!input.checked) return;

                    clearStepsAfter(3);
                    state.style = input.value;
                    advanceToStep(4);
                });
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
                void showSummary();
            }
        });

        current.previous?.addEventListener("click", () => {
            if (state.step > 1) {
                const previousStep =
                    state.step - 1;

                clearStepsAfter(previousStep);
                state.step = previousStep;
                stepUI();
            }
        });

        current.edit?.addEventListener("click", () => {
            clearSummaryPreview();
            if (current.body) current.body.hidden = false;
            if (current.footer) current.footer.hidden = false;
            if (current.summary) current.summary.hidden = true;

            clearStepsAfter(1);
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

        $("#btn-text-zoom-in")?.addEventListener("click", () => {
            const type = selectedTextType();
            if (!type) return;

            const transform = textState(type);
            transform.scale = Math.min(3, transform.scale + 0.1);
            applyText(type);
        });

        $("#btn-text-zoom-out")?.addEventListener("click", () => {
            const type = selectedTextType();
            if (!type) return;

            const transform = textState(type);
            transform.scale = Math.max(0.3, transform.scale - 0.1);
            applyText(type);
        });

        $("#btn-text-rotate-left")?.addEventListener("click", () => {
            const type = selectedTextType();
            if (!type) return;

            const transform = textState(type);
            transform.rotation -= 15;
            applyText(type);
        });

        $("#btn-text-reset")?.addEventListener("click", () => {
            const type = selectedTextType();
            if (!type) return;

            const transform = textState(type);
            const defaultFont =
                type === "main"
                    ? "'Dancing Script', cursive"
                    : "'Caveat', cursive";

            Object.assign(transform, {
                x: 0,
                y: 0,
                scale: 1,
                rotation: 0,
                fontFamily: defaultFont,
                color: "#372a32"
            });

            applyText(type);
            updateSelectionUI();
        });

        $("#btn-text-color")?.addEventListener("click", () => {
            const type = selectedTextType();
            if (!type) return;

            const input = document.createElement("input");
            input.type = "color";
            input.value =
                textState(type).color ||
                "#372a32";

            input.addEventListener("input", () => {
                textState(type).color = input.value;
                applyText(type);
            });

            input.click();
        });

        current.fontFamily?.addEventListener("change", () => {
            const type = selectedTextType();
            if (!type) return;

            textState(type).fontFamily =
                current.fontFamily.value;

            current.fontFamily.style.fontFamily =
                current.fontFamily.value;

            applyText(type);
        });

        drag(
            current.userImage,
            "image",
            () => state.image,
            applyImage
        );

        drag(
            current.mainText,
            "main",
            () => state.main,
            () => applyText("main")
        );

        drag(
            current.secondaryText,
            "secondary",
            () => state.secondary,
            () => applyText("secondary")
        );

        current.preview?.addEventListener("click", (event) => {
            const editable = event.target.closest(
                "#preview-user-image, #preview-main-text, #preview-secondary-text"
            );

            if (!editable) {
                deselectObject();
            }
        });

        document.addEventListener("click", (event) => {
            if (!current.overlay.classList.contains("active")) {
                return;
            }

            if (
                event.target.closest(
                    "#preview-user-image, #preview-main-text, #preview-secondary-text, .image-editor-controls, .text-editor-controls"
                )
            ) {
                return;
            }

            deselectObject();
        });
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
