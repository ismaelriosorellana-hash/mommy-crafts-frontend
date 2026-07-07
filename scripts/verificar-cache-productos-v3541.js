"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const api = fs.readFileSync(path.join(root, "js", "api.js"), "utf8");
const config = fs.readFileSync(path.join(root, "js", "config.js"), "utf8");

function check(condition, message) {
    if (!condition) {
        console.error(`❌ ${message}`);
        process.exit(1);
    }
}

check(config.includes('APP_VERSION: "3.63.0"'), "APP_VERSION debe ser 3.63.0");
check(api.includes('cache: method === "GET" ? "no-store" : "default"'), "fetch GET debe usar cache no-store");
check(!api.includes('cache: "force-cache"'), "api.js no debe forzar cache en solicitudes API");

console.log("✅ Cache de productos frontend v3.63.0 verificado");
