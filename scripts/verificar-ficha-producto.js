const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'producto.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'product-detail-v3332.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js', 'products.js'), 'utf8');

const checks = [
  ['CSS específico v3.33.2 cargado', html.includes('css/product-detail-v3332.css?v=3.33.2')],
  ['Layout marketplace presente', html.includes('product-detail-marketplace')],
  ['Galería con miniaturas laterales presente', html.indexOf('id="detalle-thumbnails"') < html.indexOf('class="detail-main-image-container"')],
  ['Columna de compra separada presente', html.includes('class="product-purchase-panel"')],
  ['Título de producto presente', html.includes('id="detalle-titulo"')],
  ['Título equilibrado, no gigante', /\.detail-title[\s\S]*font-size:\s*clamp\(2\.8rem,\s*2\.35vw,\s*3\.6rem\)/.test(css)],
  ['Título móvil armónico', /@media \(max-width: 700px\)[\s\S]*\.detail-title[\s\S]*font-size:\s*clamp\(2\.35rem/.test(css)],
  ['Resumen duplicado bajo título eliminado', !html.includes('id="detalle-resumen"') || /summary\.hidden = true/.test(js)],
  ['Bloque “Lo que debes saber” es colapsable', html.includes('<details class="product-key-facts"') && html.includes('<summary>')],
  ['Navegación de botones inferior eliminada', !html.includes('class="product-content-nav"')],
  ['Referencia/SKU presente', html.includes('id="detalle-referencia"')],
  ['Rating funciona como enlace a reseñas', html.includes('id="detalle-rating" href="#product-reviews-preview"')],
  ['Texto de entrega actualizado', html.includes('Opciones de entrega') && !html.includes('Ver entrega')],
  ['Personalización usa ancho completo', /\.light-customization-heading[\s\S]*grid-template-columns:\s*1fr/.test(css)],
  ['Contenedores de columnas sin caja innecesaria', /\.product-detail-images,[\s\S]*\.product-detail-info[\s\S]*border:\s*0;[\s\S]*background:\s*transparent;[\s\S]*box-shadow:\s*none/.test(css)],
  ['Ahorro visible presente', html.includes('id="detalle-ahorro"')],
  ['Bloque de confianza presente', html.includes('class="product-confidence"')],
  ['Confianza para personalización presente', html.includes('id="product-confidence-personalization"')],
  ['Contenido inferior seccionado', html.includes('class="product-detail-content"') && html.includes('id="product-reviews-preview"')],
  ['Descuento de sugeridos reubicado bajo la etiqueta', /related-products[\s\S]*product-discount-badge[\s\S]*top:\s*4\.9rem[\s\S]*left:\s*1\.2rem/.test(css)],
  ['No muestra cinco estrellas falsas en HTML', !html.includes('★★★★★')],
  ['JS genera datos clave', js.includes('function renderProductKeyFacts')],
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

console.log(`\n✅ Ficha de producto v3.33.2 verificada (${checks.length} controles).`);
