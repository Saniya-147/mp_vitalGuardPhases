/**
 * VitalGuard AI - Predictions & Explainability List Page Controller
 * assets/js/predictions.js
 *
 * Responsibilities:
 * - Route guarding via Auth.requireAuth('view:predictions')
 * - URL state synchronization for query filters, sorting, and pagination
 * - Interacting with GET /admin/predictions exclusively via Api.request
 * - Rendering sortable table columns, responsive cards, and accessible pagination
 * - Linking prediction records directly to prediction-details.html?id=...
 * - Linking patient records directly to patient-details.html?id=...
 *
 * SAFE DOM MANDATE: Uses createElement and textContent exclusively.
 * Zero dynamic innerHTML execution.
 */

(function (window, document) {
  'use strict';

  var Utils = window.VitalGuardUtils;
  var Auth = window.VitalGuardAuth;
  var Api = window.VitalGuardApi;
  var UI = window.VitalGuardUIComponents;

  // Verify authentication and permission
  var currentUser = null;
  if (Auth && typeof Auth.requireAuth === 'function') {
    currentUser = Auth.requireAuth('view:predictions');
    if (!currentUser) {
      return; // Route guard will redirect
    }
  }

  // Page state defaults
  var state = {
    q: '',
    riskCategory: 'all',
    status: 'all',
    modelVersion: 'all',
    sortBy: 'generatedAt',
    sortDir: 'desc',
    page: 1,
    pageSize: 10,
    total: 0,
    isLoading: false
  };

  /**
   * Initializes user interface, sidebar toggles, and parses initial URL query parameters.
   */
  function init() {
    setupUserDisplay();
    setupSidebarToggle();
    setupLogout();
    parseUrlParams();
    bindEvents();
    renderTableHeaders();
    loadPredictions();
  }

  /**
   * Renders authenticated user details in the topbar and sidebar.
   */
  function setupUserDisplay() {
    if (!currentUser) return;

    Utils.setText('#sidebar-user-name', currentUser.name || 'Simulated User');
    Utils.setText('#sidebar-user-role', currentUser.role || 'Authorized Staff');
    Utils.setText('#topbar-user-role', currentUser.role || 'Authorized Staff');

    var initialsEl = Utils.qs('#sidebar-user-initials');
    if (initialsEl && currentUser.name) {
      var parts = currentUser.name.trim().split(/\s+/);
      var initials = '';
      if (parts.length >= 2) {
        initials = parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
      } else if (parts.length === 1) {
        initials = parts[0].substring(0, 2);
      }
      initialsEl.textContent = initials.toUpperCase() || 'VG';
    }
  }

  /**
   * Mobile sidebar drawer open/close.
   */
  function setupSidebarToggle() {
    var toggleBtn = Utils.qs('#sidebar-toggle-btn');
    var sidebar = Utils.qs('#app-sidebar');
    var backdrop = Utils.qs('#sidebar-backdrop');

    if (!toggleBtn || !sidebar || !backdrop) return;

    function openSidebar() {
      sidebar.classList.add('is-open');
      backdrop.classList.add('is-visible');
      toggleBtn.setAttribute('aria-expanded', 'true');
    }

    function closeSidebar() {
      sidebar.classList.remove('is-open');
      backdrop.classList.remove('is-visible');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }

    toggleBtn.addEventListener('click', function () {
      if (sidebar.classList.contains('is-open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    backdrop.addEventListener('click', closeSidebar);
  }

  /**
   * Session logout button.
   */
  function setupLogout() {
    var logoutBtn = Utils.qs('#btn-logout');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', function () {
      if (Auth && typeof Auth.logout === 'function') {
        Auth.logout();
      } else {
        window.location.href = '../login.html';
      }
    });
  }

  /**
   * Reads URL query parameters on initial page load.
   */
  function parseUrlParams() {
    var urlParams = Utils.getUrlParams();

    if (urlParams.q) state.q = urlParams.q;
    if (urlParams.riskCategory) state.riskCategory = urlParams.riskCategory;
    if (urlParams.status) state.status = urlParams.status;
    if (urlParams.modelVersion) state.modelVersion = urlParams.modelVersion;
    if (urlParams.sortBy) state.sortBy = urlParams.sortBy;
    if (urlParams.sortDir) state.sortDir = urlParams.sortDir;
    if (urlParams.page) state.page = Math.max(1, parseInt(urlParams.page, 10) || 1);
    if (urlParams.pageSize) state.pageSize = Math.max(1, parseInt(urlParams.pageSize, 10) || 10);

    // Sync input controls
    var searchInput = Utils.qs('#predictions-search-input');
    if (searchInput) {
      searchInput.value = state.q;
      toggleSearchClearBtn(state.q);
    }

    var riskSelect = Utils.qs('#filter-risk');
    if (riskSelect && state.riskCategory) riskSelect.value = state.riskCategory;

    var statusSelect = Utils.qs('#filter-status');
    if (statusSelect && state.status) statusSelect.value = state.status;

    var modelSelect = Utils.qs('#filter-model');
    if (modelSelect && state.modelVersion) modelSelect.value = state.modelVersion;
  }

  /**
   * Synchronizes current state back to browser URL history.
   */
  function syncUrl() {
    var params = {};
    if (state.q) params.q = state.q;
    if (state.riskCategory && state.riskCategory !== 'all') params.riskCategory = state.riskCategory;
    if (state.status && state.status !== 'all') params.status = state.status;
    if (state.modelVersion && state.modelVersion !== 'all') params.modelVersion = state.modelVersion;
    if (state.sortBy && state.sortBy !== 'generatedAt') params.sortBy = state.sortBy;
    if (state.sortDir && state.sortDir !== 'desc') params.sortDir = state.sortDir;
    if (state.page > 1) params.page = String(state.page);
    if (state.pageSize !== 10) params.pageSize = String(state.pageSize);

    Utils.updateUrlParams(params);
  }

  /**
   * Toggles visibility of the search clear button.
   */
  function toggleSearchClearBtn(val) {
    var clearBtn = Utils.qs('#predictions-search-clear');
    if (clearBtn) {
      clearBtn.style.display = val ? 'block' : 'none';
    }
  }

  /**
   * Binds event listeners for search input, clear button, filters, and reset buttons.
   */
  function bindEvents() {
    var searchInput = Utils.qs('#predictions-search-input');
    var searchClear = Utils.qs('#predictions-search-clear');
    var riskSelect = Utils.qs('#filter-risk');
    var statusSelect = Utils.qs('#filter-status');
    var modelSelect = Utils.qs('#filter-model');
    var resetBtn = Utils.qs('#btn-reset-filters');
    var refreshBtn = Utils.qs('#btn-refresh');

    // Debounced search input (300ms)
    if (searchInput) {
      var debouncedSearch = Utils.debounce(function () {
        state.q = searchInput.value.trim();
        toggleSearchClearBtn(state.q);
        state.page = 1;
        syncUrl();
        loadPredictions();
      }, 300);

      searchInput.addEventListener('input', debouncedSearch);
    }

    if (searchClear) {
      searchClear.addEventListener('click', function () {
        if (searchInput) searchInput.value = '';
        state.q = '';
        toggleSearchClearBtn('');
        state.page = 1;
        syncUrl();
        loadPredictions();
        if (searchInput) searchInput.focus();
      });
    }

    if (riskSelect) {
      riskSelect.addEventListener('change', function () {
        state.riskCategory = riskSelect.value;
        state.page = 1;
        syncUrl();
        loadPredictions();
      });
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', function () {
        state.status = statusSelect.value;
        state.page = 1;
        syncUrl();
        loadPredictions();
      });
    }

    if (modelSelect) {
      modelSelect.addEventListener('change', function () {
        state.modelVersion = modelSelect.value;
        state.page = 1;
        syncUrl();
        loadPredictions();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        state.q = '';
        state.riskCategory = 'all';
        state.status = 'all';
        state.modelVersion = 'all';
        state.sortBy = 'generatedAt';
        state.sortDir = 'desc';
        state.page = 1;

        if (searchInput) searchInput.value = '';
        toggleSearchClearBtn('');
        if (riskSelect) riskSelect.value = 'all';
        if (statusSelect) statusSelect.value = 'all';
        if (modelSelect) modelSelect.value = 'all';

        renderTableHeaders();
        syncUrl();
        loadPredictions();
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        loadPredictions();
      });
    }
  }

  /**
   * Sort handler callback.
   */
  function handleSort(newSortBy, newSortDir) {
    state.sortBy = newSortBy;
    state.sortDir = newSortDir;
    state.page = 1;
    renderTableHeaders();
    syncUrl();
    loadPredictions();
  }

  /**
   * Generates sortable table headers.
   */
  function renderTableHeaders() {
    var headRow = Utils.qs('#predictions-table-head-row');
    if (!headRow) return;

    while (headRow.firstChild) headRow.removeChild(headRow.firstChild);

    var columns = [
      { key: 'id', label: 'Prediction ID', sortable: true },
      { key: 'patientId', label: 'Patient ID', sortable: true },
      { key: 'targetCondition', label: 'Target Condition', sortable: true },
      { key: 'riskCategory', label: 'Risk Level', sortable: true },
      { key: 'predictedScore', label: 'Deterioration Score', sortable: true },
      { key: 'confidence', label: 'Confidence', sortable: true },
      { key: 'predictionHorizon', label: 'Horizon', sortable: false },
      { key: 'modelVersion', label: 'Model Version', sortable: true },
      { key: 'generatedAt', label: 'Generated', sortable: true },
      { key: 'actions', label: 'Actions', sortable: false }
    ];

    for (var c = 0; c < columns.length; c++) {
      var col = columns[c];
      if (col.sortable) {
        var th = UI.createSortableHeader(col.label, col.key, state.sortBy, state.sortDir, handleSort);
        headRow.appendChild(th);
      } else {
        var plainTh = Utils.createElement('th', {
          scope: 'col',
          style: 'font-weight: var(--font-weight-bold); font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-primary-navy);',
          textContent: col.label
        });
        headRow.appendChild(plainTh);
      }
    }
  }

  /**
   * Fetches prediction records from GET /admin/predictions via Api.request.
   */
  function loadPredictions() {
    state.isLoading = true;
    renderLoadingState();

    var queryParams = [];
    if (state.q) queryParams.push('q=' + encodeURIComponent(state.q));
    if (state.riskCategory && state.riskCategory !== 'all') queryParams.push('riskCategory=' + encodeURIComponent(state.riskCategory));
    if (state.status && state.status !== 'all') queryParams.push('status=' + encodeURIComponent(state.status));
    if (state.modelVersion && state.modelVersion !== 'all') queryParams.push('modelVersion=' + encodeURIComponent(state.modelVersion));
    if (state.sortBy) queryParams.push('sortBy=' + encodeURIComponent(state.sortBy));
    if (state.sortDir) queryParams.push('sortDir=' + encodeURIComponent(state.sortDir));
    queryParams.push('page=' + encodeURIComponent(state.page));
    queryParams.push('pageSize=' + encodeURIComponent(state.pageSize));

    var endpoint = '/admin/predictions?' + queryParams.join('&');

    Api.request(endpoint).then(function (response) {
      state.isLoading = false;

      if (response.ok && response.data) {
        var items = response.data.items || [];
        state.total = response.data.total || 0;
        renderPredictionsTable(items);
        renderPagination();
        updateCountBadge();
      } else {
        renderErrorState(response.error || 'Failed to load predictive deterioration records.');
      }
    }).catch(function (err) {
      state.isLoading = false;
      renderErrorState(err.message || 'An unexpected error occurred while loading predictions.');
    });
  }

  /**
   * Displays loading spinner in table body.
   */
  function renderLoadingState() {
    var tbody = Utils.qs('#predictions-table-body');
    if (!tbody) return;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    var tr = document.createElement('tr');
    var td = Utils.createElement('td', {
      colSpan: 10,
      style: 'text-align: center; padding: var(--space-2xl); color: var(--color-text-secondary);'
    });

    var spinner = Utils.createElement('div', {
      className: 'spinner',
      style: 'margin: 0 auto var(--space-sm) auto;'
    });
    var text = Utils.createElement('div', {
      textContent: 'Loading simulated predictive inferences...'
    });

    td.appendChild(spinner);
    td.appendChild(text);
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  /**
   * Displays error state in table body with retry action.
   */
  function renderErrorState(errorMessage) {
    var tbody = Utils.qs('#predictions-table-body');
    if (!tbody) return;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    var tr = document.createElement('tr');
    var td = Utils.createElement('td', {
      colSpan: 10,
      style: 'text-align: center; padding: var(--space-2xl);'
    });

    var errorEl = UI.createErrorState(
      'Unable to Retrieve Predictions',
      errorMessage,
      function () { loadPredictions(); }
    );

    td.appendChild(errorEl);
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  /**
   * Updates total count display badge.
   */
  function updateCountBadge() {
    var badge = Utils.qs('#predictions-count-badge');
    if (badge) {
      badge.textContent = state.total + ' Evaluation' + (state.total === 1 ? '' : 's');
    }
  }

  /**
   * Renders prediction rows into table body.
   */
  function renderPredictionsTable(predictions) {
    var tbody = Utils.qs('#predictions-table-body');
    if (!tbody) return;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (predictions.length === 0) {
      var trEmpty = document.createElement('tr');
      var tdEmpty = Utils.createElement('td', {
        colSpan: 10,
        style: 'text-align: center; padding: var(--space-2xl);'
      });

      var isFiltered = state.q || state.riskCategory !== 'all' || state.status !== 'all' || state.modelVersion !== 'all';
      var emptyEl = UI.createEmptyState(
        'No Prediction Inferences Found',
        isFiltered
          ? 'No simulated prediction evaluations match the selected filter criteria.'
          : 'No predictive deterioration records are currently cataloged.',
        isFiltered ? {
          label: 'Clear Filters',
          onClick: function () {
            var resetBtn = Utils.qs('#btn-reset-filters');
            if (resetBtn) resetBtn.click();
          }
        } : null
      );

      tdEmpty.appendChild(emptyEl);
      trEmpty.appendChild(tdEmpty);
      tbody.appendChild(trEmpty);
      return;
    }

    for (var i = 0; i < predictions.length; i++) {
      var pred = predictions[i];
      var tr = document.createElement('tr');

      // 1. Prediction ID (Link to prediction details)
      var tdId = document.createElement('td');
      var predLink = Utils.createElement('a', {
        href: 'prediction-details.html?id=' + encodeURIComponent(pred.id),
        style: 'font-family: var(--font-family-mono); font-weight: var(--font-weight-bold); color: var(--color-accent-teal); text-decoration: none;',
        textContent: pred.id || 'N/A'
      });
      tdId.appendChild(predLink);
      tr.appendChild(tdId);

      // 2. Patient ID (Link to patient details)
      var tdPatient = document.createElement('td');
      var ptLink = Utils.createElement('a', {
        href: 'patient-details.html?id=' + encodeURIComponent(pred.patientId),
        className: 'badge badge-neutral',
        style: 'font-family: var(--font-family-mono); text-decoration: none;',
        textContent: pred.patientId || 'N/A'
      });
      tdPatient.appendChild(ptLink);
      tr.appendChild(tdPatient);

      // 3. Target Condition
      var tdCond = Utils.createElement('td', {
        style: 'font-weight: var(--font-weight-medium); color: var(--color-primary-navy); max-width: 260px; overflow: hidden; text-overflow: ellipsis;',
        textContent: pred.targetCondition || 'Deterioration Risk'
      });
      tr.appendChild(tdCond);

      // 4. Risk Level Badge
      var tdRisk = document.createElement('td');
      var riskLevel = pred.riskCategory || 'Low';
      var riskBadgeClass = 'badge-neutral';
      if (riskLevel === 'Low') riskBadgeClass = 'badge-success';
      else if (riskLevel === 'Moderate') riskBadgeClass = 'badge-warning';
      else if (riskLevel === 'High' || riskLevel === 'Critical') riskBadgeClass = 'badge-error';

      var riskBadge = Utils.createElement('span', {
        className: 'badge ' + riskBadgeClass,
        textContent: riskLevel + ' Risk'
      });
      tdRisk.appendChild(riskBadge);
      tr.appendChild(tdRisk);

      // 5. Deterioration Score (Explicitly formatted as a score, NOT mislabeled as probability)
      var tdScore = document.createElement('td');
      var scoreVal = pred.predictedScore !== undefined ? Number(pred.predictedScore).toFixed(2) : 'N/A';
      var scoreSpan = Utils.createElement('span', {
        style: 'font-weight: var(--font-weight-bold); font-family: var(--font-family-mono); font-size: var(--font-size-sm); color: var(--color-primary-navy);',
        textContent: scoreVal
      });
      tdScore.appendChild(scoreSpan);
      tr.appendChild(tdScore);

      // 6. Confidence Score
      var tdConf = document.createElement('td');
      var confVal = pred.confidence !== undefined ? (Math.round(pred.confidence * 100) + '%') : 'N/A';
      var confSpan = Utils.createElement('span', {
        style: 'color: var(--color-text-secondary); font-size: var(--font-size-xs);',
        textContent: confVal
      });
      tdConf.appendChild(confSpan);
      tr.appendChild(tdConf);

      // 7. Prediction Horizon
      var tdHorizon = Utils.createElement('td', {
        style: 'font-size: var(--font-size-xs); color: var(--color-text-secondary);',
        textContent: pred.predictionHorizon || '12 Hours'
      });
      tr.appendChild(tdHorizon);

      // 8. Model Version
      var tdModel = document.createElement('td');
      var modelBadge = Utils.createElement('code', {
        style: 'font-size: var(--font-size-2xs); background-color: var(--color-bg-subtle); padding: 2px 6px; border-radius: var(--radius-sm); color: var(--color-text-secondary);',
        textContent: pred.modelVersion || 'v1.4.2-sim'
      });
      tdModel.appendChild(modelBadge);
      tr.appendChild(tdModel);

      // 9. Generated Timestamp
      var tdTime = Utils.createElement('td', {
        style: 'font-size: var(--font-size-xs); color: var(--color-text-secondary);',
        textContent: Utils.formatDateTime(pred.generatedAt)
      });
      tr.appendChild(tdTime);

      // 10. Actions
      var tdActions = document.createElement('td');
      var viewBtn = Utils.createElement('a', {
        href: 'prediction-details.html?id=' + encodeURIComponent(pred.id),
        className: 'btn btn-outline btn-sm',
        style: 'text-decoration: none; padding: 0.25rem 0.625rem; font-size: var(--font-size-xs);',
        textContent: 'View Details'
      });
      tdActions.appendChild(viewBtn);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    }
  }

  /**
   * Renders pagination navigation controls.
   */
  function renderPagination() {
    var container = Utils.qs('#predictions-pagination-container');
    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    var paginationEl = UI.createPagination({
      page: state.page,
      pageSize: state.pageSize,
      total: state.total,
      itemName: 'predictions',
      onPageChange: function (newPage) {
        state.page = newPage;
        syncUrl();
        loadPredictions();
        var mainContent = Utils.qs('#main-predictions');
        if (mainContent) mainContent.scrollIntoView({ behavior: 'smooth' });
      },
      onPageSizeChange: function (newPageSize) {
        state.pageSize = newPageSize;
        state.page = 1;
        syncUrl();
        loadPredictions();
      }
    });

    container.appendChild(paginationEl);
  }

  // Initialize controller when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
