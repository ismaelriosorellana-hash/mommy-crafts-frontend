#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
let failures = 0;

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
    return fs.existsSync(path.join(root, relativePath));
}

function ok(message) {
    console.log(`✅ ${message}`);
}

function fail(message) {
    failures += 1;
    console.error(`❌ ${message}`);
}

function mustInclude(content, needle, message) {
    if (content.includes(needle)) ok(message);
    else fail(message);
}

function mustNotExist(relativePath, message) {
    if (!exists(relativePath)) ok(message);
    else fail(message);
}

const page = read("admin/pedidos.html");
const orders = read("admin/js/orders-admin.js");
const css = read("admin/css/admin-orders-pro-v3450.css");
const pro = read("admin/js/orders-admin-pro-v3450.js");

mustInclude(page, "css/admin-orders-pro-v3450.css?v=3.63.0", "pedidos.html carga la capa visual profesional v3.47.0");
mustInclude(page, "js/orders-admin-pro-v3450.js?v=3.63.0", "pedidos.html carga el complemento operativo v3.47.0");
mustInclude(page, "Controla pedidos, pagos, personalizaciones, diseño, fabricación y entrega", "introducción del panel explica el flujo operativo");

mustInclude(orders, "renderOrderInsights", "panel calcula métricas operativas de pedidos");
mustInclude(orders, "copyOrderSummary", "panel permite copiar resumen del pedido");
mustInclude(orders, "customerWhatsAppUrl", "panel genera contacto rápido por WhatsApp");
mustInclude(orders, "renderOrderProgress", "panel incluye línea de avance operativo");
mustInclude(orders, "orders-admin-table", "tabla de pedidos usa estructura profesional responsive");
mustInclude(orders, "data-label=\"Pedido\"", "tabla queda preparada como tarjetas en móvil");

mustInclude(css, ".orders-admin-insights", "CSS define tarjetas de métricas");
mustInclude(css, ".order-admin-hero", "CSS define cabecera operativa del detalle");
mustInclude(css, ".order-admin-progress", "CSS define línea de avance del pedido");
mustInclude(css, "@media (max-width: 820px)", "CSS incluye adaptación móvil del panel de pedidos");

mustInclude(pro, "orders-admin-pro-ready", "JS complementario marca el panel profesional como activo");
mustInclude(pro, "orders:rendered", "JS complementario actualiza hora solo después del render seguro");
mustInclude(pro, "updateLastSync", "JS complementario conserva hora de sincronización visual");
if (pro.includes("new MutationObserver")) fail("JS complementario no debe usar MutationObserver en Pedidos"); else ok("JS complementario no usa MutationObserver");

mustNotExist("js/customization-mobile-v3432.js", "no volvió el JS móvil antiguo de personalización");
mustNotExist("css/customization-mobile-v3432.css", "no volvió el CSS móvil antiguo de personalización");

if (failures) {
    console.error(`\nVerificación de admin pedidos con ${failures} error(es).`);
    process.exit(1);
}

console.log("\nVerificación de admin pedidos completada.");
