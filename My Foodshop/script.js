// Product Data
const products = [
    { id: 1, name: 'Ofada Rice (5kg)', price: 8500, desc: 'Premium local rice', img: 'Assets/Items/Ofada rice.JPG', rating: 4.8 },
    { id: 2, name: 'Poundo Yam (2kg)', price: 6800, desc: 'Fresh poundo yam', img: 'Assets/Items/Poundo yam.JPG', rating: 4.6 },
    { id: 3, name: 'Ripe Plantain (Bunch)', price: 2200, desc: 'Organic ripe plantain', img: 'Assets/Items/Ripe plantain.JPG', rating: 4.7 },
    { id: 4, name: 'Honey Beans (3kg)', price: 7200, desc: 'Quality honey beans', img: 'Assets/Items/Honey beans.JPG', rating: 4.5 },
    { id: 5, name: 'Gari (5kg)', price: 8800, desc: 'Premium quality gari', img: 'Assets/Items/Gari.jpg', rating: 4.9 },
    { id: 6, name: 'Palm Oil (5L)', price: 11500, desc: 'Pure palm oil', img: 'Assets/Items/palm oil.jpg', rating: 4.7 }
];

// Discard entries that don't map to a known product to avoid 'undefined' items.
let cart = [];
try {
    const raw = JSON.parse(localStorage.getItem('cart')) || [];
    if (Array.isArray(raw)) {
        cart = raw.map(item => {
            if (!item) return null;
            // Try to resolve product by id first, then by name
            let prod = null;
            if (item.id != null) prod = products.find(p => p.id === item.id);
            if (!prod && item.name) prod = products.find(p => p.name === item.name);
            const qty = Number(item.qty ?? item.quantity ?? 1) || 1;
            return {
                id: prod.id,
                name: prod.name,
                price: prod.price,
                img: item.img ?? prod.img ?? '',
                qty: qty
            };
        }).filter(Boolean);
    }
} catch (err) {
    cart = [];
}
// Persist normalized cart back to localStorage so future loads are consistent
localStorage.setItem('cart', JSON.stringify(cart));

/**
 * Render all products to the product grid
 */
function renderProducts() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = products.map(p => `
        <div class="product-card" data-product-id="${p.id}">
            <img src="${p.img}" alt="${p.name}" class="product-image" style="cursor: pointer;">
            <div class="product-info">
                <h3>${p.name}</h3>
                <p class="product-desc">${p.desc}</p>
                <div class="rating"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 0.3rem;"><polygon points="12 2 15.09 10.26 24 10.35 17.77 16.01 20.16 24.02 12 18.35 3.84 24.02 6.23 16.01 0 10.35 8.91 10.26"/></svg> ${p.rating} (${Math.floor(Math.random() * 100) + 20} reviews)</div>
                <div class="price">₦${p.price.toLocaleString()}</div>
                <button class="add-to-cart-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');

    // Add quick preview on image click
    grid.querySelectorAll('.product-image').forEach(img => {
        img.addEventListener('click', () => {
            const card = img.closest('.product-card');
            const productId = parseInt(card.dataset.productId);
            openPreview(productId);
        });
    });
}

/**
 * Add a product to the cart
 * @param {number} productId - The ID of the product to add
 */
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    showToast('✓ Item added to cart');
}

/**
 * Update the cart badge count
 */
function updateCart() {
    const cartIcon = document.getElementById('cartIcon');
    const badge = document.getElementById('cartBadge');
    const count = cart.reduce((sum, item) => sum + item.qty, 0);

    // Update SVG badge text
    const badgeText = badge.querySelector('.badge-text');
    badgeText.textContent = count;

    // Add animation effect
    cartIcon.classList.add('active');
    setTimeout(() => {
        cartIcon.classList.remove('active');
    }, 600);

    // Render cart items in modal
    renderCart();
}

/**
 * Render all cart items in the modal
 */
function renderCart() {
    const container = document.getElementById('cartItems');
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Your cart is empty</p>';
        return;
    }
    container.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.img}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="cart-item-price">₦${(item.price * item.qty).toLocaleString()}</div>
            </div>
            <div class="qty-controls">
                <button class="qty-btn qty-decrease" aria-label="Decrease">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14"/>
                    </svg>
                </button>
                <span class="qty-display">${item.qty}</span>
                <button class="qty-btn qty-increase" aria-label="Increase">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                </button>
            </div>
            <button class="remove-item-btn" aria-label="Remove item">Remove</button>
        </div>
    `).join('');

    // Add event listeners for quantity controls
    container.querySelectorAll('.qty-decrease').forEach(btn => {
        btn.addEventListener('click', () => {
            const itemId = parseInt(btn.closest('.cart-item').dataset.id);
            updateQty(itemId, -1);
        });
    });

    container.querySelectorAll('.qty-increase').forEach(btn => {
        btn.addEventListener('click', () => {
            const itemId = parseInt(btn.closest('.cart-item').dataset.id);
            updateQty(itemId, 1);
        });
    });

    // Remove buttons
    container.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const itemId = parseInt(btn.closest('.cart-item').dataset.id);
            removeItem(itemId);
        });
    });

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    document.getElementById('cartTotal').textContent = `Total: ₦${total.toLocaleString()}`;
}

function updateQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCart();
        renderCart();
    }
}

function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    renderCart();
    showToast('✓ Item removed from cart');
}

function clearCart() {
    if (cart.length === 0) return;
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    renderCart();
    showToast('✓ Cart cleared');
}

/**
 * Open the cart modal
 */
