/**
 * VitalGuard AI - Patient Observations & Vital Signs Telemetry Controller
 * assets/js/observations.js
 *
 * Implements Module 4: Patient Observations & Vital Signs Telemetry:
 * - Route guarding via VitalGuardAuth.requireAuth()
 * - Centralized fetch from GET /admin/observations with query/filter/sort/pagination parameters
 * - Responsive table rendering with sortable headers, vital type badges, and sensor gap handling
 * - Observation Details modal with telemetry sensor metadata and simulation notices
 * - URL query state synchronization and popstate Back/Forward browser restoration
 *
 * SAFE DOM MANDATE: Uses createElement, createTextNode, and textContent exclusively.
 * Zero dynamic innerHTML execution.
 */

(function (window, document) {
  'use strict';

  var Config = window.VitalGuardConfig || {};
  var Api = window.VitalGuardApi;
  var Auth = window.VitalGuardAuth;
  var Utils = window.VitalGuardUtils;
  var UI = window.VitalGuardUIComponents;

  // ---------------------------------------------------------------------------
  // 1. Authentication & Route Guard
  // ---------------------------------------------------------------------------
  if (!Auth || typeof Auth.requireAuth !== 'function') {
    window.location.href = '../login.html';
    return;
  }

  var currentUser = Auth.requireAuth();
  if (!currentUser) {
    return; // Redirection handled by requireAuth
  }

  // ---------------------------------------------------------------------------
  // 2. Query & Filter State
  // ---------------------------------------------------------------------------
  var state = {
    q: '',
    patientId: '',
    type: 'all',
    status: 'all',
    sortBy: 'timestamp',
    sortDir: 'desc',
    page: 1,
    pageSize: 10,
    totalRecords: 0
  };

  var patientsCache = [];

  // ---------------------------------------------------------------------------
  // 3. Initialization
  // ---------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    setupUserProfileUI();
    setupNavigationHandlers();
    parseUrlParams();
    bindFilterEvents();
    loadPatientsDropdown();
    fetchAndRenderObservations();

    window.addEventListener('popstate', function () {
      parseUrlParams();
      syncFormWithState();
      fetchAndRenderObservations(false);
    });
  });

  /**
   * Renders authenticated user details into sidebar and topbar.
   */
  function setupUserProfileUI() {
    var initials = 'US';
    if (currentUser.name) {
      var parts = currentUser.name.split(' ');
      initials = parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : currentUser.name.substring(0, 2).toUpperCase();
    }

    Utils.setText('#sidebar-user-initials', initials);
    Utils.setText('#sidebar-user-name', currentUser.name || 'Healthcare Professional');
    Utils.setText('#sidebar-user-role', currentUser.role || 'Staff');
    Utils.setText('#topbar-user-badge', currentUser.role || 'User');
  }

  /**
   * Sets up responsive sidebar drawer and sign-out button.
   */
  function setupNavigationHandlers() {
    var menuToggleBtn = Utils.qs('#sidebar-toggle-btn') || Utils.qs('#btn-menu-toggle');
    var sidebar = Utils.qs('#app-sidebar');
    var backdrop = Utils.qs('#sidebar-backdrop');
    var logoutBtn = Utils.qs('#btn-logout') || Utils.qs('#btn-topbar-logout');

    if (menuToggleBtn && sidebar && backdrop) {
      menuToggleBtn.addEventListener('click', function () {
        var isOpen = sidebar.classList.toggle('is-open');
        backdrop.classList.toggle('is-visible', isOpen);
        menuToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      backdrop.addEventListener('click', function () {
        sidebar.classList.remove('is-open');
        backdrop.classList.remove('is-visible');
        menuToggleBtn.setAttribute('aria-expanded', 'false');
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        Auth.logout();
        Utils.showToast('You have been signed out.', 'info');
        setTimeout(function () {
          window.location.href = '../login.html?reason=logged_out';
        }, 200);
      });
    }
  }

  /**
   * Parses query parameters from current window URL.
   */
  function parseUrlParams() {
    var params = new URLSearchParams(window.location.search);
    state.q = params.get('q') || '';
    state.patientId = params.get('patientId') || '';
    state.type = params.get('type') || 'all';
    state.status = params.get('status') || 'all';
    state.sortBy = params.get('sortBy') || 'timestamp';
    state.sortDir = params.get('sortDir') || 'desc';
    state.page = Math.max(1, parseInt(params.get('page'), 10) || 1);
    state.pageSize = Math.max(1, parseInt(params.get('pageSize'), 10) || 10);
  }

  /**
   * Pushes current state to browser history URL.
   */
  function updateUrlState() {
    var params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.patientId) params.set('patientId', state.patientId);
    if (state.type !== 'all') params.set('type', state.type);
    if (state.status !== 'all') params.set('status', state.status);
    if (state.sortBy !== 'timestamp') params.set('sortBy', state.sortBy);
    if (state.sortDir !== 'desc') params.set('sortDir', state.sortDir);
    if (state.page > 1) params.set('page', String(state.page));
    if (state.pageSize !== 10) params.set('pageSize', String(state.pageSize));

    var query = params.toString();
    var newUrl = window.location.pathname + (query ? '?' + query : '');
    window.history.pushState(null, '', newUrl);
  }

  /**
   * Synchronizes input controls with state object.
   */
  function syncFormWithState() {
    var searchInput = Utils.qs('#obs-search-input');
    var patientSelect = Utils.qs('#filter-patient');
    var typeSelect = Utils.qs('#filter-vital-type');
    var statusSelect = Utils.qs('#filter-status');
    var clearBtn = Utils.qs('#obs-search-clear');

    if (searchInput) {
      searchInput.value = state.q;
      if (clearBtn) {
        clearBtn.classList.toggle('is-visible', !!state.q);
      }
    }
    if (patientSelect) patientSelect.value = state.patientId;
    if (typeSelect) typeSelect.value = state.type;
    if (statusSelect) statusSelect.value = state.status;
  }

  /**
   * Loads patient roster to populate the Patient Filter dropdown.
   */
  function loadPatientsDropdown() {
    var patientSelect = Utils.qs('#filter-patient');
    if (!patientSelect) return;

    Api.request(Config.ENDPOINTS.ADMIN_PATIENTS, { params: { pageSize: 100 } })
      .then(function (res) {
        if (!res.ok || !res.data || !Array.isArray(res.data.items)) return;
        patientsCache = res.data.items;

        // Clear existing options except "All Patients"
        while (patientSelect.options.length > 1) {
          patientSelect.remove(1);
        }

        patientsCache.forEach(function (p) {
          var opt = Utils.createElement('option', {
            value: p.id,
            textContent: p.id + ' — ' + p.name
          });
          if (p.id === state.patientId) {
            opt.selected = true;
          }
          patientSelect.appendChild(opt);
        });
      })
      .catch(function () {});
  }

  /**
   * Binds toolbar search and filter interaction listeners.
   */
  function bindFilterEvents() {
    var searchInput = Utils.qs('#obs-search-input');
    var clearBtn = Utils.qs('#obs-search-clear');
    var patientSelect = Utils.qs('#filter-patient');
    var typeSelect = Utils.qs('#filter-vital-type');
    var statusSelect = Utils.qs('#filter-status');
    var resetBtn = Utils.qs('#btn-reset-filters');
    var refreshBtn = Utils.qs('#btn-refresh');

    syncFormWithState();

    if (searchInput) {
      var debouncedSearch = Utils.debounce(function () {
        state.q = searchInput.value.trim();
        state.page = 1;
        updateUrlState();
        fetchAndRenderObservations();
      }, 300);

      searchInput.addEventListener('input', function () {
        if (clearBtn) {
          clearBtn.classList.toggle('is-visible', !!searchInput.value.trim());
        }
        debouncedSearch();
      });
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener('click', function () {
        searchInput.value = '';
        clearBtn.classList.remove('is-visible');
        state.q = '';
        state.page = 1;
        updateUrlState();
        fetchAndRenderObservations();
        searchInput.focus();
      });
    }

    if (patientSelect) {
      patientSelect.addEventListener('change', function () {
        state.patientId = patientSelect.value;
        state.page = 1;
        updateUrlState();
        fetchAndRenderObservations();
      });
    }

    if (typeSelect) {
      typeSelect.addEventListener('change', function () {
        state.type = typeSelect.value;
        state.page = 1;
        updateUrlState();
        fetchAndRenderObservations();
      });
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', function () {
        state.status = statusSelect.value;
        state.page = 1;
        updateUrlState();
        fetchAndRenderObservations();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        state.q = '';
        state.patientId = '';
        state.type = 'all';
        state.status = 'all';
        state.sortBy = 'timestamp';
        state.sortDir = 'desc';
        state.page = 1;
        syncFormWithState();
        updateUrlState();
        fetchAndRenderObservations();
        Utils.showToast('Observation filters reset.', 'info');
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        fetchAndRenderObservations();
        Utils.showToast('Telemetry observations refreshed.', 'info');
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Data Fetching & Table Rendering
  // ---------------------------------------------------------------------------

  /**
   * Fetches telemetry observations from central API client and renders table.
   */
  function fetchAndRenderObservations(syncUrl) {
    if (syncUrl !== false) {
      syncFormWithState();
    }

    var tbody = Utils.qs('#observations-table-body');
    var badgeCount = Utils.qs('#observations-count-badge');
    var paginationContainer = Utils.qs('#observations-pagination-container');

    if (tbody) {
      while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
      var loadingTr = Utils.createElement('tr');
      var loadingTd = Utils.createElement('td', {
        colSpan: 8,
        style: 'text-align: center; padding: var(--space-xl);'
      });
      loadingTd.appendChild(UI.createLoadingState('Loading Telemetry Observations...'));
      loadingTr.appendChild(loadingTd);
      tbody.appendChild(loadingTr);
    }

    if (badgeCount) {
      badgeCount.textContent = 'Updating...';
    }

    var queryParams = {
      q: state.q,
      patientId: state.patientId,
      type: state.type,
      status: state.status,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      page: state.page,
      pageSize: state.pageSize
    };

    Api.request(Config.ENDPOINTS.ADMIN_OBSERVATIONS, { params: queryParams })
      .then(function (res) {
        if (!res.ok || !res.data) {
          renderErrorState(res.error || 'Failed to retrieve telemetry observations.');
          return;
        }

        var observations = res.data.items || [];
        state.totalRecords = res.data.total || 0;

        renderSummaryMetrics(res.data);
        renderTableHeaders();
        renderTableRows(observations);
        renderPagination();

        if (badgeCount) {
          badgeCount.textContent = state.totalRecords + ' Record' + (state.totalRecords === 1 ? '' : 's');
        }
      })
      .catch(function (err) {
        renderErrorState(err.message || 'Network exception while loading observations.');
      });
  }

  /**
   * Renders metric summary cards at the top of the view.
   */
  function renderSummaryMetrics(data) {
    // We can also fetch the total cohort count across all records
    Api.request(Config.ENDPOINTS.ADMIN_OBSERVATIONS)
      .then(function (allRes) {
        if (!allRes.ok || !allRes.data || !Array.isArray(allRes.data.items)) return;
        var allObs = allRes.data.items;

        var totalIngest = allObs.length;
        var recordedCount = 0;
        var gapCount = 0;
        var dqWarningCount = 0;

        for (var i = 0; i < allObs.length; i++) {
          var o = allObs[i];
          if (o.status === 'Recorded' && o.value !== null) {
            recordedCount++;
          } else {
            gapCount++;
          }
          if (o.dataQuality) {
            dqWarningCount++;
          }
        }

        Utils.setText('#metric-total-ingest', totalIngest.toLocaleString());
        Utils.setText('#metric-recorded-vitals', recordedCount.toLocaleString());
        Utils.setText('#metric-sensor-gaps', gapCount.toLocaleString());
        Utils.setText('#metric-quality-flags', dqWarningCount.toLocaleString());
      })
      .catch(function () {});
  }

  /**
   * Renders sortable column headers in the table thead row.
   */
  function renderTableHeaders() {
    var theadRow = Utils.qs('#observations-table-head-row');
    if (!theadRow) return;

    while (theadRow.firstChild) theadRow.removeChild(theadRow.firstChild);

    var columns = [
      { key: 'id', label: 'Observation ID' },
      { key: 'patientId', label: 'Patient Identifier' },
      { key: 'patientName', label: 'Patient Name' },
      { key: 'type', label: 'Vital Sign Type' },
      { key: 'value', label: 'Recorded Value' },
      { key: 'status', label: 'Measurement Status' },
      { key: 'timestamp', label: 'Timestamp' }
    ];

    columns.forEach(function (col) {
      var th = UI.createSortableHeader(
        col.label,
        col.key,
        state.sortBy,
        state.sortDir,
        function (newSortBy, newSortDir) {
          state.sortBy = newSortBy;
          state.sortDir = newSortDir;
          state.page = 1;
          updateUrlState();
          fetchAndRenderObservations();
        }
      );
      theadRow.appendChild(th);
    });

    // Actions header (non-sortable)
    var actionsTh = Utils.createElement('th', {
      scope: 'col',
      style: 'text-align: right;',
      textContent: 'Actions'
    });
    theadRow.appendChild(actionsTh);
  }

  /**
   * Renders observation records into table tbody.
   */
  function renderTableRows(observations) {
    var tbody = Utils.qs('#observations-table-body');
    if (!tbody) return;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (observations.length === 0) {
      var emptyTr = Utils.createElement('tr');
      var emptyTd = Utils.createElement('td', {
        colSpan: 8,
        style: 'text-align: center; padding: var(--space-2xl);'
      });
      emptyTd.appendChild(UI.createEmptyState(
        'No Telemetry Observations Found',
        'No simulated observations match your current filter criteria. Try adjusting or resetting your search filters.'
      ));
      emptyTr.appendChild(emptyTd);
      tbody.appendChild(emptyTr);
      return;
    }

    observations.forEach(function (obs) {
      var tr = Utils.createElement('tr', { id: 'row-' + obs.id });

      // 1. Observation ID
      var tdId = Utils.createElement('td');
      var idBadge = Utils.createElement('code', {
        style: 'font-weight: var(--font-weight-bold); color: var(--color-primary-navy);',
        textContent: obs.id
      });
      tdId.appendChild(idBadge);
      tr.appendChild(tdId);

      // 2. Patient Identifier
      var tdPatientId = Utils.createElement('td');
      var pLink = Utils.createElement('a', {
        href: 'patient-details.html?id=' + encodeURIComponent(obs.patientId),
        className: 'table-link',
        style: 'font-weight: var(--font-weight-semibold); color: var(--color-accent-teal); text-decoration: none;',
        textContent: obs.patientId
      });
      tdPatientId.appendChild(pLink);
      tr.appendChild(tdPatientId);

      // 3. Patient Name
      var tdPatientName = Utils.createElement('td', {
        textContent: obs.patientName || 'Unknown Patient'
      });
      tr.appendChild(tdPatientName);

      // 4. Vital Sign Type
      var tdType = Utils.createElement('td');
      var typeClass = 'vital-type-badge ';
      if (obs.type === 'Heart Rate') typeClass += 'vital-type-hr';
      else if (obs.type === 'Systolic Blood Pressure') typeClass += 'vital-type-sbp';
      else if (obs.type === 'Diastolic Blood Pressure') typeClass += 'vital-type-dbp';
      else if (obs.type.indexOf('SpO2') !== -1 || obs.type.indexOf('Oxygen') !== -1) typeClass += 'vital-type-spo2';
      else if (obs.type === 'Respiratory Rate') typeClass += 'vital-type-rr';
      else if (obs.type === 'Body Temperature') typeClass += 'vital-type-temp';
      else typeClass += 'badge-neutral';

      var typeSpan = Utils.createElement('span', {
        className: typeClass,
        textContent: obs.type
      });
      tdType.appendChild(typeSpan);
      tr.appendChild(tdType);

      // 5. Recorded Value
      var tdVal = Utils.createElement('td');
      if (obs.value !== null && obs.value !== undefined) {
        var valWrap = Utils.createElement('span', { className: 'vital-value-cell' });
        var valNum = Utils.createElement('span', { textContent: String(obs.value) });
        var valUnit = Utils.createElement('span', {
          className: 'vital-unit-text',
          textContent: ' ' + (obs.unit || '')
        });
        valWrap.appendChild(valNum);
        valWrap.appendChild(valUnit);
        tdVal.appendChild(valWrap);
      } else {
        var gapBadge = Utils.createElement('span', {
          className: 'vital-gap-badge',
          textContent: 'Sensor Gap (null)'
        });
        tdVal.appendChild(gapBadge);
      }
      tr.appendChild(tdVal);

      // 6. Measurement Status & Quality Flags
      var tdStatus = Utils.createElement('td');
      var statusContainer = Utils.createElement('div', {
        style: 'display: flex; flex-direction: column; gap: var(--space-3xs); align-items: flex-start;'
      });

      if (obs.status === 'Recorded' && obs.value !== null) {
        var recBadge = Utils.createElement('span', {
          className: 'badge badge-success',
          style: 'font-size: 0.7rem;',
          textContent: 'Recorded'
        });
        statusContainer.appendChild(recBadge);
      } else {
        var gapStatusBadge = Utils.createElement('span', {
          className: 'badge badge-neutral',
          style: 'font-size: 0.7rem;',
          textContent: 'Sensor Gap'
        });
        statusContainer.appendChild(gapStatusBadge);
      }

      if (obs.dataQuality) {
        var dqPill = Utils.createElement('span', {
          className: 'dq-flag-pill ' + (obs.dataQuality.level === 'warning' ? 'dq-flag-warning' : 'dq-flag-info'),
          title: obs.dataQuality.message || obs.dataQuality.flag,
          textContent: '⚠ ' + obs.dataQuality.flag
        });
        statusContainer.appendChild(dqPill);
      }

      tdStatus.appendChild(statusContainer);
      tr.appendChild(tdStatus);

      // 7. Timestamp
      var tdTimestamp = Utils.createElement('td');
      var timeMain = Utils.createElement('div', {
        style: 'white-space: nowrap;',
        textContent: Utils.formatDate(obs.timestamp)
      });
      var timeRelative = Utils.createElement('div', {
        style: 'font-size: var(--font-size-2xs); color: var(--color-text-muted);',
        textContent: Utils.formatRelativeTime(obs.timestamp)
      });
      tdTimestamp.appendChild(timeMain);
      tdTimestamp.appendChild(timeRelative);
      tr.appendChild(tdTimestamp);

      // 8. Actions
      var tdActions = Utils.createElement('td', { style: 'text-align: right;' });
      var inspectBtn = Utils.createElement('button', {
        type: 'button',
        className: 'btn btn-outline btn-sm',
        'aria-label': 'Inspect telemetry details for ' + obs.id,
        textContent: 'Inspect'
      });
      inspectBtn.addEventListener('click', function () {
        openObservationDetailsModal(obs);
      });
      tdActions.appendChild(inspectBtn);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    });
  }

  /**
   * Renders pagination navigation controls.
   */
  function renderPagination() {
    var container = Utils.qs('#observations-pagination-container');
    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    var paginationEl = UI.createPagination({
      page: state.page,
      pageSize: state.pageSize,
      total: state.totalRecords,
      itemName: 'observations',
      onPageChange: function (newPage) {
        state.page = newPage;
        updateUrlState();
        fetchAndRenderObservations();
      },
      onPageSizeChange: function (newPageSize) {
        state.pageSize = newPageSize;
        state.page = 1;
        updateUrlState();
        fetchAndRenderObservations();
      }
    });

    container.appendChild(paginationEl);
  }

  /**
   * Displays accessible error state when request fails.
   */
  function renderErrorState(errorMessage) {
    var tbody = Utils.qs('#observations-table-body');
    if (!tbody) return;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    var errTr = Utils.createElement('tr');
    var errTd = Utils.createElement('td', {
      colSpan: 8,
      style: 'text-align: center; padding: var(--space-xl);'
    });

    errTd.appendChild(UI.createErrorState(
      'Telemetry Observation Service Unavailable',
      errorMessage,
      function () {
        fetchAndRenderObservations();
      }
    ));

    errTr.appendChild(errTd);
    tbody.appendChild(errTr);
  }

  // ---------------------------------------------------------------------------
  // 5. Observation Details Modal
  // ---------------------------------------------------------------------------

  /**
   * Opens focus-trapped, accessible modal displaying complete telemetry metadata.
   */
  function openObservationDetailsModal(obs) {
    var meta = obs.metadata || {};
    var valDisplay = obs.value !== null && obs.value !== undefined
      ? obs.value + ' ' + (obs.unit || '')
      : 'Measurement Gap (null)';

    var modalBody = Utils.createElement('div', { className: 'obs-modal-content' }, [
      // Academic & Simulation Disclaimer
      Utils.createElement('div', {
        className: 'alert alert-info',
        style: 'margin-bottom: var(--space-md); font-size: var(--font-size-xs);'
      }, [
        Utils.createElement('div', {
          className: 'alert-title',
          textContent: 'Academic Research Prototype — Simulated Telemetry'
        }),
        Utils.createElement('div', {
          textContent: 'All physiological telemetry recordings, sensor gap patterns, and data quality flags are mathematically generated sample fixtures. Source: "simulated". Not clinically validated.'
        })
      ]),

      // Detail Grid
      Utils.createElement('div', { className: 'obs-detail-grid' }, [
        // Observation ID
        Utils.createElement('div', { className: 'obs-detail-item' }, [
          Utils.createElement('div', { className: 'obs-detail-label', textContent: 'Observation ID' }),
          Utils.createElement('div', { className: 'obs-detail-value', textContent: obs.id })
        ]),

        // Timestamp
        Utils.createElement('div', { className: 'obs-detail-item' }, [
          Utils.createElement('div', { className: 'obs-detail-label', textContent: 'Recording Timestamp' }),
          Utils.createElement('div', { className: 'obs-detail-value', textContent: Utils.formatDate(obs.timestamp) + ' (' + obs.timestamp + ')' })
        ]),

        // Patient ID
        Utils.createElement('div', { className: 'obs-detail-item' }, [
          Utils.createElement('div', { className: 'obs-detail-label', textContent: 'Patient Identifier' }),
          Utils.createElement('div', { className: 'obs-detail-value' }, [
            Utils.createElement('a', {
              href: 'patient-details.html?id=' + encodeURIComponent(obs.patientId),
              style: 'color: var(--color-accent-teal); font-weight: var(--font-weight-semibold); text-decoration: none;',
              textContent: obs.patientId + ' (' + (obs.patientName || 'Subject') + ')'
            })
          ])
        ]),

        // Vital Sign Type & Value
        Utils.createElement('div', { className: 'obs-detail-item' }, [
          Utils.createElement('div', { className: 'obs-detail-label', textContent: 'Vital Sign Type & Value' }),
          Utils.createElement('div', { className: 'obs-detail-value', textContent: obs.type + ' — ' + valDisplay })
        ]),

        // Measurement Status
        Utils.createElement('div', { className: 'obs-detail-item' }, [
          Utils.createElement('div', { className: 'obs-detail-label', textContent: 'Measurement Status' }),
          Utils.createElement('div', { className: 'obs-detail-value', textContent: obs.status })
        ]),

        // Sensor Model
        Utils.createElement('div', { className: 'obs-detail-item' }, [
          Utils.createElement('div', { className: 'obs-detail-label', textContent: 'Sensor Hardware Model' }),
          Utils.createElement('div', { className: 'obs-detail-value', textContent: meta.sensorModel || 'SyntheticTelemetrySensor-Model-X' })
        ]),

        // Reliability & Validation
        Utils.createElement('div', { className: 'obs-detail-item' }, [
          Utils.createElement('div', { className: 'obs-detail-label', textContent: 'Measurement Reliability' }),
          Utils.createElement('div', { className: 'obs-detail-value', textContent: meta.measurementReliability || 'High (Simulated)' })
        ]),

        // Data Source Tag
        Utils.createElement('div', { className: 'obs-detail-item' }, [
          Utils.createElement('div', { className: 'obs-detail-label', textContent: 'Provenance Tag' }),
          Utils.createElement('div', { className: 'obs-detail-value', textContent: 'source: "' + obs.source + '"' })
        ]),

        // Data Quality Advisory (if present)
        obs.dataQuality ? Utils.createElement('div', { className: 'obs-detail-item obs-detail-item-full' }, [
          Utils.createElement('div', { className: 'obs-detail-label', textContent: 'Sensor Data Quality Advisory' }),
          Utils.createElement('div', {
            className: 'alert alert-' + (obs.dataQuality.level === 'warning' ? 'warning' : 'info'),
            style: 'margin: var(--space-3xs) 0 0 0; padding: var(--space-xs) var(--space-sm); font-size: var(--font-size-xs);'
          }, [
            Utils.createElement('div', { className: 'alert-title', textContent: obs.dataQuality.flag }),
            Utils.createElement('div', { textContent: obs.dataQuality.message })
          ])
        ]) : null
      ].filter(Boolean))
    ]);

    var closeBtn = Utils.createElement('button', {
      type: 'button',
      className: 'btn btn-primary',
      textContent: 'Close'
    });

    var patientBtn = Utils.createElement('a', {
      href: 'patient-details.html?id=' + encodeURIComponent(obs.patientId),
      className: 'btn btn-outline',
      textContent: 'View Patient History'
    });

    var modal = Utils.openModal({
      title: 'Telemetry Observation Inspection — ' + obs.id,
      content: modalBody,
      actions: [patientBtn, closeBtn]
    });

    closeBtn.addEventListener('click', function () {
      modal.close();
    });
  }

})(window, document);
