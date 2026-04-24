/**
 * ====================================================================
 * checkout.js — Formulario de pago y confirmación
 * ====================================================================
 *
 * VALIDACIÓN EN CAPAS (atendiendo a la observación de la profesora
 * sobre validar solo en cliente: aclaramos por qué y qué se hace):
 *
 *  1. Capa HTML5 nativa (atributos `required`, `pattern`, `type`):
 *     defensa de UX y validación temprana del navegador.
 *
 *  2. Capa JavaScript (este módulo): validación semántica robusta
 *     con mensajes específicos por campo.
 *
 *  3. Capa de sanitización (security.js): toda entrada se limpia
 *     antes de procesarse o renderizarse.
 *
 *  4. Comentario didáctico: en una arquitectura completa existiría
 *     una CUARTA capa en el servidor (Node/Django/etc.) que es la
 *     única que NUNCA debe omitirse. La validación cliente puede
 *     ser saltada con DevTools, por lo tanto el servidor es la
 *     autoridad final. Esta app es 100% front-end por requerimiento
 *     de la actividad, pero el código está estructurado para que
 *     reemplazar la confirmación local por una llamada a API sea
 *     trivial.
 *
 * MANEJO DE ERRORES:
 *  Cada validación retorna {valid, msg} y los errores se muestran
 *  inline. Errores globales (ej. carrito vacío, no autenticado) van
 *  al banner del formulario.
 * ====================================================================
 */

