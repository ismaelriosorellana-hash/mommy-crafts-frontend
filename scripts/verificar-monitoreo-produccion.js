"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const errors = [];

function read(relative) {
    return fs.readFileSync(path.join(root, relative), "utf8");
}

const config = read("js/config.js");
const dashboardHtml = read("admin/index.html");
const dashboardJs = read("admin/js/dashboard.js");
const adminApi = read("admin/js/admin-api.js");

if (!config.includes('APP_VERSION: "3.63.0"')) {
    errors.push("js/config.js debe informar APP_VERSION 3.63.0.");
}

[
    "metric-api-status",
    "metric-db-status",
    "metric-backend-version",
    "metric-frontend-version",
    "metric-system-detail"
].forEach((id) => {
    if (!dashboardHtml.includes(`id=\"${id}\"`)) {
        errors.push(`admin/index.html: falta ${id}.`);
    }
});

if (!dashboardJs.includes("renderSystemStatus(")) {
    errors.push("admin/js/dashboard.js: falta renderSystemStatus.");
}

if (!dashboardJs.includes("metrics.sistema")) {
    errors.push("admin/js/dashboard.js: no consume metrics.sistema del backend.");
}

if (!dashboardJs.includes("CONFIG.APP_VERSION")) {
    errors.push("admin/js/dashboard.js: no muestra la versión del frontend.");
}

if (!adminApi.includes("sessionStorage")) {
    errors.push("admin/js/admin-api.js: la sesión administrativa debe usar sessionStorage.");
}

if (adminApi.includes("localStorage.setItem")) {
    errors.push("admin/js/admin-api.js: no debe persistir sesiones administrativas en localStorage.");
}

if (errors.length) {
    errors.forEach((error) => console.error(`❌ ${error}`));
    process.exit(1);
}

console.log("✅ Monitoreo de producción frontend v3.63.0 verificado.");
console.log("✅ Dashboard muestra API, MongoDB, versión backend y versión frontend.");
