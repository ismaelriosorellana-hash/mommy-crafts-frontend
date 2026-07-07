const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'producto.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'product-detail-v3340.css'), 'utf8');
const productCss = css;
const js = fs.readFileSync(path.join(root, 'js', 'products.js'), 'utf8');
const siteSettingsJs = fs.readFileSync(path.join(root, 'js', 'site-settings.js'), 'utf8');
const commerceToolsJs = fs.readFileSync(path.join(root, 'js', 'mc-commerce-tools-v3311.js'), 'utf8');
const mainCss = fs.readFileSync(path.join(root, 'css', 'main.css'), 'utf8');
const mobileCss = fs.readFileSync(path.join(root, 'css', 'mobile-polish-v3370.css'), 'utf8');

const checks = [
  ['CSS específico v3.47.0 cargado', html.includes('css/product-detail-v3340.css?v=3.63.0')],
  ['Layout marketplace presente', html.includes('product-detail-marketplace')],
  ['Galería con miniaturas laterales presente', html.indexOf('id="detalle-thumbnails"') < html.indexOf('class="detail-main-image-container"')],
  ['Columna de compra separada presente', html.includes('class="product-purchase-panel"')],
  ['Título de producto presente', html.includes('id="detalle-titulo"')],
  ['Título equilibrado, no gigante', /\.detail-title[\s\S]*font-size:\s*clamp\(2\.8rem,\s*2\.35vw,\s*3\.6rem\)/.test(css)],
  ['Título móvil armónico', /@media \(max-width: 700px\)[\s\S]*\.detail-title[\s\S]*font-size:\s*clamp\(2\.35rem/.test(css)],
  ['Resumen duplicado bajo título eliminado', !html.includes('id="detalle-resumen"') || /summary\.hidden = true/.test(js)],
  ['Bloque “Lo que debes saber” es colapsable', /<details\b(?=[^>]*class=["'][^"']*product-key-facts)/.test(html) && /<summary[>\s]/.test(html)],
  ['Navegación de botones inferior eliminada', !html.includes('class="product-content-nav"')],
  ['Referencia/SKU presente', html.includes('id="detalle-referencia"')],
  ['Rating funciona como enlace a reseñas', /<a\b(?=[^>]*id=["']detalle-rating["'])(?=[^>]*href=["']#product-reviews-preview["'])/.test(html)],
  ['Texto de entrega actualizado', html.includes('Opciones de entrega') && !html.includes('Ver entrega')],
  ['Personalización usa ancho completo', /\.light-customization-heading[\s\S]*grid-template-columns:\s*1fr/.test(css)],
  ['Caja global de la ficha eliminada', /\.product-detail-grid[\s\S]*background:\s*transparent !important;[\s\S]*box-shadow:\s*none !important/.test(css)],
  ['Cajas individuales de columnas restauradas', /\.product-detail-images,[\s\S]*\.product-detail-info,[\s\S]*\.product-purchase-panel[\s\S]*border:\s*1px solid/.test(css)],
  ['Ahorro visible presente', html.includes('id="detalle-ahorro"')],
  ['Bloque de confianza presente', html.includes('class="product-confidence"')],
  ['Confianza para personalización presente', html.includes('id="product-confidence-personalization"')],
  ['Contenido inferior seccionado', html.includes('class="product-detail-content"') && html.includes('id="product-reviews-preview"')],
  ['Descuento de sugeridos reubicado bajo la etiqueta', /related-products[\s\S]*product-discount-badge[\s\S]*top:\s*4\.9rem[\s\S]*left:\s*1\.2rem/.test(css)],
  ['No muestra cinco estrellas falsas en HTML', !html.includes('★★★★★')],
  ['JS genera datos clave', js.includes('function renderProductKeyFacts')],
  ['JS actualiza SKU por variante', js.includes('function updateProductReference')],
  ['JS renderiza reseñas reales', js.includes('function renderProductRating')],
  ['Estado de compra visible y accesible', html.includes('id="product-selection-status"') && js.includes('function updatePurchaseReadiness')],
  ['Error visual de talla presente', html.includes('id="product-size-error"') && css.includes('.product-option-error')],
  ['Selectores con estado de atención', css.includes('.needs-attention')],
  ['Ficha móvil oculta logo superior', css.includes('body[data-page="product"] .promo-banner,') && css.includes('body[data-page="product"] .container-hero') && css.includes('display: none !important')],
  ['Ficha móvil oculta miniaturas', /body\[data-page="product"\] \.detail-thumbnails[\s\S]*display:\s*none !important/.test(css)],
  ['Ficha móvil permite swipe en imagen', fs.readFileSync(path.join(root, 'js', 'product-gallery.js'), 'utf8').includes('initMainImageSwipe')],
  ['Productos relacionados móviles usan tamaño compacto', /related-products[\s\S]*grid-auto-columns:\s*minmax\(15\.8rem, calc\(\(100vw - 4\.3rem\) \/ 2\)\)/.test(css)],
  ['Acciones móviles de ficha se fuerzan dentro del navbar', commerceToolsJs.includes('resetProductMobileHeaderActions') && commerceToolsJs.includes('navbar.appendChild(actions)')],
  ['Editor visual no desplaza acciones en ficha móvil', siteSettingsJs.includes('isProductMobileNavbarActions') && siteSettingsJs.includes('resetProductMobileNavbarActions')],
  ['Navbar móvil de ficha tiene acciones en columna derecha', /body\[data-page="product"\] \.navbar-actions[\s\S]*grid-column:\s*3 !important/.test(mobileCss)],
  ['Ficha usa CSS específico v3.47.0', html.includes('css/product-detail-v3340.css?v=3.63.0')],
  ['Imagen móvil compacta bajo navbar', mobileCss.includes('Ajuste validado manualmente') && mobileCss.includes('margin-top: -25px !important')],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) {
  console.log(`${ok ? '✅' : '❌'} ${name}`);
}

if (failed.length) {
  console.error(`\nFallaron ${failed.length} verificaciones de ficha de producto.`);
  process.exit(1);
}

console.log(`\n✅ Ficha de producto v3.47.0 verificada (${checks.length} controles).`);
