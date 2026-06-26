"use strict";

(function () {
    const VIEW_STORAGE_KEY = "mommyCraftsProductViews";
    const VIEW_SESSION_KEY = "mommyCraftsViewedThisSession";

    const state = {
        productos: [],
        productoActual: null,
        varianteActual: null,
        imagenesDetalleActual: [],
        galeriaDetalleActual: [],
        indiceImagenActual: 0,
        loadPromise: null
    };

    function stringValue(value, fallback = "") {
        if (value === null || value === undefined) return fallback;
        return String(value).trim();
    }

    function numberValue(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function booleanValue(value, fallback = false) {
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value !== 0;

        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();

            if (["true", "verdadero", "1", "si", "sí"].includes(normalized)) {
                return true;
            }

            if (["false", "falso", "0", "no"].includes(normalized)) {
                return false;
            }
        }

        return fallback;
    }

    function normalizeText(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function normalizeStringArray(value) {
        if (Array.isArray(value)) {
            return [...new Set(
                value
                    .map((item) => stringValue(
                        typeof item === "object"
                            ? item.nombre ?? item.name ?? item.label ?? item.valor
                            : item
                    ))
                    .filter(Boolean)
            )];
        }

        const text = stringValue(value);

        if (!text) return [];

        return text
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }


function normalizeCharacteristics(value) {
    function createCharacteristic(label, detail) {
        const cleanLabel = stringValue(label);
        const cleanDetail = stringValue(detail);

        if (!cleanLabel && !cleanDetail) {
            return null;
        }

        return {
            label: cleanLabel,
            value: cleanDetail || cleanLabel
        };
    }

    function fromString(text) {
        const cleanText = stringValue(text);

        if (!cleanText) return null;

        const separatorIndex = cleanText.indexOf(":");

        if (separatorIndex > 0) {
            return createCharacteristic(
                cleanText.slice(0, separatorIndex),
                cleanText.slice(separatorIndex + 1)
            );
        }

        return createCharacteristic("", cleanText);
    }

    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (typeof item === "string") {
                    return fromString(item);
                }

                if (item && typeof item === "object") {
                    return createCharacteristic(
                        item.titulo ??
                        item.título ??
                        item.nombre ??
                        item.etiqueta ??
                        item.label ??
                        item.clave ??
                        item.key,
                        item.valor ??
                        item.descripcion ??
                        item.descripción ??
                        item.texto ??
                        item.detalle ??
                        item.value
                    );
                }

                return null;
            })
            .filter(Boolean);
    }

    if (
        value &&
        typeof value === "object"
    ) {
        return Object.entries(value)
            .map(([label, detail]) =>
                createCharacteristic(
                    label,
                    detail
                )
            )
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(/\n|\|/)
            .map(fromString)
            .filter(Boolean);
    }

    return [];
}

    function normalizeIds(value) {
        if (!Array.isArray(value)) return [];

        return value
            .map((item) => {
                if (typeof item === "string") return item.trim();

                if (item && typeof item === "object") {
                    return stringValue(item._id ?? item.id);
                }

                return "";
            })
            .filter(Boolean);
    }

    function normalizeImageUrl(value) {
        const raw = stringValue(value);

        if (!raw) return "";

        if (/^http:\/\/res\.cloudinary\.com\//i.test(raw)) {
            return raw.replace(/^http:\/\//i, "https://");
        }

        const driveFileMatch =
            raw.match(/drive\.google\.com\/file\/d\/([^/]+)/i);

        if (driveFileMatch?.[1]) {
            return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(driveFileMatch[1])}`;
        }

        try {
            const parsed = new URL(raw);

            if (
                parsed.hostname === "drive.google.com" &&
                parsed.searchParams.get("id")
            ) {
                return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(parsed.searchParams.get("id"))}`;
            }
        } catch {
            return raw;
        }

        return raw;
    }

    function normalizeImages(rawImages) {
        if (!Array.isArray(rawImages)) return [];

        return rawImages
            .map((image) => {
                if (typeof image === "string") {
                    return normalizeImageUrl(image);
                }

                if (image && typeof image === "object") {
                    return normalizeImageUrl(
                        image.url ??
                        image.src ??
                        image.imagen ??
                        image.imgUrl
                    );
                }

                return "";
            })
            .filter(Boolean);
    }



function normalizeLightCustomization(rawProduct) {
    const raw =
        rawProduct.personalizacionLigera ??
        rawProduct.personalizacionSimple ??
        rawProduct.personalizacionCatalogo ??
        null;

    if (!raw) {
        return {
            enabled: false,
            allowName: false,
            allowImage: false,
            allowObservation: false,
            maxImages: 1,
            description: "",
            notice: ""
        };
    }

    if (typeof raw !== "object") {
        const enabled = booleanValue(raw, false);

        return {
            enabled,
            allowName: enabled,
            allowImage: enabled,
            allowObservation: enabled,
            maxImages: 1,
            description: "",
            notice: ""
        };
    }

    const enabled = booleanValue(
        raw.habilitada ??
        raw.habilitado ??
        raw.activa ??
        raw.activo ??
        raw.enabled,
        true
    );

    const requestedMaxImages = numberValue(
        raw.cantidadMaximaImagenes ??
        raw.cantidadMáximaImagenes ??
        raw.maximoImagenes ??
        raw.máximoImagenes ??
        raw.maxImages,
        1
    );

    return {
        enabled,

        allowName:
            enabled &&
            booleanValue(
                raw.permitirNombre ??
                raw.nombre ??
                raw.allowName,
                true
            ),

        allowImage:
            enabled &&
            booleanValue(
                raw.permitirImagen ??
                raw.imagen ??
                raw.allowImage,
                true
            ),

        allowObservation:
            enabled &&
            booleanValue(
                raw.permitirObservacion ??
                raw.permitirObservación ??
                raw.observacion ??
                raw.observación ??
                raw.allowObservation,
                true
            ),

        maxImages:
            requestedMaxImages >= 2
                ? 2
                : 1,

        description:
            stringValue(
                raw.descripcion ??
                raw.descripción ??
                raw.description
            ),

        notice:
            stringValue(
                raw.aviso ??
                raw.nota ??
                raw.notice
            )
    };
}


function normalizeDelivery(rawProduct) {
    const raw =
        rawProduct?.entrega &&
        typeof rawProduct.entrega === "object"
            ? rawProduct.entrega
            : {};

    const shipping =
        raw.envio &&
        typeof raw.envio === "object"
            ? raw.envio
            : {};

    const pickup =
        raw.retiro &&
        typeof raw.retiro === "object"
            ? raw.retiro
            : {};

    return {
        shipping: {
            enabled: booleanValue(
                shipping.habilitado ??
                raw.envioHabilitado,
                CONFIG.DELIVERY_DEFAULTS.shipping.enabled
            ),
            instructions: stringValue(
                shipping.instrucciones ??
                raw.instruccionesEnvio,
                CONFIG.DELIVERY_DEFAULTS.shipping.instructions
            )
        },
        pickup: {
            enabled: booleanValue(
                pickup.habilitado ??
                raw.retiroHabilitado,
                CONFIG.DELIVERY_DEFAULTS.pickup.enabled
            ),
            instructions: stringValue(
                pickup.instrucciones ??
                raw.instruccionesRetiro,
                CONFIG.DELIVERY_DEFAULTS.pickup.instructions
            )
        }
    };
}

