const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const ok = (msg) => console.log(`✅ ${msg}`);
const fail = (msg) => { console.error(`❌ ${msg}`); process.exitCode = 1; };
const mustInclude = (content, value, msg) => content.includes(value) ? ok(msg) : fail(`${msg} — falta: ${value}`);
const mustNotInclude = (content, value, msg) => !content.includes(value) ? ok(msg) : fail(`${msg} — no debe incluir: ${value}`);

const css = read('css/customization-mobile-safe-v3434.css');
const previewCss = read('css/customization-mobile-preview-v3435.css');
const professionalJs = read('js/customization-professional-v3390.js');
const baseJs = read('js/customization.js');
const pages = ['index.html','catalogo.html','producto.html','carrito.html','comparacion.html'];

for (const page of pages) {
  const html = read(page);
  mustInclude(html, 'css/customization-mobile-safe-v3434.css?v=3.63.0', `${page} carga CSS móvil seguro v3.47.0`);
  mustInclude(html, 'css/customization-mobile-preview-v3435.css?v=3.63.0', `${page} carga corrección de vista previa móvil v3.47.0`);
  mustNotInclude(html, 'js/customization-mobile-v3432.js', `${page} no carga JS móvil anterior que podía congelar`);
  mustNotInclude(html, 'css/customization-mobile-v3432.css', `${page} no carga CSS móvil anterior`);
}

mustInclude(css, 'Personalización móvil segura v3.47.0', 'CSS móvil seguro corresponde a v3.47.0');

mustInclude(previewCss, 'Vista previa móvil completa v3.47.0', 'CSS de vista previa móvil corresponde a v3.47.0');
mustInclude(previewCss, 'aspect-ratio: 1 / 1 !important', 'vista previa móvil mantiene proporción cuadrada completa');
mustInclude(previewCss, 'max-height: none !important', 'vista previa y resumen final no se recortan por alto máximo');
mustInclude(previewCss, '#modal-personalizar .customization-summary-preview img', 'imagen del resumen final queda controlada en móvil');
mustInclude(previewCss, 'object-fit: contain !important', 'vista previa usa contain para mostrarse completa');
mustNotInclude(previewCss, 'touch-action:', 'CSS de vista previa no modifica gestos táctiles');

mustInclude(css, '#modal-personalizar.modal-overlay.active', 'modal móvil se muestra con regla explícita');
mustInclude(css, 'overflow-y: auto !important', 'overlay móvil usa scroll nativo');
mustInclude(css, 'min-height: 100svh', 'modal móvil usa alto seguro del viewport');
mustInclude(css, 'height: auto !important', 'modal móvil evita altura fija que atrapaba el scroll');
mustInclude(css, 'overflow: visible !important', 'modal móvil evita contenedores anidados bloqueantes');
mustInclude(css, '#modal-personalizar .live-preview-panel', 'vista previa móvil queda controlada');
mustInclude(css, '#modal-personalizar .product-preview', 'vista previa móvil queda compacta');
mustInclude(css, '#modal-personalizar .customization-category-grid', 'tipos de producto quedan en grilla móvil estable');
mustInclude(css, '#modal-personalizar .customizable-products-grid', 'productos quedan en grilla móvil estable');
mustInclude(css, '#modal-personalizar .option-grid', 'estilos quedan en grilla móvil estable');
mustInclude(css, '#modal-personalizar .color-options-grid', 'colores quedan en grilla móvil estable');
mustInclude(css, '#modal-personalizar .upload-area', 'carga de imagen queda contenida en móvil');
mustInclude(css, '#modal-personalizar .modal-footer', 'footer queda en flujo normal');
mustInclude(css, 'position: relative !important', 'footer y paneles no quedan fijos bloqueando el contenido');
mustNotInclude(css, 'touch-action:', 'CSS móvil seguro no fuerza touch-action y deja gestos nativos');
mustNotInclude(css, 'position: fixed !important;\n        left: 0', 'footer ya no usa posición fija');

mustInclude(professionalJs, 'En móvil evitamos cualquier scroll forzado', 'JS profesional evita scroll forzado del cuerpo en móvil');
mustInclude(professionalJs, 'behavior: "auto"', 'JS profesional evita scroll smooth en cambios de paso');
mustInclude(professionalJs, 'window.clearTimeout(timer)', 'observer profesional queda reducido y debounceado');
if (professionalJs.includes('behavior: "smooth"')) fail('JS profesional no debe usar behavior smooth'); else ok('JS profesional no usa scroll smooth');

mustInclude(baseJs, 'En móvil no bloqueamos el scroll inmediatamente', 'drag móvil evita bloquear scroll vertical');
mustInclude(baseJs, 'absY > absX * 1.15', 'drag móvil distingue scroll vertical de edición');

if (exists('js/customization-mobile-v3432.js')) fail('No debe quedar el JS móvil anterior en el paquete'); else ok('JS móvil anterior fue retirado del paquete');
if (exists('css/customization-mobile-v3432.css')) fail('No debe quedar el CSS móvil anterior en el paquete'); else ok('CSS móvil anterior fue retirado del paquete');

if (process.exitCode) {
  console.error('\nVerificación de personalización móvil con errores.');
  process.exit(process.exitCode);
}

console.log('\nVerificación de personalización móvil segura completada.');
