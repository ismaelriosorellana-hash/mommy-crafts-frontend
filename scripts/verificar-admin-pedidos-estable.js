"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "admin/pedidos.html"), "utf8");
const pro = fs.readFileSync(path.join(ROOT, "admin/js/orders-admin-pro-v3450.js"), "utf8");
const orders = fs.readFileSync(path.join(ROOT, "admin/js/orders-admin.js"), "utf8");

function pass(message) { console.log(`✅ ${message}`); }
function fail(message) { console.error(`❌ ${message}`); process.exitCode = 1; }
function check(condition, message) { condition ? pass(message) : fail(message); }

check(html.includes("js/orders-admin.js?v=3.63.0"), "Pedidos carga JS principal v3.47.0.");
check(html.includes("js/orders-admin-pro-v3450.js?v=3.63.0"), "Pedidos carga capa visual estable v3.47.0.");
check(!html.includes("orders-admin-notifications-v3460.js"), "Pedidos no carga módulo de notificaciones pausado.");
check(!html.includes("admin-notifications-v3460.css"), "Pedidos no carga CSS de notificaciones pausado.");
check(!pro.includes("new MutationObserver"), "Capa profesional no usa MutationObserver que podía generar ciclo infinito.");
check(pro.includes("orders:rendered"), "Capa profesional actualiza hora solo cuando pedidos terminan de renderizar.");
check(orders.includes("orders:rendered"), "Módulo de pedidos emite evento seguro al terminar render.");
check(html.includes('id="orders-table"'), "Pedidos conserva tabla principal.");
check(html.includes('id="order-detail"'), "Pedidos conserva modal de detalle.");

if (process.exitCode) {
    console.error("\nVerificación de estabilidad de pedidos con errores.");
    process.exit(process.exitCode);
}
console.log("\nVerificación de estabilidad de pedidos completada.");
