/**
 * app.js — Bootstrap y orquestación de la app.
 * Usa event delegation: un listener por contenedor en vez de uno por botón,
 * lo que también permite capturar elementos creados dinámicamente.
 */

(function () {
    'use strict';

    async function init() {
        // 1. Renderizar catálogo
        renderAllCategories();
        // 2. Inicializar módulo de checkout
        if (window.CheckoutModule) window.CheckoutModule.init();
        // 3. Configurar listeners
        setupEventDelegation();
        setupCartDrawer();
        setupHeaderButtons();
        setupSearch();
        setupNavigation();
        // 4. Render inicial del carrito (puede haber items de sesión activa)
        if (window.Cart) window.Cart.renderCartDrawer();
        // 5. Auth0 (asíncrono, no bloquea el render)
        if (window.AuthModule) await window.AuthModule.init();

        Security.logger.info('SportyStyle inicializado');
    }

    function renderAllCategories() {
        window.renderProductGrid('grid-camisetas',  window.getProductsByCategory('camisetas'));
        window.renderProductGrid('grid-pantalones', window.getProductsByCategory('pantalones'));
        window.renderProductGrid('grid-accesorios', window.getProductsByCategory('accesorios'));
    }

    function setupEventDelegation() {
        const main = document.getElementById('main');
        if (main) {
            main.addEventListener('click', (e) => {
                const target = e.target.closest('[data-action]');
                if (!target) return;
                if (target.dataset.action === 'add-to-cart' && target.dataset.productId) {
                    window.Cart.addItem(target.dataset.productId);
                    pulseCartIcon();
                }
            });
        }

        const cartBody = document.getElementById('cart-body');
        if (cartBody) {
            cartBody.addEventListener('click', (e) => {
                const target = e.target.closest('[data-action]');
                if (!target || !target.dataset.productId) return;
                switch (target.dataset.action) {
                    case 'qty-increase': window.Cart.updateQty(target.dataset.productId, +1); break;
                    case 'qty-decrease': window.Cart.updateQty(target.dataset.productId, -1); break;
                    case 'remove-item':  window.Cart.removeItem(target.dataset.productId);     break;
                }
            });
        }

        const btnClear = document.getElementById('btn-clear-cart');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                if (confirm('¿Vaciar todo el carrito?')) {
                    window.Cart.clear();
                    Security.toast('Carrito vaciado.', 'info');
                }
            });
        }

        const btnCheckout = document.getElementById('btn-checkout');
        if (btnCheckout) {
            btnCheckout.addEventListener('click', () => {
                if (!window.AuthModule.isAuthenticated()) {
                    Security.toast('Debes iniciar sesión primero.', 'error');
                    return;
                }
                if (window.Cart.getSnapshot().items.length === 0) {
                    Security.toast('Tu carrito está vacío.', 'error');
                    return;
                }
                closeCartDrawer();
                if (window.Search) window.Search.clear();
                document.getElementById('productos').hidden = true;
                const checkoutSection = document.getElementById('checkout');
                checkoutSection.hidden = false;
                checkoutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }

    function setupCartDrawer() {
        const toggle  = document.getElementById('btn-cart-toggle');
        const close   = document.getElementById('btn-cart-close');
        const overlay = document.getElementById('cart-overlay');

        if (toggle)  toggle.addEventListener('click', openCartDrawer);
        if (close)   close.addEventListener('click', closeCartDrawer);
        if (overlay) overlay.addEventListener('click', closeCartDrawer);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeCartDrawer();
        });
    }

    function openCartDrawer() {
        const drawer  = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');
        const toggle  = document.getElementById('btn-cart-toggle');
        if (!drawer || !overlay) return;
        drawer.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        overlay.hidden = false;
        void overlay.offsetWidth; // fuerza reflow para que arranque la transición CSS
        overlay.classList.add('visible');
        if (toggle) toggle.setAttribute('aria-expanded', 'true');
    }

    function closeCartDrawer() {
        const drawer  = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');
        const toggle  = document.getElementById('btn-cart-toggle');
        if (!drawer || !overlay) return;
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
        overlay.classList.remove('visible');
        setTimeout(() => { overlay.hidden = true; }, 300);
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }

    function setupHeaderButtons() {
        const btnLogin  = document.getElementById('btn-login');
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogin)  btnLogin.addEventListener('click',  () => window.AuthModule.login());
        if (btnLogout) btnLogout.addEventListener('click', () => {
            if (confirm('¿Cerrar sesión? Tu carrito se vaciará.')) window.AuthModule.logout();
        });
    }

    // Intercepta clicks en anchors del catálogo cuando el usuario está en otra vista
    // (checkout/confirmación), donde #productos está oculto y el scroll nativo no funciona
    function setupNavigation() {
        const CATALOG_ANCHORS = new Set(['#productos', '#camisetas', '#pantalones', '#accesorios']);

        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;
            const hash = link.getAttribute('href');
            if (!CATALOG_ANCHORS.has(hash)) return;

            const catalog = document.getElementById('productos');
            if (!catalog || !catalog.hidden) return; // el browser maneja el scroll normalmente

            e.preventDefault();
            document.getElementById('checkout')?.hidden     !== undefined && (document.getElementById('checkout').hidden = true);
            document.getElementById('confirmation')?.hidden !== undefined && (document.getElementById('confirmation').hidden = true);

            if (window.Search) window.Search.clear();
            else catalog.hidden = false;

            setTimeout(() => {
                const targetEl = document.getElementById(hash.slice(1));
                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                else window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 50);
        });
    }

    function setupSearch() {
        const input = document.querySelector('.search-input');
        if (!input) return;

        const catalogSection = document.getElementById('productos');

        const resultsSection = document.createElement('section');
        resultsSection.id = 'search-results';
        resultsSection.className = 'catalog';
        resultsSection.hidden = true;
        resultsSection.setAttribute('aria-labelledby', 'search-results-title');

        const resultsHeader = document.createElement('header');
        resultsHeader.className = 'section-header';
        const resultsTitle = document.createElement('h2');
        resultsTitle.id = 'search-results-title';
        resultsHeader.appendChild(resultsTitle);

        const resultsGrid = document.createElement('div');
        resultsGrid.className = 'product-grid';
        resultsGrid.id = 'grid-search';
        resultsGrid.setAttribute('role', 'list');

        const noResults = document.createElement('p');
        noResults.className = 'search-no-results';
        noResults.hidden = true;

        resultsSection.appendChild(resultsHeader);
        resultsSection.appendChild(resultsGrid);
        resultsSection.appendChild(noResults);
        catalogSection.after(resultsSection);

        function performSearch(query) {
            if (!query) { clearSearch(); return; }
            const q = query.toLowerCase();
            const filtered = Array.from(window.PRODUCTS).filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
            );
            catalogSection.hidden = true;
            resultsSection.hidden = false;
            if (filtered.length > 0) {
                const n = filtered.length;
                resultsTitle.textContent = `${n} resultado${n !== 1 ? 's' : ''} para "${query}"`;
                window.renderProductGrid('grid-search', filtered);
                resultsGrid.hidden = false;
                noResults.hidden = true;
            } else {
                resultsTitle.textContent = `Sin resultados para "${query}"`;
                resultsGrid.hidden = true;
                noResults.textContent = `No encontramos productos para "${query}". Intenta con otro término.`;
                noResults.hidden = false;
            }
        }

        function clearSearch() {
            input.value = '';
            catalogSection.hidden = false;
            resultsSection.hidden = true;
        }

        let debounceTimer;
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => performSearch(input.value.trim()), 200);
        });
        input.addEventListener('keydown', (e) => { if (e.key === 'Escape') clearSearch(); });

        window.Search = Object.freeze({ clear: clearSearch });
    }

    function pulseCartIcon() {
        const cart = document.getElementById('btn-cart-toggle');
        if (!cart) return;
        cart.style.transform = 'scale(1.15)';
        cart.style.transition = 'transform 0.2s';
        setTimeout(() => { cart.style.transform = ''; }, 200);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
