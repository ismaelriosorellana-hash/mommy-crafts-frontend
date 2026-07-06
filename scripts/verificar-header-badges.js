"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const settingsJs = fs.readFileSync(path.join(root, "js", "site-settings.js"), "utf8");
const commerceCss = fs.readFileSync(path.join(root, "css", "mc-commerce-tools-v3311.css"), "utf8");
const mainCss = fs.readFileSync(path.join(root, "css", "main.css"), "utf8");
const mobileCss = fs.readFileSync(path.join(root, "css", "mobile-polish-v3370.css"), "utf8");
const mobileMenuCss = fs.readFileSync(path.join(root, "css", "mobile-menu-v3380.css"), "utf8");
const mobileMenuJs = fs.readFileSync(path.join(root, "js", "mobile-menu-v3380.js"), "utf8");
const uiJs = fs.readFileSync(path.join(root, "js", "ui.js"), "utf8");
const commerceJs = fs.readFileSync(path.join(root, "js", "mc-commerce-tools-v3311.js"), "utf8");

const checks = [
    ["Apariencia guarda cache visual", settingsJs.includes("SETTINGS_CACHE_KEY") && settingsJs.includes("saveCachedSettings")],
    ["Header marca estado listo", settingsJs.includes("mc-site-settings-ready")],
    ["Header evita parpadeo inicial", commerceCss.includes("evita salto visual del header") && commerceCss.includes("opacity: 0")],
    ["Badges de descuento apilados globalmente", commerceCss.includes("badges apilados en todas las tarjetas") && commerceCss.includes("product-badge[hidden] + .product-discount-badge")],
    ["Descuento ya no depende solo de sugeridos", commerceCss.includes(".container-img .product-discount-badge")],
    ["Navbar móvil uniforme v3.47.0", (mobileCss.includes("--mc-mobile-action-size: 39px") || mobileMenuCss.includes("--mc-mobile-action-size: 39px")) && mobileCss.includes("margin-top: -25px !important")],
    ["Temporada móvil usa submenú visible", (mainCss.includes("season-mobile-submenu") || mobileCss.includes("season-mobile-submenu")) && uiJs.includes("setMobileOpen")],
    ["Header móvil de ficha conserva acciones", commerceJs.includes("keepActionsInNavbarForProductMobile")],
    ["Menú móvil profesional v3.47.0", mobileMenuCss.includes("mc-mobile-menu-panel") && mobileMenuJs.includes("data-mobile-menu-action") && mobileMenuJs.includes("category-view")],
];

const failed = checks.filter(([, ok]) => !ok);
checks.forEach(([name, ok]) => console.log(`${ok ? "✅" : "❌"} ${name}`));

if (failed.length) {
    console.error(`\nFallaron ${failed.length} verificaciones de header/badges.`);
    process.exit(1);
}

console.log(`\n✅ Header, badges y menú móvil v3.47.0 verificados (${checks.length} controles).`);
