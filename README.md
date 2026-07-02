# Mommy Crafts Frontend 3.33.0

Frontend multipágina de Mommy Crafts.

## Etapa 2A — Ficha de producto de alto impacto

Esta versión mejora la jerarquía visual y la claridad de compra de `producto.html`:

- título más grande en escritorio y móvil;
- resumen breve del producto;
- marca y SKU cuando existen;
- precio, descuento y ahorro más visibles;
- reseñas mostradas de forma honesta;
- disponibilidad destacada;
- bloque de confianza y ayuda;
- área de compra optimizada para móvil.

## Compatibilidad

- Backend recomendado: `2.14.1`.
- No requiere actualizar el backend.
- No requiere nuevas variables de Render.
- No requiere migraciones en MongoDB Atlas.

## Verificación local

```bash
node scripts/verificar-frontend.js
node scripts/verificar-seguridad.js
node scripts/verificar-catalogo.js
node scripts/verificar-productos-admin.js
node scripts/verificar-ficha-producto.js
```

## Despliegue

1. Confirmar que Backend `2.14.1` sigue activo.
2. Publicar Frontend `3.33.0`.
3. Abrir una ficha con `Ctrl + F5`.
4. Probar escritorio y móvil.
5. Confirmar título, precio, variantes, carrito y personalización.
