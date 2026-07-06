"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "admin/pedidos.html"), "utf8");

function pass(message) { console.log(`✅ ${message}`); }
function fail(message) { console.error(`❌ ${message}`); process.exitCode = 1; }
function check(condition, message) { condition ? pass(message) : fail(message); }

check(html.includes("js/orders-admin.js?v=3.46.1"), "Pedidos carga JS principal v3.46.1.");
check(html.includes("js/orders-admin-pro-v3450.js?v=3.46.1"), "Pedidos carga capa visual profesional.");
check(!html.includes("orders-admin-notifications-v3460.js"), "Pedidos no carga módulo de notificaciones pausado.");
check(!html.includes("admin-notifications-v3460.css"), "Pedidos no carga CSS de notificaciones pausado.");
check(html.includes("id=\"orders-table\""), "Pedidos conserva tabla principal.");
check(html.includes("id=\"order-detail\""), "Pedidos conserva modal de detalle.");

if (process.exitCode) {
    console.error("\nVerificación de estabilidad de pedidos con errores.");
    process.exit(process.exitCode);
}
console.log("\nVerificación de estabilidad de pedidos completada.");
