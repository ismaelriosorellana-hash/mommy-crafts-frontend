"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
    if (!condition) throw new Error(message);
};

const config = read("js/config.js");
assert(config.includes('APP_VERSION: "3.63.0"'), "APP_VERSION debe ser 3.63.0");
assert(config.includes("ANALYTICS"), "config.js debe declarar ANALYTICS");

const analytics = read("js/analytics-v3590.js");
[
    "gtag/js",
    "clarity.ms/tag",
    "view_item",
    "add_to_cart",
    "begin_checkout",
    "purchase",
    "contact_whatsapp"
].forEach((token) => assert(analytics.includes(token), `analytics-v3590.js debe incluir ${token}`));

const settingsAdmin = read("admin/js/site-settings-admin.js");
[
    "analytics-enabled",
    "analytics-ga4-id",
    "analytics-clarity-id",
    "renderAnalyticsFields"
].forEach((token) => assert(settingsAdmin.includes(token), `site-settings-admin.js debe incluir ${token}`));

const apariencia = read("admin/apariencia.html");
assert(apariencia.includes("Analítica web"), "Admin Apariencia debe mostrar la sección Analítica web");
assert(apariencia.includes("analytics-ga4-id"), "Admin Apariencia debe incluir campo GA4");
assert(apariencia.includes("analytics-clarity-id"), "Admin Apariencia debe incluir campo Clarity");

const headers = read("_headers");
[
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://analytics.google.com",
    "https://www.clarity.ms"
].forEach((token) => assert(headers.includes(token), `_headers debe permitir ${token}`));

const publicPages = fs.readdirSync(root).filter((file) => file.endsWith(".html"));
assert(publicPages.length >= 10, "Debe haber páginas HTML públicas para verificar");
publicPages.forEach((file) => {
    const html = read(file);
    assert(html.includes("js/analytics-v3590.js?v=3.63.0"), `${file} debe cargar analytics-v3590.js`);
    assert(html.includes("googletagmanager.com"), `${file} debe permitir GA4 en CSP meta`);
    assert(html.includes("clarity.ms"), `${file} debe permitir Clarity en CSP meta`);
});

console.log("✅ Analítica frontend v3.63.0 verificada");
