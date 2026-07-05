#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const checks = [];
function check(name, condition) {
    checks.push({ name, ok: Boolean(condition) });
}

const pago = read("pago.html");
const css = read("css/post-purchase-v3430.css");
const js = read("js/payment-result.js");
const config = read("js/config.js");

check("pago.html carga CSS post-pago v3.44.0", pago.includes("css/post-purchase-v3430.css?v=3.44.0"));
check("payment-result.js actualizado a experiencia profesional", js.includes("payment-result-shell"));
check("incluye próximos pasos del pedido", js.includes("Qué pasa ahora") && js.includes("Revisión del diseño"));
check("incluye resumen lateral del pedido", js.includes("Resumen del pedido") && js.includes("post-summary-list"));
check("incluye productos del pedido", js.includes("payment-result-products") && js.includes("createProductList"));
check("incluye contacto por WhatsApp", js.includes("Contactar por WhatsApp") && js.includes("wa.me"));
check("mantiene reintento de pago Mercado Pago", js.includes("payment-retry") && js.includes("preferencia"));
check("limpia pago pendiente al confirmar", js.includes("sessionStorage.removeItem") && js.includes("mommycrafts_pending_payment"));
check("CSS contiene layout escritorio", css.includes("payment-result-shell") && css.includes("grid-template-columns"));
check("CSS contiene layout móvil", css.includes("@media (max-width: 900px)") && css.includes("grid-template-columns: 1fr"));
check("versión de app actualizada", config.includes('APP_VERSION: "3.44.0"'));
check("no hay referencia vieja en pago.html", !pago.includes("3.42.0"));

const failed = checks.filter((item) => !item.ok);
for (const item of checks) {
    console.log(`${item.ok ? "✅" : "❌"} ${item.name}`);
}

if (failed.length) {
    console.error(`\n${failed.length} verificación(es) fallaron.`);
    process.exit(1);
}

console.log("\n✅ Verificación post-pago profesional aprobada.");