function openCart() {
    renderCart();
    document.getElementById('cartModal').classList.add('open');
}

/**
 * Close the cart modal
 */
function closeCart() {
    document.getElementById('cartModal').classList.remove('open');
}

/**
 * Open the contact modal
 */
function openContact() {
    document.getElementById('contactModal').classList.add('open');
}

/**
 * Close the contact modal
 */
function closeContact() {
    document.getElementById('contactModal').classList.remove('open');
}

/**
 * Send a contact message via WhatsApp
 */
function sendMessage() {
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;
    if (!name || !email || !message) {
        showToast('! Please fill all fields');
        return;
    }
    const fullMessage = `Name: ${name}\nEmail: ${email}\nMessage: ${message}`;
    window.open(`https://wa.me/2349131557676?text=${encodeURIComponent(fullMessage)}`, '_blank');
    closeContact();
    showToast('✓ Message sent');
}

/**
 * Open product preview modal
 */
function openPreview(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('previewImage').src = product.img;
    document.getElementById('previewTitle').textContent = product.name;
    document.getElementById('previewRating').textContent = product.rating;
    document.getElementById('previewDesc').textContent = product.desc;
    document.getElementById('previewPrice').textContent = `₦${product.price.toLocaleString()}`;

    // Store product ID for add to cart button
    document.getElementById('previewAddBtn').dataset.productId = productId;

    document.getElementById('previewModal').classList.add('open');
}

/**
 * Close product preview modal
 */
function closePreview() {
    document.getElementById('previewModal').classList.remove('open');
}

/**
 * Process checkout and send order via WhatsApp
 */
function checkout() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    if (total === 0) {
        showToast('! Cart is empty');
        return;
    }
    const message = `Order: ${cart.map(i => i.name + ' x' + i.qty).join(', ')}\nTotal: ₦${total.toLocaleString()}`;
    window.open(`https://wa.me/2349131557676?text=${encodeURIComponent(message)}`, '_blank');
    showToast('✓ Order sent to WhatsApp');
}

/**

 * Show a temporary toast notification
 * @param {string} msg - The message to display
 */
function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

/**
 * Initialize the app
 */
function initializeApp() {
    // Render products
    renderProducts();

    // Remove any duplicated/legacy cart modal nodes that may have been left
    // by earlier code versions so we always operate on a single modal.
    (function dedupeCartModals() {
        const legacy = Array.from(document.querySelectorAll('#cart-modal'));
        legacy.forEach(n => n.remove());
        const nodes = Array.from(document.querySelectorAll('#cartModal'));
        if (nodes.length > 1) {
            nodes.slice(1).forEach(n => n.remove());
        }
    })();

    // Update cart count
    updateCart();

    // Navigation event listeners
    document.getElementById('cartIcon').addEventListener('click', openCart);
    document.getElementById('shopNowBtn').addEventListener('click', () => {
        document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    });

    // Modal close buttons
    document.getElementById('closeCartBtn').addEventListener('click', closeCart);
    document.getElementById('closeContactBtn').addEventListener('click', closeContact);
    const clearBtn = document.getElementById('clearCartBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearCart);

    // Form action buttons
    document.getElementById('checkoutBtn').addEventListener('click', checkout);

    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);

    // Preview modal event listeners
    document.getElementById('closePreviewBtn').addEventListener('click', closePreview);
    document.getElementById('previewBackdrop').addEventListener('click', closePreview);

    // Add to cart from preview modal
    document.getElementById('previewAddBtn').addEventListener('click', () => {
        const productId = parseInt(document.getElementById('previewAddBtn').dataset.productId);
        if (productId) {
            addToCart(productId);
            closePreview();
        }
    });

    // Contact link
    const contactLink = document.querySelector('.contact-link');
    if (contactLink) {
        contactLink.addEventListener('click', (e) => {
            e.preventDefault();
            openContact();
        });
    }

    // Social icons
    document.querySelectorAll('[data-social]').forEach(icon => {
        icon.addEventListener('click', () => {
            const social = icon.dataset.social;
            if (social === 'whatsapp') {
                window.open('https://wa.me/+234913155667');
            } else if (social === 'facebook') {
                window.open('https://facebook.com/naijafoods');
            }
        });
        icon.style.cursor = 'pointer';
    });

    // Close cart modal on backdrop click
    document.getElementById('cartModal').addEventListener('click', e => {
        if (e.target.id === 'cartModal') closeCart();
    });

    // Close account modal on backdrop click


    // Close contact modal on backdrop click
    document.getElementById('contactModal').addEventListener('click', e => {
        if (e.target.id === 'contactModal') closeContact();
    });

    // Product add to cart buttons (event delegation)
    document.getElementById('productGrid').addEventListener('click', (e) => {
        const addBtn = e.target.closest('button');
        if (addBtn && addBtn.textContent.includes('Add to Cart')) {
            const card = addBtn.closest('.product-card');
            const productName = card.querySelector('h3').textContent;
            const product = products.find(p => p.name === productName);
            if (product) addToCart(product.id);
        }
    });
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();

    // Hide loader when page is fully loaded
    window.addEventListener('load', () => {
        setTimeout(() => {
            const loader = document.getElementById('pageLoader');
            if (loader) {
                loader.classList.add('hidden');
            }
        }, 500); // Small delay for smooth effect
    });
});

// Note: removed a duplicated/conflicting cart implementation that used different
// property names and DOM IDs. The single cart implementation above (uses `qty`
// and localStorage key `cart`) should remain. If you need parts of the old
// implementation restored, tell me which functions to merge.
