"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const errors = [];

function read(relative) {
    return fs.readFileSync(path.join(root, relative), "utf8");
}

const config = read("js/config.js");
const api = read("js/api.js");
const products = read("js/products.js");
const cart = read("js/cart.js");

if (!config.includes('APP_VERSION: "3.62.0"')) {
    errors.push("js/config.js no informa la versión 3.62.0.");
}

if (!config.includes("window.ProductLinks")) {
    errors.push("Falta el generador central de enlaces de producto.");
}

[
    "obtenerCatalogo",
    "obtenerProductoPorId",
    "obtenerProductoPorSlug",
    "obtenerProductosRelacionados"
].forEach((method) => {
    if (!api.includes(method)) {
        errors.push(`js/api.js no contiene ${method}.`);
    }
});

if (/producto\.html\?id=/i.test(
    [
        products,
        cart,
        read("js/ui.js"),
        read("js/site-studio.js"),
        read("js/mc-commerce-tools-v3311.js")
    ].join("\n")
)) {
    errors.push("Todavía existen enlaces de producto construidos manualmente por ID.");
}

if (!products.includes("await API.obtenerProductoPorSlug")) {
    errors.push("La ficha no consulta directamente por slug.");
}

if (!products.includes("await API.obtenerProductoPorId")) {
    errors.push("La ficha no conserva compatibilidad directa por ID.");
}

if (!cart.includes("productSlug")) {
    errors.push("El carrito no conserva el slug del producto.");
}

try {
    const browser = {
        location: {
            hostname: "mommycrafts.cl"
        }
    };

    vm.runInNewContext(config, {
        window: browser,
        location: browser.location,
        URL,
        URLSearchParams,
        encodeURIComponent,
        Object
    });

    const slugLink = browser.ProductLinks.detail(
        { id: "123", slug: "cuaderno-devocional" },
        { variantId: "azul", size: "M" }
    );

    const idLink = browser.ProductLinks.detail({ id: "123" });

    if (slugLink !== "/producto/cuaderno-devocional?variante=azul&talla=M") {
        errors.push(`ProductLinks generó un enlace SEO por slug inesperado: ${slugLink}`);
    }

    if (idLink !== "producto.html?id=123") {
        errors.push(`ProductLinks no conserva la compatibilidad por ID: ${idLink}`);
    }
} catch (error) {
    errors.push(`No fue posible ejecutar ProductLinks: ${error.message}`);
}

if (errors.length) {
    errors.forEach((error) => console.error(`❌ ${error}`));
    process.exit(1);
}

console.log("✅ Catálogo 3.62.0 verificado.");
console.log("✅ Ficha directa por slug/ID, relacionados API y enlaces centralizados presentes.");
