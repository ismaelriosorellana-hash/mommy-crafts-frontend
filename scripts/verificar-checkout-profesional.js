const fs = require('fs');
const path = require('path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['css/checkout-professional-v3420.css', 'checkout-progress-pro'],
  ['css/checkout-professional-v3420.css', 'checkout-mobile-paybar'],
  ['css/checkout-professional-v3420.css', '--mc-checkout-brand'],
  ['js/checkout-professional-v3420.js', 'injectProgress'],
  ['js/checkout-professional-v3420.js', 'formatRut'],
  ['js/checkout-professional-v3420.js', 'checkout-mobile-pay-button'],
  ['finalizar-compra.html', 'css/checkout-professional-v3420.css?v=3.63.0'],
  ['finalizar-compra.html', 'js/checkout-professional-v3420.js?v=3.63.0']
];
const failures = [];
for (const [file, text] of checks) {
  const content = read(file);
  if (!content.includes(text)) failures.push(`${file}: falta ${text}`);
}
if (fs.readdirSync(root).some((name) => name.toLowerCase().endsWith('.md'))) {
  failures.push('La raíz contiene archivos .md; esta entrega debe ir limpia.');
}
if (failures.length) {
  console.error('❌ Verificación checkout profesional falló:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log('✅ Checkout profesional v3.47.0 verificado.');
