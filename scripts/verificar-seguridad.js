"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const errors = [];
const warnings = [];

function walk(directory) {
    return fs.readdirSync(directory, { withFileTypes: true })
        .flatMap((entry) => {
            const fullPath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                return walk(fullPath);
            }

            return [fullPath];
        });
}

const htmlFiles = walk(root)
    .filter((file) =>
        file.endsWith(".html") &&
        !path.basename(file).startsWith("google")
    );

const sensitiveNames = new Set([
    "acceso.html",
    "cuenta.html",
    "pedido.html",
    "pago.html",
    "carrito.html",
    "finalizar-compra.html"
]);

htmlFiles.forEach((file) => {
    const relative = path.relative(root, file).replaceAll("\\", "/");
    const html = fs.readFileSync(file, "utf8");

    if (!/http-equiv=["']Content-Security-Policy["']/i.test(html)) {
        errors.push(`${relative}: falta CSP meta.`);
    }

    if (!/name=["']referrer["']/i.test(html)) {
        errors.push(`${relative}: falta Referrer-Policy meta.`);
    }

    const isSensitive =
        relative.startsWith("admin/") ||
        sensitiveNames.has(path.basename(file));

    if (
        isSensitive &&
        !/<meta\b(?=[^>]*name=["']robots["'])(?=[^>]*content=["'][^"']*noindex)/i.test(html)
    ) {
        errors.push(`${relative}: falta noindex.`);
    }

    const inlineScripts = [
        ...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)
    ].filter((match) => match[1].trim());

    if (inlineScripts.length) {
        errors.push(`${relative}: contiene scripts inline bloqueados por CSP.`);
    }

    const blankLinks = [
        ...html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)
    ];

    blankLinks.forEach((match) => {
        if (!/rel=["'][^"']*noopener/i.test(match[0])) {
            warnings.push(`${relative}: enlace _blank sin noopener.`);
        }
    });
});

const config = fs.readFileSync(
    path.join(root, "js", "config.js"),
    "utf8"
);

if (!config.includes('APP_VERSION: "3.46.0"')) {
    errors.push("js/config.js no informa la versión 3.46.0.");
}

if (!config.includes("https://mommy-crafts-backend.onrender.com/api")) {
    errors.push("La API de producción no apunta a Render mediante HTTPS.");
}

const headers = fs.readFileSync(
    path.join(root, "_headers"),
    "utf8"
);

[
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "X-Frame-Options",
    "Strict-Transport-Security"
].forEach((header) => {
    if (!headers.includes(header)) {
        errors.push(`_headers: falta ${header}.`);
    }
});

warnings.forEach((warning) => console.warn(`⚠️ ${warning}`));

if (errors.length) {
    errors.forEach((error) => console.error(`❌ ${error}`));
    process.exit(1);
}

console.log(`✅ Seguridad verificada en ${htmlFiles.length} páginas.`);
console.log("✅ CSP, noindex, URL HTTPS y encabezados presentes.");
