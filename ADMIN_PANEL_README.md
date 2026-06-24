# Panel administrativo Mommy Crafts

## Acceso

Con Live Server:

```text
http://127.0.0.1:5500/admin/login.html
```

El panel usa la misma dirección configurada en:

```javascript
CONFIG.API_BASE_URL
```

Actualmente:

```text
http://localhost:3000/api
```

## Seguridad

- El correo y la contraseña se validan en el backend.
- La contraseña no está escrita en el frontend.
- Las rutas administrativas requieren un token JWT.
- Al cerrar sesión se elimina el token del navegador.
- La sesión normal dura lo definido por `JWT_EXPIRES_IN`.
- “Mantener sesión” conserva el acceso en ese computador.

## No subir a GitHub

El frontend no contiene contraseñas. En el backend nunca subas:

```text
.env
node_modules/
```

## Funcionamiento de banners

El inicio intenta obtener:

```text
GET /api/banners
```

Cuando MongoDB no tiene banners activos, se usan los valores de respaldo de:

```text
js/config.js → HOME_BANNERS
```

## Funcionamiento de pedidos

La compra se guarda primero mediante:

```text
POST /api/pedidos
```

Después se abre WhatsApp. Por eso los pedidos aparecen en el panel y alimentan
ventas, inventario y reportes.
