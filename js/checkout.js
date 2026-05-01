/**
 * checkout.js — Formulario de pago y confirmación.
 *
 * Validación en dos capas: HTML5 nativo (atributos) + JavaScript (este módulo).
 * En una arquitectura real existiría una tercera capa en el servidor, que es
 * la única que no puede saltarse. Aquí se simula la confirmación por ser frontend puro.
 */

(function () {
    'use strict';

    // Declarativo: agregar un campo solo requiere extender este array
    const FIELDS = [
        { id: 'nombre',    validator: () => Security.validateName(document.getElementById('nombre').value),       errorId: 'err-nombre' },
        { id: 'email',     validator: () => Security.validateEmail(document.getElementById('email').value),       errorId: 'err-email' },
        { id: 'telefono',  validator: () => Security.validatePhone(document.getElementById('telefono').value),    errorId: 'err-telefono' },
        { id: 'direccion', validator: () => Security.validateAddress(document.getElementById('direccion').value), errorId: 'err-direccion' }
    ];

    function showFieldError(field, message) {
        const input = document.getElementById(field.id);
        const errEl = document.getElementById(field.errorId);
        if (!input || !errEl) return;
        if (message) {
            input.classList.add('invalid');
            input.setAttribute('aria-invalid', 'true');
            errEl.textContent = message; // textContent evita XSS
        } else {
            input.classList.remove('invalid');
            input.removeAttribute('aria-invalid');
            errEl.textContent = '';
        }
    }

    function validateSingleField(field) {
        const result = field.validator();
        showFieldError(field, result.valid ? '' : result.msg);
        return result;
    }

    function validateForm() {
        const data = {};
        let allValid = true;
        for (const field of FIELDS) {
            const result = validateSingleField(field);
            if (!result.valid) allValid = false;
            else data[field.id] = result.value;
        }
        return { valid: allValid, data };
    }

    function showGlobalError(msg) {
        const banner = document.getElementById('form-global-error');
        if (!banner) return;
        banner.textContent = msg;
        banner.hidden = !msg;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        showGlobalError('');

        if (!window.AuthModule.isAuthenticated()) {
            showGlobalError('Debes iniciar sesión para completar la compra.');
            return;
        }

        const cart = window.Cart.getSnapshot();
        if (cart.items.length === 0) { showGlobalError('Tu carrito está vacío.'); return; }

        const { valid, data } = validateForm();
        if (!valid) { showGlobalError('Revisa los campos marcados en rojo.'); return; }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Procesando...'; }

        try {
            await new Promise(resolve => setTimeout(resolve, 600)); // simula llamada al backend
            renderConfirmation(data, cart);
            window.Cart.clear();

            document.getElementById('checkout').hidden    = true;
            document.getElementById('productos').hidden   = true;
            document.getElementById('confirmation').hidden = false;
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err) {
            Security.logger.error('Procesamiento de compra falló', err);
            showGlobalError('Ocurrió un error procesando tu compra. Intenta de nuevo.');
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Confirmar compra'; }
        }
    }

    function renderConfirmation(formData, cartSnapshot) {
        const nameEl = document.getElementById('confirm-name');
        const detail = document.getElementById('confirm-detail');
        if (!nameEl || !detail) return;

        nameEl.textContent = `${formData.nombre}, gracias por confiar en SportyStyle.`;
        detail.replaceChildren();

        cartSnapshot.items.forEach(item => {
            const row   = document.createElement('div');
            row.className = 'confirm-detail-item';
            const left  = document.createElement('span');
            left.textContent = `${item.name} × ${item.qty}`;
            const right = document.createElement('span');
            right.textContent = window.formatPrice(item.price * item.qty);
            row.appendChild(left); row.appendChild(right);
            detail.appendChild(row);
        });

        const totalRow    = document.createElement('div');
        totalRow.className = 'confirm-detail-item total';
        const totalLabel  = document.createElement('span');
        totalLabel.textContent = 'Total';
        const totalAmount = document.createElement('strong');
        totalAmount.textContent = window.formatPrice(cartSnapshot.total);
        totalRow.appendChild(totalLabel); totalRow.appendChild(totalAmount);
        detail.appendChild(totalRow);

        const shipRow   = document.createElement('div');
        shipRow.className = 'confirm-detail-item';
        const shipLabel = document.createElement('span');
        shipLabel.textContent = 'Enviar a';
        const shipValue = document.createElement('span');
        shipValue.textContent = formData.direccion;
        shipRow.appendChild(shipLabel); shipRow.appendChild(shipValue);
        detail.appendChild(shipRow);
    }

    function init() {
        const form = document.getElementById('form-checkout');
        if (!form) return;

        form.addEventListener('submit', handleSubmit);

        // Validación on-blur por campo (feedback inmediato al usuario)
        FIELDS.forEach(field => {
            const input = document.getElementById(field.id);
            if (!input) return;
            input.addEventListener('blur', () => validateSingleField(field));
            input.addEventListener('input', () => {
                if (input.classList.contains('invalid')) showFieldError(field, '');
            });
        });

        const back = document.getElementById('btn-back-shop');
        if (back) {
            back.addEventListener('click', () => {
                document.getElementById('checkout').hidden = true;
                if (window.Search) window.Search.clear();
                document.getElementById('productos').hidden = false;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        const newOrder = document.getElementById('btn-new-order');
        if (newOrder) {
            newOrder.addEventListener('click', () => {
                document.getElementById('confirmation').hidden = true;
                if (window.Search) window.Search.clear();
                document.getElementById('productos').hidden = false;
                form.reset();
                FIELDS.forEach(f => showFieldError(f, ''));
                showGlobalError('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    window.CheckoutModule = Object.freeze({ init });
})();
