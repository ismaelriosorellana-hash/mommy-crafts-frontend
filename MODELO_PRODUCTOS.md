# Modelo recomendado para separar productos

El frontend V3 reconoce los campos antiguos, pero la forma recomendada es:

## Producto solo para venta directa

```json
{
  "nombre": "Agenda Mujer 2026",
  "precio": 15990,
  "precioOriginal": 18990,
  "descripcion": "Agenda semanal con diseño floral.",
  "imagenes": [
    "https://...",
    "https://..."
  ],
  "categorias": [
    "Librería",
    "Regalos",
    "Temporada"
  ],
  "categoriaPrincipal": "Librería",
  "tags": [
    "agenda",
    "mujer",
    "2026",
    "floral"
  ],
  "personalizable": false,
  "publicarCatalogo": true,
  "activo": true,
  "stock": 20,
  "ventas": 35,
  "destacado": true,
  "insignia": "Nuevo",
  "orden": 1,
  "productosRelacionados": [
    "ID_DE_AGENDA_MUJER",
    "ID_DE_CUADERNO_DEVOCIONAL",
    "ID_DE_LAPICES",
    "ID_DE_SEPARADORES",
    "ID_DE_TAZA_CRISTIANA"
  ]
}
```

## Producto exclusivo para personalizar

```json
{
  "nombre": "Taza blanca personalizable",
  "precio": 7990,
  "descripcion": "Taza preparada para recibir una imagen y texto.",
  "imagenes": [
    "https://..."
  ],
  "categorias": [
    "Personalizados",
    "Tazas",
    "Regalos"
  ],
  "categoriaPrincipal": "Personalizados",
  "tags": [
    "taza",
    "personalizada",
    "foto",
    "regalo"
  ],
  "personalizable": true,
  "publicarCatalogo": false,
  "activo": true,
  "stock": 50,
  "ventas": 12,
  "orden": 20,
  "variantes": [
    {
      "nombre": "Blanca",
      "imagen": "https://..."
    },
    {
      "nombre": "Mágica negra",
      "imagen": "https://..."
    }
  ]
}
```

## Regla principal

| Grupo | personalizable | publicarCatalogo |
|---|---:|---:|
| Venta directa | false | true |
| Solo personalización | true | false |

No uses la categoría para controlar la visibilidad. La categoría sirve para
clasificar. Los campos `personalizable` y `publicarCatalogo` controlan dónde
aparece cada producto.

## Categorías múltiples

Usa siempre un arreglo:

```json
"categorias": ["Librería", "Cristianos", "Temporada"]
```

Así un cuaderno devocional puede aparecer en más de una categoría.

## Ordenamiento

- `ventas`: determina “Más vendidos”.
- `precio`: permite precio menor/mayor.
- `createdAt`: determina “Más nuevos”. Activa `timestamps: true` en Mongoose.
- `stock`: determina disponibilidad.
- `orden`: desempate y orden manual.

## Productos relacionados

Para controlar exactamente “También te puede gustar”, agrega IDs reales de
MongoDB en `productosRelacionados`.

Si el arreglo está vacío, el frontend completa automáticamente según
categorías compartidas, tags, stock y ventas.

## Ejemplo Mongoose

```js
const productoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    precio: { type: Number, required: true, min: 0 },
    precioOriginal: { type: Number, default: 0, min: 0 },
    descripcion: { type: String, default: "" },
    imagenes: [{ type: String }],
    categorias: [{ type: String, trim: true }],
    categoriaPrincipal: { type: String, trim: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    personalizable: { type: Boolean, default: false },
    publicarCatalogo: { type: Boolean, default: true },
    activo: { type: Boolean, default: true },
    stock: { type: Number, default: 0, min: 0 },
    ventas: { type: Number, default: 0, min: 0 },
    destacado: { type: Boolean, default: false },
    insignia: { type: String, default: "" },
    orden: { type: Number, default: 9999 },
    variantes: [
      {
        nombre: String,
        imagen: String
      }
    ],
    productosRelacionados: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Producto"
      }
    ]
  },
  { timestamps: true }
);
```


## Categorías de temporada

Para que un producto aparezca dentro de `Temporada` y también en una
subcategoría específica, guárdalo con ambas categorías:

