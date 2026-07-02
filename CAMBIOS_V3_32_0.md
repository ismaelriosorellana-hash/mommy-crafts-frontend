# Mommy Crafts Frontend 3.32.0

## Etapa 1A — Base profesional del catálogo

- La ficha consulta únicamente el producto solicitado.
- Soporte de enlaces por slug y compatibilidad con enlaces antiguos por ID.
- Conversión automática de `?id=` a `?slug=` cuando el producto dispone de slug.
- Productos relacionados cargados mediante un endpoint específico.
- Generador central `ProductLinks` para enlaces consistentes.
- El carrito conserva el slug del producto.
- API frontend preparada para respuestas paginadas y filtros.
- La carga general del catálogo queda limitada a 100 productos como protección temporal.
- Nuevo verificador automático de arquitectura del catálogo.
