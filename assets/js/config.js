/**
 * VitalGuard AI - Central Configuration
 * assets/js/config.js
 *
 * NOTE: The endpoints defined below represent PROPOSED API contracts for future
 * backend integration and have NOT been verified against a real backend.
 * Do not assume a live backend server exists at these URIs.
 */

(function (window) {
  'use strict';

  var CONFIG = {
    APP_NAME: 'VitalGuard AI',
    APP_VERSION: '1.0.0-phase1',
    ENVIRONMENT: 'development',

    /**
     * Flag determining whether to route API calls to the local mock data provider
     * or attempt live network requests via fetch.
     * Default: true
     */
    MOCK_MODE: true,

    /**
     * Proposed Base URL for future backend API integration.
     * PROPOSED CONTRACT ONLY.
     */
    API_BASE_URL: 'https://api.vitalguard.test/v1',

    /**
     * Default network timeout for API requests in milliseconds.
     */
    REQUEST_TIMEOUT_MS: 8000,

    /**
     * Centralized Proposed API Endpoints.
     * All endpoints are PROPOSED contracts designed for future backend implementation.
     */
    ENDPOINTS: {
      AUTH_LOGIN: '/auth/login',                // POST
      USERS_ME: '/users/me',                    // GET
      ADMIN_DASHBOARD: '/admin/dashboard',      // GET
      ADMIN_PATIENTS: '/admin/patients',        // GET
      ADMIN_PATIENT_BY_ID: '/admin/patients/{id}', // GET
      ADMIN_OBSERVATIONS: '/admin/observations',// GET
      ADMIN_OBSERVATION_BY_ID: '/admin/observations/{id}', // GET
      ADMIN_PREDICTIONS: '/admin/predictions',  // GET
      ADMIN_PREDICTION_BY_ID: '/admin/predictions/{id}', // GET
      ADMIN_ALERTS: '/admin/alerts',            // GET
      ADMIN_ALERT_BY_ID: '/admin/alerts/{id}',  // PATCH
      ADMIN_USERS: '/admin/users',              // GET, POST
      ADMIN_USER_BY_ID: '/admin/users/{id}',    // GET, PATCH
      ADMIN_REPORTS: '/admin/reports',          // GET, POST
      ADMIN_REPORT_BY_ID: '/admin/reports/{id}', // GET
      ADMIN_AUDIT_LOGS: '/admin/audit-logs',    // GET
      ADMIN_AUDIT_LOG_BY_ID: '/admin/audit-logs/{id}' // GET
    },

    /**
     * Fictional demo credentials for testing Phase 1 mock authentication.
     * SHOWN ONLY WHEN MOCK_MODE === true.
     * THESE ARE SIMULATED ACCOUNTS AND MUST NEVER BE REPRESENTED AS REAL HEALTHCARE ACCOUNTS.
     */
    DEMO_CREDENTIALS: [
      {
        role: 'System Administrator',
        email: 'admin@demo.vitalguard.test',
        password: 'Demo@12345',
        badge: 'Admin Access',
        description: 'Complete administrative access across all system settings, audit logs, and controls.'
      },
      {
        role: 'Authorized Healthcare Staff',
        email: 'staff@demo.vitalguard.test',
        password: 'Staff@12345',
        badge: 'Staff Access',
        description: 'Access to patient monitoring, clinical observation feeds, and alert management.'
      },
      {
        role: 'Read-only Reviewer',
        email: 'reviewer@demo.vitalguard.test',
        password: 'Review@12345',
        badge: 'Reviewer Access',
        description: 'Read-only audit and report viewing permissions without editing capabilities.'
      }
    ],

    /**
     * Key used for demo session persistence in sessionStorage.
     * Documented: sessionStorage is used strictly for frontend demonstration
     * and does NOT provide secure authorization.
     */
    SESSION_STORAGE_KEY: 'vitalguard_demo_session'
  };

  // Expose configuration globally
  window.VitalGuardConfig = Object.freeze(CONFIG);
})(window);
