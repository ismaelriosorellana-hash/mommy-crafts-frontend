#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const finalDomain = "https://mommycrafts.cl";
const oldDomain = "mommycrafts.onrender.com";

function read(relative) {
    return fs.readFileSync(path.join(root, relative), "utf8");
}

function fail(message) {
    throw new Error(message);
}

const config = read("js/config.js");
if (!config.includes('APP_VERSION: "3.55.0"')) {
    fail("js/config.js no informa APP_VERSION 3.55.0.");
}
if (!config.includes(`SITE_URL: "${finalDomain}"`)) {
    fail("js/config.js no usa mommycrafts.cl como SITE_URL.");
}

const robots = read("robots.txt");
if (!robots.includes(`Sitemap: ${finalDomain}/sitemap.xml`)) {
    fail("robots.txt no apunta al sitemap del dominio final.");
}

const sitemap = read("sitemap.xml");
if (!sitemap.includes(`<loc>${finalDomain}/</loc>`)) {
    fail("sitemap.xml no contiene la home del dominio final.");
}
if (sitemap.includes(oldDomain)) {
    fail("sitemap.xml aún contiene mommycrafts.onrender.com.");
}

const seo = read("js/seo-v3490.js");
if (!seo.includes(finalDomain)) {
    fail("helper SEO no contiene dominio final como fallback.");
}

const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith(".html"));
const htmlWithOldDomain = htmlFiles.filter((file) => read(file).includes(oldDomain));
if (htmlWithOldDomain.length) {
    fail(`Hay HTML con dominio antiguo: ${htmlWithOldDomain.join(", ")}`);
}

const adminProducts = read("admin/js/products-admin.js");
if (!adminProducts.includes("mommycrafts.cl/producto/")) {
    fail("Admin productos no muestra vista previa SEO con dominio final.");
}

console.log("✅ Dominio final frontend v3.55.0 verificado.");
