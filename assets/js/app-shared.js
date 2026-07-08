// Global Cart and Wishlist state
let cart = JSON.parse(localStorage.getItem('lunaria_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('lunaria_wishlist') || '[]');

// Helper: find a product by its ID
function findProductById(id) {
    return perfumesData.find(p => p.id === id) || null;
}

// Brand logos for the "shop by brand" tiles. Add an entry here once a logo file exists in /Logos.
const brandLogos = {
    "Lattafa": "Logos/Lattafa.webp",
    "Armaf": "Logos/Armaf.webp",
    "Afnan": "Logos/Afnan.webp",
    "Rasasi": "Logos/Rasasi.webp",
    "Jean Paul Gaultier": "Logos/Jean_Paul_Gaultier.webp",
    "Yves Saint Laurent": "Logos/Yves_saint_laurent.webp",
    "Giorgio Armani": "Logos/Georgio_Armani.webp"
};

// Renders the brand-filter tiles for a catalog page (arabes.html / designer.html).
// `products` should already be scoped to that page's category.
function renderBrandFilterBar(containerId, products, activeBrand, onSelectFnName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const brandCounts = {};
    products.forEach(p => { brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1; });
    const brands = Object.keys(brandCounts).sort((a, b) => brandCounts[b] - brandCounts[a]);

    const allTile = `
        <div class="brand-tile ${activeBrand === 'Todos' ? 'active' : ''}" onclick="${onSelectFnName}('Todos')">
            <div class="brand-tile-logo-wrap brand-tile-all">Todas</div>
            <span class="brand-tile-name">Todas las marcas</span>
        </div>`;

    const brandTiles = brands.map(brand => {
        const logo = brandLogos[brand];
        const inner = logo
            ? `<img src="${logo}" alt="${brand}">`
            : `<span class="brand-tile-fallback">${brand.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>`;
        return `
        <div class="brand-tile ${activeBrand === brand ? 'active' : ''}" onclick="${onSelectFnName}('${brand}')">
            <div class="brand-tile-logo-wrap">${inner}</div>
            <span class="brand-tile-name">${brand}</span>
        </div>`;
    }).join('');

    container.innerHTML = allTile + brandTiles;
}

// DOM Elements
let cartCountEl;
let wishlistCountEl;
let cartDrawer;
let wishlistDrawer;
let searchOverlay;

// Initialize elements once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    cartCountEl      = document.getElementById('cart-count');
    wishlistCountEl  = document.getElementById('wishlist-count');
    cartDrawer       = document.getElementById('cart-drawer-overlay');
    wishlistDrawer   = document.getElementById('wishlist-drawer-overlay');
    searchOverlay    = document.getElementById('search-overlay');

    // Bind drawer buttons
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) cartBtn.addEventListener('click', () => openDrawer(cartDrawer));
    
    const cartCloseBtn = document.getElementById('cart-drawer-close');
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', () => closeDrawer(cartDrawer));
    
    if (cartDrawer) {
        cartDrawer.addEventListener('click', e => { if (e.target === cartDrawer) closeDrawer(cartDrawer); });
    }

    const wishlistBtn = document.getElementById('wishlist-btn');
    if (wishlistBtn) wishlistBtn.addEventListener('click', () => openDrawer(wishlistDrawer));
    
    const wishlistCloseBtn = document.getElementById('wishlist-drawer-close');
    if (wishlistCloseBtn) wishlistCloseBtn.addEventListener('click', () => closeDrawer(wishlistDrawer));
    
    if (wishlistDrawer) {
        wishlistDrawer.addEventListener('click', e => { if (e.target === wishlistDrawer) closeDrawer(wishlistDrawer); });
    }

    // Search overlay
    const searchClose = document.getElementById('search-close');
    if (searchClose && searchOverlay) {
        searchClose.addEventListener('click', () => searchOverlay.classList.remove('open'));
        searchOverlay.addEventListener('click', e => { if (e.target === searchOverlay) searchOverlay.classList.remove('open'); });
    }

    const hsi = document.getElementById('header-search-input');
    const hsb = document.getElementById('header-search-btn');
    if (hsb && hsi) {
        hsb.addEventListener('click', () => openSearch(hsi.value));
        hsi.addEventListener('keypress', e => { if (e.key === 'Enter') openSearch(hsi.value); });
    }

    const mobileSearchBtn = document.getElementById('mobile-search-btn');
    if (mobileSearchBtn) {
        mobileSearchBtn.addEventListener('click', () => openSearch());
    }

    // Dynamic search results container and styles injection
    const searchInpField = document.getElementById('search-input-field');
    if (searchInpField) {
        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'search-results-container';
        resultsContainer.className = 'search-results-container';
        
        const style = document.createElement('style');
        style.textContent = `
            .search-results-container {
                margin-top: 30px;
                max-height: 50vh;
                overflow-y: auto;
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding-right: 8px;
            }
            .search-results-container::-webkit-scrollbar {
                width: 6px;
            }
            .search-results-container::-webkit-scrollbar-thumb {
                background: var(--dorado);
                border-radius: 4px;
            }
            .search-item {
                display: flex;
                align-items: center;
                gap: 15px;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(201, 169, 110, 0.15);
                border-radius: 8px;
                padding: 10px 15px;
                transition: var(--ease);
                cursor: pointer;
                text-align: left;
            }
            .search-item:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: var(--dorado);
                transform: translateY(-1px);
            }
            .search-item-img {
                width: 50px;
                height: 50px;
                background: var(--blanco);
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                flex-shrink: 0;
            }
            .search-item-img img {
                max-width: 90%;
                max-height: 90%;
                object-fit: contain;
            }
            .search-item-info {
                flex-grow: 1;
            }
            .search-item-brand {
                font-size: 0.7rem;
                color: var(--dorado);
                text-transform: uppercase;
                letter-spacing: 1.2px;
                font-weight: 700;
            }
            .search-item-name {
                font-family: 'Cormorant Garamond', serif;
                font-size: 1.1rem;
                color: var(--blanco);
                font-weight: 500;
                margin: 1px 0;
            }
            .search-item-meta {
                font-size: 0.75rem;
                color: rgba(255, 255, 255, 0.4);
            }
            .search-item-price {
                font-size: 1rem;
                font-weight: 700;
                color: var(--blanco);
                flex-shrink: 0;
            }
            .search-no-results {
                color: rgba(255, 255, 255, 0.6);
                font-family: 'Cormorant Garamond', serif;
                font-size: 1.3rem;
                margin-top: 15px;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
        searchInpField.parentNode.appendChild(resultsContainer);

        searchInpField.addEventListener('input', (e) => {
            performSearch(e.target.value, resultsContainer);
        });
    }

    // Shipping form: restore saved values and keep them (and the payment button) in sync as the customer types
    const shippingFields = ['shipping-name', 'shipping-phone', 'shipping-address', 'shipping-city'];
    const savedShipping = JSON.parse(localStorage.getItem('lunaria_shipping') || '{}');
    shippingFields.forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;
        if (savedShipping[id]) input.value = savedShipping[id];
        input.addEventListener('input', () => {
            const data = JSON.parse(localStorage.getItem('lunaria_shipping') || '{}');
            data[id] = input.value;
            localStorage.setItem('lunaria_shipping', JSON.stringify(data));
            renderPayphoneButton(cart.reduce((s, x) => s + x.price, 0));
        });
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (cartDrawer) closeDrawer(cartDrawer);
            if (wishlistDrawer) closeDrawer(wishlistDrawer);
            if (searchOverlay) searchOverlay.classList.remove('open');
        }
    });

    const mmToggle = document.getElementById('mobile-menu-toggle');
    if (mmToggle) {
        mmToggle.addEventListener('click', openMobileDrawer);
    }

    // Run initial UI updates
    updateCart();
    updateWishlist();
});

function openDrawer(d) { if (d) { d.classList.add('open'); document.body.style.overflow = 'hidden'; } }
function closeDrawer(d) { if (d) { d.classList.remove('open'); document.body.style.overflow = ''; } }

function openSearch(q = '') {
    if (searchOverlay) {
        searchOverlay.classList.add('open');
        const inp = document.getElementById('search-input-field');
        if (inp) {
            inp.value = q;
            inp.focus();
            const resultsContainer = document.getElementById('search-results-container');
            if (resultsContainer) {
                performSearch(q, resultsContainer);
            }
        }
    }
}

function performSearch(query, container) {
    if (!container) return;
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
        container.innerHTML = '';
        return;
    }

    const results = perfumesData.filter(p => {
        const brandMatch = p.brand && p.brand.toLowerCase().includes(cleanQuery);
        const nameMatch = p.name && p.name.toLowerCase().includes(cleanQuery);
        const descMatch = p.description && p.description.toLowerCase().includes(cleanQuery);
        const typeMatch = p.type && p.type.toLowerCase().includes(cleanQuery);
        const genderMatch = p.gender && p.gender.toLowerCase().includes(cleanQuery);
        const notesMatch = p.notes && (
            (p.notes.top && p.notes.top.some(n => n.toLowerCase().includes(cleanQuery))) ||
            (p.notes.middle && p.notes.middle.some(n => n.toLowerCase().includes(cleanQuery))) ||
            (p.notes.base && p.notes.base.some(n => n.toLowerCase().includes(cleanQuery)))
        );
        
        return brandMatch || nameMatch || descMatch || typeMatch || genderMatch || notesMatch;
    });

    if (results.length === 0) {
        container.innerHTML = `<div class="search-no-results">No se encontraron fragancias para "${query}"</div>`;
        return;
    }

    const limitResults = results.slice(0, 15);

    container.innerHTML = limitResults.map(p => `
        <div class="search-item" onclick="window.location.href='producto.html?id=${p.id}'">
            <div class="search-item-img">
                <img src="${p.image}" alt="${p.name}" loading="lazy">
            </div>
            <div class="search-item-info">
                <div class="search-item-brand">${p.brand}</div>
                <h4 class="search-item-name">${p.name}</h4>
                <div class="search-item-meta">${p.gender} · ${p.size} · ${p.type}</div>
            </div>
            <div class="search-item-price">$${p.price.toFixed(2)}</div>
        </div>
    `).join('');
}

function getWhatsAppNumber() {
    // Dynamically retrieve the WhatsApp number from footer if possible, fallback to Ecuador placeholder
    const whatsappLinkEl = document.querySelector('a[href*="wa.me"]');
    let whatsappNumber = "593999999999";
    if (whatsappLinkEl) {
        const href = whatsappLinkEl.getAttribute('href');
        const match = href.match(/wa\.me\/([0-9]+)/);
        if (match && match[1]) {
            whatsappNumber = match[1];
        }
    }
    return whatsappNumber;
}


// Global actions
window.addToCart = function(id, selectedSize = null) {
    // Search in perfumesData (loaded from products-data.js)
    const p = perfumesData.find(x => x.id === id);
    if (p) {
        let itemToAdd = {...p}; // clone the product info
        if (selectedSize === 'muestra') {
            itemToAdd.name = p.name + " (Muestra)";
            itemToAdd.size = "Muestra 1ml (0.03 oz)";
            itemToAdd.price = 9.99;
            itemToAdd.id = p.id + "-muestra";
        }
        cart.push(itemToAdd);
        localStorage.setItem('lunaria_cart', JSON.stringify(cart));
        updateCart();
        openDrawer(cartDrawer);
    }
};

window.removeFromCart = function(i) {
    cart.splice(i, 1);
    localStorage.setItem('lunaria_cart', JSON.stringify(cart));
    updateCart();
};

window.toggleWishlist = function(id) {
    const i = wishlist.indexOf(id);
    if (i > -1) {
        wishlist.splice(i, 1);
    } else {
        wishlist.push(id);
    }
    localStorage.setItem('lunaria_wishlist', JSON.stringify(wishlist));
    updateWishlist();
    // Dispatch event to notify page scripts to re-render if they have custom wishlist states
    document.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: { wishlist } }));
};

// PayPhone - Cajita de Pagos (AMBIENTE DE PRUEBAS / SANDBOX).
// Estas transacciones se aprueban pero NUNCA tocan el sistema bancario real.
// Antes de cobrar de verdad hay que reemplazar PAYPHONE_TOKEN y PAYPHONE_STORE_ID
// por las credenciales del entorno de Producción en el panel de PayPhone.
const PAYPHONE_TOKEN = 'yRrL85E1d5cMuH-R0nB8YEOGWttKZj3W61y9ivU9kul5qIRu0BNopCYwlOv4dRvNvxm0AieXAAkLyw5p9ecIGQ3iIM-gMAZhABx8B19e2zJJG2nekigUUTYp65lIr9hOGo19nelKTeK7tp1Bi5S2_o_0htVOYf5yBGYjlBr9nC4savTSmXp97pGD2flObW_9j5Nn_3LbPHRtRQy2DVoF7TGmAmFYHwt4Dqvxlp47O_4i1oxv5sarEq-PYaWPhP0ui306cF0ZRgRflaGFjJ-EFgOoXLp6TxSmkkFzbS91uNElk_gT7hz7c09RLotWX32NozemVLPdsTpycoOHP7wMLo4NlvQ';
const PAYPHONE_STORE_ID = 'b27bc1b7-c044-490c-8716-31646c675050';

function getShippingInfo() {
    return JSON.parse(localStorage.getItem('lunaria_shipping') || '{}');
}

function isShippingInfoComplete(shipping) {
    return !!(shipping['shipping-name'] && shipping['shipping-phone'] && shipping['shipping-address'] && shipping['shipping-city']);
}

function renderPayphoneButton(total) {
    const ppContainer = document.getElementById('pp-button');
    if (!ppContainer) return;
    ppContainer.innerHTML = '';

    if (!total || total <= 0) return;

    const shipping = getShippingInfo();
    if (!isShippingInfoComplete(shipping)) {
        ppContainer.innerHTML = `<div class="pp-pay-hint">Completá tus datos de envío para pagar con tarjeta.</div>`;
        return;
    }

    if (typeof PPaymentButtonBox === 'undefined') return;

    const amountInCents = Math.round(total * 100);

    new PPaymentButtonBox({
        token: PAYPHONE_TOKEN,
        storeId: PAYPHONE_STORE_ID,
        amount: amountInCents,
        amountWithoutTax: amountInCents,
        amountWithTax: 0,
        tax: 0,
        service: 0,
        tip: 0,
        currency: 'USD',
        clientTransactionId: `LUNARIA-${Date.now()}`,
        reference: 'Compra en LUNARIA Perfumería',
        phoneNumber: shipping['shipping-phone'],
        lang: 'es',
        defaultMethod: 'card'
    }).render('pp-button');
}

function updateCart() {
    if (cartCountEl) cartCountEl.textContent = cart.length;
    const container = document.getElementById('cart-items-container');
    const totalEl   = document.getElementById('cart-total-price');
    if (!container) return;
    if (!cart.length) {
        container.innerHTML = `<p style="text-align:center;color:var(--texto-sec);margin-top:30px;">Tu bolsa está vacía.</p>`;
        if (totalEl) totalEl.textContent = "$0.00";
        renderPayphoneButton(0);
        return;
    }
    container.innerHTML = cart.map((item, i) => `
        <div class="drawer-item">
            <div class="drawer-item-img"><img src="${item.image}" alt="${item.name}" loading="lazy"></div>
            <div class="drawer-item-details">
                <div class="drawer-item-brand">${item.brand}</div>
                <h4 class="drawer-item-name">${item.name}</h4>
                <div class="drawer-item-price">$${item.price.toFixed(2)}</div>
                <button class="drawer-item-remove" onclick="removeFromCart(${i})">Eliminar</button>
            </div>
        </div>`).join('');
    const total = cart.reduce((s, x) => s + x.price, 0);
    if (totalEl) {
        totalEl.textContent = `$${total.toFixed(2)}`;
    }
    renderPayphoneButton(total);
}

function updateWishlist() {
    if (wishlistCountEl) wishlistCountEl.textContent = wishlist.length;
    const container = document.getElementById('wishlist-items-container');
    if (!container) return;
    if (!wishlist.length) {
        container.innerHTML = `<p style="text-align:center;color:var(--texto-sec);margin-top:30px;">No tienes favoritos aún.</p>`;
        return;
    }
    container.innerHTML = perfumesData.filter(p => wishlist.includes(p.id)).map(item => `
        <div class="drawer-item">
            <div class="drawer-item-img"><img src="${item.image}" alt="${item.name}" loading="lazy"></div>
            <div class="drawer-item-details">
                <div class="drawer-item-brand">${item.brand}</div>
                <h4 class="drawer-item-name">${item.name}</h4>
                <div class="drawer-item-price">$${item.price.toFixed(2)}</div>
                <button class="drawer-item-remove" style="color:var(--dorado);" onclick="addToCart('${item.id}');toggleWishlist('${item.id}');">Mover al Carrito</button>
            </div>
        </div>`).join('');
}

// Dynamic Modals for FAQ, Shipping Policy, Originality Guarantee, and Notify-Me
document.addEventListener('DOMContentLoaded', () => {
    // Setup Top-Bar Marquee
    const topBar = document.querySelector('.top-bar');
    if (topBar) {
        const originalContent = topBar.innerHTML;
        topBar.innerHTML = '';
        const track = document.createElement('div');
        track.className = 'top-bar-track';
        for (let i = 0; i < 4; i++) {
            const item = document.createElement('div');
            item.className = 'top-bar-item';
            item.innerHTML = originalContent;
            track.appendChild(item);
        }
        topBar.appendChild(track);
    }

    // Inject Modal HTML container at the end of body
    const modalHTML = `
    <div class="lunaria-modal-overlay" id="lunaria-info-modal">
        <div class="lunaria-modal-card">
            <button class="lunaria-modal-close" onclick="closeInfoModal()">&times;</button>
            <h3 class="lunaria-modal-title" id="lunaria-modal-title">Título del Modal</h3>
            <div class="lunaria-modal-body" id="lunaria-modal-body">
                Contenido del modal...
            </div>
        </div>
    </div>`;
    
    const div = document.createElement('div');
    div.innerHTML = modalHTML;
    document.body.appendChild(div.firstElementChild);

    // Inject Mobile Drawer HTML
    const drawerHTML = `
    <div class="mobile-drawer-overlay" id="mobile-drawer">
        <div class="mobile-drawer-card">
            <button class="mobile-drawer-close" id="mobile-drawer-close-btn">&times;</button>
            <div class="mobile-drawer-logo">LUNARIA<span>.</span></div>
            <nav class="mobile-drawer-nav">
                <a href="index.html" onclick="closeMobileDrawer()">Inicio</a>
                <a href="arabes.html" onclick="closeMobileDrawer()">Árabes</a>
                <a href="designer.html" onclick="closeMobileDrawer()">Diseñador</a>
                <a href="javascript:void(0)" onclick="openNotifyModal('Nicho'); closeMobileDrawer();">Nicho</a>
                <a href="javascript:void(0)" onclick="openNotifyModal('Frescos'); closeMobileDrawer();">Frescos</a>
            </nav>
            <div class="mobile-drawer-divider"></div>
            <div class="mobile-drawer-footer">
                <a href="javascript:void(0)" onclick="showInfoModal('faq'); closeMobileDrawer();">Preguntas Frecuentes</a>
                <a href="javascript:void(0)" onclick="showInfoModal('shipping'); closeMobileDrawer();">Políticas de Envío</a>
                <a href="javascript:void(0)" onclick="showInfoModal('originality'); closeMobileDrawer();">Garantía de Originalidad</a>
            </div>
        </div>
    </div>`;
    
    const drawerDiv = document.createElement('div');
    drawerDiv.innerHTML = drawerHTML;
    document.body.appendChild(drawerDiv.firstElementChild);

    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileDrawerClose = document.getElementById('mobile-drawer-close-btn');

    window.closeMobileDrawer = function() {
        if (mobileDrawer) {
            mobileDrawer.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    window.openMobileDrawer = function() {
        if (mobileDrawer) {
            mobileDrawer.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    };

    if (mobileDrawerClose) {
        mobileDrawerClose.addEventListener('click', closeMobileDrawer);
    }
    if (mobileDrawer) {
        mobileDrawer.addEventListener('click', e => {
            if (e.target === mobileDrawer) closeMobileDrawer();
        });
    }

    // Inject CSS styles for Modals and Marquee/Drawer
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
        /* Top Bar Marquee styles */
        .top-bar {
            overflow: hidden !important;
            width: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
            padding: 0 !important;
        }
        .top-bar-track {
            display: flex;
            align-items: center;
            width: max-content;
            animation: topbar-marquee 30s linear infinite;
        }
        .top-bar-item {
            display: flex;
            align-items: center;
            gap: 20px;
            padding-right: 40px;
            white-space: nowrap;
            font-size: 0.74rem;
            font-weight: 700;
            color: #fff;
            letter-spacing: 2.5px;
        }
        @keyframes topbar-marquee {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-25%, 0, 0); }
        }

        /* Mobile Drawer styles */
        .mobile-drawer-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .mobile-drawer-overlay.open {
            opacity: 1;
            visibility: visible;
        }
        .mobile-drawer-card {
            background: #14120f;
            border-right: 1px solid rgba(201, 169, 110, 0.2);
            width: 80%;
            max-width: 300px;
            height: 100%;
            padding: 40px 30px;
            box-shadow: 5px 0 25px rgba(0,0,0,0.5);
            position: relative;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            display: flex;
            flex-direction: column;
            text-align: left;
        }
        .mobile-drawer-overlay.open .mobile-drawer-card {
            transform: translateX(0);
        }
        .mobile-drawer-close {
            position: absolute;
            top: 20px;
            right: 20px;
            background: transparent;
            border: none;
            color: #c9a96e;
            font-size: 2rem;
            cursor: pointer;
            line-height: 1;
        }
        .mobile-drawer-logo {
            font-family: 'Cormorant Garamond', serif;
            font-size: 2.2rem;
            color: #fff;
            margin-bottom: 40px;
            letter-spacing: 4px;
        }
        .mobile-drawer-logo span {
            color: #c9a96e;
        }
        .mobile-drawer-nav {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .mobile-drawer-nav a {
            font-size: 1.1rem;
            color: rgba(255, 255, 255, 0.85);
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 700;
            transition: color 0.2s;
        }
        .mobile-drawer-nav a:hover {
            color: #c9a96e;
        }
        .mobile-drawer-divider {
            height: 1px;
            background: rgba(201, 169, 110, 0.15);
            margin: 30px 0;
        }
        .mobile-drawer-footer {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-top: auto;
        }
        .mobile-drawer-footer a {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.5);
            letter-spacing: 1px;
        }
        .mobile-drawer-footer a:hover {
            color: #c9a96e;
        }
        .lunaria-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .lunaria-modal-overlay.open {
            opacity: 1;
            visibility: visible;
        }
        .lunaria-modal-card {
            background: #14120f;
            border: 1px solid rgba(201, 169, 110, 0.3);
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            padding: 30px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.6);
            position: relative;
            transform: translateY(20px);
            transition: transform 0.3s ease;
            color: #f5f0e8;
            text-align: left;
        }
        .lunaria-modal-overlay.open .lunaria-modal-card {
            transform: translateY(0);
        }
        .lunaria-modal-close {
            position: absolute;
            top: 15px;
            right: 15px;
            background: transparent;
            border: none;
            color: #c9a96e;
            font-size: 1.8rem;
            cursor: pointer;
            line-height: 1;
            transition: color 0.2s ease;
        }
        .lunaria-modal-close:hover {
            color: #ffffff;
        }
        .lunaria-modal-title {
            font-family: 'Cormorant Garamond', serif;
            font-size: 1.8rem;
            color: #c9a96e;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(201, 169, 110, 0.15);
            padding-bottom: 10px;
        }
        .lunaria-modal-body {
            font-size: 0.95rem;
            line-height: 1.6;
            max-height: 60vh;
            overflow-y: auto;
        }
        .lunaria-modal-body::-webkit-scrollbar {
            width: 6px;
        }
        .lunaria-modal-body::-webkit-scrollbar-thumb {
            background: var(--dorado, #c9a96e);
            border-radius: 4px;
        }
        .lunaria-modal-body p {
            margin-bottom: 15px;
            color: rgba(245, 240, 232, 0.85);
        }
        .lunaria-modal-body h4 {
            color: #c9a96e;
            font-size: 1.1rem;
            margin-top: 20px;
            margin-bottom: 8px;
            font-family: 'Cormorant Garamond', serif;
            font-weight: 700;
        }
        .lunaria-form-group {
            margin-bottom: 15px;
        }
        .lunaria-form-group label {
            display: block;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #c9a96e;
            margin-bottom: 6px;
            font-weight: 700;
        }
        .lunaria-form-input {
            width: 100%;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(201, 169, 110, 0.2);
            border-radius: 6px;
            padding: 10px 12px;
            color: #fff;
            font-family: inherit;
            font-size: 0.9rem;
            transition: border-color 0.2s;
        }
        .lunaria-form-input:focus {
            border-color: #c9a96e;
            outline: none;
            background: rgba(255,255,255,0.06);
        }
        .btn-modal-submit {
            display: block;
            width: 100%;
            background: #c9a96e;
            color: #121212;
            border: 1px solid #c9a96e;
            padding: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-size: 0.8rem;
            cursor: pointer;
            margin-top: 20px;
            border-radius: 6px;
            transition: all 0.3s ease;
        }
        .btn-modal-submit:hover {
            background: transparent;
            color: #c9a96e;
        }
        .success-notify-icon {
            font-size: 3rem;
            color: #c9a96e;
            text-align: center;
            margin-bottom: 15px;
        }
    `;
    document.head.appendChild(modalStyle);

    // Close modal on background click
    const modalOverlay = document.getElementById('lunaria-info-modal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', e => {
            if (e.target === modalOverlay) closeInfoModal();
        });
    }
});

