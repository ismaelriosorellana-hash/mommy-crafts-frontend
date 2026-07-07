"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(relative) {
    return fs.readFileSync(path.join(root, relative), "utf8");
}

function assertIncludes(file, content, expected) {
    if (!content.includes(expected)) {
        throw new Error(`${file} no contiene: ${expected}`);
    }
}

const config = read("js/config.js");
assertIncludes("js/config.js", config, 'APP_VERSION: "3.63.0"');

const dashboardHtml = read("admin/index.html");
assertIncludes("admin/index.html", dashboardHtml, "admin-launch-security-status");
assertIncludes("admin/index.html", dashboardHtml, "Seguridad final antes de clientes reales");
assertIncludes("admin/index.html", dashboardHtml, "metric-launch-status");

const dashboardJs = read("admin/js/dashboard.js");
assertIncludes("admin/js/dashboard.js", dashboardJs, "/admin/seguridad/estado");
assertIncludes("admin/js/dashboard.js", dashboardJs, "renderLaunchSecurityStatus");
assertIncludes("admin/js/dashboard.js", dashboardJs, "launchStatusLabel");

const headers = read("_headers");
assertIncludes("_headers", headers, "Content-Security-Policy");
assertIncludes("_headers", headers, "X-Frame-Options: DENY");
assertIncludes("_headers", headers, "Strict-Transport-Security");
assertIncludes("_headers", headers, "X-Robots-Tag: noindex");

console.log("✅ Seguridad final frontend v3.63.0 verificada.");
