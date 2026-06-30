// Global Cart and Wishlist state
let cart = JSON.parse(localStorage.getItem('lunaria_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('lunaria_wishlist') || '[]');

// Helper: find a product by its ID
function findProductById(id) {
    return perfumesData.find(p => p.id === id) || null;
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

    // Bind checkout buttons
    const checkoutBtns = document.querySelectorAll('.drawer-footer .btn-luxury');
    checkoutBtns.forEach(btn => {
        if (btn.textContent.trim() === 'Finalizar Compra') {
            btn.addEventListener('click', checkoutWhatsApp);
        }
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
        mmToggle.addEventListener('click', () => {
            alert('Menú móvil — próximamente disponible.');
        });
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
                <img src="${p.image}" alt="${p.name}">
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

function checkoutWhatsApp() {
    if (cart.length === 0) {
        alert("Tu bolsa de compras está vacía. Agrega algunos perfumes antes de finalizar tu compra.");
        return;
    }

    // Build the message
    let message = "¡Hola LUNARIA! 🌟\n\nEstoy interesado(a) en adquirir las siguientes fragancias de su catálogo:\n\n";
    
    // Group items by ID to show quantities
    const itemGroups = {};
    cart.forEach(item => {
        if (itemGroups[item.id]) {
            itemGroups[item.id].qty += 1;
        } else {
            itemGroups[item.id] = {
                product: item,
                qty: 1
            };
        }
    });

    let total = 0;
    Object.values(itemGroups).forEach(group => {
        const item = group.product;
        const subtotal = item.price * group.qty;
        total += subtotal;
        message += `• *${item.brand} - ${item.name}* (${item.size}, ${item.type}) \n  Cantidad: ${group.qty} · Subtotal: $${subtotal.toFixed(2)}\n\n`;
    });

    message += `*Total estimado:* $${total.toFixed(2)}\n\n`;
    message += "¿Me podrían indicar cómo proceder con el pago y los detalles del envío? ¡Muchas gracias! ✨";

    // Encode message for WhatsApp URL
    const encodedMessage = encodeURIComponent(message);
    
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

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
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

function updateCart() {
    if (cartCountEl) cartCountEl.textContent = cart.length;
    const container = document.getElementById('cart-items-container');
    const totalEl   = document.getElementById('cart-total-price');
    if (!container) return;
    if (!cart.length) {
        container.innerHTML = `<p style="text-align:center;color:var(--texto-sec);margin-top:30px;">Tu bolsa está vacía.</p>`;
        if (totalEl) totalEl.textContent = "$0.00"; 
        return;
    }
    container.innerHTML = cart.map((item, i) => `
        <div class="drawer-item">
            <div class="drawer-item-img"><img src="${item.image}" alt="${item.name}"></div>
            <div class="drawer-item-details">
                <div class="drawer-item-brand">${item.brand}</div>
                <h4 class="drawer-item-name">${item.name}</h4>
                <div class="drawer-item-price">$${item.price.toFixed(2)}</div>
                <button class="drawer-item-remove" onclick="removeFromCart(${i})">Eliminar</button>
            </div>
        </div>`).join('');
    if (totalEl) {
        totalEl.textContent = `$${cart.reduce((s, x) => s + x.price, 0).toFixed(2)}`;
    }
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
            <div class="drawer-item-img"><img src="${item.image}" alt="${item.name}"></div>
            <div class="drawer-item-details">
                <div class="drawer-item-brand">${item.brand}</div>
                <h4 class="drawer-item-name">${item.name}</h4>
                <div class="drawer-item-price">$${item.price.toFixed(2)}</div>
                <button class="drawer-item-remove" style="color:var(--dorado);" onclick="addToCart('${item.id}');toggleWishlist('${item.id}');">Mover al Carrito</button>
            </div>
        </div>`).join('');
}
