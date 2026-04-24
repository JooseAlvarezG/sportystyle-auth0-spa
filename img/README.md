# Carpeta de imágenes — SportyStyle

Reemplaza estos archivos con tus propias imágenes de producto.

## Archivos esperados

El catálogo en `js/products.js` apunta a estas 9 imágenes. Si alguna
falta, la app mostrará un placeholder con las iniciales del producto
(degrade limpio, no se rompe el layout).

| Archivo               | Producto                       |
|-----------------------|--------------------------------|
| `camiseta-1.jpg`      | Camiseta Pro Run               |
| `camiseta-2.jpg`      | Camiseta Gym Flex              |
| `camiseta-3.jpg`      | Camiseta Trail Tech            |
| `pantalon-1.jpg`      | Pantalón Jogger Urban          |
| `pantalon-2.jpg`      | Calza Compresión Power         |
| `pantalon-3.jpg`      | Short Training Air             |
| `accesorio-1.jpg`     | Botella Hydro 750ml            |
| `accesorio-2.jpg`     | Mochila Pro Sport 25L          |
| `accesorio-3.jpg`     | Banda Resistencia Set          |

## Especificaciones técnicas óptimas

Para que la página cargue rápido y se vea bien en cualquier pantalla:

### Dimensiones

- **Recomendadas**: **800 × 800 px** (cuadradas)
- **Mínimas aceptables**: 600 × 600 px
- **Máximas razonables**: 1200 × 1200 px (más grande es desperdicio)

### Aspect ratio

- **1:1 (cuadrado)** — el CSS está pensado para tarjetas cuadradas con
  `aspect-ratio: 1`. Imágenes rectangulares se recortarán al centro.

### Formato

| Formato | Cuándo usarlo                          | Peso típico |
|---------|----------------------------------------|-------------|
| **WebP** | Recomendado: mejor compresión          | 30-80 KB    |
| **JPG**  | Compatible con todo                    | 60-150 KB   |
| **PNG**  | Solo si necesitas transparencia        | 200-500 KB  |

### Peso (tamaño de archivo)

- **Ideal**: **menos de 100 KB** por imagen
- **Aceptable**: hasta 200 KB
- **Evitar**: más de 300 KB (afecta tiempo de carga)

Con 9 productos × 100 KB = **menos de 1 MB total** para todo el catálogo,
lo que garantiza una primera carga fluida incluso en conexiones móviles.

### Calidad recomendada al exportar

- JPG: **calidad 75-85%** (Photoshop "Save for Web", o
  herramientas online como [Squoosh](https://squoosh.app))
- WebP: **calidad 75%** (excelente relación calidad/peso)

## Optimización rápida

Si tus imágenes pesan más de la cuenta, puedes optimizarlas sin
instalar nada:

1. **Squoosh** ([squoosh.app](https://squoosh.app)) — Google, gratis,
   convierte y reduce en el navegador.
2. **TinyPNG** ([tinypng.com](https://tinypng.com)) — JPG/PNG, hasta
   20 imágenes a la vez.
3. **Compressor.io** — formatos múltiples.

## Atribuciones

Si descargas imágenes de bancos gratuitos, recuerda revisar las
licencias. Buenas fuentes para fotografía deportiva libre de derechos:

- [Unsplash](https://unsplash.com) (búsqueda: "sport apparel")
- [Pexels](https://pexels.com)
- [Pixabay](https://pixabay.com)

## Si dejas la carpeta vacía

La app no se rompe: cada tarjeta mostrará un **placeholder con las
iniciales del producto** sobre un fondo gris oscuro con degradé. Es
funcional, solo que sin las fotos pierde algo del impacto visual.
