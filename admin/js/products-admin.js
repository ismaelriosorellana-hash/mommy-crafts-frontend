"use strict";

let adminProducts = [];
let variantCounter = 0;

document.addEventListener(
    "admin:ready",
    () => {
        document
            .getElementById(
                "product-new"
            )
            .addEventListener(
                "click",
                () => openProductForm()
            );

        document
            .getElementById(
                "product-refresh"
            )
            .addEventListener(
                "click",
                loadProducts
            );

        document
            .getElementById(
                "product-search"
            )
            .addEventListener(
                "input",
                debounce(
                    loadProducts,
                    300
                )
            );

        document
            .getElementById(
                "product-status"
            )
            .addEventListener(
                "change",
                loadProducts
            );

        document
            .getElementById(
                "variant-add"
            )
            .addEventListener(
                "click",
                () => addVariant()
            );

        document
            .getElementById(
                "product-form"
            )
            .addEventListener(
                "submit",
                saveProduct
            );

        document
            .getElementById(
                "products-table"
            )
            .addEventListener(
                "click",
                handleTableClick
            );

        document
            .getElementById(
                "product-variants"
            )
            .addEventListener(
                "click",
                (event) => {
                    const button =
                        event.target.closest(
                            "[data-remove-variant]"
                        );

                    button
                        ?.closest(
                            ".admin-variant-card"
                        )
                        ?.remove();
                }
            );

        loadProducts();
    }
);

function debounce(callback, delay) {
    let timeout;

    return (...args) => {
        clearTimeout(timeout);
        timeout =
            setTimeout(
                () => callback(...args),
                delay
            );
    };
}