function normalizeColorCode(value) {
    const color = stringValue(value);
    if (!color) return "";
    if (/^#[0-9a-f]{3,8}$/i.test(color)) return color;
    if (/^[0-9a-f]{3,8}$/i.test(color)) return `#${color}`;
    return color;
}

function variantId(value, name, index) {
    const explicit = stringValue(value);
    if (explicit) return explicit;
    const slug = normalizeText(name)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return `${slug || "color"}-${index + 1}`;
}

function normalizeVariants(rawProduct, defaultImage, defaultImages = []) {
    const rawVariants =
        rawProduct.variantes ??
        rawProduct.colores ??
        rawProduct.opcionesColor ??
        [];

    const fallbackImages = defaultImages.length
        ? defaultImages
        : [defaultImage];

    const standardVariant = {
        id: "standard",
        nombre: "Estándar",
        colorHex: "",
        imagen: defaultImage,
        imagenes: fallbackImages,
        stock: null,
        precio: null,
        precioOriginal: null,
        sku: "",
        selectable: false
    };

    if (!Array.isArray(rawVariants) || rawVariants.length === 0) {
        return [standardVariant];
    }

    const variants = rawVariants
        .map((variant, index) => {
            if (typeof variant === "string") {
                const name = variant.trim();
                if (!name) return null;
                return {
                    id: variantId("", name, index),
                    nombre: name,
                    colorHex: "",
                    imagen: defaultImage,
                    imagenes: fallbackImages,
                    stock: null,
                    precio: null,
                    precioOriginal: null,
                    sku: "",
                    selectable: true
                };
            }

            if (!variant || typeof variant !== "object") return null;

            if (!booleanValue(
                variant.activo ?? variant.activa ?? variant.habilitado ?? variant.habilitada,
                true
            )) return null;

            const name = stringValue(
                variant.nombre ?? variant.color ?? variant.label,
                `Color ${index + 1}`
            );

            const variantImages = normalizeImages(
                variant.imagenes ?? variant.images ?? []
            );

            const singleImage = stringValue(
                variant.imgUrl ?? variant.imagen ?? variant.url ?? variant.secure_url
            );

            if (singleImage && !variantImages.includes(singleImage)) {
                variantImages.unshift(singleImage);
            }

            const finalImages = variantImages.length
                ? variantImages
                : fallbackImages;

            const rawStock = variant.stock ?? variant.existencias;
            const rawPrice = variant.precio ?? variant.price;
            const rawOriginalPrice = variant.precioOriginal ?? variant.originalPrice;

            return {
                id: variantId(
                    variant._id ?? variant.id ?? variant.codigo ?? variant.sku,
                    name,
                    index
                ),
                nombre: name,
                colorHex: normalizeColorCode(
                    variant.codigoHex ?? variant.colorHex ?? variant.hex ?? variant.codigoColor
                ),
                imagen: finalImages[0] || defaultImage,
                imagenes: finalImages,
                stock: rawStock === undefined || rawStock === null || rawStock === ""
                    ? null
                    : Math.max(0, numberValue(rawStock)),
                precio: rawPrice === undefined || rawPrice === null || rawPrice === ""
                    ? null
                    : Math.max(0, numberValue(rawPrice)),
                precioOriginal: rawOriginalPrice === undefined || rawOriginalPrice === null || rawOriginalPrice === ""
                    ? null
                    : Math.max(0, numberValue(rawOriginalPrice)),
                sku: stringValue(variant.sku ?? variant.codigo),
                selectable: true
            };
        })
        .filter(Boolean);

    return variants.length ? variants : [standardVariant];
}

    function normalizeProduct(rawProduct) {
        const imagenes = normalizeImages(
            rawProduct.imagenes ?? rawProduct.images ?? []
        );

        const imagenPrincipal =
            imagenes[0] || CONFIG.placeholderImage;

        const categorias = normalizeStringArray(
            rawProduct.categorias ??
            rawProduct["categorías"] ??
            rawProduct.categoria ??
            rawProduct["categoría"]
        );

        const categoriaPrincipal = stringValue(
            rawProduct.categoriaPrincipal ??
            rawProduct.categoria ??
            rawProduct["categoría"] ??
            categorias[0],
            "Sin categoría"
        );

        if (
            categoriaPrincipal &&
            !categorias.some(
                (item) =>
                    normalizeText(item) ===
                    normalizeText(categoriaPrincipal)
            )
        ) {
            categorias.unshift(categoriaPrincipal);
        }

        const tipoProducto = normalizeText(
            rawProduct.tipoProducto ??
            rawProduct.tipo ??
            rawProduct.modoVenta
        );

        const personalizable = booleanValue(
            rawProduct.personalizable,
            ["personalizable", "personalizado", "personalizacion"].includes(tipoProducto)
        );

        const publicarCatalogo = booleanValue(
            rawProduct.publicarCatalogo ??
            rawProduct.visibleCatalogo ??
            rawProduct.publicado,
            !personalizable
        );

        const createdAtRaw =
            rawProduct.createdAt ??
            rawProduct.fechaCreacion ??
            rawProduct.fechaIngreso ??
            "";

        const variantes = normalizeVariants(
            rawProduct,
            imagenPrincipal,
            imagenes
        );

        const tieneVariantesSeleccionables =
            variantes.some((variant) => variant.selectable);

        return {
            id: stringValue(rawProduct._id ?? rawProduct.id),
            nombre: stringValue(rawProduct.nombre, "Producto sin nombre"),
            precio: numberValue(rawProduct.precio),
            precioOriginal: numberValue(rawProduct.precioOriginal),

            descripcion: stringValue(
                rawProduct.descripcion ??
                rawProduct["descripción"],
                "Sin descripción disponible."
            ),

            imagenes,
            imagenPrincipal,
            categorias,
            categoria: categoriaPrincipal,

            insignia: stringValue(
                rawProduct.insignia ??
                rawProduct.badge ??
                rawProduct.etiqueta
            ),

            destacado: booleanValue(rawProduct.destacado),
            activo: booleanValue(rawProduct.activo, true),
            personalizable,
            publicarCatalogo,

            lightCustomization:
                normalizeLightCustomization(
                    rawProduct
                ),

            delivery:
                normalizeDelivery(
                    rawProduct
                ),

            cardImageFit:
                ["cover", "contain"].includes(
                    stringValue(
                        rawProduct.ajusteImagenTarjeta ??
                        rawProduct.cardImageFit
                    ).toLowerCase()
                )
                    ? stringValue(
                        rawProduct.ajusteImagenTarjeta ??
                        rawProduct.cardImageFit
                    ).toLowerCase()
                    : "cover",

            detailImageFit:
                ["cover", "contain"].includes(
                    stringValue(
                        rawProduct.ajusteImagenDetalle ??
                        rawProduct.detailImageFit
                    ).toLowerCase()
                )
                    ? stringValue(
                        rawProduct.ajusteImagenDetalle ??
                        rawProduct.detailImageFit
                    ).toLowerCase()
                    : "cover",

            imagePosition:
                stringValue(
                    rawProduct.posicionImagen ??
                    rawProduct.imagePosition,
                    "center"
                ),

            stock: numberValue(
                rawProduct.stock ??
                rawProduct.existencias,
                0
            ),

            orden: numberValue(rawProduct.orden, 9999),

            ventas: numberValue(
                rawProduct.ventas ??
                rawProduct.vendidos ??
                rawProduct.unidadesVendidas,
                0
            ),

            movimiento: numberValue(
                rawProduct.movimiento ??
                rawProduct.visitas ??
                rawProduct.interacciones,
                0
            ),

            createdAt: createdAtRaw
                ? new Date(createdAtRaw).getTime()
                : 0,

            tags: normalizeStringArray(
                rawProduct.tags ??
                rawProduct.palabrasClave ??
                rawProduct.etiquetasBusqueda
            ),

            productosRelacionados: normalizeIds(
                rawProduct.productosRelacionados ??
                rawProduct.relacionados
            ),

            caracteristicas: normalizeCharacteristics(
                rawProduct.caracteristicas ??
                rawProduct.especificaciones ??
                rawProduct.detallesProducto ??
                rawProduct.detalles
            ),

personalizationPricing: {
    base: numberValue(rawProduct.precioBasePersonalizacion ?? rawProduct.precioBasePersonalizado ?? rawProduct.personalizacion?.precioBase, 0),
    image: numberValue(rawProduct.costosPersonalizacion?.imagen ?? rawProduct.personalizacion?.costos?.imagen ?? rawProduct.precioAgregarImagen, 0),
    mainText: numberValue(rawProduct.costosPersonalizacion?.textoPrincipal ?? rawProduct.personalizacion?.costos?.textoPrincipal ?? rawProduct.precioTextoPrincipal, 0),
    secondaryText: numberValue(rawProduct.costosPersonalizacion?.textoSecundario ?? rawProduct.personalizacion?.costos?.textoSecundario ?? rawProduct.precioTextoSecundario, 0)
},

            variantes,
            tieneVariantesSeleccionables
        };
    }


function getSelectableVariants(product) {
    return Array.isArray(product?.variantes)
        ? product.variantes.filter((variant) => variant.selectable)
        : [];
}

function getVariantStock(product, variant) {
    return variant?.stock === null || variant?.stock === undefined
        ? Math.max(0, numberValue(product?.stock))
        : Math.max(0, numberValue(variant.stock));
}

function getDefaultVariant(product) {
    const variants = getSelectableVariants(product);
    return variants.find((variant) => getVariantStock(product, variant) > 0)
        || variants[0]
        || product?.variantes?.[0]
        || null;
}

function getVariantPrice(product, variant) {
    return variant?.precio === null || variant?.precio === undefined
        ? numberValue(product?.precio)
        : numberValue(variant.precio);
}

function getVariantOriginalPrice(product, variant) {
    return variant?.precioOriginal === null || variant?.precioOriginal === undefined
        ? numberValue(product?.precioOriginal)
        : numberValue(variant.precioOriginal);
}

function getVariantImages(product, variant) {
    const images = Array.isArray(variant?.imagenes) && variant.imagenes.length
        ? variant.imagenes
        : product?.imagenes;
    return Array.isArray(images) && images.length
        ? images
        : [CONFIG.placeholderImage];
}


function buildProductGallery(product) {
    const gallery = [];
    const indexByUrl = new Map();

    function addImage(url, variant = null) {
        const cleanUrl = stringValue(url);
        if (!cleanUrl) return;

        const existingIndex = indexByUrl.get(cleanUrl);

        if (existingIndex !== undefined) {
            const existing = gallery[existingIndex];

            if (!existing.variantId && variant?.id) {
                existing.variantId = variant.id;
                existing.variantName = variant.nombre;
                existing.colorHex = variant.colorHex;
            }

            return;
        }

        indexByUrl.set(cleanUrl, gallery.length);
        gallery.push({
            url: cleanUrl,
            variantId: variant?.selectable ? variant.id : "",
            variantName: variant?.selectable ? variant.nombre : "",
            colorHex: variant?.selectable ? variant.colorHex : ""
        });
    }

    (product?.imagenes || []).forEach((url) => addImage(url));

    getSelectableVariants(product).forEach((variant) => {
        getVariantImages(product, variant).forEach((url) => addImage(url, variant));
    });

    if (!gallery.length) {
        addImage(CONFIG.placeholderImage);
    }

    return gallery.filter(
        (entry, index) =>
            entry.url !== CONFIG.placeholderImage ||
            gallery.length === 1 ||
            index !== 0
    );
}

function findGalleryIndexForVariant(product, variant, preferredUrl = "") {
    const gallery = state.galeriaDetalleActual;

    if (preferredUrl) {
        const preferredIndex = gallery.findIndex((entry) => entry.url === preferredUrl);
        if (preferredIndex >= 0) return preferredIndex;
    }

    const variantIndex = gallery.findIndex((entry) => entry.variantId === variant?.id);
    if (variantIndex >= 0) return variantIndex;

    const firstVariantImage = getVariantImages(product, variant)[0];
    const imageIndex = gallery.findIndex((entry) => entry.url === firstVariantImage);
    return imageIndex >= 0 ? imageIndex : 0;
}

function hasAvailableStock(product) {
    const variants = getSelectableVariants(product);
    if (!variants.length) return numberValue(product?.stock) > 0;
    return variants.some((variant) => getVariantStock(product, variant) > 0);
}

    function formatPrice(value) {
        return new Intl.NumberFormat(
            CONFIG.locale || "es-CL",
            {
                style: "currency",
                currency: CONFIG.currency || "CLP",
                maximumFractionDigits: 0
            }
        ).format(numberValue(value));
    }

    function calculateDiscountPercentage(product) {
        const original = numberValue(product?.precioOriginal);
        const current = numberValue(product?.precio);
        if (original <= 0 || current < 0 || current >= original) return 0;
        return Math.round(((original - current) / original) * 100);
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function readJsonStorage(storage, key, fallback) {
        try {
            const parsed = JSON.parse(
                storage.getItem(key) || JSON.stringify(fallback)
            );

            return parsed && typeof parsed === "object"
                ? parsed
                : fallback;
        } catch {
            return fallback;
        }
    }

    function getLocalViews(productId) {
        const views = readJsonStorage(
            localStorage,
            VIEW_STORAGE_KEY,
            {}
        );

        return numberValue(views[productId]);
    }

    function trackProductView(productId) {
        if (!productId) return;

        const viewedSession = readJsonStorage(
            sessionStorage,
            VIEW_SESSION_KEY,
            []
        );

        if (Array.isArray(viewedSession) && viewedSession.includes(productId)) {
            return;
        }

        const views = readJsonStorage(
            localStorage,
            VIEW_STORAGE_KEY,
            {}
        );

        views[productId] =
            numberValue(views[productId]) + 1;

        localStorage.setItem(
            VIEW_STORAGE_KEY,
            JSON.stringify(views)
        );

        const nextSession = Array.isArray(viewedSession)
            ? [...viewedSession, productId]
            : [productId];

        sessionStorage.setItem(
            VIEW_SESSION_KEY,
            JSON.stringify(nextSession)
        );
    }

    function isCatalogProduct(product) {
        return Boolean(
            product &&
            product.activo &&
            product.publicarCatalogo
        );
    }

    function isCustomizableProduct(product) {
        return Boolean(
            product &&
            product.activo &&
            product.personalizable
        );
    }

    function matchesCategory(product, category) {
        const normalizedCategory = normalizeText(category);

        if (!normalizedCategory || normalizedCategory === "todos") {
            return true;
        }

        return product.categorias.some(
            (item) =>
                normalizeText(item) ===
                normalizedCategory
        );
    }

    function productSearchText(product) {
        return normalizeText([
            product.nombre,
            product.descripcion,
            product.categoria,
            ...product.categorias,
            ...product.tags
        ].join(" "));
    }

    function getPopularityScore(product) {
        /*
         * Orden:
         * 1. Ventas registradas en MongoDB.
         * 2. Movimiento/visitas registradas en MongoDB.
         * 3. Vistas locales del navegador como desempate.
         */
        return (
            product.ventas * 1000000 +
            product.movimiento * 1000 +
            getLocalViews(product.id)
        );
    }

    function getBestSellers(limit = 10) {
        return state.productos
            .filter(
                (product) =>
                    isCatalogProduct(product) &&
                    hasAvailableStock(product)
            )
            .sort((a, b) =>
                getPopularityScore(b) -
                getPopularityScore(a) ||
                a.orden - b.orden
            )
            .slice(0, limit);
    }

    function searchProducts(query, options = {}) {
        const normalizedQuery = normalizeText(query);

        if (!normalizedQuery) return [];

        const includeCustomizable =
            Boolean(options.includeCustomizable);

        return state.productos
            .filter((product) =>
                includeCustomizable
                    ? product.activo
                    : isCatalogProduct(product)
            )
            .map((product) => {
                const name = normalizeText(product.nombre);
                const text = productSearchText(product);

                let score = 0;

                if (name === normalizedQuery) score += 100;
                if (name.startsWith(normalizedQuery)) score += 50;
                if (name.includes(normalizedQuery)) score += 30;
                if (text.includes(normalizedQuery)) score += 10;

                return { product, score };
            })
            .filter((entry) => entry.score > 0)
            .sort((a, b) =>
                b.score - a.score ||
                getPopularityScore(b.product) -
                getPopularityScore(a.product) ||
                a.product.nombre.localeCompare(
                    b.product.nombre,
                    "es"
                )
            )
            .map((entry) => entry.product);
    }

    function getCatalogProducts({
        category = "Todos",
        query = "",
        inStock = false,
        sort = "mas-vendidos"
    } = {}) {
        let products =
            state.productos.filter(isCatalogProduct);

        if (
            category &&
            normalizeText(category) !== "todos"
        ) {
            products = products.filter((product) =>
                matchesCategory(product, category)
            );
        }

        if (query) {
            const normalizedQuery =
                normalizeText(query);

            products = products.filter((product) =>
                productSearchText(product)
                    .includes(normalizedQuery)
            );
        }

        if (inStock) {
            products = products.filter(
                (product) => hasAvailableStock(product)
            );
        }

        const sorted = [...products];

        switch (sort) {
            case "precio-menor":
                sorted.sort((a, b) =>
                    a.precio - b.precio ||
                    a.orden - b.orden
                );
                break;

            case "precio-mayor":
                sorted.sort((a, b) =>
                    b.precio - a.precio ||
                    a.orden - b.orden
                );
                break;

            case "mas-nuevos":
                sorted.sort((a, b) =>
                    b.createdAt - a.createdAt ||
                    a.orden - b.orden
                );
                break;

            case "mas-vendidos":
            default:
                sorted.sort((a, b) =>
                    getPopularityScore(b) -
                    getPopularityScore(a) ||
                    a.orden - b.orden
                );
                break;
        }

        return sorted;
    }

    function showToast(message) {
        const toast =
            document.getElementById("toast");

        if (!toast) return;

        toast.textContent = message;
        toast.hidden = false;

        window.clearTimeout(showToast.timeoutId);

        showToast.timeoutId =
            window.setTimeout(() => {
                toast.hidden = true;
            }, 2200);
    }

    function showContainerError(container, message) {
        if (!container) return;

        container.innerHTML = `
            <div class="loading-products" role="alert">
                <div>
                    <strong>No pudimos cargar los productos.</strong>
                    <p>${escapeHtml(message)}</p>
                    <button class="btn-secondary js-retry-products" type="button">
                        Intentar nuevamente
                    </button>
                </div>
            </div>
        `;

        container
            .querySelector(".js-retry-products")
            ?.addEventListener(
                "click",
                () => initCurrentPage(true)
            );
    }


function createProductCard(product) {
    const template = document.getElementById("product-card-template");

    if (!template) {
        console.error("No existe #product-card-template.");
        return null;
    }

    const fragment = template.content.cloneNode(true);
    const article = fragment.querySelector(".card-product");
    const link = fragment.querySelector(".product-card-link");
    const image = fragment.querySelector(".product-card-image");
    const badge = fragment.querySelector(".product-badge");
    const discountBadge = fragment.querySelector(".product-discount-badge");
    const category = fragment.querySelector(".product-category");
    const name = fragment.querySelector(".product-name");
    const colorRow = fragment.querySelector(".product-card-color-row");
    const colorSwatches = fragment.querySelector(".product-card-color-swatches");
    const price = fragment.querySelector(".product-price");
    const originalPrice = fragment.querySelector(".product-original-price");
    const addButton = fragment.querySelector(".add-cart");

    article.dataset.productId = product.id;
    category.textContent = product.categoria;
    name.textContent = product.nombre;

    if (product.insignia) {
        badge.hidden = false;
        badge.textContent = product.insignia;
    }

    const selectableVariants = getSelectableVariants(product);
    let activeVariant = getDefaultVariant(product);

    function updateCardVariant(variant) {
        activeVariant = variant || activeVariant;

        const targetImage = activeVariant?.imagen || product.imagenPrincipal;
        const targetPrice = getVariantPrice(product, activeVariant);
        const targetOriginal = getVariantOriginalPrice(product, activeVariant);
        const discount = targetOriginal > targetPrice && targetOriginal > 0
            ? Math.round(((targetOriginal - targetPrice) / targetOriginal) * 100)
            : 0;

        if (targetImage && image.src !== targetImage) {
            image.classList.add("is-changing-variant");
            const preloader = new Image();

            preloader.onload = () => {
                image.src = targetImage;
                requestAnimationFrame(() => {
                    image.classList.remove("is-changing-variant");
                });
            };

            preloader.onerror = () => {
                image.src = CONFIG.placeholderImage;
                image.classList.remove("is-changing-variant");
            };

            preloader.src = targetImage;
        } else {
            image.src = targetImage || CONFIG.placeholderImage;
        }

        image.alt = activeVariant?.selectable
            ? `${product.nombre} color ${activeVariant.nombre}`
            : product.nombre;

        price.textContent = formatPrice(targetPrice);

        if (targetOriginal > targetPrice && targetOriginal > 0) {
            originalPrice.hidden = false;
            originalPrice.textContent = formatPrice(targetOriginal);
        } else {
            originalPrice.hidden = true;
            originalPrice.textContent = "";
        }

        if (discountBadge) {
            discountBadge.hidden = discount <= 0;
            discountBadge.textContent = discount > 0 ? `-${discount}%` : "";
            discountBadge.setAttribute(
                "aria-label",
                discount > 0 ? `${discount}% de descuento` : ""
            );
        }

        colorSwatches
            ?.querySelectorAll(".product-card-color-dot")
            .forEach((dot) => {
                const selected = dot.dataset.variantId === activeVariant?.id;
                dot.classList.toggle("selected", selected);
                dot.setAttribute("aria-checked", String(selected));
            });

        const variantParam = activeVariant?.selectable
            ? `&variante=${encodeURIComponent(activeVariant.id)}`
            : "";

        link.href = `producto.html?id=${encodeURIComponent(product.id)}${variantParam}`;
        article.dataset.selectedVariantId = activeVariant?.id || "";
    }

    image.style.objectFit = product.cardImageFit || "cover";
    image.style.objectPosition = product.imagePosition || "center";
    image.addEventListener("error", () => {
        image.src = CONFIG.placeholderImage;
    }, { once: true });

    if (colorRow && colorSwatches && selectableVariants.length) {
        colorRow.hidden = false;
        colorSwatches.innerHTML = "";
        colorSwatches.setAttribute("role", "radiogroup");
        colorSwatches.setAttribute("aria-label", `Colores disponibles para ${product.nombre}`);

        selectableVariants.slice(0, 6).forEach((variant) => {
            const dot = document.createElement("span");
            dot.className = "product-card-color-dot";
            dot.dataset.variantId = variant.id;
            dot.title = variant.nombre;
            dot.tabIndex = 0;
            dot.setAttribute("role", "radio");
            dot.setAttribute("aria-label", `Mostrar ${product.nombre} en color ${variant.nombre}`);
            dot.setAttribute("aria-checked", "false");

            if (variant.colorHex) {
                dot.style.background = variant.colorHex;
            } else {
                dot.style.backgroundImage = `url("${variant.imagen}")`;
            }

            const choose = (event) => {
                event.preventDefault();
                event.stopPropagation();
                updateCardVariant(variant);
            };

            dot.addEventListener("click", choose);
            dot.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    choose(event);
                }
            });

            colorSwatches.appendChild(dot);
        });

        if (selectableVariants.length > 6) {
            const more = document.createElement("span");
            more.className = "product-card-color-more";
            more.textContent = `+${selectableVariants.length - 6}`;
            colorSwatches.appendChild(more);
        }
    }

    updateCardVariant(activeVariant);

    if (!hasAvailableStock(product)) {
        addButton.disabled = true;
        addButton.querySelector("span").textContent = "Agotado";
    } else if (selectableVariants.length) {
        addButton.querySelector("span").textContent = "Elegir color";
        addButton.addEventListener("click", () => {
            const variantParam = activeVariant?.id
                ? `&variante=${encodeURIComponent(activeVariant.id)}`
                : "";
            window.location.href =
                `producto.html?id=${encodeURIComponent(product.id)}${variantParam}`;
        });
    } else {
        addButton.addEventListener("click", () => {
            window.Cart?.add(product, 1);
            showToast(`${product.nombre} fue agregado al carrito.`);
            const label = addButton.querySelector("span");
            label.textContent = "Agregado";
            window.setTimeout(() => {
                label.textContent = "Agregar";
            }, 1200);
        });
    }

    return fragment;
}

    function renderProducts(
        container,
        products,
        emptyMessage = "No hay productos disponibles."
    ) {
        if (!container) return;

        container.innerHTML = "";

        if (products.length === 0) {
            container.innerHTML = `
                <div class="catalog-empty">
                    <p>${escapeHtml(emptyMessage)}</p>
                </div>
            `;
            return;
        }

        const fragment =
            document.createDocumentFragment();

        products.forEach((product) => {
            const card = createProductCard(product);

            if (card) {
                fragment.appendChild(card);
            }
        });

        container.appendChild(fragment);
    }

    function categoryCount(category) {
        if (normalizeText(category) === "todos") {
            return state.productos
                .filter(isCatalogProduct)
                .length;
        }

        return state.productos.filter(
            (product) =>
                isCatalogProduct(product) &&
                matchesCategory(product, category)
        ).length;
    }

    function renderCategories(products) {
        const container =
            document.getElementById("categories-grid");

        if (!container) return;

        const publicProducts =
            products.filter(isCatalogProduct);

        const categories = CONFIG.CATEGORIES
            .filter((category) =>
                !["Todos", "Temporada"].includes(category)
            )
            .filter((category) =>
                publicProducts.some((product) =>
                    matchesCategory(product, category)
                )
            );

        container.innerHTML = "";

        if (categories.length === 0) {
            container.innerHTML = `
                <p class="loading-products">
                    No hay categorías disponibles.
                </p>
            `;
            return;
        }

        const fragment =
            document.createDocumentFragment();

        categories.slice(0, 8)
            .forEach((categoryName) => {
                const categoryProducts =
                    publicProducts.filter(
                        (product) =>
                            matchesCategory(
                                product,
                                categoryName
                            )
                    );

                const link =
                    document.createElement("a");

                const image =
                    document.createElement("img");

                const content =
                    document.createElement("div");

                const title =
                    document.createElement("h3");

                const description =
                    document.createElement("p");

                link.className = "category-card";

                link.href =
                    `catalogo.html?categoria=${encodeURIComponent(categoryName)}`;

                image.src =
                    categoryProducts[0]
                        ?.imagenPrincipal ||
                    CONFIG.placeholderImage;

                image.alt = "";
                image.loading = "lazy";

                content.className =
                    "category-card-content";

                title.textContent = categoryName;

                description.textContent =
                    `${categoryProducts.length} producto${categoryProducts.length === 1 ? "" : "s"}`;

                content.append(
                    title,
                    description
                );

                link.append(
                    image,
                    content
                );

                fragment.appendChild(link);
            });

        container.appendChild(fragment);
    }

    function renderHome(products) {
        const catalog =
            products.filter(isCatalogProduct);

        const inStock =
            catalog.filter(
                (product) => hasAvailableStock(product)
            );

        const destacados = inStock
            .filter((product) => product.destacado)
            .sort((a, b) =>
                getPopularityScore(b) -
                getPopularityScore(a) ||
                a.orden - b.orden
            );

        const nuevos = inStock
            .filter(
                (product) =>
                    normalizeText(product.insignia) ===
                    "nuevo"
            )
            .sort((a, b) =>
                b.createdAt - a.createdAt ||
                a.orden - b.orden
            );

        renderCategories(products);

        renderProducts(
            document.getElementById(
                "productos-tendencias"
            ),
            (
                destacados.length
                    ? destacados
                    : inStock
            ).slice(0, 10)
        );

        renderProducts(
            document.getElementById(
                "productos-mas-vendidos"
            ),
            getBestSellers(10)
        );

        renderProducts(
            document.getElementById(
                "productos-nuevos"
            ),
            (
                nuevos.length
                    ? nuevos
                    : [...inStock].sort(
                        (a, b) =>
                            b.createdAt -
                            a.createdAt
                    )
            ).slice(0, 10)
        );

        renderProducts(
            document.getElementById(
                "todos-los-productos"
            ),
            inStock.slice(0, 12)
        );
    }

    function showRenderActivationMessage() {
        const renderApi =
            /\.onrender\.com(?:\/|$)/i.test(
                String(CONFIG.API_BASE_URL || "")
            );

        if (!renderApi) return;

        document
            .querySelectorAll(".loading-products")
            .forEach((element) => {
                if (
                    !element.dataset.originalLoadingText
                ) {
                    element.dataset.originalLoadingText =
                        element.textContent.trim();
                }

                element.innerHTML = `
                    <div class="backend-wakeup-note">
                        <strong>Activando el catálogo...</strong>
                        <span>
                            La primera carga del servidor puede tardar cerca de un minuto.
                        </span>
                    </div>
                `;
            });
    }

    window.addEventListener(
        "api:slow",
        showRenderActivationMessage
    );

    window.addEventListener(
        "api:retry",
        showRenderActivationMessage
    );

    async function loadProducts(force = false) {
        if (
            !force &&
            state.productos.length > 0
        ) {
            return state.productos;
        }

        if (
            !force &&
            state.loadPromise
        ) {
            return state.loadPromise;
        }

        state.loadPromise =
            API.obtenerProductos()
                .then((rawProducts) => {
                    state.productos =
                        rawProducts
                            .map(normalizeProduct)
                            .filter(
                                (product) =>
                                    product.id &&
                                    product.activo
                            )
                            .sort(
                                (a, b) =>
                                    a.orden -
                                    b.orden
                            );

                    console.info(
                        `📦 ${state.productos.length} productos cargados desde la API.`
                    );

                    window.dispatchEvent(
                        new CustomEvent(
                            "products:loaded",
                            {
                                detail:
                                    state.productos
                            }
                        )
                    );

                    return state.productos;
                })
                .finally(() => {
                    state.loadPromise = null;
                });

        return state.loadPromise;
    }

    async function initHome(force = false) {
        const containers = [
            document.getElementById(
                "productos-tendencias"
            ),
            document.getElementById(
                "productos-mas-vendidos"
            ),
            document.getElementById(
                "productos-nuevos"
            ),
            document.getElementById(
                "todos-los-productos"
            ),
            document.getElementById(
                "categories-grid"
            )
        ];

        try {
            const products =
                await loadProducts(force);

            renderHome(products);
        } catch (error) {
            console.error(
                "Error al cargar productos:",
                error
            );

            containers.forEach((container) => {
                showContainerError(
                    container,
                    error.message ||
                    "Error desconocido."
                );
            });
        }
    }


