/**
 * CartService — localStorage-backed shopping cart for Sister's Promise
 * Key: sp_cart
 * Item shape: { id, variationId, name, price (cents), priceFormatted, imageUrl, quantity }
 * v2 — direct onclick handler
 */
console.log('[cart.js] CartService loading...');

(function() {
  // Inject toast + badge CSS once
  var style = document.createElement('style');
  style.textContent =
    '.cart-toast{position:fixed;bottom:24px;right:24px;z-index:9999;' +
    'background:#2d3e50;color:white;padding:14px 20px;border-radius:10px;' +
    'font-size:14px;opacity:0;transform:translateY(12px);' +
    'transition:all 0.3s ease;pointer-events:none;max-width:320px;}' +
    '.cart-toast.show{opacity:1;transform:translateY(0);pointer-events:auto;}' +
    '.cart-toast a{color:#C9A961;font-weight:700;margin-left:8px;text-decoration:none;}' +
    '.cart-badge{min-width:18px;height:18px;font-size:10px;padding:0 4px;' +
    'display:none;align-items:center;justify-content:center;}';
  document.head.appendChild(style);
})();

var CartService = {
  KEY: 'sp_cart',

  get: function() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch(e) { return []; }
  },

  save: function(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    this.updateBadge();
  },

  add: function(item) {
    // item: { id, variationId, name, price (cents), priceFormatted, imageUrl }
    var items = this.get();
    var key = item.variationId || item.id;
    var existing = items.find(function(i) { return (i.variationId || i.id) === key; });
    if (existing) {
      existing.quantity += (item.quantity || 1);
    } else {
      items.push(Object.assign({}, item, { quantity: item.quantity || 1 }));
    }
    this.save(items);
    this.showToast(item.name);
  },

  remove: function(key) {
    this.save(this.get().filter(function(i) { return (i.variationId || i.id) !== key; }));
  },

  update: function(key, qty) {
    var items = this.get();
    var item = items.find(function(i) { return (i.variationId || i.id) === key; });
    if (item) { item.quantity = Math.max(1, parseInt(qty) || 1); }
    this.save(items);
  },

  clear: function() {
    localStorage.removeItem(this.KEY);
    this.updateBadge();
  },

  count: function() {
    return this.get().reduce(function(s, i) { return s + i.quantity; }, 0);
  },

  total: function() {
    return this.get().reduce(function(s, i) { return s + (i.price * i.quantity); }, 0);
  },

  updateBadge: function() {
    var n = this.count();
    document.querySelectorAll('.cart-badge').forEach(function(el) {
      el.textContent = n;
      el.style.display = n > 0 ? 'inline-flex' : 'none';
    });
  },

  showToast: function(name) {
    var isInPages = window.location.pathname.indexOf('/pages/') !== -1;
    var cartUrl = isInPages ? 'cart.html' : './pages/cart.html';
    var t = document.createElement('div');
    t.className = 'cart-toast';
    t.innerHTML = '<i class="fas fa-check-circle me-2"></i><strong>' +
      CartService.sanitize(name) + '</strong> added to cart' +
      '<a href="' + cartUrl + '">View Cart</a>';
    document.body.appendChild(t);
    setTimeout(function() { t.classList.add('show'); }, 10);
    setTimeout(function() {
      t.classList.remove('show');
      setTimeout(function() { t.remove(); }, 300);
    }, 3000);
  },

  sanitize: function(str) {
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }
};

// Update badge on every page load
document.addEventListener('DOMContentLoaded', function() {
  CartService.updateBadge();
});

/**
 * Global helper called via onclick="spAddToCart(this)" on dynamically rendered buttons.
 * Reads data attributes from the button and delegates to CartService.add().
 */
function spAddToCart(btn) {
  console.log('[cart.js] spAddToCart called', btn);
  CartService.add({
    id: btn.getAttribute('data-id'),
    variationId: btn.getAttribute('data-variation-id'),
    name: btn.getAttribute('data-name'),
    price: parseInt(btn.getAttribute('data-price')) || 0,
    priceFormatted: btn.getAttribute('data-price-formatted'),
    imageUrl: btn.getAttribute('data-image')
  });
}
