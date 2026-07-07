"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
function read(file) { return fs.readFileSync(path.join(root, file), "utf8"); }
function ok(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ ${message}`);
  }
}

const config = read("js/config.js");
const analytics = read("js/analytics-v3590.js");
const consent = read("js/privacy-consent-v3590.js");
const privacy = read("privacidad.html");
const index = read("index.html");

ok(config.includes('APP_VERSION: "3.63.0"'), "APP_VERSION 3.63.0 configurada");
ok(analytics.includes("mc_analytics_consent"), "analítica respeta preferencia local");
ok(analytics.includes("privacy:analytics-consent"), "analítica escucha cambios de consentimiento");
ok(consent.includes("Aceptar medición") && consent.includes("Solo necesarias"), "banner de privacidad contiene acciones claras");
ok(privacy.includes("Google Analytics 4") && privacy.includes("Microsoft Clarity"), "privacidad explica GA4 y Clarity");
ok(privacy.includes("data-open-privacy-preferences"), "privacidad permite gestionar preferencias");
ok(index.includes("privacy-consent-v3590.css") && index.includes("privacy-consent-v3590.js"), "home carga consentimiento de privacidad");

if (process.exitCode) process.exit(process.exitCode);
console.log("✅ Privacidad y consentimiento de analítica v3.63.0 verificados");
