/**
 * VitalGuard AI - UI & DOM Utilities
 * assets/js/utils.js
 *
 * Implements accessible, secure UI helpers:
 * - Safe DOM manipulation using textContent (NO DYNAMIC innerHTML)
 * - Safe element construction and query selectors
 * - Toast notification dispatch system
 * - Accessible Modal focus trapping, escape-key handling, and focus restoration
 * - Date and timestamp formatters
 * - Debounce utility
 * - Accessible button loading-state managers
 */

(function (window) {
  'use strict';

  var Utils = {
    /**
     * Query selector shorthand
     * @param {string} selector
     * @param {Element|Document} [scope]
     * @returns {Element|null}
     */
    qs: function (selector, scope) {
      return (scope || document).querySelector(selector);
    },

    /**
     * Query selector all shorthand
     * @param {string} selector
     * @param {Element|Document} [scope]
     * @returns {Element[]}
     */
    qsa: function (selector, scope) {
      return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
    },

    /**
     * Safe DOM element builder without dynamic innerHTML
     * @param {string} tag
     * @param {object} [attributes]
     * @param {string|Element|Array} [children]
     * @returns {HTMLElement}
     */
    createElement: function (tag, attributes, children) {
      var el = document.createElement(tag);
      attributes = attributes || {};

      for (var key in attributes) {
        if (Object.prototype.hasOwnProperty.call(attributes, key)) {
          var val = attributes[key];
          if (key === 'className' || key === 'class') {
            el.className = val;
          } else if (key === 'textContent' || key === 'text') {
            el.textContent = val;
          } else if (key.indexOf('on') === 0 && typeof val === 'function') {
            el.addEventListener(key.substring(2).toLowerCase(), val);
          } else if (val !== null && val !== undefined && val !== false) {
            el.setAttribute(key, val === true ? '' : String(val));
          }
        }
      }

      if (children !== undefined && children !== null) {
        if (!Array.isArray(children)) {
          children = [children];
        }
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          if (typeof child === 'string' || typeof child === 'number') {
            el.appendChild(document.createTextNode(String(child)));
          } else if (child instanceof Node) {
            el.appendChild(child);
          }
        }
      }

      return el;
    },

    /**
     * Safe text content assignment
     * @param {Element|string} target
     * @param {string} text
     */
    setText: function (target, text) {
      var el = typeof target === 'string' ? this.qs(target) : target;
      if (el) {
        el.textContent = text !== null && text !== undefined ? String(text) : '';
      }
    },

    /**
     * Debounce function calls
     * @param {function} func
     * @param {number} wait
     * @returns {function}
     */
    debounce: function (func, wait) {
      var timeout;
      return function () {
        var context = this;
        var args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function () {
          func.apply(context, args);
        }, wait || 250);
      };
    },

    /**
     * Date formatter (YYYY-MM-DD)
     * @param {string|Date} dateVal
     * @returns {string}
     */
    formatDate: function (dateVal) {
      if (!dateVal) return 'N/A';
      var d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'Invalid Date';
      var month = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return d.getFullYear() + '-' + month + '-' + day;
    },

    /**
     * Formats date with time (YYYY-MM-DD HH:mm:ss)
     * @param {string|Date} dateVal
     * @returns {string}
     */
    formatDateTime: function (dateVal) {
      if (!dateVal) return 'N/A';
      var d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'Invalid Date';
      var dateStr = this.formatDate(d);
      var hours = String(d.getHours()).padStart(2, '0');
      var mins = String(d.getMinutes()).padStart(2, '0');
      var secs = String(d.getSeconds()).padStart(2, '0');
      return dateStr + ' ' + hours + ':' + mins + ':' + secs;
    },

    /**
     * Toast notification manager
     * @param {string} message
     * @param {'info'|'success'|'warning'|'error'} [type]
     * @param {number} [durationMs]
     */
    showToast: function (message, type, durationMs) {
      type = type || 'info';
      durationMs = durationMs || 4000;

      var container = this.qs('#toast-container');
      if (!container) {
        container = this.createElement('div', {
          id: 'toast-container',
          className: 'toast-container',
          'aria-live': 'polite',
          'aria-atomic': 'true'
        });
        document.body.appendChild(container);
      }

      var toast = this.createElement('div', {
        className: 'toast toast-' + type,
        role: type === 'error' ? 'alert' : 'status'
      });

      var textSpan = this.createElement('span', {
        textContent: message
      });

      toast.appendChild(textSpan);
      container.appendChild(toast);

      setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, durationMs);
    },

    /**
     * Manages accessible loading state on a button.
     * Prevents duplicate clicks and provides screen-reader announcement.
     *
     * @param {HTMLButtonElement} buttonEl
     * @param {string} loadingText
     * @returns {function} Function to restore button state
     */
    setButtonLoading: function (buttonEl, loadingText) {
      if (!buttonEl) return function () {};

      var originalText = buttonEl.textContent;
      var originalDisabled = buttonEl.disabled;

      buttonEl.disabled = true;
      buttonEl.setAttribute('aria-busy', 'true');

      // Clear button content safely
      while (buttonEl.firstChild) {
        buttonEl.removeChild(buttonEl.firstChild);
      }

      var spinner = this.createElement('span', {
        className: 'spinner',
        'aria-hidden': 'true'
      });

      var textNode = document.createTextNode(' ' + (loadingText || 'Processing...'));

      buttonEl.appendChild(spinner);
      buttonEl.appendChild(textNode);

      return function restore() {
        buttonEl.disabled = originalDisabled;
        buttonEl.removeAttribute('aria-busy');
        while (buttonEl.firstChild) {
          buttonEl.removeChild(buttonEl.firstChild);
        }
        buttonEl.textContent = originalText;
      };
    },

    /**
     * Accessible Modal Dialog Controller
     * Implements dialog semantics, focus trapping, Escape handling, and focus restoration.
     *
     * @param {object} options
     * @param {string} options.title - Dialog Title
     * @param {HTMLElement|string} options.content - Content element or string
     * @param {HTMLElement[]} [options.actions] - Array of action button elements
     * @param {function} [options.onClose] - Callback when closed
     * @returns {{ close: function }}
     */
    openModal: function (options) {
      options = options || {};
      var previousFocusedElement = document.activeElement;

      var backdrop = this.createElement('div', {
        className: 'modal-backdrop',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'modal-dialog-title'
      });

      var dialog = this.createElement('div', { className: 'modal-dialog' });
      var header = this.createElement('div', { className: 'modal-header' });
      var title = this.createElement('h2', {
        id: 'modal-dialog-title',
        className: 'modal-title',
        textContent: options.title || 'Dialog'
      });

      var closeBtn = this.createElement('button', {
        type: 'button',
        className: 'modal-close-btn',
        'aria-label': 'Close dialog',
        textContent: '×'
      });

      header.appendChild(title);
      header.appendChild(closeBtn);

      var body = this.createElement('div', { className: 'modal-body' });
      if (typeof options.content === 'string') {
        var p = this.createElement('p', { textContent: options.content });
        body.appendChild(p);
      } else if (options.content instanceof Node) {
        body.appendChild(options.content);
      }

      var footer = this.createElement('div', { className: 'modal-footer' });
      if (options.actions && Array.isArray(options.actions)) {
        for (var a = 0; a < options.actions.length; a++) {
          var actionBtn = options.actions[a];
          if (actionBtn && actionBtn.getAttribute && actionBtn.getAttribute('type') === 'submit' && options.content && options.content.tagName === 'FORM' && options.content.id) {
            if (!actionBtn.getAttribute('form')) {
              actionBtn.setAttribute('form', options.content.id);
            }
          }
          footer.appendChild(actionBtn);
        }
      } else {
        var defaultClose = this.createElement('button', {
          type: 'button',
          className: 'btn btn-secondary',
          textContent: 'Close'
        });
        defaultClose.addEventListener('click', closeModal);
        footer.appendChild(defaultClose);
      }

      dialog.appendChild(header);
      dialog.appendChild(body);
      dialog.appendChild(footer);
      backdrop.appendChild(dialog);
      document.body.appendChild(backdrop);

      // Force reflow and reveal
      void backdrop.offsetWidth;
      backdrop.classList.add('is-open');

      function closeModal() {
        backdrop.classList.remove('is-open');
        document.removeEventListener('keydown', handleKeyDown);
        setTimeout(function () {
          if (backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
          }
          if (previousFocusedElement && typeof previousFocusedElement.focus === 'function') {
            previousFocusedElement.focus();
          }
          if (typeof options.onClose === 'function') {
            options.onClose();
          }
        }, 200);
      }

      closeBtn.addEventListener('click', closeModal);

      // Dismiss on backdrop click
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) {
          closeModal();
        }
      });

      // Accessible Focus Trap & Escape key handler
      function handleKeyDown(e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
          e.preventDefault();
          closeModal();
          return;
        }

        if (e.key === 'Tab' || e.keyCode === 9) {
          var focusableElements = dialog.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length === 0) return;

          var first = focusableElements[0];
          var last = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      }

      document.addEventListener('keydown', handleKeyDown);

      // Focus first actionable element inside dialog
      setTimeout(function () {
        var focusable = dialog.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) {
          focusable.focus();
        }
      }, 50);

      return {
        close: closeModal
      };
    }
  };

  // Expose Utils globally
  window.VitalGuardUtils = Utils;
})(window);
