"use strict";

const IS_LOCAL_ENVIRONMENT =
    ["localhost", "127.0.0.1"]
        .includes(window.location.hostname);

const API_BASE_URL =
    IS_LOCAL_ENVIRONMENT
        ? "http://localhost:3000/api"
        : "https://mommy-crafts-backend.onrender.com/api";

window.CONFIG = Object.freeze({
    APP_VERSION: "3.53.0",
    SITE_URL: "https://mommycrafts.onrender.com",
    SITE_NAME: "Mommy Crafts",
    BRAND_NAME: "Mommy Crafts",
    DEFAULT_SEO_IMAGE: "https://res.cloudinary.com/jo3bgrnh/image/upload/v1782320550/Mommy_Crafts_2_1_hbj8xi.png",

    FREE_SHIPPING_THRESHOLD: 25000,

    PAYMENT: Object.freeze({
        receiptHours: 3,
        emailEnabled: false,
        paymentsEmail: "",
        designsEmail: "",
        bankDetailsConfigured: false,
        bankDetailsMessage: "Los datos bancarios se entregarán únicamente mediante un canal oficial de Mommy Crafts. Verifica siempre el nombre del destinatario antes de transferir."
    }),

    API_BASE_URL,

    ENDPOINTS: Object.freeze({
        productos: "/productos",
        categorias: "/categorias",
        mercadoPagoEstado: "/pagos/mercadopago/estado"
    }),

    CATEGORIES: Object.freeze([
        "Todos",
        "Librería",
        "Tazas",
        "Vasos",
        "Botellas",
        "Vestuario",
        "Regalos",
        "Educativos",
        "Corporativos",
        "Infantiles",
        "Cristianos",
        "Temporada"
    ]),

    SEASON_CATEGORIES: Object.freeze([
        "Navidad",
        "Día de la Madre",
        "Día del Padre",
        "Día del Niño",
        "Profesores",
        "Graduaciones",
        "Bautizos",
        "Baby Shower"
    ]),

    /* Tipos disponibles exclusivamente en el personalizador. */
    CUSTOMIZATION_CATEGORIES: Object.freeze([
        "Librería",
        "Tazas",
        "Vasos",
        "Botellas",
        "Vestuario",
        "Accesorios",
        "Otros"
    ]),

    CUSTOMIZATION_PRICING: Object.freeze({
        categoryBase: Object.freeze({
            "Librería": 7990,
            "Tazas": 4990,
            "Vasos": 6990,
            "Botellas": 7990,
            "Vestuario": 12990,
            "Accesorios": 5990,
            "Otros": 7990
        }),

        productBaseOverrides: Object.freeze({
            "poleron": 12990,
            "polerón": 12990,
            "taza": 4990
        }),

        extras: Object.freeze({
            image: 3000,
            mainText: 2000,
            secondaryText: 2000
        })
    }),


/*
 * Banner principal. Para cambiarlo, pega aquí la URL de Cloudinary.
 * Puedes agregar más objetos al arreglo y se mostrarán automáticamente.
 */
HOME_BANNERS: Object.freeze([
    Object.freeze({
        desktopImage: "",
        mobileImage: "",
        position: "center",
        eyebrow: "Regalos creados con intención",
        title: "Productos auténticos y únicos para quienes más quieres",
        buttonText: "Ver productos",
        target: "#lo-mas-vendido"
    })
]),


    DELIVERY_DEFAULTS: Object.freeze({
        shipping: Object.freeze({
            enabled: true,
            instructions: "Provincia de Santiago: entrega entre 5 y 7 días hábiles desde la confirmación del pedido, con costo de $4.000. Otros sectores de Chile: envío por Chilexpress desde 5 días hábiles, con costo por pagar y coordinación previa con el cliente."
        }),
        pickup: Object.freeze({
            enabled: true,
            instructions: "El lugar definido para retiros es la salida norte de la estación Macul, Línea 4 del Metro de Santiago. La fecha y hora de entrega serán coordinadas una vez confirmado el pedido."
        })
    }),

    soporteTelefono: "+56 9 5463 3848",
    whatsapp: "56954633848",
    soporteMensaje: "Necesito ayuda con un producto",

    social: Object.freeze({
        instagram: "https://www.instagram.com/mommycrafts.cl/",
        whatsapp: "https://wa.me/56954633848",
        threads: "https://www.threads.com/@mommycrafts.cl",
        tiktok: "https://www.tiktok.com/@mommycrafts.cl"
    }),

    locale: "es-CL",
    currency: "CLP",
    environment:
        IS_LOCAL_ENVIRONMENT
            ? "development"
            : "production",
    requestTimeoutMs: 12000,

    placeholderImage:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
                <rect width="800" height="800" fill="#f7eef1"/>
                <circle cx="400" cy="340" r="90" fill="#e9a8b5"/>
                <path d="M230 610c35-110 115-165 170-165s135 55 170 165" fill="#e9a8b5"/>
                <text x="400" y="680" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="#7f5963">
                    Elige tu producto
                </text>
                <text x="400" y="724" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#7f5963">
                    para verlo aquí
                </text>
            </svg>
        `)
});


window.ProductLinks = Object.freeze({
    detail(productOrId, options = {}) {
        const product =
            productOrId && typeof productOrId === "object"
                ? productOrId
                : { id: productOrId };

        const slug = String(product.slug || "").trim();
        const id = String(product.id || product._id || "").trim();

        const variant =
            options.variantId ||
            options.variante ||
            product.variantId ||
            "";

        const size =
            options.size ||
            options.talla ||
            product.size ||
            "";

        const optionParams = new URLSearchParams();
        if (variant) optionParams.set("variante", String(variant));
        if (size) optionParams.set("talla", String(size));

        if (slug) {
            const query = optionParams.toString();
            return `/producto/${encodeURIComponent(slug)}${query ? `?${query}` : ""}`;
        }

        if (id) {
            const params = new URLSearchParams();
            params.set("id", id);
            for (const [key, value] of optionParams.entries()) {
                params.set(key, value);
            }
            return `producto.html?${params.toString()}`;
        }

        return "catalogo.html";
    },

    legacyDetail(productOrId, options = {}) {
        const product =
            productOrId && typeof productOrId === "object"
                ? productOrId
                : { id: productOrId };

        const slug = String(product.slug || "").trim();
        const id = String(product.id || product._id || "").trim();
        const params = new URLSearchParams();

        if (slug) params.set("slug", slug);
        else if (id) params.set("id", id);

        const variant = options.variantId || options.variante || product.variantId || "";
        const size = options.size || options.talla || product.size || "";

        if (variant) params.set("variante", String(variant));
        if (size) params.set("talla", String(size));

        const query = params.toString();
        return query ? `producto.html?${query}` : "catalogo.html";
    }
});
