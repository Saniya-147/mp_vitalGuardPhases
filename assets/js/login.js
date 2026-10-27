/**
 * VitalGuard AI - Login Page Interaction Controller
 * assets/js/login.js
 *
 * Implements accessible client-side form validation, password visibility toggling,
 * credential submission via VitalGuardAuth, demo account quick-fill, and Phase 1
 * authentication success states.
 */

(function (window, document) {
  'use strict';

  var Utils = window.VitalGuardUtils;
  var Auth = window.VitalGuardAuth;
  var Config = window.VitalGuardConfig || {};

  var REMEMBERED_EMAIL_KEY = 'vitalguard_remembered_email';

  // DOM Elements
  var form = null;
  var emailInput = null;
  var passwordInput = null;
  var emailError = null;
  var passwordError = null;
  var submitBtn = null;
  var togglePasswordBtn = null;
  var eyeShowIcon = null;
  var eyeHideIcon = null;
  var rememberCheck = null;
  var alertContainer = null;
  var demoBannerContainer = null;
  var demoCredentialsContainer = null;
  var demoCredentialsList = null;
  var successCard = null;

  /**
   * Initializes the login interface once the DOM is ready.
   */
  function init() {
    form = Utils.qs('#login-form');
    emailInput = Utils.qs('#input-email');
    passwordInput = Utils.qs('#input-password');
    emailError = Utils.qs('#email-error');
    passwordError = Utils.qs('#password-error');
    submitBtn = Utils.qs('#btn-login-submit');
    togglePasswordBtn = Utils.qs('#btn-toggle-password');
    eyeShowIcon = Utils.qs('#icon-eye-show');
    eyeHideIcon = Utils.qs('#icon-eye-hide');
    rememberCheck = Utils.qs('#check-remember');
    alertContainer = Utils.qs('#login-alert-container');
    demoBannerContainer = Utils.qs('#demo-banner-container');
    demoCredentialsContainer = Utils.qs('#demo-credentials-container');
    demoCredentialsList = Utils.qs('#demo-credentials-list');
    successCard = Utils.qs('#auth-success-card');

    if (!form || !emailInput || !passwordInput || !submitBtn) {
      return;
    }

    // 1. Setup Password Visibility Toggle
    setupPasswordToggle();

    // 2. Setup Form Events & Validation
    setupFormEvents();

    // 3. Render Mock / Demo Elements if MOCK_MODE is enabled
    renderDemoElements();

    // 4. Handle Remembered Email
    restoreRememberedEmail();

    // 5. Handle URL Query Parameters (e.g. session expired)
    handleUrlParameters();

    // 6. Check existing demo session
    checkExistingSession();
  }

  /**
   * Configures accessible password visibility toggle button.
   */
  function setupPasswordToggle() {
    if (!togglePasswordBtn || !passwordInput) return;

    togglePasswordBtn.addEventListener('click', function () {
      var isCurrentlyPassword = passwordInput.getAttribute('type') === 'password';
      if (isCurrentlyPassword) {
        passwordInput.setAttribute('type', 'text');
        togglePasswordBtn.setAttribute('aria-pressed', 'true');
        togglePasswordBtn.setAttribute('aria-label', 'Hide password');
        if (eyeShowIcon) eyeShowIcon.style.display = 'none';
        if (eyeHideIcon) eyeHideIcon.style.display = 'block';
      } else {
        passwordInput.setAttribute('type', 'password');
        togglePasswordBtn.setAttribute('aria-pressed', 'false');
        togglePasswordBtn.setAttribute('aria-label', 'Show password as plain text');
        if (eyeShowIcon) eyeShowIcon.style.display = 'block';
        if (eyeHideIcon) eyeHideIcon.style.display = 'none';
      }
      passwordInput.focus();
    });
  }

  /**
   * Configures form submit and input events.
   */
  function setupFormEvents() {
    form.addEventListener('submit', handleFormSubmit);

    emailInput.addEventListener('input', function () {
      clearFieldError(emailInput, emailError);
      clearTopAlert();
    });

    passwordInput.addEventListener('input', function () {
      clearFieldError(passwordInput, passwordError);
      clearTopAlert();
    });
  }

  /**
   * Validates email format according to standard pattern.
   */
  function isValidEmail(email) {
    var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Clears a specific field's error state.
   */
  function clearFieldError(inputEl, errorEl) {
    if (inputEl) {
      inputEl.classList.remove('is-invalid');
      inputEl.removeAttribute('aria-invalid');
    }
    if (errorEl) {
      while (errorEl.firstChild) {
        errorEl.removeChild(errorEl.firstChild);
      }
    }
  }

  /**
   * Sets a specific field error with accessible attributes.
   */
  function setFieldError(inputEl, errorEl, message) {
    if (inputEl) {
      inputEl.classList.add('is-invalid');
      inputEl.setAttribute('aria-invalid', 'true');
    }
    if (errorEl) {
      while (errorEl.firstChild) {
        errorEl.removeChild(errorEl.firstChild);
      }
      var errorSpan = Utils.createElement('span', { textContent: message });
      errorEl.appendChild(errorSpan);
    }
  }

  /**
   * Displays an accessible top-level alert message.
   */
  function showTopAlert(message, type) {
    if (!alertContainer) return;
    type = type || 'error';

    while (alertContainer.firstChild) {
      alertContainer.removeChild(alertContainer.firstChild);
    }

    var alertDiv = Utils.createElement('div', {
      className: 'alert alert-' + type,
      role: 'alert'
    });

    var contentDiv = Utils.createElement('div', {
      className: 'alert-content',
      textContent: message
    });

    alertDiv.appendChild(contentDiv);
    alertContainer.appendChild(alertDiv);
    alertContainer.style.display = 'block';
  }

  /**
   * Clears the top-level alert.
   */
  function clearTopAlert() {
    if (alertContainer) {
      while (alertContainer.firstChild) {
        alertContainer.removeChild(alertContainer.firstChild);
      }
      alertContainer.style.display = 'none';
    }
  }

  /**
   * Main login submission handler.
   */
  function handleFormSubmit(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    clearTopAlert();

    var email = emailInput.value.trim();
    var password = passwordInput.value;
    var isValid = true;

    // Validate Email
    if (!email) {
      setFieldError(emailInput, emailError, 'Email address is required.');
      isValid = false;
    } else if (!isValidEmail(email)) {
      setFieldError(emailInput, emailError, 'Please enter a valid email address format.');
      isValid = false;
    } else {
      clearFieldError(emailInput, emailError);
    }

    // Validate Password
    if (!password) {
      setFieldError(passwordInput, passwordError, 'Password is required.');
      isValid = false;
    } else {
      clearFieldError(passwordInput, passwordError);
    }

    if (!isValid) {
      // Focus first erroneous field
      if (emailInput.getAttribute('aria-invalid') === 'true') {
        emailInput.focus();
      } else if (passwordInput.getAttribute('aria-invalid') === 'true') {
        passwordInput.focus();
      }
      return;
    }

    // Prevent duplicate submissions and trigger loading state
    var restoreButton = Utils.setButtonLoading(submitBtn, 'Verifying credentials...');
    emailInput.disabled = true;
    passwordInput.disabled = true;

    // Save remembered email if selected
    try {
      if (rememberCheck && rememberCheck.checked) {
        window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      } else {
        window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    } catch (storageErr) {}

    // Dispatch login call through central AuthService
    Auth.login(email, password)
      .then(function (result) {
        restoreButton();
        emailInput.disabled = false;
        passwordInput.disabled = false;

        if (result.ok && result.user) {
          displaySessionSuccess(result.user);
          Utils.showToast('Authentication verified. Redirecting to dashboard...', 'success');
          var searchParams = new URLSearchParams(window.location.search);
          var redirectTarget = searchParams.get('redirect') || 'pages/dashboard.html';
          setTimeout(function () {
            window.location.href = redirectTarget;
          }, 350);
        } else {
          showTopAlert(result.error || 'Authentication failed. Please check your credentials.', 'error');
          passwordInput.value = '';
          passwordInput.focus();
        }
      })
      .catch(function (err) {
        restoreButton();
        emailInput.disabled = false;
        passwordInput.disabled = false;
        showTopAlert('An unexpected error occurred during login. Please try again.', 'error');
      });
  }

  /**
   * Displays the Phase 1 verified session state card.
   */
  function displaySessionSuccess(user) {
    if (!successCard || !form) return;

    Utils.setText('#success-user-name', user.name || 'Healthcare Professional');
    Utils.setText('#success-user-role', user.role || 'Staff');
    Utils.setText('#success-user-email', user.email || '');

    form.style.display = 'none';
    if (demoCredentialsContainer) {
      demoCredentialsContainer.style.display = 'none';
    }
    successCard.style.display = 'block';

    // Setup session card button actions
    var logoutBtn = Utils.qs('#btn-session-logout');
    if (logoutBtn) {
      logoutBtn.onclick = function () {
        Auth.logout();
        successCard.style.display = 'none';
        form.style.display = 'block';
        if (Config.MOCK_MODE && demoCredentialsContainer) {
          demoCredentialsContainer.style.display = 'block';
        }
        passwordInput.value = '';
        clearFieldError(emailInput, emailError);
        clearFieldError(passwordInput, passwordError);
        clearTopAlert();
        Utils.showToast('Session cleared. You have logged out.', 'info');
        emailInput.focus();
      };
    }

    var retestBtn = Utils.qs('#btn-test-another-role');
    if (retestBtn) {
      retestBtn.onclick = function () {
        Auth.logout();
        successCard.style.display = 'none';
        form.style.display = 'block';
        if (Config.MOCK_MODE && demoCredentialsContainer) {
          demoCredentialsContainer.style.display = 'block';
        }
        passwordInput.value = '';
        clearTopAlert();
        emailInput.focus();
      };
    }
  }

  /**
   * Renders the Demo Mode banner and quick-fill credentials if MOCK_MODE === true.
   */
  function renderDemoElements() {
    var isMockMode = Boolean(Config.MOCK_MODE);

    if (demoBannerContainer) {
      demoBannerContainer.style.display = isMockMode ? 'block' : 'none';
    }

    if (!demoCredentialsContainer || !demoCredentialsList) {
      return;
    }

    if (!isMockMode) {
      demoCredentialsContainer.style.display = 'none';
      return;
    }

    demoCredentialsContainer.style.display = 'block';
    while (demoCredentialsList.firstChild) {
      demoCredentialsList.removeChild(demoCredentialsList.firstChild);
    }

    var credentials = Config.DEMO_CREDENTIALS || [];
    for (var i = 0; i < credentials.length; i++) {
      (function (cred) {
        var card = Utils.createElement('div', {
          className: 'card',
          style: 'padding: var(--space-sm); border: 1px solid var(--color-border-light); background-color: var(--color-bg-subtle); display: flex; justify-content: space-between; align-items: center; gap: var(--space-xs); flex-wrap: wrap;'
        });

        var textContainer = Utils.createElement('div', {
          style: 'flex: 1; min-width: 12rem;'
        });

        var roleHeader = Utils.createElement('div', {
          style: 'display: flex; align-items: center; gap: var(--space-2xs); margin-bottom: 2px;'
        });

        var roleTitle = Utils.createElement('strong', {
          style: 'font-size: var(--font-size-xs); color: var(--color-primary-navy);',
          textContent: cred.role
        });

        roleHeader.appendChild(roleTitle);

        var emailText = Utils.createElement('div', {
          style: 'font-size: var(--font-size-xs); color: var(--color-text-secondary); font-family: var(--font-family-mono);',
          textContent: cred.email
        });

        var pwdText = Utils.createElement('div', {
          style: 'font-size: var(--font-size-2xs); color: var(--color-text-muted);',
          textContent: 'Password: ' + cred.password
        });

        textContainer.appendChild(roleHeader);
        textContainer.appendChild(emailText);
        textContainer.appendChild(pwdText);

        var actionBtn = Utils.createElement('button', {
          type: 'button',
          className: 'btn btn-outline btn-sm',
          textContent: 'Use Account',
          'aria-label': 'Populate credentials for ' + cred.role
        });

        actionBtn.addEventListener('click', function () {
          emailInput.value = cred.email;
          passwordInput.value = cred.password;
          clearFieldError(emailInput, emailError);
          clearFieldError(passwordInput, passwordError);
          clearTopAlert();
          emailInput.focus();
        });

        card.appendChild(textContainer);
        card.appendChild(actionBtn);
        demoCredentialsList.appendChild(card);
      })(credentials[i]);
    }
  }

  /**
   * Restores previously saved email from localStorage if user opted to remember.
   */
  function restoreRememberedEmail() {
    try {
      var saved = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (saved && emailInput) {
        emailInput.value = saved;
        if (rememberCheck) {
          rememberCheck.checked = true;
        }
      }
    } catch (e) {}
  }

  /**
   * Handles query params such as ?reason=session_expired
   */
  function handleUrlParameters() {
    try {
      var search = window.location.search;
      if (search && search.indexOf('reason=session_expired') !== -1) {
        showTopAlert('Your authenticated session has expired. Please sign in again.', 'warning');
      }
    } catch (e) {}
  }

  /**
   * Checks if a valid session already exists in sessionStorage.
   */
  function checkExistingSession() {
    var user = Auth.getCurrentUser();
    if (user) {
      displaySessionSuccess(user);
    }
  }

  // Bind to DOMContentLoaded or execute immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