```json
{
  "categorias": [
    "Temporada",
    "Navidad",
    "Regalos"
  ],
  "categoriaPrincipal": "Navidad"
}
```

Subcategorías admitidas:

- Navidad
- Día de la Madre
- Día del Padre
- Profesores
- Graduaciones
- Bautizos
- Baby Shower

## Lo más vendido

El carrusel y el ordenamiento utilizan estos campos:

```json
{
  "ventas": 35,
  "movimiento": 120
}
```

`ventas` tiene prioridad. `movimiento` puede representar visitas o
interacciones guardadas en el backend.

El frontend también registra una vista local por sesión como desempate,
pero para estadísticas globales conviene incrementar `movimiento` desde
el backend cuando un usuario visita un producto.


## Tarifas de personalización

El frontend usa los valores de `js/config.js`. Un producto puede reemplazarlos desde MongoDB:

```json
{
  "personalizable": true,
  "publicarCatalogo": false,
  "precioBasePersonalizacion": 12990,
  "costosPersonalizacion": {
    "imagen": 3000,
    "textoPrincipal": 2000,
    "textoSecundario": 2000
  }
}
```

Para que aparezca bajo un tipo del modal, incluye su categoría real:

```json
{"categorias":["Personalizados","Tazas"],"categoriaPrincipal":"Tazas"}
```

El porcentaje de descuento se calcula automáticamente con `precio` y `precioOriginal`.


## Día del Niño

Para que un producto aparezca en la nueva subcategoría:

```json
{
  "categorias": [
    "Temporada",
    "Día del Niño",
    "Regalos",
    "Infantiles"
  ],
  "categoriaPrincipal": "Día del Niño"
}
```

El producto podrá abrirse desde:

```text
Categorías → Temporada → Día del Niño
```

y también aparecerá en el filtro `Día del Niño` del catálogo.

## Características diferentes por producto

El apartado `Características` ahora se controla completamente desde MongoDB.
Ya no se generan textos genéricos iguales para todos los productos.

Formato recomendado:

```json
{
  "caracteristicas": [
    {
      "titulo": "Material",
      "valor": "Cerámica sublimable"
    },
    {
      "titulo": "Capacidad",
      "valor": "325 ml"
    },
    {
      "titulo": "Apto para",
      "valor": "Microondas y lavavajillas"
    }
  ]
}
```

Ejemplo para una agenda:

```json
{
  "caracteristicas": [
    {
      "titulo": "Tamaño",
      "valor": "A5"
    },
    {
      "titulo": "Interior",
      "valor": "Planificación semanal y mensual"
    },
    {
      "titulo": "Encuadernación",
      "valor": "Anillado metálico"
    },
    {
      "titulo": "Año",
      "valor": "2026"
    }
  ]
}
```

También se admite el formato sencillo:

```json
{
  "caracteristicas": [
    "Material: Cerámica",
    "Capacidad: 325 ml",
    "Color: Blanco"
  ]
}
```

O como objeto:

```json
{
  "caracteristicas": {
    "Material": "Cerámica",
    "Capacidad": "325 ml",
    "Color": "Blanco"
  }
}
```

Si un producto no tiene `caracteristicas`, el acordeón completo se oculta en
la página de detalle, en lugar de mostrar información repetida.

### Campo recomendado en Mongoose

```js
caracteristicas: [
  {
    titulo: {
      type: String,
      trim: true
    },
    valor: {
      type: String,
      trim: true
    }
  }
]
```


## Personalización ligera para productos del catálogo

Esta opción es distinta del modal general. El producto sigue siendo un
producto normal de venta y aparece en el catálogo, pero su página de detalle
puede recibir un nombre, una imagen de referencia y una observación.

```json
{
  "personalizable": false,
  "publicarCatalogo": true,
  "personalizacionLigera": {
    "habilitada": true,
    "permitirNombre": true,
    "permitirImagen": true,
    "permitirObservacion": true,
    "descripcion": "Agrega el nombre y la imagen que deseas incluir.",
    "aviso": "Te enviaremos una vista previa antes de fabricar el producto."
  }
}
```

Producto vendido exactamente como se muestra:

```json
{
  "personalizable": false,
  "publicarCatalogo": true,
  "personalizacionLigera": {
    "habilitada": false
  }
}
```

También puedes habilitar solo algunos campos:

