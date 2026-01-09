/**
 * Square Payment Integration Client for Sisters Promise
 * Handles product fetching and payment processing
 */

const SquareIntegration = {
  apiUrl: 'http://localhost:3000/api',

  /**
   * Fetch all products from Square Catalog
   */
  fetchProducts: async function() {
    try {
      const response = await fetch(`${this.apiUrl}/products`);
      const data = await response.json();
      
      if (data.success) {
        return data.products;
      } else {
        console.error('Failed to fetch products:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  /**
   * Fetch single product details
   */
  fetchProduct: async function(productId) {
    try {
      const response = await fetch(`${this.apiUrl}/products/${productId}`);
      const data = await response.json();
      
      if (data.success) {
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

    const products = await this.fetchProducts();
    
    if (!products || products.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">Products not available. Please configure Square API integration.</p>';
      return;
    }

    // Limit products to display
    const displayProducts = products.slice(0, limit);

    let html = '';
    displayProducts.forEach(product => {
      const imageUrl = product.imageUrl || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(product.name);
      const price = product.variations && product.variations.length > 0
        ? '$' + (product.variations[0].itemVariationData?.priceMoney?.amount / 100 || '0').toFixed(2)
        : 'Contact for price';
      
      html += `
        <div class="col-lg-4 col-md-6 mb-4">
          <div class="card border-0 shadow-lg hover-shadow transition">
            <div class="position-relative overflow-hidden" style="height: 300px;">
              <img src="${imageUrl}" class="card-img-top" style="width: 100%; height: 100%; object-fit: cover;" alt="${product.name}">
            </div>
            <div class="card-body">
              <h5 class="card-title text-dark font-weight-bold">${product.name}</h5>
              <p class="text-muted text-sm mb-2">${(product.description || '').substring(0, 100)}...</p>
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="h5 font-weight-bold text-primary">${price}</span>
                <span class="badge bg-gradient-primary">USD</span>
              </div>
              <a href="https://sisters-promise-inc.square.site/s/shop" target="_blank" class="btn btn-sm bg-gradient-dark w-100">Shop on Square</a>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  /**
   * Process payment via Square
   */
  processPayment: async function(sourceId, amount) {
    try {
      const response = await fetch(`${this.apiUrl}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceId,
          amount,
          currency: 'USD',
          note: 'Sisters Promise purchase'
        })
      });

      if (!response.ok) throw new Error(`Payment failed: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
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
});
