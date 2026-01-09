/**
 * Sisters Promise Etsy Integration
 * Handles fetching and displaying products from Etsy API
 */

const EtsyIntegration = {
  apiUrl: 'http://localhost:3000/api',
  
  /**
   * Fetch all products from Etsy
   */
  fetchProducts: async function() {
    try {
      const response = await fetch(`${this.apiUrl}/products`);
      const data = await response.json();
      
      if (data.success) {
        return data.products;
      } else {
        console.error('Failed to fetch products:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      return null;
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
      container.innerHTML = '<p class="text-center text-muted">Products not available. Please configure Etsy API integration.</p>';
      return;
    }

    // Limit products to display
    const displayProducts = products.slice(0, limit);

    let html = '';
    displayProducts.forEach(product => {
      const imageUrl = product.images && product.images.length > 0 
        ? product.images[0].url_570xN 
        : 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(product.title);
      
      html += `
        <div class="col-lg-4 col-md-6 mb-4">
          <div class="card border-0 shadow-lg hover-shadow transition">
            <div class="position-relative overflow-hidden" style="height: 300px;">
              <img src="${imageUrl}" class="card-img-top" style="width: 100%; height: 100%; object-fit: cover;" alt="${product.title}">
            </div>
            <div class="card-body">
              <h5 class="card-title text-dark font-weight-bold">${product.title}</h5>
              <p class="text-muted text-sm mb-2">${product.description.substring(0, 100)}...</p>
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="h5 font-weight-bold text-primary">$${product.price.toFixed(2)}</span>
                <span class="badge bg-gradient-primary">${product.currency}</span>
              </div>
              <a href="${product.url}" target="_blank" class="btn btn-sm bg-gradient-dark w-100">View on Etsy</a>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Auto-render products if container exists
  const productContainer = document.getElementById('etsy-products');
  if (productContainer) {
    EtsyIntegration.renderProducts('etsy-products');
  }
});
