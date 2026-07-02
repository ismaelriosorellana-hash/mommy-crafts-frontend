# Mommy Crafts Frontend 3.31.6

Frontend multipágina de Mommy Crafts.

## Entorno publicado

El frontend consume la API configurada en `js/config.js`.

## Versión y caché

- La versión visible se define en `CONFIG.APP_VERSION`.
- Los HTML deben referenciar CSS y JavaScript con la misma versión de caché.
- En esta entrega, toda la aplicación utiliza `3.31.6`.

## Archivos que no deben publicarse

- `.env`
- `.git`
- ZIP de respaldo
- Aplicadores temporales
- Copias antiguas del sitio
- Carpetas de archivos duplicados

## Verificación local

```bash
node scripts/verificar-frontend.js
```

## Despliegue

1. Publicar primero el backend compatible.
2. Verificar su endpoint `/api/health`.
3. Publicar este frontend.
4. Probar inicio, catálogo, producto, carrito, checkout, cuenta y administración.
5. Probar al menos una pantalla móvil.

## Versión 3.32.0 — Catálogo profesional

La ficha de producto utiliza consultas directas por slug o ID. Para validar la entrega:

```bash
node scripts/verificar-frontend.js
node scripts/verificar-seguridad.js
node scripts/verificar-catalogo.js
```
