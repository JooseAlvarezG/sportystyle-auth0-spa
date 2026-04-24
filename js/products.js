/**
 * ====================================================================
 * products.js — Catálogo de productos
 * ====================================================================
 *
 * Data estática del catálogo. En una app real vendría de una API.
 *
 * Decisión: el `id` es alfanumérico fijo (no autoincrement) para que
 * sirva como identificador estable aún si cambia el orden del array.
 *
 * Las imágenes se referencian por ruta relativa a `img/`. Si el
 * archivo no existe, el card mostrará un placeholder (ver render).
 * ====================================================================
 */

window.PRODUCTS = Object.freeze([
    /* -------------------- CAMISETAS DEPORTIVAS -------------------- */
    {
        id: 'cam-001',
        category: 'camisetas',
        name: 'Camiseta Pro Run',
        description: 'Tejido transpirable, costuras planas. Ideal para running de alta intensidad.',
        price: 24990,
        image: 'img/camiseta-1.jpg'
    },
    {
        id: 'cam-002',
        category: 'camisetas',
        name: 'Camiseta Gym Flex',
        description: 'Algodón con elastano, ajuste atlético. Perfecta para entrenamientos de fuerza.',
        price: 19990,
        image: 'img/camiseta-2.jpg'
    },
    {
        id: 'cam-003',
        category: 'camisetas',
        name: 'Camiseta Trail Tech',
        description: 'Secado rápido y protección UV 50+. Para deportes outdoor exigentes.',
        price: 28990,
        image: 'img/camiseta-3.jpg'
    },

    /* -------------------- PANTALONES DEPORTIVOS -------------------- */
    {
        id: 'pan-001',
        category: 'pantalones',
        name: 'Pantalón Jogger Urban',
        description: 'Corte slim con bolsillos laterales. Estilo urbano para entrenar y salir.',
        price: 32990,
        image: 'img/pantalon-1.jpg'
    },
    {
        id: 'pan-002',
        category: 'pantalones',
        name: 'Calza Compresión Power',
        description: 'Compresión muscular graduada. Mejora rendimiento y recuperación.',
        price: 27990,
        image: 'img/pantalon-2.jpg'
    },
    {
        id: 'pan-003',
        category: 'pantalones',
        name: 'Short Training Air',
        description: 'Liviano, con pretina elástica. Máxima libertad de movimiento.',
        price: 18990,
        image: 'img/pantalon-3.jpg'
    },

    /* -------------------- ACCESORIOS DE DEPORTE -------------------- */
    {
        id: 'acc-001',
        category: 'accesorios',
        name: 'Botella Hydro 750ml',
        description: 'Acero inoxidable, libre de BPA. Mantiene tu bebida fría 24h.',
        price: 14990,
        image: 'img/accesorio-1.jpg'
    },
    {
        id: 'acc-002',
        category: 'accesorios',
        name: 'Mochila Pro Sport 25L',
        description: 'Compartimento para zapatillas y porta-laptop 15". Ideal para gimnasio.',
        price: 39990,
        image: 'img/accesorio-2.jpg'
    },
    {
        id: 'acc-003',
        category: 'accesorios',
        name: 'Banda Resistencia Set',
        description: 'Set de 5 bandas de distinta resistencia. Entrena en cualquier lugar.',
        price: 12990,
        image: 'img/accesorio-3.jpg'
    }
]);

/**
 * Devuelve productos filtrados por categoría.
 */
window.getProductsByCategory = function (category) {
    return window.PRODUCTS.filter(p => p.category === category);
};

/**
 * Busca un producto por id. Retorna null si no existe.
 */
window.findProductById = function (id) {
    if (typeof id !== 'string') return null;
    return window.PRODUCTS.find(p => p.id === id) || null;
};

/**
 * Formatea un precio según el locale configurado.
 */
window.formatPrice = function (amount) {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
        return APP_CONFIG.currencySymbol + '0';
    }
    return new Intl.NumberFormat(APP_CONFIG.locale, {
        style: 'currency',
        currency: APP_CONFIG.currency,
        maximumFractionDigits: 0
    }).format(amount);
};

/**
 * Renderiza una grilla de productos en el contenedor dado.
 * Usa textContent y crea elementos con createElement para evitar
 * cualquier riesgo de XSS al insertar texto en el DOM.
 */
window.renderProductGrid = function (containerId, products) {
    const container = document.getElementById(containerId);
    if (!container) {
        Security.logger.warn('Container no encontrado', containerId);
        return;
    }

    // Limpiar antes de re-renderizar
    container.replaceChildren();

    products.forEach(product => {
        const card = document.createElement('article');
        card.className = 'product-card';
        card.setAttribute('role', 'listitem');
        card.dataset.productId = product.id;

        // Imagen (con placeholder si falla)
        const imgWrap = document.createElement('div');
        imgWrap.className = 'product-img-wrap';

        const img = document.createElement('img');
        img.src = product.image;
        img.alt = product.name; // alt text accesible
        img.loading = 'lazy';
        img.width = 400;
        img.height = 400;
        img.onerror = function () {
            // Si la imagen no carga, reemplaza por placeholder
            const placeholder = document.createElement('div');
            placeholder.className = 'product-placeholder';
            placeholder.textContent = product.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            this.replaceWith(placeholder);
        };
        imgWrap.appendChild(img);

        // Info
        const info = document.createElement('div');
        info.className = 'product-info';

        const name = document.createElement('h4');
        name.className = 'product-name';
        name.textContent = product.name; // ← textContent, no innerHTML

        const desc = document.createElement('p');
        desc.className = 'product-desc';
        desc.textContent = product.description;

        const footer = document.createElement('div');
        footer.className = 'product-footer';

        const price = document.createElement('span');
        price.className = 'product-price';
        price.textContent = window.formatPrice(product.price);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-add';
        btn.textContent = 'Agregar';
        btn.setAttribute('aria-label', `Agregar ${product.name} al carrito`);
        btn.dataset.action = 'add-to-cart';
        btn.dataset.productId = product.id;

        footer.appendChild(price);
        footer.appendChild(btn);

        info.appendChild(name);
        info.appendChild(desc);
        info.appendChild(footer);

        card.appendChild(imgWrap);
        card.appendChild(info);
        container.appendChild(card);
    });
};
