#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
let errors = 0;

function ok(condition, message) {
    if (condition) {
        console.log(`✅ ${message}`);
    } else {
        console.error(`❌ ${message}`);
        errors += 1;
    }
}

function hasMeta(html, key, value) {
    const pattern = new RegExp(`<meta\\b(?=[^>]*(?:name|property)=["']${key}["'])(?=[^>]*content=["'][^"']*${value || ""}[^"']*["'])`, "i");
    return pattern.test(html);
}

const config = read("js/config.js");
const seo = read("js/seo-v3490.js");
const products = read("js/products.js");
const contentPages = read("js/content-pages.js");
const robots = read("robots.txt");
const sitemap = read("sitemap.xml");
const headers = read("_headers");

ok(config.includes('APP_VERSION: "3.54.0"'), "CONFIG informa versión 3.54.0");
ok(config.includes('SITE_URL: "https://mommycrafts.cl"'), "CONFIG define URL pública oficial");
ok(exists("js/seo-v3490.js"), "helper SEO v3.54.0 existe");
ok(seo.includes("updateProduct(product)"), "helper SEO actualiza metadatos de producto");
ok(seo.includes('"@type": "Product"'), "helper SEO genera Schema.org Product");
ok(seo.includes('"@type": "Organization"'), "helper SEO genera Schema.org Organization");
ok(seo.includes('"@type": "WebSite"'), "helper SEO genera Schema.org WebSite");
ok(products.includes("window.MommySEO?.updateProduct(product)"), "ficha de producto invoca SEO dinámico");
ok(products.includes('image.loading = "lazy"') && products.includes('image.decoding = "async"'), "tarjetas dinámicas usan lazy loading y decoding async");
ok(contentPages.includes("window.MommySEO?.updateContentPage(content)"), "páginas de confianza actualizan SEO dinámico");

const indexedPages = [
    "index.html",
    "catalogo.html",
    "producto.html",
    "comparacion.html",
    "quienes-somos.html",
    "contacto.html",
    "preguntas-frecuentes.html",
    "despachos-retiros.html",
    "cambios-pedidos.html",
    "seguridad.html",
    "privacidad.html",
    "terminos.html"
];

const noindexPages = [
    "404.html",
    "acceso.html",
    "cuenta.html",
    "pedido.html",
    "pago.html",
    "carrito.html",
    "finalizar-compra.html",
    "seguimiento-pedido.html",
    "pagina.html"
];

for (const page of [...indexedPages, ...noindexPages]) {
    const html = read(page);
    ok(html.includes("js/seo-v3490.js?v=3.54.0"), `${page} carga helper SEO`);
    ok(/<link\b(?=[^>]*rel=["']canonical["'])(?=[^>]*href=["']https:\/\/mommycrafts\.cl)/i.test(html), `${page} incluye canonical absoluto`);
    ok(hasMeta(html, "og:title"), `${page} incluye og:title`);
    ok(hasMeta(html, "og:description"), `${page} incluye og:description`);
    ok(hasMeta(html, "twitter:card", "summary_large_image"), `${page} incluye Twitter card`);
}

for (const page of indexedPages) {
    ok(hasMeta(read(page), "robots", "index, follow"), `${page} permite indexación`);
}

for (const page of noindexPages) {
    ok(hasMeta(read(page), "robots", "noindex"), `${page} queda noindex`);
}

ok(robots.includes("Sitemap: https://mommycrafts.cl/sitemap.xml"), "robots.txt declara sitemap público");
ok(robots.includes("Disallow: /admin/"), "robots.txt bloquea panel admin");
ok(robots.includes("Disallow: /finalizar-compra.html"), "robots.txt bloquea checkout");
ok(sitemap.includes("https://mommycrafts.cl/"), "sitemap incluye home");
ok(sitemap.includes("https://mommycrafts.cl/catalogo.html"), "sitemap incluye catálogo");
ok(sitemap.includes("https://mommycrafts.cl/despachos-retiros.html"), "sitemap incluye despachos/retiros");
ok(!sitemap.includes("/admin/"), "sitemap no incluye admin");
ok(!sitemap.includes("/carrito.html"), "sitemap no incluye carrito");
ok(exists("scripts/generar-sitemap.js"), "script funcional para sitemap dinámico existe");
ok(read("scripts/generar-sitemap.js").includes("/producto/${encodeURIComponent(slug)}"), "sitemap dinámico agrega productos con URL SEO /producto/slug");
ok(read("js/config.js").includes("/producto/${encodeURIComponent(slug)}"), "ProductLinks usa URLs públicas /producto/slug");
ok(read("js/products.js").includes("match(/^\\/producto\\/"), "ficha de producto reconoce rutas /producto/slug cuando el frontend las recibe");
ok(read("admin/js/products-admin.js").includes("mommycrafts.cl/producto/"), "admin muestra vista previa SEO con URL amigable");
ok(read("render.yaml.example").includes("source: /producto/*"), "render.yaml.example documenta rewrite SEO de productos");

ok(headers.includes("/sitemap.xml"), "headers configuran sitemap.xml");
ok(headers.includes("/robots.txt"), "headers configuran robots.txt");
ok(headers.includes("/seguimiento-pedido.html") && headers.includes("X-Robots-Tag"), "headers protegen páginas transaccionales");

for (const page of ["index.html", "catalogo.html", "producto.html", "carrito.html", "comparacion.html"]) {
    const html = read(page);
    ok(!html.includes("js/customization-mobile-v3432.js"), `${page} no recupera JS móvil anterior`);
    ok(!html.includes("css/customization-mobile-v3432.css"), `${page} no recupera CSS móvil anterior`);
}

const allFiles = fs.readdirSync(root, { recursive: true });
ok(!allFiles.some((name) => String(name).endsWith(".md")), "paquete no incluye archivos .md informativos");

if (errors) {
    console.error(`\nVerificación SEO/rendimiento/confianza con ${errors} error(es).`);
    process.exit(1);
}

console.log("\n✅ SEO, rendimiento y confianza v3.54.0 verificados.");
