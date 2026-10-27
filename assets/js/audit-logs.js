/**
 * VitalGuard AI - Audit Trail Logs Controller
 * assets/js/audit-logs.js
 */

(function (window) {
  'use strict';

  // State
  var state = {
    q: '',
    category: 'all',
    action: 'all',
    sortBy: 'timestamp',
    sortDir: 'desc',
    page: 1,
    pageSize: 10,
    total: 0,
    items: []
  };

  /**
   * DOM Elements Cache
   */
  var dom = {};

  /**
   * Initialize Audit Logs Page
   */
  function init() {
    // 1. Enforce Authentication
    if (!window.VitalGuardAuth || !window.VitalGuardAuth.requireAuth()) {
      return;
    }

    cacheDOMElements();
    setupHeaderUser();
    setupSidebarToggle();

    // 2. Enforce Role-Based Permission (view:audit_logs)
    var canViewAudit = window.VitalGuardAuth.hasPermission('view:audit_logs');
    if (!canViewAudit) {
      showAccessDenied();
      return;
    }

    // 3. Read state from URL query parameters
    readUrlParams();

    // 4. Setup Event Listeners
    setupEventListeners();

    // 5. Fetch initial audit logs data
    fetchAuditLogs();
  }

  /**
   * Cache critical DOM references
   */
  function cacheDOMElements() {
    dom.auditContent = document.getElementById('audit-view-content');
    dom.accessDeniedView = document.getElementById('access-denied-view');
    dom.deniedRoleName = document.getElementById('denied-role-name');

    dom.searchInput = document.getElementById('input-audit-search');
    dom.categoryFilter = document.getElementById('select-category-filter');
    dom.actionFilter = document.getElementById('select-action-filter');
    dom.btnResetFilters = document.getElementById('btn-reset-filters');
    dom.auditCountDisplay = document.getElementById('audit-count-display');

    dom.table = document.getElementById('audit-table');
    dom.tableBody = document.getElementById('audit-table-body');
    dom.emptyState = document.getElementById('audit-empty-state');
    dom.loadingState = document.getElementById('audit-loading-state');

    dom.paginationBar = document.getElementById('audit-pagination-bar');
    dom.paginationInfo = document.getElementById('pagination-info');
    dom.pageSizeSelect = document.getElementById('select-page-size');
    dom.paginationControls = document.getElementById('pagination-controls');

    dom.modalDetails = document.getElementById('modal-event-details');
    dom.btnCloseDetailsModal = document.getElementById('btn-close-details-modal');
    dom.btnDismissDetails = document.getElementById('btn-dismiss-details');
    dom.detailsGrid = document.getElementById('audit-details-grid');
    dom.detailsDescription = document.getElementById('details-event-description');
    dom.detailsJson = document.getElementById('details-event-json');
  }

  /**
   * Render current user details in header & sidebar
   */
  function setupHeaderUser() {
    var user = window.VitalGuardAuth.getCurrentUser();
    if (!user) return;

    var nameEl = document.getElementById('sidebar-user-name');
    var roleEl = document.getElementById('sidebar-user-role');
    var initialsEl = document.getElementById('sidebar-user-initials');
    var topbarName = document.getElementById('topbar-user-name');
    var topbarRole = document.getElementById('topbar-user-role');

    if (nameEl) nameEl.textContent = user.name || 'User';
    if (roleEl) roleEl.textContent = user.role || 'Role';
    if (topbarName) topbarName.textContent = user.name ? user.name.split(' ')[0] : 'User';
    if (topbarRole) topbarRole.textContent = user.role || 'Auditor';

    if (initialsEl && user.name) {
      var parts = user.name.split(' ');
      var inits = parts.length > 1 ? (parts[0][0] + parts[1][0]) : parts[0].substring(0, 2);
      initialsEl.textContent = inits.toUpperCase();
    }

    var btnLogout = document.getElementById('btn-sidebar-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', function () {
        window.VitalGuardAuth.logout();
        window.location.href = '../login.html';
      });
    }
  }

  /**
   * Setup responsive sidebar collapse/expand toggle
   */
  function setupSidebarToggle() {
    var toggleBtn = document.getElementById('btn-toggle-sidebar');
    var sidebar = document.getElementById('app-sidebar');
    var backdrop = document.getElementById('sidebar-backdrop');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', function () {
        sidebar.classList.toggle('is-open');
        if (backdrop) backdrop.classList.toggle('is-open');
      });
    }

    if (backdrop && sidebar) {
      backdrop.addEventListener('click', function () {
        sidebar.classList.remove('is-open');
        backdrop.classList.remove('is-open');
      });
    }
  }

  /**
   * Display Access Denied View for unauthorized roles
   */
  function showAccessDenied() {
    if (dom.auditContent) dom.auditContent.style.display = 'none';
    if (dom.accessDeniedView) {
      dom.accessDeniedView.style.display = 'block';
      var user = window.VitalGuardAuth.getCurrentUser();
      if (dom.deniedRoleName && user) {
        dom.deniedRoleName.textContent = user.role || 'Healthcare Staff';
      }
    }
  }

  /**
   * Parse query parameters from URL into state
   */
  function readUrlParams() {
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.has('q')) state.q = params.get('q');
      if (params.has('category')) state.category = params.get('category');
      if (params.has('action')) state.action = params.get('action');
      if (params.has('sortBy')) state.sortBy = params.get('sortBy');
      if (params.has('sortDir')) state.sortDir = params.get('sortDir');
      if (params.has('page')) state.page = Math.max(1, parseInt(params.get('page'), 10) || 1);
      if (params.has('pageSize')) state.pageSize = Math.max(1, parseInt(params.get('pageSize'), 10) || 10);

      // Reflect in UI controls
      if (dom.searchInput) dom.searchInput.value = state.q;
      if (dom.categoryFilter) dom.categoryFilter.value = state.category;
      if (dom.actionFilter) dom.actionFilter.value = state.action;
      if (dom.pageSizeSelect) dom.pageSizeSelect.value = String(state.pageSize);
    } catch (e) {}
  }

  /**
   * Synchronize state to URL query parameters
   */
  function syncUrlParams() {
    try {
      var params = new URLSearchParams();
      if (state.q) params.set('q', state.q);
      if (state.category && state.category !== 'all') params.set('category', state.category);
      if (state.action && state.action !== 'all') params.set('action', state.action);
      if (state.sortBy && state.sortBy !== 'timestamp') params.set('sortBy', state.sortBy);
      if (state.sortDir && state.sortDir !== 'desc') params.set('sortDir', state.sortDir);
      if (state.page > 1) params.set('page', state.page);
      if (state.pageSize !== 10) params.set('pageSize', state.pageSize);

      var newSearch = params.toString();
      var newUrl = window.location.pathname + (newSearch ? ('?' + newSearch) : '');
      window.history.replaceState(null, '', newUrl);
    } catch (e) {}
  }

  /**
   * Attach UI event listeners
   */
  function setupEventListeners() {
    // Search input with debounce
    if (dom.searchInput) {
      var debounceTimeout;
      dom.searchInput.addEventListener('input', function (e) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(function () {
          state.q = e.target.value.trim();
          state.page = 1;
          syncUrlParams();
          fetchAuditLogs();
        }, 300);
      });
    }

    // Category filter
    if (dom.categoryFilter) {
      dom.categoryFilter.addEventListener('change', function (e) {
        state.category = e.target.value;
        state.page = 1;
        syncUrlParams();
        fetchAuditLogs();
      });
    }

    // Action filter
    if (dom.actionFilter) {
      dom.actionFilter.addEventListener('change', function (e) {
        state.action = e.target.value;
        state.page = 1;
        syncUrlParams();
        fetchAuditLogs();
      });
    }

    // Reset filters
    if (dom.btnResetFilters) {
      dom.btnResetFilters.addEventListener('click', function () {
        state.q = '';
        state.category = 'all';
        state.action = 'all';
        state.page = 1;
        if (dom.searchInput) dom.searchInput.value = '';
        if (dom.categoryFilter) dom.categoryFilter.value = 'all';
        if (dom.actionFilter) dom.actionFilter.value = 'all';
        syncUrlParams();
        fetchAuditLogs();
      });
    }

    // Page size
    if (dom.pageSizeSelect) {
      dom.pageSizeSelect.addEventListener('change', function (e) {
        state.pageSize = parseInt(e.target.value, 10) || 10;
        state.page = 1;
        syncUrlParams();
        fetchAuditLogs();
      });
    }

    // Sort column headers
    if (dom.table) {
      var sortHeaders = dom.table.querySelectorAll('th[data-sort]');
      for (var sh = 0; sh < sortHeaders.length; sh++) {
        (function (th) {
          th.addEventListener('click', function () {
            var col = th.getAttribute('data-sort');
            if (state.sortBy === col) {
              state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
            } else {
              state.sortBy = col;
              state.sortDir = (col === 'timestamp' ? 'desc' : 'asc');
            }
            updateSortHeaderAria();
            syncUrlParams();
            fetchAuditLogs();
          });
        })(sortHeaders[sh]);
      }
    }

    // Event Details modal handlers
    if (dom.btnCloseDetailsModal) dom.btnCloseDetailsModal.addEventListener('click', closeDetailsModal);
    if (dom.btnDismissDetails) dom.btnDismissDetails.addEventListener('click', closeDetailsModal);

    // Escape key modal dismiss
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeDetailsModal();
      }
    });
  }

  /**
   * Update aria-sort on headers
   */
  function updateSortHeaderAria() {
    if (!dom.table) return;
    var headers = dom.table.querySelectorAll('th[data-sort]');
    for (var h = 0; h < headers.length; h++) {
      var col = headers[h].getAttribute('data-sort');
      if (col === state.sortBy) {
        headers[h].setAttribute('aria-sort', state.sortDir === 'asc' ? 'ascending' : 'descending');
      } else {
        headers[h].setAttribute('aria-sort', 'none');
      }
    }
  }

  /**
   * Fetch audit logs from API client
   */
  function fetchAuditLogs() {
    showLoading();

    var baseEndpoint = (window.VitalGuardConfig && window.VitalGuardConfig.ENDPOINTS && window.VitalGuardConfig.ENDPOINTS.ADMIN_AUDIT_LOGS) || '/admin/audit-logs';
    var queryParts = [
      'sortBy=' + encodeURIComponent(state.sortBy),
      'sortDir=' + encodeURIComponent(state.sortDir),
      'page=' + state.page,
      'pageSize=' + state.pageSize
    ];

    if (state.q) queryParts.push('q=' + encodeURIComponent(state.q));
    if (state.category && state.category !== 'all') queryParts.push('category=' + encodeURIComponent(state.category));
    if (state.action && state.action !== 'all') queryParts.push('action=' + encodeURIComponent(state.action));

    var url = baseEndpoint + '?' + queryParts.join('&');

    window.VitalGuardApi.request(url).then(function (response) {
      hideLoading();

      if (response.ok && response.data) {
        state.items = response.data.items || [];
        state.total = response.data.total || 0;
        state.page = response.data.page || state.page;
        state.pageSize = response.data.pageSize || state.pageSize;

        renderAuditTable();
        renderPagination();
        updateCountDisplay();
      } else {
        showError(response.error || 'Failed to retrieve audit trail logs.');
      }
    }).catch(function () {
      hideLoading();
      showError('Network error while requesting audit logs.');
    });
  }

  /**
   * Display loading state
   */
  function showLoading() {
    if (dom.loadingState) dom.loadingState.style.display = 'block';
    if (dom.tableBody) dom.tableBody.style.display = 'none';
    if (dom.emptyState) dom.emptyState.style.display = 'none';
  }

  /**
   * Hide loading state
   */
  function hideLoading() {
    if (dom.loadingState) dom.loadingState.style.display = 'none';
    if (dom.tableBody) dom.tableBody.style.display = '';
  }

  /**
   * Render audit table using safe DOM APIs
   */
  function renderAuditTable() {
    if (!dom.tableBody) return;
    dom.tableBody.textContent = ''; // safe clear

    if (state.items.length === 0) {
      if (dom.emptyState) dom.emptyState.style.display = 'block';
      if (dom.paginationBar) dom.paginationBar.style.display = 'none';
      return;
    }

    if (dom.emptyState) dom.emptyState.style.display = 'none';
    if (dom.paginationBar) dom.paginationBar.style.display = 'flex';

    for (var i = 0; i < state.items.length; i++) {
      var entry = state.items[i];
      var tr = document.createElement('tr');

      // 1. Timestamp
      var tdTimestamp = document.createElement('td');
      tdTimestamp.style.fontSize = 'var(--font-size-xs)';
      tdTimestamp.style.color = 'var(--color-navy)';
      tdTimestamp.style.whiteSpace = 'nowrap';
      tdTimestamp.textContent = formatTimestamp(entry.timestamp);
      tr.appendChild(tdTimestamp);

      // 2. Actor
      var tdActor = document.createElement('td');
      var actorSpan = document.createElement('span');
      actorSpan.className = 'audit-actor-text';
      actorSpan.textContent = entry.actor || 'System Daemon';
      tdActor.appendChild(actorSpan);
      tr.appendChild(tdActor);

      // 3. Category Badge
      var tdCat = document.createElement('td');
      var catBadge = document.createElement('span');
      catBadge.className = 'badge';
      var catLower = (entry.category || '').toLowerCase();
      if (catLower.indexOf('security') !== -1) {
        catBadge.className += ' badge-cat-security';
      } else if (catLower.indexOf('clinical') !== -1) {
        catBadge.className += ' badge-cat-clinical';
      } else if (catLower.indexOf('system') !== -1) {
        catBadge.className += ' badge-cat-system';
      } else {
        catBadge.className += ' badge-cat-compliance';
      }
      catBadge.textContent = entry.category || 'General';
      tdCat.appendChild(catBadge);
      tr.appendChild(tdCat);

      // 4. Action Code
      var tdAction = document.createElement('td');
      var actionTag = document.createElement('code');
      actionTag.className = 'audit-action-tag';
      actionTag.textContent = entry.action || 'EVENT';
      tdAction.appendChild(actionTag);
      tr.appendChild(tdAction);

      // 5. IP Address
      var tdIp = document.createElement('td');
      tdIp.style.fontSize = 'var(--font-size-xs)';
      tdIp.style.color = 'var(--color-slate-500)';
      tdIp.textContent = entry.ipAddress || '127.0.0.1';
      tr.appendChild(tdIp);

      // 6. Details Summary
      var tdDetails = document.createElement('td');
      var detailsSpan = document.createElement('span');
      detailsSpan.className = 'audit-details-preview';
      detailsSpan.textContent = entry.details || '—';
      tdDetails.appendChild(detailsSpan);
      tr.appendChild(tdDetails);

      // 7. Actions Cell
      var tdActions = document.createElement('td');
      tdActions.style.textAlign = 'right';

      var btnView = document.createElement('button');
      btnView.type = 'button';
      btnView.className = 'btn btn-outline btn-sm';
      btnView.textContent = 'View Details';
      btnView.setAttribute('aria-label', 'Inspect audit event ' + entry.id);
      (function (eventItem) {
        btnView.addEventListener('click', function () {
          openEventDetailsModal(eventItem);
        });
      })(entry);

      tdActions.appendChild(btnView);
      tr.appendChild(tdActions);

      dom.tableBody.appendChild(tr);
    }
  }

  /**
   * Format ISO timestamp
   */
  function formatTimestamp(isoStr) {
    if (!isoStr) return 'N/A';
    try {
      var d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) + ' ' + d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  }

  /**
   * Render pagination controls
   */
  function renderPagination() {
    if (!dom.paginationInfo || !dom.paginationControls) return;

    var start = (state.page - 1) * state.pageSize + 1;
    var end = Math.min(state.page * state.pageSize, state.total);
    if (state.total === 0) start = 0;

    dom.paginationInfo.textContent = 'Showing ' + start + ' to ' + end + ' of ' + state.total + ' events';

    var totalPages = Math.ceil(state.total / state.pageSize) || 1;
    dom.paginationControls.textContent = ''; // clear

    // Previous Button
    var btnPrev = document.createElement('button');
    btnPrev.type = 'button';
    btnPrev.className = 'btn btn-outline btn-sm';
    btnPrev.textContent = '« Prev';
    btnPrev.disabled = state.page <= 1;
    btnPrev.addEventListener('click', function () {
      if (state.page > 1) {
        state.page--;
        syncUrlParams();
        fetchAuditLogs();
      }
    });
    dom.paginationControls.appendChild(btnPrev);

    // Page Numbers
    for (var p = 1; p <= totalPages; p++) {
      var btnPage = document.createElement('button');
      btnPage.type = 'button';
      btnPage.className = 'btn btn-sm ' + (p === state.page ? 'btn-primary' : 'btn-outline');
      btnPage.textContent = String(p);
      (function (pageNumber) {
        btnPage.addEventListener('click', function () {
          if (state.page !== pageNumber) {
            state.page = pageNumber;
            syncUrlParams();
            fetchAuditLogs();
          }
        });
      })(p);
      dom.paginationControls.appendChild(btnPage);
    }

    // Next Button
    var btnNext = document.createElement('button');
    btnNext.type = 'button';
    btnNext.className = 'btn btn-outline btn-sm';
    btnNext.textContent = 'Next »';
    btnNext.disabled = state.page >= totalPages;
    btnNext.addEventListener('click', function () {
      if (state.page < totalPages) {
        state.page++;
        syncUrlParams();
        fetchAuditLogs();
      }
    });
    dom.paginationControls.appendChild(btnNext);
  }

  /**
   * Update audit events count indicator badge
   */
  function updateCountDisplay() {
    if (!dom.auditCountDisplay) return;
    dom.auditCountDisplay.textContent = state.total + ' ' + (state.total === 1 ? 'event' : 'events') + ' recorded';
  }

  /**
   * Display friendly error message
   */
  function showError(msg) {
    if (window.VitalGuardUtils && window.VitalGuardUtils.showToast) {
      window.VitalGuardUtils.showToast(msg, 'error');
    } else {
      alert(msg);
    }
  }

  // ==========================================================================
  // Event Details Modal Handlers
  // ==========================================================================

  function openEventDetailsModal(entry) {
    if (!dom.modalDetails || !entry) return;

    if (dom.detailsGrid) {
      dom.detailsGrid.textContent = ''; // clear

      var fields = [
        { label: 'Event ID', val: entry.id },
        { label: 'Timestamp (UTC)', val: entry.timestamp },
        { label: 'Actor / User Identity', val: entry.actor },
        { label: 'IP Address / Source', val: entry.ipAddress || '127.0.0.1' },
        { label: 'Event Category', val: entry.category },
        { label: 'Action Event Code', val: entry.action },
        { label: 'Data Source', val: 'simulated (Academic Prototype Log)' },
        { label: 'Log Status', val: 'Demo Audit Log: Read-Only in This Prototype' }
      ];

      for (var f = 0; f < fields.length; f++) {
        var itemDiv = document.createElement('div');

        var labelDiv = document.createElement('div');
        labelDiv.className = 'audit-detail-label';
        labelDiv.textContent = fields[f].label;
        itemDiv.appendChild(labelDiv);

        var valDiv = document.createElement('div');
        valDiv.className = 'audit-detail-val';
        valDiv.textContent = fields[f].val;
        itemDiv.appendChild(valDiv);

        dom.detailsGrid.appendChild(itemDiv);
      }
    }

    if (dom.detailsDescription) {
      dom.detailsDescription.textContent = entry.details || 'No extended summary provided.';
    }

    // Explanation regarding prototype audit log immutability without claiming cryptographic verification
    var explanationEl = document.getElementById('details-audit-security-explanation');
    if (!explanationEl) {
      explanationEl = document.createElement('div');
      explanationEl.id = 'details-audit-security-explanation';
      explanationEl.className = 'modal-simulation-notice';
      explanationEl.style.marginTop = 'var(--space-md)';
      explanationEl.style.fontSize = 'var(--font-size-xs)';
      if (dom.detailsDescription && dom.detailsDescription.parentNode) {
        dom.detailsDescription.parentNode.appendChild(explanationEl);
      }
    }
    explanationEl.textContent = 'Prototype notice: The demo interface rejects modification requests (POST/PUT/PATCH/DELETE return 405), but cryptographic tamper detection and production-grade audit-log integrity are not implemented.';

    if (dom.detailsJson) {
      var metadata = entry.metadata || { eventId: entry.id, action: entry.action, simulated: true };
      dom.detailsJson.textContent = JSON.stringify(metadata, null, 2);
    }

    dom.modalDetails.style.display = 'flex';
    dom.modalDetails.setAttribute('aria-hidden', 'false');
    if (dom.btnDismissDetails) dom.btnDismissDetails.focus();
  }

  function closeDetailsModal() {
    if (!dom.modalDetails) return;
    dom.modalDetails.style.display = 'none';
    dom.modalDetails.setAttribute('aria-hidden', 'true');
  }

  // Self initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
