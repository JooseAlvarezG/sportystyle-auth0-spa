/**
 * ====================================================================
 * security.js — Módulo de seguridad
 * ====================================================================
 *
 * Funciones defensivas usadas por toda la app. Centralizar la lógica
 * de seguridad evita inconsistencias y facilita auditoría.
 *
 * COBERTURA OWASP TOP 10:
 *  - A03:2021 Injection / XSS  → sanitización de strings
 *  - A04:2021 Insecure Design  → validación defensiva de tipos
 *  - A08:2021 Software & Data Integrity → verificación del carrito
 *
 * Decisión de diseño: TODA entrada del usuario o de Session Storage
 * se trata como NO confiable y debe pasar por estas funciones antes
 * de tocar el DOM o la lógica de negocio.
 * ====================================================================
 */

(function () {
    'use strict';

    /**
     * Escapa caracteres HTML peligrosos para impedir inyección de
     * scripts cuando un string proviene de fuente no confiable.
     *
     * Por qué no `innerHTML`: usar innerHTML con datos no sanitizados
     * es la causa #1 de XSS reflejado/persistente. Esta función es la
     * última línea de defensa cuando NO se puede usar `textContent`.
     *
     * @param {string} str
     * @returns {string} string seguro para insertar como texto/HTML
     */
    function escapeHTML(str) {
        if (typeof str !== 'string') {
            return '';
        }
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/`/g, '&#096;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Limpia espacios y normaliza una entrada de usuario.
     * No elimina caracteres válidos, solo recorta y normaliza.
     */
    function sanitizeInput(str) {
        if (typeof str !== 'string') return '';
        return str.trim().replace(/\s+/g, ' ').slice(0, 500);
    }

    /**
     * Valida un email contra el patrón configurado.
     * Doble verificación: formato + longitud máxima.
     */
    function validateEmail(email) {
        const cleaned = sanitizeInput(email);
        if (!cleaned) return { valid: false, msg: 'El correo es obligatorio.' };
        if (cleaned.length > APP_CONFIG.validation.emailMaxLen) {
            return { valid: false, msg: 'El correo es demasiado largo.' };
        }
        if (!APP_CONFIG.validation.emailPattern.test(cleaned)) {
            return { valid: false, msg: 'Formato inválido. Ej: nombre@dominio.com' };
        }
        return { valid: true, value: cleaned };
    }

    /**
     * Valida nombre completo: solo letras y espacios, longitud razonable.
     */
    function validateName(name) {
        const cleaned = sanitizeInput(name);
        const v = APP_CONFIG.validation;
        if (!cleaned) return { valid: false, msg: 'El nombre es obligatorio.' };
        if (cleaned.length < v.nameMinLen) {
            return { valid: false, msg: `Mínimo ${v.nameMinLen} caracteres.` };
        }
        if (cleaned.length > v.nameMaxLen) {
            return { valid: false, msg: `Máximo ${v.nameMaxLen} caracteres.` };
        }
        if (!v.namePattern.test(cleaned)) {
            return { valid: false, msg: 'Solo letras y espacios.' };
        }
        return { valid: true, value: cleaned };
    }

    /**
     * Valida teléfono: solo dígitos, longitud entre 8 y 12.
     */
    function validatePhone(phone) {
        const cleaned = sanitizeInput(phone).replace(/\s+/g, '');
        if (!cleaned) return { valid: false, msg: 'El teléfono es obligatorio.' };
        if (!/^\d+$/.test(cleaned)) {
            return { valid: false, msg: 'Solo se permiten dígitos numéricos.' };
        }
        if (!APP_CONFIG.validation.phonePattern.test(cleaned)) {
            return { valid: false, msg: 'Debe tener entre 8 y 12 dígitos.' };
        }
        return { valid: true, value: cleaned };
    }

    /**
     * Valida dirección de envío.
     */
    function validateAddress(addr) {
        const cleaned = sanitizeInput(addr);
        const v = APP_CONFIG.validation;
        if (!cleaned) return { valid: false, msg: 'La dirección es obligatoria.' };
        if (cleaned.length < v.addressMinLen) {
            return { valid: false, msg: `Mínimo ${v.addressMinLen} caracteres.` };
        }
        if (cleaned.length > v.addressMaxLen) {
            return { valid: false, msg: `Máximo ${v.addressMaxLen} caracteres.` };
        }
        if (!v.addressPattern.test(cleaned)) {
            return { valid: false, msg: 'Contiene caracteres no permitidos.' };
        }
        return { valid: true, value: cleaned };
    }

    /**
     * Verifica que un objeto del carrito tenga la forma esperada.
     * Defensa contra manipulación de Session Storage por DevTools o
     * extensiones maliciosas (OWASP A08 — Data Integrity).
     */
    function isValidCartItem(item) {
        if (!item || typeof item !== 'object') return false;
        if (typeof item.id !== 'string' || !item.id) return false;
        if (typeof item.name !== 'string' || !item.name) return false;
        if (typeof item.price !== 'number' || item.price < 0 || !Number.isFinite(item.price)) return false;
        if (typeof item.qty !== 'number' || item.qty < 1 || item.qty > APP_CONFIG.validation.maxQtyPerItem) return false;
        if (typeof item.category !== 'string') return false;
        return true;
    }

    /**
     * Logger ligero. En producción enviaría a un servicio externo.
     * Aquí solo a consola, pero centralizado para poder cambiarlo.
     */
    const logger = {
        info:  (msg, ctx) => console.info('[INFO]',  msg, ctx ?? ''),
        warn:  (msg, ctx) => console.warn('[WARN]',  msg, ctx ?? ''),
        error: (msg, ctx) => console.error('[ERROR]', msg, ctx ?? '')
    };

    /**
     * Wrapper try/catch para Session Storage.
     * Maneja: cuota llena, modo privado, deshabilitado por usuario,
     * datos corruptos.
     */
    const safeStorage = {
        get(key) {
            try {
                const raw = sessionStorage.getItem(key);
                if (!raw) return null;
                return JSON.parse(raw);
            } catch (err) {
                logger.warn('Session Storage GET falló', { key, err: err.message });
                return null;
            }
        },
        set(key, value) {
            try {
                sessionStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (err) {
                logger.error('Session Storage SET falló', { key, err: err.message });
                return false;
            }
        },
        remove(key) {
            try {
                sessionStorage.removeItem(key);
                return true;
            } catch (err) {
                logger.error('Session Storage REMOVE falló', { key, err: err.message });
                return false;
            }
        },
        clear() {
            try {
                sessionStorage.clear();
                return true;
            } catch (err) {
                logger.error('Session Storage CLEAR falló', { err: err.message });
                return false;
            }
        }
    };

    /**
     * Toast notifications — feedback visual al usuario.
     * Usa textContent (no innerHTML) para evitar XSS.
     */
    function toast(message, type = 'info', durationMs = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const el = document.createElement('div');
        el.className = 'toast ' + (type === 'error' ? 'error' : type === 'success' ? 'success' : '');
        el.textContent = message; // ← sanitización implícita
        container.appendChild(el);

        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.3s';
            setTimeout(() => el.remove(), 300);
        }, durationMs);
    }

    // Exponer API pública
    window.Security = Object.freeze({
        escapeHTML,
        sanitizeInput,
        validateEmail,
        validateName,
        validatePhone,
        validateAddress,
        isValidCartItem,
        safeStorage,
        logger,
        toast
    });
})();
