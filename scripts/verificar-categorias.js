"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const config = fs.readFileSync(path.join(root, "js", "config.js"), "utf8");
const categoriesJs = fs.readFileSync(path.join(root, "js", "categories.js"), "utf8");
const uiJs = fs.readFileSync(path.join(root, "js", "ui.js"), "utf8");
const productsJs = fs.readFileSync(path.join(root, "js", "products.js"), "utf8");
const homeJs = fs.readFileSync(path.join(root, "js", "home.js"), "utf8");
const homeCss = fs.readFileSync(path.join(root, "css", "home.css"), "utf8");
const adminHtml = fs.readFileSync(path.join(root, "admin", "categorias.html"), "utf8");
const adminJs = fs.readFileSync(path.join(root, "admin", "js", "categories-admin.js"), "utf8");
const adminCommon = fs.readFileSync(path.join(root, "admin", "js", "admin-common.js"), "utf8");

const htmlFiles = [
    ...fs.readdirSync(root).filter((name) => name.endsWith(".html"))
];

const checks = [
    ["Config incluye endpoint de categorías", config.includes('categorias: "/categorias"')],
    ["Servicio público de categorías existe", categoriesJs.includes("window.Categories") && categoriesJs.includes("loadCategories")],
    ["Menú usa categorías administrables", uiJs.includes("getMenuCategories")],
    ["Carrusel de inicio usa categorías administrables", productsJs.includes("getHomeCategories")],
    ["Página admin de categorías existe", adminHtml.includes('data-admin-page="categorias"')],
    ["Script admin de categorías existe", adminJs.includes('/admin/categorias')],
    ["Navegación admin incluye Categorías", adminCommon.includes('id: "categorias"')],
    ["Páginas públicas cargan categories.js", htmlFiles.every((name) => {
        const html = fs.readFileSync(path.join(root, name), "utf8");
        return !html.includes("js/products.js") || html.includes("js/categories.js?v=3.63.0");
    })],
    ["Inicio muestra categorías aunque no tengan productos", !productsJs.includes("publicProducts.some((product) =>")],
    ["Carruseles permiten arrastre con clic", homeJs.includes("enableDragScroll") && homeJs.includes("pointermove")],
    ["Carruseles sin fondo global", homeCss.includes("V3.47.0") && homeCss.includes("background: transparent !important")],
    ["Banner móvil reducido a cinta", homeCss.includes("33vw") && homeCss.includes("background-size: contain")]
];

const failed = checks.filter(([, ok]) => !ok);
checks.forEach(([name, ok]) => console.log(`${ok ? "✅" : "❌"} ${name}`));

if (failed.length) {
    console.error(`\nFallaron ${failed.length} verificaciones de categorías.`);
    process.exit(1);
}

console.log(`\n✅ Categorías administrables v3.47.0 verificadas (${checks.length} controles).`);
