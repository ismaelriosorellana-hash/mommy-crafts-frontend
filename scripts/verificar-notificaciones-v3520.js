"use strict";

const fs = require("fs");
const path = require("path");

function read(file) {
    return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

const config = read("js/config.js");
const dashboardHtml = read("admin/index.html");
const dashboardJs = read("admin/js/dashboard.js");

const checks = [
    ["APP_VERSION 3.63.0", config.includes('APP_VERSION: "3.63.0"')],
    ["bloque Notificaciones de pedidos", dashboardHtml.includes("Notificaciones de pedidos")],
    ["métrica correo", dashboardHtml.includes("metric-notification-email")],
    ["métrica proveedor", dashboardHtml.includes("metric-notification-provider")],
    ["métrica aviso interno", dashboardHtml.includes("metric-notification-admin")],
    ["métrica WhatsApp", dashboardHtml.includes("metric-notification-whatsapp")],
    ["endpoint admin notificaciones", dashboardJs.includes('"/admin/notificaciones/estado"')],
    ["renderNotificationStatus", dashboardJs.includes("function renderNotificationStatus")],
    ["manejo de error de notificaciones", dashboardJs.includes("No fue posible leer el estado de notificaciones")]
];

const failed = checks.filter(([, ok]) => !ok);

if (failed.length) {
    failed.forEach(([label]) => console.error(`❌ ${label}`));
    process.exit(1);
}

console.log("✅ Notificaciones frontend v3.63.0 verificadas");
