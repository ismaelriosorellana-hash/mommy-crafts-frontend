"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const configPath = path.join(root, "js", "config.js");
const configText = fs.readFileSync(configPath, "utf8");
const versionMatch = configText.match(/APP_VERSION:\s*"([^"]+)"/);

if (!versionMatch) {
    console.error("❌ No se encontró CONFIG.APP_VERSION.");
    process.exit(1);
}

const appVersion = versionMatch[1];
const htmlFiles = [
    ...fs.readdirSync(root)
        .filter((name) => name.endsWith(".html"))
        .map((name) => path.join(root, name)),
    ...fs.readdirSync(path.join(root, "admin"))
        .filter((name) => name.endsWith(".html"))
        .map((name) => path.join(root, "admin", name))
];

const errors = [];
const assetPattern = /<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/gi;
const versionPattern = /[?&]v=([^&"'\s>]+)/g;

for (const htmlPath of htmlFiles) {
    const relative = path.relative(root, htmlPath);
    const html = fs.readFileSync(htmlPath, "utf8");

    for (const match of html.matchAll(versionPattern)) {
        if (match[1] !== appVersion) {
            errors.push(
                `${relative}: usa caché ${match[1]} en vez de ${appVersion}.`
            );
        }
    }

    for (const match of html.matchAll(assetPattern)) {
        const reference = match[1];
        if (
            !reference ||
            /^(?:https?:)?\/\//i.test(reference) ||
            /^(?:data:|#|mailto:|tel:)/i.test(reference)
        ) {
            continue;
        }

        const cleanReference = reference.split(/[?#]/, 1)[0];
        const absolute = path.resolve(path.dirname(htmlPath), cleanReference);
        if (!absolute.startsWith(root + path.sep)) {
            continue;
        }

        if (!fs.existsSync(absolute)) {
            errors.push(`${relative}: no existe ${reference}.`);
        }
    }
}

if (errors.length) {
    for (const error of errors) {
        console.error(`❌ ${error}`);
    }
    process.exit(1);
}

console.log(
    `✅ Frontend ${appVersion}: ${htmlFiles.length} páginas verificadas, sin recursos locales faltantes ni versiones de caché mezcladas.`
);
