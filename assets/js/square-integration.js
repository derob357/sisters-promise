/**
 * Square Payment Integration Client for Sisters Promise
 * Handles product fetching, payment processing, and form submissions
 * Security: Input sanitization, error handling, rate limiting
 */

const SquareIntegration = {
  apiUrl: 'http://localhost:3000/api',
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
      const response = await this.fetchWithRetry(`${this.apiUrl}/products`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.products)) {
        return data.products;
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
  renderProducts: async function(containerId, limit = 6) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id '${containerId}' not found`);
      return;
    }

    // Show loading state
    container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    const products = await this.fetchProducts();
    
    if (!products || products.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">No products available at this time.</p>';
      return;
    }

    const displayProducts = products.slice(0, Math.min(limit, 100));
    let html = '';

    displayProducts.forEach(product => {
      try {
        const imageUrl = product.imageUrl ? this.sanitize(product.imageUrl) : 'https://via.placeholder.com/400x300?text=Sisters+Promise';
        const price = product.variations && product.variations.length > 0
          ? '$' + (product.variations[0].itemVariationData?.priceMoney?.amount / 100 || '0').toFixed(2)
          : 'Contact for price';
        
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
                  onerror="this.src='https://via.placeholder.com/400x300?text=Sisters+Promise'"
                >
              </div>
              <div class="card-body">
                <h5 class="card-title text-dark font-weight-bold">${this.sanitize(product.name)}</h5>
                <p class="text-muted text-sm mb-2">${this.sanitize((product.description || '').substring(0, 100))}...</p>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <span class="h5 font-weight-bold text-primary">${price}</span>
                  <span class="badge bg-gradient-primary">USD</span>
                </div>
                <a href="https://sisters-promise-inc.square.site/s/shop" target="_blank" rel="noopener noreferrer" class="btn btn-sm bg-gradient-dark w-100">Shop on Square</a>
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
   * Process payment via Square
   */
  processPayment: async function(sourceId, amount) {
    try {
      if (!sourceId || typeof sourceId !== 'string') {
        throw new Error('Invalid source ID');
      }

      if (!amount || typeof amount !== 'number' || amount < 1) {
        throw new Error('Invalid amount');
      }

      const response = await this.fetchWithRetry(`${this.apiUrl}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          sourceId: sourceId.substring(0, 100),
          amount: Math.floor(amount),
          currency: 'USD',
          note: 'Sisters Promise purchase'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Payment error:', error);
      this.showError(`Payment failed: ${error.message}`);
      throw error;
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

  // Attach contact form handler
  const contactForm = document.getElementById('contact-form');
  if (contactForm && typeof grecaptcha !== 'undefined') {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = {
        name: document.getElementById('contact-name').value || '',
        email: document.getElementById('contact-email').value || '',
        message: document.getElementById('contact-message').value || ''
      };

      grecaptcha.execute(window.RECAPTCHA_SITE_KEY, { action: 'submit' }).then(function(token) {
        SquareIntegration.submitContactForm(formData, token);
      });
    });
  }
});
  if (productContainer) {
    SquareIntegration.renderProducts('square-products');
  }
});