// Modal Actions
window.closeInfoModal = function() {
    const modal = document.getElementById('lunaria-info-modal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
};

window.showInfoModal = function(type) {
    const modal = document.getElementById('lunaria-info-modal');
    const titleEl = document.getElementById('lunaria-modal-title');
    const bodyEl = document.getElementById('lunaria-modal-body');
    if (!modal || !titleEl || !bodyEl) return;

    let title = '';
    let body = '';

    if (type === 'faq') {
        title = 'Preguntas Frecuentes';
        body = `
            <h4>¿Cómo puedo realizar mi compra?</h4>
            <p>Comprar en LUNARIA es sumamente fácil. Puedes añadir tus perfumes favoritos a tu bolsa de compras y hacer clic en <strong>Finalizar Compra</strong> en el carrito. Esto generará automáticamente un mensaje detallado para que nos contactes directamente por WhatsApp y coordinar el pago y envío. También puedes escribirnos de forma directa haciendo clic en el enlace de WhatsApp en el footer.</p>
            
            <h4>¿Los perfumes son 100% originales?</h4>
            <p>Sí, absolutamente todos nuestros perfumes son originales en su empaque sellado original de fábrica. No comercializamos testers genéricos, imitaciones, ni fragancias manipuladas. Cuentan con códigos de lote (batch code) que puedes verificar libremente.</p>
            
            <h4>¿Cuáles son las formas de pago?</h4>
            <p>Aceptamos transferencias bancarias directas, depósitos bancarios y pagos con tarjeta de crédito/débito de todos los bancos nacionales a través de un link de pago 100% seguro.</p>
            
            <h4>¿Tienen tienda física?</h4>
            <p>Operamos principalmente como tienda online exclusiva con entregas garantizadas a nivel nacional por Servientrega. Esto nos permite mantener los precios más competitivos de Ecuador.</p>
        `;
    } else if (type === 'shipping') {
        title = 'Políticas de Envío';
        body = `
            <h4>¿A qué ciudades de Ecuador realizan envíos?</h4>
            <p>Realizamos envíos asegurados a todas las provincias y cantones del Ecuador (Quito, Guayaquil, Cuenca, Manta, Loja, etc.) a través de Servientrega.</p>
            
            <h4>¿Cuál es el costo del envío?</h4>
            <p>Ofrecemos <strong>Envío Gratis</strong> a todo el país para compras acumuladas superiores a $100. Para pedidos inferiores a este monto, el costo del envío es de $5.00 a nivel nacional.</p>
            
            <h4>¿Cuánto tiempo tarda en llegar mi pedido?</h4>
            <p>Una vez confirmado tu pago, tu pedido es despachado en el transcurso del día. El tiempo de entrega estimado es de 24 a 48 horas laborables (de lunes a viernes), dependiendo de tu ubicación geográfica.</p>
            
            <h4>¿Puedo realizar el rastreo de mi paquete?</h4>
            <p>¡Por supuesto! Una vez que entreguemos tu pedido a Servientrega, te compartiremos el número de guía para que puedas realizar el rastreo en tiempo real desde la plataforma de Servientrega.</p>
        `;
    } else if (type === 'originality') {
        title = 'Garantía de Originalidad';
        body = `
            <h4>Nuestra Promesa de Autenticidad</h4>
            <p>En LUNARIA entendemos que la confianza lo es todo al adquirir perfumería de lujo. Por ello, garantizamos bajo contrato de satisfacción que cada una de nuestras fragancias es 100% original.</p>
            
            <h4>Verificación de Lote (Batch Code)</h4>
            <p>Cada botella y caja incluye su código de lote único (Batch Code) grabado de fábrica por la casa perfumista. Puedes verificar la fecha de manufactura y originalidad del producto en portales globales de verificación independientes como CheckFresh o CheckCosmetic.</p>
            
            <h4>Empaques de Origen</h4>
            <p>Los productos son entregados exactamente en las mismas condiciones en las que salen de fábrica: sellados con su celofán original (a excepción de las marcas que no utilizan celofán de fábrica, como algunas presentaciones específicas de marcas selectas) y en caja original.</p>
        `;
    }

    titleEl.textContent = title;
    bodyEl.innerHTML = body;
    
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
};

window.openNotifyModal = function(categoryName) {
    const modal = document.getElementById('lunaria-info-modal');
    const titleEl = document.getElementById('lunaria-modal-title');
    const bodyEl = document.getElementById('lunaria-modal-body');
    if (!modal || !titleEl || !bodyEl) return;

    titleEl.textContent = `Avísame cuando llegue: ${categoryName}`;
    bodyEl.innerHTML = `
        <p>La colección de perfumería <strong>${categoryName}</strong> estará disponible muy pronto. Regístrate a continuación y te notificaremos en exclusiva por correo o WhatsApp con un descuento especial de lanzamiento.</p>
        <form onsubmit="submitNotifyForm(event, '${categoryName}')" style="margin-top: 20px;">
            <div class="lunaria-form-group">
                <label for="notify-name">Nombre Completo</label>
                <input type="text" id="notify-name" class="lunaria-form-input" placeholder="Ej. Camila Sánchez" required>
            </div>
            <div class="lunaria-form-group">
                <label for="notify-contact">Correo Electrónico o WhatsApp</label>
                <input type="text" id="notify-contact" class="lunaria-form-input" placeholder="Ej. +593 99 522 0227" required>
            </div>
            <button type="submit" class="btn-modal-submit">Registrarme</button>
        </form>
    `;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
};

window.submitNotifyForm = function(event, categoryName) {
    event.preventDefault();
    const name = document.getElementById('notify-name').value;
    const contact = document.getElementById('notify-contact').value;
    const bodyEl = document.getElementById('lunaria-modal-body');

    let message = `¡Hola LUNARIA! 🌟\n\nQuiero que me avisen cuando llegue la colección de *${categoryName}*.\n\n`;
    message += `*Nombre:* ${name}\n`;
    message += `*Correo o WhatsApp:* ${contact}\n`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${getWhatsAppNumber()}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    if (bodyEl) {
        bodyEl.innerHTML = `
            <div class="success-notify-icon">✓</div>
            <h4 style="text-align: center; margin-top: 10px;">¡Registro Exitoso!</h4>
            <p style="text-align: center; margin-top: 10px;">Muchas gracias <strong>${name}</strong>. Hemos registrado tu interés por la colección de <strong>${categoryName}</strong>. Te notificaremos a <strong>${contact}</strong> en cuanto tengamos el stock disponible.</p>
            <button class="btn-modal-submit" onclick="closeInfoModal()">Cerrar</button>
        `;
    }
};

