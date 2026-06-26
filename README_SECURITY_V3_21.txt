MOMMY CRAFTS — PARCHE DE SEGURIDAD FRONTEND V3.21

Este ZIP es un PARCHE para copiar sobre el frontend actualmente publicado.
No incluye js/config.js, por lo que no reemplaza la URL real de Render.

CAMBIOS
- Login administrativo claramente identificado como Mommy Crafts.
- Eliminación del texto público npm run create-admin.
- Dominio y estado HTTPS visibles en el acceso administrativo.
- Acceso de clientes con identidad y aviso de seguridad.
- Páginas privadas marcadas noindex.
- Cabeceras iniciales de seguridad mediante _headers.
- Documentación técnica bloqueada mediante _redirects.
- Enlace al panel administrativo retirado del menú público de clientes.
- Página 404 propia.

ARCHIVOS TÉCNICOS QUE DEBES ELIMINAR ANTES DEL PUSH
README.txt
README_V3_*.txt
ADMIN_PANEL_PLAN.md
ADMIN_PANEL_README.md
MODELO_PRODUCTOS.md

COMANDO EN GIT BASH
git rm -f README*.txt ADMIN_PANEL_PLAN.md ADMIN_PANEL_README.md MODELO_PRODUCTOS.md

CSP
Content-Security-Policy se implementará en una etapa posterior, después de
probar los dominios externos usados por Cloudinary, Google Fonts, Font Awesome,
Render y Mercado Pago.

VALIDACIÓN DESPUÉS DEL DEPLOY
1. admin/login.html ya no debe mostrar npm run create-admin.
2. Debe mostrar logotipo, propósito del formulario, dominio y HTTPS.
3. En DevTools > Network > login.html > Headers deben aparecer:
   X-Content-Type-Options, Referrer-Policy y X-Frame-Options.
4. Las direcciones README_V3_20.txt y ADMIN_PANEL_PLAN.md deben responder 404.
5. Recién entonces solicita la revisión en Google Search Console.
