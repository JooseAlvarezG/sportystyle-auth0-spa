/**
 * ====================================================================
 * cart.js — Carrito de compras con Session Storage
 * ====================================================================
 *
 * El carrito se persiste en sessionStorage para sobrevivir a recargas
 * dentro de la misma pestaña, pero se borra al cerrar la pestaña o al
 * cerrar sesión (por diseño de la actividad).
 *
 * SEGURIDAD APLICADA:
 *  - Validación de integridad: cada item leído de Session Storage es
 *    verificado contra `Security.isValidCartItem`. Items corruptos o
 *    manipulados desde DevTools son descartados silenciosamente.
 *  - Reconciliación con catálogo: el precio NUNCA se confía del storage,
 *    siempre se relee del catálogo en memoria. Esto impide que un
 *    atacante modifique el precio en sessionStorage para pagar menos
 *    (defensa OWASP A04 — Insecure Design).
 *  - Tope defensivo: máximo de items y cantidad por item para evitar
 *    DoS por agotamiento del storage.
 *
 * EVENTOS:
 *  - Dispara `cart:changed` en `window` cada vez que el carrito muta.
 *    Otros módulos (UI del header, drawer, botón de checkout) escuchan
 *    este evento sin acoplarse directamente al carrito.
 * ====================================================================
 */

