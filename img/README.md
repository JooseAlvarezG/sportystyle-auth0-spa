# Carpeta de imágenes — SportyStyle

Reemplaza estos archivos con tus propias imágenes de producto.

## Logo de la marca (`logo.png`)

El logo reemplaza el texto "SS" en la esquina superior izquierda del header.
Si el archivo no existe o falla al cargar, se muestra "SS" automáticamente.

| Propiedad        | Recomendado              | Mínimo aceptable |
|------------------|--------------------------|------------------|
| **Archivo**      | `img/logo.png`           | —                |
| **Formato**      | PNG con fondo transparente (PNG-32) o SVG | JPG (sin transparencia) |
| **Dimensiones**  | **128 × 128 px** (cuadrado) | 64 × 64 px   |
| **Peso**         | menos de 20 KB           | —                |
| **SVG**          | Cualquier tamaño, ideal para logos vectoriales | — |

**Por qué cuadrado**: el contenedor en el header mide 36 × 36 px con
`object-fit: contain`, así que la imagen se escala sin distorsión. Un
logo cuadrado ocupa todo el espacio disponible; uno rectangular tendrá
espacio en blanco a los lados o arriba/abajo (lo cual puede ser correcto
si el logo incluye texto horizontal).

**Por qué 128 px**: el contenedor es de 36 px CSS, pero en pantallas
HiDPI (Retina 2x = 72 px, 3x = 108 px), una imagen de 128 px garantiza
nitidez perfecta sin pixelado.

**Fondo transparente**: el contenedor del logo no tiene fondo propio,
la imagen flota directamente sobre el fondo blanco del header. Un PNG
con fondo transparente se integra de forma limpia. Si tu logo tiene fondo
blanco o claro, tambien funcionara bien. Si tiene fondo oscuro, asegurate
de que contraste con el header blanco.

---

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
| `hero-bg.jpg`         | Fondo principal de la portada  |

## Especificaciones técnicas óptimas

Para que la página cargue rápido y se vea bien en cualquier pantalla:

### Dimensiones

**Para productos:**
- **Recomendadas**: **800 × 800 px** (cuadradas)
- **Mínimas aceptables**: 600 × 600 px
- **Máximas razonables**: 1200 × 1200 px (más grande es desperdicio)

**Para fondo de portada (hero-bg.jpg):**
- **Recomendadas**: **1920 × 1080 px** (Full HD)
- **Mínimas**: 1280 × 720 px

### Aspect ratio

**Para productos:**
- **1:1 (cuadrado)** — el CSS está pensado para tarjetas cuadradas con
  `aspect-ratio: 1`. Imágenes rectangulares se recortarán al centro.

**Para fondo de portada:**
- **Libre/Panorámico (aprox 16:9)** — El sistema usa `background-size: cover`, por lo que recortará el centro de la imagen para ajustarse automáticamente al alto y ancho de la ventana del usuario.

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
iniciales del producto** sobre un fondo gris claro. Es funcional,
solo que sin las fotos pierde algo del impacto visual.