function renderThumbnails(
    product,
    entries = state.galeriaDetalleActual
) {
    const container =
        document.getElementById(
            "detalle-thumbnails"
        );

    if (!container) return;

    container.innerHTML = "";

    entries.forEach((entry, index) => {
        const button =
            document.createElement("button");

        const image =
            document.createElement("img");

        button.type = "button";
        button.className =
            `detail-thumbnail${index === state.indiceImagenActual ? " active" : ""}`;

        button.dataset.imageIndex =
            String(index);

        if (entry.variantId) {
            button.dataset.variantId =
                entry.variantId;
        }

        const colorDescription =
            entry.variantName
                ? `, color ${entry.variantName}`
                : "";

        button.setAttribute(
            "aria-label",
            `Ver imagen ${index + 1} de ${product.nombre}${colorDescription}`
        );

        image.src = entry.url;
        image.alt = "";
        image.loading = "lazy";
        image.draggable = false;
        image.style.objectFit =
            product.cardImageFit ||
            "cover";
        image.style.objectPosition =
            product.imagePosition ||
            "center";

        button.appendChild(image);

        if (entry.variantName) {
            const indicator =
                document.createElement("span");

            indicator.className =
                "detail-thumbnail-color";

            indicator.title =
                entry.variantName;

            indicator.setAttribute(
                "aria-hidden",
                "true"
            );

            if (entry.colorHex) {
                indicator.style.background =
                    entry.colorHex;
            } else {
                indicator.style.backgroundImage =
                    `url("${entry.url}")`;
            }

            button.appendChild(indicator);
        }

        button.addEventListener(
            "click",
            (event) => {
                event.preventDefault();
                event.stopPropagation();
                setDetailImage(index);
            }
        );

        container.appendChild(button);
    });

    window.ProductGallery?.init();
}

