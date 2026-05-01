/**
 * products.js — Catálogo de productos.
 * En una app real estos datos vendrían de una API.
 * El id es alfanumérico fijo (no autoincrement) para que sea un identificador estable.
 */

window.PRODUCTS = Object.freeze([
    /* ── CAMISETAS ── */
    { id: 'cam-001', category: 'camisetas',  name: 'Camiseta Pro Run',       description: 'Tejido transpirable, costuras planas. Ideal para running de alta intensidad.',    price: 24990, image: 'img/camiseta-1.jpg' },
    { id: 'cam-002', category: 'camisetas',  name: 'Camiseta Gym Flex',      description: 'Algodón con elastano, ajuste atlético. Perfecta para entrenamientos de fuerza.',  price: 19990, image: 'img/camiseta-2.jpg' },
    { id: 'cam-003', category: 'camisetas',  name: 'Camiseta Trail Tech',    description: 'Secado rápido y protección UV 50+. Para deportes outdoor exigentes.',            price: 28990, image: 'img/camiseta-3.jpg' },

    /* ── PANTALONES ── */
    { id: 'pan-001', category: 'pantalones', name: 'Pantalón Jogger Urban',  description: 'Corte slim con bolsillos laterales. Estilo urbano para entrenar y salir.',       price: 32990, image: 'img/pantalon-1.jpg' },
    { id: 'pan-002', category: 'pantalones', name: 'Calza Compresión Power', description: 'Compresión muscular graduada. Mejora rendimiento y recuperación.',                price: 27990, image: 'img/pantalon-2.jpg' },
    { id: 'pan-003', category: 'pantalones', name: 'Short Training Air',     description: 'Liviano, con pretina elástica. Máxima libertad de movimiento.',                   price: 18990, image: 'img/pantalon-3.jpg' },

    /* ── ACCESORIOS ── */
    { id: 'acc-001', category: 'accesorios', name: 'Botella Hydro 750ml',    description: 'Acero inoxidable, libre de BPA. Mantiene tu bebida fría 24h.',                   price: 14990, image: 'img/accesorio-1.jpg' },
    { id: 'acc-002', category: 'accesorios', name: 'Mochila Pro Sport 25L',  description: 'Compartimento para zapatillas y porta-laptop 15". Ideal para gimnasio.',         price: 39990, image: 'img/accesorio-2.jpg' },
    { id: 'acc-003', category: 'accesorios', name: 'Banda Resistencia Set',  description: 'Set de 5 bandas de distinta resistencia. Entrena en cualquier lugar.',           price: 12990, image: 'img/accesorio-3.jpg' }
]);

window.getProductsByCategory = function (category) {
    return window.PRODUCTS.filter(p => p.category === category);
};

window.findProductById = function (id) {
    if (typeof id !== 'string') return null;
    return window.PRODUCTS.find(p => p.id === id) || null;
};

window.formatPrice = function (amount) {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) return APP_CONFIG.currencySymbol + '0';
    return new Intl.NumberFormat(APP_CONFIG.locale, {
        style: 'currency', currency: APP_CONFIG.currency, maximumFractionDigits: 0
    }).format(amount);
};

const CATEGORY_LABELS = Object.freeze({
    camisetas:  'Camiseta deportiva',
    pantalones: 'Pantalón deportivo',
    accesorios: 'Accesorio deportivo'
});

window.renderProductGrid = function (containerId, products) {
    const container = document.getElementById(containerId);
    if (!container) { Security.logger.warn('Container no encontrado', containerId); return; }

    container.replaceChildren();

    products.forEach(product => {
        const card = document.createElement('article');
        card.className = 'product-card';
        card.setAttribute('role', 'listitem');
        card.dataset.productId = product.id;

        const imgWrap = document.createElement('div');
        imgWrap.className = 'product-img-wrap';

        const img = document.createElement('img');
        img.src = product.image; img.alt = product.name;
        img.loading = 'lazy'; img.width = 400; img.height = 400;
        img.onerror = function () {
            const placeholder = document.createElement('div');
            placeholder.className = 'product-placeholder';
            placeholder.textContent = product.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            this.replaceWith(placeholder);
        };
        imgWrap.appendChild(img);

        const svgNS = 'http://www.w3.org/2000/svg';
        const wishlistBtn = document.createElement('button');
        wishlistBtn.type = 'button'; wishlistBtn.className = 'btn-wishlist';
        wishlistBtn.setAttribute('aria-label', `Guardar ${product.name} en favoritos`);
        const heartSvg = document.createElementNS(svgNS, 'svg');
        heartSvg.setAttribute('viewBox', '0 0 24 24'); heartSvg.setAttribute('width', '20'); heartSvg.setAttribute('height', '20');
        heartSvg.setAttribute('fill', 'none'); heartSvg.setAttribute('stroke', 'currentColor');
        heartSvg.setAttribute('stroke-width', '1.5'); heartSvg.setAttribute('stroke-linecap', 'round');
        heartSvg.setAttribute('stroke-linejoin', 'round'); heartSvg.setAttribute('aria-hidden', 'true');
        const heartPath = document.createElementNS(svgNS, 'path');
        heartPath.setAttribute('d', 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z');
        heartSvg.appendChild(heartPath); wishlistBtn.appendChild(heartSvg); imgWrap.appendChild(wishlistBtn);

        const info = document.createElement('div'); info.className = 'product-info';
        const name = document.createElement('h4'); name.className = 'product-name'; name.textContent = product.name;
        const categoryLabel = document.createElement('p'); categoryLabel.className = 'product-category-label';
        categoryLabel.textContent = CATEGORY_LABELS[product.category] || product.category;
        const desc = document.createElement('p'); desc.className = 'product-desc'; desc.textContent = product.description;

        const footer = document.createElement('div'); footer.className = 'product-footer';
        const price = document.createElement('span'); price.className = 'product-price'; price.textContent = window.formatPrice(product.price);
        const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn-add';
        btn.textContent = 'Agregar al carrito';
        btn.setAttribute('aria-label', `Agregar ${product.name} al carrito`);
        btn.dataset.action = 'add-to-cart'; btn.dataset.productId = product.id;

        footer.appendChild(price); footer.appendChild(btn);
        info.appendChild(name); info.appendChild(categoryLabel); info.appendChild(desc); info.appendChild(footer);
        card.appendChild(imgWrap); card.appendChild(info);
        container.appendChild(card);
    });
};
