/**
 * VitalGuard AI - Centralized API Client
 * assets/js/api.js
 *
 * Implements a unified HTTP request helper with support for:
 * - Configurable Base URL and timeouts
 * - Authentication header injection
 * - Mock mode interception and simulated routing via mock-data.js
 * - Consistent response envelope: { ok: boolean, data: any, error: string | null }
 * - HTTP status code translation (401, 403, 5xx) with redirect-loop safeguards
 *
 * ARCHITECTURAL NOTICE:
 * Mock authentication and responses are for frontend demonstration only.
 * They do not provide production-grade security or authentication.
 */

(function (window) {
  'use strict';

  var ApiClient = {
    /**
     * Central request method.
     * All network and mock API calls across the application MUST use this method.
     *
     * @param {string} endpoint - The relative endpoint path (e.g. '/auth/login')
     * @param {object} [options] - Optional fetch configuration options
     * @returns {Promise<{ ok: boolean, data: any, error: string | null }>}
     */
    request: function (endpoint, options) {
      options = options || {};
      var config = window.VitalGuardConfig || {};
      var mockMode = Boolean(config.MOCK_MODE);
      var baseUrl = config.API_BASE_URL || '';
      var timeoutMs = options.timeout || config.REQUEST_TIMEOUT_MS || 8000;

      // -------------------------------------------------------------
      // 1. MOCK MODE INTERCEPTION
      // -------------------------------------------------------------
      if (mockMode && window.VitalGuardMockData && typeof window.VitalGuardMockData.handleRequest === 'function') {
        return window.VitalGuardMockData.handleRequest(endpoint, options)
          .then(function (res) {
            return {
              ok: Boolean(res.ok),
              data: res.data !== undefined ? res.data : null,
              error: res.error || null
            };
          })
          .catch(function (err) {
            return {
              ok: false,
              data: null,
              error: err && err.message ? err.message : 'An unexpected error occurred in simulated mode.'
            };
          });
      }

      // -------------------------------------------------------------
      // 2. LIVE NETWORK REQUEST (Real Backend Integration)
      // -------------------------------------------------------------
      var fullUrl = baseUrl ? (baseUrl.replace(/\/+$/, '') + '/' + endpoint.replace(/^\/+/, '')) : endpoint;

      var headers = {
        'Accept': 'application/json'
      };

      // Set Content-Type for requests with a payload
      if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json; charset=UTF-8';
        options.body = JSON.stringify(options.body);
      }

      // Inject authorization token if an authenticated session token exists
      try {
        var rawSession = window.sessionStorage.getItem(config.SESSION_STORAGE_KEY || 'vitalguard_demo_session');
        if (rawSession) {
          var sessionObj = JSON.parse(rawSession);
          if (sessionObj && sessionObj.token) {
            headers['Authorization'] = 'Bearer ' + sessionObj.token;
          }
        }
      } catch (storageErr) {
        // Suppress storage read failures
      }

      // Merge caller-provided headers
      if (options.headers) {
        for (var key in options.headers) {
          if (Object.prototype.hasOwnProperty.call(options.headers, key)) {
            headers[key] = options.headers[key];
          }
        }
      }
      options.headers = headers;

      // AbortController timeout setup
      var controller = null;
      var timeoutId = null;
      if (typeof window.AbortController === 'function') {
        controller = new window.AbortController();
        options.signal = controller.signal;
        timeoutId = setTimeout(function () {
          controller.abort();
        }, timeoutMs);
      }

      return window.fetch(fullUrl, options)
        .then(function (response) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          var statusCode = response.status;

          // 204 No Content or empty responses
          if (statusCode === 204) {
            return { ok: true, data: null, error: null };
          }

          // Read response body safely (JSON vs text vs empty)
          var contentType = response.headers.get('content-type') || '';
          var isJson = contentType.indexOf('application/json') !== -1;

          var parsePromise = isJson
            ? response.json().catch(function () { return null; })
            : response.text().catch(function () { return null; });

          return parsePromise.then(function (body) {
            // Handle HTTP 401 Unauthorized
            if (statusCode === 401) {
              // Avoid redirect loops when the login request itself fails with 401
              var isLoginRequest = endpoint.indexOf('/auth/login') !== -1;
              if (!isLoginRequest) {
                // Clear session and redirect to login page for protected requests
                try {
                  window.sessionStorage.removeItem(config.SESSION_STORAGE_KEY || 'vitalguard_demo_session');
                } catch (e) {}

                var currentPath = window.location.pathname;
                if (currentPath.indexOf('login.html') === -1) {
                  window.location.href = (window.location.origin || '') + '/login.html?reason=session_expired';
                }
              }

              var errorMsg = (body && body.error) ? body.error : 'Invalid credentials or unauthorized access.';
              return { ok: false, data: null, error: errorMsg };
            }

            // Handle HTTP 403 Forbidden
            if (statusCode === 403) {
              return {
                ok: false,
                data: null,
                error: 'Access denied: You do not have sufficient permissions to perform this action.'
              };
            }

            // Handle HTTP 5xx Server Errors
            if (statusCode >= 500) {
              return {
                ok: false,
                data: null,
                error: 'A server error occurred. Please contact system support if this condition persists.'
              };
            }

            // Other HTTP Errors
            if (!response.ok) {
              var genericMsg = (body && (body.error || body.message))
                ? (body.error || body.message)
                : 'Request failed with HTTP status ' + statusCode + '.';
              return { ok: false, data: null, error: genericMsg };
            }

            // Successful 2xx response
            return {
              ok: true,
              data: body,
              error: null
            };
          });
        })
        .catch(function (networkErr) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          if (networkErr && networkErr.name === 'AbortError') {
            return {
              ok: false,
              data: null,
              error: 'The request timed out. Please verify your connection and try again.'
            };
          }

          return {
            ok: false,
            data: null,
            error: 'Network error: Unable to reach the server. Please check your network connection.'
          };
        });
    }
  };

  // Expose ApiClient globally
  window.VitalGuardApi = ApiClient;
})(window);
