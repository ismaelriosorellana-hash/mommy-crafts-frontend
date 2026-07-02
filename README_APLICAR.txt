APLICACIÓN DEL PARCHE FRONTEND V3.31.2

Este parche debe aplicarse sobre Frontend V3.31.1 ya publicado.

1. Descomprime el ZIP en Descargas.
2. Abre Git Bash en la raíz de mommy-crafts-frontend.
3. Ejecuta:

   py ~/Downloads/mommy-crafts-frontend-v3.31.2-parche/aplicar-frontend-v3.31.2.py

4. Revisa:

   git status --short
   git diff --check
   node --check js/mc-commerce-tools-v3311.js
   node --check js/site-settings.js
   node --check admin/js/site-settings-admin.js

El script copia únicamente los archivos de esta función y actualiza las versiones de caché en los HTML existentes.
