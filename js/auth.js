/**
 * ====================================================================
 * auth.js — Autenticación con Auth0
 * ====================================================================
 *
 * Delega TODO el manejo de tokens y sesión al SDK oficial de Auth0
 * (auth0-spa-js). Las decisiones detrás de esto:
 *
 *  1. NO se decodifica JWT manualmente. El SDK valida firma, audience
 *     e issuer internamente, evitando errores propios de implementaciones
 *     ad-hoc (OWASP A07 — Identification and Authentication Failures).
 *
 *  2. Token guardado SOLO en memoria (`cacheLocation: 'memory'`),
 *     no en localStorage. Esto reduce drásticamente el impacto de
 *     un XSS exitoso (un atacante con XSS no podría persistir el robo
 *     del token entre recargas).
 *
 *  3. Refresh tokens desactivados: este es un SPA público sin backend
 *     propio para custodiarlos.
 *
 *  4. Los callbacks (`auth:changed`) permiten que el resto de la app
 *     reaccione al cambio de estado sin acoplarse al SDK.
 *
 * MANEJO DE ERRORES:
 *  Cada operación con Auth0 está envuelta en try/catch y reporta al
 *  usuario con un toast amigable, además de loggear el detalle técnico.
 * ====================================================================
 */

(function () {
    'use strict';

    let auth0Client = null;
    let currentUser = null;
    let isAuth = false;
    let initialized = false;

    /**
     * Inicializa el cliente Auth0. Maneja también el callback tras login.
     */
    async function init() {
        if (initialized) return;

        // Validación: ¿el SDK cargó? Si no, modo degradado
        if (typeof auth0 === 'undefined' || !auth0.createAuth0Client) {
            Security.logger.error('SDK de Auth0 no cargó. ¿Sin internet o bloqueado?');
            Security.toast('No se pudo cargar Auth0. Verifica tu conexión.', 'error', 5000);
            updateUI();
            return;
        }

        // Validación: ¿credenciales configuradas?
        const cfg = APP_CONFIG.auth0;
        if (cfg.domain.includes('TU_DOMINIO') || cfg.clientId.includes('TU_CLIENT_ID')) {
            Security.logger.warn('Auth0 sin configurar. Edita js/config.js con tus credenciales.');
            Security.toast('Auth0 no está configurado aún (revisa README).', 'error', 5000);
            updateUI();
            return;
        }

        try {
            auth0Client = await auth0.createAuth0Client({
                domain: cfg.domain,
                clientId: cfg.clientId,
                cacheLocation: cfg.cacheLocation,
                useRefreshTokens: cfg.useRefreshTokens,
                authorizationParams: {
                    redirect_uri: cfg.redirectUri
                }
            });

            // Manejar callback tras redirect del login
            const params = window.location.search;
            if (params.includes('code=') && params.includes('state=')) {
                try {
                    await auth0Client.handleRedirectCallback();
                    // Limpiar query string del navegador
                    window.history.replaceState({}, document.title, window.location.pathname);
                } catch (cbErr) {
                    Security.logger.error('Error en callback Auth0', cbErr);
                    Security.toast('No se pudo completar el login.', 'error');
                }
            }

            // Verificar estado actual
            isAuth = await auth0Client.isAuthenticated();
            if (isAuth) {
                currentUser = await auth0Client.getUser();
            }

            initialized = true;
            updateUI();
            notifyChange();

        } catch (err) {
            Security.logger.error('Init Auth0 falló', err);
            Security.toast('Error al iniciar Auth0. Revisa la configuración.', 'error', 5000);
        }
    }

    async function login() {
        if (!auth0Client) {
            Security.toast('Auth0 no está disponible. Revisa configuración.', 'error');
            return;
        }
        try {
            await auth0Client.loginWithRedirect();
        } catch (err) {
            Security.logger.error('Login falló', err);
            Security.toast('No se pudo iniciar sesión.', 'error');
        }
    }

    async function logout() {
        // Limpiar carrito ANTES de cerrar sesión (requisito de la actividad)
        if (window.Cart) window.Cart.clear();
        Security.safeStorage.clear();

        if (!auth0Client) {
            // Si Auth0 no está disponible, al menos limpiamos estado local
            isAuth = false;
            currentUser = null;
            updateUI();
            notifyChange();
            return;
        }
        try {
            await auth0Client.logout({
                logoutParams: {
                    returnTo: APP_CONFIG.auth0.redirectUri
                }
            });
        } catch (err) {
            Security.logger.error('Logout falló', err);
            Security.toast('No se pudo cerrar sesión completamente.', 'error');
        }
    }

    function isAuthenticated() {
        return isAuth;
    }

    function getUser() {
        return currentUser;
    }

    /**
     * Actualiza visibilidad de botones y mensaje de bienvenida.
     */
    function updateUI() {
        const btnLogin = document.getElementById('btn-login');
        const btnLogout = document.getElementById('btn-logout');
        const welcome = document.getElementById('welcome-message');

        if (isAuth && currentUser) {
            if (btnLogin) btnLogin.hidden = true;
            if (btnLogout) btnLogout.hidden = false;
            if (welcome) {
                welcome.hidden = false;
                // Construir DOM con textContent — sin innerHTML
                welcome.replaceChildren();
                const hi = document.createTextNode('Hola, ');
                const strong = document.createElement('strong');
                strong.textContent = currentUser.name || currentUser.nickname || currentUser.email || 'usuario';
                welcome.appendChild(hi);
                welcome.appendChild(strong);
            }
        } else {
            if (btnLogin) btnLogin.hidden = false;
            if (btnLogout) btnLogout.hidden = true;
            if (welcome) {
                welcome.hidden = true;
                welcome.replaceChildren();
            }
        }
    }

    function notifyChange() {
        window.dispatchEvent(new CustomEvent('auth:changed', {
            detail: { isAuthenticated: isAuth, user: currentUser }
        }));
    }

    // API pública
    window.AuthModule = Object.freeze({
        init,
        login,
        logout,
        isAuthenticated,
        getUser
    });
})();