async function loadProducts() {
    const container =
        document.getElementById(
            "products-table"
        );

    AdminUI.showLoading(
        container,
        "Cargando productos..."
    );

    try {
        const params =
            new URLSearchParams();

        const search =
            document.getElementById(
                "product-search"
            ).value.trim();

        const status =
            document.getElementById(
                "product-status"
            ).value;

        if (search) {
            params.set(
                "buscar",
                search
            );
        }

        if (status) {
            params.set(
                "activo",
                status
            );
        }

        const endpoint =
            `/admin/productos${params.toString() ? `?${params}` : ""}`;

        adminProducts =
            await AdminAPI.request(
                endpoint
            );

        renderProducts();
    } catch (error) {
        container.innerHTML = `
            <div class="admin-empty">
                ${AdminUI.escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}

function firstImage(product) {
    const direct =
        Array.isArray(
            product.imagenes
        )
            ? product.imagenes[0]
            : null;

    if (typeof direct === "string") {
        return direct;
    }

    if (direct?.url) {
        return direct.url;
    }

    for (
        const variant of
        product.variantes || []
    ) {
        const image =
            variant?.imagenes?.[0];

        if (typeof image === "string") {
            return image;
        }

        if (image?.url) {
            return image.url;
        }

        if (variant?.imagen) {
            return variant.imagen;
        }
    }

    return CONFIG.placeholderImage;
}

function renderProducts() {
    const container =
        document.getElementById(
            "products-table"
        );

    if (!adminProducts.length) {
        container.innerHTML = `
            <div class="admin-empty">
                No se encontraron productos.
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th>Variantes</th>
                    <th>Acciones</th>
                </tr>
            </thead>

            <tbody>
                ${adminProducts.map(
                    (product) => `
                    <tr>
                        <td>
                            <div class="admin-table-product">
                                <img
                                    src="${AdminUI.escapeHtml(firstImage(product))}"
                                    alt=""
                                >
                                <div>
                                    <strong>${AdminUI.escapeHtml(product.nombre)}</strong>
                                    <small>${AdminUI.escapeHtml(product.insignia || "Sin insignia")}</small>
                                </div>
                            </div>
                        </td>

                        <td>
                            <strong>${AdminUI.money(product.precio)}</strong>
                        </td>

                        <td>
                            <span class="admin-status ${Number(product.stock) === 0 ? "danger" : Number(product.stock) <= 5 ? "warning" : "success"}">
                                ${Number(product.stock) || 0}
                            </span>
                        </td>

                        <td>${AdminUI.escapeHtml(product.categoriaPrincipal || "—")}</td>

                        <td>
                            <span class="admin-status ${product.activo !== false ? "success" : "danger"}">
                                ${product.activo !== false ? "Activo" : "Inactivo"}
                            </span>
                        </td>

                        <td>${Array.isArray(product.variantes) ? product.variantes.length : 0}</td>

                        <td>
                            <div class="admin-toolbar-group">
                                <button
                                    class="admin-button secondary small"
                                    type="button"
                                    data-edit-product="${product._id}"
                                >
                                    Editar
                                </button>

                                <button
                                    class="admin-button danger small"
                                    type="button"
                                    data-delete-product="${product._id}"
                                >
                                    Desactivar
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function handleTableClick(event) {
    const edit =
        event.target.closest(
            "[data-edit-product]"
        );

    if (edit) {
        const product =
            adminProducts.find(
                (item) =>
                    String(item._id) ===
                    String(
                        edit.dataset.editProduct
                    )
            );

        openProductForm(product);
        return;
    }

    const remove =
        event.target.closest(
            "[data-delete-product]"
        );

    if (remove) {
        deactivateProduct(
            remove.dataset.deleteProduct
        );
    }
}

async function deactivateProduct(id) {
    if (
        !AdminUI.confirmAction(
            "El producto dejará de aparecer en la tienda. ¿Continuar?"
        )
    ) {
        return;
    }

    try {
        await AdminAPI.request(
            `/admin/productos/${id}`,
            {
                method: "DELETE"
            }
        );

        AdminUI.toast(
            "Producto desactivado.",
            "success"
        );

        loadProducts();
    } catch (error) {
        AdminUI.toast(
            error.message,
            "error"
        );
    }
}

function openProductForm(product = null) {
    const form =
        document.getElementById(
            "product-form"
        );

    form.reset();

    document.getElementById(
        "product-id"
    ).value =
        product?._id || "";

    document.getElementById(
        "product-modal-title"
    ).textContent =
        product
            ? "Editar producto"
            : "Nuevo producto";

    document.getElementById(
        "product-name"
    ).value =
        product?.nombre || "";

    document.getElementById(
        "product-price"
    ).value =
        product?.precio ?? "";

    document.getElementById(
        "product-original-price"
    ).value =
        product?.precioOriginal || "";

    document.getElementById(
        "product-stock"
    ).value =
        product?.stock ?? 0;

    document.getElementById(
        "product-order"
    ).value =
        product?.orden ?? 0;

    document.getElementById(
        "product-main-category"
    ).value =
        product?.categoriaPrincipal || "";

    document.getElementById(
        "product-categories"
    ).value =
        Array.isArray(
            product?.categorias
        )
            ? product.categorias.join(", ")
            : product?.categorias || "";

    document.getElementById(
        "product-badge"
    ).value =
        product?.insignia || "";

    document.getElementById(
        "product-description"
    ).value =
        product?.descripcion || "";

    document.getElementById(
        "product-images"
    ).value =
        normalizeImageUrls(
            product?.imagenes
        ).join("\n");

    document.getElementById(
        "product-characteristics"
    ).value =
        characteristicsToText(
            product?.caracteristicas
        );

    document.getElementById(
        "product-active"
    ).checked =
        product?.activo !== false;

    document.getElementById(
        "product-publish"
    ).checked =
        product?.publicarCatalogo !== false;

    document.getElementById(
        "product-featured"
    ).checked =
        Boolean(
            product?.destacado
        );

    document.getElementById(
        "product-customizable"
    ).checked =
        Boolean(
            product?.personalizable
        );

    const light =
        product?.personalizacionLigera &&
        typeof product.personalizacionLigera ===
            "object"
            ? product.personalizacionLigera
            : {};

    document.getElementById(
        "light-enabled"
    ).checked =
        Boolean(light.habilitada);

    document.getElementById(
        "light-name"
    ).checked =
        Boolean(light.permitirNombre);

    document.getElementById(
        "light-image"
    ).checked =
        Boolean(light.permitirImagen);

    document.getElementById(
        "light-observation"
    ).checked =
        Boolean(
            light.permitirObservacion
        );

    document.getElementById(
        "light-image-count"
    ).value =
        String(
            light.cantidadMaximaImagenes ||
            1
        );

    document.getElementById(
        "light-description"
    ).value =
        light.descripcion || "";

    document.getElementById(
        "light-notice"
    ).value =
        light.aviso || "";

    const variants =
        document.getElementById(
            "product-variants"
        );

    variants.innerHTML = "";
    variantCounter = 0;

    for (
        const variant of
        product?.variantes || []
    ) {
        addVariant(variant);
    }

    AdminUI.openModal(
        "product-modal"
    );
}

function normalizeImageUrls(images) {
    if (!Array.isArray(images)) {
        return [];
    }

    return images
        .map((image) => {
            if (
                typeof image ===
                "string"
            ) {
                return image;
            }

            return (
                image?.url ||
                image?.secure_url ||
                image?.imagen ||
                ""
            );
        })
        .filter(Boolean);
}

function characteristicsToText(value) {
    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (
                    typeof item ===
                    "string"
                ) {
                    return item;
                }

                return item?.titulo
                    ? `${item.titulo}: ${item.valor || ""}`
                    : "";
            })
            .filter(Boolean)
            .join("\n");
    }

    if (
        value &&
        typeof value === "object"
    ) {
        return Object.entries(value)
            .map(
                ([key, item]) =>
                    `${key}: ${item}`
            )
            .join("\n");
    }

    return value || "";
}

function addVariant(variant = {}) {
    variantCounter += 1;

    const container =
        document.getElementById(
            "product-variants"
        );

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "admin-variant-card";

    card.dataset.variantIndex =
        String(variantCounter);

    card.innerHTML = `
        <div class="admin-variant-card-header">
            <strong>Color ${variantCounter}</strong>

            <button
                class="admin-button danger small"
                type="button"
                data-remove-variant
            >
                Quitar
            </button>
        </div>

        <div class="admin-form-grid">
            <div class="admin-field">
                <label>Nombre del color</label>
                <input data-variant-field="nombre" value="${AdminUI.escapeHtml(variant.nombre || variant.color || "")}">
            </div>

            <div class="admin-field">
                <label>Código hexadecimal</label>
                <input data-variant-field="codigoHex" value="${AdminUI.escapeHtml(variant.codigoHex || variant.colorHex || "")}" placeholder="#F3B6C6">
            </div>

            <div class="admin-field">
                <label>Stock</label>
                <input data-variant-field="stock" type="number" min="0" step="1" value="${Number(variant.stock ?? 0)}">
            </div>

            <div class="admin-field">
                <label>Precio especial</label>
                <input data-variant-field="precio" type="number" min="0" step="1" value="${variant.precio ?? ""}">
            </div>

            <div class="admin-field">
                <label>SKU</label>
                <input data-variant-field="sku" value="${AdminUI.escapeHtml(variant.sku || "")}">
            </div>

            <div class="admin-field full">
                <label>Imágenes del color</label>
                <textarea data-variant-field="imagenes" placeholder="Una URL por línea">${AdminUI.escapeHtml(normalizeImageUrls(variant.imagenes || [variant.imagen]).join("\n"))}</textarea>
            </div>
        </div>
    `;

    container.appendChild(card);
}

function parseLineList(value) {
    return String(value || "")
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function parseCharacteristics(value) {
    return parseLineList(value)
        .map((line) => {
            const separator =
                line.indexOf(":");

            if (separator < 1) {
                return {
                    titulo: "Detalle",
                    valor: line
                };
            }

            return {
                titulo:
                    line.slice(
                        0,
                        separator
                    ).trim(),
                valor:
                    line.slice(
                        separator + 1
                    ).trim()
            };
        });
}

function collectVariants() {
    return [
        ...document.querySelectorAll(
            ".admin-variant-card"
        )
    ]
        .map((card) => {
            const get =
                (name) =>
                    card.querySelector(
                        `[data-variant-field="${name}"]`
                    )?.value.trim() || "";

            const name = get("nombre");

            if (!name) return null;

            const price = get("precio");

            return {
                nombre: name,
                codigoHex:
                    get("codigoHex"),
                stock:
                    Number(
                        get("stock")
                    ) || 0,
                ...(price
                    ? {
                        precio:
                            Number(price)
                    }
                    : {}),
                sku: get("sku"),
                activo: true,
                imagenes:
                    parseLineList(
                        get("imagenes")
                    ).map(
                        (url, index) => ({
                            url,
                            principal:
                                index === 0,
                            orden:
                                index + 1
                        })
                    )
            };
        })
        .filter(Boolean);
}

async function saveProduct(event) {
    event.preventDefault();

    const id =
        document.getElementById(
            "product-id"
        ).value;

    const lightEnabled =
        document.getElementById(
            "light-enabled"
        ).checked;

    const data = {
        nombre:
            document.getElementById(
                "product-name"
            ).value.trim(),
        precio:
            Number(
                document.getElementById(
                    "product-price"
                ).value
            ) || 0,
        precioOriginal:
            Number(
                document.getElementById(
                    "product-original-price"
                ).value
            ) || 0,
        stock:
            Number(
                document.getElementById(
                    "product-stock"
                ).value
            ) || 0,
        orden:
            Number(
                document.getElementById(
                    "product-order"
                ).value
            ) || 0,
        categoriaPrincipal:
            document.getElementById(
                "product-main-category"
            ).value.trim(),
        categorias:
            document.getElementById(
                "product-categories"
            ).value
                .split(",")
                .map(
                    (item) =>
                        item.trim()
                )
                .filter(Boolean),
        insignia:
            document.getElementById(
                "product-badge"
            ).value.trim(),
        descripcion:
            document.getElementById(
                "product-description"
            ).value.trim(),
        imagenes:
            parseLineList(
                document.getElementById(
                    "product-images"
                ).value
            ).map(
                (url, index) => ({
                    url,
                    principal:
                        index === 0,
                    orden:
                        index + 1
                })
            ),
        caracteristicas:
            parseCharacteristics(
                document.getElementById(
                    "product-characteristics"
                ).value
            ),
        activo:
            document.getElementById(
                "product-active"
            ).checked,
        publicarCatalogo:
            document.getElementById(
                "product-publish"
            ).checked,
        destacado:
            document.getElementById(
                "product-featured"
            ).checked,
        personalizable:
            document.getElementById(
                "product-customizable"
            ).checked,
        variantes:
            collectVariants(),
        personalizacionLigera:
            lightEnabled
                ? {
                    habilitada: true,
                    permitirNombre:
                        document.getElementById(
                            "light-name"
                        ).checked,
                    permitirImagen:
                        document.getElementById(
                            "light-image"
                        ).checked,
                    permitirObservacion:
                        document.getElementById(
                            "light-observation"
                        ).checked,
                    cantidadMaximaImagenes:
                        Number(
                            document.getElementById(
                                "light-image-count"
                            ).value
                        ) || 1,
                    descripcion:
                        document.getElementById(
                            "light-description"
                        ).value.trim(),
                    aviso:
                        document.getElementById(
                            "light-notice"
                        ).value.trim()
                }
                : {
                    habilitada: false
                }
    };

    const saveButton =
        document.getElementById(
            "product-save"
        );

    saveButton.disabled = true;

    try {
        await AdminAPI.request(
            id
                ? `/admin/productos/${id}`
                : "/admin/productos",
            {
                method:
                    id ? "PATCH" : "POST",
                body: data
            }
        );

        AdminUI.toast(
            "Producto guardado correctamente.",
            "success"
        );

        AdminUI.closeModal(
            "product-modal"
        );

        loadProducts();
    } catch (error) {
        AdminUI.toast(
            error.message,
            "error"
        );
    } finally {
        saveButton.disabled = false;
    }
}
