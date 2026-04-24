/**
 * ====================================================================
 * config.js — Configuración global de la aplicación
 * ====================================================================
 *
 * Centraliza credenciales y constantes para facilitar mantenimiento.
 * En producción real, estos valores deberían inyectarse desde build
 * (ej: variables de entorno) y NUNCA quedar versionados en GitHub.
 *
 * Para esta actividad académica se exponen aquí porque:
 *  1. Los valores de "domain" y "clientId" de Auth0 son públicos
 *     por diseño: están pensados para correr en el navegador.
 *  2. La protección real ocurre en Auth0 (callbacks autorizados,
 *     orígenes permitidos, etc.).
 *
 * IMPORTANTE: El "Client Secret" NUNCA va en el frontend. Solo el
 * Client ID. Un SPA (Single Page App) en Auth0 ni siquiera tiene
 * Client Secret.
 * ====================================================================
 */

window.APP_CONFIG = Object.freeze({

    /* ------------------------------------------------------------
       AUTH0 — Reemplaza estos valores con los de tu propia cuenta
       Pasos detallados en README.md sección "Configuración Auth0"
       ------------------------------------------------------------ */
    auth0: {
        domain:   'TU_DOMINIO.us.auth0.com',  // ej: dev-abc123.us.auth0.com
        clientId: 'TU_CLIENT_ID_AQUI',
        // Auth0 redirige a la URL actual tras el login.
        // En GitHub Pages será https://usuario.github.io/repo/
        // En local típicamente http://127.0.0.1:5500/ o http://localhost:5500/
        redirectUri: window.location.origin + window.location.pathname,
        cacheLocation: 'memory',  // Token solo en memoria (más seguro que localStorage)
        useRefreshTokens: false   // SPA público: refresh tokens desactivados
    },

    /* ------------------------------------------------------------
       SESSION STORAGE — claves usadas por la app
       ------------------------------------------------------------ */
    storage: {
        cartKey:        'sporty_cart_v1',
        // Marcador para detectar manipulación del carrito por DevTools
        cartIntegrity:  'sporty_cart_hash_v1'
    },

    /* ------------------------------------------------------------
       VALIDACIÓN — patrones y límites
       Patrones declarativos: facilitan auditoría y testing
       ------------------------------------------------------------ */
    validation: {
        // Email RFC-5322 simplificado (suficiente para validación cliente)
        emailPattern:    /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
        // Nombre: solo letras (incluye acentos y ñ) y espacios
        namePattern:     /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/,
        // Teléfono: 8-12 dígitos
        phonePattern:    /^[0-9]{8,12}$/,
        // Dirección: alfanumérico + caracteres comunes
        addressPattern:  /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s.,#\-°º()]+$/,

        nameMinLen: 3,
        nameMaxLen: 80,
        addressMinLen: 5,
        addressMaxLen: 120,
        emailMaxLen: 120,

        // Carrito: tope defensivo para evitar manipulación maliciosa
        maxCartItems: 50,
        maxQtyPerItem: 99
    },

    /* ------------------------------------------------------------
       FORMATO
       ------------------------------------------------------------ */
    locale: 'es-CL',
    currency: 'CLP',
    currencySymbol: '$'
});
