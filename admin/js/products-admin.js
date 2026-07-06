"use strict";

let adminProducts = [];
let variantCounter = 0;
let productSlugManuallyEdited = false;
let adminCategories = [];

const PRODUCT_TAB_LABELS = Object.freeze({
    general: "Información general",
    logistica: "Logística y despacho",
    seo: "SEO del producto",
    personalizacion: "Personalización",
    variantes: "Variantes"
});

document.addEventListener("admin:ready", () => {
    document.getElementById("product-new")
        ?.addEventListener("click", () => openProductForm());

    document.getElementById("product-refresh")
        ?.addEventListener("click", loadProducts);

    document.getElementById("product-search")
        ?.addEventListener("input", debounce(loadProducts, 300));

    document.getElementById("product-status")
        ?.addEventListener("change", loadProducts);

    document.getElementById("variant-add")
        ?.addEventListener("click", () => addVariant());

    document.getElementById("product-form")
        ?.addEventListener("submit", saveProduct);

    document.getElementById("products-table")
        ?.addEventListener("click", handleTableClick);

    document.getElementById("product-variants")
        ?.addEventListener("click", handleVariantClick);

    document.getElementById("product-variants")
        ?.addEventListener("input", handleVariantInput);

    document.querySelectorAll("[data-product-tab]")
        .forEach((button) => {
            button.addEventListener("click", () => {
                setActiveProductTab(button.dataset.productTab);
            });
        });

    document.getElementById("product-name")
        ?.addEventListener("input", handleProductNameInput);

    document.getElementById("product-slug")
        ?.addEventListener("input", () => {
            productSlugManuallyEdited = true;
            const input = document.getElementById("product-slug");
            input.value = slugify(input.value);
            updateProductFormStatus();
        });

    document.getElementById("product-slug-generate")
        ?.addEventListener("click", () => {
            const name = document.getElementById("product-name")?.value || "";
            document.getElementById("product-slug").value = slugify(name);
            productSlugManuallyEdited = false;
            updateProductFormStatus();
        });

    document.getElementById("product-sku")
        ?.addEventListener("input", (event) => {
            event.target.value = normalizeSkuClient(event.target.value);
            updateProductFormStatus();
        });

    document.getElementById("product-form")
        ?.addEventListener("input", updateProductFormStatus);

    document.getElementById("product-form")
        ?.addEventListener("change", updateProductFormStatus);

    loadAdminCategories();
    loadProducts();
});


async function loadAdminCategories() {
    try {
        const response = await AdminAPI.request("/admin/categorias");
        adminCategories = Array.isArray(response?.categorias) ? response.categorias : [];
        renderCategoryDatalist();
    } catch (error) {
        console.warn("No fue posible cargar categorías administrables:", error);
    }
}

function renderCategoryDatalist() {
    const list = document.getElementById("admin-product-categories-list");
    if (!list) return;

    list.innerHTML = adminCategories
        .filter((category) => category.activa !== false)
        .map((category) => `<option value="${AdminUI.escapeHtml(category.nombre)}"></option>`)
        .join("");
}

function debounce(callback, delay) {
    let timeout;

    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(...args), delay);
    };
}

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 140);
}

function normalizeSkuClient(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z0-9._-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^[-._]+|[-._]+$/g, "")
        .slice(0, 80);
}

function numberFrom(id) {
    const value = Number(document.getElementById(id)?.value || 0);
    return Number.isFinite(value) ? value : 0;
}

function stringFrom(id) {
    return document.getElementById(id)?.value.trim() || "";
}

function checkedFrom(id) {
    return Boolean(document.getElementById(id)?.checked);
}

function setActiveProductTab(tabName = "general") {
    const safeTab = PRODUCT_TAB_LABELS[tabName] ? tabName : "general";

    document.querySelectorAll("[data-product-tab]")
        .forEach((button) => {
            const active = button.dataset.productTab === safeTab;
            button.classList.toggle("active", active);
            button.setAttribute("aria-selected", String(active));
        });

    document.querySelectorAll("[data-product-panel]")
        .forEach((panel) => {
            const active = panel.dataset.productPanel === safeTab;
            panel.hidden = !active;
            panel.classList.toggle("active", active);
        });

    const subtitle = document.getElementById("product-modal-subtitle");
    if (subtitle) subtitle.textContent = PRODUCT_TAB_LABELS[safeTab];
}

