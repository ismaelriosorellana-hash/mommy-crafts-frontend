"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function read(file) {
    return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function ok(message) {
    console.log(`✅ ${message}`);
}

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ ${message}`);
        process.exitCode = 1;
    } else {
        ok(message);
    }
}

const html = read("admin/pedidos.html");
const css = read("admin/css/admin-notifications-v3460.css");
const js = read("admin/js/orders-admin-notifications-v3460.js");

assert(html.includes("admin-notifications-v3460.css?v=3.46.0"), "Panel de pedidos carga CSS de notificaciones v3.46.0.");
assert(html.includes("orders-admin-notifications-v3460.js?v=3.46.0"), "Panel de pedidos carga JS de notificaciones v3.46.0.");
assert(css.includes(".admin-notification-panel"), "CSS define panel visual de mensajes automáticos.");
assert(css.includes("@media (max-width: 760px)"), "Panel de mensajes tiene adaptación móvil.");
assert(js.includes("/admin/pedidos/${encodeURIComponent(orderId)}/notificaciones"), "JS consulta plantillas de notificación del backend.");
assert(js.includes("notification-copy"), "JS permite copiar mensaje para WhatsApp.");
assert(js.includes("notification-send-email"), "JS permite enviar o registrar correo desde admin.");
assert(js.includes("order_created") && js.includes("payment_confirmed") && js.includes("ready"), "JS incluye plantillas principales de pedido.");

if (process.exitCode) {
    console.error("\nVerificación de notificaciones admin con errores.");
    process.exit(process.exitCode);
}

console.log("\nVerificación de notificaciones admin completada.");
