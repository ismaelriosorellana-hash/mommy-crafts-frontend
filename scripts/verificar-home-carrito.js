"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const homeCss = fs.readFileSync(path.join(root, "css", "home.css"), "utf8");
const cartCss = fs.readFileSync(path.join(root, "css", "cart.css"), "utf8");
const homeJs = fs.readFileSync(path.join(root, "js", "home.js"), "utf8");
const commerceCss = fs.readFileSync(path.join(root, "css", "mc-commerce-tools-v3311.css"), "utf8");

const checks = [
    ["Banner móvil ajustado al ancho visible", homeCss.includes("body[data-page=\"home\"] .banner") && homeCss.includes("width: min(calc(100% - 3rem), var(--container-width))")],
    ["Banner móvil conserva altura tipo cinta", homeCss.includes("min-height: clamp(12rem, 33vw, 14rem)")],
    ["Carruseles de inicio sin fondos globales", homeCss.includes("body[data-page=\"home\"] .trending-section") && homeCss.includes("background: transparent !important")],
    ["Arrastre no bloquea clics simples", homeJs.includes("const threshold = Number(options.threshold || 8)") && homeJs.includes("if (!isDragging) return")],
    ["Carruseles con inercia suave", homeJs.includes("startMomentum") && homeJs.includes("requestAnimationFrame(step)")],
    ["Carrusel usa scroll nativo en touch", homeJs.includes('event.pointerType === "touch"') && homeJs.includes('scroll nativo')],
    ["Tarjetas del carrusel móvil igualan grilla de categoría", homeCss.includes('grid-auto-columns: minmax(15.8rem, calc((100vw - 4.3rem) / 2))')],
    ["Fondo de carruseles igual al fondo principal", homeCss.includes('background-color: var(--color-background) !important')],
    ["Scroll snap no fuerza tirones al arrastrar", homeCss.includes("scroll-snap-type: x proximity") && homeCss.includes("scroll-snap-type: none !important")],
    ["Carrito móvil ordena productos antes del resumen", cartCss.includes("productos primero, resumen después") && cartCss.includes(".cart-products") && cartCss.includes("order: 1") && cartCss.includes("order: 2")],
    ["Resumen de carrito no queda sticky en móvil", cartCss.includes("position: static !important")],
    ["Badges siguen protegidos en tarjetas", commerceCss.includes("V3.36 · badges protegidos") && commerceCss.includes("--mc-card-tool-safe-area")]
];

const failed = checks.filter(([, ok]) => !ok);
checks.forEach(([name, ok]) => console.log(`${ok ? "✅" : "❌"} ${name}`));

if (failed.length) {
    console.error(`\nFallaron ${failed.length} verificaciones de home/carrito.`);
    process.exit(1);
}

console.log(`\n✅ Home, carruseles y carrito v3.47.0 verificados (${checks.length} controles).`);