(function () {
    'use strict';

    /**
     * Mapea cada input a su validador. Estructura declarativa que
     * facilita agregar campos sin tocar la lógica del submit.
     */
    const FIELDS = [
        { id: 'nombre',    validator: () => Security.validateName(document.getElementById('nombre').value),       errorId: 'err-nombre' },
        { id: 'email',     validator: () => Security.validateEmail(document.getElementById('email').value),       errorId: 'err-email' },
        { id: 'telefono',  validator: () => Security.validatePhone(document.getElementById('telefono').value),    errorId: 'err-telefono' },
        { id: 'direccion', validator: () => Security.validateAddress(document.getElementById('direccion').value), errorId: 'err-direccion' }
    ];

    /**
     * Muestra/oculta error inline para un campo.
     */
    function showFieldError(field, message) {
        const input = document.getElementById(field.id);
        const errEl = document.getElementById(field.errorId);
        if (!input || !errEl) return;

        if (message) {
            input.classList.add('invalid');
            input.setAttribute('aria-invalid', 'true');
            errEl.textContent = message; // ← textContent (anti-XSS)
        } else {
            input.classList.remove('invalid');
            input.removeAttribute('aria-invalid');
            errEl.textContent = '';
        }
    }

    /**
     * Valida un solo campo (usado para validación on-blur).
     */
    function validateSingleField(field) {
        const result = field.validator();
        showFieldError(field, result.valid ? '' : result.msg);
        return result;
    }

    /**
     * Valida todo el formulario y retorna {valid, data, errors}.
     */
    function validateForm() {
        const data = {};
        let allValid = true;

        for (const field of FIELDS) {
            const result = validateSingleField(field);
            if (!result.valid) {
                allValid = false;
            } else {
                data[field.id] = result.value;
            }
        }
        return { valid: allValid, data };
    }

    /**
     * Muestra error global (banner rojo bajo el form).
     */
    function showGlobalError(msg) {
        const banner = document.getElementById('form-global-error');
        if (!banner) return;
        if (msg) {
            banner.textContent = msg;
            banner.hidden = false;
        } else {
            banner.textContent = '';
            banner.hidden = true;
        }
    }

    /**
     * Maneja el submit del formulario.
     * Bloquea el envío múltiple, valida, y al éxito muestra confirmación.
     */
    async function handleSubmit(e) {
        e.preventDefault();
        showGlobalError('');

        // Pre-condiciones de negocio
        if (!window.AuthModule.isAuthenticated()) {
            showGlobalError('Debes iniciar sesión para completar la compra.');
            return;
        }

        const cart = window.Cart.getSnapshot();
        if (cart.items.length === 0) {
            showGlobalError('Tu carrito está vacío.');
            return;
        }

        // Validación de campos
        const { valid, data } = validateForm();
        if (!valid) {
            showGlobalError('Revisa los campos marcados en rojo.');
            return;
        }

        // Estado de "procesando" para evitar doble-submit
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Procesando...';
        }

        try {
            // Aquí iría la llamada al backend o a Transbank/ShipIt.
            // Para esta actividad simulamos un procesamiento exitoso.
            await new Promise(resolve => setTimeout(resolve, 600));

            renderConfirmation(data, cart);
            // Limpiar carrito tras compra exitosa
            window.Cart.clear();

            // Cambiar de vista
            document.getElementById('checkout').hidden = true;
            document.getElementById('productos').hidden = true;
            document.getElementById('confirmation').hidden = false;

            // Scroll al inicio
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err) {
            Security.logger.error('Procesamiento de compra falló', err);
            showGlobalError('Ocurrió un error procesando tu compra. Intenta de nuevo.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Confirmar compra';
            }
        }
    }

    /**
     * Renderiza la pantalla de confirmación con los datos del pedido.
     * Usa textContent / createElement para evitar XSS.
     */
    function renderConfirmation(formData, cartSnapshot) {
        const nameEl = document.getElementById('confirm-name');
        const detail = document.getElementById('confirm-detail');
        if (!nameEl || !detail) return;

        nameEl.textContent = `${formData.nombre}, gracias por confiar en SportyStyle.`;

        detail.replaceChildren();

        cartSnapshot.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'confirm-detail-item';

            const left = document.createElement('span');
            left.textContent = `${item.name} × ${item.qty}`;

            const right = document.createElement('span');
            right.textContent = window.formatPrice(item.price * item.qty);

            row.appendChild(left);
            row.appendChild(right);
            detail.appendChild(row);
        });

        // Total
        const totalRow = document.createElement('div');
        totalRow.className = 'confirm-detail-item total';
        const totalLabel = document.createElement('span');
        totalLabel.textContent = 'Total';
        const totalAmount = document.createElement('strong');
        totalAmount.textContent = window.formatPrice(cartSnapshot.total);
        totalRow.appendChild(totalLabel);
        totalRow.appendChild(totalAmount);
        detail.appendChild(totalRow);

        // Datos de despacho
        const shipRow = document.createElement('div');
        shipRow.className = 'confirm-detail-item';
        const shipLabel = document.createElement('span');
        shipLabel.textContent = 'Enviar a';
        const shipValue = document.createElement('span');
        shipValue.textContent = formData.direccion;
        shipRow.appendChild(shipLabel);
        shipRow.appendChild(shipValue);
        detail.appendChild(shipRow);
    }

    /**
     * Inicializa listeners del formulario.
     * Validación on-blur por campo + submit del form.
     */
    function init() {
        const form = document.getElementById('form-checkout');
        if (!form) return;

        form.addEventListener('submit', handleSubmit);

        // Validación on-blur por campo (UX inmediata)
        FIELDS.forEach(field => {
            const input = document.getElementById(field.id);
            if (!input) return;
            input.addEventListener('blur', () => validateSingleField(field));
            // Limpiar error al empezar a corregir
            input.addEventListener('input', () => {
                if (input.classList.contains('invalid')) {
                    showFieldError(field, '');
                }
            });
        });

        // Botón de volver a la tienda desde checkout
        const back = document.getElementById('btn-back-shop');
        if (back) {
            back.addEventListener('click', () => {
                document.getElementById('checkout').hidden = true;
                document.getElementById('productos').hidden = false;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // Botón de nueva compra desde confirmación
        const newOrder = document.getElementById('btn-new-order');
        if (newOrder) {
            newOrder.addEventListener('click', () => {
                document.getElementById('confirmation').hidden = true;
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
