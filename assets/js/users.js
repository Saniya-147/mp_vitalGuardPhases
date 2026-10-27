/**
 * VitalGuard AI - User Management Controller
 * assets/js/users.js
 */

(function (window) {
  'use strict';

  // State
  var state = {
    q: '',
    role: 'all',
    status: 'all',
    sortBy: 'id',
    sortDir: 'asc',
    page: 1,
    pageSize: 10,
    total: 0,
    items: [],
    canManage: false
  };

  /**
   * DOM Elements Cache
   */
  var dom = {};

  /**
   * Initialize User Management Page
   */
  function init() {
    // 1. Enforce Authentication
    if (!window.VitalGuardAuth || !window.VitalGuardAuth.requireAuth()) {
      return;
    }

    cacheDOMElements();
    setupHeaderUser();
    setupSidebarToggle();

    // 2. Enforce Role-Based Permission (view:users)
    var canViewUsers = window.VitalGuardAuth.hasPermission('view:users');
    if (!canViewUsers) {
      showAccessDenied();
      return;
    }

    // 3. Check management permission (manage:users)
    state.canManage = window.VitalGuardAuth.hasPermission('manage:users');
    if (!state.canManage && dom.btnAddUser) {
      dom.btnAddUser.style.display = 'none';
    }

    // 4. Restore state from URL query parameters
    readUrlParams();

    // 5. Setup Event Listeners
    setupEventListeners();

    // 6. Fetch initial users data
    fetchUsers();
  }

  /**
   * Cache critical DOM references
   */
  function cacheDOMElements() {
    dom.usersContent = document.getElementById('users-view-content');
    dom.accessDeniedView = document.getElementById('access-denied-view');
    dom.deniedRoleName = document.getElementById('denied-role-name');

    dom.searchInput = document.getElementById('input-user-search');
    dom.roleFilter = document.getElementById('select-role-filter');
    dom.statusFilter = document.getElementById('select-status-filter');
    dom.btnResetFilters = document.getElementById('btn-reset-filters');
    dom.userCountDisplay = document.getElementById('user-count-display');

    dom.table = document.getElementById('users-table');
    dom.tableBody = document.getElementById('users-table-body');
    dom.emptyState = document.getElementById('users-empty-state');
    dom.loadingState = document.getElementById('users-loading-state');

    dom.paginationBar = document.getElementById('users-pagination-bar');
    dom.paginationInfo = document.getElementById('pagination-info');
    dom.pageSizeSelect = document.getElementById('select-page-size');
    dom.paginationControls = document.getElementById('pagination-controls');

    dom.btnAddUser = document.getElementById('btn-add-user');
    dom.modalAddUser = document.getElementById('modal-add-user');
    dom.formAddUser = document.getElementById('form-add-user');
    dom.btnCloseAddModal = document.getElementById('btn-close-add-user-modal');
    dom.btnCancelAddUser = document.getElementById('btn-cancel-add-user');

    dom.modalEditUser = document.getElementById('modal-edit-user');
    dom.formEditUser = document.getElementById('form-edit-user');
    dom.btnCloseEditModal = document.getElementById('btn-close-edit-user-modal');
    dom.btnCancelEditUser = document.getElementById('btn-cancel-edit-user');
    dom.editSafeguardWarning = document.getElementById('edit-safeguard-warning');

    dom.modalUserDetails = document.getElementById('modal-user-details');
    dom.btnCloseDetailsModal = document.getElementById('btn-close-details-modal');
    dom.btnDismissDetails = document.getElementById('btn-dismiss-details');
    dom.userDetailsContent = document.getElementById('user-details-content');
    dom.detailsPermissionsList = document.getElementById('details-permissions-list');
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
    if (topbarRole) topbarRole.textContent = user.role || 'Admin';

    if (initialsEl && user.name) {
      var parts = user.name.split(' ');
      var initials = parts.length > 1 ? (parts[0][0] + parts[1][0]) : parts[0].substring(0, 2);
      initialsEl.textContent = initials.toUpperCase();
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
   * Display Access Denied View
   */
  function showAccessDenied() {
    if (dom.usersContent) dom.usersContent.style.display = 'none';
    if (dom.accessDeniedView) {
      dom.accessDeniedView.style.display = 'block';
      var user = window.VitalGuardAuth.getCurrentUser();
      if (dom.deniedRoleName && user) {
        dom.deniedRoleName.textContent = user.role || 'Authorized Healthcare Staff';
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
      if (params.has('role')) state.role = params.get('role');
      if (params.has('status')) state.status = params.get('status');
      if (params.has('sortBy')) state.sortBy = params.get('sortBy');
      if (params.has('sortDir')) state.sortDir = params.get('sortDir');
      if (params.has('page')) state.page = Math.max(1, parseInt(params.get('page'), 10) || 1);
      if (params.has('pageSize')) state.pageSize = Math.max(1, parseInt(params.get('pageSize'), 10) || 10);

      // Reflect in UI controls
      if (dom.searchInput) dom.searchInput.value = state.q;
      if (dom.roleFilter) dom.roleFilter.value = state.role;
      if (dom.statusFilter) dom.statusFilter.value = state.status;
      if (dom.pageSizeSelect) dom.pageSizeSelect.value = String(state.pageSize);
    } catch (e) {}
  }

  /**
   * Synchronize current state to URL query parameters
   */
  function syncUrlParams() {
    try {
      var params = new URLSearchParams();
      if (state.q) params.set('q', state.q);
      if (state.role && state.role !== 'all') params.set('role', state.role);
      if (state.status && state.status !== 'all') params.set('status', state.status);
      if (state.sortBy && state.sortBy !== 'id') params.set('sortBy', state.sortBy);
      if (state.sortDir && state.sortDir !== 'asc') params.set('sortDir', state.sortDir);
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
          fetchUsers();
        }, 300);
      });
    }

    // Role filter
    if (dom.roleFilter) {
      dom.roleFilter.addEventListener('change', function (e) {
        state.role = e.target.value;
        state.page = 1;
        syncUrlParams();
        fetchUsers();
      });
    }

    // Status filter
    if (dom.statusFilter) {
      dom.statusFilter.addEventListener('change', function (e) {
        state.status = e.target.value;
        state.page = 1;
        syncUrlParams();
        fetchUsers();
      });
    }

    // Reset filters
    if (dom.btnResetFilters) {
      dom.btnResetFilters.addEventListener('click', function () {
        state.q = '';
        state.role = 'all';
        state.status = 'all';
        state.page = 1;
        if (dom.searchInput) dom.searchInput.value = '';
        if (dom.roleFilter) dom.roleFilter.value = 'all';
        if (dom.statusFilter) dom.statusFilter.value = 'all';
        syncUrlParams();
        fetchUsers();
      });
    }

    // Page size
    if (dom.pageSizeSelect) {
      dom.pageSizeSelect.addEventListener('change', function (e) {
        state.pageSize = parseInt(e.target.value, 10) || 10;
        state.page = 1;
        syncUrlParams();
        fetchUsers();
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
              state.sortDir = 'asc';
            }
            updateSortHeaderAria();
            syncUrlParams();
            fetchUsers();
          });
        })(sortHeaders[sh]);
      }
    }

    // Modals open/close
    if (dom.btnAddUser && state.canManage) {
      dom.btnAddUser.addEventListener('click', openAddUserModal);
    }
    if (dom.btnCloseAddModal) dom.btnCloseAddModal.addEventListener('click', closeAddUserModal);
    if (dom.btnCancelAddUser) dom.btnCancelAddUser.addEventListener('click', closeAddUserModal);
    if (dom.formAddUser) dom.formAddUser.addEventListener('submit', handleAddUserSubmit);

    if (dom.btnCloseEditModal) dom.btnCloseEditModal.addEventListener('click', closeEditUserModal);
    if (dom.btnCancelEditUser) dom.btnCancelEditUser.addEventListener('click', closeEditUserModal);
    if (dom.formEditUser) dom.formEditUser.addEventListener('submit', handleEditUserSubmit);

    if (dom.btnCloseDetailsModal) dom.btnCloseDetailsModal.addEventListener('click', closeUserDetailsModal);
    if (dom.btnDismissDetails) dom.btnDismissDetails.addEventListener('click', closeUserDetailsModal);

    // Escape key modal dismiss
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeAddUserModal();
        closeEditUserModal();
        closeUserDetailsModal();
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
   * Fetch users from central API client
   */
  function fetchUsers() {
    showLoading();

    var baseEndpoint = (window.VitalGuardConfig && window.VitalGuardConfig.ENDPOINTS && window.VitalGuardConfig.ENDPOINTS.ADMIN_USERS) || '/admin/users';
    var queryParts = [
      'sortBy=' + encodeURIComponent(state.sortBy),
      'sortDir=' + encodeURIComponent(state.sortDir),
      'page=' + state.page,
      'pageSize=' + state.pageSize
    ];

    if (state.q) queryParts.push('q=' + encodeURIComponent(state.q));
    if (state.role && state.role !== 'all') queryParts.push('role=' + encodeURIComponent(state.role));
    if (state.status && state.status !== 'all') queryParts.push('status=' + encodeURIComponent(state.status));

    var url = baseEndpoint + '?' + queryParts.join('&');

    window.VitalGuardApi.request(url).then(function (response) {
      hideLoading();

      if (response.ok && response.data) {
        state.items = response.data.items || [];
        state.total = response.data.total || 0;
        state.page = response.data.page || state.page;
        state.pageSize = response.data.pageSize || state.pageSize;

        renderUsersTable();
        renderPagination();
        updateCountDisplay();
      } else {
        showError(response.error || 'Failed to retrieve user accounts.');
      }
    }).catch(function (err) {
      hideLoading();
      showError('Network error while requesting user accounts.');
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
   * Render users rows into table using safe DOM APIs
   */
  function renderUsersTable() {
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
      var user = state.items[i];
      var tr = document.createElement('tr');

      // 1. User ID
      var tdId = document.createElement('td');
      var codeId = document.createElement('code');
      codeId.textContent = user.id;
      codeId.style.fontWeight = '600';
      codeId.style.color = 'var(--color-navy)';
      tdId.appendChild(codeId);
      tr.appendChild(tdId);

      // 2. User Identity (Avatar + Name & Email)
      var tdIdentity = document.createElement('td');
      var identityCell = document.createElement('div');
      identityCell.className = 'user-identity-cell';

      var avatar = document.createElement('div');
      avatar.className = 'user-avatar-initials';
      avatar.setAttribute('aria-hidden', 'true');
      var nameParts = (user.name || 'User').split(' ');
      var inits = nameParts.length > 1 ? (nameParts[0][0] + nameParts[1][0]) : nameParts[0].substring(0, 2);
      avatar.textContent = inits.toUpperCase();
      identityCell.appendChild(avatar);

      var textGroup = document.createElement('div');
      textGroup.className = 'user-identity-text';

      var nameSpan = document.createElement('span');
      nameSpan.className = 'user-name-text';
      nameSpan.textContent = user.name || 'Unknown User';
      textGroup.appendChild(nameSpan);

      var emailSpan = document.createElement('span');
      emailSpan.className = 'user-email-text';
      emailSpan.textContent = user.email || '';
      textGroup.appendChild(emailSpan);

      identityCell.appendChild(textGroup);
      tdIdentity.appendChild(identityCell);
      tr.appendChild(tdIdentity);

      // 3. Role Badge
      var tdRole = document.createElement('td');
      var roleBadge = document.createElement('span');
      roleBadge.className = 'badge';
      if (user.role === 'System Administrator') {
        roleBadge.className += ' badge-role-admin';
      } else if (user.role === 'Read-only Reviewer') {
        roleBadge.className += ' badge-role-reviewer';
      } else {
        roleBadge.className += ' badge-role-staff';
      }
      roleBadge.textContent = user.role;
      tdRole.appendChild(roleBadge);
      tr.appendChild(tdRole);

      // 4. Department
      var tdDept = document.createElement('td');
      tdDept.textContent = user.department || 'Unassigned';
      tdDept.style.color = 'var(--color-slate-700)';
      tdDept.style.fontSize = 'var(--font-size-sm)';
      tr.appendChild(tdDept);

      // 5. Status Badge
      var tdStatus = document.createElement('td');
      var statusBadge = document.createElement('span');
      statusBadge.className = 'badge';
      var st = (user.status || 'Active').toLowerCase();
      if (st === 'active') {
        statusBadge.className += ' badge-status-active';
      } else if (st === 'deactivated') {
        statusBadge.className += ' badge-status-deactivated';
      } else {
        statusBadge.className += ' badge-status-inactive';
      }
      statusBadge.textContent = user.status || 'Active';
      tdStatus.appendChild(statusBadge);
      tr.appendChild(tdStatus);

      // 6. Last Login
      var tdLogin = document.createElement('td');
      tdLogin.style.fontSize = 'var(--font-size-xs)';
      tdLogin.style.color = 'var(--color-slate-500)';
      if (user.lastLogin) {
        tdLogin.textContent = formatTimestamp(user.lastLogin);
      } else {
        tdLogin.textContent = 'Never (New Account)';
      }
      tr.appendChild(tdLogin);

      // 7. Actions Cell
      var tdActions = document.createElement('td');
      tdActions.style.textAlign = 'right';
      var actionsDiv = document.createElement('div');
      actionsDiv.className = 'user-actions-cell';
      actionsDiv.style.justifyContent = 'flex-end';

      // View Button
      var btnView = document.createElement('button');
      btnView.type = 'button';
      btnView.className = 'btn btn-outline btn-sm';
      btnView.textContent = 'View';
      btnView.setAttribute('aria-label', 'View profile for ' + user.name);
      (function (u) {
        btnView.addEventListener('click', function () {
          openUserDetailsModal(u);
        });
      })(user);
      actionsDiv.appendChild(btnView);

      // Edit Button (Only if manage:users permission is active)
      if (state.canManage) {
        var btnEdit = document.createElement('button');
        btnEdit.type = 'button';
        btnEdit.className = 'btn btn-secondary btn-sm';
        btnEdit.textContent = 'Edit';
        btnEdit.setAttribute('aria-label', 'Edit profile for ' + user.name);
        (function (u) {
          btnEdit.addEventListener('click', function () {
            openEditUserModal(u);
          });
        })(user);
        actionsDiv.appendChild(btnEdit);
      }

      tdActions.appendChild(actionsDiv);
      tr.appendChild(tdActions);

      dom.tableBody.appendChild(tr);
    }
  }

  /**
   * Format ISO date string into readable date/time
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

    dom.paginationInfo.textContent = 'Showing ' + start + ' to ' + end + ' of ' + state.total + ' users';

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
        fetchUsers();
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
            fetchUsers();
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
        fetchUsers();
      }
    });
    dom.paginationControls.appendChild(btnNext);
  }

  /**
   * Update users count indicator badge
   */
  function updateCountDisplay() {
    if (!dom.userCountDisplay) return;
    dom.userCountDisplay.textContent = state.total + ' ' + (state.total === 1 ? 'user' : 'users') + ' found';
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
  // Add User Modal Handlers
  // ==========================================================================

  function openAddUserModal() {
    if (!dom.modalAddUser) return;
    resetFormErrors(dom.formAddUser);
    if (dom.formAddUser) dom.formAddUser.reset();
    dom.modalAddUser.style.display = 'flex';
    dom.modalAddUser.setAttribute('aria-hidden', 'false');

    var firstInput = document.getElementById('add-user-name');
    if (firstInput) firstInput.focus();
  }

  function closeAddUserModal() {
    if (!dom.modalAddUser) return;
    dom.modalAddUser.style.display = 'none';
    dom.modalAddUser.setAttribute('aria-hidden', 'true');
    if (dom.btnAddUser) dom.btnAddUser.focus();
  }

  function handleAddUserSubmit(e) {
    e.preventDefault();
    resetFormErrors(dom.formAddUser);

    var nameInput = document.getElementById('add-user-name');
    var emailInput = document.getElementById('add-user-email');
    var roleInput = document.getElementById('add-user-role');
    var deptInput = document.getElementById('add-user-department');
    var statusInput = document.getElementById('add-user-status');

    var nameVal = (nameInput ? nameInput.value : '').trim();
    var emailVal = (emailInput ? emailInput.value : '').trim().toLowerCase();
    var roleVal = (roleInput ? roleInput.value : '').trim();
    var deptVal = (deptInput ? deptInput.value : '').trim();
    var statusVal = (statusInput ? statusInput.value : 'Active').trim();

    var hasError = false;

    if (!nameVal || nameVal.length < 2) {
      setFieldError('error-add-user-name', 'Full Name is required (minimum 2 characters).');
      hasError = true;
    }

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !emailRegex.test(emailVal)) {
      setFieldError('error-add-user-email', 'A valid email address is required.');
      hasError = true;
    }

    if (!roleVal) {
      setFieldError('error-add-user-role', 'Please select a system role.');
      hasError = true;
    }

    if (!deptVal) {
      setFieldError('error-add-user-department', 'Please select a departmental assignment.');
      hasError = true;
    }

    if (hasError) return;

    var endpoint = (window.VitalGuardConfig && window.VitalGuardConfig.ENDPOINTS && window.VitalGuardConfig.ENDPOINTS.ADMIN_USERS) || '/admin/users';

    window.VitalGuardApi.request(endpoint, {
      method: 'POST',
      body: {
        name: nameVal,
        email: emailVal,
        role: roleVal,
        department: deptVal,
        status: statusVal
      }
    }).then(function (res) {
      if (res.ok) {
        if (window.VitalGuardUtils && window.VitalGuardUtils.showToast) {
          window.VitalGuardUtils.showToast('Demo Mode — this change is simulated and is not saved to a real database.', 'success');
        }
        closeAddUserModal();
        fetchUsers();
      } else {
        showError(res.error || 'Failed to create simulated user.');
      }
    }).catch(function () {
      showError('Network error while creating user record.');
    });
  }

  // ==========================================================================
  // Edit User Modal Handlers
  // ==========================================================================

  function openEditUserModal(user) {
    if (!dom.modalEditUser || !user) return;
    resetFormErrors(dom.formEditUser);

    var idInput = document.getElementById('edit-user-id');
    var nameInput = document.getElementById('edit-user-name');
    var emailInput = document.getElementById('edit-user-email');
    var roleInput = document.getElementById('edit-user-role');
    var deptInput = document.getElementById('edit-user-department');
    var statusInput = document.getElementById('edit-user-status');

    if (idInput) idInput.value = user.id;
    if (nameInput) nameInput.value = user.name;
    if (emailInput) emailInput.value = user.email;
    if (roleInput) roleInput.value = user.role;
    if (deptInput) deptInput.value = user.department;
    if (statusInput) statusInput.value = user.status || 'Active';

    // Safeguard for primary administrator USR-1001
    var isPrimaryAdmin = (user.id === 'USR-1001');
    if (dom.editSafeguardWarning) {
      dom.editSafeguardWarning.style.display = isPrimaryAdmin ? 'block' : 'none';
    }

    if (statusInput) {
      statusInput.disabled = isPrimaryAdmin;
      if (isPrimaryAdmin) statusInput.value = 'Active';
    }
    if (roleInput) {
      roleInput.disabled = isPrimaryAdmin;
      if (isPrimaryAdmin) roleInput.value = 'System Administrator';
    }

    dom.modalEditUser.style.display = 'flex';
    dom.modalEditUser.setAttribute('aria-hidden', 'false');
    if (nameInput) nameInput.focus();
  }

  function closeEditUserModal() {
    if (!dom.modalEditUser) return;
    dom.modalEditUser.style.display = 'none';
    dom.modalEditUser.setAttribute('aria-hidden', 'true');
  }

  function handleEditUserSubmit(e) {
    e.preventDefault();
    resetFormErrors(dom.formEditUser);

    var idInput = document.getElementById('edit-user-id');
    var nameInput = document.getElementById('edit-user-name');
    var emailInput = document.getElementById('edit-user-email');
    var roleInput = document.getElementById('edit-user-role');
    var deptInput = document.getElementById('edit-user-department');
    var statusInput = document.getElementById('edit-user-status');

    var userId = idInput ? idInput.value : '';
    var nameVal = (nameInput ? nameInput.value : '').trim();
    var emailVal = (emailInput ? emailInput.value : '').trim().toLowerCase();
    var roleVal = (roleInput ? roleInput.value : '').trim();
    var deptVal = (deptInput ? deptInput.value : '').trim();
    var statusVal = (statusInput ? statusInput.value : 'Active').trim();

    if (!nameVal || nameVal.length < 2) {
      setFieldError('error-edit-user-name', 'Full Name is required (minimum 2 characters).');
      return;
    }

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !emailRegex.test(emailVal)) {
      setFieldError('error-edit-user-email', 'A valid email address is required.');
      return;
    }

    var baseEndpoint = (window.VitalGuardConfig && window.VitalGuardConfig.ENDPOINTS && window.VitalGuardConfig.ENDPOINTS.ADMIN_USERS) || '/admin/users';
    var patchUrl = baseEndpoint + '/' + encodeURIComponent(userId);

    window.VitalGuardApi.request(patchUrl, {
      method: 'PATCH',
      body: {
        name: nameVal,
        email: emailVal,
        role: roleVal,
        department: deptVal,
        status: statusVal
      }
    }).then(function (res) {
      if (res.ok) {
        if (window.VitalGuardUtils && window.VitalGuardUtils.showToast) {
          window.VitalGuardUtils.showToast('Demo Mode — this change is simulated and is not saved to a real database.', 'success');
        }
        closeEditUserModal();
        fetchUsers();
      } else {
        showError(res.error || 'Failed to update user profile.');
      }
    }).catch(function () {
      showError('Network error while updating user record.');
    });
  }

  // ==========================================================================
  // User Details Modal Handlers
  // ==========================================================================

  function openUserDetailsModal(user) {
    if (!dom.modalUserDetails || !user) return;

    if (dom.userDetailsContent) {
      dom.userDetailsContent.textContent = ''; // clear

      var fields = [
        { label: 'User ID', val: user.id },
        { label: 'Full Name', val: user.name },
        { label: 'Email Address', val: user.email },
        { label: 'System Role', val: user.role },
        { label: 'Department / Unit', val: user.department },
        { label: 'Account Status', val: user.status || 'Active' },
        { label: 'Last Login', val: user.lastLogin ? formatTimestamp(user.lastLogin) : 'Never' },
        { label: 'Data Source', val: user.source === 'simulated' ? 'Simulated Prototype Record' : user.source }
      ];

      for (var f = 0; f < fields.length; f++) {
        var itemDiv = document.createElement('div');

        var labelDiv = document.createElement('div');
        labelDiv.className = 'detail-item-label';
        labelDiv.textContent = fields[f].label;
        itemDiv.appendChild(labelDiv);

        var valDiv = document.createElement('div');
        valDiv.className = 'detail-item-val';
        valDiv.textContent = fields[f].val;
        itemDiv.appendChild(valDiv);

        dom.userDetailsContent.appendChild(itemDiv);
      }
    }

    // Role permissions list
    if (dom.detailsPermissionsList) {
      dom.detailsPermissionsList.textContent = '';
      var perms = window.VitalGuardAuth.getPermissionsForRole(user.role);
      if (perms && perms.length > 0) {
        for (var p = 0; p < perms.length; p++) {
          var pill = document.createElement('span');
          pill.className = 'permission-pill';
          pill.textContent = perms[p];
          dom.detailsPermissionsList.appendChild(pill);
        }
      } else {
        var noPerm = document.createElement('span');
        noPerm.style.fontSize = 'var(--font-size-xs)';
        noPerm.style.color = 'var(--color-slate-500)';
        noPerm.textContent = 'No specific operational permissions granted.';
        dom.detailsPermissionsList.appendChild(noPerm);
      }
    }

    dom.modalUserDetails.style.display = 'flex';
    dom.modalUserDetails.setAttribute('aria-hidden', 'false');
    if (dom.btnDismissDetails) dom.btnDismissDetails.focus();
  }

  function closeUserDetailsModal() {
    if (!dom.modalUserDetails) return;
    dom.modalUserDetails.style.display = 'none';
    dom.modalUserDetails.setAttribute('aria-hidden', 'true');
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

  // Self initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
