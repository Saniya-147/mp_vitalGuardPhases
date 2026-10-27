/**
 * VitalGuard AI - Authentication & Authorization Client
 * assets/js/auth.js
 *
 * CRITICAL SECURITY & ARCHITECTURAL DISCLAIMERS:
 * -------------------------------------------------------------------------
 * 1. FRONTEND DEMO ONLY: The session management in this file utilizes
 *    browser sessionStorage strictly for UI flow and prototype navigation.
 * 2. NO SECURE AUTHORIZATION: Client-side role checks (hasPermission, requireAuth)
 *    DO NOT provide real security. A future production backend must independently
 *    verify credentials, validate cryptographically signed tokens (e.g. JWT),
 *    and enforce access control policies on every endpoint.
 * 3. NO CREDENTIAL STORAGE: Plaintext passwords or secrets are NEVER stored in
 *    sessionStorage or localStorage.
 * 4. SIMULATION DATA: All user accounts and roles are synthetic examples.
 * -------------------------------------------------------------------------
 */

(function (window) {
  'use strict';

  var config = window.VitalGuardConfig || {};
  var SESSION_KEY = config.SESSION_STORAGE_KEY || 'vitalguard_demo_session';

  /**
   * Centralized Role-Based Permission Mapping.
   * Defines UI navigation capabilities for demonstration purposes.
   * NOTE: Frontend permission checks control interface visibility only.
   * The real backend must enforce authorization for every protected operation.
   * Never treat frontend role checks as a production security boundary.
   */
  var ROLE_PERMISSIONS = {
    'System Administrator': [
      'view:dashboard',
      'view:patients',
      'manage:patients',
      'deactivate:patients',
      'view:predictions',
      'view:alerts',
      'update:alerts',
      'view:users',
      'manage:users',
      'view:reports',
      'view:audit_logs'
    ],
    'Authorized Healthcare Staff': [
      'view:dashboard',
      'view:patients',
      'manage:patients',
      'view:predictions',
      'view:alerts',
      'update:alerts',
      'view:reports'
    ],
    'Read-only Reviewer': [
      'view:dashboard',
      'view:patients',
      'view:predictions',
      'view:alerts',
      'view:reports',
      'view:audit_logs'
    ]
  };

  var AuthService = {
    /**
     * Authenticates credentials via the central API client.
     * Never duplicates fetch logic; calls VitalGuardApi.request.
     *
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{ ok: boolean, user: object | null, error: string | null }>}
     */
    login: function (email, password) {
      if (!window.VitalGuardApi || typeof window.VitalGuardApi.request !== 'function') {
        return Promise.resolve({
          ok: false,
          user: null,
          error: 'API client is not loaded. Please ensure api.js is loaded.'
        });
      }

      var endpoint = (config.ENDPOINTS && config.ENDPOINTS.AUTH_LOGIN) || '/auth/login';

      return window.VitalGuardApi.request(endpoint, {
        method: 'POST',
        body: {
          email: String(email).trim(),
          password: String(password)
        }
      }).then(function (response) {
        if (response.ok && response.data && response.data.user) {
          var sessionData = {
            user: response.data.user,
            token: response.data.token || ('simulated-session-' + Date.now()),
            sessionType: response.data.sessionType || 'frontend-demo-simulation',
            loginTime: new Date().toISOString()
          };

          try {
            window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
          } catch (storageErr) {
            console.warn('Unable to persist session to sessionStorage:', storageErr);
          }

          return {
            ok: true,
            user: response.data.user,
            error: null
          };
        } else {
          return {
            ok: false,
            user: null,
            error: response.error || 'Authentication failed. Please verify your credentials.'
          };
        }
      });
    },

    /**
     * Terminates the current demo session by clearing sessionStorage.
     * @returns {boolean} True if successfully cleared
     */
    logout: function () {
      try {
        window.sessionStorage.removeItem(SESSION_KEY);
        window.sessionStorage.removeItem('vitalguard_mock_patients');
        window.sessionStorage.removeItem('vitalguard_mock_alerts');
        window.sessionStorage.removeItem('vitalguard_mock_users');
        window.sessionStorage.removeItem('vitalguard_mock_reports');
        return true;
      } catch (err) {
        console.error('Failed to clear demo session from storage:', err);
        return false;
      }
    },

    /**
     * Retrieves the currently active demo user, if any.
     * @returns {object | null}
     */
    getCurrentUser: function () {
      try {
        var raw = window.sessionStorage.getItem(SESSION_KEY);
        if (!raw) {
          return null;
        }
        var parsed = JSON.parse(raw);
        return (parsed && parsed.user) ? parsed.user : null;
      } catch (e) {
        return null;
      }
    },

    /**
     * Retrieves the entire raw demo session record.
     * @returns {object | null}
     */
    getCurrentSession: function () {
      try {
        var raw = window.sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    },

    /**
     * Checks if the active user possesses a specific permission.
     * @param {string} permission - The permission token to check (e.g. 'view:alerts')
     * @returns {boolean}
     */
    hasPermission: function (permission) {
      var user = this.getCurrentUser();
      if (!user || !user.role) {
        return false;
      }
      var rolePermissions = ROLE_PERMISSIONS[user.role] || [];
      return rolePermissions.indexOf(permission) !== -1;
    },

    /**
     * Returns an array of permissions granted to a given role name.
     * @param {string} roleName
     * @returns {string[]}
     */
    getPermissionsForRole: function (roleName) {
      return ROLE_PERMISSIONS[roleName] ? ROLE_PERMISSIONS[roleName].slice() : [];
    },

    /**
     * Route guard utility for protected pages.
     * If no authenticated session exists, redirects to login.html.
     *
     * @param {string} [redirectBackPath] - Optional path to return to after login
     * @returns {boolean} True if authenticated, false if redirecting
     */
    requireAuth: function (redirectBackPath) {
      var user = this.getCurrentUser();
      if (!user) {
        var currentPath = window.location.pathname;
        var inSubdir = currentPath.indexOf('/pages/') !== -1 || currentPath.indexOf('pages/') !== -1;
        var loginUrl = redirectBackPath || (inSubdir ? '../login.html' : 'login.html');
        if (currentPath && currentPath.indexOf('login.html') === -1 && currentPath !== '/') {
          var sep = loginUrl.indexOf('?') === -1 ? '?' : '&';
          loginUrl += sep + 'redirect=' + encodeURIComponent(currentPath);
        }
        window.location.href = loginUrl;
        return false;
      }
      return true;
    }
  };

  // Expose AuthService globally
  window.VitalGuardAuth = AuthService;
})(window);
