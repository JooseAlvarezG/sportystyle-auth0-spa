# SportyStyle

Tienda de ropa deportiva. Proyecto académico — Taller de Plataformas Web · AIEP.

Implementación segura con Auth0, Session Storage y validaciones OWASP Top 10.

---

## Documentación y prueba funcional

En la carpeta [`docs/`](docs/) se encuentra el documento **"Documento explicativo.docx"** que incluye:

- Descripción detallada de la implementación
- Capturas de pantalla como prueba funcional del flujo completo (login, carrito, checkout, confirmación)

---

---

## 1. Flujo de autenticación con Auth0

SportyStyle delega **toda** la gestión de identidad al SDK oficial `auth0-spa-js v2`. El flujo es el siguiente:

### Inicialización (`auth.js → init`)

Al cargar la página, el módulo `AuthModule.init()` crea el cliente Auth0 con las credenciales definidas en `js/config.js`:

```
createAuth0Client({ domain, clientId, cacheLocation: 'localstorage', ... })
```

El SDK almacena los tokens en `localStorage`, lo que permite que la sesión sobreviva recargas de página.

### Login (`loginWithRedirect`)

Al presionar **Registrate / Ingresar**, se ejecuta `auth0Client.loginWithRedirect()`. El usuario es redirigido al **Universal Login de Auth0** (formulario hospedado en el dominio de Auth0), donde ingresa sus credenciales. El flujo utilizado es **Authorization Code + PKCE**, diseñado para SPAs sin backend.

### Callback (`handleRedirectCallback`)

Tras autenticarse, Auth0 redirige al usuario de vuelta a la app con un parámetro `code` en la URL. El SDK intercepta ese código, lo intercambia internamente por los tokens (access token + ID token) y limpia la URL del navegador. En ningún momento la app accede al token directamente.

### Restauración silenciosa (`getTokenSilently`)

Si el usuario ya tenía sesión activa (cookie SSO de Auth0 vigente), el SDK renueva el token automáticamente sin redirigir. Si la sesión expiró o el navegador bloquea cookies de terceros, el usuario deberá iniciar sesión nuevamente.

### Estado de sesión

- `AuthModule.isAuthenticated()` → `true/false`
- `AuthModule.getUser()` → perfil del usuario (nombre, email, etc.) extraído del ID token por el SDK

### Logout (`auth0Client.logout`)

Al cerrar sesión:
1. Se vacía el carrito y se limpia el Session Storage.
2. El SDK invalida la sesión en los servidores de Auth0 y elimina el token del `localStorage`.
3. El usuario es redirigido de vuelta a la app sin sesión activa.

### Diagrama resumido

```
Usuario          App (auth.js)          Auth0
  |                   |                    |
  |-- click Login --> |                    |
  |                   |-- loginWithRedirect -->|
  |                   |                    |-- muestra formulario
  |<-------------- redirige con ?code=... --|
  |                   |-- handleRedirectCallback()
  |                   |   (SDK intercambia code por tokens)
  |                   |-- getUser() --> perfil
  |<-- saludo "Hola, [nombre]" ------------|
```

---

## 2. Proceso de selección de productos y carrito

### Catálogo (`products.js`)

Los productos están definidos como un array inmutable `window.PRODUCTS`. Cada producto tiene: `id`, `category`, `name`, `description`, `price` e `image`.

Al iniciar la app, `renderProductGrid()` inyecta las tarjetas de producto en el DOM usando `createElement` y `textContent` (nunca `innerHTML`) para prevenir XSS.

### Agregar al carrito

Al hacer clic en **Agregar al carrito**, se llama a `Cart.addItem(productId)`:

1. Se busca el producto en `window.PRODUCTS` por su `id`.
2. Si ya existe en el carrito, se incrementa la cantidad (`qty + 1`).
3. Si es nuevo, se agrega con `qty: 1`.
4. Se guarda el carrito actualizado en Session Storage.
5. Se dispara el evento `cart:changed` para que la UI (contador del header, drawer) se actualice automáticamente.

### Límites defensivos

| Límite | Valor |
|--------|-------|
| Máximo de productos distintos en el carrito | 50 |
| Máximo de unidades por producto | 99 |

### Flujo completo de compra

```
Catálogo → Agregar al carrito → Abrir drawer → Pagar
  → Formulario de checkout → Validación → Confirmación
```

El botón **Pagar** solo se habilita cuando el usuario está autenticado. Al confirmar la compra, se validan los campos del formulario en dos capas: HTML5 nativo + JavaScript (`security.js`).

---

## 3. Protección de la sesión con Session Storage

### Por qué Session Storage

El carrito se guarda en `sessionStorage` bajo la clave `sporty_cart_v1`. A diferencia de `localStorage`, Session Storage se limita a la pestaña activa: si el usuario cierra la pestaña, los datos desaparecen automáticamente. Esto reduce el riesgo de que datos de compra queden expuestos en dispositivos compartidos.

### Integridad del carrito (defensa contra manipulación)

Cada vez que se lee el carrito, `cart.js` aplica dos verificaciones:

**1. Validación estructural** — cada item se valida con `Security.isValidCartItem()`. Verifica que tenga `id`, `name`, `price`, `qty` y `category` con los tipos y rangos esperados. Items corruptos o inválidos se descartan silenciosamente.

**2. Reconciliación de precios** — el precio de cada item se compara con el catálogo en memoria (`window.PRODUCTS`). Si difieren (p. ej. el usuario modificó el valor con DevTools), el precio del storage se descarta y se reemplaza por el del catálogo. Esto impide pagar menos manipulando el storage.

```js
// cart.js — reconciliación de precio
if (item.price !== product.price) {
    item.price = product.price; // siempre gana el catálogo
}
```

### Cuándo se eliminan los datos

Los datos del carrito y del Session Storage se eliminan en dos situaciones:

| Evento | Acción |
|--------|--------|
| **Logout** | `Cart.clear()` + `Security.safeStorage.clear()` antes de llamar a `auth0Client.logout()` |
| **Compra confirmada** | `Cart.clear()` tras el procesamiento exitoso del pedido |

Adicionalmente, el propio navegador elimina todo el Session Storage al cerrar la pestaña o la ventana.

### Resumen de capas de seguridad aplicadas

| OWASP | Medida |
|-------|--------|
| A03 — Injection/XSS | `textContent` y `createElement` en todo el DOM; `escapeHTML()` en security.js |
| A04 — Insecure Design | Precio siempre desde el catálogo, nunca desde storage |
| A05 — Security Misconfiguration | Content Security Policy en `index.html`; headers HTTP en `server.js` |
| A07 — Auth Failures | Delegación total a Auth0; no se implementa auth propia |
| A08 — Data Integrity | Validación estructural de cada item al leer el carrito |