function handleProductNameInput() {
    if (!productSlugManuallyEdited) {
        document.getElementById("product-slug").value = slugify(
            document.getElementById("product-name").value
        );
    }

    updateProductFormStatus();
}

async function loadProducts() {
    const container = document.getElementById("products-table");
    AdminUI.showLoading(container, "Cargando productos...");

    try {
        const params = new URLSearchParams();
        const search = stringFrom("product-search");
        const status = document.getElementById("product-status")?.value || "";

        if (search) params.set("buscar", search);
        if (status) params.set("activo", status);

        const endpoint = `/admin/productos${params.toString() ? `?${params}` : ""}`;
        adminProducts = await AdminAPI.request(endpoint);
        renderProducts();
    } catch (error) {
        container.innerHTML = `
            <div class="admin-empty">
                ${AdminUI.escapeHtml(error.message)}
            </div>
        `;
    }
}

function firstImage(product) {
    const direct = Array.isArray(product.imagenes)
        ? product.imagenes[0]
        : null;

    if (typeof direct === "string") return direct;
    if (direct?.url) return direct.url;

    for (const variant of product.variantes || []) {
        const image = variant?.imagenes?.[0];
        if (typeof image === "string") return image;
        if (image?.url) return image.url;
        if (variant?.imagen) return variant.imagen;
    }

    return CONFIG.placeholderImage;
}

function productQuality(product) {
    const dimensions = product.dimensiones || {};
    const seo = product.seo || {};
    const checks = [
        Boolean(product.nombre),
        Number(product.precio) > 0,
        Boolean(product.sku),
        Boolean(product.categoriaPrincipal),
        String(product.descripcion || "").trim().length >= 40,
        normalizeImageUrls(product.imagenes).length > 0 || (product.variantes || []).some((item) => normalizeImageUrls(item.imagenes).length > 0),
        Number(product.pesoGramos) > 0,
        Number(dimensions.largoCm) > 0 && Number(dimensions.anchoCm) > 0 && Number(dimensions.altoCm) > 0,
        Boolean(seo.titulo),
        Boolean(seo.descripcion)
    ];

    const completed = checks.filter(Boolean).length;
    return {
        completed,
        total: checks.length,
        percent: Math.round((completed / checks.length) * 100)
    };
}

