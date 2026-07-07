"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
function read(file) { return fs.readFileSync(path.join(root, file), "utf8"); }
function assert(condition, message) { if (!condition) throw new Error(message); }

const config = read("js/config.js");
const orders = read("admin/js/orders-admin.js");
const pedidos = read("admin/pedidos.html");

assert(config.includes('APP_VERSION: "3.61.1"'), "APP_VERSION debe ser 3.61.1.");
assert(orders.includes("plantilla oficial Mommy Crafts"), "Pedidos debe informar que el correo usa plantilla oficial.");
assert(pedidos.includes("orders-admin.js?v=3.61.1"), "Pedidos debe usar cache busting 3.61.1.");

console.log("✅ Plantillas de correo frontend v3.61.1 verificadas");
