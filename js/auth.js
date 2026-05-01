/**
 * auth.js — Autenticación delegada a Auth0 (auth0-spa-js v2)
 * Flujo completo documentado en README.md › sección 1.
 */

(function () {
    'use strict';

    let auth0Client  = null;
    let currentUser  = null;
    let isAuth       = false;
    let initialized  = false;

    async function init() {
        if (initialized) return;

        if (typeof auth0 === 'undefined' || !auth0.createAuth0Client) {
            Security.logger.error('SDK de Auth0 no cargó. ¿Sin internet o bloqueado?');
            Security.toast('No se pudo cargar Auth0. Verifica tu conexión.', 'error', 5000);
            updateUI();
            return;
        }

        const cfg = APP_CONFIG.auth0;
        if (cfg.domain.includes('TU_DOMINIO') || cfg.clientId.includes('TU_CLIENT_ID')) {
            Security.logger.warn('Auth0 sin configurar. Edita js/config.js con tus credenciales.');
            Security.toast('Auth0 no está configurado aún (revisa README).', 'error', 5000);
            updateUI();
            return;
        }

        try {
            auth0Client = await auth0.createAuth0Client({
                domain:           cfg.domain,
                clientId:         cfg.clientId,
                cacheLocation:    cfg.cacheLocation,    // 'localstorage': persiste entre recargas
                useRefreshTokens: cfg.useRefreshTokens,
                authorizationParams: { redirect_uri: cfg.redirectUri }
            });

            const params = window.location.search;
            let handledCallback = false;

            // Auth0 devuelve ?code=&state= tras el login (Authorization Code + PKCE)
            if (params.includes('code=') && params.includes('state=')) {
                try {
                    await auth0Client.handleRedirectCallback();
                    // Limpiar params de la URL para evitar re-procesamiento
                    window.history.replaceState({}, document.title, window.location.pathname);
                    handledCallback = true;
                } catch (cbErr) {
                    Security.logger.error('Error procesando callback de Auth0', cbErr);
                    Security.toast('No se pudo completar el inicio de sesión.', 'error');
                }
            }

            // Sin callback: intentar renovar token silenciosamente via cookie SSO.
            // Falla silencioso si la sesión expiró o el navegador bloquea cookies de terceros.
            if (!handledCallback) {
                try {
                    await auth0Client.getTokenSilently();
                } catch (silentErr) {
                    const ignorable = ['login_required', 'consent_required', 'interaction_required'];
                    if (!ignorable.includes(silentErr.error)) {
                        Security.logger.warn('Renovación silenciosa no disponible:', silentErr.error);
                    }
                }
            }

            isAuth = await auth0Client.isAuthenticated();
            if (isAuth) currentUser = await auth0Client.getUser();

            initialized = true;
            updateUI();
            notifyChange();

        } catch (err) {
            Security.logger.error('Inicialización de Auth0 falló', err);
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
        // Limpiar datos locales antes de invalidar sesión en Auth0
        if (window.Cart) window.Cart.clear();
        Security.safeStorage.clear();

        if (!auth0Client) {
            isAuth = false;
            currentUser = null;
            updateUI();
            notifyChange();
            return;
        }
        try {
            await auth0Client.logout({ logoutParams: { returnTo: APP_CONFIG.auth0.redirectUri } });
        } catch (err) {
            Security.logger.error('Logout falló', err);
            Security.toast('No se pudo cerrar sesión completamente.', 'error');
        }
    }

    function isAuthenticated() { return isAuth; }

    function getUser() { return currentUser; }

    function updateUI() {
        const btnLogin  = document.getElementById('btn-login');
        const btnLogout = document.getElementById('btn-logout');
        const welcome   = document.getElementById('welcome-message');

        if (isAuth && currentUser) {
            if (btnLogin)  btnLogin.hidden  = true;
            if (btnLogout) btnLogout.hidden = false;

            if (welcome) {
                welcome.hidden = false;
                // textContent evita XSS si el nombre del perfil contuviera HTML
                welcome.replaceChildren();
                const hi = document.createTextNode('Hola, ');
                const strong = document.createElement('strong');
                strong.textContent = currentUser.name || currentUser.nickname || currentUser.email || 'usuario';
                welcome.appendChild(hi);
                welcome.appendChild(strong);
            }
        } else {
            if (btnLogin)  btnLogin.hidden  = false;
            if (btnLogout) btnLogout.hidden = true;
            if (welcome) { welcome.hidden = true; welcome.replaceChildren(); }
        }
    }

    // Notifica cambios de sesión a otros módulos sin acoplamiento directo
    function notifyChange() {
        window.dispatchEvent(new CustomEvent('auth:changed', {
            detail: { isAuthenticated: isAuth, user: currentUser }
        }));
    }

    window.AuthModule = Object.freeze({ init, login, logout, isAuthenticated, getUser });

})();