function renderProducts() {
    const container = document.getElementById("products-table");

    if (!adminProducts.length) {
        container.innerHTML = `<div class="admin-empty">No se encontraron productos.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="admin-table admin-product-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Categoría</th>
                    <th>Ficha</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${adminProducts.map((product) => {
                    const quality = productQuality(product);
                    const qualityClass = quality.percent >= 80
                        ? "success"
                        : quality.percent >= 50
                            ? "warning"
                            : "danger";

                    return `
                        <tr>
                            <td>
                                <div class="admin-table-product">
                                    <img src="${AdminUI.escapeHtml(firstImage(product))}" alt="">
                                    <div>
                                        <strong>${AdminUI.escapeHtml(product.nombre)}</strong>
                                        <small>SKU: ${AdminUI.escapeHtml(product.sku || "Pendiente")}</small>
                                        <small>${AdminUI.escapeHtml(product.marca || "Mommy Crafts")}</small>
                                    </div>
                                </div>
                            </td>
                            <td><strong>${AdminUI.money(product.precio)}</strong></td>
                            <td>
                                <span class="admin-status ${Number(product.stock) === 0 ? "danger" : Number(product.stock) <= 5 ? "warning" : "success"}">
                                    ${Number(product.stock) || 0}
                                </span>
                            </td>
                            <td>${AdminUI.escapeHtml(product.categoriaPrincipal || "—")}</td>
                            <td>
                                <span class="admin-status ${qualityClass}" title="${quality.completed} de ${quality.total} datos clave completos">
                                    ${quality.percent}%
                                </span>
                            </td>
                            <td>
                                <span class="admin-status ${product.activo !== false ? "success" : "danger"}">
                                    ${product.activo !== false ? "Activo" : "Inactivo"}
                                </span>
                            </td>
                            <td>
                                <div class="admin-toolbar-group">
                                    <button class="admin-button secondary small" type="button" data-edit-product="${product._id}">Editar</button>
                                    <button class="admin-button danger small" type="button" data-delete-product="${product._id}">Desactivar</button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;
}

function handleTableClick(event) {
    const edit = event.target.closest("[data-edit-product]");

    if (edit) {
        const product = adminProducts.find(
            (item) => String(item._id) === String(edit.dataset.editProduct)
        );
        openProductForm(product);
        return;
    }

    const remove = event.target.closest("[data-delete-product]");
    if (remove) deactivateProduct(remove.dataset.deleteProduct);
}

async function deactivateProduct(id) {
    if (!AdminUI.confirmAction("El producto dejará de aparecer en la tienda. ¿Continuar?")) {
        return;
    }

    try {
        await AdminAPI.request(`/admin/productos/${id}`, { method: "DELETE" });
        AdminUI.toast("Producto desactivado.", "success");
        loadProducts();
    } catch (error) {
        AdminUI.toast(error.message, "error");
    }
}

function setValue(id, value = "") {
    const element = document.getElementById(id);
    if (element) element.value = value ?? "";
}

function setChecked(id, value) {
    const element = document.getElementById(id);
    if (element) element.checked = Boolean(value);
}

function openProductForm(product = null) {
    const form = document.getElementById("product-form");
    form.reset();
    setActiveProductTab("general");

    setValue("product-id", product?._id || "");
    document.getElementById("product-modal-title").textContent = product
        ? "Editar producto"
        : "Nuevo producto";

    setValue("product-name", product?.nombre || "");
    setValue("product-sku", product?.sku || "");
    setValue("product-brand", product?.marca || "Mommy Crafts");
    setValue("product-barcode", product?.codigoBarras || "");
    setValue("product-price", product?.precio ?? "");
    setValue("product-original-price", product?.precioOriginal || "");
    setValue("product-stock", product?.stock ?? 0);
    setValue("product-order", product?.orden ?? 0);
    setValue("product-preparation-days", product?.diasPreparacion ?? 3);
    setValue("product-main-category", product?.categoriaPrincipal || "");
    setValue(
        "product-categories",
        Array.isArray(product?.categorias) ? product.categorias.join(", ") : product?.categorias || ""
    );
    setValue(
        "product-sizes",
        Array.isArray(product?.tallas) ? product.tallas.join(", ") : product?.tallas || ""
    );
    setValue("product-badge", product?.insignia || "");
    setValue("product-description", product?.descripcion || "");
    setValue("product-images", normalizeImageUrls(product?.imagenes).join("\n"));
    setValue("product-characteristics", characteristicsToText(product?.caracteristicas));

    const dimensions = product?.dimensiones || {};
    setValue("product-weight", product?.pesoGramos || "");
    setValue("product-length", dimensions.largoCm || "");
    setValue("product-width", dimensions.anchoCm || "");
    setValue("product-height", dimensions.altoCm || "");

    const slug = product?.slug || slugify(product?.nombre || "");
    setValue("product-slug", slug);
    productSlugManuallyEdited = Boolean(product);

    const seo = product?.seo || {};
    setValue("product-seo-title", seo.titulo || "");
    setValue("product-seo-description", seo.descripcion || "");
    setValue(
        "product-seo-keywords",
        Array.isArray(seo.palabrasClave) ? seo.palabrasClave.join(", ") : seo.palabrasClave || ""
    );
    setValue("product-seo-image", seo.imagen || "");
    setChecked("product-seo-noindex", seo.noIndex);

    setChecked("product-active", product?.activo !== false);
    setChecked("product-publish", product?.publicarCatalogo !== false);
    setChecked("product-featured", product?.destacado);
    setChecked("product-customizable", product?.personalizable);

    const delivery = product?.entrega && typeof product.entrega === "object"
        ? product.entrega
        : {};
    const shipping = delivery.envio && typeof delivery.envio === "object"
        ? delivery.envio
        : {};
    const pickup = delivery.retiro && typeof delivery.retiro === "object"
        ? delivery.retiro
        : {};

    setChecked("shipping-enabled", shipping.habilitado !== false);
    setValue(
        "shipping-instructions",
        shipping.instrucciones || CONFIG.DELIVERY_DEFAULTS.shipping.instructions
    );
    setChecked("pickup-enabled", pickup.habilitado !== false);
    setValue(
        "pickup-instructions",
        pickup.instrucciones || CONFIG.DELIVERY_DEFAULTS.pickup.instructions
    );

    const light = product?.personalizacionLigera && typeof product.personalizacionLigera === "object"
        ? product.personalizacionLigera
        : {};

    setChecked("light-enabled", light.habilitada);
    setChecked("light-name", light.permitirNombre);
    setChecked("light-image", light.permitirImagen);
    setChecked("light-observation", light.permitirObservacion);
    setValue("light-image-count", String(light.cantidadMaximaImagenes || 1));
    setValue("light-description", light.descripcion || "");
    setValue("light-notice", light.aviso || "");

    const variants = document.getElementById("product-variants");
    variants.innerHTML = "";
    variantCounter = 0;

    for (const variant of product?.variantes || []) {
        addVariant(variant, false);
    }

    updateVariantsEmptyState();
    updateProductFormStatus();
    AdminUI.openModal("product-modal");
}

function normalizeImageUrls(images) {
    if (!Array.isArray(images)) return [];

    return images
        .map((image) => {
            if (typeof image === "string") return image;
            return image?.url || image?.secure_url || image?.imagen || "";
        })
        .filter(Boolean);
}

function characteristicsToText(value) {
    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (typeof item === "string") return item;
                return item?.titulo ? `${item.titulo}: ${item.valor || ""}` : "";
            })
            .filter(Boolean)
            .join("\n");
    }

    if (value && typeof value === "object") {
        return Object.entries(value)
            .map(([key, item]) => `${key}: ${item}`)
            .join("\n");
    }

    return value || "";
}

