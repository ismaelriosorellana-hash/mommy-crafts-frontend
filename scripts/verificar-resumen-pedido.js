"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const config = fs.readFileSync(path.join(root, "js", "config.js"), "utf8");
const cart = fs.readFileSync(path.join(root, "js", "cart.js"), "utf8");
const checkout = fs.readFileSync(path.join(root, "js", "checkout.js"), "utf8");
const customization = fs.readFileSync(path.join(root, "js", "customization.js"), "utf8");
const accountPages = fs.readFileSync(path.join(root, "js", "account-pages.js"), "utf8");
const checkoutCss = fs.readFileSync(path.join(root, "css", "checkout.css"), "utf8");
const accountCss = fs.readFileSync(path.join(root, "css", "account.css"), "utf8");

const checks = [
    ["CONFIG versión 3.63.0", config.includes('APP_VERSION: "3.63.0"')],
    ["Carrito prioriza preview personalizada", cart.includes("function getDisplayImage") && cart.includes("summaryPreviewUrl") && cart.includes("finalPreview?.asset")],
    ["Resumen checkout usa imagen personalizada", checkout.includes("hasPersonalizedPreview") && checkout.includes("Vista final según la personalización realizada")],
    ["Pedido envía personalizacionResumen", checkout.includes("personalizacionResumen") && checkout.includes("vistaPrevia: imagenResumen")],
    ["Personalizador captura preview visible", customization.includes("capturePreviewSnapshot") && customization.includes("visible-preview-v3401")],
    ["Personalizador guarda previewSource", customization.includes("previewSource") && customization.includes("summaryPreviewUrl")],
    ["Detalle pedido recupera preview", accountPages.includes("orderItemImage") && accountPages.includes("is-personalized-order-item")],
    ["CSS checkout preview fiel", checkoutCss.includes("V3.47.0 · Resumen de pedido") && checkoutCss.includes("object-fit: contain")],
    ["CSS detalle pedido preview fiel", accountCss.includes("V3.47.0 · Detalle de pedido") && accountCss.includes("customer-order-item-image-link")]
];

const failed = checks.filter(([, ok]) => !ok);
checks.forEach(([name, ok]) => console.log(`${ok ? "✅" : "❌"} ${name}`));

if (failed.length) {
    console.error(`\nFallaron ${failed.length} verificaciones del resumen de pedido.`);
    process.exit(1);
}

console.log(`\n✅ Resumen de pedido personalizado v3.47.0 verificado (${checks.length} controles).`);
