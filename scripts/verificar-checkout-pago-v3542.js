const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'finalizar-compra.html'), 'utf8');
const checkout = fs.readFileSync(path.join(root, 'js', 'checkout.js'), 'utf8');
const config = fs.readFileSync(path.join(root, 'js', 'config.js'), 'utf8');

const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};

check(config.includes('APP_VERSION: "3.63.0"'), 'CONFIG.APP_VERSION debe ser 3.63.0.');
check(html.includes('id="btn-enviar-pedido"'), 'finalizar-compra.html debe mantener el botón de pago.');
check(html.includes('form="form-pedido"'), 'El botón de pago externo debe seguir asociado al formulario.');
check(checkout.includes('function getCheckoutSubmitButton'), 'checkout.js debe tener helper para encontrar el botón externo.');
check(checkout.includes('document.getElementById("btn-enviar-pedido")'), 'checkout.js debe usar fallback por id para el botón externo.');
check(!checkout.includes('const submitButton = form.querySelector(\'[type="submit"]\');'), 'checkout.js no debe depender solo de submit dentro del form.');
check(!checkout.includes('submitButton.innerHTML = \'<i class="fa-solid fa-lock" aria-hidden="true"></i> Ir a Pagar\';\n                try'), 'No debe quedar reset sin validar submitButton antes de Mercado Pago.');

if (errors.length) {
  console.error('❌ Verificación checkout pago v3.63.0 con errores:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('✅ Checkout pago frontend v3.63.0 verificado.');