function addVariant(variant = {}, focus = true) {
    variantCounter += 1;
    const dimensions = variant.dimensiones || {};
    const container = document.getElementById("product-variants");
    const card = document.createElement("article");

    card.className = "admin-variant-card";
    card.dataset.variantIndex = String(variantCounter);
    card.innerHTML = `
        <div class="admin-variant-card-header">
            <div>
                <span>Variante</span>
                <strong>${variantCounter}</strong>
            </div>
            <button class="admin-button danger small" type="button" data-remove-variant>Quitar</button>
        </div>

        <div class="admin-form-grid">
            <div class="admin-field">
                <label>Nombre del color o presentación</label>
                <input data-variant-field="nombre" maxlength="120" value="${AdminUI.escapeHtml(variant.nombre || variant.color || "")}" placeholder="Ej. Azul marino">
            </div>

            <div class="admin-field">
                <label>Código hexadecimal</label>
                <input data-variant-field="codigoHex" maxlength="20" value="${AdminUI.escapeHtml(variant.codigoHex || variant.colorHex || "")}" placeholder="#1E2A44">
            </div>

            <div class="admin-field">
                <label>SKU de variante</label>
                <input data-variant-field="sku" maxlength="80" value="${AdminUI.escapeHtml(variant.sku || "")}" placeholder="Se generará automáticamente">
            </div>

            <div class="admin-field">
                <label>Stock</label>
                <input data-variant-field="stock" type="number" min="0" step="1" value="${Number(variant.stock ?? 0)}">
            </div>

            <div class="admin-field">
                <label>Precio especial</label>
                <input data-variant-field="precio" type="number" min="0" step="1" value="${variant.precio ?? ""}" placeholder="Usar precio general">
            </div>

            <div class="admin-field">
                <label>Peso embalado (g)</label>
                <input data-variant-field="pesoGramos" type="number" min="0" max="100000" step="1" value="${variant.pesoGramos || ""}" placeholder="Usar peso general">
            </div>

            <div class="admin-field">
                <label>Largo (cm)</label>
                <input data-variant-field="largoCm" type="number" min="0" max="1000" step="0.1" value="${dimensions.largoCm || ""}" placeholder="General">
            </div>

            <div class="admin-field">
                <label>Ancho (cm)</label>
                <input data-variant-field="anchoCm" type="number" min="0" max="1000" step="0.1" value="${dimensions.anchoCm || ""}" placeholder="General">
            </div>

            <div class="admin-field">
                <label>Alto (cm)</label>
                <input data-variant-field="altoCm" type="number" min="0" max="1000" step="0.1" value="${dimensions.altoCm || ""}" placeholder="General">
            </div>

            <div class="admin-field full">
                <label>Imágenes de la variante</label>
                <textarea data-variant-field="imagenes" rows="4" placeholder="Una URL por línea">${AdminUI.escapeHtml(normalizeImageUrls(variant.imagenes || [variant.imagen]).join("\n"))}</textarea>
            </div>
        </div>
    `;

    container.appendChild(card);
    updateVariantsEmptyState();
    updateProductFormStatus();

    if (focus) {
        card.querySelector('[data-variant-field="nombre"]')?.focus();
    }
}

