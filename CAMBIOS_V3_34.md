# CAMBIOS V3.34

## Objetivo
Primera etapa de mejoras paso a paso para la experiencia visual y comercial del frontend.

## Cambios implementados
- Cabecera comercial compacta con iconos para búsqueda, cuenta, comparación y carrito.
- Nuevo acceso a `comparacion.html` desde el icono de corazón.
- Sistema de comparación de productos con máximo de 3 productos.
- Posibilidad de agregar productos a comparación desde:
  - tarjetas minimalistas del catálogo/home/relacionados;
  - ficha individual del producto.
- Nuevos badges interactivos sobre las tarjetas de producto:
  - corazón: agrega/quita de comparación;
  - ojo: abre vista rápida;
  - signo `+`: abre más productos de la categoría principal.
- Vista rápida emergente con:
  - imagen principal y miniaturas;
  - nombre;
  - reseñas/ventas visibles;
  - precio;
  - color;
  - talla;
  - cantidad;
  - botón agregar al carrito;
  - acceso a comparar;
  - enlace a la ficha completa.
- Página `comparacion.html` para revisar lado a lado hasta 3 productos.
- Estilos nuevos en `css/compare-v334.css`.
- Lógica nueva en `js/compare.js`.

## Archivos clave
- `comparacion.html`
- `css/compare-v334.css`
- `js/compare.js`
- `js/products.js`
