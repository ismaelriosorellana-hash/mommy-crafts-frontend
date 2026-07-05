# Cambios frontend v3.36.6

## Etapa 2C ampliada

- Corrige badges de descuento en todas las tarjetas de producto para que no queden tapados por el botón de comparar.
- Agrega consumo de categorías administrables desde `GET /api/categorias`.
- Agrega página `admin/categorias.html` para crear, editar y eliminar categorías.
- El menú superior y el carrusel de categorías del inicio usan las categorías activas configuradas desde el panel.
- Agrega caché visual de apariencia para reducir el salto de logo e iconos al cambiar de página.
- Agrega verificadores para categorías, header y badges.

## Compatibilidad

- Si aún no hay categorías guardadas en MongoDB, la tienda usa categorías base.
- Los productos existentes siguen funcionando con su campo de categoría actual.
