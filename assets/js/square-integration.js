/**
 * Square Payment Integration Client for Sister's Promise
 * Handles product fetching, payment processing, and form submissions
 * Security: Input sanitization, error handling, rate limiting
 */

const SquareIntegration = {
  apiUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000/api' 
    : `${window.location.protocol}//${window.location.host}/api`,
  maxRetries: 3,
  retryDelay: 1000,

  /**
   * Sanitize HTML and prevent XSS attacks
   */
  sanitize: function(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Show error message to user
   */
  showError: function(message, duration = 5000) {
    console.error('Error:', message);
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
      <strong>Error:</strong> ${this.sanitize(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.insertBefore(alertDiv, document.body.firstChild);
    
    setTimeout(() => alertDiv.remove(), duration);
  },

  /**
   * Show success message to user
   */
  showSuccess: function(message, duration = 3000) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
      <strong>Success!</strong> ${this.sanitize(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.insertBefore(alertDiv, document.body.firstChild);
    
    setTimeout(() => alertDiv.remove(), duration);
  },

  /**
   * Fetch with retry logic
   */
  fetchWithRetry: async function(url, options = {}, retries = 0) {
    try {
      const response = await fetch(url, {
        ...options,
        timeout: 10000,
      });

      if (!response.ok && retries < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retries + 1)));
        return this.fetchWithRetry(url, options, retries + 1);
      }

      return response;
    } catch (error) {
      if (retries < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retries + 1)));
        return this.fetchWithRetry(url, options, retries + 1);
      }
      throw error;
    }
  },

  /**
   * Fetch all products from Square Catalog
   */
  fetchProducts: async function() {
    try {
      const response = await this.fetchWithRetry(`${this.apiUrl}/square/catalog`);
      const data = await response.json();

      if (data.success && data.data && Array.isArray(data.data.products)) {
        return data.data.products;
      } else {
        console.error('Failed to fetch products:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      this.showError('Unable to load products. Please try again later.');
      return [];
    }
  },

  /**
   * Fetch single product details
   */
  fetchProduct: async function(productId) {
    try {
      if (!productId || typeof productId !== 'string') {
        throw new Error('Invalid product ID');
      }

      const response = await this.fetchWithRetry(`${this.apiUrl}/products/${encodeURIComponent(productId)}`);
      const data = await response.json();
      
      if (data.success && data.product) {
        return data.product;
      } else {
        console.error('Failed to fetch product:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  /**
   * Render product gallery
   */
  renderProducts: async function(containerId, limit = 50) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id '${containerId}' not found`);
      return;
    }

    // Show loading state
    container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border" role="status" style="color: #C9A961;"><span class="visually-hidden">Loading...</span></div><p class="text-muted mt-3">Loading products...</p></div>';

    const products = await this.fetchProducts();

    if (!products || products.length === 0) {
      container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">No products available at this time.</p></div>';
      return;
    }

    const displayProducts = products.slice(0, Math.min(limit, 100));
    let html = '';

    displayProducts.forEach(product => {
      try {
        const imageUrl = product.imageUrl ? this.sanitize(product.imageUrl) : '../assets/img/logos/SistersPromise-Logo_bw_500.jpg';
        const price = product.priceFormatted || (product.price ? `$${(product.price / 100).toFixed(2)}` : 'Contact for price');
        const description = (product.description || '').substring(0, 100);
        const categoryBadge = product.category
          ? `<span class="badge" style="background-color: #C9A961;">${this.sanitize(product.category)}</span>`
          : '';
        const buyButtonAttr = product.variationId
          ? `onclick="SquareIntegration.buyNow('${this.sanitize(product.variationId)}')" style="background-color: #C9A961; color: white; border: none; cursor: pointer;"`
          : `href="https://sisters-promise-inc.square.site/s/shop" target="_blank" rel="noopener noreferrer" style="background-color: #C9A961; color: white; border: none;"`;
        const buyButtonTag = product.variationId ? 'button' : 'a';
        const buyButtonClose = product.variationId ? '</button>' : '</a>';

        html += `
          <div class="col-lg-4 col-md-6 mb-4">
            <div class="card border-0 shadow-lg hover-shadow transition">
              <div class="position-relative overflow-hidden" style="height: 300px;">
                <img
                  src="${imageUrl}"
                  class="card-img-top"
                  style="width: 100%; height: 100%; object-fit: cover;"
                  alt="${this.sanitize(product.name)}"
                  loading="lazy"
                  onerror="this.src='../assets/img/logos/SistersPromise-Logo_bw_500.jpg'"
                >
              </div>
              <div class="card-body">
                <h5 class="card-title text-dark font-weight-bold">${this.sanitize(product.name)}</h5>
                <p class="text-muted text-sm mb-3">${this.sanitize(description)}${description.length >= 100 ? '...' : ''}</p>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <span style="color: #C9A961; font-weight: bold; font-size: 1.2rem;">${price}</span>
                  ${categoryBadge}
                </div>
                <div class="text-center">
                  <${buyButtonTag} class="btn btn-sm w-100" ${buyButtonAttr}>Buy Now${buyButtonClose}
                </div>
              </div>
            </div>
          </div>
        `;
      } catch (error) {
        console.error('Error rendering product:', error);
      }
    });

    container.innerHTML = html;
  },

  /**
   * Buy a single product now via Square Checkout
   */
  buyNow: async function(variationId, quantity = 1) {
    try {
      if (!variationId) {
        throw new Error('No product selected');
      }

      this.showSuccess('Redirecting to checkout...');

      const response = await this.fetchWithRetry(`${this.apiUrl}/square/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          items: [{ variationId, quantity }],
        }),
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return { success: true };
      } else {
        throw new Error(data.error || 'Failed to create checkout');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      this.showError(`Checkout failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  /**
   * Process payment via Square Checkout with multiple items
   */
  processPayment: async function(orderItems) {
    try {
      if (!Array.isArray(orderItems) || orderItems.length === 0) {
        throw new Error('No items in cart');
      }

      this.showSuccess('Redirecting to checkout...');

      const items = orderItems.map(item => ({
        variationId: item.variationId,
        quantity: item.quantity || 1,
      }));

      const response = await this.fetchWithRetry(`${this.apiUrl}/square/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return { success: true };
      } else {
        throw new Error(data.error || 'Failed to create checkout');
      }
    } catch (error) {
      console.error('Payment error:', error);
      this.showError(`Payment failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  /**
   * Submit contact form with reCAPTCHA validation
   */
  submitContactForm: async function(formData, recaptchaToken) {
    try {
      if (!recaptchaToken) {
        throw new Error('reCAPTCHA verification required');
      }

      // Validate form data
      if (!formData.name || formData.name.length < 2 || formData.name.length > 100) {
        this.showError('Please enter a valid name (2-100 characters)');
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email) || formData.email.length > 100) {
        this.showError('Please enter a valid email address');
        return false;
      }

      if (!formData.message || formData.message.length < 10 || formData.message.length > 1000) {
        this.showError('Message must be between 10 and 1000 characters');
        return false;
      }

      const response = await this.fetchWithRetry(`${this.apiUrl}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          name: formData.name.substring(0, 100),
          email: formData.email.substring(0, 100),
          message: formData.message.substring(0, 1000),
          recaptchaToken
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit form');
      }

      const data = await response.json();
      if (data.success) {
        this.showSuccess('Thank you! Your message has been sent successfully.');
        return true;
      } else {
        throw new Error(data.message || 'Form submission failed');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      this.showError(`Form submission failed: ${error.message}`);
      return false;
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Auto-render products if container exists
  const productContainer = document.getElementById('square-products');
  if (productContainer) {
    SquareIntegration.renderProducts('square-products');
  }

  // Contact form handler is now in contact.html with reCAPTCHA Enterprise
});
