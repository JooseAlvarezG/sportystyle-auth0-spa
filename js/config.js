/**
 * config.js — Configuración global de la aplicación.
 *
 * domain y clientId de Auth0 son públicos por diseño (corren en el navegador).
 * La protección real ocurre en Auth0: callbacks autorizados, orígenes permitidos.
 * El Client Secret NUNCA va en el frontend; un SPA de Auth0 ni siquiera lo tiene.
 */

window.APP_CONFIG = Object.freeze({

    auth0: {
        domain:   'dev-qgp6pkdkfwwtfp76.us.auth0.com',
        clientId: 'Tryw7iIcOzag0TKpbCNJkljW3RW1uRbK',
        // Se usa la URL actual para que funcione igual en local y en producción
        redirectUri:      window.location.origin + window.location.pathname,
        cacheLocation:    'localstorage', // persiste la sesión entre recargas
        useRefreshTokens: false           // SPA público: sin refresh tokens
    },

    storage: {
        cartKey:       'sporty_cart_v1',
        cartIntegrity: 'sporty_cart_hash_v1'
    },

    validation: {
        emailPattern:   /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
        namePattern:    /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/,
        phonePattern:   /^[0-9]{8,12}$/,
        addressPattern: /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s.,#\-°º()]+$/,

        nameMinLen:    3,
        nameMaxLen:    80,
        addressMinLen: 5,
        addressMaxLen: 120,
        emailMaxLen:   120,

        maxCartItems:  50,  // tope defensivo contra manipulación
        maxQtyPerItem: 99
    },

    locale:         'es-CL',
    currency:       'CLP',
    currencySymbol: '$'
});
