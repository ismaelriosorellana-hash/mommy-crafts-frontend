const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'producto.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'product-detail-v3330.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js', 'products.js'), 'utf8');

const checks = [
  ['CSS específico cargado', html.includes('css/product-detail-v3330.css?v=3.33.0')],
  ['Título de producto presente', html.includes('id="detalle-titulo"')],
  ['Resumen breve presente', html.includes('id="detalle-resumen"')],
  ['Referencia/SKU presente', html.includes('id="detalle-referencia"')],
  ['Rating honesto presente', html.includes('id="detalle-rating"')],
  ['Ahorro visible presente', html.includes('id="detalle-ahorro"')],
  ['Bloque de confianza presente', html.includes('class="product-confidence"')],
  ['Confianza para personalización presente', html.includes('id="product-confidence-personalization"')],
  ['Título responsive grande', /\.detail-title[\s\S]*font-size:\s*clamp\(4rem/.test(css)],
  ['Título móvil reforzado', /@media \(max-width: 700px\)[\s\S]*\.detail-title[\s\S]*font-size:\s*clamp\(3rem/.test(css)],
  ['No muestra cinco estrellas falsas en HTML', !html.includes('★★★★★')],
  ['JS genera resumen', js.includes('function buildProductLead')],
  ['JS actualiza SKU por variante', js.includes('function updateProductReference')],
  ['JS renderiza reseñas reales', js.includes('function renderProductRating')],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) {
  console.log(`${ok ? '✅' : '❌'} ${name}`);
}

if (failed.length) {
  console.error(`\nFallaron ${failed.length} verificaciones de ficha de producto.`);
  process.exit(1);
}

console.log(`\n✅ Ficha de producto v3.33.0 verificada (${checks.length} controles).`);
