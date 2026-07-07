"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const config = fs.readFileSync(path.join(root, "js", "config.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css", "customization-professional-v3390.css"), "utf8");
const js = fs.readFileSync(path.join(root, "js", "customization-professional-v3390.js"), "utf8");
const pages = ["index.html", "catalogo.html", "comparacion.html", "carrito.html", "producto.html"];

const checks = [
    ["CONFIG versión 3.63.0", config.includes('APP_VERSION: "3.63.0"')],
    ["CSS profesional existe", css.includes("Personalización profesional v3.47.0")],
    ["CSS modal profesional", css.includes(".mc-customization-pro .modal-box")],
    ["CSS trust strip", css.includes(".mc-customization-trust-strip")],
    ["CSS móvil modal", css.includes("@media (max-width: 900px)")],
    ["JS inicializa modal", js.includes("mc-customization-pro") && js.includes("addTrustStrip")],
    ["JS validación contextual", js.includes("showValidationForActiveStep")],
    ["JS borrador temporal controlado", js.includes("sessionStorage") && js.includes("DRAFT_KEY") && js.includes("currentStep() !== 6")],
    ["JS limpia borrador anterior", js.includes("clearLegacyDrafts") && js.includes("mommycrafts_customization_draft_v3390")],
    ["Placeholder inicial guía selección", config.includes("Elige tu producto") && config.includes("para verlo aquí")]
];

for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    checks.push([
        `${page} carga CSS profesional`,
        html.includes('css/customization-professional-v3390.css?v=3.63.0')
    ]);
    checks.push([
        `${page} carga JS profesional`,
        html.includes('js/customization-professional-v3390.js?v=3.63.0')
    ]);
}

const failed = checks.filter(([, ok]) => !ok);
checks.forEach(([name, ok]) => console.log(`${ok ? "✅" : "❌"} ${name}`));

if (failed.length) {
    console.error(`\nFallaron ${failed.length} verificaciones de personalización.`);
    process.exit(1);
}

console.log(`\n✅ Personalización profesional v3.47.0 verificada (${checks.length} controles).`);