```json
{
  "personalizacionLigera": {
    "habilitada": true,
    "permitirNombre": true,
    "permitirImagen": false,
    "permitirObservacion": true
  }
}
```

La imagen se reduce antes de guardarse temporalmente en el carrito del
navegador. Para producción, el siguiente paso recomendado es subir esa imagen
a Cloudinary mediante el backend y guardar su `secure_url` en el pedido.

## Ajuste de imágenes

Las tarjetas usan `cover` y el detalle usa `contain` de forma predeterminada.
Puedes controlar cada producto desde MongoDB:

```json
{
  "ajusteImagenTarjeta": "cover",
  "ajusteImagenDetalle": "contain",
  "posicionImagen": "center"
}
```

Valores admitidos:

```text
ajusteImagenTarjeta: cover | contain
ajusteImagenDetalle: cover | contain
posicionImagen: center | top | bottom | left | right
```

Usa `cover` para fotografías que deben llenar todo el recuadro y `contain`
para productos con fondo transparente que deben verse completos.


## Personalización simple: uno o dos archivos

El texto breve tiene un máximo fijo de 25 caracteres.

Para permitir una sola imagen:

```json
{
  "personalizacionLigera": {
    "habilitada": true,
    "permitirNombre": true,
    "permitirImagen": true,
    "cantidadMaximaImagenes": 1,
    "permitirObservacion": true
  }
}
```

Para permitir hasta dos imágenes:

```json
{
  "personalizacionLigera": {
    "habilitada": true,
    "permitirNombre": true,
    "permitirImagen": true,
    "cantidadMaximaImagenes": 2,
    "permitirObservacion": true
  }
}
```

Solo se aceptan los valores `1` y `2`. Cualquier valor superior se limita a 2.

## Imágenes cuadradas de productos

La vista está optimizada para imágenes cuadradas de `1254 × 1254 px`.
Las tarjetas, la imagen principal y las miniaturas usan un marco cuadrado con
`object-fit: cover`, sin relleno interno. Una imagen cuadrada correctamente
exportada ocupará exactamente todo el recuadro.

Recomendación de exportación:

```text
Tamaño: 1254 × 1254 px
Formato: WebP o JPG
Perfil: sRGB
Fondo: uniforme
Producto: centrado
Margen interior: incluido dentro de la propia imagen, no agregado por CSS
```

## Colores con imágenes específicas

Los colores deben guardarse como una matriz de objetos. Cada color puede
tener su propio código hexadecimal, imágenes, stock, precio y SKU.

Ejemplo para un producto rosado y celeste:

```json
{
  "variantes": [
    {
      "nombre": "Rosado",
      "codigoHex": "#F3B6C6",
      "imagenes": [
        {
          "url": "URL_CLOUDINARY_VASO_ROSADO_1"
        },
        {
          "url": "URL_CLOUDINARY_VASO_ROSADO_2"
        }
      ],
      "stock": 4,
      "sku": "VASO-ALTO-ROSADO"
    },
    {
      "nombre": "Celeste",
      "codigoHex": "#A9D9EE",
      "imagenes": [
        {
          "url": "URL_CLOUDINARY_VASO_CELESTE_1"
        },
        {
          "url": "URL_CLOUDINARY_VASO_CELESTE_2"
        }
      ],
      "stock": 6,
      "sku": "VASO-ALTO-CELESTE"
    }
  ]
}
```

Al elegir `Rosado`, la página usa solamente las imágenes del objeto Rosado.
Al elegir `Celeste`, cambia la galería completa por las imágenes del objeto
Celeste.

También puedes asignar precios distintos:

```json
{
  "nombre": "Dorado",
  "codigoHex": "#D4AF37",
  "precio": 7990,
  "precioOriginal": 9990,
  "stock": 2,
  "imagenes": [
    {
      "url": "URL_CLOUDINARY_DORADO"
    }
  ]
}
```

Tipos correctos en MongoDB Atlas:

```text
variantes                 Array
cada variante             Object
nombre                    String
codigoHex                 String
imagenes                  Array
cada imagen               Object o String
stock                     Int32
precio                    Int32
precioOriginal            Int32
sku                       String
activo                    Boolean
```

No guardes las variantes como textos del tipo:

```json
[
  "nombre: Rosado",
  "imagen: https://..."
]
```

Deben ser objetos reales dentro de la matriz.
