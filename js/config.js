"use strict";

const IS_LOCAL_ENVIRONMENT =
    ["localhost", "127.0.0.1"]
        .includes(window.location.hostname);

const API_BASE_URL =
    IS_LOCAL_ENVIRONMENT
        ? "http://localhost:3000/api"
        : "https://mommy-crafts-backend.onrender.com/api";

window.CONFIG = Object.freeze({
    APP_VERSION: "3.27.0",

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
            "agenda personal 2026": 7990,
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
            instructions: "El envío se realizará dentro de 3 días hábiles después de la confirmación del pedido. Esta confirmación será notificada al cliente por correo electrónico o WhatsApp."
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
                <text x="400" y="700" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#7f5963">
                    Imagen no disponible
                </text>
            </svg>
        `)
});
