# Frontend V3.31.3

## Corrección puntual
- Corrige el movimiento horizontal y vertical de los iconos de redes sociales.
- Corrige el movimiento horizontal y vertical del grupo de búsqueda, inicio de sesión, comparación y carrito.
- Mantiene sin cambios el resto del diseño V3.31.2.

## Causa corregida
Las posiciones dependían de la propiedad CSS `transform`, que podía ser reemplazada por otras reglas visuales. Ahora se usa la propiedad independiente `translate` y se aplica también directamente a los elementos reales del encabezado.

## Archivos modificados
- `css/mc-commerce-tools-v3311.css`
- `js/site-settings.js`
