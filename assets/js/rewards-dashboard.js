/**
 * Rewards Dashboard Module
 * Authenticated rewards dashboard for the rewards page
 * Depends on AuthService from auth.js (must be loaded first)
 */

const RewardsDashboard = {
  apiUrl: null,
  currentUserData: null,

  /**
   * Initialize the rewards dashboard
   */
  init: function() {
    // Reference AuthService apiUrl
    this.apiUrl = AuthService.apiUrl;

    // Check if user is logged in
    if (!AuthService.isLoggedIn()) {
      this.showLoginPrompt();
      return;
    }

    // User is logged in, load dashboard
    this.showLoading();
    this.loadUserRewards();
    this.loadRewardsHistory();
  },

  /**
   * Show login prompt for unauthenticated users
   */
  showLoginPrompt: function() {
    const container = document.getElementById('rewards-dashboard');
    if (!container) return;

    container.innerHTML = `
      <div class="text-center py-5">
        <div class="mb-4">
          <i class="fas fa-lock" style="font-size: 3rem; color: #C9A961;"></i>
        </div>
        <h3 class="mb-3">Sign In to View Your Rewards</h3>
        <p class="text-muted mb-4">
          Earn points with every purchase and unlock exclusive rewards!<br>
          Track your progress, redeem points, and claim free gifts.
        </p>
        <a href="sign-in.html?redirect=rewards" class="btn btn-lg"
           style="background-color: #C9A961; color: white;">
          Sign In to Continue
        </a>
      </div>
    `;
  },

  /**
   * Show loading spinner
   */
  showLoading: function() {
    const container = document.getElementById('rewards-dashboard');
    if (!container) return;

    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border" style="color: #C9A961;" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Loading your rewards...</p>
      </div>
    `;
  },

  /**
   * Load user rewards data from API
   */
  loadUserRewards: function() {
    fetch(`${this.apiUrl}/rewards/user`, {
      method: 'GET',
      headers: AuthService.authHeaders()
    })
    .then(response => {
      if (response.status === 401) {
        AuthService.clearAuth();
        this.showLoginPrompt();
        throw new Error('Unauthorized');
      }
      return response.json();
    })
    .then(data => {
      this.currentUserData = data;
      this.renderDashboard(data);
    })
    .catch(error => {
      if (error.message !== 'Unauthorized') {
        const container = document.getElementById('rewards-dashboard');
        if (container) {
          container.innerHTML = `
            <div class="alert alert-warning" role="alert">
              <i class="fas fa-exclamation-triangle me-2"></i>
              Unable to load rewards data. Please try again later.
            </div>
          `;
        }
      }
    });
  },

  /**
   * Render the main dashboard view
   */
  renderDashboard: function(data) {
    const container = document.getElementById('rewards-dashboard');
    if (!container) return;

    const user = AuthService.getUser();
    const userName = user ? AuthService.sanitize(user.name) : 'Member';
    const points = data.points || 0;
    const lifetimePoints = data.lifetimePoints || 0;
    const totalPurchases = data.totalPurchases || 0;
    const freeGiftsEarned = data.freeGiftsEarned || 0;
    const freeGiftsRedeemed = data.freeGiftsRedeemed || 0;
    const freeGiftsAvailable = freeGiftsEarned - freeGiftsRedeemed;
    const tier = data.tier || 'Bronze';

    const tierColor = this.getTierColor(tier);

    container.innerHTML = `
      <!-- User Greeting -->
      <div class="mb-4">
        <h2 class="mb-2">Welcome back, ${userName}!</h2>
        <span class="badge px-3 py-2" style="background-color: ${tierColor}; font-size: 1rem;">
          <i class="fas fa-medal me-2"></i>${AuthService.sanitize(tier)} Member
        </span>
      </div>

      <!-- Stats Row -->
      <div class="row g-3 mb-4">
        <div class="col-md-3 col-sm-6">
          <div class="card h-100">
            <div class="card-body text-center">
              <i class="fas fa-star mb-2" style="font-size: 2rem; color: #C9A961;"></i>
              <h3 class="mb-0">${points.toLocaleString()}</h3>
              <p class="text-muted mb-0">Points Balance</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="card h-100">
            <div class="card-body text-center">
              <i class="fas fa-medal mb-2" style="font-size: 2rem; color: ${tierColor};"></i>
              <h3 class="mb-0">${AuthService.sanitize(tier)}</h3>
              <p class="text-muted mb-0">Current Tier</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="card h-100">
            <div class="card-body text-center">
              <i class="fas fa-shopping-bag mb-2" style="font-size: 2rem; color: #C9A961;"></i>
              <h3 class="mb-0">${totalPurchases}</h3>
              <p class="text-muted mb-0">Total Purchases</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="card h-100">
            <div class="card-body text-center">
              <i class="fas fa-gift mb-2" style="font-size: 2rem; color: #C9A961;"></i>
              <h3 class="mb-0">${freeGiftsAvailable}</h3>
              <p class="text-muted mb-0">Free Gifts Available</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress to Next Tier -->
      <div class="card mb-4">
        <div class="card-body">
          <h4 class="mb-3">
            <i class="fas fa-trophy me-2" style="color: #C9A961;"></i>
            Tier Progress
          </h4>
          ${this.renderTierProgress(tier, totalPurchases)}
        </div>
      </div>

      <!-- Redeem Section -->
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="mb-3">
                <i class="fas fa-coins me-2" style="color: #C9A961;"></i>
                Redeem Points
              </h5>
              <p class="text-muted small mb-3">
                Convert your points to discount credits (100 points = $1.00)
              </p>
              <div class="mb-3">
                <label for="points-input" class="form-label">Points to Redeem</label>
                <input type="number"
                       class="form-control"
                       id="points-input"
                       min="100"
                       max="${points}"
                       step="100"
                       placeholder="Enter points (min 100)"
                       ${points < 100 ? 'disabled' : ''}>
                <small class="text-muted">
                  <span id="points-value">$0.00</span> discount credit
                </small>
              </div>
              <button class="btn w-100"
                      style="background-color: #C9A961; color: white;"
                      onclick="RewardsDashboard.handleRedeemPoints()"
                      ${points < 100 ? 'disabled' : ''}>
                <i class="fas fa-exchange-alt me-2"></i>
                Redeem Points
              </button>
              ${points < 100 ? '<small class="text-muted d-block mt-2">Minimum 100 points required</small>' : ''}
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="mb-3">
                <i class="fas fa-gift me-2" style="color: #C9A961;"></i>
                Redeem Free Gift
              </h5>
              <p class="text-muted small mb-3">
                You've earned ${freeGiftsAvailable} free gift${freeGiftsAvailable !== 1 ? 's' : ''}!
              </p>
              <div class="mb-3">
                <div class="d-flex align-items-center justify-content-center py-4">
                  <i class="fas fa-gift me-3" style="font-size: 3rem; color: #C9A961;"></i>
                  <h2 class="mb-0">${freeGiftsAvailable}</h2>
                </div>
              </div>
              <button class="btn w-100"
                      style="background-color: #C9A961; color: white;"
                      onclick="RewardsDashboard.redeemGift()"
                      ${freeGiftsAvailable === 0 ? 'disabled' : ''}>
                <i class="fas fa-gift me-2"></i>
                Redeem Gift
              </button>
              ${freeGiftsAvailable === 0 ? '<small class="text-muted d-block mt-2">No free gifts available</small>' : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- History Section -->
      <div id="rewards-history"></div>
    `;

    // Add event listener for points input
    const pointsInput = document.getElementById('points-input');
    if (pointsInput) {
      pointsInput.addEventListener('input', function() {
        const valueSpan = document.getElementById('points-value');
        const points = parseInt(this.value) || 0;
        const dollars = (points / 100).toFixed(2);
        if (valueSpan) {
          valueSpan.textContent = `$${dollars}`;
        }
      });
    }
  },

  /**
   * Render tier progress section
   */
  renderTierProgress: function(currentTier, totalPurchases) {
    const nextTier = this.getNextTier(currentTier);

    if (!nextTier) {
      return `
        <div class="text-center py-3">
          <i class="fas fa-crown mb-2" style="font-size: 2rem; color: #8B8B8B;"></i>
          <h5>Maximum Tier Reached!</h5>
          <p class="text-muted mb-0">You're at the highest rewards tier. Enjoy your exclusive benefits!</p>
        </div>
      `;
    }

    const progress = Math.min((totalPurchases / nextTier.minPurchases) * 100, 100);
    const remaining = Math.max(nextTier.minPurchases - totalPurchases, 0);

    return `
      <div class="mb-3">
        <div class="d-flex justify-content-between mb-2">
          <span>${totalPurchases} of ${nextTier.minPurchases} purchases to ${nextTier.name}</span>
          <span class="text-muted">${progress.toFixed(0)}%</span>
        </div>
        <div class="progress" style="height: 20px;">
          <div class="progress-bar"
               role="progressbar"
               style="width: ${progress}%; background: linear-gradient(90deg, #C9A961 0%, #FFD700 100%);"
               aria-valuenow="${progress}"
               aria-valuemin="0"
               aria-valuemax="100">
          </div>
        </div>
      </div>
      <p class="text-muted mb-0">
        <i class="fas fa-info-circle me-2"></i>
        ${remaining} more purchase${remaining !== 1 ? 's' : ''} to reach ${nextTier.name} tier!
      </p>
    `;
  },

  /**
   * Load rewards history from API
   */
  loadRewardsHistory: function() {
    fetch(`${this.apiUrl}/rewards/history`, {
      method: 'GET',
      headers: AuthService.authHeaders()
    })
    .then(response => response.json())
    .then(history => {
      this.renderHistory(history);
    })
    .catch(error => {
      const container = document.getElementById('rewards-history');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-warning" role="alert">
            Unable to load rewards history. Please try again later.
          </div>
        `;
      }
    });
  },

  /**
   * Render rewards history table
   */
  renderHistory: function(history) {
    const container = document.getElementById('rewards-history');
    if (!container) return;

    if (!history || history.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body text-center py-5">
            <i class="fas fa-history mb-3" style="font-size: 2rem; color: #C9A961;"></i>
            <h5>No rewards activity yet</h5>
            <p class="text-muted mb-0">Make a purchase to start earning points!</p>
          </div>
        </div>
      `;
      return;
    }

    // Limit to 20 most recent
    const recentHistory = history.slice(0, 20);

    let tableRows = '';
    recentHistory.forEach(item => {
      const typeIcon = this.getTypeIcon(item.type);
      const pointsColor = item.points >= 0 ? 'text-success' : 'text-danger';
      const pointsSign = item.points >= 0 ? '+' : '';

      tableRows += `
        <tr>
          <td class="text-center" style="width: 60px;">
            ${typeIcon}
          </td>
          <td>${AuthService.sanitize(item.description || item.type)}</td>
          <td class="text-end ${pointsColor}" style="width: 120px;">
            <strong>${pointsSign}${item.points.toLocaleString()}</strong>
          </td>
          <td class="text-end text-muted" style="width: 150px;">
            ${this.formatDate(item.date)}
          </td>
        </tr>
      `;
    });

    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h4 class="mb-3">
            <i class="fas fa-history me-2" style="color: #C9A961;"></i>
            Recent Activity
          </h4>
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th style="width: 60px;"></th>
                  <th>Description</th>
                  <th class="text-end" style="width: 120px;">Points</th>
                  <th class="text-end" style="width: 150px;">Date</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Handle redeem points button click
   */
  handleRedeemPoints: function() {
    const pointsInput = document.getElementById('points-input');
    if (!pointsInput) return;

    const points = parseInt(pointsInput.value);

    if (!points || points < 100) {
      alert('Please enter at least 100 points to redeem.');
      return;
    }

    if (this.currentUserData && points > this.currentUserData.points) {
      alert('You do not have enough points.');
      return;
    }

    this.redeemPoints(points);
  },

  /**
   * Redeem points for discount credit
   */
  redeemPoints: function(points) {
    if (points <= 0) {
      alert('Invalid points amount.');
      return;
    }

    if (this.currentUserData && points > this.currentUserData.points) {
      alert('You do not have enough points.');
      return;
    }

    fetch(`${this.apiUrl}/rewards/redeem-points`, {
      method: 'POST',
      headers: {
        ...AuthService.authHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ points })
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        throw new Error(data.error);
      }

      const discountAmount = (points / 100).toFixed(2);
      alert(`Success! You've redeemed ${points.toLocaleString()} points for $${discountAmount} discount credit.`);

      // Reload dashboard
      this.showLoading();
      this.loadUserRewards();
      this.loadRewardsHistory();
    })
    .catch(error => {
      alert(`Error: ${error.message || 'Unable to redeem points. Please try again.'}`);
    });
  },

  /**
   * Redeem a free gift
   */
  redeemGift: function() {
    if (!confirm('Are you sure you want to redeem a free gift? A gift code will be added to your next order.')) {
      return;
    }

    fetch(`${this.apiUrl}/rewards/redeem-gift`, {
      method: 'POST',
      headers: AuthService.authHeaders()
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        throw new Error(data.error);
      }

      alert('Success! Your free gift has been redeemed. It will be included in your next order.');

      // Reload dashboard
      this.showLoading();
      this.loadUserRewards();
      this.loadRewardsHistory();
    })
    .catch(error => {
      alert(`Error: ${error.message || 'Unable to redeem gift. Please try again.'}`);
    });
  },

  /**
   * Get color for tier badge
   */
  getTierColor: function(tier) {
    const tierColors = {
      'Bronze': '#CD7F32',
      'Silver': '#C0C0C0',
      'Gold': '#FFD700',
      'Platinum': '#8B8B8B'
    };
    return tierColors[tier] || tierColors['Bronze'];
  },

  /**
   * Get next tier information
   */
  getNextTier: function(currentTier) {
    const tiers = {
      'Bronze': { name: 'Silver', minPurchases: 10 },
      'Silver': { name: 'Gold', minPurchases: 25 },
      'Gold': { name: 'Platinum', minPurchases: 50 },
      'Platinum': null
    };
    return tiers[currentTier] || tiers['Bronze'];
  },

  /**
   * Get icon for activity type
   */
  getTypeIcon: function(type) {
    const icons = {
      'earned': '<i class="fas fa-arrow-up text-success"></i>',
      'redeemed': '<i class="fas fa-arrow-down text-warning"></i>',
      'gift_redeemed': '<i class="fas fa-gift text-danger"></i>',
      'bonus': '<i class="fas fa-star text-primary"></i>',
      'purchase': '<i class="fas fa-shopping-cart text-success"></i>',
      'expired': '<i class="fas fa-clock text-muted"></i>'
    };
    return icons[type] || '<i class="fas fa-circle text-muted"></i>';
  },

  /**
   * Format date string to readable format
   */
  formatDate: function(dateStr) {
    if (!dateStr) return '';

    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateStr;
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('rewards-dashboard')) {
      RewardsDashboard.init();
    }
  });
} else {
  // DOM already loaded
  if (document.getElementById('rewards-dashboard')) {
    RewardsDashboard.init();
  }
}
