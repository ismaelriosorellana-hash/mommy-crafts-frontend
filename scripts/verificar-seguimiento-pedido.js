#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(root, relative));
const checks = [];
function check(name, condition) {
    checks.push({ name, ok: Boolean(condition) });
}

const page = read("seguimiento-pedido.html");
const css = read("css/order-tracking-v3440.css");
const js = read("js/order-tracking-v3440.js");
const payment = read("js/payment-result.js");
const config = read("js/config.js");

check("existe página seguimiento-pedido.html", exists("seguimiento-pedido.html"));
check("seguimiento carga CSS v3.47.0", page.includes("css/order-tracking-v3440.css?v=3.63.0"));
check("seguimiento carga JS v3.47.0", page.includes("js/order-tracking-v3440.js?v=3.63.0"));
check("versión de app actualizada a 3.63.0", config.includes('APP_VERSION: "3.63.0"'));
check("formulario pide número de pedido y correo", page.includes("tracking-order-number") && page.includes("tracking-email"));
check("incluye consulta pública preparada", js.includes("/pedidos/seguimiento") && js.includes("tryPublicLookup"));
check("incluye carga por cuenta con sesión", js.includes("CustomerAuth.getOrder") && js.includes("hasSession"));
check("incluye línea de estados del pedido", js.includes("tracking-steps") && js.includes("Revisión del diseño") && js.includes("Fabricación"));
check("prioriza imagen personalizada en productos", js.includes("summary.vistaPrevia") && js.includes("assets?.finalPreview"));
check("incluye historial y resumen", js.includes("renderHistory") && js.includes("tracking-summary-list"));
check("incluye contacto por WhatsApp", js.includes("wa.me") && js.includes("whatsappUrl"));
check("CSS contiene layout escritorio", css.includes("tracking-layout") && css.includes("grid-template-columns"));
check("CSS contiene layout móvil", css.includes("@media (max-width: 900px)") && css.includes("grid-template-columns: 1fr"));
check("post-pago enlaza seguimiento", payment.includes("payment-tracking-link") && payment.includes("orderTrackingHref"));
check("no hay referencias antiguas en seguimiento", !/3\.(4[0-4])\.[0-9]/.test(page + js + css));

const failed = checks.filter((item) => !item.ok);
for (const item of checks) {
    console.log(`${item.ok ? "✅" : "❌"} ${item.name}`);
}
if (failed.length) {
    console.error(`\n${failed.length} verificación(es) fallaron.`);
    process.exit(1);
}
console.log("\n✅ Verificación de seguimiento de pedido aprobada.");
