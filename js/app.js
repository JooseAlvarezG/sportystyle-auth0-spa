/**
 * ====================================================================
 * app.js — Bootstrap y orquestación
 * ====================================================================
 *
 * Punto de entrada de la app. Responsabilidades:
 *  - Inicializar Auth0 y verificar sesión existente
 *  - Renderizar el catálogo en sus 3 grillas
 *  - Configurar EVENT DELEGATION (un solo listener por contenedor
 *    en vez de uno por botón) — patrón eficiente que escala bien.
 *  - Manejo del drawer del carrito y navegación entre vistas.
 *
 * EVENT DELEGATION (atendiendo a la observación "sin mayor complejidad
 * en eventos"): los clicks sobre botones dinámicos (productos, items
 * del carrito) se manejan desde el contenedor padre. Esto:
 *   - Reduce el número de listeners (mejor rendimiento)
 *   - Funciona con elementos creados después del listener
 *   - Centraliza la lógica de despacho de acciones
 * ====================================================================
 */

(function () {
    'use strict';

    /**
     * Bootstrap principal — se ejecuta cuando el DOM está listo.
     */
    async function init() {
        // 1. Renderizar catálogo
        renderAllCategories();

        // 2. Inicializar módulo de checkout
        if (window.CheckoutModule) {
            window.CheckoutModule.init();
        }

        // 3. Configurar event delegation
        setupEventDelegation();

        // 4. Configurar carrito drawer
        setupCartDrawer();

        // 5. Botones del header
        setupHeaderButtons();

        // 6. Render inicial del carrito (puede haber items de sesión activa)
        if (window.Cart) {
            window.Cart.renderCartDrawer();
        }

        // 7. Inicializar Auth0 (asíncrono, no bloquea el resto)
        if (window.AuthModule) {
            await window.AuthModule.init();
        }

        Security.logger.info('SportyStyle inicializado');
    }

    function renderAllCategories() {
        window.renderProductGrid('grid-camisetas',  window.getProductsByCategory('camisetas'));
        window.renderProductGrid('grid-pantalones', window.getProductsByCategory('pantalones'));
        window.renderProductGrid('grid-accesorios', window.getProductsByCategory('accesorios'));
    }

    /**
     * Event delegation: un solo listener en `main` y otro en el body
     * del carrito atrapan clicks en botones dinámicos.
     */
    function setupEventDelegation() {
        // Botones "Agregar al carrito" en el catálogo
        const main = document.getElementById('main');
        if (main) {
            main.addEventListener('click', (e) => {
                const target = e.target.closest('[data-action]');
                if (!target) return;
                const action = target.dataset.action;
                const productId = target.dataset.productId;

                switch (action) {
                    case 'add-to-cart':
                        if (productId) {
                            window.Cart.addItem(productId);
                            // Animación pulse en el ícono del carrito
                            pulseCartIcon();
                        }
                        break;
                }
            });
        }

        // Controles dentro del drawer del carrito
        const cartBody = document.getElementById('cart-body');
        if (cartBody) {
            cartBody.addEventListener('click', (e) => {
                const target = e.target.closest('[data-action]');
                if (!target) return;
                const action = target.dataset.action;
                const productId = target.dataset.productId;
                if (!productId) return;

                switch (action) {
                    case 'qty-increase':
                        window.Cart.updateQty(productId, +1);
                        break;
                    case 'qty-decrease':
                        window.Cart.updateQty(productId, -1);
                        break;
                    case 'remove-item':
                        window.Cart.removeItem(productId);
                        break;
                }
            });
        }

        // Vaciar carrito
        const btnClear = document.getElementById('btn-clear-cart');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                if (confirm('¿Vaciar todo el carrito?')) {
                    window.Cart.clear();
                    Security.toast('Carrito vaciado.', 'info');
                }
            });
        }

        // Ir a checkout desde el carrito
        const btnCheckout = document.getElementById('btn-checkout');
        if (btnCheckout) {
            btnCheckout.addEventListener('click', () => {
                if (!window.AuthModule.isAuthenticated()) {
                    Security.toast('Debes iniciar sesión primero.', 'error');
                    return;
                }
                const cart = window.Cart.getSnapshot();
                if (cart.items.length === 0) {
                    Security.toast('Tu carrito está vacío.', 'error');
                    return;
                }
                closeCartDrawer();
                document.getElementById('productos').hidden = true;
                document.getElementById('checkout').hidden = false;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    function setupCartDrawer() {
        const toggle = document.getElementById('btn-cart-toggle');
        const close  = document.getElementById('btn-cart-close');
        const overlay = document.getElementById('cart-overlay');

        if (toggle) toggle.addEventListener('click', openCartDrawer);
        if (close)  close.addEventListener('click', closeCartDrawer);
        if (overlay) overlay.addEventListener('click', closeCartDrawer);

        // Cerrar con Esc
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeCartDrawer();
        });
    }

    function openCartDrawer() {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');
        const toggle = document.getElementById('btn-cart-toggle');
        if (!drawer || !overlay) return;
        drawer.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        overlay.hidden = false;
        // Forzar reflow para que la transición de opacidad funcione
        void overlay.offsetWidth;
        overlay.classList.add('visible');
        if (toggle) toggle.setAttribute('aria-expanded', 'true');
    }

    function closeCartDrawer() {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');
        const toggle = document.getElementById('btn-cart-toggle');
        if (!drawer || !overlay) return;
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
        overlay.classList.remove('visible');
        setTimeout(() => { overlay.hidden = true; }, 300);
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }

    function setupHeaderButtons() {
        const btnLogin = document.getElementById('btn-login');
        const btnLogout = document.getElementById('btn-logout');

        if (btnLogin) {
            btnLogin.addEventListener('click', () => window.AuthModule.login());
        }
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                if (confirm('¿Cerrar sesión? Tu carrito se vaciará.')) {
                    window.AuthModule.logout();
                }
            });
        }
    }

    /**
     * Pulso visual en el ícono del carrito al agregar un producto.
     */
    function pulseCartIcon() {
        const cart = document.getElementById('btn-cart-toggle');
        if (!cart) return;
        cart.style.transform = 'scale(1.15)';
        cart.style.transition = 'transform 0.2s';
        setTimeout(() => { cart.style.transform = ''; }, 200);
    }

    // Esperar DOM listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
