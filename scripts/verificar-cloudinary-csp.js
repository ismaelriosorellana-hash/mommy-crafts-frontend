const fs = require('fs');
const path = require('path');

const root = process.cwd();
const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html') || entry.name === '_headers') htmlFiles.push(full);
  }
}
walk(root);

let ok = true;
for (const file of htmlFiles) {
  const rel = path.relative(root, file);
  const txt = fs.readFileSync(file, 'utf8');
  if (/Content-Security-Policy|connect-src/.test(txt)) {
    if (!txt.includes('https://res.cloudinary.com')) {
      console.error(`❌ ${rel}: falta https://res.cloudinary.com en CSP/connect-src`);
      ok = false;
    }
    if (!txt.includes('https://*.cloudinary.com')) {
      console.error(`❌ ${rel}: falta https://*.cloudinary.com en CSP/connect-src`);
      ok = false;
    }
  }
}

const customization = fs.readFileSync(path.join(root, 'js', 'customization.js'), 'utf8');
if (!customization.includes('fetch(source')) {
  console.error('❌ js/customization.js: no se encontró la carga fetch de imágenes para el canvas.');
  ok = false;
}
if (!customization.includes('visible-preview-v3401')) {
  console.error('❌ js/customization.js: no se actualizó la fuente de preview a v3401.');
  ok = false;
}

if (!ok) process.exit(1);
console.log('✅ CSP permite Cloudinary para generar imagen final del resumen.');
