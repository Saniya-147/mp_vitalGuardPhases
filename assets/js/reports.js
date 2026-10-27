/**
 * VitalGuard AI - Clinical Reports Controller
 * assets/js/reports.js
 */

(function (window) {
  'use strict';

  // State
  var state = {
    q: '',
    type: 'all',
    status: 'all',
    format: 'all',
    sortBy: 'generatedDate',
    sortDir: 'desc',
    page: 1,
    pageSize: 10,
    total: 0,
    items: [],
    activeReportForModal: null
  };

  /**
   * DOM Elements Cache
   */
  var dom = {};

  /**
   * Initialize Clinical Reports Page
   */
  function init() {
    // 1. Enforce Authentication
    if (!window.VitalGuardAuth || !window.VitalGuardAuth.requireAuth()) {
      return;
    }

    cacheDOMElements();
    setupHeaderUser();
    setupSidebarToggle();

    // 2. Enforce Role-Based Permission (view:reports)
    var canViewReports = window.VitalGuardAuth.hasPermission('view:reports');
    if (!canViewReports) {
      if (window.VitalGuardUtils && window.VitalGuardUtils.showToast) {
        window.VitalGuardUtils.showToast('You do not have permission to view clinical reports.', 'error');
      }
      setTimeout(function () {
        window.location.href = 'dashboard.html';
      }, 1000);
      return;
    }

    // 3. Read state from URL query parameters
    readUrlParams();

    // 4. Setup Event Listeners
    setupEventListeners();

    // 5. Fetch initial reports data
    fetchReports();
  }

  /**
   * Cache critical DOM references
   */
  function cacheDOMElements() {
    dom.searchInput = document.getElementById('input-report-search');
    dom.typeFilter = document.getElementById('select-type-filter');
    dom.formatFilter = document.getElementById('select-format-filter');
    dom.statusFilter = document.getElementById('select-status-filter');
    dom.btnResetFilters = document.getElementById('btn-reset-filters');
    dom.reportCountDisplay = document.getElementById('report-count-display');

    dom.table = document.getElementById('reports-table');
    dom.tableBody = document.getElementById('reports-table-body');
    dom.emptyState = document.getElementById('reports-empty-state');
    dom.loadingState = document.getElementById('reports-loading-state');

    dom.paginationBar = document.getElementById('reports-pagination-bar');
    dom.paginationInfo = document.getElementById('pagination-info');
    dom.pageSizeSelect = document.getElementById('select-page-size');
    dom.paginationControls = document.getElementById('pagination-controls');

    dom.btnGenerateReport = document.getElementById('btn-generate-report');
    dom.modalGenerate = document.getElementById('modal-generate-report');
    dom.formGenerate = document.getElementById('form-generate-report');
    dom.btnCloseGenerateModal = document.getElementById('btn-close-generate-modal');
    dom.btnCancelGenerate = document.getElementById('btn-cancel-generate');

    dom.modalDetails = document.getElementById('modal-report-details');
    dom.btnCloseDetailsModal = document.getElementById('btn-close-details-modal');
    dom.btnDismissDetails = document.getElementById('btn-dismiss-details');
    dom.detailsGrid = document.getElementById('report-details-grid');
    dom.detailsDescription = document.getElementById('details-report-description');
    dom.btnModalDownload = document.getElementById('btn-modal-download-report');
    dom.btnModalDownloadLabel = document.getElementById('btn-modal-download-label');
  }

  /**
   * Render user details in header and sidebar
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
    if (topbarRole) topbarRole.textContent = user.role || 'Staff';

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
   * Parse query parameters from URL into state
   */
  function readUrlParams() {
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.has('q')) state.q = params.get('q');
      if (params.has('type')) state.type = params.get('type');
      if (params.has('format')) state.format = params.get('format');
      if (params.has('status')) state.status = params.get('status');
      if (params.has('sortBy')) state.sortBy = params.get('sortBy');
      if (params.has('sortDir')) state.sortDir = params.get('sortDir');
      if (params.has('page')) state.page = Math.max(1, parseInt(params.get('page'), 10) || 1);
      if (params.has('pageSize')) state.pageSize = Math.max(1, parseInt(params.get('pageSize'), 10) || 10);

      // Reflect in UI controls
      if (dom.searchInput) dom.searchInput.value = state.q;
      if (dom.typeFilter) dom.typeFilter.value = state.type;
      if (dom.formatFilter) dom.formatFilter.value = state.format;
      if (dom.statusFilter) dom.statusFilter.value = state.status;
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
      if (state.type && state.type !== 'all') params.set('type', state.type);
      if (state.format && state.format !== 'all') params.set('format', state.format);
      if (state.status && state.status !== 'all') params.set('status', state.status);
      if (state.sortBy && state.sortBy !== 'generatedDate') params.set('sortBy', state.sortBy);
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
          fetchReports();
        }, 300);
      });
    }

    // Type filter
    if (dom.typeFilter) {
      dom.typeFilter.addEventListener('change', function (e) {
        state.type = e.target.value;
        state.page = 1;
        syncUrlParams();
        fetchReports();
      });
    }

    // Format filter
    if (dom.formatFilter) {
      dom.formatFilter.addEventListener('change', function (e) {
        state.format = e.target.value;
        state.page = 1;
        syncUrlParams();
        fetchReports();
      });
    }

    // Status filter
    if (dom.statusFilter) {
      dom.statusFilter.addEventListener('change', function (e) {
        state.status = e.target.value;
        state.page = 1;
        syncUrlParams();
        fetchReports();
      });
    }

    // Reset filters
    if (dom.btnResetFilters) {
      dom.btnResetFilters.addEventListener('click', function () {
        state.q = '';
        state.type = 'all';
        state.format = 'all';
        state.status = 'all';
        state.page = 1;
        if (dom.searchInput) dom.searchInput.value = '';
        if (dom.typeFilter) dom.typeFilter.value = 'all';
        if (dom.formatFilter) dom.formatFilter.value = 'all';
        if (dom.statusFilter) dom.statusFilter.value = 'all';
        syncUrlParams();
        fetchReports();
      });
    }

    // Page size
    if (dom.pageSizeSelect) {
      dom.pageSizeSelect.addEventListener('change', function (e) {
        state.pageSize = parseInt(e.target.value, 10) || 10;
        state.page = 1;
        syncUrlParams();
        fetchReports();
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
              state.sortDir = (col === 'generatedDate' ? 'desc' : 'asc');
            }
            updateSortHeaderAria();
            syncUrlParams();
            fetchReports();
          });
        })(sortHeaders[sh]);
      }
    }

    // Generate Report modal handlers
    if (dom.btnGenerateReport) dom.btnGenerateReport.addEventListener('click', openGenerateModal);
    if (dom.btnCloseGenerateModal) dom.btnCloseGenerateModal.addEventListener('click', closeGenerateModal);
    if (dom.btnCancelGenerate) dom.btnCancelGenerate.addEventListener('click', closeGenerateModal);
    if (dom.formGenerate) dom.formGenerate.addEventListener('submit', handleGenerateSubmit);

    // Report Details modal handlers
    if (dom.btnCloseDetailsModal) dom.btnCloseDetailsModal.addEventListener('click', closeDetailsModal);
    if (dom.btnDismissDetails) dom.btnDismissDetails.addEventListener('click', closeDetailsModal);

    if (dom.btnModalDownload) {
      dom.btnModalDownload.addEventListener('click', function () {
        if (state.activeReportForModal) {
          downloadReport(state.activeReportForModal);
        }
      });
    }

    // Escape key modal dismiss
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeGenerateModal();
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
   * Fetch clinical reports from API client
   */
  function fetchReports() {
    showLoading();

    var baseEndpoint = (window.VitalGuardConfig && window.VitalGuardConfig.ENDPOINTS && window.VitalGuardConfig.ENDPOINTS.ADMIN_REPORTS) || '/admin/reports';
    var queryParts = [
      'sortBy=' + encodeURIComponent(state.sortBy),
      'sortDir=' + encodeURIComponent(state.sortDir),
      'page=' + state.page,
      'pageSize=' + state.pageSize
    ];

    if (state.q) queryParts.push('q=' + encodeURIComponent(state.q));
    if (state.type && state.type !== 'all') queryParts.push('type=' + encodeURIComponent(state.type));
    if (state.format && state.format !== 'all') queryParts.push('format=' + encodeURIComponent(state.format));
    if (state.status && state.status !== 'all') queryParts.push('status=' + encodeURIComponent(state.status));

    var url = baseEndpoint + '?' + queryParts.join('&');

    window.VitalGuardApi.request(url).then(function (response) {
      hideLoading();

      if (response.ok && response.data) {
        state.items = response.data.items || [];
        state.total = response.data.total || 0;
        state.page = response.data.page || state.page;
        state.pageSize = response.data.pageSize || state.pageSize;

        renderReportsTable();
        renderPagination();
        updateCountDisplay();
      } else {
        showError(response.error || 'Failed to retrieve clinical reports.');
      }
    }).catch(function () {
      hideLoading();
      showError('Network error while requesting clinical reports.');
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
   * Render reports table using safe DOM APIs
   */
  function renderReportsTable() {
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
      var rep = state.items[i];
      var tr = document.createElement('tr');

      // 1. Report ID
      var tdId = document.createElement('td');
      var codeId = document.createElement('code');
      codeId.textContent = rep.id;
      codeId.style.fontWeight = '600';
      codeId.style.color = 'var(--color-navy)';
      tdId.appendChild(codeId);
      tr.appendChild(tdId);

      // 2. Title & Scope
      var tdTitle = document.createElement('td');
      var titleCell = document.createElement('div');
      titleCell.className = 'report-title-cell';

      var titleSpan = document.createElement('span');
      titleSpan.className = 'report-title-text';
      titleSpan.textContent = rep.title;
      titleCell.appendChild(titleSpan);

      var descSpan = document.createElement('span');
      descSpan.className = 'report-desc-text';
      descSpan.textContent = rep.description || (rep.period ? ('Period: ' + rep.period) : '');
      titleCell.appendChild(descSpan);

      tdTitle.appendChild(titleCell);
      tr.appendChild(tdTitle);

      // 3. Category (Type Badge)
      var tdType = document.createElement('td');
      var typeBadge = document.createElement('span');
      typeBadge.className = 'badge';
      var tLower = (rep.type || '').toLowerCase();
      if (tLower.indexOf('cohort') !== -1) {
        typeBadge.className += ' badge-type-cohort';
      } else if (tLower.indexOf('telemetry') !== -1) {
        typeBadge.className += ' badge-type-telemetry';
      } else if (tLower.indexOf('model') !== -1) {
        typeBadge.className += ' badge-type-model';
      } else if (tLower.indexOf('alert') !== -1) {
        typeBadge.className += ' badge-type-alert';
      } else {
        typeBadge.className += ' badge-type-compliance';
      }
      typeBadge.textContent = rep.type || 'General Report';
      tdType.appendChild(typeBadge);
      tr.appendChild(tdType);

      // 4. Format Badge
      var tdFormat = document.createElement('td');
      var formatBadge = document.createElement('span');
      formatBadge.className = 'badge';
      if ((rep.format || '').toUpperCase() === 'CSV') {
        formatBadge.className += ' badge-format-csv';
        formatBadge.textContent = 'CSV';
      } else {
        formatBadge.className += ' badge-format-pdf';
        formatBadge.textContent = 'PDF';
      }
      tdFormat.appendChild(formatBadge);
      tr.appendChild(tdFormat);

      // 5. Generated Date
      var tdDate = document.createElement('td');
      tdDate.style.fontSize = 'var(--font-size-xs)';
      tdDate.style.color = 'var(--color-slate-600)';
      tdDate.textContent = formatTimestamp(rep.generatedDate);
      tr.appendChild(tdDate);

      // 6. Status Badge
      var tdStatus = document.createElement('td');
      var statusBadge = document.createElement('span');
      statusBadge.className = 'badge';
      if ((rep.status || '').toLowerCase() === 'completed') {
        statusBadge.className += ' badge-status-active';
        statusBadge.textContent = 'Completed';
      } else {
        statusBadge.className += ' badge-status-inactive';
        statusBadge.textContent = rep.status || 'Archived';
      }
      tdStatus.appendChild(statusBadge);
      tr.appendChild(tdStatus);

      // 7. Actions Cell
      var tdActions = document.createElement('td');
      tdActions.style.textAlign = 'right';
      var actionsDiv = document.createElement('div');
      actionsDiv.className = 'report-actions-cell';
      actionsDiv.style.justifyContent = 'flex-end';

      // View Button
      var btnView = document.createElement('button');
      btnView.type = 'button';
      btnView.className = 'btn btn-outline btn-sm';
      btnView.textContent = 'View';
      btnView.setAttribute('aria-label', 'View details for ' + rep.title);
      (function (reportItem) {
        btnView.addEventListener('click', function () {
          openReportDetailsModal(reportItem);
        });
      })(rep);
      actionsDiv.appendChild(btnView);

      // Export/Download Button
      var btnExport = document.createElement('button');
      btnExport.type = 'button';
      btnExport.className = 'btn btn-secondary btn-sm';
      btnExport.textContent = 'Export';
      btnExport.setAttribute('aria-label', 'Download ' + rep.format + ' for ' + rep.title);
      (function (reportItem) {
        btnExport.addEventListener('click', function () {
          downloadReport(reportItem);
        });
      })(rep);
      actionsDiv.appendChild(btnExport);

      tdActions.appendChild(actionsDiv);
      tr.appendChild(tdActions);

      dom.tableBody.appendChild(tr);
    }
  }

  /**
   * Format timestamp
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
        minute: '2-digit'
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

    dom.paginationInfo.textContent = 'Showing ' + start + ' to ' + end + ' of ' + state.total + ' reports';

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
        fetchReports();
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
            fetchReports();
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
        fetchReports();
      }
    });
    dom.paginationControls.appendChild(btnNext);
  }

  /**
   * Update reports count indicator badge
   */
  function updateCountDisplay() {
    if (!dom.reportCountDisplay) return;
    dom.reportCountDisplay.textContent = state.total + ' ' + (state.total === 1 ? 'report' : 'reports') + ' found';
  }

  /**
   * Standard RFC 4180 CSV cell serializer & escaping helper
   * Handles commas, quotes, newlines, null, undefined, empty values
   * Internal quotes replaced with two double quotes ("")
   *
   * @param {*} val
   * @returns {string}
   */
  function escapeCsvCell(val) {
    if (val === null || val === undefined) {
      return '';
    }
    var str = String(val);
    if (/[",\n\r]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  /**
   * Serialize an array of values into a valid RFC 4180 CSV row
   *
   * @param {Array} cells
   * @returns {string}
   */
  function serializeCsvRow(cells) {
    var escaped = [];
    for (var i = 0; i < cells.length; i++) {
      escaped.push(escapeCsvCell(cells[i]));
    }
    return escaped.join(',');
  }

  /**
   * Build complete CSV dataset string with mandatory academic disclaimer
   *
   * @param {object} report
   * @returns {string}
   */
  function generateCsvContent(report) {
    var csvLines = [
      '# VITALGUARD AI SYNTHETIC REPORT EXPORT',
      '# DISCLAIMER: Academic research prototype — report outputs are not clinically validated.',
      '# NOTICE: All patient identities, physiological telemetry feeds, and predictive risk indices are 100% synthetic demonstration data.',
      '# Report ID: ' + (report.id || 'N/A'),
      '# Report Title: ' + (report.title || 'N/A'),
      '# Generated Date: ' + (report.generatedDate || new Date().toISOString()),
      '# Reporting Period: ' + (report.period || 'Continuous Cohort Monitoring'),
      '# Source: simulated',
      '',
      serializeCsvRow([
        'Patient_ID',
        'Patient_Name',
        'Department',
        'Age',
        'Heart_Rate_bpm',
        'Systolic_BP_mmHg',
        'Diastolic_BP_mmHg',
        'SpO2_pct',
        'Resp_Rate_bpm',
        'Core_Temp_C',
        'Deterioration_Risk_Score',
        'Alert_Status',
        'Source'
      ])
    ];

    // Retrieve mock patients or create synthetic sample telemetry rows
    var patients = (window.VitalGuardMockData && window.VitalGuardMockData.getPatients) ? window.VitalGuardMockData.getPatients() : [];
    if (patients.length === 0) {
      patients = [
        { id: 'PT-1001', name: 'Synthetic Subject Alpha-01', department: 'Cardiology Care Unit (Simulated)', age: 52 },
        { id: 'PT-1002', name: 'Synthetic Subject Beta-02', department: 'Medical Intensive Care (Simulated)', age: 64 },
        { id: 'PT-1003', name: 'Synthetic Subject Gamma-03', department: 'Neurological Ward (Simulated)', age: 48 },
        { id: 'PT-1007', name: 'Synthetic Subject Eta-07', department: 'Medical Intensive Care (Simulated)', age: 71 }
      ];
    }

    for (var p = 0; p < patients.length; p++) {
      var pt = patients[p];
      var hr = 72 + (p % 15);
      var sbp = 120 + ((p * 3) % 25);
      var dbp = 78 + (p % 10);
      var spo2 = 98 - (p % 4);
      var rr = 16 + (p % 6);
      var temp = (36.8 + ((p % 7) * 0.2)).toFixed(1);
      var score = (0.12 + ((p * 0.08) % 0.8)).toFixed(2);
      var alertSt = pt.alertStatus || (p === 6 ? 'Active Alert' : 'No Alerts');

      csvLines.push(serializeCsvRow([
        pt.id,
        pt.name,
        pt.department,
        pt.age,
        hr,
        sbp,
        dbp,
        spo2,
        rr,
        temp,
        score,
        alertSt,
        'simulated'
      ]));
    }

    return csvLines.join('\r\n');
  }

  /**
   * Escape and encode text for PDF standard Type 1 string literals
   * Handles special PDF syntax characters and WinAnsiEncoding for em-dash (\227)
   *
   * @param {string} str
   * @returns {string}
   */
  function encodePdfText(str) {
    if (!str) return '';
    var out = '';
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      var code = str.charCodeAt(i);
      if (ch === '\\') out += '\\\\';
      else if (ch === '(') out += '\\(';
      else if (ch === ')') out += '\\)';
      else if (ch === '—' || code === 8212) out += '\\227';
      else if (ch === '–' || code === 8211) out += '\\226';
      else if (ch === '’' || code === 8217) out += '\\047';
      else if (ch === '“' || code === 8220) out += '\\042';
      else if (ch === '”' || code === 8221) out += '\\042';
      else if (code >= 32 && code <= 126) out += ch;
      else if (code <= 255) out += '\\' + code.toString(8).padStart(3, '0');
      else out += '?';
    }
    return out;
  }

  /**
   * Generates a genuine, valid PDF 1.4 binary document without external libraries.
   * Conforms strictly to ISO 32000-1 / Adobe PDF 1.4 specification.
   *
   * @param {object} report
   * @returns {Blob} Valid PDF Blob with MIME type application/pdf
   */
  function generateGenuinePdfBlob(report) {
    var title = report.title || 'Clinical Report Executive Summary';
    var id = report.id || 'REP-XXXX';
    var date = report.generatedDate || new Date().toISOString();
    var period = report.period || 'Continuous Cohort Monitoring';
    var author = report.generatedBy || 'Dr. Evelyn Carter (Simulated Administrator)';
    var desc = report.description || 'Simulated clinical report aggregation evaluating early deterioration trajectories.';
    var category = report.type || 'Cohort Summary';

    var stream = '';
    stream += 'BT\n';
    stream += '/F2 15 Tf\n50 740 Td\n';
    stream += '(' + encodePdfText('VITALGUARD AI — CLINICAL REPORT EXECUTIVE SUMMARY') + ') Tj\n';
    stream += '0 -20 Td\n/F2 9 Tf\n';
    stream += '(' + encodePdfText('Academic research prototype — report outputs are not clinically validated.') + ') Tj\n';
    stream += '0 -14 Td\n/F1 8 Tf\n';
    stream += '(' + encodePdfText('Notice: 100% synthetic patient cohort and telemetry data for academic demonstration only.') + ') Tj\n';
    stream += '0 -16 Td\n/F1 9 Tf\n';
    stream += '(' + encodePdfText('----------------------------------------------------------------------------------------------------------------------------------') + ') Tj\n';

    // Metadata Block
    stream += '0 -16 Td\n/F2 10 Tf\n';
    stream += '(' + encodePdfText('Report Identifier: ') + ') Tj\n/F1 10 Tf\n(' + encodePdfText(id) + ') Tj\n';
    stream += '0 -14 Td\n/F2 10 Tf\n';
    stream += '(' + encodePdfText('Report Title: ') + ') Tj\n/F1 10 Tf\n(' + encodePdfText(title) + ') Tj\n';
    stream += '0 -14 Td\n/F2 10 Tf\n';
    stream += '(' + encodePdfText('Category: ') + ') Tj\n/F1 10 Tf\n(' + encodePdfText(category) + ') Tj\n';
    stream += '0 -14 Td\n/F2 10 Tf\n';
    stream += '(' + encodePdfText('Reporting Period: ') + ') Tj\n/F1 10 Tf\n(' + encodePdfText(period) + ') Tj\n';
    stream += '0 -14 Td\n/F2 10 Tf\n';
    stream += '(' + encodePdfText('Generated By: ') + ') Tj\n/F1 10 Tf\n(' + encodePdfText(author) + ') Tj\n';
    stream += '0 -14 Td\n/F2 10 Tf\n';
    stream += '(' + encodePdfText('Generated Date: ') + ') Tj\n/F1 10 Tf\n(' + encodePdfText(date) + ') Tj\n';
    stream += '0 -14 Td\n/F2 10 Tf\n';
    stream += '(' + encodePdfText('Data Source: ') + ') Tj\n/F1 10 Tf\n(' + encodePdfText('simulated (Synthetic Telemetry Stream)') + ') Tj\n';

    stream += '0 -16 Td\n/F1 9 Tf\n';
    stream += '(' + encodePdfText('----------------------------------------------------------------------------------------------------------------------------------') + ') Tj\n';

    // Abstract & Cohort Findings
    stream += '0 -16 Td\n/F2 11 Tf\n';
    stream += '(' + encodePdfText('ABSTRACT & COHORT FINDINGS') + ') Tj\n';
    stream += '0 -14 Td\n/F1 9 Tf\n';

    var words = desc.split(' ');
    var curLine = '';
    for (var w = 0; w < words.length; w++) {
      if ((curLine + words[w]).length > 85) {
        stream += '(' + encodePdfText(curLine.trim()) + ') Tj\n0 -12 Td\n';
        curLine = words[w] + ' ';
      } else {
        curLine += words[w] + ' ';
      }
    }
    if (curLine.trim()) {
      stream += '(' + encodePdfText(curLine.trim()) + ') Tj\n0 -14 Td\n';
    }

    // Telemetry Summary
    stream += '0 -10 Td\n/F2 10 Tf\n';
    stream += '(' + encodePdfText('SYNTHETIC TELEMETRY & DETERIORATION METRICS:') + ') Tj\n';
    stream += '0 -14 Td\n/F1 9 Tf\n';
    stream += '(' + encodePdfText('  * Total Monitored Subjects: 25 Synthetic Patients (PT-1001 through PT-1025)') + ') Tj\n0 -12 Td\n';
    stream += '(' + encodePdfText('  * Continuous Telemetry Ingest: Heart Rate, SBP, DBP, SpO2, Resp Rate, Body Temp') + ') Tj\n0 -12 Td\n';
    stream += '(' + encodePdfText('  * High-Priority Alert Triggers: PT-1007 (Deterioration Score 0.91), PT-1012 (Score 0.94)') + ') Tj\n0 -12 Td\n';
    stream += '(' + encodePdfText('  * Simulated Telemetry Packet Integrity: 99.4% valid synthetic sensor frames') + ') Tj\n0 -16 Td\n';

    stream += '(' + encodePdfText('----------------------------------------------------------------------------------------------------------------------------------') + ') Tj\n';
    stream += '0 -14 Td\n/F2 8 Tf\n';
    stream += '(' + encodePdfText('ACADEMIC GOVERNANCE NOTICE: Generated by VitalGuard AI Research Platform. Not for clinical diagnostic use.') + ') Tj\n';
    stream += 'ET\n';

    // Calculate byte length of binary stream
    var streamByteLen = 0;
    for (var sIdx = 0; sIdx < stream.length; sIdx++) {
      streamByteLen += (stream.charCodeAt(sIdx) <= 255) ? 1 : 2;
    }

    var objects = [];
    objects[1] = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    objects[2] = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    objects[3] = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n';
    objects[4] = '4 0 obj\n<< /Length ' + streamByteLen + ' >>\nstream\n' + stream + 'endstream\nendobj\n';
    objects[5] = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n';
    objects[6] = '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n';

    var pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    var offsets = [0];

    for (var oi = 1; oi <= 6; oi++) {
      offsets[oi] = pdf.length;
      pdf += objects[oi];
    }

    var xrefOffset = pdf.length;
    pdf += 'xref\n0 7\n';
    pdf += '0000000000 65535 f \r\n';
    for (var xi = 1; xi <= 6; xi++) {
      var offStr = String(offsets[xi]);
      while (offStr.length < 10) offStr = '0' + offStr;
      pdf += offStr + ' 00000 n \r\n';
    }
    pdf += 'trailer\n<< /Size 7 /Root 1 0 R >>\n';
    pdf += 'startxref\n' + xrefOffset + '\n%%EOF\n';

    // Convert string to Uint8Array for binary Blob
    var bytes = new Uint8Array(pdf.length);
    for (var bi = 0; bi < pdf.length; bi++) {
      bytes[bi] = pdf.charCodeAt(bi) & 0xff;
    }

    return new Blob([bytes], { type: 'application/pdf' });
  }

  /**
   * Generates formatted executive summary text Blob
   *
   * @param {object} report
   * @returns {Blob}
   */
  function generateTextSummaryBlob(report) {
    var docLines = [
      '================================================================================',
      'VITALGUARD AI — CLINICAL REPORT EXECUTIVE SUMMARY',
      '================================================================================',
      'MANDATORY DISCLAIMER:',
      'Academic research prototype — report outputs are not clinically validated.',
      'All data, patient indices, and deterioration trajectories are synthetic simulations.',
      '--------------------------------------------------------------------------------',
      'Report Identifier : ' + report.id,
      'Report Title      : ' + report.title,
      'Category          : ' + report.type,
      'Reporting Period  : ' + (report.period || 'Continuous Cohort Monitoring'),
      'Generated By      : ' + (report.generatedBy || 'Dr. Evelyn Carter (Simulated Admin)'),
      'Generated Date    : ' + report.generatedDate,
      'Document Format   : ' + report.format,
      'Target Scope      : ' + (report.recordCount || '25 Monitored Subject Telemetry Feeds'),
      'Data Source       : simulated',
      '--------------------------------------------------------------------------------',
      'ABSTRACT & FINDINGS:',
      report.description || 'Simulated cohort aggregation evaluating continuous early warning trajectory detection.',
      '',
      'SUMMARY OF SIMULATED TELEMETRY METRICS:',
      '- Total Monitored Subjects : 25 Synthetic Patients',
      '- Continuous Telemetry Feeds: Heart Rate, SBP, DBP, SpO2, Respiratory Rate, Temperature',
      '- Critical Risk Inferences: PT-1007 (Deterioration Score 0.91), PT-1012 (Deterioration Score 0.94)',
      '- Mean Telemetry Reliability: 99.4% (Simulated sensor packet validation)',
      '================================================================================'
    ];

    return new Blob([docLines.join('\r\n')], { type: 'text/plain;charset=utf-8;' });
  }

  /**
   * Trigger download/export of synthetic report dataset
   */
  function downloadReport(report) {
    if (!report) return;

    var sanitizedTitle = (report.title || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
    var format = (report.format || '').toUpperCase();

    if (format === 'CSV') {
      var csvContent = generateCsvContent(report);
      var csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      triggerBlobDownload(csvBlob, 'VitalGuard_' + report.id + '_' + sanitizedTitle + '.csv');

      if (window.VitalGuardUtils && window.VitalGuardUtils.showToast) {
        window.VitalGuardUtils.showToast('Report ' + report.id + ' downloaded successfully (Simulated CSV dataset).', 'success');
      }
    } else if (format === 'PDF') {
      var pdfBlob = generateGenuinePdfBlob(report);
      triggerBlobDownload(pdfBlob, 'VitalGuard_' + report.id + '_' + sanitizedTitle + '.pdf');

      if (window.VitalGuardUtils && window.VitalGuardUtils.showToast) {
        window.VitalGuardUtils.showToast('Report ' + report.id + ' downloaded successfully (Genuine PDF document).', 'success');
      }
    } else {
      var textBlob = generateTextSummaryBlob(report);
      triggerBlobDownload(textBlob, 'VitalGuard_' + report.id + '_' + sanitizedTitle + '_Executive_Summary.txt');

      if (window.VitalGuardUtils && window.VitalGuardUtils.showToast) {
        window.VitalGuardUtils.showToast('Report ' + report.id + ' executive summary downloaded.', 'success');
      }
    }
  }

  /**
   * Helper to trigger browser download of a generated Blob
   */
  function triggerBlobDownload(blob, filename) {
    var downloadUrl = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(downloadUrl);
    }, 2000);
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
  // Generate Report Modal Handlers
  // ==========================================================================

  function openGenerateModal() {
    if (!dom.modalGenerate) return;
    resetFormErrors(dom.formGenerate);
    if (dom.formGenerate) dom.formGenerate.reset();
    dom.modalGenerate.style.display = 'flex';
    dom.modalGenerate.setAttribute('aria-hidden', 'false');

    var titleInput = document.getElementById('report-title-input');
    if (titleInput) titleInput.focus();
  }

  function closeGenerateModal() {
    if (!dom.modalGenerate) return;
    dom.modalGenerate.style.display = 'none';
    dom.modalGenerate.setAttribute('aria-hidden', 'true');
    if (dom.btnGenerateReport) dom.btnGenerateReport.focus();
  }

  function handleGenerateSubmit(e) {
    e.preventDefault();
    resetFormErrors(dom.formGenerate);

    var titleInput = document.getElementById('report-title-input');
    var typeInput = document.getElementById('report-type-select');
    var periodInput = document.getElementById('report-period-input');
    var formatInput = document.getElementById('report-format-select');
    var descInput = document.getElementById('report-desc-input');

    var titleVal = (titleInput ? titleInput.value : '').trim();
    var typeVal = (typeInput ? typeInput.value : '').trim();
    var periodVal = (periodInput ? periodInput.value : '').trim();
    var formatVal = (formatInput ? formatInput.value : 'CSV').trim();
    var descVal = (descInput ? descInput.value : '').trim();

    var hasError = false;

    if (!titleVal || titleVal.length < 3) {
      setFieldError('error-report-title', 'Report Title is required (minimum 3 characters).');
      hasError = true;
    }

    if (!typeVal) {
      setFieldError('error-report-type', 'Please select a report category.');
      hasError = true;
    }

    if (hasError) return;

    var currentUser = window.VitalGuardAuth.getCurrentUser();
    var authorName = currentUser ? currentUser.name : 'System Administrator (Simulated)';

    var endpoint = (window.VitalGuardConfig && window.VitalGuardConfig.ENDPOINTS && window.VitalGuardConfig.ENDPOINTS.ADMIN_REPORTS) || '/admin/reports';

    window.VitalGuardApi.request(endpoint, {
      method: 'POST',
      body: {
        title: titleVal,
        type: typeVal,
        period: periodVal || 'Custom Cohort Snapshot',
        format: formatVal,
        description: descVal,
        generatedBy: authorName
      }
    }).then(function (res) {
      if (res.ok) {
        if (window.VitalGuardUtils && window.VitalGuardUtils.showToast) {
          window.VitalGuardUtils.showToast('Demo Mode — report generation is simulated and saved to this browser session.', 'success');
        }
        closeGenerateModal();
        fetchReports();
      } else {
        showError(res.error || 'Failed to generate simulated report.');
      }
    }).catch(function () {
      showError('Network error while requesting report generation.');
    });
  }

  // ==========================================================================
  // Report Details Modal Handlers
  // ==========================================================================

  function openReportDetailsModal(report) {
    if (!dom.modalDetails || !report) return;
    state.activeReportForModal = report;

    if (dom.detailsGrid) {
      dom.detailsGrid.textContent = ''; // clear

      var fields = [
        { label: 'Report ID', val: report.id },
        { label: 'Report Category', val: report.type },
        { label: 'File Format', val: report.format },
        { label: 'Generation Status', val: report.status || 'Completed' },
        { label: 'Reporting Period', val: report.period || 'Continuous Cohort Monitoring' },
        { label: 'Monitored Records', val: report.recordCount || '25 Monitored Records' },
        { label: 'Estimated File Size', val: report.size || '32 KB' },
        { label: 'Author / System Actor', val: report.generatedBy || 'Dr. Evelyn Carter (Simulated Admin)' },
        { label: 'Generated Timestamp', val: formatTimestamp(report.generatedDate) },
        { label: 'Data Source', val: 'simulated (Academic Synthetic Feed)' }
      ];

      for (var f = 0; f < fields.length; f++) {
        var itemDiv = document.createElement('div');

        var labelDiv = document.createElement('div');
        labelDiv.className = 'report-detail-label';
        labelDiv.textContent = fields[f].label;
        itemDiv.appendChild(labelDiv);

        var valDiv = document.createElement('div');
        valDiv.className = 'report-detail-val';
        valDiv.textContent = fields[f].val;
        itemDiv.appendChild(valDiv);

        dom.detailsGrid.appendChild(itemDiv);
      }
    }

    if (dom.detailsDescription) {
      dom.detailsDescription.textContent = report.description || 'No detailed scope description provided.';
    }

    if (dom.btnModalDownloadLabel) {
      dom.btnModalDownloadLabel.textContent = 'Download ' + report.format + ' Export';
    }

    dom.modalDetails.style.display = 'flex';
    dom.modalDetails.setAttribute('aria-hidden', 'false');
    if (dom.btnDismissDetails) dom.btnDismissDetails.focus();
  }

  function closeDetailsModal() {
    if (!dom.modalDetails) return;
    dom.modalDetails.style.display = 'none';
    dom.modalDetails.setAttribute('aria-hidden', 'true');
    state.activeReportForModal = null;
  }

  // ==========================================================================
  // Form Helpers
  // ==========================================================================

  function resetFormErrors(form) {
    if (!form) return;
    var errEls = form.querySelectorAll('.form-error');
    for (var i = 0; i < errEls.length; i++) {
      errEls[i].style.display = 'none';
      errEls[i].textContent = '';
    }
  }

  function setFieldError(elementId, message) {
    var errEl = document.getElementById(elementId);
    if (errEl) {
      errEl.textContent = message;
      errEl.style.display = 'block';
    }
  }

  // Expose report generation helpers globally for automated verification
  window.VitalGuardReports = {
    escapeCsvCell: escapeCsvCell,
    serializeCsvRow: serializeCsvRow,
    generateCsvContent: generateCsvContent,
    encodePdfText: encodePdfText,
    generateGenuinePdfBlob: generateGenuinePdfBlob,
    generateTextSummaryBlob: generateTextSummaryBlob,
    downloadReport: downloadReport
  };

  // Self initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
