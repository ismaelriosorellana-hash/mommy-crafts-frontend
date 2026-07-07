#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
};

const config = read('js/config.js');
const index = read('index.html');
const product = read('producto.html');
const css = read('css/commercial-v3610.css');

assert(config.includes('APP_VERSION: "3.61.0"'), 'APP_VERSION debe ser 3.61.0');
assert(index.includes('css/commercial-v3610.css?v=3.61.0'), 'index debe cargar commercial-v3610.css');
assert(product.includes('css/commercial-v3610.css?v=3.61.0'), 'producto debe cargar commercial-v3610.css');
assert(index.includes('id="how-it-works-title"'), 'home debe incluir sección Cómo funciona');
assert(index.includes('id="occasions-title"'), 'home debe incluir sección Compra según la ocasión');
assert(index.includes('Consultar por WhatsApp'), 'home debe incluir CTA de WhatsApp');
assert(product.includes('id="product-buying-guide-title"'), 'producto debe incluir guía antes de comprar');
assert(product.includes('La vista previa es referencial'), 'producto debe aclarar vista previa referencial');
assert(css.includes('.commercial-steps-grid'), 'CSS comercial debe incluir pasos');
assert(css.includes('.product-guide-grid'), 'CSS comercial debe incluir guía de producto');

console.log('✅ Mejora comercial frontend v3.61.0 verificada');