(function () {
    'use strict';

    const KEY = APP_CONFIG.storage.cartKey;

    /**
     * Lee el carrito de Session Storage y lo valida item por item.
     * Items inválidos se descartan; el carrito reconstruido se
     * persiste si hubo cambios para mantener integridad.
     */
    function readCart() {
        const raw = Security.safeStorage.get(KEY);
        if (!Array.isArray(raw)) return [];

        const valid = [];
        let mutated = false;

        for (const item of raw) {
            if (!Security.isValidCartItem(item)) {
                Security.logger.warn('Item de carrito inválido descartado', item);
                mutated = true;
                continue;
            }
            // Reconciliar precio con catálogo (fuente de verdad)
            const product = window.findProductById(item.id);
            if (!product) {
                // Item huérfano (producto ya no existe) → eliminar
                mutated = true;
                continue;
            }
            if (item.price !== product.price) {
                // Precio fue manipulado en storage → restaurar del catálogo
                Security.logger.warn('Precio manipulado, restaurando desde catálogo', { id: item.id });
                item.price = product.price;
                mutated = true;
            }
            valid.push(item);
        }

        if (mutated) {
            Security.safeStorage.set(KEY, valid);
        }
        return valid;
    }

    function writeCart(items) {
        const ok = Security.safeStorage.set(KEY, items);
        if (!ok) {
            Security.toast('No se pudo guardar el carrito.', 'error');
        }
        // Notificar a toda la app
        window.dispatchEvent(new CustomEvent('cart:changed', {
            detail: { items, total: calculateTotal(items), count: countItems(items) }
        }));
        return ok;
    }

    function calculateTotal(items) {
        return items.reduce((sum, it) => sum + (it.price * it.qty), 0);
    }

    function countItems(items) {
        return items.reduce((sum, it) => sum + it.qty, 0);
    }

    /**
     * Agrega un producto al carrito. Si ya existe, incrementa cantidad.
     */
    function addItem(productId) {
        const product = window.findProductById(productId);
        if (!product) {
            Security.toast('Producto no encontrado.', 'error');
            return false;
        }

        const items = readCart();

        // Tope defensivo
        if (items.length >= APP_CONFIG.validation.maxCartItems) {
            Security.toast('Has alcanzado el máximo de productos en el carrito.', 'error');
            return false;
        }

        const existing = items.find(it => it.id === productId);
        if (existing) {
            if (existing.qty >= APP_CONFIG.validation.maxQtyPerItem) {
                Security.toast('Cantidad máxima alcanzada para este producto.', 'error');
                return false;
            }
            existing.qty += 1;
        } else {
            items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                category: product.category,
                image: product.image,
                qty: 1
            });
        }

        writeCart(items);
        Security.toast(`${product.name} agregado al carrito.`, 'success', 2000);
        return true;
    }

    /**
     * Cambia la cantidad de un item. delta = +1 o -1 típicamente.
     * Si la cantidad llega a 0, el item se elimina.
     */
    function updateQty(productId, delta) {
        const items = readCart();
        const item = items.find(it => it.id === productId);
        if (!item) return false;

        const newQty = item.qty + delta;
        if (newQty <= 0) {
            return removeItem(productId);
        }
        if (newQty > APP_CONFIG.validation.maxQtyPerItem) {
            Security.toast('Cantidad máxima alcanzada.', 'error');
            return false;
        }
        item.qty = newQty;
        writeCart(items);
        return true;
    }

    function removeItem(productId) {
        const items = readCart().filter(it => it.id !== productId);
        writeCart(items);
        return true;
    }

    function clear() {
        Security.safeStorage.remove(KEY);
        window.dispatchEvent(new CustomEvent('cart:changed', {
            detail: { items: [], total: 0, count: 0 }
        }));
    }

    function getSnapshot() {
        const items = readCart();
        return {
            items,
            total: calculateTotal(items),
            count: countItems(items)
        };
    }

    // -------------------------------------------------------
    // RENDER del drawer del carrito
    // Reactivo: se re-renderiza cuando llega `cart:changed`
    // -------------------------------------------------------
    function renderCartDrawer() {
        const body = document.getElementById('cart-body');
        const totalEl = document.getElementById('cart-total');
        const countEl = document.getElementById('cart-count');
        const checkoutBtn = document.getElementById('btn-checkout');
        if (!body || !totalEl || !countEl) return;

        const { items, total, count } = getSnapshot();

        countEl.textContent = String(count);
        totalEl.textContent = window.formatPrice(total);

        body.replaceChildren();

        if (items.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'cart-empty';
            empty.textContent = 'Tu carrito está vacío.';
            body.appendChild(empty);
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'cart-item';
            row.dataset.productId = item.id;

            // Imagen
            const img = document.createElement('img');
            img.className = 'cart-item-img';
            img.src = item.image;
            img.alt = item.name;
            img.loading = 'lazy';
            img.onerror = function () {
                this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect width="60" height="60" fill="%231a2226"/></svg>';
            };

            // Info
            const info = document.createElement('div');
            info.className = 'cart-item-info';

            const name = document.createElement('div');
            name.className = 'cart-item-name';
            name.textContent = item.name;

            const price = document.createElement('div');
            price.className = 'cart-item-price';
            price.textContent = window.formatPrice(item.price * item.qty);

            const controls = document.createElement('div');
            controls.className = 'cart-item-controls';

            const minus = document.createElement('button');
            minus.type = 'button';
            minus.className = 'qty-btn';
            minus.textContent = '−';
            minus.setAttribute('aria-label', `Quitar uno de ${item.name}`);
            minus.dataset.action = 'qty-decrease';
            minus.dataset.productId = item.id;

            const qty = document.createElement('span');
            qty.className = 'qty-value';
            qty.textContent = String(item.qty);

            const plus = document.createElement('button');
            plus.type = 'button';
            plus.className = 'qty-btn';
            plus.textContent = '+';
            plus.setAttribute('aria-label', `Agregar uno de ${item.name}`);
            plus.dataset.action = 'qty-increase';
            plus.dataset.productId = item.id;

            controls.appendChild(minus);
            controls.appendChild(qty);
            controls.appendChild(plus);

            info.appendChild(name);
            info.appendChild(price);
            info.appendChild(controls);

            // Botón eliminar
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'cart-item-remove';
            removeBtn.textContent = '×';
            removeBtn.setAttribute('aria-label', `Eliminar ${item.name}`);
            removeBtn.dataset.action = 'remove-item';
            removeBtn.dataset.productId = item.id;

            row.appendChild(img);
            row.appendChild(info);
            row.appendChild(removeBtn);
            body.appendChild(row);
        });

        // Habilitar botón de pago solo si hay items Y usuario autenticado
        if (checkoutBtn) {
            const isAuth = window.AuthModule && window.AuthModule.isAuthenticated();
            checkoutBtn.disabled = !isAuth;
            const hint = document.getElementById('cart-auth-hint');
            if (hint) hint.style.display = isAuth ? 'none' : 'block';
        }
    }

    // Re-render automático ante cualquier cambio
    window.addEventListener('cart:changed', renderCartDrawer);
    // También re-render cuando cambia el estado de auth
    window.addEventListener('auth:changed', renderCartDrawer);

    // API pública
    window.Cart = Object.freeze({
        addItem,
        updateQty,
        removeItem,
        clear,
        getSnapshot,
        renderCartDrawer
    });
})();
