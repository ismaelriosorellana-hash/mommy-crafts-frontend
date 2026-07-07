"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = {
    config: path.join(root, "js", "config.js"),
    pedidosHtml: path.join(root, "admin", "pedidos.html"),
    pedidosJs: path.join(root, "admin", "js", "orders-admin.js"),
    pedidosCss: path.join(root, "admin", "css", "admin-orders-pro-v3450.css")
};

function read(file) {
    return fs.readFileSync(file, "utf8");
}

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ ${message}`);
        process.exit(1);
    }
}

const config = read(files.config);
const html = read(files.pedidosHtml);
const js = read(files.pedidosJs);
const css = read(files.pedidosCss);

assert(config.includes('APP_VERSION: "3.63.0"'), "APP_VERSION debe ser 3.63.0.");
assert(html.includes("orders-admin.js?v=3.63.0"), "Pedidos debe cargar JS con versión 3.63.0.");
assert(html.includes("admin-orders-pro-v3450.css?v=3.63.0"), "Pedidos debe cargar CSS con versión 3.63.0.");

[
    "renderOrderCommunication",
    "loadNotificationPreview",
    "copyNotificationPreview",
    "openNotificationWhatsapp",
    "sendNotificationEmail",
    "/admin/pedidos/${encodeURIComponent(currentOrderId)}/notificaciones/"
].forEach((needle) => {
    assert(js.includes(needle), `Falta bloque de comunicación: ${needle}`);
});

[
    "data-notification-preview",
    "data-notification-copy",
    "data-notification-whatsapp",
    "data-notification-send-email",
    "order-notification-event",
    "Comunicación con el cliente"
].forEach((needle) => {
    assert(js.includes(needle), `Falta control UI de comunicación: ${needle}`);
});

[
    "order-communication-panel",
    "order-notification-preview",
    "order-communication-actions",
    "order-notification-text"
].forEach((needle) => {
    assert(css.includes(needle), `Falta estilo de comunicación: ${needle}`);
});

assert(!html.includes("notificaciones-pausado"), "No debe volver un módulo antiguo de notificaciones pausado.");
assert(!js.includes("MutationObserver"), "Pedidos no debe usar MutationObserver para esta mejora.");

console.log("✅ Comunicación de pedidos v3.63.0 verificada.");
