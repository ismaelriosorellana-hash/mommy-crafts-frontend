#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE_URL = "https://mommycrafts.onrender.com";
const API_URL = "https://mommy-crafts-backend.onrender.com/api/productos?limite=200";
const TODAY = new Date().toISOString().slice(0, 10);

const staticUrls = [
    ["/", "weekly", "1.0"],
    ["/catalogo.html", "weekly", "0.9"],
    ["/quienes-somos.html", "monthly", "0.6"],
    ["/contacto.html", "monthly", "0.6"],
    ["/preguntas-frecuentes.html", "monthly", "0.6"],
    ["/despachos-retiros.html", "monthly", "0.6"],
    ["/cambios-pedidos.html", "monthly", "0.6"],
    ["/seguridad.html", "monthly", "0.5"],
    ["/privacidad.html", "yearly", "0.4"],
    ["/terminos.html", "yearly", "0.4"],
    ["/comparacion.html", "monthly", "0.5"]
];

function escapeXml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function normalizeProducts(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.productos)) return payload.productos;
    return [];
}

function productUrl(product) {
    const slug = String(product.slug || "").trim();
    const id = String(product._id || product.id || "").trim();
    if (slug) return `/producto.html?slug=${encodeURIComponent(slug)}`;
    if (id) return `/producto.html?id=${encodeURIComponent(id)}`;
    return "";
}

function productLastmod(product) {
    const raw = product.updatedAt || product.fechaActualizacion || product.createdAt || product.fechaCreacion;
    const date = raw ? new Date(raw) : null;
    if (date && !Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    return TODAY;
}

async function loadProductUrls() {
    if (typeof fetch !== "function") return [];

    try {
        const response = await fetch(API_URL, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout ? AbortSignal.timeout(25000) : undefined
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const products = normalizeProducts(payload);

        return products
            .filter((product) => product && product.activo !== false && product.publicarCatalogo !== false)
            .map((product) => ({
                loc: productUrl(product),
                lastmod: productLastmod(product),
                changefreq: "weekly",
                priority: "0.7"
            }))
            .filter((entry) => entry.loc);
    } catch (error) {
        console.warn(`No fue posible cargar productos para sitemap dinámico: ${error.message}`);
        return [];
    }
}

function renderUrl(entry) {
    const loc = typeof entry === "string" ? entry : entry.loc;
    const lastmod = entry.lastmod || TODAY;
    const changefreq = entry.changefreq || "monthly";
    const priority = entry.priority || "0.5";

    return [
        "  <url>",
        `    <loc>${escapeXml(SITE_URL + loc)}</loc>`,
        `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
        `    <changefreq>${escapeXml(changefreq)}</changefreq>`,
        `    <priority>${escapeXml(priority)}</priority>`,
        "  </url>"
    ].join("\n");
}

async function main() {
    const staticEntries = staticUrls.map(([loc, changefreq, priority]) => ({
        loc,
        lastmod: TODAY,
        changefreq,
        priority
    }));

    const productEntries = await loadProductUrls();
    const entries = [...staticEntries, ...productEntries];
    const xml = [
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
        "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
        ...entries.map(renderUrl),
        "</urlset>",
        ""
    ].join("\n");

    fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml, "utf8");
    console.log(`Sitemap generado con ${entries.length} URL(s), incluyendo ${productEntries.length} producto(s).`);
}

main().catch((error) => {
    console.error(`Error al generar sitemap: ${error.message}`);
    process.exit(1);
});
