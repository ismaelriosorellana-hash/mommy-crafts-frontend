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
const page = read('como-comprar.html');
const index = read('index.html');
const product = read('producto.html');
const sitemap = read('sitemap.xml');
const css = read('css/commercial-v3610.css');
assert(config.includes('APP_VERSION: "3.62.0"'), 'APP_VERSION debe ser 3.62.0');
assert(page.includes('Cómo comprar y personalizar tu producto'), 'debe existir página Cómo comprar');
assert(page.includes('Cómo personalizar mi producto'), 'debe incluir apartado de personalización');
assert(page.includes('https://mommycrafts.cl/como-comprar.html'), 'debe tener canonical/OG al dominio final');
assert(page.includes('HowTo'), 'debe incluir Schema.org HowTo');
assert(index.includes('href="como-comprar.html"'), 'home debe enlazar al menú Cómo comprar');
assert(product.includes('class="product-how-buy-link"'), 'ficha debe incluir enlace Cómo comprar antes de la descripción');
assert(product.indexOf('class="product-how-buy-link"') < product.indexOf('detalle-descripcion-panel'), 'enlace debe estar antes de Descripción del producto');
assert(sitemap.includes('https://mommycrafts.cl/como-comprar.html'), 'sitemap debe incluir como-comprar.html');
assert(css.includes('.how-buy-layout'), 'CSS debe incluir estilos para la página Cómo comprar');
console.log('✅ Página Cómo comprar y personalización v3.62.0 verificada');