function handleVariantClick(event) {
    const button = event.target.closest("[data-remove-variant]");
    if (!button) return;

    button.closest(".admin-variant-card")?.remove();
    updateVariantsEmptyState();
    updateProductFormStatus();
}

function handleVariantInput(event) {
    if (event.target.matches('[data-variant-field="sku"]')) {
        event.target.value = normalizeSkuClient(event.target.value);
    }

    updateProductFormStatus();
}

function updateVariantsEmptyState() {
    const hasVariants = document.querySelectorAll(".admin-variant-card").length > 0;
    const empty = document.getElementById("product-variants-empty");
    if (empty) empty.hidden = hasVariants;
}

function parseLineList(value) {
    return String(value || "")
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function parseCharacteristics(value) {
    return parseLineList(value).map((line) => {
        const separator = line.indexOf(":");

        if (separator < 1) {
            return { titulo: "Detalle", valor: line };
        }

        return {
            titulo: line.slice(0, separator).trim(),
            valor: line.slice(separator + 1).trim()
        };
    });
}

function collectVariants() {
    return [...document.querySelectorAll(".admin-variant-card")]
        .map((card) => {
            const get = (name) => card.querySelector(`[data-variant-field="${name}"]`)?.value.trim() || "";
            const name = get("nombre");
            if (!name) return null;

            const price = get("precio");

            return {
                nombre: name,
                codigoHex: get("codigoHex"),
                stock: Number(get("stock")) || 0,
                ...(price ? { precio: Number(price) } : {}),
                sku: normalizeSkuClient(get("sku")),
                activo: true,
                pesoGramos: Number(get("pesoGramos")) || 0,
                dimensiones: {
                    largoCm: Number(get("largoCm")) || 0,
                    anchoCm: Number(get("anchoCm")) || 0,
                    altoCm: Number(get("altoCm")) || 0
                },
                imagenes: parseLineList(get("imagenes")).map((url, index) => ({
                    url,
                    principal: index === 0,
                    orden: index + 1
                }))
            };
        })
        .filter(Boolean);
}

function updateProductFormStatus() {
    const title = stringFrom("product-seo-title");
    const description = stringFrom("product-seo-description");
    const productName = stringFrom("product-name");
    const slug = stringFrom("product-slug") || slugify(productName);

    document.getElementById("product-seo-title-count").textContent = String(title.length);
    document.getElementById("product-seo-description-count").textContent = String(description.length);

    document.getElementById("product-seo-preview-title").textContent =
        title || `${productName || "Nombre del producto"} | Mommy Crafts`;

    document.getElementById("product-seo-preview-description").textContent =
        description || "Agrega una descripción SEO clara para explicar qué hace especial este producto.";

    document.getElementById("product-seo-preview-url").textContent =
        `mommycrafts.onrender.com/producto/${slug || "nombre-del-producto"}`;

    const checks = [
        { label: "nombre", ok: Boolean(productName) },
        { label: "precio", ok: numberFrom("product-price") > 0 },
        { label: "categoría", ok: Boolean(stringFrom("product-main-category")) },
        { label: "descripción", ok: stringFrom("product-description").length >= 40 },
        {
            label: "imagen",
            ok:
                parseLineList(document.getElementById("product-images")?.value).length > 0 ||
                [...document.querySelectorAll(".admin-variant-card textarea[data-variant-field='imagenes']")]
                    .some((textarea) => parseLineList(textarea.value).length > 0)
        },
        { label: "peso", ok: numberFrom("product-weight") > 0 },
        { label: "medidas", ok: numberFrom("product-length") > 0 && numberFrom("product-width") > 0 && numberFrom("product-height") > 0 },
        { label: "título SEO", ok: Boolean(title) },
        { label: "descripción SEO", ok: Boolean(description) },
        { label: "método de entrega", ok: checkedFrom("shipping-enabled") || checkedFrom("pickup-enabled") }
    ];

    const completed = checks.filter((item) => item.ok).length;
    const percent = Math.round((completed / checks.length) * 100);
    const missing = checks.filter((item) => !item.ok).map((item) => item.label);

    document.getElementById("product-completion-label").textContent = `Ficha ${percent}% completa`;
    document.getElementById("product-completion-help").textContent = missing.length
        ? `Pendiente: ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? "…" : "."}`
        : "La ficha contiene todos los datos recomendados para esta etapa.";
    document.getElementById("product-completion-bar").style.width = `${percent}%`;
}

async function saveProduct(event) {
    event.preventDefault();

    const id = stringFrom("product-id");
    const lightEnabled = checkedFrom("light-enabled");
    const slug = stringFrom("product-slug") || slugify(stringFrom("product-name"));

    const data = {
        nombre: stringFrom("product-name"),
        slug,
        sku: normalizeSkuClient(stringFrom("product-sku")),
        marca: stringFrom("product-brand") || "Mommy Crafts",
        codigoBarras: stringFrom("product-barcode"),
        precio: numberFrom("product-price"),
        precioOriginal: numberFrom("product-original-price"),
        stock: numberFrom("product-stock"),
        orden: numberFrom("product-order"),
        diasPreparacion: Math.min(90, Math.max(1, numberFrom("product-preparation-days") || 3)),
        pesoGramos: Math.max(0, numberFrom("product-weight")),
        dimensiones: {
            largoCm: Math.max(0, numberFrom("product-length")),
            anchoCm: Math.max(0, numberFrom("product-width")),
            altoCm: Math.max(0, numberFrom("product-height"))
        },
        categoriaPrincipal: stringFrom("product-main-category"),
        categorias: stringFrom("product-categories")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        tallas: document.getElementById("product-sizes").value
            .split(/[,\n]/)
            .map((item) => item.trim().replace(/\s*-\s*/g, "-"))
            .filter((item, index, values) =>
                item &&
                /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+(?:-[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+)*$/.test(item) &&
                values.indexOf(item) === index
            ),
        insignia: stringFrom("product-badge"),
        descripcion: stringFrom("product-description"),
        imagenes: parseLineList(document.getElementById("product-images").value)
            .map((url, index) => ({ url, principal: index === 0, orden: index + 1 })),
        caracteristicas: parseCharacteristics(document.getElementById("product-characteristics").value),
        activo: checkedFrom("product-active"),
        publicarCatalogo: checkedFrom("product-publish"),
        destacado: checkedFrom("product-featured"),
        personalizable: checkedFrom("product-customizable"),
        seo: {
            titulo: stringFrom("product-seo-title"),
            descripcion: stringFrom("product-seo-description"),
            palabrasClave: stringFrom("product-seo-keywords")
                .split(/[,\n]/)
                .map((item) => item.trim())
                .filter(Boolean),
            imagen: stringFrom("product-seo-image"),
            noIndex: checkedFrom("product-seo-noindex")
        },
        entrega: {
            envio: {
                habilitado: checkedFrom("shipping-enabled"),
                instrucciones: stringFrom("shipping-instructions") || CONFIG.DELIVERY_DEFAULTS.shipping.instructions
            },
            retiro: {
                habilitado: checkedFrom("pickup-enabled"),
                instrucciones: stringFrom("pickup-instructions") || CONFIG.DELIVERY_DEFAULTS.pickup.instructions
            }
        },
        variantes: collectVariants(),
        personalizacionLigera: lightEnabled
            ? {
                habilitada: true,
                permitirNombre: checkedFrom("light-name"),
                permitirImagen: checkedFrom("light-image"),
                permitirObservacion: checkedFrom("light-observation"),
                cantidadMaximaImagenes: Number(document.getElementById("light-image-count").value) || 1,
                descripcion: stringFrom("light-description"),
                aviso: stringFrom("light-notice")
            }
            : { habilitada: false }
    };

    if (!data.nombre || data.precio < 0) {
        setActiveProductTab("general");
        AdminUI.toast("Revisa el nombre y el precio del producto.", "error");
        return;
    }

    if (!data.entrega.envio.habilitado && !data.entrega.retiro.habilitado) {
        setActiveProductTab("logistica");
        AdminUI.toast("Debes habilitar al menos un método de entrega.", "error");
        return;
    }

    const saveButton = document.getElementById("product-save");
    saveButton.disabled = true;

    try {
        const saved = await AdminAPI.request(
            id ? `/admin/productos/${id}` : "/admin/productos",
            {
                method: id ? "PATCH" : "POST",
                body: data
            }
        );

        AdminUI.toast(
            `Producto guardado. SKU: ${saved.sku || "generado"}.`,
            "success"
        );
        AdminUI.closeModal("product-modal");
        await loadProducts();
    } catch (error) {
        AdminUI.toast(error.message, "error");
    } finally {
        saveButton.disabled = false;
    }
}
