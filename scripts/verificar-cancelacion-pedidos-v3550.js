"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
function ok(condition, message) {
    if (!condition) {
        console.error(`❌ ${message}`);
        process.exit(1);
    }
    console.log(`✅ ${message}`);
}

const config = read("js/config.js");
const auth = read("js/customer-auth.js");
const account = read("js/account-pages.js");
const seo = read("js/seo-v3490.js");

ok(config.includes('APP_VERSION: "3.55.0"'), "frontend declara version 3.55.0");
ok(config.includes('ventasEmail: "ventas@mommycrafts.cl"'), "correo ventas visible en CONFIG");
ok(!config.includes("contacto@mommycrafts.cl"), "CONFIG no mantiene correo contacto antiguo");
ok(seo.includes("sales and customer support") && seo.includes("ventas@mommycrafts.cl"), "Schema Organization incluye correo de ventas");
ok(auth.includes("cancelOrder") && auth.includes("/cancelar"), "CustomerAuth permite cancelar pedidos pendientes");
ok(account.includes("data-cancel-order") && account.includes("Cancelar pedido pendiente"), "Cuenta cliente muestra accion de cancelar pedido pendiente");
ok(account.includes("puedeCancelar"), "frontend respeta permiso de cancelacion enviado por backend");

console.log("\nVerificacion de cancelacion de pedidos y correo ventas v3.55.0 completada.");
