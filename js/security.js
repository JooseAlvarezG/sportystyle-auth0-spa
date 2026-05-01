/**
 * security.js — Funciones defensivas centralizadas (OWASP Top 10).
 * Toda entrada de usuario o de Session Storage se trata como no confiable.
 */

(function () {
    'use strict';

    // Escapa caracteres HTML peligrosos para usar cuando no se puede evitar innerHTML
    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/`/g, '&#096;')
            .replace(/\//g, '&#x2F;');
    }

    function sanitizeInput(str) {
        if (typeof str !== 'string') return '';
        return str.trim().replace(/\s+/g, ' ').slice(0, 500);
    }

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

    function validateName(name) {
        const cleaned = sanitizeInput(name);
        const v = APP_CONFIG.validation;
        if (!cleaned) return { valid: false, msg: 'El nombre es obligatorio.' };
        if (cleaned.length < v.nameMinLen) return { valid: false, msg: `Mínimo ${v.nameMinLen} caracteres.` };
        if (cleaned.length > v.nameMaxLen) return { valid: false, msg: `Máximo ${v.nameMaxLen} caracteres.` };
        if (!v.namePattern.test(cleaned)) return { valid: false, msg: 'Solo letras y espacios.' };
        return { valid: true, value: cleaned };
    }

    function validatePhone(phone) {
        const cleaned = sanitizeInput(phone).replace(/\s+/g, '');
        if (!cleaned) return { valid: false, msg: 'El teléfono es obligatorio.' };
        if (!/^\d+$/.test(cleaned)) return { valid: false, msg: 'Solo se permiten dígitos numéricos.' };
        if (!APP_CONFIG.validation.phonePattern.test(cleaned)) {
            return { valid: false, msg: 'Debe tener entre 8 y 12 dígitos.' };
        }
        return { valid: true, value: cleaned };
    }

    function validateAddress(addr) {
        const cleaned = sanitizeInput(addr);
        const v = APP_CONFIG.validation;
        if (!cleaned) return { valid: false, msg: 'La dirección es obligatoria.' };
        if (cleaned.length < v.addressMinLen) return { valid: false, msg: `Mínimo ${v.addressMinLen} caracteres.` };
        if (cleaned.length > v.addressMaxLen) return { valid: false, msg: `Máximo ${v.addressMaxLen} caracteres.` };
        if (!v.addressPattern.test(cleaned)) return { valid: false, msg: 'Contiene caracteres no permitidos.' };
        return { valid: true, value: cleaned };
    }

    // Verifica que un item del carrito tenga la forma esperada antes de usarlo
    function isValidCartItem(item) {
        if (!item || typeof item !== 'object') return false;
        if (typeof item.id !== 'string' || !item.id) return false;
        if (typeof item.name !== 'string' || !item.name) return false;
        if (typeof item.price !== 'number' || item.price < 0 || !Number.isFinite(item.price)) return false;
        if (typeof item.qty !== 'number' || item.qty < 1 || item.qty > APP_CONFIG.validation.maxQtyPerItem) return false;
        if (typeof item.category !== 'string') return false;
        return true;
    }

    const logger = {
        info:  (msg, ctx) => console.info('[INFO]',  msg, ctx ?? ''),
        warn:  (msg, ctx) => console.warn('[WARN]',  msg, ctx ?? ''),
        error: (msg, ctx) => console.error('[ERROR]', msg, ctx ?? '')
    };

    // Wrapper para Session Storage: maneja cuota llena, modo privado y datos corruptos
    const safeStorage = {
        get(key) {
            try {
                const raw = sessionStorage.getItem(key);
                return raw ? JSON.parse(raw) : null;
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
            try { sessionStorage.removeItem(key); return true; }
            catch (err) { logger.error('Session Storage REMOVE falló', { key, err: err.message }); return false; }
        },
        clear() {
            try { sessionStorage.clear(); return true; }
            catch (err) { logger.error('Session Storage CLEAR falló', { err: err.message }); return false; }
        }
    };

    function toast(message, type = 'info', durationMs = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const el = document.createElement('div');
        el.className = 'toast ' + (type === 'error' ? 'error' : type === 'success' ? 'success' : '');
        el.textContent = message; // textContent evita XSS
        container.appendChild(el);
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.3s';
            setTimeout(() => el.remove(), 300);
        }, durationMs);
    }

    window.Security = Object.freeze({
        escapeHTML, sanitizeInput,
        validateEmail, validateName, validatePhone, validateAddress,
        isValidCartItem, safeStorage, logger, toast
    });
})();
