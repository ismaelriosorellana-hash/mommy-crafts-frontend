MOMMY CRAFTS FRONTEND V3.14
===========================

Esta versión incorpora el primer panel administrativo funcional y conecta
los pedidos de la tienda con MongoDB.

PANEL ADMINISTRATIVO
--------------------

Entrada:

admin/login.html

Utiliza el correo y la contraseña creados mediante:

npm run create-admin

Módulos disponibles:

1. Resumen
   - Ventas de hoy.
   - Pedidos pendientes.
   - Pedidos del día.
   - Alertas de stock bajo.

2. Productos
   - Crear productos.
   - Editar productos.
   - Desactivar productos.
   - Imágenes generales.
   - Categorías y características.
   - Personalización simple.
   - Variantes de color con imagen, stock, precio y SKU.

3. Pedidos
   - Lista y búsqueda.
   - Estado del pedido.
   - Estado del pago.
   - Notas internas.
   - Descuento y reposición automática de stock al confirmar o cancelar.

4. Inventario
   - Stock bajo.
   - Movimientos.
   - Entradas, salidas, ajustes y devoluciones.

5. Reportes
   - Ventas por período.
   - Pedidos.
   - Ticket promedio.
   - Unidades vendidas.
   - Productos más vendidos.

6. Banners
   - Crear, editar y eliminar.
   - Imagen de escritorio y móvil.
   - Orden, posición, título y botón.
   - La página principal consulta automáticamente los banners activos del backend.
   - Si no existen banners guardados, usa HOME_BANNERS de js/config.js.

PEDIDOS
-------

Al finalizar una compra:

1. El pedido se guarda en MongoDB mediante POST /api/pedidos.
2. El cliente recibe un número de pedido.
3. Se abre WhatsApp con el detalle y el número.
4. El carrito se limpia únicamente después de guardar correctamente.

REQUISITOS
----------

- Backend V2 encendido con npm run dev.
- Frontend abierto con Live Server.
- FRONTEND_URLS del backend debe incluir la dirección de Live Server:
  http://127.0.0.1:5500
  http://localhost:5500

PRUEBA
------

1. Abre:
   http://127.0.0.1:5500/admin/login.html

2. Inicia sesión.

3. Revisa que cargue el dashboard.

4. Crea un banner de prueba.

5. Regresa a index.html y recarga con Ctrl + F5.

6. Realiza un pedido de prueba y comprueba la colección pedidos en MongoDB.
