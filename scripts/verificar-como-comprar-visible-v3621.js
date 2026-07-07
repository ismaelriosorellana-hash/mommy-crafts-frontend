const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}
const config = read('js/config.js');
const siteStudio = read('js/site-studio.js');
const mobileMenu = read('js/mobile-menu-v3380.js');
const product = read('producto.html');
const css = read('css/commercial-v3610.css');
assert(config.includes('APP_VERSION: "3.63.0"'), 'APP_VERSION debe ser 3.63.0');
assert(siteStudio.includes('hasHowToBuy'), 'site-studio debe insertar Cómo comprar aunque el menú guardado no lo traiga');
assert(siteStudio.includes('como-comprar.html'), 'site-studio debe incluir la URL como-comprar.html');
assert(mobileMenu.includes('label: "Cómo comprar"'), 'menú móvil debe mostrar Cómo comprar');
assert(mobileMenu.includes('Paso a paso y guía de personalización'), 'menú móvil debe explicar la guía de compra');
assert(product.includes('product-confidence-how-buy'), 'ficha debe tener acceso visible a Cómo comprar en el panel de compra');
assert(product.includes('class="product-how-buy-link"'), 'ficha debe mantener acceso antes de Descripción del producto');
assert(css.includes('.product-confidence-how-buy'), 'CSS debe estilizar el acceso visible a Cómo comprar');
console.log('✅ Accesos visibles a Cómo comprar v3.63.0 verificados');