function updateSelectedVariantUI(
    product,
    variant
) {
    state.varianteActual = variant;

    document
        .querySelectorAll(
            ".product-color-option"
        )
        .forEach((button) => {
            const selected =
                button.dataset.variantId ===
                variant?.id;

            button.classList.toggle(
                "selected",
                selected
            );

            button.setAttribute(
                "aria-checked",
                String(selected)
            );
        });

    const selectedColor =
        document.getElementById(
            "product-selected-color"
        );

    if (selectedColor) {
        selectedColor.textContent =
            variant?.nombre ||
            "Estándar";
    }

    updateDetailPrice(product, variant);
    updateDetailStock(product, variant);
}

function setDetailImage(
    index,
    options = {}
) {
    const product =
        state.productoActual;

    const gallery =
        state.galeriaDetalleActual;

    if (
        !product ||
        !Array.isArray(gallery) ||
        gallery.length === 0
    ) {
        return;
    }

    const total = gallery.length;

    state.indiceImagenActual =
        (index + total) % total;

    const entry =
        gallery[state.indiceImagenActual];

    if (
        options.syncVariant !== false &&
        entry.variantId
    ) {
        const variant =
            getSelectableVariants(product)
                .find(
                    (item) =>
                        item.id ===
                        entry.variantId
                );

        if (variant) {
            updateSelectedVariantUI(
                product,
                variant
            );
        }
    }

    const mainImage =
        document.getElementById(
            "detalle-imagen-principal"
        );

    if (mainImage) {
        mainImage.classList.add("is-switching-image");
        mainImage.src = entry.url;
        mainImage.alt =
            entry.variantName
                ? `${product.nombre} color ${entry.variantName}`
                : product.nombre;

        const reveal = () => {
            requestAnimationFrame(() => {
                mainImage.classList.remove("is-switching-image");
            });
        };

        if (mainImage.complete) {
            reveal();
        } else {
            mainImage.addEventListener("load", reveal, { once: true });
        }

        window.ProductGallery?.syncZoomSource();
    }

    document
        .querySelectorAll(
            ".detail-thumbnail"
        )
        .forEach(
            (
                thumbnail,
                thumbnailIndex
            ) => {
                thumbnail.classList.toggle(
                    "active",
                    thumbnailIndex ===
                    state.indiceImagenActual
                );

                thumbnail.setAttribute(
                    "aria-current",
                    thumbnailIndex ===
                    state.indiceImagenActual
                        ? "true"
                        : "false"
                );
            }
        );

    window.ProductGallery
        ?.scrollThumbnailIntoView(
            state.indiceImagenActual
        );
}

    function initAccordions() {
        document
            .querySelectorAll(
                ".accordion-header"
            )
            .forEach((button) => {
                button.addEventListener(
                    "click",
                    () => {
                        const content =
                            button.nextElementSibling;

                        const isOpen =
                            button.getAttribute(
                                "aria-expanded"
                            ) === "true";

                        button.setAttribute(
                            "aria-expanded",
                            String(!isOpen)
                        );

                        button.classList.toggle(
                            "active",
                            !isOpen
                        );

                        content?.classList.toggle(
                            "active",
                            !isOpen
                        );
                    }
                );
            });
    }

    function relatedScore(
        current,
        candidate
    ) {
        let score = 0;

        const sharedCategories =
            candidate.categorias.filter(
                (category) =>
                    current.categorias.some(
                        (currentCategory) =>
                            normalizeText(
                                currentCategory
                            ) ===
                            normalizeText(
                                category
                            )
                    )
            ).length;

        const sharedTags =
            candidate.tags.filter((tag) =>
                current.tags.some(
                    (currentTag) =>
                        normalizeText(
                            currentTag
                        ) ===
                        normalizeText(tag)
                )
            ).length;

        score += sharedCategories * 6;
        score += sharedTags * 4;

        if (
            normalizeText(
                candidate.categoria
            ) ===
            normalizeText(
                current.categoria
            )
        ) {
            score += 5;
        }

        if (hasAvailableStock(candidate)) {
            score += 2;
        }

        score += Math.min(
            getPopularityScore(candidate) /
            1000000,
            8
        );

        return score;
    }

    function getRelatedProducts(
        currentProduct,
        limit = 5
    ) {
        const candidates =
            state.productos.filter(
                (product) =>
                    product.id !==
                    currentProduct.id &&
                    isCatalogProduct(product)
            );

        const explicit =
            currentProduct
                .productosRelacionados
                .map((id) =>
                    candidates.find(
                        (product) =>
                            product.id === id
                    )
                )
                .filter(Boolean);

        const used =
            new Set(
                explicit.map(
                    (product) =>
                        product.id
                )
            );

        const automatic =
            candidates
                .filter(
                    (product) =>
                        !used.has(product.id)
                )
                .map((product) => ({
                    product,
                    score:
                        relatedScore(
                            currentProduct,
                            product
                        )
                }))
                .sort((a, b) =>
                    b.score - a.score ||
                    getPopularityScore(
                        b.product
                    ) -
                    getPopularityScore(
                        a.product
                    )
                )
                .map(
                    (entry) =>
                        entry.product
                );

        return [
            ...explicit,
            ...automatic
        ].slice(0, limit);
    }

    function renderRelatedProducts(
        currentProduct
    ) {
        renderProducts(
            document.getElementById(
                "related-products"
            ),
            getRelatedProducts(
                currentProduct,
                5
            ),
            "Todavía no hay productos relacionados."
        );
    }



