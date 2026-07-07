"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function read(file) { return fs.readFileSync(path.join(ROOT, file), "utf8"); }
function exists(file) { return fs.existsSync(path.join(ROOT, file)); }
function ok(message) { console.log(`✅ ${message}`); }
function assert(condition, message) {
    if (!condition) {
        console.error(`❌ ${message}`);
        process.exitCode = 1;
    } else {
        ok(message);
    }
}

const html = read("admin/pedidos.html");
const baseOrders = read("admin/js/orders-admin.js");
const proOrders = read("admin/js/orders-admin-pro-v3450.js");

assert(html.includes("orders-admin.js?v=3.63.0"), "Panel de pedidos carga módulo base de pedidos v3.47.0.");
assert(html.includes("orders-admin-pro-v3450.js?v=3.63.0"), "Panel de pedidos mantiene mejoras visuales operativas.");
assert(!html.includes("orders-admin-notifications-v3460.js"), "Panel de pedidos no carga JS de notificaciones que podía congelar la vista.");
assert(!html.includes("admin-notifications-v3460.css"), "Panel de pedidos no carga CSS de notificaciones pausado.");
assert(!exists("admin/js/orders-admin-notifications-v3460.js"), "Paquete limpio sin JS pausado de notificaciones.");
assert(!exists("admin/css/admin-notifications-v3460.css"), "Paquete limpio sin CSS pausado de notificaciones.");
assert(baseOrders.includes("loadOrders") && baseOrders.includes("renderOrders"), "Módulo base de pedidos conserva carga y renderizado.");
assert(proOrders.includes("orders-admin-pro-ready"), "Capa profesional de pedidos sigue activa.");
assert(!proOrders.includes("new MutationObserver"), "Capa profesional no usa observador que podía congelar pedidos.");
assert(html.includes("admin/pedidos") || html.includes('data-admin-page="pedidos"'), "Página de pedidos conserva identificador de módulo admin.");

if (process.exitCode) {
    console.error("\nVerificación de pedidos/notificaciones con errores.");
    process.exit(process.exitCode);
}

console.log("\nVerificación de pedidos/notificaciones completada.");
