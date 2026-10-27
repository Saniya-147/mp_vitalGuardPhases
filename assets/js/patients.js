/**
 * VitalGuard AI - Patient Management Controller
 * assets/js/patients.js
 *
 * Implements Phase 3 Patient Management:
 * - Route protection & role verification
 * - Dynamic retrieval of patient records with server-style filtering/sorting/pagination via api.js
 * - Search by ID and name with debouncing
 * - Record-status and alert-state filtering with reset controls
 * - Sorting across all table columns with aria-sort states
 * - Pagination controls with page-size selection (10, 25, 50) and summary
 * - Full URL query state persistence and browser Back/Forward (popstate) handling
 * - Add Patient modal with validation and simulation notice
 * - Edit Patient modal for profile fields
 * - Deactivate Patient with accessible confirmation dialog
 * - Role-based action visibility (Read-only Reviewer controls hidden)
 *
 * Frontend permission checks control interface visibility only.
 * The real backend must enforce authorization for every protected operation.
 */

(function (window, document) {
  'use strict';

  var Utils = window.VitalGuardUtils;
  var Auth = window.VitalGuardAuth;
  var Api = window.VitalGuardApi;
  var UI = window.VitalGuardUI;
  var Config = window.VitalGuardConfig || {};

  // Current query state
  var state = {
    q: '',
    status: 'all',
    alertState: 'all',
    sortBy: 'id',
    sortDir: 'asc',
    page: 1,
    pageSize: 10,
    total: 0
  };

  var currentUser = null;
  var isLoading = false;

  /**
   * Initializes the Patients page on DOM ready.
   */
  function initPatientsPage() {
    // 1. Enforce Authentication Route Guard
    if (!Auth || !Auth.requireAuth('../login.html')) {
      return;
    }

    currentUser = Auth.getCurrentUser();
    if (!currentUser) {
      window.location.href = '../login.html';
      return;
    }

    // 2. Render User Details & Setup Responsive Nav
    renderUserProfile(currentUser);
    setupNavigationHandlers();

    // 3. Read initial state from URL query parameters
    readStateFromUrl();

    // 4. Initialize DOM controls & event listeners
    bindToolbarControls();

    // 5. Setup Popstate listener for browser Back/Forward
    window.addEventListener('popstate', function () {
      readStateFromUrl();
      syncFormControlsWithState();
      fetchPatients(false); // Do not push another history entry
    });

    // 6. Fetch initial patient roster
    fetchPatients(false);
  }

  /**
   * Renders user identity in topbar and sidebar.
   */
  function renderUserProfile(user) {
    var initials = 'U';
    if (user.name) {
      var parts = user.name.split(' ');
      initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : user.name.substring(0, 2).toUpperCase();
    }

    Utils.setText('#sidebar-user-initials', initials);
    Utils.setText('#sidebar-user-name', user.name || 'Healthcare Professional');
    Utils.setText('#sidebar-user-role', user.role || 'Staff');
    Utils.setText('#topbar-user-badge', user.role || 'User');

    // Role-based visibility for Add Patient action
    var addBtnContainer = Utils.qs('#container-add-patient-action');
    if (addBtnContainer) {
      var canManagePatients = Auth.hasPermission('manage:patients');
      addBtnContainer.style.display = canManagePatients ? 'block' : 'none';
    }
  }

  /**
   * Sets up responsive sidebar drawer and sign-out buttons.
   */
  function setupNavigationHandlers() {
    var menuToggleBtn = Utils.qs('#btn-menu-toggle');
    var sidebar = Utils.qs('#app-sidebar');
    var backdrop = Utils.qs('#sidebar-backdrop');
    var logoutBtn = Utils.qs('#btn-topbar-logout');

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
        Utils.showToast('You have signed out.', 'info');
        setTimeout(function () {
          window.location.href = '../login.html?reason=logged_out';
        }, 200);
      });
    }
  }

  /**
   * Reads URL query parameters into the state object safely.
   */
  function readStateFromUrl() {
    var params = new URLSearchParams(window.location.search);

    state.q = (params.get('q') || '').trim();
    state.status = params.get('status') || 'all';
    state.alertState = params.get('alertState') || 'all';

    var validSortCols = ['id', 'name', 'age', 'registrationDate', 'latestObservationTime', 'latestPredictionStatus', 'alertStatus', 'status'];
    var sortByParam = params.get('sortBy');
    state.sortBy = validSortCols.indexOf(sortByParam) !== -1 ? sortByParam : 'id';

    var sortDirParam = (params.get('sortDir') || '').toLowerCase();
    state.sortDir = sortDirParam === 'desc' ? 'desc' : 'asc';

    var pageParam = parseInt(params.get('page'), 10);
    state.page = !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;

    var pageSizeParam = parseInt(params.get('pageSize'), 10);
    state.pageSize = [10, 25, 50].indexOf(pageSizeParam) !== -1 ? pageSizeParam : 10;
  }

  /**
   * Synchronizes input/select elements to match current state.
   */
  function syncFormControlsWithState() {
    var searchInput = Utils.qs('#input-patient-search');
    var statusSelect = Utils.qs('#select-status-filter');
    var alertSelect = Utils.qs('#select-alert-filter');

    if (searchInput) searchInput.value = state.q;
    if (statusSelect) statusSelect.value = state.status;
    if (alertSelect) alertSelect.value = state.alertState;
  }

  /**
   * Synchronizes state to the browser URL using the History API.
   *
   * @param {boolean} [replace=false] - Whether to use replaceState instead of pushState
   */
  function updateUrlState(replace) {
    var params = new URLSearchParams();

    if (state.q) params.set('q', state.q);
    if (state.status !== 'all') params.set('status', state.status);
    if (state.alertState !== 'all') params.set('alertState', state.alertState);
    if (state.sortBy !== 'id') params.set('sortBy', state.sortBy);
    if (state.sortDir !== 'asc') params.set('sortDir', state.sortDir);
    if (state.page > 1) params.set('page', String(state.page));
    if (state.pageSize !== 10) params.set('pageSize', String(state.pageSize));

    var newUrl = window.location.pathname + (params.toString() ? ('?' + params.toString()) : '');

    if (replace) {
      window.history.replaceState(null, '', newUrl);
    } else {
      window.history.pushState(null, '', newUrl);
    }
  }

  /**
   * Binds toolbar elements (Search, Filters, Reset, Add Patient, Refresh).
   */
  function bindToolbarControls() {
    syncFormControlsWithState();

    var searchInput = Utils.qs('#input-patient-search');
    var statusSelect = Utils.qs('#select-status-filter');
    var alertSelect = Utils.qs('#select-alert-filter');
    var resetBtn = Utils.qs('#btn-reset-filters');
    var refreshBtn = Utils.qs('#btn-refresh-patients');
    var addBtn = Utils.qs('#btn-add-patient');

    // Debounced search (300ms)
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(function () {
        var query = searchInput.value.trim();
        if (query !== state.q) {
          state.q = query;
          state.page = 1; // Reset to page 1 on new search
          updateUrlState(true);
          fetchPatients(false);
        }
      }, 300));
    }

    // Status filter
    if (statusSelect) {
      statusSelect.addEventListener('change', function () {
        state.status = statusSelect.value;
        state.page = 1;
        updateUrlState(false);
        fetchPatients(false);
      });
    }

    // Alert filter
    if (alertSelect) {
      alertSelect.addEventListener('change', function () {
        state.alertState = alertSelect.value;
        state.page = 1;
        updateUrlState(false);
        fetchPatients(false);
      });
    }

    // Reset filters button
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        state.q = '';
        state.status = 'all';
        state.alertState = 'all';
        state.page = 1;
        syncFormControlsWithState();
        updateUrlState(false);
        fetchPatients(false);
      });
    }

    // Refresh button
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        fetchPatients(false);
        Utils.showToast('Patient roster refreshed.', 'info');
      });
    }

    // Add Patient button
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        openAddPatientModal();
      });
    }
  }

  /**
   * Fetches patient roster from the API abstraction using current query state.
   */
  function fetchPatients(updateHistory) {
    if (isLoading) return;
    isLoading = true;

    if (updateHistory) {
      updateUrlState(false);
    }

    showLoadingState();

    var params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.status) params.set('status', state.status);
    if (state.alertState) params.set('alertState', state.alertState);
    params.set('sortBy', state.sortBy);
    params.set('sortDir', state.sortDir);
    params.set('page', String(state.page));
    params.set('pageSize', String(state.pageSize));

    var endpoint = '/admin/patients?' + params.toString();

    Api.request(endpoint)
      .then(function (res) {
        isLoading = false;
        if (res.ok && res.data) {
          var items = res.data.items || [];
          state.total = res.data.total !== undefined ? res.data.total : items.length;
          state.page = res.data.page || state.page;
          state.pageSize = res.data.pageSize || state.pageSize;

          renderTableHeaders();
          renderPatientsTable(items);
          renderPagination();
        } else {
          showErrorState(res.error || 'Failed to load patient records from API.');
        }
      })
      .catch(function (err) {
        isLoading = false;
        showErrorState((err && err.message) ? err.message : 'A network error occurred while retrieving patients.');
      });
  }

  /**
   * Renders sortable table headers.
   */
  function renderTableHeaders() {
    var tr = Utils.qs('#patients-table-headers');
    if (!tr) return;

    while (tr.firstChild) tr.removeChild(tr.firstChild);

    var columns = [
      { key: 'id', label: 'Patient ID' },
      { key: 'name', label: 'Display Name' },
      { key: 'age', label: 'Age' },
      { key: 'registrationDate', label: 'Registration Date' },
      { key: 'latestObservationTime', label: 'Latest Observation' },
      { key: 'latestPredictionStatus', label: 'Prediction Status' },
      { key: 'alertStatus', label: 'Alert Status' },
      { key: 'status', label: 'Record Status' }
    ];

    for (var c = 0; c < columns.length; c++) {
      (function (col) {
        var th = UI.createSortableHeader(col.label, col.key, state.sortBy, state.sortDir, function (newKey, newDir) {
          state.sortBy = newKey;
          state.sortDir = newDir;
          state.page = 1;
          updateUrlState(false);
          fetchPatients(false);
        });
        tr.appendChild(th);
      })(columns[c]);
    }

    // Actions Header (Not sortable)
    var actionsTh = Utils.createElement('th', {
      scope: 'col',
      textContent: 'Actions',
      style: 'text-align: right; min-width: 9rem;'
    });
    tr.appendChild(actionsTh);
  }

  /**
   * Populates the table body with patient records or shows empty state.
   */
  function renderPatientsTable(items) {
    var tbody = Utils.qs('#patients-table-body');
    var tableContainer = Utils.qs('#patients-table-container');
    var emptyContainer = Utils.qs('#patients-empty-container');
    var loadingContainer = Utils.qs('#patients-loading-container');
    var errorContainer = Utils.qs('#patients-error-container');
    var scrollHint = Utils.qs('#table-scroll-hint');

    if (loadingContainer) loadingContainer.style.display = 'none';
    if (errorContainer) errorContainer.style.display = 'none';

    if (!tbody || !tableContainer || !emptyContainer) return;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (!items || items.length === 0) {
      tableContainer.style.display = 'none';
      if (scrollHint) scrollHint.style.display = 'none';
      emptyContainer.style.display = 'block';
      while (emptyContainer.firstChild) emptyContainer.removeChild(emptyContainer.firstChild);

      var isFiltered = state.q || state.status !== 'all' || state.alertState !== 'all';
      if (isFiltered) {
        var clearBtn = Utils.createElement('button', {
          type: 'button',
          className: 'btn btn-outline btn-sm',
          textContent: 'Clear All Filters'
        });
        clearBtn.addEventListener('click', function () {
          state.q = '';
          state.status = 'all';
          state.alertState = 'all';
          state.page = 1;
          syncFormControlsWithState();
          updateUrlState(false);
          fetchPatients(false);
        });

        emptyContainer.appendChild(UI.createEmptyState(
          'No Matching Patients Found',
          'No simulated patient records match the selected query and filters. Try adjusting your search term or filter parameters.',
          clearBtn
        ));
      } else {
        emptyContainer.appendChild(UI.createEmptyState(
          'No Patients Registered',
          'There are currently no simulated patient records in this cohort dataset.'
        ));
      }
      return;
    }

    tableContainer.style.display = 'block';
    tableContainer.style.opacity = '1';
    if (scrollHint) scrollHint.style.display = '';
    emptyContainer.style.display = 'none';

    var canManagePatients = Auth.hasPermission('manage:patients');
    var canDeactivatePatients = Auth.hasPermission('deactivate:patients') || (currentUser && currentUser.role === 'System Administrator');

    for (var i = 0; i < items.length; i++) {
      var patient = items[i];
      var tr = document.createElement('tr');

      // 1. Patient ID
      var tdId = document.createElement('td');
      var idBadge = Utils.createElement('span', {
        className: 'patient-id-code',
        textContent: patient.id || 'Not recorded'
      });
      tdId.appendChild(idBadge);
      tr.appendChild(tdId);

      // 2. Display Name
      var tdName = document.createElement('td');
      var nameWrapper = Utils.createElement('div', { style: 'display: flex; flex-direction: column;' });
      var nameLink = Utils.createElement('a', {
        href: 'patient-details.html?id=' + encodeURIComponent(patient.id),
        style: 'font-weight: 600; color: var(--color-primary-navy); text-decoration: none;',
        textContent: patient.name || 'Not recorded'
      });
      nameLink.addEventListener('mouseenter', function () { this.style.textDecoration = 'underline'; });
      nameLink.addEventListener('mouseleave', function () { this.style.textDecoration = 'none'; });

      var deptSpan = Utils.createElement('span', {
        style: 'font-size: var(--font-size-2xs); color: var(--color-text-muted);',
        textContent: (patient.department || 'General') + ' • ' + (patient.room || 'Unassigned')
      });
      nameWrapper.appendChild(nameLink);
      nameWrapper.appendChild(deptSpan);
      tdName.appendChild(nameWrapper);
      tr.appendChild(tdName);

      // 3. Age / Gender
      var tdAge = document.createElement('td');
      var ageText = (patient.age !== undefined && patient.age !== null) ? (patient.age + ' yrs (' + (patient.gender || 'N/A') + ')') : 'Not recorded';
      tdAge.textContent = ageText;
      tr.appendChild(tdAge);

      // 4. Registration Date
      var tdReg = document.createElement('td');
      tdReg.textContent = patient.registrationDate ? Utils.formatDate(patient.registrationDate) : (patient.admissionDate ? Utils.formatDate(patient.admissionDate) : 'Not recorded');
      tr.appendChild(tdReg);

      // 5. Latest Observation Time
      var tdObsTime = document.createElement('td');
      tdObsTime.textContent = patient.latestObservationTime ? Utils.formatDateTime(patient.latestObservationTime) : 'Not recorded';
      tr.appendChild(tdObsTime);

      // 6. Latest Prediction Status
      var tdPred = document.createElement('td');
      var predStatus = patient.latestPredictionStatus || 'Not Assessed';
      var predBadgeClass = 'badge-neutral';
      if (predStatus.indexOf('Low') !== -1) predBadgeClass = 'badge-success';
      else if (predStatus.indexOf('Moderate') !== -1) predBadgeClass = 'badge-warning';
      else if (predStatus.indexOf('High') !== -1 || predStatus.indexOf('Critical') !== -1) predBadgeClass = 'badge-error';

      var predBadge = Utils.createElement('span', {
        className: 'badge ' + predBadgeClass
      }, [
        Utils.createElement('span', { className: 'badge-dot', 'aria-hidden': 'true' }),
        predStatus
      ]);
      tdPred.appendChild(predBadge);
      tr.appendChild(tdPred);

      // 7. Alert Status
      var tdAlert = document.createElement('td');
      var alertStatus = patient.alertStatus || 'No Alerts';
      var alertBadgeClass = 'badge-neutral';
      if (alertStatus === 'Active Alert') alertBadgeClass = 'badge-error';
      else if (alertStatus === 'Acknowledged') alertBadgeClass = 'badge-warning';
      else if (alertStatus === 'Resolved') alertBadgeClass = 'badge-success';

      var alertBadge = Utils.createElement('span', {
        className: 'badge ' + alertBadgeClass
      }, [
        Utils.createElement('span', { className: 'badge-dot', 'aria-hidden': 'true' }),
        alertStatus
      ]);
      tdAlert.appendChild(alertBadge);
      tr.appendChild(tdAlert);

      // 8. Record Status
      var tdStatus = document.createElement('td');
      var recStatus = patient.status || 'Active Monitoring';
      var statusBadgeClass = recStatus === 'Active Monitoring' ? 'badge-info' : (recStatus === 'Discharged' ? 'badge-neutral' : 'badge-error');
      var statusBadge = Utils.createElement('span', {
        className: 'badge ' + statusBadgeClass
      }, [
        Utils.createElement('span', { className: 'badge-dot', 'aria-hidden': 'true' }),
        recStatus
      ]);
      tdStatus.appendChild(statusBadge);
      tr.appendChild(tdStatus);

      // 9. Actions Column
      var tdActions = document.createElement('td');
      tdActions.style.textAlign = 'right';

      var actionsWrapper = Utils.createElement('div', {
        className: 'table-actions-cell',
        style: 'justify-content: flex-end;'
      });

      // View details button (Always visible to all roles)
      var viewBtn = Utils.createElement('a', {
        href: 'patient-details.html?id=' + encodeURIComponent(patient.id),
        className: 'btn btn-outline btn-sm',
        'aria-label': 'View details for patient ' + patient.id,
        textContent: 'View'
      });
      actionsWrapper.appendChild(viewBtn);

      // Edit action (Role-guarded: Hidden for Read-only Reviewer)
      if (canManagePatients) {
        (function (pat) {
          var editBtn = Utils.createElement('button', {
            type: 'button',
            className: 'btn btn-outline btn-sm',
            'aria-label': 'Edit patient ' + pat.id,
            textContent: 'Edit'
          });
          editBtn.addEventListener('click', function () {
            openEditPatientModal(pat);
          });
          actionsWrapper.appendChild(editBtn);
        })(patient);
      }

      // Deactivate action (Role-guarded: Only for System Administrator / Deactivate permission)
      if (canDeactivatePatients && patient.status !== 'Deactivated') {
        (function (pat) {
          var deactBtn = Utils.createElement('button', {
            type: 'button',
            className: 'btn btn-ghost btn-sm',
            style: 'color: var(--color-error);',
            'aria-label': 'Deactivate patient ' + pat.id,
            textContent: 'Deactivate'
          });
          deactBtn.addEventListener('click', function () {
            handleDeactivatePatient(pat);
          });
          actionsWrapper.appendChild(deactBtn);
        })(patient);
      }

      tdActions.appendChild(actionsWrapper);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    }
  }

  /**
   * Renders pagination bar via reusable UI component.
   */
  function renderPagination() {
    var container = Utils.qs('#patients-pagination-container');
    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    if (state.total === 0) return;

    var paginationEl = UI.createPagination({
      page: state.page,
      pageSize: state.pageSize,
      total: state.total,
      itemName: 'patients',
      onPageChange: function (newPage) {
        state.page = newPage;
        updateUrlState(false);
        fetchPatients(false);
      },
      onPageSizeChange: function (newSize) {
        state.pageSize = newSize;
        state.page = 1;
        updateUrlState(false);
        fetchPatients(false);
      }
    });

    container.appendChild(paginationEl);
  }

  /**
   * Shows accessible loading state.
   */
  function showLoadingState() {
    var loadingContainer = Utils.qs('#patients-loading-container');
    var emptyContainer = Utils.qs('#patients-empty-container');
    var errorContainer = Utils.qs('#patients-error-container');
    var tableContainer = Utils.qs('#patients-table-container');

    if (emptyContainer) emptyContainer.style.display = 'none';
    if (errorContainer) errorContainer.style.display = 'none';

    if (loadingContainer) {
      loadingContainer.style.display = 'block';
      while (loadingContainer.firstChild) loadingContainer.removeChild(loadingContainer.firstChild);
      loadingContainer.appendChild(UI.createLoadingState('Loading simulated patient cohort...'));
    }

    if (tableContainer) {
      tableContainer.style.opacity = '0.5';
    }
  }

  /**
   * Shows accessible API error state with retry.
   */
  function showErrorState(errorMessage) {
    var loadingContainer = Utils.qs('#patients-loading-container');
    var emptyContainer = Utils.qs('#patients-empty-container');
    var errorContainer = Utils.qs('#patients-error-container');
    var tableContainer = Utils.qs('#patients-table-container');

    if (loadingContainer) loadingContainer.style.display = 'none';
    if (emptyContainer) emptyContainer.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'none';

    var scrollHint = Utils.qs('#table-scroll-hint');
    if (scrollHint) scrollHint.style.display = 'none';

    if (errorContainer) {
      errorContainer.style.display = 'block';
      while (errorContainer.firstChild) errorContainer.removeChild(errorContainer.firstChild);
      errorContainer.appendChild(UI.createErrorState(errorMessage, function () {
        fetchPatients(false);
      }));
    }
  }

  /**
   * Opens the Add Patient accessible modal.
   */
  function openAddPatientModal() {
    // Frontend permission checks control interface visibility only.
    // The real backend must enforce authorization for every protected operation.
    if (!Auth || !Auth.hasPermission('manage:patients')) {
      Utils.showToast('Access denied: You do not have permission to add patients.', 'error');
      return;
    }

    var form = Utils.createElement('form', {
      id: 'form-add-patient',
      novalidate: true,
      style: 'display: flex; flex-direction: column; gap: var(--space-md);'
    });

    // Dedicated API error banner
    var apiErrorAlert = Utils.createElement('div', {
      className: 'alert alert-error',
      role: 'alert',
      style: 'display: none; font-size: var(--font-size-xs); margin-bottom: var(--space-xs);'
    });
    form.appendChild(apiErrorAlert);

    // Notice banner
    var noticeBanner = Utils.createElement('div', {
      className: 'alert alert-info',
      style: 'font-size: var(--font-size-xs); margin-bottom: var(--space-xs);'
    }, [
      Utils.createElement('div', { className: 'alert-title', textContent: 'Simulated Patient Intake' }),
      Utils.createElement('div', { textContent: 'Collects minimum non-sensitive demographic attributes for synthetic cohort testing.' })
    ]);
    form.appendChild(noticeBanner);

    // Name field
    var nameGroup = Utils.createElement('div', { className: 'form-group' });
    var nameLabel = Utils.createElement('label', {
      htmlFor: 'modal-add-name',
      className: 'form-label',
      textContent: 'Display Name'
    }, [Utils.createElement('span', { className: 'required-indicator', textContent: '*' })]);
    var nameInput = Utils.createElement('input', {
      type: 'text',
      id: 'modal-add-name',
      className: 'form-control',
      placeholder: 'e.g. Synthetic Subject Omega-26',
      maxLength: 60,
      required: true,
      'aria-required': 'true',
      'aria-describedby': 'modal-add-name-error'
    });
    var nameError = Utils.createElement('div', {
      className: 'form-error',
      id: 'modal-add-name-error',
      role: 'alert',
      'aria-live': 'polite'
    });
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    nameGroup.appendChild(nameError);
    form.appendChild(nameGroup);

    // Age field
    var ageGroup = Utils.createElement('div', { className: 'form-group' });
    var ageLabel = Utils.createElement('label', {
      htmlFor: 'modal-add-age',
      className: 'form-label',
      textContent: 'Age (Years)'
    }, [Utils.createElement('span', { className: 'required-indicator', textContent: '*' })]);
    var ageInput = Utils.createElement('input', {
      type: 'number',
      id: 'modal-add-age',
      className: 'form-control',
      placeholder: 'e.g. 54',
      min: 0,
      max: 120,
      required: true,
      'aria-required': 'true',
      'aria-describedby': 'modal-add-age-error'
    });
    var ageError = Utils.createElement('div', {
      className: 'form-error',
      id: 'modal-add-age-error',
      role: 'alert',
      'aria-live': 'polite'
    });
    ageGroup.appendChild(ageLabel);
    ageGroup.appendChild(ageInput);
    ageGroup.appendChild(ageError);
    form.appendChild(ageGroup);

    // Gender field
    var genderGroup = Utils.createElement('div', { className: 'form-group' });
    var genderLabel = Utils.createElement('label', {
      htmlFor: 'modal-add-gender',
      className: 'form-label',
      textContent: 'Gender'
    });
    var genderSelect = Utils.createElement('select', {
      id: 'modal-add-gender',
      className: 'form-control'
    });
    var genders = ['Female', 'Male', 'Non-Binary', 'Other / Unspecified'];
    for (var g = 0; g < genders.length; g++) {
      genderSelect.appendChild(Utils.createElement('option', { value: genders[g], textContent: genders[g] }));
    }
    genderGroup.appendChild(genderLabel);
    genderGroup.appendChild(genderSelect);
    form.appendChild(genderGroup);

    // Department field
    var deptGroup = Utils.createElement('div', { className: 'form-group' });
    var deptLabel = Utils.createElement('label', {
      htmlFor: 'modal-add-dept',
      className: 'form-label',
      textContent: 'Department Ward (Simulated)'
    });
    var deptSelect = Utils.createElement('select', {
      id: 'modal-add-dept',
      className: 'form-control'
    });
    var depts = [
      'Cardiology Care Unit (Simulated)',
      'Medical Intensive Care (Simulated)',
      'Neurological Ward (Simulated)',
      'Post-Surgical Recovery (Simulated)',
      'Respiratory Step-Down (Simulated)'
    ];
    for (var d = 0; d < depts.length; d++) {
      deptSelect.appendChild(Utils.createElement('option', { value: depts[d], textContent: depts[d] }));
    }
    deptGroup.appendChild(deptLabel);
    deptGroup.appendChild(deptSelect);
    form.appendChild(deptGroup);

    // Action buttons in modal footer
    var cancelBtn = Utils.createElement('button', {
      type: 'button',
      className: 'btn btn-outline',
      textContent: 'Cancel'
    });

    var submitBtn = Utils.createElement('button', {
      type: 'submit',
      form: 'form-add-patient',
      className: 'btn btn-primary',
      textContent: 'Add Patient'
    });

    var modal = Utils.openModal({
      title: 'Add Simulated Patient',
      content: form,
      actions: [cancelBtn, submitBtn]
    });

    cancelBtn.addEventListener('click', function () {
      modal.close();
    });

    // Wire submit button click to trigger form submit handler
    submitBtn.addEventListener('click', function () {
      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit();
      } else {
        var submitEvent = new Event('submit', { cancelable: true, bubbles: true });
        form.dispatchEvent(submitEvent);
      }
    });

    var isSubmitting = false;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (isSubmitting) return;

      // Reset errors
      apiErrorAlert.textContent = '';
      apiErrorAlert.style.display = 'none';
      nameError.textContent = '';
      nameInput.classList.remove('is-invalid');
      nameInput.removeAttribute('aria-invalid');
      ageError.textContent = '';
      ageInput.classList.remove('is-invalid');
      ageInput.removeAttribute('aria-invalid');

      var nameVal = nameInput.value.trim();
      var ageRaw = ageInput.value.trim();
      var ageVal = parseInt(ageRaw, 10);
      var hasError = false;

      // Validate Display Name
      if (!nameVal) {
        nameError.textContent = 'Display name is required.';
        nameInput.classList.add('is-invalid');
        nameInput.setAttribute('aria-invalid', 'true');
        nameInput.focus();
        hasError = true;
      } else if (nameVal.length > 60) {
        nameError.textContent = 'Display name must not exceed 60 characters.';
        nameInput.classList.add('is-invalid');
        nameInput.setAttribute('aria-invalid', 'true');
        nameInput.focus();
        hasError = true;
      }

      // Validate Age
      if (!ageRaw || isNaN(ageVal) || String(ageVal) !== ageRaw || ageVal < 0 || ageVal > 120) {
        ageError.textContent = 'Valid age between 0 and 120 is required.';
        ageInput.classList.add('is-invalid');
        ageInput.setAttribute('aria-invalid', 'true');
        if (!hasError) ageInput.focus();
        hasError = true;
      }

      if (hasError) return;

      isSubmitting = true;
      cancelBtn.disabled = true;
      var restoreBtn = Utils.setButtonLoading(submitBtn, 'Saving...');

      var endpoint = (Config.ENDPOINTS && Config.ENDPOINTS.ADMIN_PATIENTS) || '/admin/patients';

      Api.request(endpoint, {
        method: 'POST',
        body: {
          name: nameVal,
          age: ageVal,
          gender: genderSelect.value,
          department: deptSelect.value
        }
      }).then(function (res) {
        isSubmitting = false;
        restoreBtn();
        cancelBtn.disabled = false;

        if (res && res.ok) {
          modal.close();
          // EXACT required notice:
          Utils.showToast('Demo Mode - saved only in this browser session, not in any real database.', 'success', 5000);

          // Reset search and filters to page 1 so the newly created patient is visible immediately
          state.q = '';
          state.status = 'all';
          state.alertState = 'all';
          state.page = 1;
          syncFormControlsWithState();
          updateUrlState(false);
          fetchPatients(false);
        } else {
          apiErrorAlert.textContent = (res && res.error) ? res.error : 'Failed to create simulated patient.';
          apiErrorAlert.style.display = 'block';
        }
      }).catch(function (err) {
        isSubmitting = false;
        restoreBtn();
        cancelBtn.disabled = false;
        apiErrorAlert.textContent = (err && err.message) ? err.message : 'An unexpected error occurred during submission.';
        apiErrorAlert.style.display = 'block';
      });
    });
  }

  /**
   * Opens the Edit Patient accessible modal for permitted profile fields.
   */
  function openEditPatientModal(patient) {
    var form = Utils.createElement('form', {
      id: 'form-edit-patient',
      novalidate: true,
      style: 'display: flex; flex-direction: column; gap: var(--space-md);'
    });

    // Dedicated API error banner
    var apiErrorAlert = Utils.createElement('div', {
      className: 'alert alert-error',
      role: 'alert',
      style: 'display: none; font-size: var(--font-size-xs); margin-bottom: var(--space-xs);'
    });
    form.appendChild(apiErrorAlert);

    // Patient ID indicator
    var idInfo = Utils.createElement('div', {
      style: 'font-size: var(--font-size-xs); color: var(--color-text-muted); margin-bottom: var(--space-xs);'
    }, [
      'Editing record for: ',
      Utils.createElement('strong', { textContent: patient.id })
    ]);
    form.appendChild(idInfo);

    // Name field
    var nameGroup = Utils.createElement('div', { className: 'form-group' });
    var nameLabel = Utils.createElement('label', {
      htmlFor: 'modal-edit-name',
      className: 'form-label',
      textContent: 'Display Name'
    }, [Utils.createElement('span', { className: 'required-indicator', textContent: '*' })]);
    var nameInput = Utils.createElement('input', {
      type: 'text',
      id: 'modal-edit-name',
      className: 'form-control',
      value: patient.name || '',
      maxLength: 60,
      required: true,
      'aria-required': 'true',
      'aria-describedby': 'modal-edit-name-error'
    });
    var nameError = Utils.createElement('div', {
      className: 'form-error',
      id: 'modal-edit-name-error',
      role: 'alert',
      'aria-live': 'polite'
    });
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    nameGroup.appendChild(nameError);
    form.appendChild(nameGroup);

    // Age field
    var ageGroup = Utils.createElement('div', { className: 'form-group' });
    var ageLabel = Utils.createElement('label', {
      htmlFor: 'modal-edit-age',
      className: 'form-label',
      textContent: 'Age (Years)'
    }, [Utils.createElement('span', { className: 'required-indicator', textContent: '*' })]);
    var ageInput = Utils.createElement('input', {
      type: 'number',
      id: 'modal-edit-age',
      className: 'form-control',
      value: String(patient.age !== undefined ? patient.age : ''),
      min: 0,
      max: 120,
      required: true,
      'aria-required': 'true',
      'aria-describedby': 'modal-edit-age-error'
    });
    var ageError = Utils.createElement('div', {
      className: 'form-error',
      id: 'modal-edit-age-error',
      role: 'alert',
      'aria-live': 'polite'
    });
    ageGroup.appendChild(ageLabel);
    ageGroup.appendChild(ageInput);
    ageGroup.appendChild(ageError);
    form.appendChild(ageGroup);

    // Gender field
    var genderGroup = Utils.createElement('div', { className: 'form-group' });
    var genderLabel = Utils.createElement('label', {
      htmlFor: 'modal-edit-gender',
      className: 'form-label',
      textContent: 'Gender'
    });
    var genderSelect = Utils.createElement('select', {
      id: 'modal-edit-gender',
      className: 'form-control'
    });
    var genders = ['Female', 'Male', 'Non-Binary', 'Other / Unspecified'];
    for (var g = 0; g < genders.length; g++) {
      var optG = Utils.createElement('option', { value: genders[g], textContent: genders[g] });
      if (genders[g] === patient.gender) optG.selected = true;
      genderSelect.appendChild(optG);
    }
    genderGroup.appendChild(genderLabel);
    genderGroup.appendChild(genderSelect);
    form.appendChild(genderGroup);

    // Department field
    var deptGroup = Utils.createElement('div', { className: 'form-group' });
    var deptLabel = Utils.createElement('label', {
      htmlFor: 'modal-edit-dept',
      className: 'form-label',
      textContent: 'Department Ward (Simulated)'
    });
    var deptSelect = Utils.createElement('select', {
      id: 'modal-edit-dept',
      className: 'form-control'
    });
    var depts = [
      'Cardiology Care Unit (Simulated)',
      'Medical Intensive Care (Simulated)',
      'Neurological Ward (Simulated)',
      'Post-Surgical Recovery (Simulated)',
      'Respiratory Step-Down (Simulated)'
    ];
    for (var d = 0; d < depts.length; d++) {
      var optD = Utils.createElement('option', { value: depts[d], textContent: depts[d] });
      if (depts[d] === patient.department) optD.selected = true;
      deptSelect.appendChild(optD);
    }
    deptGroup.appendChild(deptLabel);
    deptGroup.appendChild(deptSelect);
    form.appendChild(deptGroup);

    // Record Status field
    var statusGroup = Utils.createElement('div', { className: 'form-group' });
    var statusLabel = Utils.createElement('label', {
      htmlFor: 'modal-edit-status',
      className: 'form-label',
      textContent: 'Record Status'
    });
    var statusSelect = Utils.createElement('select', {
      id: 'modal-edit-status',
      className: 'form-control'
    });
    var statuses = ['Active Monitoring', 'Discharged', 'Deactivated'];
    for (var st = 0; st < statuses.length; st++) {
      var optS = Utils.createElement('option', { value: statuses[st], textContent: statuses[st] });
      if (statuses[st] === patient.status) optS.selected = true;
      statusSelect.appendChild(optS);
    }
    statusGroup.appendChild(statusLabel);
    statusGroup.appendChild(statusSelect);
    form.appendChild(statusGroup);

    // Action buttons in modal footer
    var cancelBtn = Utils.createElement('button', {
      type: 'button',
      className: 'btn btn-outline',
      textContent: 'Cancel'
    });

    var submitBtn = Utils.createElement('button', {
      type: 'submit',
      form: 'form-edit-patient',
      className: 'btn btn-primary',
      textContent: 'Save Changes'
    });

    var modal = Utils.openModal({
      title: 'Edit Patient Profile',
      content: form,
      actions: [cancelBtn, submitBtn]
    });

    cancelBtn.addEventListener('click', function () {
      modal.close();
    });

    // Wire submit button click to trigger form submit handler
    submitBtn.addEventListener('click', function () {
      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit();
      } else {
        var submitEvent = new Event('submit', { cancelable: true, bubbles: true });
        form.dispatchEvent(submitEvent);
      }
    });

    var isSubmitting = false;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (isSubmitting) return;

      apiErrorAlert.textContent = '';
      apiErrorAlert.style.display = 'none';
      nameError.textContent = '';
      nameInput.classList.remove('is-invalid');
      nameInput.removeAttribute('aria-invalid');
      ageError.textContent = '';
      ageInput.classList.remove('is-invalid');
      ageInput.removeAttribute('aria-invalid');

      var nameVal = nameInput.value.trim();
      var ageRaw = ageInput.value.trim();
      var ageVal = parseInt(ageRaw, 10);
      var hasError = false;

      if (!nameVal) {
        nameError.textContent = 'Display name is required.';
        nameInput.classList.add('is-invalid');
        nameInput.setAttribute('aria-invalid', 'true');
        nameInput.focus();
        hasError = true;
      } else if (nameVal.length > 60) {
        nameError.textContent = 'Display name must not exceed 60 characters.';
        nameInput.classList.add('is-invalid');
        nameInput.setAttribute('aria-invalid', 'true');
        nameInput.focus();
        hasError = true;
      }

      if (!ageRaw || isNaN(ageVal) || String(ageVal) !== ageRaw || ageVal < 0 || ageVal > 120) {
        ageError.textContent = 'Valid age between 0 and 120 is required.';
        ageInput.classList.add('is-invalid');
        ageInput.setAttribute('aria-invalid', 'true');
        if (!hasError) ageInput.focus();
        hasError = true;
      }

      if (hasError) return;

      isSubmitting = true;
      cancelBtn.disabled = true;
      var restore = Utils.setButtonLoading(submitBtn, 'Saving...');

      Api.request('/admin/patients/' + patient.id, {
        method: 'PATCH',
        body: {
          name: nameVal,
          age: ageVal,
          gender: genderSelect.value,
          department: deptSelect.value,
          status: statusSelect.value
        }
      }).then(function (res) {
        isSubmitting = false;
        restore();
        cancelBtn.disabled = false;
        if (res.ok) {
          modal.close();
          Utils.showToast('Demo Mode - saved only in this browser session, not in any real database.', 'success', 5000);
          fetchPatients(false);
        } else {
          apiErrorAlert.textContent = res.error || 'Failed to update patient record.';
          apiErrorAlert.style.display = 'block';
        }
      }).catch(function (err) {
        isSubmitting = false;
        restore();
        cancelBtn.disabled = false;
        apiErrorAlert.textContent = err.message || 'An unexpected error occurred.';
        apiErrorAlert.style.display = 'block';
      });
    });
  }

  /**
   * Deactivates a patient with an accessible confirmation dialog.
   */
  function handleDeactivatePatient(patient) {
    UI.showConfirmModal({
      title: 'Deactivate Patient Record',
      message: 'Are you sure you want to deactivate patient record ' + patient.id + ' (' + patient.name + ')? Deactivated patients are excluded from active monitoring rosters.',
      confirmText: 'Deactivate Patient',
      cancelText: 'Cancel',
      confirmVariant: 'btn-error',
      onConfirm: function () {
        return Api.request('/admin/patients/' + patient.id, {
          method: 'PATCH',
          body: { status: 'Deactivated' }
        }).then(function (res) {
          if (res.ok) {
            Utils.showToast('Demo Mode - saved only in this browser session, not in any real database.', 'success', 5000);
            fetchPatients(false);
          } else {
            Utils.showToast(res.error || 'Failed to deactivate patient record.', 'error');
          }
        }).catch(function (err) {
          Utils.showToast(err.message || 'An unexpected error occurred.', 'error');
        });
      }
    });
  }

  // Bind to DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPatientsPage);
  } else {
    initPatientsPage();
  }
})(window, document);
