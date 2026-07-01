# Frontend V3.32.1

## Corrección Mercado Pago

- Corrige el error `Cannot set properties of null (setting 'innerHTML')` al confirmar un pedido con Mercado Pago.
- El botón de confirmación está fuera del formulario visual y asociado mediante el atributo `form`; ahora se obtiene de forma segura por `id`.
- Se protege también el cambio de texto a “Preparando Mercado Pago...” si el botón no está disponible.
- Se actualiza la versión de caché de `checkout.js` en `finalizar-compra.html`.
