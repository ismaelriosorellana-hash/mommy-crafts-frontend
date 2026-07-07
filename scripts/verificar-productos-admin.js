"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "admin", "productos.html"), "utf8");
const script = fs.readFileSync(path.join(root, "admin", "js", "products-admin.js"), "utf8");
const css = fs.readFileSync(path.join(root, "admin", "css", "admin.css"), "utf8");
const config = fs.readFileSync(path.join(root, "js", "config.js"), "utf8");
const errors = [];

const requiredIds = [
    "product-sku",
    "product-brand",
    "product-barcode",
    "product-weight",
    "product-length",
    "product-width",
    "product-height",
    "product-slug",
    "product-seo-title",
    "product-seo-description",
    "product-seo-keywords",
    "product-seo-image",
    "product-seo-noindex",
    "product-completion-label",
    "product-variants"
];

for (const id of requiredIds) {
    if (!html.includes(`id="${id}"`)) {
        errors.push(`Falta el campo #${id} en admin/productos.html.`);
    }
}

for (const tab of ["general", "logistica", "seo", "personalizacion", "variantes"]) {
    if (!html.includes(`data-product-tab="${tab}"`)) {
        errors.push(`Falta la pestaña ${tab}.`);
    }

    if (!html.includes(`data-product-panel="${tab}"`)) {
        errors.push(`Falta el panel ${tab}.`);
    }
}

[
    "setActiveProductTab",
    "updateProductFormStatus",
    "normalizeSkuClient",
    "pesoGramos",
    "dimensiones",
    "palabrasClave",
    "codigoBarras"
].forEach((token) => {
    if (!script.includes(token)) {
        errors.push(`products-admin.js no contiene ${token}.`);
    }
});

if (!css.includes("admin-product-tabs")) {
    errors.push("admin.css no contiene los estilos de pestañas de producto.");
}

if (!config.includes('APP_VERSION: "3.63.0"')) {
    errors.push("CONFIG.APP_VERSION no corresponde a 3.63.0.");
}

if (errors.length) {
    errors.forEach((error) => console.error(`❌ ${error}`));
    process.exit(1);
}

console.log("✅ Panel de productos 3.47.0 verificado.");
console.log("✅ SKU, logística, SEO, variantes y completitud están presentes.");
