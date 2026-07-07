#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

const html = read('finalizar-compra.html');
const css = read('css/checkout-readable-v3431.css');

assert(html.includes('checkout-readable-v3431.css?v=3.63.0'), 'finalizar-compra carga la capa de legibilidad v3.47.0');
assert(css.includes('grid-template-columns: 8.8rem minmax(0, 1fr) auto'), 'resumen personalizado reserva columna suficiente para imagen grande en escritorio');
assert(css.includes('grid-template-columns: 8.2rem minmax(0, 1fr)'), 'resumen personalizado reserva columna suficiente para imagen grande en móvil');
assert(css.includes('white-space: normal !important'), 'descripciones del resumen pueden ocupar más de una línea sin solaparse');
assert(css.includes('--mc-checkout-readable-input: 1.38rem'), 'campos de texto tienen tamaño móvil más legible');
assert(css.includes('min-height: 4.8rem'), 'campos de texto tienen altura cómoda');
assert(css.includes('checkout-summary-design-note'), 'etiqueta de vista final personalizada mantiene estilo controlado');
console.log('\nVerificación de checkout legible completada.');
