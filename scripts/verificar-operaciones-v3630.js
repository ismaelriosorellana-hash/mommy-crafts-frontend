"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertContains(file, expected) {
    const content = read(file);
    if (!content.includes(expected)) {
        throw new Error(`${file} no contiene: ${expected}`);
    }
}

assertContains("js/config.js", 'APP_VERSION: "3.63.0"');
assertContains("admin/operaciones.html", "Centro operativo");
assertContains("admin/operaciones.html", "operations-admin-v3630.js");
assertContains("admin/js/admin-common.js", 'id: "operaciones"');
assertContains("admin/js/admin-common.js", 'href: "operaciones.html"');
assertContains("admin/js/operations-admin-v3630.js", "/admin/operaciones");
assertContains("admin/css/admin-operations-v3630.css", ".operation-item");
assertContains("admin/index.html", "dashboard-operations-shortcut");

console.log("✅ Centro operativo frontend v3.63.0 verificado");
