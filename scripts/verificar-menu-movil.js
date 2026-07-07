
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const product = fs.readFileSync(path.join(root, "producto.html"), "utf8");
const css = fs.readFileSync(path.join(root, "css", "mobile-menu-v3380.css"), "utf8");
const js = fs.readFileSync(path.join(root, "js", "mobile-menu-v3380.js"), "utf8");
const config = fs.readFileSync(path.join(root, "js", "config.js"), "utf8");

const checks = [
    ["CONFIG versión 3.63.0", config.includes('APP_VERSION: "3.63.0"')],
    ["CSS de menú móvil cargado en inicio", index.includes('css/mobile-menu-v3380.css?v=3.63.0')],
    ["CSS de menú móvil cargado en producto", product.includes('css/mobile-menu-v3380.css?v=3.63.0')],
    ["JS de menú móvil cargado en inicio", index.includes('js/mobile-menu-v3380.js?v=3.63.0')],
    ["JS de menú móvil cargado en producto", product.includes('js/mobile-menu-v3380.js?v=3.63.0')],
    ["Panel lateral definido", css.includes('.mc-mobile-menu-panel') && css.includes('transform: translateX(-105%)')],
    ["Menú antiguo se desactiva en móvil", css.includes('.site-header .menu.is-open') && css.includes('display: none !important')],
    ["Botones móviles uniformes", css.includes('--mc-mobile-action-size: 39px')],
    ["Vista de categorías", js.includes('VIEW_CATEGORIES') && js.includes('renderCategoriesView')],
    ["Vista de subcategorías", js.includes('renderSubcategoryView') && js.includes('category-view')],
    ["Botón menú intercepta evento antiguo", js.includes('stopImmediatePropagation') && js.includes('mcProfessionalMenuBound')]
];

const failed = checks.filter(([, ok]) => !ok);
checks.forEach(([name, ok]) => console.log(`${ok ? "✅" : "❌"} ${name}`));

if (failed.length) {
    console.error(`\nFallaron ${failed.length} verificaciones de menú móvil.`);
    process.exit(1);
}

console.log(`\n✅ Menú móvil profesional v3.47.0 verificado (${checks.length} controles).`);
