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

assert(config.includes('APP_VERSION: "3.63.0"'), 'APP_VERSION debe ser 3.63.0');
assert(index.includes('css/commercial-v3610.css?v=3.63.0'), 'index debe cargar commercial-v3610.css');
assert(product.includes('css/commercial-v3610.css?v=3.63.0'), 'producto debe cargar commercial-v3610.css');
assert(index.includes('id="como-funciona"'), 'home debe incluir ancla Cómo funciona');
assert(index.indexOf('id="categories-title"') < index.indexOf('id="how-it-works-title"'), 'categorías deben aparecer antes del paso a paso');
assert(index.indexOf('id="new-title"') < index.indexOf('id="how-it-works-title"'), 'productos nuevos deben aparecer antes del paso a paso');
assert(index.includes('como-comprar.html'), 'menú debe incluir acceso a Cómo comprar');
assert(index.includes('id="occasions-title"'), 'home debe incluir sección Compra según la ocasión');
assert(index.includes('Consultar por WhatsApp'), 'home debe incluir CTA de WhatsApp');
assert(product.includes('id="product-buying-guide-title"'), 'producto debe incluir guía antes de comprar');
assert(product.includes('La vista previa es referencial'), 'producto debe aclarar vista previa referencial');
assert(css.includes('.commercial-steps-grid'), 'CSS comercial debe incluir pasos');
assert(css.includes('.product-guide-grid'), 'CSS comercial debe incluir guía de producto');

console.log('✅ Mejora comercial frontend v3.63.0 verificada');
