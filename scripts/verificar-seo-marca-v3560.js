#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const index = read("index.html");
const config = read("js/config.js");
const seo = read("js/seo-v3490.js");
const sitemap = read("sitemap.xml");
const robots = read("robots.txt");

const checks = [
  ["version config", config.includes('APP_VERSION: "3.60.0"')],
  ["home title marca", index.includes("Tienda online oficial de productos personalizados")],
  ["home canonical final", index.includes('href="https://mommycrafts.cl/" rel="canonical"')],
  ["schema organization static", index.includes('id="brand-organization-static"')],
  ["instagram visible", index.includes("https://www.instagram.com/mommycrafts.cl/")],
  ["tiktok visible", index.includes("https://www.tiktok.com/@mommycrafts.cl")],
  ["correo ventas visible", index.includes("ventas@mommycrafts.cl")],
  ["robots dominio final", robots.includes("Sitemap: https://mommycrafts.cl/sitemap.xml")],
  ["sitemap sin netlify", !/netlify\.app/i.test(sitemap + index + config + seo)],
  ["sitemap sin onrender", !/mommycrafts\.onrender\.com/i.test(sitemap + robots)],
  ["archivo verificacion antiguo eliminado", !fs.existsSync(path.join(root, "googlec321375894d8c5db.html"))]
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error("❌ SEO de marca v3.60.0 con errores:");
  failed.forEach(([name]) => console.error(`- ${name}`));
  process.exit(1);
}

console.log("✅ SEO de marca y limpieza Netlify frontend v3.60.0 verificado");
