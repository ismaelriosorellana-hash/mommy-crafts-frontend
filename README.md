# Mommy Crafts Frontend 3.32.1

Frontend multipágina de Mommy Crafts.

## Entorno publicado

El frontend consume la API configurada en `js/config.js`.

## Versión y caché

- La versión visible se define en `CONFIG.APP_VERSION`.
- Los HTML deben referenciar CSS y JavaScript con la misma versión de caché.
- En esta entrega, toda la aplicación utiliza `3.32.1`.

## Administración de productos

El formulario está organizado en cinco secciones:

1. General.
2. Logística.
3. SEO.
4. Personalización.
5. Variantes.

Permite administrar SKU, marca, peso, dimensiones y metadatos SEO sin romper productos antiguos.

## Verificación local

```bash
node scripts/verificar-frontend.js
node scripts/verificar-seguridad.js
node scripts/verificar-catalogo.js
node scripts/verificar-productos-admin.js
```

## Archivos que no deben publicarse

- `.env`
- `.git`
- `node_modules`
- ZIP de respaldo
- Aplicadores temporales
- Copias antiguas del sitio

## Despliegue

1. Publicar primero Backend 2.14.1.
2. Verificar `/api/health`.
3. Publicar Frontend 3.32.1.
4. Probar creación y edición de productos.
5. Confirmar navegación pública, carrito y checkout.
