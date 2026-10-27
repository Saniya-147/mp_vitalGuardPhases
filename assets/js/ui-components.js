/**
 * VitalGuard AI - Reusable UI Components & Helpers
 * assets/js/ui-components.js
 *
 * Provides modular, accessible, WCAG-compliant UI component generators:
 * - Pagination control with page sizes and "Showing X-Y of Z" summary
 * - Accessible confirmation modals with focus management
 * - Sortable table headers with aria-sort indicators
 * - Loading, empty, and API error states
 * - Date range calculations and form validation helpers
 *
 * SAFE DOM MANDATE: Uses createElement and textContent exclusively.
 * Zero dynamic innerHTML execution.
 */

(function (window, document) {
  'use strict';

  var Utils = window.VitalGuardUtils;

  var UIComponents = {
    /**
     * Builds an accessible pagination navigation bar.
     *
     * @param {object} options
     * @param {number} options.page - Current 1-based page
     * @param {number} options.pageSize - Current page size
     * @param {number} options.total - Total number of items
     * @param {function} options.onPageChange - Callback(newPage)
     * @param {function} options.onPageSizeChange - Callback(newPageSize)
     * @param {string} [options.itemName] - Label for items (default: "patients")
     * @returns {HTMLElement} Container DOM node
     */
    createPagination: function (options) {
      options = options || {};
      var page = Math.max(1, parseInt(options.page, 10) || 1);
      var pageSize = Math.max(1, parseInt(options.pageSize, 10) || 10);
      var total = Math.max(0, parseInt(options.total, 10) || 0);
      var itemName = options.itemName || 'records';
      var totalPages = Math.max(1, Math.ceil(total / pageSize));

      var startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
      var endItem = Math.min(total, page * pageSize);

      var container = Utils.createElement('div', {
        className: 'pagination-bar',
        role: 'navigation',
        'aria-label': 'Pagination Navigation'
      });

      // 1. "Showing X-Y of Z" summary and page-size selector
      var leftGroup = Utils.createElement('div', { className: 'pagination-summary-group' });

      var summaryText = 'Showing ' + startItem + '–' + endItem + ' of ' + total + ' ' + itemName;
      var summaryEl = Utils.createElement('span', {
        className: 'pagination-summary',
        textContent: summaryText
      });
      leftGroup.appendChild(summaryEl);

      // Page size dropdown
      var pageSizeWrapper = Utils.createElement('div', { className: 'pagination-pagesize-wrapper' });
      var pageSizeLabel = Utils.createElement('label', {
        className: 'pagination-pagesize-label',
        htmlFor: 'pagination-pagesize-select',
        textContent: 'Rows per page:'
      });

      var pageSizeSelect = Utils.createElement('select', {
        id: 'pagination-pagesize-select',
        className: 'form-control pagination-pagesize-select',
        'aria-label': 'Select rows per page'
      });

      var sizes = [10, 25, 50];
      for (var s = 0; s < sizes.length; s++) {
        var opt = Utils.createElement('option', {
          value: String(sizes[s]),
          textContent: String(sizes[s])
        });
        if (sizes[s] === pageSize) {
          opt.selected = true;
        }
        pageSizeSelect.appendChild(opt);
      }

      pageSizeSelect.addEventListener('change', function () {
        var newSize = parseInt(pageSizeSelect.value, 10);
        if (typeof options.onPageSizeChange === 'function') {
          options.onPageSizeChange(newSize);
        }
      });

      pageSizeWrapper.appendChild(pageSizeLabel);
      pageSizeWrapper.appendChild(pageSizeSelect);
      leftGroup.appendChild(pageSizeWrapper);

      // 2. Navigation controls (Previous, Page Numbers, Next)
      var navGroup = Utils.createElement('div', { className: 'pagination-nav-group' });

      // Previous button
      var prevBtn = Utils.createElement('button', {
        type: 'button',
        className: 'btn btn-outline btn-sm pagination-btn pagination-prev',
        'aria-label': 'Go to previous page',
        disabled: page <= 1,
        textContent: 'Previous'
      });
      prevBtn.addEventListener('click', function () {
        if (page > 1 && typeof options.onPageChange === 'function') {
          options.onPageChange(page - 1);
        }
      });
      navGroup.appendChild(prevBtn);

      // Numeric page buttons
      var pageNumList = Utils.createElement('div', { className: 'pagination-numbers' });

      // Determine page numbers range to render (max 5 visible)
      var startPage = Math.max(1, page - 2);
      var endPage = Math.min(totalPages, startPage + 4);
      if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
      }

      if (startPage > 1) {
        var firstBtn = Utils.createElement('button', {
          type: 'button',
          className: 'pagination-page-btn',
          'aria-label': 'Go to page 1',
          textContent: '1'
        });
        firstBtn.addEventListener('click', function () {
          if (typeof options.onPageChange === 'function') options.onPageChange(1);
        });
        pageNumList.appendChild(firstBtn);

        if (startPage > 2) {
          pageNumList.appendChild(Utils.createElement('span', { className: 'pagination-ellipsis', textContent: '…' }));
        }
      }

      for (var p = startPage; p <= endPage; p++) {
        (function (pNum) {
          var isCurrent = pNum === page;
          var pBtn = Utils.createElement('button', {
            type: 'button',
            className: 'pagination-page-btn' + (isCurrent ? ' is-active' : ''),
            'aria-label': isCurrent ? ('Page ' + pNum + ', current page') : ('Go to page ' + pNum),
            textContent: String(pNum)
          });
          if (isCurrent) {
            pBtn.setAttribute('aria-current', 'page');
          }
          pBtn.addEventListener('click', function () {
            if (pNum !== page && typeof options.onPageChange === 'function') {
              options.onPageChange(pNum);
            }
          });
          pageNumList.appendChild(pBtn);
        })(p);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumList.appendChild(Utils.createElement('span', { className: 'pagination-ellipsis', textContent: '…' }));
        }
        var lastBtn = Utils.createElement('button', {
          type: 'button',
          className: 'pagination-page-btn',
          'aria-label': 'Go to page ' + totalPages,
          textContent: String(totalPages)
        });
        lastBtn.addEventListener('click', function () {
          if (typeof options.onPageChange === 'function') options.onPageChange(totalPages);
        });
        pageNumList.appendChild(lastBtn);
      }

      navGroup.appendChild(pageNumList);

      // Next button
      var nextBtn = Utils.createElement('button', {
        type: 'button',
        className: 'btn btn-outline btn-sm pagination-btn pagination-next',
        'aria-label': 'Go to next page',
        disabled: page >= totalPages,
        textContent: 'Next'
      });
      nextBtn.addEventListener('click', function () {
        if (page < totalPages && typeof options.onPageChange === 'function') {
          options.onPageChange(page + 1);
        }
      });
      navGroup.appendChild(nextBtn);

      container.appendChild(leftGroup);
      container.appendChild(navGroup);

      return container;
    },

    /**
     * Accessible Confirmation Modal Dialog.
     * Handles focus trapping, Escape dismissal, focus restoration, and accessible buttons.
     *
     * @param {object} options
     * @param {string} options.title - Dialog Title
     * @param {string} options.message - Warning / explanation message
     * @param {string} [options.confirmText] - Default: "Confirm"
     * @param {string} [options.cancelText] - Default: "Cancel"
     * @param {string} [options.confirmVariant] - 'btn-error' | 'btn-primary'
     * @param {function} options.onConfirm
     * @param {function} [options.onCancel]
     */
    showConfirmModal: function (options) {
      options = options || {};
      var confirmVariant = options.confirmVariant || 'btn-error';

      var bodyContent = Utils.createElement('div', {}, [
        Utils.createElement('p', {
          style: 'color: var(--color-text-secondary); line-height: 1.5; margin-bottom: var(--space-sm);',
          textContent: options.message || 'Are you sure you want to proceed with this operation?'
        }),
        Utils.createElement('div', {
          className: 'alert alert-warning',
          style: 'font-size: var(--font-size-xs); margin: 0;'
        }, [
          Utils.createElement('div', {
            className: 'alert-title',
            textContent: 'Demo Simulation Notice'
          }),
          Utils.createElement('div', {
            textContent: 'This action is simulated in the browser session. No actual records or database rows are deleted.'
          })
        ])
      ]);

      var cancelBtn = Utils.createElement('button', {
        type: 'button',
        className: 'btn btn-outline',
        textContent: options.cancelText || 'Cancel'
      });

      var confirmBtn = Utils.createElement('button', {
        type: 'button',
        className: 'btn ' + (confirmVariant === 'btn-error' ? 'btn-secondary' : 'btn-primary'),
        style: confirmVariant === 'btn-error' ? 'background-color: var(--color-error); border-color: var(--color-error); color: #fff;' : '',
        textContent: options.confirmText || 'Confirm'
      });

      var modalInstance = Utils.openModal({
        title: options.title || 'Confirm Action',
        content: bodyContent,
        actions: [cancelBtn, confirmBtn],
        onClose: options.onCancel
      });

      cancelBtn.addEventListener('click', function () {
        modalInstance.close();
        if (typeof options.onCancel === 'function') {
          options.onCancel();
        }
      });

      confirmBtn.addEventListener('click', function () {
        var restore = Utils.setButtonLoading(confirmBtn, 'Processing...');
        Promise.resolve(options.onConfirm())
          .then(function () {
            restore();
            modalInstance.close();
          })
          .catch(function () {
            restore();
          });
      });
    },

    /**
     * Builds a sortable table header `<th>`.
     *
     * @param {string} label - Display label
     * @param {string} columnKey - Sort key
     * @param {string} currentSortBy - Currently active sort key
     * @param {string} currentSortDir - 'asc' | 'desc'
     * @param {function} onSort - Callback(newSortBy, newSortDir)
     * @returns {HTMLElement} `<th>` element
     */
    createSortableHeader: function (label, columnKey, currentSortBy, currentSortDir, onSort) {
      var isCurrent = currentSortBy === columnKey;
      var ariaSort = isCurrent ? (currentSortDir === 'asc' ? 'ascending' : 'descending') : 'none';

      var th = Utils.createElement('th', {
        scope: 'col',
        'aria-sort': ariaSort,
        className: 'table-header-sortable' + (isCurrent ? ' is-sorted' : '')
      });

      var btn = Utils.createElement('button', {
        type: 'button',
        className: 'table-sort-btn',
        'aria-label': 'Sort by ' + label + (isCurrent ? (' (currently ' + currentSortDir + 'ending)') : '')
      });

      var labelSpan = Utils.createElement('span', { textContent: label });
      btn.appendChild(labelSpan);

      // Sort indicator icon
      var sortIcon = Utils.createElement('span', {
        className: 'table-sort-indicator',
        'aria-hidden': 'true',
        textContent: isCurrent ? (currentSortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'
      });
      btn.appendChild(sortIcon);

      btn.addEventListener('click', function () {
        var nextDir = 'asc';
        if (isCurrent && currentSortDir === 'asc') {
          nextDir = 'desc';
        }
        if (typeof onSort === 'function') {
          onSort(columnKey, nextDir);
        }
      });

      th.appendChild(btn);
      return th;
    },

    /**
     * Renders a standardized empty state card.
     */
    createEmptyState: function (title, description, actionButton) {
      var emptyWrapper = Utils.createElement('div', { className: 'empty-state' });

      var iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('class', 'empty-state-icon');
      iconSvg.setAttribute('viewBox', '0 0 24 24');
      iconSvg.setAttribute('fill', 'none');
      iconSvg.setAttribute('stroke', 'currentColor');
      iconSvg.setAttribute('stroke-width', '1.5');
      iconSvg.setAttribute('aria-hidden', 'true');

      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '12');
      circle.setAttribute('cy', '12');
      circle.setAttribute('r', '10');
      var line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', '12');
      line1.setAttribute('y1', '8');
      line1.setAttribute('x2', '12');
      line1.setAttribute('y2', '12');
      var line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line2.setAttribute('x1', '12');
      line2.setAttribute('y1', '16');
      line2.setAttribute('x2', '12.01');
      line2.setAttribute('y2', '16');

      iconSvg.appendChild(circle);
      iconSvg.appendChild(line1);
      iconSvg.appendChild(line2);
      emptyWrapper.appendChild(iconSvg);

      var titleEl = Utils.createElement('div', {
        className: 'empty-state-title',
        textContent: title || 'No Records Found'
      });
      var descEl = Utils.createElement('p', {
        className: 'empty-state-description',
        textContent: description || 'There are no items to display matching the current criteria.'
      });

      emptyWrapper.appendChild(titleEl);
      emptyWrapper.appendChild(descEl);

      if (actionButton && actionButton instanceof Node) {
        emptyWrapper.appendChild(actionButton);
      }

      return emptyWrapper;
    },

    /**
     * Renders an accessible loading spinner skeleton state.
     */
    createLoadingState: function (loadingText) {
      var container = Utils.createElement('div', {
        className: 'loading-state-container',
        role: 'status',
        'aria-live': 'polite'
      });

      var spinner = Utils.createElement('span', {
        className: 'spinner spinner-primary',
        style: 'width: 2rem; height: 2rem; border-width: 3px;',
        'aria-hidden': 'true'
      });

      var text = Utils.createElement('p', {
        className: 'loading-state-text',
        textContent: loadingText || 'Loading simulated records...'
      });

      container.appendChild(spinner);
      container.appendChild(text);
      return container;
    },

    /**
     * Renders an accessible API error state with a retry button.
     */
    createErrorState: function (errorMessage, onRetry) {
      var container = Utils.createElement('div', {
        className: 'alert alert-error',
        role: 'alert',
        style: 'margin: var(--space-lg) 0;'
      });

      var iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('class', 'alert-icon');
      iconSvg.setAttribute('viewBox', '0 0 20 20');
      iconSvg.setAttribute('fill', 'currentColor');
      iconSvg.setAttribute('aria-hidden', 'true');
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill-rule', 'evenodd');
      path.setAttribute('d', 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z');
      path.setAttribute('clip-rule', 'evenodd');
      iconSvg.appendChild(path);

      var content = Utils.createElement('div', { className: 'alert-content' });
      var title = Utils.createElement('div', {
        className: 'alert-title',
        textContent: 'Unable to Load Simulated Data'
      });
      var msg = Utils.createElement('div', {
        textContent: errorMessage || 'An unexpected error occurred while processing the request.'
      });

      content.appendChild(title);
      content.appendChild(msg);

      if (typeof onRetry === 'function') {
        var retryBtn = Utils.createElement('button', {
          type: 'button',
          className: 'btn btn-outline btn-sm',
          style: 'margin-top: var(--space-xs); border-color: var(--color-error); color: var(--color-error);',
          textContent: 'Retry Request'
        });
        retryBtn.addEventListener('click', onRetry);
        content.appendChild(retryBtn);
      }

      container.appendChild(iconSvg);
      container.appendChild(content);
      return container;
    },

    /**
     * Computes start and end dates from a range preset.
     * Anchor time: 2026-10-15T12:00:00Z (simulated reference clock)
     *
     * @param {'24h'|'7d'|'30d'|'custom'} preset
     * @param {string|Date} [customFrom]
     * @param {string|Date} [customTo]
     * @returns {{ from: Date, to: Date, isValid: boolean, error: string|null }}
     */
    calculateDateRange: function (preset, customFrom, customTo) {
      var anchorTime = new Date('2026-10-15T12:00:00Z').getTime();

      if (preset === '24h') {
        return {
          from: new Date(anchorTime - 24 * 60 * 60 * 1000),
          to: new Date(anchorTime),
          isValid: true,
          error: null
        };
      }

      if (preset === '7d') {
        return {
          from: new Date(anchorTime - 7 * 24 * 60 * 60 * 1000),
          to: new Date(anchorTime),
          isValid: true,
          error: null
        };
      }

      if (preset === '30d') {
        return {
          from: new Date(anchorTime - 30 * 24 * 60 * 60 * 1000),
          to: new Date(anchorTime),
          isValid: true,
          error: null
        };
      }

      // Custom date range
      if (preset === 'custom') {
        if (!customFrom || !customTo) {
          return { from: null, to: null, isValid: false, error: 'Both From and To dates are required.' };
        }
        var fromDate = new Date(customFrom);
        var toDate = new Date(customTo);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
          return { from: null, to: null, isValid: false, error: 'One or both dates are invalid.' };
        }

        if (fromDate > toDate) {
          return { from: null, to: null, isValid: false, error: 'The From date cannot be later than the To date.' };
        }

        return { from: fromDate, to: toDate, isValid: true, error: null };
      }

      // Fallback 7d
      return {
        from: new Date(anchorTime - 7 * 24 * 60 * 60 * 1000),
        to: new Date(anchorTime),
        isValid: true,
        error: null
      };
    }
  };

  // Expose UIComponents globally
  window.VitalGuardUI = UIComponents;
})(window, document);
