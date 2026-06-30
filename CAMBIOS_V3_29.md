# Mommy Crafts Frontend V3.29

## Mercado Pago Checkout Pro

- Agrega Mercado Pago como segunda forma de pago en el checkout.
- Consulta al backend si la integración está completa antes de habilitar la opción.
- Muestra claramente si está en modo de prueba o productivo.
- Crea el pedido antes de redirigir al entorno seguro de Mercado Pago.
- Conserva el pedido si la redirección falla y permite reintentar desde el detalle o Mi cuenta.
- Muestra el estado del pago después del retorno de Mercado Pago.
- Permite reintentar pagos pendientes o rechazados desde el detalle del pedido.
- Mantiene transferencia bancaria como alternativa disponible.

## Despliegue

- Actualiza el identificador de caché a `3.29.0`.
- El frontend no contiene ni necesita el Access Token de Mercado Pago.
