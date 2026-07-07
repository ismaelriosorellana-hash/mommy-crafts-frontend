#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = process.cwd();
let errors = 0;

function read(file) {
    return fs.readFileSync(path.join(root, file), "utf8");
}

function ok(condition, message) {
    if (condition) {
        console.log(`✅ ${message}`);
    } else {
        console.error(`❌ ${message}`);
        errors += 1;
    }
}

const cuenta = read("cuenta.html");
const css = read("css/account-dashboard-v3470.css");
const js = read("js/account-dashboard-v3470.js");

ok(cuenta.includes("css/account-dashboard-v3470.css?v=3.63.0"), "cuenta carga estilos de dashboard cliente v3.47.0");
ok(cuenta.includes("js/account-dashboard-v3470.js?v=3.63.0"), "cuenta carga lógica de dashboard cliente v3.47.0");
ok(cuenta.includes("customer-account-overview"), "cuenta incluye resumen superior de pedidos");
ok(cuenta.includes("customer-next-step"), "cuenta incluye bloque de siguiente acción");
ok(cuenta.includes("account-shortcuts-v3470"), "cuenta incluye accesos rápidos de cliente");
ok(css.includes(".account-overview-v3470"), "CSS define tarjetas de resumen de cuenta");
ok(css.includes(".account-next-step-v3470"), "CSS define siguiente acción de cuenta");
ok(css.includes("@media (max-width: 640px)"), "CSS tiene adaptación móvil para la cuenta");
ok(js.includes("isPaymentPending"), "JS calcula pagos pendientes");
ok(js.includes("isDesignStage"), "JS detecta pedidos en revisión de diseño");
ok(js.includes("renderOverview"), "JS renderiza resumen de cuenta");
ok(js.includes("renderNextStep"), "JS renderiza siguiente acción del cliente");
ok(!js.includes("MutationObserver"), "dashboard de cuenta no usa MutationObserver para evitar ciclos");
ok(!cuenta.includes(".md"), "cuenta no referencia archivos markdown informativos");

if (errors) {
    console.error(`\nVerificación de cuenta cliente con ${errors} error(es).`);
    process.exit(1);
}

console.log("\nVerificación de cuenta cliente completada.");
