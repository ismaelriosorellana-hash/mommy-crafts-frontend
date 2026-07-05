const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const ok = (msg) => console.log(`✅ ${msg}`);
const fail = (msg) => { console.error(`❌ ${msg}`); process.exitCode = 1; };
const mustInclude = (content, value, msg) => content.includes(value) ? ok(msg) : fail(`${msg} — falta: ${value}`);

const css = read('css/customization-mobile-v3432.css');
const js = read('js/customization-mobile-v3432.js');
const baseJs = read('js/customization.js');
const pages = ['index.html','catalogo.html','producto.html','carrito.html','comparacion.html'];

for (const page of pages) {
  const html = read(page);
  mustInclude(html, 'css/customization-mobile-v3432.css?v=3.43.3', `${page} carga CSS móvil estable`);
  mustInclude(html, 'js/customization-mobile-v3432.js?v=3.43.3', `${page} carga JS móvil estable`);
}

mustInclude(css, '#modal-personalizar .modal-box', 'CSS controla el modal de personalización móvil');
mustInclude(css, 'height: 100dvh', 'modal móvil usa alto completo del viewport');
mustInclude(css, 'overflow-y: auto', 'cuerpo del modal permite scroll vertical');
mustInclude(css, '-webkit-overflow-scrolling: touch', 'scroll móvil táctil está habilitado');
mustInclude(css, '#modal-personalizar .live-preview-panel', 'vista previa móvil tiene reglas dedicadas');
mustInclude(css, '#modal-personalizar .product-preview', 'vista previa se mantiene visible y compacta');
mustInclude(css, '#modal-personalizar .customization-category-grid', 'lista de tipos queda controlada en móvil');
mustInclude(css, '#modal-personalizar .customizable-products-grid', 'lista de productos queda controlada en móvil');
mustInclude(css, '#modal-personalizar .option-grid', 'lista de estilos queda controlada en móvil');
mustInclude(css, '#modal-personalizar .color-options-grid', 'lista de colores queda controlada en móvil');
mustInclude(css, '#modal-personalizar .upload-area', 'paso de carga de imagen queda contenido en móvil');
mustInclude(css, '#modal-personalizar .modal-footer', 'footer móvil queda controlado sin tapar contenido');
mustInclude(css, 'touch-action: auto !important', 'CSS evita bloquear gestos táctiles globales');
mustInclude(css, 'position: relative !important', 'footer ya no queda fijo sobre el contenido');

mustInclude(js, 'scrollToStepTop', 'JS reajusta scroll al cambiar de paso sin observer continuo');
mustInclude(js, 'observer.observe(modal, { attributes: true', 'JS solo observa apertura/cierre del modal');
mustInclude(js, 'modal-steps .step', 'JS centra el paso activo en la barra de pasos');
mustInclude(js, 'v3.43.3', 'JS móvil corresponde a la versión 3.43.3');
if (js.includes('subtree: true')) fail('JS móvil no debe observar todo el árbol del formulario'); else ok('JS móvil no usa observer continuo sobre el formulario');
if (js.includes('behavior: "smooth"')) fail('JS móvil no debe usar scroll smooth repetido'); else ok('JS móvil evita scroll smooth repetido');
mustInclude(baseJs, 'En móvil no bloqueamos el scroll inmediatamente', 'drag móvil evita bloquear scroll vertical');
mustInclude(baseJs, 'absY > absX * 1.15', 'drag móvil distingue scroll vertical de edición');

if (process.exitCode) {
  console.error('\nVerificación de personalización móvil con errores.');
  process.exit(process.exitCode);
}

console.log('\nVerificación de personalización móvil completada.');
