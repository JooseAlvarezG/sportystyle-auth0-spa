# SportyStyle — Tienda virtual con Auth0 y Session Storage

> Proyecto académico — Taller de Plataformas Web · Unidad 2 · Semana 6
> Asignatura: CIB302 · AIEP

Mini aplicación web para una tienda de ropa deportiva que implementa
autenticación con **Auth0**, persistencia de carrito en **Session
Storage** y validaciones alineadas con las prácticas del **OWASP Top 10**.

---

## 📋 Tabla de contenidos

1. [Stack y arquitectura](#-stack-y-arquitectura)
2. [Estructura del proyecto](#-estructura-del-proyecto)
3. [Cómo ejecutar](#-cómo-ejecutar-el-proyecto)
4. [Configuración de Auth0](#-configuración-de-auth0-paso-a-paso)
5. [Flujo de autenticación](#-flujo-de-autenticación)
6. [Proceso de selección de productos](#-proceso-de-selección-de-productos)
7. [Protección de la sesión con Session Storage](#-protección-de-la-sesión-con-session-storage)
8. [Validaciones y OWASP Top 10](#-validaciones-y-owasp-top-10)
9. [Decisiones de diseño relevantes](#-decisiones-de-diseño-relevantes)

---

## 🛠 Stack y arquitectura

- **HTML5** semántico (`<header>`, `<main>`, `<section>`, `<article>`,
  `<aside>`, `<footer>`, `<nav>`, `<form>` con `<fieldset>`/`<legend>`)
- **CSS3** moderno: Custom Properties, Grid, Flexbox, mobile-first
- **JavaScript ES6+** modular (sin frameworks pesados)
- **Auth0 SPA SDK** para autenticación delegada
- **Session Storage** nativo del navegador para persistencia del carrito

No requiere build, ni Node, ni npm. Es **100% estático** — abrir
`index.html` con un servidor estático es suficiente.

---

## 📁 Estructura del proyecto

```
sportystyle/
├── index.html              # Punto de entrada, HTML semántico
├── README.md               # Este archivo
├── css/
│   └── styles.css          # Diseño dark + neón verde lima
├── js/
│   ├── config.js           # Credenciales Auth0 + constantes
│   ├── security.js         # Sanitización, validaciones, storage seguro
│   ├── products.js         # Catálogo (9 productos en 3 categorías)
│   ├── cart.js             # Lógica del carrito + Session Storage
│   ├── auth.js             # Integración Auth0
│   ├── checkout.js         # Validación y flujo de pago simulado
│   └── app.js              # Bootstrap + event delegation
├── img/
│   └── README.md           # Especificaciones de imágenes
└── docs/
    └── Documentacion_SportyStyle.docx   # Documento explicativo
```

---

## ▶️ Cómo ejecutar el proyecto

### Opción 1 — Live Server (VSCode)

1. Abre la carpeta del proyecto en VSCode.
2. Instala la extensión **Live Server** si no la tienes.
3. Click derecho sobre `index.html` → **"Open with Live Server"**.
4. Se abre en `http://127.0.0.1:5500/`.

### Opción 2 — GitHub Pages

1. Sube el repositorio a GitHub.
2. En el repo: **Settings → Pages**.
3. Source: **Deploy from a branch**, branch: `main`, folder: `/ (root)`.
4. Esperar 1-2 minutos. URL típica:
   `https://tu-usuario.github.io/sportystyle/`.

### Opción 3 — Cualquier servidor estático

```bash
# Si tienes Python instalado:
cd sportystyle
python3 -m http.server 5500
# → http://localhost:5500
```

**⚠️ Importante**: NO abrir `index.html` con doble-click directo (sin
servidor). Auth0 requiere un origen HTTP/HTTPS válido para el callback,
y ciertas restricciones del navegador con `file://` rompen el flujo.

---

## 🔐 Configuración de Auth0 paso a paso

La aplicación viene con **placeholders**. Para activar el login real
debes crear una aplicación en Auth0 (es gratis) y reemplazar dos
valores en `js/config.js`.

### 1. Crear cuenta y aplicación en Auth0

1. Regístrate en [https://auth0.com](https://auth0.com) (puedes usar
   tu cuenta de Google).
2. En el dashboard, ve a **Applications → Applications → + Create
   Application**.
3. Nombre: `SportyStyle` (o el que prefieras).
4. Tipo: **Single Page Web Applications**.
5. Click **Create**.

### 2. Configurar URLs permitidas

En la misma aplicación recién creada, ve a la pestaña **Settings** y
configura estas URLs (separadas por coma si pones varias):

| Campo                          | Valor                                                                |
|--------------------------------|----------------------------------------------------------------------|
| **Allowed Callback URLs**      | `http://localhost:5500, http://127.0.0.1:5500, https://TU-USUARIO.github.io/TU-REPO/` |
| **Allowed Logout URLs**        | mismo valor que arriba                                              |
| **Allowed Web Origins**        | mismo valor que arriba                                              |
| **Allowed Origins (CORS)**     | mismo valor que arriba                                              |

**Reemplaza `TU-USUARIO/TU-REPO`** con tu cuenta y nombre de repo
reales.

Click en **Save Changes** al final de la página.

### 3. Copiar credenciales al proyecto

En la misma pestaña **Settings**, copia los valores de:

- **Domain** (ejemplo: `dev-abc123.us.auth0.com`)
- **Client ID** (cadena larga alfanumérica)

Y pégalos en `js/config.js`:

```js
auth0: {
    domain:   'dev-abc123.us.auth0.com',   // ← tu domain aquí
    clientId: 'AbCdEf1234567890XYZ',       // ← tu clientId aquí
    redirectUri: window.location.origin + window.location.pathname,
    cacheLocation: 'memory',
    useRefreshTokens: false
}
```

### 4. (Opcional) Habilitar registro de usuarios

Por defecto Auth0 permite que cualquiera se registre. Si quieres
restringirlo:

- **Authentication → Database → Username-Password-Authentication**
- Toggle **"Disable Sign Ups"** según prefieras.

¡Listo! Recarga la página y el botón **"Ingresar"** abrirá la pantalla
de Auth0.

---

## 🔑 Flujo de autenticación

El flujo completo, desde el click en "Ingresar" hasta el saludo en el
header:

1. **Usuario hace click en "Ingresar"** (en el header).
2. `auth.js` llama a `auth0Client.loginWithRedirect()` del SDK oficial.
3. El SDK redirige al dominio de Auth0 (`tu-tenant.auth0.com`) donde el
   usuario ve el formulario universal de login (con email/password,
   Google, GitHub, etc. según lo que tengas habilitado).
4. Tras autenticarse, Auth0 redirige de vuelta a `redirectUri` con un
   `code` y `state` en la URL.
5. Al detectar esos parámetros, `auth.js` llama a
   `handleRedirectCallback()`. El SDK intercambia el code por un token
   internamente y limpia la URL.
6. La app verifica `isAuthenticated()` y obtiene el perfil con
   `getUser()`.
7. Se muestra el mensaje **"Hola, [nombre]"** en el header y aparece el
   botón **"Salir"**.
8. Se dispara el evento custom `auth:changed` para que otros módulos
   (carrito, checkout) reaccionen.

### ¿Por qué delegar a Auth0?

- **No manejamos JWT manualmente** (la actividad lo permite y es la
  recomendación de la industria). El SDK valida firma, audience e
  issuer del token internamente.
- **Token solo en memoria** (`cacheLocation: 'memory'`): si un atacante
  logra inyectar XSS, no puede persistir el robo del token entre
  recargas. Es más seguro que `localStorage`.
- **Sin Client Secret en el frontend**: una SPA en Auth0 ni siquiera
  tiene secreto. La protección está en las callback URLs autorizadas.

---

## 🛍 Proceso de selección de productos

### Catálogo

`js/products.js` contiene los 9 productos del catálogo, organizados
en 3 categorías:

- **Camisetas deportivas** (3 productos)
- **Pantalones deportivos** (3 productos)
- **Accesorios de deporte** (3 productos)

Cada producto tiene: `id`, `category`, `name`, `description`, `price`
e `image`. El `id` es alfanumérico fijo para que sea estable como
identificador.

### Renderizado

`renderProductGrid()` crea las tarjetas con `document.createElement` y
`textContent` — **nunca con `innerHTML`**. Esto garantiza que aún si un
nombre de producto contuviera caracteres peligrosos, no se interpretaría
como HTML.

### Agregar al carrito

Se usa **event delegation**: un solo listener en `<main>` captura los
clicks en cualquier botón con `data-action="add-to-cart"`. Esto:

- Funciona aunque las tarjetas se rendericen dinámicamente.
- Reduce el número de listeners (un solo handler para todos los
  productos).
- Centraliza la lógica de despacho de acciones.

Al hacer click, `Cart.addItem(productId)`:
1. Busca el producto en el catálogo (fuente de verdad).
2. Verifica topes (máx 50 items, máx 99 unidades por item).
3. Incrementa cantidad si ya existía, o agrega como nuevo.
4. Persiste en Session Storage.
5. Dispara `cart:changed` para refrescar la UI.
6. Muestra un toast de confirmación.

---

## 💾 Protección de la sesión con Session Storage

### ¿Por qué Session Storage y no localStorage?

| Aspecto                | Session Storage                  | localStorage                |
|------------------------|----------------------------------|-----------------------------|
| Duración               | Mientras la pestaña esté abierta | Hasta que se borre          |
| Aislamiento por pestaña| Sí                               | No (compartido)             |
| Adecuado para carrito  | ✅ Sí (efímero por sesión)        | ❌ Carrito viejo persistiría |

La actividad pide explícitamente **Session Storage** y se ajusta al
caso: el carrito debe persistir mientras navegas pero no debe quedar
guardado para siempre.

### Cómo se almacena

El carrito se guarda como JSON bajo la clave `sporty_cart_v1`:

```json
[
  { "id": "cam-001", "name": "Camiseta Pro Run", "price": 24990,
    "category": "camisetas", "image": "img/camiseta-1.jpg", "qty": 2 }
]
```

### Verificación de integridad (defensa OWASP A08)

Cada vez que se lee el carrito, `cart.js` ejecuta varios checks
defensivos en `readCart()`:

1. **Validación de forma**: cada item pasa por `isValidCartItem()`
   que verifica tipos, longitudes y rangos.
2. **Reconciliación de precio**: el precio del item en storage se
   **compara con el catálogo en memoria**. Si fue manipulado vía
   DevTools (típica técnica de "agarro el carrito y le bajo el precio
   a $1"), se restaura desde el catálogo. **El servidor real es la
   fuente de verdad de precios — esto simula esa defensa en cliente.**
3. **Items huérfanos**: si un producto fue eliminado del catálogo, su
   item del carrito se descarta automáticamente.

### Wrapper `safeStorage`

`security.js` expone `safeStorage` con `try/catch` para manejar:
- Cuota llena (raro pero existe)
- Modo navegación privada (en algunos navegadores el storage falla)
- Storage deshabilitado por el usuario
- JSON corrupto al leer

### Cierre de sesión

Cuando el usuario hace click en "Salir":

1. `Cart.clear()` → vacía el carrito.
2. `Security.safeStorage.clear()` → limpia todo el Session Storage.
3. `auth0Client.logout()` → cierra la sesión en Auth0 también.
4. La UI se actualiza automáticamente vía evento `auth:changed`.

---

## 🛡 Validaciones y OWASP Top 10

> **Nota a la profesora**: en el trabajo anterior se observó que la
> validación era solo a nivel cliente. Aquí esa decisión se toma
> conscientemente (la actividad es 100% front-end) pero está
> implementada **en capas** y **documentada**: el código está
> estructurado para que reemplazar la confirmación local por una
> llamada a backend sea trivial (un solo `fetch` en `checkout.js`).

### Validación en capas

| Capa | Implementación                              | Propósito                              |
|------|---------------------------------------------|----------------------------------------|
| 1    | HTML5 (`required`, `pattern`, `type`)       | UX inmediata + apoyo del navegador     |
| 2    | JavaScript (`security.js` + `checkout.js`)  | Validación semántica con mensajes claros |
| 3    | Sanitización (`escapeHTML`, `sanitizeInput`)| Defensa anti-XSS antes de tocar el DOM |
| 4    | (no implementada — sería el backend)        | **Fuente de verdad final** en una app real |

### Reglas de validación implementadas

| Campo     | Regla                                                     |
|-----------|-----------------------------------------------------------|
| Nombre    | 3-80 caracteres, solo letras (incl. acentos y ñ) y espacios |
| Email     | Patrón RFC-5322 simplificado, máximo 120 caracteres       |
| Teléfono  | Solo dígitos, 8-12 caracteres                             |
| Dirección | 5-120 caracteres, alfanumérico + `.,#-°º()`               |

Cada error se muestra **inline bajo el input afectado** (no en alert),
con `aria-invalid` para accesibilidad.

### Cobertura de OWASP Top 10 (2021)

| ID  | Riesgo                                | Mitigación implementada                                                              |
|-----|---------------------------------------|--------------------------------------------------------------------------------------|
| A01 | Broken Access Control                 | Botón de pago deshabilitado sin sesión activa; verificación en handler de submit     |
| A02 | Cryptographic Failures                | HTTPS obligatorio (Auth0); token NO en localStorage, solo en memoria                 |
| A03 | Injection / **XSS**                   | `textContent` y `createElement` en lugar de `innerHTML`; función `escapeHTML` para fallback; CSP en meta |
| A04 | Insecure Design                       | Validación de integridad del carrito; reconciliación de precios contra catálogo; topes defensivos |
| A05 | Security Misconfiguration             | CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy` configurados en meta tags |
| A06 | Vulnerable & Outdated Components      | Auth0 SDK desde CDN oficial con versión fija (`2.1`)                                |
| A07 | Identification & Authentication Failures | Auth delegada a Auth0 (no roll-your-own); validación de tokens por el SDK         |
| A08 | Software & Data Integrity Failures    | Validación de cada item leído del Session Storage; descarte de items manipulados    |
| A09 | Security Logging Failures             | Logger centralizado (`Security.logger`) — en producción enviaría a SIEM             |
| A10 | Server-Side Request Forgery           | N/A (sin backend en este proyecto)                                                   |

---

## 🎨 Decisiones de diseño relevantes

### HTML semántico

A diferencia del trabajo anterior (donde se observó uso excesivo de
`<div>`), aquí cada bloque usa la etiqueta correcta:

- `<header>` para el sitio y para secciones internas
- `<nav>` con `aria-label` para la navegación principal
- `<main>` para el contenido principal
- `<section>` con `aria-labelledby` para cada sección temática
- `<article>` para cada tarjeta de producto y para la confirmación
- `<aside>` para el carrito lateral
- `<form>` con `<fieldset>` y `<legend>` para agrupar campos
- `<footer>` con `role="contentinfo"`

### Eventos complejos

Para atender la observación "sección dinámica correcta, pero sin mayor
complejidad en eventos":

- **Event delegation** desde contenedores padre (no listeners por botón)
- **Custom Events** (`cart:changed`, `auth:changed`) para comunicación
  entre módulos sin acoplamiento directo
- **Cierre con tecla Escape** del drawer del carrito
- **`onerror` en imágenes** para reemplazar por placeholder dinámico
- **Doble-submit prevention** en el formulario de checkout
- **Validación on-blur** por campo + limpieza de error on-input

### Manejo de errores

Cada operación con riesgo de fallar (Auth0, Session Storage, parseo
JSON, llamadas asíncronas) está envuelta en `try/catch` con:

- Logging técnico vía `Security.logger`
- Feedback amigable al usuario vía `Security.toast`
- Estado UI consistente incluso ante fallo (botones se rehabilitan)

### Accesibilidad

- Todos los botones tienen `aria-label` descriptivo
- Errores con `role="alert"` para lectores de pantalla
- `aria-live="polite"` en zonas que cambian dinámicamente
- `:focus-visible` con outline neón visible
- `prefers-reduced-motion` respetado para usuarios con sensibilidad

---

## 📜 Licencia

Proyecto académico sin fines comerciales.

---

## 👤 Autor

Estudiante CIB302 · Taller de Plataformas Web · AIEP · 2026
