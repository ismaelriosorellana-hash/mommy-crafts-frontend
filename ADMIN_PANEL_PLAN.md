# Panel de administración Mommy Crafts

El panel debe construirse con autenticación real en el backend. No debe
protegerse solamente con JavaScript o una contraseña escrita en el frontend.

## Módulos previstos

1. Inicio de sesión de administrador
   - correo y contraseña cifrada;
   - token o cookie segura;
   - cierre de sesión;
   - recuperación de contraseña;
   - roles y permisos.

2. Dashboard
   - ventas del día, semana y mes;
   - pedidos pendientes;
   - productos con poco stock;
   - productos más vendidos;
   - movimientos recientes.

3. Productos
   - crear, editar, publicar y desactivar;
   - categorías, temporadas y características;
   - variantes por color;
   - imágenes de Cloudinary;
   - precios, descuentos y personalización;
   - stock y SKU por variante.

4. Pedidos
   - nuevo, confirmado, en preparación, listo, enviado, entregado y cancelado;
   - datos del cliente;
   - imágenes y textos de personalización;
   - comprobantes;
   - historial de cambios.

5. Inventario
   - entradas y salidas;
   - ajustes manuales con motivo;
   - alertas de stock mínimo;
   - historial por producto y variante.

6. Ventas y reportes
   - ventas por fecha, categoría y producto;
   - ticket promedio;
   - exportación CSV/Excel;
   - productos con mayor y menor movimiento.

7. Contenido de la tienda
   - banners del inicio;
   - categorías destacadas;
   - textos y datos de contacto;
   - redes sociales;
   - productos destacados y orden de aparición.

8. Clientes y seguridad
   - historial de compras;
   - usuarios administradores;
   - registro de acciones;
   - bloqueo por intentos fallidos;
   - validación de datos y límites de archivos.

## Backend necesario

El backend debe incorporar modelos y rutas para:

- administradores y sesiones;
- pedidos;
- movimientos de inventario;
- reportes;
- configuración del sitio;
- subida firmada de imágenes a Cloudinary;
- auditoría de acciones.

Para construirlo de forma funcional se necesita trabajar sobre la carpeta
actual del backend. El frontend por sí solo no puede ofrecer un acceso de
administrador seguro.
