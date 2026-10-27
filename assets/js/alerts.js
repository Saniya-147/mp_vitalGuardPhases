/**
 * VitalGuard AI - Clinical Alerts Management Controller
 * assets/js/alerts.js
 *
 * Responsibilities:
 * - Route guarding via Auth.requireAuth('view:alerts')
 * - Role-based authorization: update:alerts permission check
 * - Query filtering, sorting, pagination, and URL synchronization
 * - Data retrieval via GET /admin/alerts exclusively through Api.request
 * - Interactive alert details drawer/modal with accessible keyboard traps
 * - Lifecycle status transitions via PATCH /admin/alerts/{id} (Acknowledge / Resolve)
 * - Displaying exact demo persistence notice:
 *   "Demo Mode - saved only in this browser session, not in any real database."
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
    currentUser = Auth.requireAuth('view:alerts');
    if (!currentUser) return;
  }

  // Permission to acknowledge or resolve alerts
  var canUpdateAlerts = Auth && typeof Auth.hasPermission === 'function'
    ? Auth.hasPermission('update:alerts')
    : false;

  // Page state
  var state = {
    q: '',
    status: 'all',
    severity: 'all',
    sortBy: 'createdAt',
    sortDir: 'desc',
    page: 1,
    pageSize: 10,
    total: 0,
    isLoading: false
  };

  /**
   * Initializes page, sidebar toggles, binds event listeners, loads data.
   */
  function init() {
    setupUserDisplay();
    setupSidebarToggle();
    setupLogout();
    parseUrlParams();
    bindEvents();
    renderTableHeaders();
    loadAlerts();
  }

  /**
   * User display in topbar and sidebar.
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
   * Mobile sidebar drawer toggle.
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
      if (sidebar.classList.contains('is-open')) closeSidebar();
      else openSidebar();
    });

    backdrop.addEventListener('click', closeSidebar);
  }

  /**
   * Logout handler.
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
   * Parse initial URL query parameters.
   */
  function parseUrlParams() {
    var urlParams = Utils.getUrlParams();

    if (urlParams.q) state.q = urlParams.q;
    if (urlParams.status) state.status = urlParams.status;
    if (urlParams.severity) state.severity = urlParams.severity;
    if (urlParams.sortBy) state.sortBy = urlParams.sortBy;
    if (urlParams.sortDir) state.sortDir = urlParams.sortDir;
    if (urlParams.page) state.page = Math.max(1, parseInt(urlParams.page, 10) || 1);
    if (urlParams.pageSize) state.pageSize = Math.max(1, parseInt(urlParams.pageSize, 10) || 10);

    // Sync input controls
    var searchInput = Utils.qs('#alerts-search-input');
    if (searchInput) {
      searchInput.value = state.q;
      toggleSearchClearBtn(state.q);
    }

    var statusSelect = Utils.qs('#filter-status');
    if (statusSelect && state.status) statusSelect.value = state.status;

    var severitySelect = Utils.qs('#filter-severity');
    if (severitySelect && state.severity) severitySelect.value = state.severity;
  }

  /**
   * Syncs state to URL history.
   */
  function syncUrl() {
    var params = {};
    if (state.q) params.q = state.q;
    if (state.status && state.status !== 'all') params.status = state.status;
    if (state.severity && state.severity !== 'all') params.severity = state.severity;
    if (state.sortBy && state.sortBy !== 'createdAt') params.sortBy = state.sortBy;
    if (state.sortDir && state.sortDir !== 'desc') params.sortDir = state.sortDir;
    if (state.page > 1) params.page = String(state.page);
    if (state.pageSize !== 10) params.pageSize = String(state.pageSize);

    Utils.updateUrlParams(params);
  }

  /**
   * Toggles search clear button visibility.
   */
  function toggleSearchClearBtn(val) {
    var clearBtn = Utils.qs('#alerts-search-clear');
    if (clearBtn) {
      clearBtn.style.display = val ? 'block' : 'none';
    }
  }

  /**
   * Binds event listeners for search and filter inputs.
   */
  function bindEvents() {
    var searchInput = Utils.qs('#alerts-search-input');
    var searchClear = Utils.qs('#alerts-search-clear');
    var statusSelect = Utils.qs('#filter-status');
    var severitySelect = Utils.qs('#filter-severity');
    var resetBtn = Utils.qs('#btn-reset-filters');
    var refreshBtn = Utils.qs('#btn-refresh');

    // Debounced search input (300ms)
    if (searchInput) {
      var debouncedSearch = Utils.debounce(function () {
        state.q = searchInput.value.trim();
        toggleSearchClearBtn(state.q);
        state.page = 1;
        syncUrl();
        loadAlerts();
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
        loadAlerts();
        if (searchInput) searchInput.focus();
      });
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', function () {
        state.status = statusSelect.value;
        state.page = 1;
        syncUrl();
        loadAlerts();
      });
    }

    if (severitySelect) {
      severitySelect.addEventListener('change', function () {
        state.severity = severitySelect.value;
        state.page = 1;
        syncUrl();
        loadAlerts();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        state.q = '';
        state.status = 'all';
        state.severity = 'all';
        state.sortBy = 'createdAt';
        state.sortDir = 'desc';
        state.page = 1;

        if (searchInput) searchInput.value = '';
        toggleSearchClearBtn('');
        if (statusSelect) statusSelect.value = 'all';
        if (severitySelect) severitySelect.value = 'all';

        renderTableHeaders();
        syncUrl();
        loadAlerts();
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        loadAlerts();
      });
    }
  }

  /**
   * Sort column handler.
   */
  function handleSort(newSortBy, newSortDir) {
    state.sortBy = newSortBy;
    state.sortDir = newSortDir;
    state.page = 1;
    renderTableHeaders();
    syncUrl();
    loadAlerts();
  }

  /**
   * Generates sortable table headers.
   */
  function renderTableHeaders() {
    var headRow = Utils.qs('#alerts-table-head-row');
    if (!headRow) return;

    while (headRow.firstChild) headRow.removeChild(headRow.firstChild);

    var columns = [
      { key: 'id', label: 'Alert ID', sortable: true },
      { key: 'patientId', label: 'Patient ID', sortable: true },
      { key: 'title', label: 'Title & Incident Details', sortable: false },
      { key: 'severity', label: 'Severity', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'createdAt', label: 'Triggered', sortable: true },
      { key: 'attribution', label: 'Handled By', sortable: false },
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
   * Fetches alert records from GET /admin/alerts via Api.request.
   */
  function loadAlerts() {
    state.isLoading = true;
    renderLoadingState();

    var queryParams = [];
    if (state.q) queryParams.push('q=' + encodeURIComponent(state.q));
    if (state.status && state.status !== 'all') queryParams.push('status=' + encodeURIComponent(state.status));
    if (state.severity && state.severity !== 'all') queryParams.push('severity=' + encodeURIComponent(state.severity));
    if (state.sortBy) queryParams.push('sortBy=' + encodeURIComponent(state.sortBy));
    if (state.sortDir) queryParams.push('sortDir=' + encodeURIComponent(state.sortDir));
    queryParams.push('page=' + encodeURIComponent(state.page));
    queryParams.push('pageSize=' + encodeURIComponent(state.pageSize));

    var endpoint = '/admin/alerts?' + queryParams.join('&');

    Api.request(endpoint).then(function (response) {
      state.isLoading = false;

      if (response.ok && response.data) {
        var items = response.data.items || [];
        state.total = response.data.total || 0;
        renderAlertsTable(items);
        renderPagination();
        updateCountBadge();
      } else {
        renderErrorState(response.error || 'Failed to load clinical alerts.');
      }
    }).catch(function (err) {
      state.isLoading = false;
      renderErrorState(err.message || 'An unexpected error occurred while communicating with the alert service.');
    });
  }

  /**
   * Displays loading state in table.
   */
  function renderLoadingState() {
    var tbody = Utils.qs('#alerts-table-body');
    if (!tbody) return;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    var tr = document.createElement('tr');
    var td = Utils.createElement('td', {
      colSpan: 8,
      style: 'text-align: center; padding: var(--space-2xl); color: var(--color-text-secondary);'
    });

    var spinner = Utils.createElement('div', {
      className: 'spinner',
      style: 'margin: 0 auto var(--space-sm) auto;'
    });
    var text = Utils.createElement('div', {
      textContent: 'Loading active clinical alerts triage...'
    });

    td.appendChild(spinner);
    td.appendChild(text);
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  /**
   * Displays error state in table.
   */
  function renderErrorState(errorMessage) {
    var tbody = Utils.qs('#alerts-table-body');
    if (!tbody) return;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    var tr = document.createElement('tr');
    var td = Utils.createElement('td', {
      colSpan: 8,
      style: 'text-align: center; padding: var(--space-2xl);'
    });

    var errorEl = UI.createErrorState(
      'Unable to Retrieve Alerts',
      errorMessage,
      function () { loadAlerts(); }
    );

    td.appendChild(errorEl);
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  /**
   * Updates total count display badge.
   */
  function updateCountBadge() {
    var badge = Utils.qs('#alerts-count-badge');
    if (badge) {
      badge.textContent = state.total + ' Incident' + (state.total === 1 ? '' : 's');
    }
  }

  /**
   * Renders table rows for alert records.
   */
  function renderAlertsTable(alerts) {
    var tbody = Utils.qs('#alerts-table-body');
    if (!tbody) return;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (alerts.length === 0) {
      var trEmpty = document.createElement('tr');
      var tdEmpty = Utils.createElement('td', {
        colSpan: 8,
        style: 'text-align: center; padding: var(--space-2xl);'
      });

      var isFiltered = state.q || state.status !== 'all' || state.severity !== 'all';
      var emptyEl = UI.createEmptyState(
        'No Clinical Alerts Found',
        isFiltered
          ? 'No simulated threshold incidents match the specified filter criteria.'
          : 'All telemetry parameters remain within normal physiological ranges.',
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

    for (var i = 0; i < alerts.length; i++) {
      var al = alerts[i];
      var tr = document.createElement('tr');

      // Severity left border indicator
      var sevLower = (al.severity || 'info').toLowerCase();
      tr.className = 'alert-row-' + sevLower;

      // 1. Alert ID
      var tdId = document.createElement('td');
      var idLink = Utils.createElement('button', {
        type: 'button',
        className: 'btn-link',
        style: 'font-family: var(--font-family-mono); font-weight: var(--font-weight-bold); color: var(--color-accent-teal); cursor: pointer; background: none; border: none; padding: 0; text-decoration: underline;',
        textContent: al.id || 'N/A',
        'aria-label': 'View details for alert ' + al.id
      });
      (function (currentAlert) {
        idLink.addEventListener('click', function () {
          showAlertDetailsModal(currentAlert);
        });
      })(al);
      tdId.appendChild(idLink);
      tr.appendChild(tdId);

      // 2. Patient ID
      var tdPatient = document.createElement('td');
      var ptLink = Utils.createElement('a', {
        href: 'patient-details.html?id=' + encodeURIComponent(al.patientId),
        className: 'badge badge-neutral',
        style: 'font-family: var(--font-family-mono); text-decoration: none;',
        textContent: al.patientId || 'N/A'
      });
      tdPatient.appendChild(ptLink);
      tr.appendChild(tdPatient);

      // 3. Title & Incident Message
      var tdTitle = document.createElement('td');
      tdTitle.style.maxWidth = '300px';
      var titleDiv = Utils.createElement('div', {
        style: 'font-weight: var(--font-weight-bold); color: var(--color-primary-navy); overflow: hidden; text-overflow: ellipsis;',
        textContent: al.title || 'Threshold Warning'
      });
      var msgDiv = Utils.createElement('div', {
        style: 'font-size: var(--font-size-xs); color: var(--color-text-secondary); overflow: hidden; text-overflow: ellipsis;',
        textContent: al.message || ''
      });
      tdTitle.appendChild(titleDiv);
      tdTitle.appendChild(msgDiv);
      tr.appendChild(tdTitle);

      // 4. Severity Badge
      var tdSev = document.createElement('td');
      var sevBadgeClass = 'badge-neutral';
      if (al.severity === 'Critical') sevBadgeClass = 'badge-error';
      else if (al.severity === 'High') sevBadgeClass = 'badge-warning';
      else if (al.severity === 'Warning') sevBadgeClass = 'badge-warning';
      else if (al.severity === 'Info') sevBadgeClass = 'badge-info';

      var sevBadge = Utils.createElement('span', {
        className: 'badge ' + sevBadgeClass,
        textContent: al.severity || 'Info'
      });
      tdSev.appendChild(sevBadge);
      tr.appendChild(tdSev);

      // 5. Status Badge
      var tdStatus = document.createElement('td');
      var stBadgeClass = 'badge-error';
      if (al.status === 'Active') stBadgeClass = 'badge-error';
      else if (al.status === 'Acknowledged') stBadgeClass = 'badge-warning';
      else if (al.status === 'Resolved') stBadgeClass = 'badge-success';

      var stBadge = Utils.createElement('span', {
        className: 'badge ' + stBadgeClass,
        textContent: al.status || 'Active'
      });
      tdStatus.appendChild(stBadge);
      tr.appendChild(tdStatus);

      // 6. Triggered Timestamp
      var tdTime = Utils.createElement('td', {
        style: 'font-size: var(--font-size-xs); color: var(--color-text-secondary);',
        textContent: Utils.formatDateTime(al.createdAt)
      });
      tr.appendChild(tdTime);

      // 7. Handled By / Attribution
      var tdAttr = document.createElement('td');
      tdAttr.style.fontSize = 'var(--font-size-xs)';
      if (al.status === 'Resolved') {
        tdAttr.textContent = 'Res: ' + (al.resolvedBy || al.acknowledgedBy || 'Staff');
        tdAttr.style.color = 'var(--color-success)';
      } else if (al.status === 'Acknowledged') {
        tdAttr.textContent = 'Ack: ' + (al.acknowledgedBy || 'Staff');
        tdAttr.style.color = 'var(--color-warning)';
      } else {
        tdAttr.textContent = 'Pending Triage';
        tdAttr.style.color = 'var(--color-error)';
      }
      tr.appendChild(tdAttr);

      // 8. Actions
      var tdActions = document.createElement('td');
      var actionsWrapper = Utils.createElement('div', { className: 'alert-actions-cell' });

      // Details button
      var detailsBtn = Utils.createElement('button', {
        type: 'button',
        className: 'btn btn-outline btn-sm',
        style: 'padding: 0.25rem 0.5rem; font-size: var(--font-size-xs);',
        textContent: 'Details',
        'aria-label': 'View incident details for ' + al.id
      });
      (function (currentAlert) {
        detailsBtn.addEventListener('click', function () {
          showAlertDetailsModal(currentAlert);
        });
      })(al);
      actionsWrapper.appendChild(detailsBtn);

      // Acknowledge button (Active only)
      if (al.status === 'Active') {
        var ackBtn = Utils.createElement('button', {
          type: 'button',
          className: 'btn btn-outline btn-sm',
          style: 'padding: 0.25rem 0.5rem; font-size: var(--font-size-xs);',
          textContent: 'Acknowledge',
          'aria-label': 'Acknowledge alert ' + al.id,
          disabled: !canUpdateAlerts
        });
        if (!canUpdateAlerts) {
          ackBtn.title = 'Reviewer role has read-only access';
        } else {
          (function (currentAlert) {
            ackBtn.addEventListener('click', function () {
              confirmTransition(currentAlert, 'Acknowledged');
            });
          })(al);
        }
        actionsWrapper.appendChild(ackBtn);
      }

      // Resolve button (Active or Acknowledged)
      if (al.status !== 'Resolved') {
        var resBtn = Utils.createElement('button', {
          type: 'button',
          className: 'btn btn-primary btn-sm',
          style: 'padding: 0.25rem 0.5rem; font-size: var(--font-size-xs); background-color: var(--color-success); border-color: var(--color-success);',
          textContent: 'Resolve',
          'aria-label': 'Resolve alert ' + al.id,
          disabled: !canUpdateAlerts
        });
        if (!canUpdateAlerts) {
          resBtn.title = 'Reviewer role has read-only access';
        } else {
          (function (currentAlert) {
            resBtn.addEventListener('click', function () {
              confirmTransition(currentAlert, 'Resolved');
            });
          })(al);
        }
        actionsWrapper.appendChild(resBtn);
      }

      tdActions.appendChild(actionsWrapper);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    }
  }

  /**
   * Accessible modal showing complete alert details and metadata.
   */
  function showAlertDetailsModal(alert) {
    var contentEl = Utils.createElement('div', { className: 'alert-modal-content' });

    // Grid of metadata
    var metaGrid = Utils.createElement('div', { className: 'alert-modal-meta-grid' });

    // Patient ID
    var ptItem = Utils.createElement('div', { className: 'alert-modal-meta-item' }, [
      Utils.createElement('strong', { textContent: 'Subject / Patient ID' }),
      Utils.createElement('a', {
        href: 'patient-details.html?id=' + encodeURIComponent(alert.patientId),
        style: 'color: var(--color-accent-teal); text-decoration: underline; font-family: var(--font-family-mono); font-weight: bold;',
        textContent: alert.patientId || 'PT-XXXX'
      })
    ]);
    metaGrid.appendChild(ptItem);

    // Severity
    var sevItem = Utils.createElement('div', { className: 'alert-modal-meta-item' }, [
      Utils.createElement('strong', { textContent: 'Severity Level' }),
      Utils.createElement('span', {
        className: 'badge ' + (alert.severity === 'Critical' ? 'badge-error' : (alert.severity === 'High' ? 'badge-warning' : 'badge-info')),
        textContent: alert.severity || 'Info'
      })
    ]);
    metaGrid.appendChild(sevItem);

    // Status
    var stItem = Utils.createElement('div', { className: 'alert-modal-meta-item' }, [
      Utils.createElement('strong', { textContent: 'Lifecycle Status' }),
      Utils.createElement('span', {
        className: 'badge ' + (alert.status === 'Active' ? 'badge-error' : (alert.status === 'Acknowledged' ? 'badge-warning' : 'badge-success')),
        textContent: alert.status || 'Active'
      })
    ]);
    metaGrid.appendChild(stItem);

    // Triggered Timestamp
    var tsItem = Utils.createElement('div', { className: 'alert-modal-meta-item' }, [
      Utils.createElement('strong', { textContent: 'Triggered Timestamp' }),
      Utils.createElement('span', { textContent: Utils.formatDateTime(alert.createdAt) })
    ]);
    metaGrid.appendChild(tsItem);

    contentEl.appendChild(metaGrid);

    // Incident Title & Message Box
    var msgBox = Utils.createElement('div', { className: 'alert-modal-message-box' }, [
      Utils.createElement('h3', {
        style: 'font-size: var(--font-size-base); font-weight: var(--font-weight-bold); color: var(--color-primary-navy); margin-bottom: var(--space-xs);',
        textContent: alert.title || 'Simulated Threshold Incident'
      }),
      Utils.createElement('p', {
        style: 'margin: 0; color: var(--color-text-primary); line-height: 1.5;',
        textContent: alert.message || 'Synthetic telemetry exceeded defined monitoring boundaries.'
      })
    ]);
    contentEl.appendChild(msgBox);

    // Rule & Protocol Metadata
    var protocol = (alert.metadata && alert.metadata.protocol) || 'Standard Response Protocol';
    var ruleId = (alert.metadata && alert.metadata.mockRuleId) || 'RULE-SIM-XX';

    var metaBox = Utils.createElement('div', {
      style: 'background-color: var(--color-bg-subtle); padding: var(--space-sm) var(--space-md); border-radius: var(--radius-md); font-size: var(--font-size-xs); color: var(--color-text-secondary);'
    }, [
      Utils.createElement('div', { textContent: 'Automated Rule: ' + ruleId + ' \u2022 Protocol: ' + protocol }),
      Utils.createElement('div', {
        style: 'margin-top: 4px;',
        textContent: 'Acknowledged By: ' + (alert.acknowledgedBy || 'None') + ' \u2022 Resolved By: ' + (alert.resolvedBy || 'None')
      })
    ]);
    contentEl.appendChild(metaBox);

    // Modal Actions
    var actions = [];

    var closeBtn = Utils.createElement('button', {
      type: 'button',
      className: 'btn btn-outline',
      textContent: 'Close'
    });
    actions.push(closeBtn);

    var modalInstance = Utils.openModal({
      title: 'Alert Incident: ' + (alert.id || 'N/A'),
      content: contentEl,
      actions: actions
    });

    closeBtn.addEventListener('click', function () {
      modalInstance.close();
    });
  }

  /**
   * Prompts user with confirmation dialog for status transitions (Acknowledge / Resolve).
   */
  function confirmTransition(alert, targetStatus) {
    if (!canUpdateAlerts) {
      Utils.showToast('You do not have permission to update alerts.', 'error');
      return;
    }

    var actionVerb = targetStatus === 'Acknowledged' ? 'acknowledge' : 'resolve';
    var title = targetStatus === 'Acknowledged' ? 'Confirm Alert Acknowledgment' : 'Confirm Alert Resolution';
    var message = 'Are you sure you want to ' + actionVerb + ' incident ' + alert.id + ' for patient ' + alert.patientId + '?';

    UI.showConfirmModal({
      title: title,
      message: message,
      confirmText: targetStatus === 'Acknowledged' ? 'Acknowledge Alert' : 'Resolve Alert',
      confirmVariant: targetStatus === 'Acknowledged' ? 'btn-primary' : 'btn-primary',
      onConfirm: function () {
        return executeStatusUpdate(alert, targetStatus);
      }
    });
  }

  /**
   * Sends PATCH /admin/alerts/{id} to update status in the mock/API provider.
   */
  function executeStatusUpdate(alert, newStatus) {
    var patchPayload = {
      status: newStatus,
      acknowledgedBy: currentUser.name || 'Healthcare Staff'
    };

    if (newStatus === 'Resolved') {
      patchPayload.resolvedBy = currentUser.name || 'Healthcare Staff';
    }

    return Api.request('/admin/alerts/' + encodeURIComponent(alert.id), {
      method: 'PATCH',
      body: patchPayload
    }).then(function (response) {
      if (response.ok && response.data) {
        // EXACT REQUIREMENT: Show exact demo persistence notice
        Utils.showToast('Demo Mode - saved only in this browser session, not in any real database.', 'success');

        // Refresh alerts list and counts
        loadAlerts();
      } else {
        Utils.showToast(response.error || 'Failed to update alert status.', 'error');
      }
    }).catch(function (err) {
      Utils.showToast(err.message || 'Network error updating alert status.', 'error');
    });
  }

  /**
   * Renders pagination controls.
   */
  function renderPagination() {
    var container = Utils.qs('#alerts-pagination-container');
    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    var paginationEl = UI.createPagination({
      page: state.page,
      pageSize: state.pageSize,
      total: state.total,
      itemName: 'alerts',
      onPageChange: function (newPage) {
        state.page = newPage;
        syncUrl();
        loadAlerts();
        var mainContent = Utils.qs('#main-alerts');
        if (mainContent) mainContent.scrollIntoView({ behavior: 'smooth' });
      },
      onPageSizeChange: function (newPageSize) {
        state.pageSize = newPageSize;
        state.page = 1;
        syncUrl();
        loadAlerts();
      }
    });

    container.appendChild(paginationEl);
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