function renderProductDelivery(product) {
    const section =
        document.getElementById(
            "product-delivery-info"
        );

    if (!section) return;

    const delivery =
        product.delivery || {
            shipping:
                CONFIG.DELIVERY_DEFAULTS.shipping,
            pickup:
                CONFIG.DELIVERY_DEFAULTS.pickup
        };

    const cards = [];

    if (delivery.shipping?.enabled) {
        cards.push(`
            <article class="product-delivery-card">
                <i class="fa-solid fa-truck-fast" aria-hidden="true"></i>
                <div>
                    <strong>Envío</strong>
                    <p>${escapeHtml(delivery.shipping.instructions)}</p>
                </div>
            </article>
        `);
    }

    if (delivery.pickup?.enabled) {
        cards.push(`
            <article class="product-delivery-card">
                <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
                <div>
                    <strong>Retiro</strong>
                    <p>${escapeHtml(delivery.pickup.instructions)}</p>
                </div>
            </article>
        `);
    }

    section.hidden =
        cards.length === 0;

    section.innerHTML =
        cards.join("");
}

function updateDetailPrice(product, variant) {
    const price = getVariantPrice(product, variant);
    const originalPrice = getVariantOriginalPrice(product, variant);
    const current = document.getElementById("detalle-precio");
    const original = document.getElementById("detalle-precio-original");
    const discount = document.getElementById("detalle-descuento");

    if (current) current.textContent = formatPrice(price);

    if (original) {
        original.hidden = !(originalPrice > 0 && originalPrice > price);
        original.textContent = original.hidden ? "" : formatPrice(originalPrice);
    }

    if (discount) {
        const percentage = originalPrice > price && originalPrice > 0
            ? Math.round(((originalPrice - price) / originalPrice) * 100)
            : 0;
        discount.hidden = percentage <= 0;
        discount.textContent = percentage > 0 ? `-${percentage}%` : "";
    }
}

