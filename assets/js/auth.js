/**
 * AuthService - Authentication module for Sister's Promise
 * Manages user authentication, JWT tokens, and navbar state
 */
const AuthService = {
  // API configuration
  apiUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : window.location.protocol + '//' + window.location.host + '/api',

  // Storage keys
  TOKEN_KEY: 'sp_auth_token',
  USER_KEY: 'sp_auth_user',

  /**
   * XSS sanitization using DOM API
   */
  sanitize: function(str) {
    if (typeof str !== 'string') return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Get stored authentication token
   */
  getToken: function() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  /**
   * Store authentication token
   */
  setToken: function(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  },

  /**
   * Get stored user object
   */
  getUser: function() {
    try {
      var userStr = localStorage.getItem(this.USER_KEY);
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      this.clearAuth();
      return null;
    }
  },

  /**
   * Store user object
   */
  setUser: function(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  /**
   * Clear all authentication data
   */
  clearAuth: function() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  /**
   * Check if user is logged in with valid token
   */
  isLoggedIn: function() {
    try {
      var token = this.getToken();
      if (!token) return false;

      // Decode JWT payload (middle segment)
      var parts = token.split('.');
      if (parts.length !== 3) {
        this.clearAuth();
        return false;
      }

      var payload = JSON.parse(atob(parts[1]));

      // Check expiration
      if (!payload.exp || payload.exp * 1000 <= Date.now()) {
        this.clearAuth();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking login status:', error);
      this.clearAuth();
      return false;
    }
  },

  /**
   * Get headers for authenticated requests
   */
  authHeaders: function() {
    var headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };

    var token = this.getToken();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    return headers;
  },

  /**
   * Register a new user
   */
  register: function(userData) {
    var self = this;
    return fetch(this.apiUrl + '/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName
      })
    })
    .then(function(response) {
      return response.json().then(function(data) {
        return { status: response.status, data: data };
      });
    })
    .then(function(result) {
      if (result.status === 200 || result.status === 201) {
        if (result.data.success && result.data.token && result.data.data && result.data.data.user) {
          self.setToken(result.data.token);
          self.setUser(result.data.data.user);
          self.updateNavbar();
          return result.data;
        }
      }
      throw new Error(result.data.message || 'Registration failed');
    });
  },

  /**
   * Log in an existing user
   */
  login: function(credentials) {
    var self = this;
    return fetch(this.apiUrl + '/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    })
    .then(function(response) {
      return response.json().then(function(data) {
        return { status: response.status, data: data };
      });
    })
    .then(function(result) {
      if (result.status === 200) {
        if (result.data.success && result.data.token && result.data.user) {
          self.setToken(result.data.token);
          self.setUser(result.data.user);
          self.updateNavbar();
          return result.data;
        }
      }
      throw new Error(result.data.message || 'Login failed');
    });
  },

  /**
   * Log out the current user
   */
  logout: function() {
    this.clearAuth();
    this.updateNavbar();

    // Reload if on rewards page with dashboard active
    if (window.location.pathname.includes('rewards.html')) {
      var urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('view') === 'dashboard') {
        window.location.reload();
      }
    }
  },

  /**
   * Get current user profile from server
   */
  getProfile: function() {
    var self = this;
    return fetch(this.apiUrl + '/users/profile', {
      method: 'GET',
      headers: this.authHeaders()
    })
    .then(function(response) {
      if (response.status === 401) {
        self.clearAuth();
        throw new Error('Unauthorized');
      }
      return response.json();
    })
    .then(function(data) {
      if (data.success && data.data && data.data.user) {
        self.setUser(data.data.user);
        return data.data.user;
      }
      throw new Error(data.message || 'Failed to fetch profile');
    });
  },

  /**
   * Get correct path for page links based on current location
   */
  getPagePath: function(page) {
    if (window.location.pathname.includes('/pages/')) {
      return page;
    }
    return './pages/' + page;
  },

  /**
   * Update navbar to reflect current authentication state
   */
  updateNavbar: function() {
    var navItem = document.getElementById('auth-nav-item');
    if (!navItem) return;

    if (this.isLoggedIn()) {
      var user = this.getUser();
      if (!user) return;

      // Use firstName if available, otherwise email prefix
      var displayName = user.firstName || user.email.split('@')[0];
      displayName = this.sanitize(displayName);

      navItem.innerHTML =
        '<div class="nav-item dropdown">' +
          '<a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" ' +
             'data-bs-toggle="dropdown" aria-expanded="false">' +
            '<i class="fas fa-user-circle" style="color: #C9A961;"></i> ' +
            '<span class="ms-1">' + displayName + '</span>' +
          '</a>' +
          '<ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">' +
            '<li>' +
              '<a class="dropdown-item" href="' + this.getPagePath('rewards.html') + '">' +
                '<i class="fas fa-gift me-2"></i>My Rewards' +
              '</a>' +
            '</li>' +
            '<li><hr class="dropdown-divider"></li>' +
            '<li>' +
              '<a class="dropdown-item" href="#" id="sign-out-link">' +
                '<i class="fas fa-sign-out-alt me-2"></i>Sign Out' +
              '</a>' +
            '</li>' +
          '</ul>' +
        '</div>';

      // Attach logout handler
      var signOutLink = document.getElementById('sign-out-link');
      if (signOutLink) {
        signOutLink.addEventListener('click', function(e) {
          e.preventDefault();
          AuthService.logout();
        });
      }
    } else {
      // Not logged in - show sign in link
      navItem.innerHTML =
        '<a class="nav-link" href="' + this.getPagePath('sign-in.html') + '">' +
          '<i class="fas fa-sign-in-alt" style="color: #C9A961;"></i> ' +
          '<span class="ms-1">Sign In</span>' +
        '</a>';
    }
  },

  /**
   * Initialize the auth service
   */
  init: function() {
    // Clear expired tokens
    if (this.getToken() && !this.isLoggedIn()) {
      this.clearAuth();
    }

    // Update navbar
    this.updateNavbar();
  }
};

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    AuthService.init();
  });
} else {
  AuthService.init();
}
