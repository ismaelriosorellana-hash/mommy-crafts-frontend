# Cambios Frontend 3.36.1

## Objetivo

Corrección visual profesional de la ficha de producto después de evaluar la versión 3.33.0. La prioridad fue recuperar armonía visual, mejorar la eficiencia de compra y acercar la estructura a una ficha tipo marketplace, sin copiar diseño de terceros.

## Cambios principales

- Reducción del tamaño del título para una jerarquía más profesional.
- Mantención del título como `h1` principal para conservar una estructura semántica correcta.
- Nueva distribución superior tipo marketplace:
  - galería a la izquierda;
  - información del producto al centro;
  - caja de compra a la derecha.
- Miniaturas de imágenes ubicadas al costado izquierdo de la imagen principal en escritorio.
- Miniaturas horizontales en móvil y tablet para conservar buena navegación táctil.
- Caja de compra separada con precio, descuento, ahorro, stock, cantidad y botón de carrito.
- Bloque de confianza compacto dentro de la caja de compra.
- Columna central enfocada en nombre, valoración, resumen, datos clave, variantes y personalización.
- Nueva sección “Lo que tienes que saber”, generada desde características, personalización y preparación.
- Contenido inferior más ordenado con navegación hacia descripción, características, reseñas y preguntas.
- Reseñas y preguntas quedan visibles como secciones preparadas, sin simular funcionalidades todavía no implementadas.
- Corrección de `aria-controls` en el acordeón de descripción.

## Sin cambios

- No cambia backend.
- No cambia Mercado Pago.
- No cambia Cloudinary.
- No cambia MongoDB Atlas.
- No cambia carrito.
- No cambia personalización.
- No cambia la API.
- No requiere variables nuevas en Render.

## Pruebas realizadas

- Verificación de 31 páginas HTML.
- Verificación de seguridad y CSP.
- Verificación de catálogo por slug e ID.
- Verificación del panel de productos.
- Verificación específica de ficha de producto con 20 controles.
- Validación de sintaxis de JavaScript.