function updateDetailStock(product, variant) {
    const stockAmount = getVariantStock(product, variant);
    const stock = document.getElementById("detalle-stock");
    const quantity = document.getElementById("product-quantity");
    const addButton = document.getElementById("btn-add-cart");

    if (stock) {
        stock.classList.toggle("out-of-stock", stockAmount <= 0);
        stock.textContent = stockAmount > 0
            ? `Disponible · ${stockAmount} unidades`
            : "Color agotado";
    }

    if (quantity) {
        quantity.max = String(Math.max(1, stockAmount));
        quantity.disabled = stockAmount <= 0;
        if (Number(quantity.value) > stockAmount && stockAmount > 0) {
            quantity.value = String(stockAmount);
        }
    }

    if (addButton && !(product.personalizable && !product.publicarCatalogo)) {
        addButton.disabled = stockAmount <= 0;
        addButton.innerHTML = stockAmount <= 0
            ? "Agotado"
            : `<i class="fa-solid fa-cart-plus" aria-hidden="true"></i> Agregar al carrito`;
    }
}


function selectProductVariant(
    product,
    variant,
    preferredUrl = ""
) {
    updateSelectedVariantUI(
        product,
        variant
    );

    const galleryIndex =
        findGalleryIndexForVariant(
            product,
            variant,
            preferredUrl
        );

    setDetailImage(
        galleryIndex,
        { syncVariant: false }
    );
}

function renderColorSelector(product) {
    const section = document.getElementById("product-color-selector");
    const container = document.getElementById("product-color-options");
    const variants = getSelectableVariants(product);

    if (!section || !container || !product.publicarCatalogo || variants.length === 0) {
        if (section) section.hidden = true;
        state.varianteActual = product.variantes?.[0] || null;
        state.galeriaDetalleActual = buildProductGallery(product);
        state.imagenesDetalleActual = state.galeriaDetalleActual.map((entry) => entry.url);
        renderThumbnails(product, state.galeriaDetalleActual);
        setDetailImage(0, { syncVariant: false });
        return;
    }

    section.hidden = false;
    container.innerHTML = "";

    variants.forEach((variant) => {
        const button = document.createElement("button");
        const image = document.createElement("img");
        const content = document.createElement("span");
        const name = document.createElement("strong");
        const availability = document.createElement("small");
        const indicator = document.createElement("span");
        const selectionMark = document.createElement("span");
        const stockAmount = getVariantStock(product, variant);

        button.type = "button";
        button.className = "product-color-option";
        button.dataset.variantId = variant.id;
        button.setAttribute("role", "radio");
        button.setAttribute("aria-checked", "false");
        button.setAttribute(
            "aria-label",
            `${variant.nombre}: ${stockAmount > 0 ? `${stockAmount} disponibles` : "agotado"}`
        );
        button.disabled = stockAmount <= 0;

        image.src = variant.imagen || product.imagenPrincipal;
        image.alt = "";
        content.className = "product-color-option-content";
        name.textContent = variant.nombre;
        availability.textContent = stockAmount > 0
            ? `${stockAmount} disponibles`
            : "Agotado";

        indicator.className = "product-color-indicator";
        if (variant.colorHex) {
            indicator.style.background = variant.colorHex;
        } else {
            indicator.style.backgroundImage = `url("${variant.imagen}")`;
        }

        selectionMark.className =
            "product-color-selected-mark";
        selectionMark.setAttribute(
            "aria-hidden",
            "true"
        );
        selectionMark.innerHTML =
            '<i class="fa-solid fa-check"></i>';

        content.append(name, availability);
        button.append(
            image,
            content,
            indicator,
            selectionMark
        );
        button.addEventListener("click", () => selectProductVariant(product, variant));
        container.appendChild(button);
    });

    const initialVariant = getDefaultVariant(product);
    if (initialVariant) selectProductVariant(product, initialVariant);
}

    function renderProductDetail(product) {
        state.productoActual = product;
        state.varianteActual = null;
        state.imagenesDetalleActual = [];
        state.galeriaDetalleActual = [];
        state.indiceImagenActual = 0;

        trackProductView(product.id);

        document.title =
            `${product.nombre} | Mommy Crafts`;

        const metaDescription =
            document.getElementById(
                "meta-description"
            );

        if (metaDescription) {
            metaDescription.content =
                product.descripcion.slice(
                    0,
                    155
                );
        }

        document.getElementById(
            "detalle-nombre-producto"
        ).textContent = product.nombre;

        document.getElementById(
            "detalle-categoria"
        ).textContent = product.categoria;

        document.getElementById(
            "detalle-titulo"
        ).textContent = product.nombre;

        document.getElementById(
            "detalle-precio"
        ).textContent =
            formatPrice(product.precio);

        document.getElementById(
            "detalle-descripcion"
        ).textContent =
            product.descripcion;

        const breadcrumbCategory =
            document.getElementById(
                "breadcrumb-category"
            );

        breadcrumbCategory.textContent =
            product.categoria;

        breadcrumbCategory.href =
            `catalogo.html?categoria=${encodeURIComponent(product.categoria)}`;

        const oldPrice =
            document.getElementById(
                "detalle-precio-original"
            );

        if (
            product.precioOriginal > 0 &&
            product.precioOriginal >
            product.precio
        ) {
            oldPrice.hidden = false;

            oldPrice.textContent =
                formatPrice(
                    product.precioOriginal
                );
        }

        const badge =
            document.getElementById(
                "detalle-badge"
            );

        if (product.insignia) {
            badge.hidden = false;
            badge.textContent =
                product.insignia;
        }

        const detailDiscount = document.getElementById("detalle-descuento");
        const detailDiscountPercentage = calculateDiscountPercentage(product);
        if (detailDiscount && detailDiscountPercentage > 0) {
            detailDiscount.hidden = false;
            detailDiscount.textContent = `-${detailDiscountPercentage}%`;
        }

        const stock =
            document.getElementById(
                "detalle-stock"
            );

        const initialVariant =
            getDefaultVariant(product);

        const initialStock =
            getVariantStock(
                product,
                initialVariant
            );

        if (initialStock > 0) {
            stock.textContent =
                `Disponible · ${initialStock} unidades`;
        } else {
            stock.textContent =
                "Producto agotado";

            stock.classList.add(
                "out-of-stock"
            );
        }

        const mainImage =
            document.getElementById(
                "detalle-imagen-principal"
            );

        const initialMainImage =
            initialVariant?.imagen ||
            product.imagenes[0] ||
            CONFIG.placeholderImage;

        mainImage.src =
            initialMainImage;

        mainImage.alt =
            product.nombre;

        mainImage.style.objectFit =
            product.detailImageFit ||
            "contain";

        mainImage.style.objectPosition =
            product.imagePosition ||
            "center";

        state.galeriaDetalleActual =
            buildProductGallery(product);

        state.imagenesDetalleActual =
            state.galeriaDetalleActual
                .map((entry) => entry.url);

        renderThumbnails(
            product,
            state.galeriaDetalleActual
        );

        window.ProductOptions
            ?.init(product);

        renderColorSelector(product);

        const requestedVariantId =
            new URLSearchParams(window.location.search)
                .get("variante");

        if (requestedVariantId) {
            const requestedVariant =
                getSelectableVariants(product)
                    .find((variant) =>
                        variant.id === requestedVariantId
                    );

            if (requestedVariant) {
                selectProductVariant(product, requestedVariant);
            }
        }

        if (!state.varianteActual) {
            setDetailImage(0, {
                syncVariant: false
            });
        }

        const characteristics =
            document.getElementById(
                "detalle-caracteristicas"
            );

        const characteristicsSection =
            characteristics?.closest(
                ".accordion-item"
            );

        if (
            !characteristics ||
            product.caracteristicas.length === 0
        ) {
            if (characteristicsSection) {
                characteristicsSection.hidden = true;
            }
        } else {
            if (characteristicsSection) {
                characteristicsSection.hidden = false;
            }

            characteristics.innerHTML = "";

            product.caracteristicas
                .forEach((characteristic) => {
                    const item =
                        document.createElement("li");

                    item.className =
                        "product-characteristic";

                    if (characteristic.label) {
                        const label =
                            document.createElement("strong");

                        label.className =
                            "product-characteristic-label";

                        label.textContent =
                            `${characteristic.label}:`;

                        item.appendChild(label);
                    }

                    const value =
                        document.createElement("span");

                    value.className =
                        "product-characteristic-value";

                    value.textContent =
                        characteristic.value;

                    item.appendChild(value);

                    characteristics.appendChild(
                        item
                    );
                });
        }

        renderProductDelivery(product);

        const quantityInput =
            document.getElementById(
                "product-quantity"
            );

        const addButton =
            document.getElementById(
                "btn-add-cart"
            );

        if (
            product.personalizable &&
            !product.publicarCatalogo
        ) {
            addButton.hidden = true;
        } else {
            updateDetailStock(product, state.varianteActual);

            addButton.addEventListener(
                "click",
                () => {
                    if (!window.ProductOptions?.validate()) return;

                    const variant = state.varianteActual;
                    const availableStock = getVariantStock(product, variant);

                    if (availableStock <= 0) {
                        showToast("El color seleccionado está agotado.");
                        return;
                    }

                    const quantity = Math.max(
                        1,
                        Math.min(availableStock, Number(quantityInput.value) || 1)
                    );

                    const lightCustomization =
                        window.ProductOptions?.getCustomization() || null;

                    const customization = lightCustomization
                        ? { ...lightCustomization }
                        : {};

                    if (variant?.selectable) {
                        customization.productVariant = variant.nombre;
                        customization.variantId = variant.id;
                        customization.colorHex = variant.colorHex;
                        customization.sku = variant.sku;
                    }

                    const finalCustomization = Object.keys(customization).length
                        ? customization
                        : null;

                    const cartProduct = {
                        ...product,
                        precio: getVariantPrice(product, variant),
                        precioOriginal: getVariantOriginalPrice(product, variant),
                        imagenPrincipal: variant?.imagen || product.imagenPrincipal
                    };

                    window.Cart?.add(cartProduct, quantity, finalCustomization);

                    showToast(
                        variant?.selectable
                            ? `${product.nombre} · ${variant.nombre} fue agregado al carrito.`
                            : `${product.nombre} fue agregado al carrito.`
                    );

                    addButton.innerHTML = `
                        <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
                        Agregado
                    `;

                    window.setTimeout(
                        () => updateDetailStock(product, state.varianteActual),
                        1200
                    );
                }
            );
        }

        const customizeButton =
            document.getElementById(
                "btn-open-customization"
            );

        if (product.personalizable) {
            customizeButton.hidden = false;

            customizeButton.addEventListener(
                "click",
                () => {
                    window.Customization
                        ?.open(product);
                }
            );
        }

        document
            .getElementById(
                "detail-prev"
            )
            ?.addEventListener(
                "click",
                () => setDetailImage(
                    state.indiceImagenActual -
                    1
                )
            );

        document
            .getElementById(
                "detail-next"
            )
            ?.addEventListener(
                "click",
                () => setDetailImage(
                    state.indiceImagenActual +
                    1
                )
            );

        initAccordions();
        renderRelatedProducts(product);
    }

    async function initProductPage(
        force = false
    ) {
        const params =
            new URLSearchParams(
                window.location.search
            );

        const productId =
            params.get("id");

        if (!productId) {
            document.getElementById(
                "product-detail"
            ).innerHTML = `
                <div class="loading-products" role="alert">
                    Selecciona un producto desde el catálogo.
                </div>
            `;

            return;
        }

        try {
            await loadProducts(force);

            const product =
                state.productos.find(
                    (item) =>
                        String(item.id) ===
                        String(productId)
                ) || null;

            if (!product) {
                throw new Error(
                    "El producto solicitado no existe, está inactivo o el ID de la URL no corresponde a MongoDB."
                );
            }

            renderProductDetail(product);
        } catch (error) {
            console.error(
                "Error al cargar detalle:",
                error
            );

            document.getElementById(
                "product-detail"
            ).innerHTML = `
                <div class="loading-products" role="alert">
                    <strong>No se pudo cargar el producto.</strong>
                    <p>${escapeHtml(error.message)}</p>
                    <a class="btn-secondary" href="catalogo.html">
                        Volver al catálogo
                    </a>
                </div>
            `;
        }
    }

    function initCurrentPage(
        force = false
    ) {
        const page =
            document.body.dataset.page;

        if (page === "home") {
            return initHome(force);
        }

        if (page === "product") {
            return initProductPage(force);
        }

        return Promise.resolve();
    }

    window.Products = Object.freeze({
        state,
        normalizeText,
        normalizeProduct,
        normalizeCharacteristics,
        normalizeLightCustomization,
        normalizeVariants,
        getSelectableVariants,
        getVariantStock,
        getVariantPrice,
        getVariantImages,
        buildProductGallery,
        formatPrice,
        calculateDiscountPercentage,
        isCatalogProduct,
        isCustomizableProduct,
        matchesCategory,
        searchProducts,
        getCatalogProducts,
        getBestSellers,
        categoryCount,
        getRelatedProducts,
        createProductCard,
        renderProducts,
        loadProducts,
        initHome,
        initProductPage,
        initCurrentPage,
        showToast
    });

    document.addEventListener(
        "DOMContentLoaded",
        () => {
            initCurrentPage();
        }
    );
})();
