/**
 * VitalGuard AI - Phase 5 Comprehensive Automated Verification Suite
 * test_phase5.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Setup mock window & browser environment
const mockSessionStore = {};
const mockWindow = {
  sessionStorage: {
    getItem: (key) => mockSessionStore[key] || null,
    setItem: (key, val) => { mockSessionStore[key] = String(val); },
    removeItem: (key) => { delete mockSessionStore[key]; },
    clear: () => { Object.keys(mockSessionStore).forEach(k => delete mockSessionStore[k]); }
  },
  location: { pathname: '/pages/users.html', search: '', href: '' }
};
global.window = mockWindow;
global.Blob = class {
  constructor(parts, opts) {
    this.parts = parts;
    this.opts = opts;
    this.size = parts.join('').length;
  }
};
global.URL = {
  createObjectURL: (blob) => 'blob:mock-url-' + Math.random(),
  revokeObjectURL: (url) => {}
};

let passedTests = 0;
let totalTests = 0;

function runTest(testName, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${testName}: ${err.message}`);
  }
}

async function runAsyncTest(testName, testFn) {
  totalTests++;
  try {
    await testFn();
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${testName}: ${err.message}`);
  }
}

async function main() {
  console.log('================================================================================');
  console.log('VITALGUARD AI — PHASE 5 VERIFICATION SUITE');
  console.log('Modules: User Management, Clinical Reports, Audit Logs');
  console.log('================================================================================\n');

  // Load modules
  require('./assets/js/config.js');
  require('./assets/js/mock-data.js');
  require('./assets/js/auth.js');
  require('./assets/js/api.js');

  // -------------------------------------------------------------------------
  // 1. Central Configuration & Proposed Contracts
  // -------------------------------------------------------------------------
  console.log('1. Central Configuration & API Contracts:');

  runTest('CONFIG.ENDPOINTS defines ADMIN_USERS', () => {
    assert.strictEqual(window.VitalGuardConfig.ENDPOINTS.ADMIN_USERS, '/admin/users');
  });

  runTest('CONFIG.ENDPOINTS defines ADMIN_USER_BY_ID', () => {
    assert.strictEqual(window.VitalGuardConfig.ENDPOINTS.ADMIN_USER_BY_ID, '/admin/users/{id}');
  });

  runTest('CONFIG.ENDPOINTS defines ADMIN_REPORTS', () => {
    assert.strictEqual(window.VitalGuardConfig.ENDPOINTS.ADMIN_REPORTS, '/admin/reports');
  });

  runTest('CONFIG.ENDPOINTS defines ADMIN_REPORT_BY_ID', () => {
    assert.strictEqual(window.VitalGuardConfig.ENDPOINTS.ADMIN_REPORT_BY_ID, '/admin/reports/{id}');
  });

  runTest('CONFIG.ENDPOINTS defines ADMIN_AUDIT_LOGS', () => {
    assert.strictEqual(window.VitalGuardConfig.ENDPOINTS.ADMIN_AUDIT_LOGS, '/admin/audit-logs');
  });

  runTest('CONFIG.ENDPOINTS defines ADMIN_AUDIT_LOG_BY_ID', () => {
    assert.strictEqual(window.VitalGuardConfig.ENDPOINTS.ADMIN_AUDIT_LOG_BY_ID, '/admin/audit-logs/{id}');
  });

  // -------------------------------------------------------------------------
  // 2. Role-Based Access Control (RBAC) Permissions
  // -------------------------------------------------------------------------
  console.log('\n2. Role-Based Access Control (RBAC) Permissions:');

  runTest('System Administrator has view:users, manage:users, view:reports, view:audit_logs', () => {
    const adminPerms = window.VitalGuardAuth.getPermissionsForRole('System Administrator');
    assert.ok(adminPerms.includes('view:users'));
    assert.ok(adminPerms.includes('manage:users'));
    assert.ok(adminPerms.includes('view:reports'));
    assert.ok(adminPerms.includes('view:audit_logs'));
  });

  runTest('Authorized Healthcare Staff has view:reports, but NOT view:users or view:audit_logs', () => {
    const staffPerms = window.VitalGuardAuth.getPermissionsForRole('Authorized Healthcare Staff');
    assert.ok(staffPerms.includes('view:reports'));
    assert.ok(!staffPerms.includes('view:users'), 'Staff must not have view:users');
    assert.ok(!staffPerms.includes('manage:users'), 'Staff must not have manage:users');
    assert.ok(!staffPerms.includes('view:audit_logs'), 'Staff must not have view:audit_logs');
  });

  runTest('Read-only Reviewer has view:reports and view:audit_logs, but NOT view:users or manage:users', () => {
    const revPerms = window.VitalGuardAuth.getPermissionsForRole('Read-only Reviewer');
    assert.ok(revPerms.includes('view:reports'));
    assert.ok(revPerms.includes('view:audit_logs'));
    assert.ok(!revPerms.includes('view:users'), 'Reviewer must not have view:users');
    assert.ok(!revPerms.includes('manage:users'), 'Reviewer must not have manage:users');
  });

  // -------------------------------------------------------------------------
  // 3. User Management Endpoints & Data Layer
  // -------------------------------------------------------------------------
  console.log('\n3. User Management Endpoints & Data Layer:');

  await runAsyncTest('GET /admin/users returns list of simulated users with total >= 10', async () => {
    const res = await window.VitalGuardApi.request('/admin/users');
    assert.strictEqual(res.ok, true);
    assert.ok(Array.isArray(res.data.items));
    assert.ok(res.data.total >= 10);
    assert.strictEqual(res.data.source, 'simulated');
    assert.strictEqual(res.data.items[0].source, 'simulated');
  });

  await runAsyncTest('GET /admin/users filters by keyword q', async () => {
    const res = await window.VitalGuardApi.request('/admin/users?q=Evelyn');
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.data.items.length, 1);
    assert.strictEqual(res.data.items[0].id, 'USR-1001');
  });

  await runAsyncTest('GET /admin/users filters by role', async () => {
    const res = await window.VitalGuardApi.request('/admin/users?role=System+Administrator');
    assert.strictEqual(res.ok, true);
    assert.ok(res.data.items.length >= 2);
    res.data.items.forEach(u => assert.strictEqual(u.role, 'System Administrator'));
  });

  await runAsyncTest('GET /admin/users filters by status', async () => {
    const res = await window.VitalGuardApi.request('/admin/users?status=Inactive');
    assert.strictEqual(res.ok, true);
    assert.ok(res.data.items.length >= 1);
    res.data.items.forEach(u => assert.strictEqual(u.status, 'Inactive'));
  });

  await runAsyncTest('GET /admin/users sorts by name descending', async () => {
    const res = await window.VitalGuardApi.request('/admin/users?sortBy=name&sortDir=desc');
    assert.strictEqual(res.ok, true);
    const names = res.data.items.map(u => u.name);
    for (let i = 0; i < names.length - 1; i++) {
      assert.ok(names[i].localeCompare(names[i + 1]) >= 0);
    }
  });

  await runAsyncTest('GET /admin/users paginates with page and pageSize', async () => {
    const res = await window.VitalGuardApi.request('/admin/users?page=2&pageSize=3');
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.data.items.length, 3);
    assert.strictEqual(res.data.page, 2);
    assert.strictEqual(res.data.pageSize, 3);
  });

  await runAsyncTest('GET /admin/users/{id} returns single user for valid ID', async () => {
    const res = await window.VitalGuardApi.request('/admin/users/USR-1002');
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.data.id, 'USR-1002');
    assert.strictEqual(res.data.role, 'Authorized Healthcare Staff');
  });

  await runAsyncTest('GET /admin/users/{id} returns 404 for unknown ID', async () => {
    const mockRes = await window.VitalGuardMockData.handleRequest('/admin/users/USR-9999');
    assert.strictEqual(mockRes.ok, false);
    assert.strictEqual(mockRes.status, 404);

    const apiRes = await window.VitalGuardApi.request('/admin/users/USR-9999');
    assert.strictEqual(apiRes.ok, false);
    assert.ok(apiRes.error.includes('not found'));
  });

  await runAsyncTest('POST /admin/users creates a new user with validation and source: "simulated"', async () => {
    const payload = {
      name: 'Dr. Test Administrator (Simulated)',
      email: 'test.admin@demo.vitalguard.test',
      role: 'System Administrator',
      department: 'Clinical Informatics & Administration',
      status: 'Active'
    };
    const res = await window.VitalGuardApi.request('/admin/users', {
      method: 'POST',
      body: payload
    });
    assert.strictEqual(res.ok, true);
    assert.ok(res.data.id.startsWith('USR-'));
    assert.strictEqual(res.data.name, payload.name);
    assert.strictEqual(res.data.source, 'simulated');

    // Verify session storage persistence
    const saved = JSON.parse(mockWindow.sessionStorage.getItem('vitalguard_mock_users'));
    assert.ok(saved.some(u => u.email === payload.email));
  });

  await runAsyncTest('POST /admin/users rejects duplicate email with 400', async () => {
    const mockRes = await window.VitalGuardMockData.handleRequest('/admin/users', {
      method: 'POST',
      body: {
        name: 'Duplicate Admin',
        email: 'admin@demo.vitalguard.test',
        role: 'System Administrator',
        department: 'Admin'
      }
    });
    assert.strictEqual(mockRes.ok, false);
    assert.strictEqual(mockRes.status, 400);

    const apiRes = await window.VitalGuardApi.request('/admin/users', {
      method: 'POST',
      body: {
        name: 'Duplicate Admin',
        email: 'admin@demo.vitalguard.test',
        role: 'System Administrator',
        department: 'Admin'
      }
    });
    assert.strictEqual(apiRes.ok, false);
    assert.ok(apiRes.error.includes('already exists'));
  });

  await runAsyncTest('PATCH /admin/users/{id} updates user details', async () => {
    const res = await window.VitalGuardApi.request('/admin/users/USR-1004', {
      method: 'PATCH',
      body: { department: 'Critical Care Telemetry (Updated)' }
    });
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.data.department, 'Critical Care Telemetry (Updated)');
  });

  await runAsyncTest('Safeguard: PATCH /admin/users/USR-1001 rejects deactivation with 400', async () => {
    const mockRes = await window.VitalGuardMockData.handleRequest('/admin/users/USR-1001', {
      method: 'PATCH',
      body: { status: 'Deactivated' }
    });
    assert.strictEqual(mockRes.ok, false);
    assert.strictEqual(mockRes.status, 400);

    const apiRes = await window.VitalGuardApi.request('/admin/users/USR-1001', {
      method: 'PATCH',
      body: { status: 'Deactivated' }
    });
    assert.strictEqual(apiRes.ok, false);
    assert.ok(apiRes.error.includes('USR-1001'));
  });

  await runAsyncTest('Safeguard: PATCH /admin/users/USR-1001 rejects demotion with 400', async () => {
    const mockRes = await window.VitalGuardMockData.handleRequest('/admin/users/USR-1001', {
      method: 'PATCH',
      body: { role: 'Read-only Reviewer' }
    });
    assert.strictEqual(mockRes.ok, false);
    assert.strictEqual(mockRes.status, 400);

    const apiRes = await window.VitalGuardApi.request('/admin/users/USR-1001', {
      method: 'PATCH',
      body: { role: 'Read-only Reviewer' }
    });
    assert.strictEqual(apiRes.ok, false);
    assert.ok(apiRes.error.includes('USR-1001'));
  });

  // -------------------------------------------------------------------------
  // 4. Clinical Reports Endpoints & Data Layer
  // -------------------------------------------------------------------------
  console.log('\n4. Clinical Reports Endpoints & Data Layer:');

  await runAsyncTest('GET /admin/reports returns reports list with total >= 8', async () => {
    const res = await window.VitalGuardApi.request('/admin/reports');
    assert.strictEqual(res.ok, true);
    assert.ok(Array.isArray(res.data.items));
    assert.ok(res.data.total >= 8);
    assert.strictEqual(res.data.source, 'simulated');
    assert.strictEqual(res.data.items[0].source, 'simulated');
  });

  await runAsyncTest('GET /admin/reports filters by category type', async () => {
    const res = await window.VitalGuardApi.request('/admin/reports?type=Telemetry+Audit');
    assert.strictEqual(res.ok, true);
    assert.ok(res.data.items.length >= 1);
    res.data.items.forEach(r => assert.strictEqual(r.type, 'Telemetry Audit'));
  });

  await runAsyncTest('GET /admin/reports filters by format (CSV vs PDF)', async () => {
    const res = await window.VitalGuardApi.request('/admin/reports?format=CSV');
    assert.strictEqual(res.ok, true);
    assert.ok(res.data.items.length >= 1);
    res.data.items.forEach(r => assert.strictEqual(r.format, 'CSV'));
  });

  await runAsyncTest('GET /admin/reports/{id} returns single report for valid ID', async () => {
    const res = await window.VitalGuardApi.request('/admin/reports/REP-1001');
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.data.id, 'REP-1001');
    assert.strictEqual(res.data.format, 'PDF');
  });

  await runAsyncTest('POST /admin/reports creates simulated report record with session persistence', async () => {
    const payload = {
      title: 'Automated Test Telemetry Review',
      type: 'Telemetry Audit',
      format: 'CSV',
      period: 'Last 24 Hours',
      description: 'Synthetic validation test report'
    };
    const res = await window.VitalGuardApi.request('/admin/reports', {
      method: 'POST',
      body: payload
    });
    assert.strictEqual(res.ok, true);
    assert.ok(res.data.id.startsWith('REP-'));
    assert.strictEqual(res.data.title, payload.title);
    assert.strictEqual(res.data.source, 'simulated');

    // Verify session persistence
    const saved = JSON.parse(mockWindow.sessionStorage.getItem('vitalguard_mock_reports'));
    assert.ok(saved.some(r => r.title === payload.title));
  });

  // -------------------------------------------------------------------------
  // 5. Audit Logs Endpoints & Immutability
  // -------------------------------------------------------------------------
  console.log('\n5. Audit Logs Endpoints & Immutability:');

  await runAsyncTest('GET /admin/audit-logs returns audit events list with total >= 14', async () => {
    const res = await window.VitalGuardApi.request('/admin/audit-logs');
    assert.strictEqual(res.ok, true);
    assert.ok(Array.isArray(res.data.items));
    assert.ok(res.data.total >= 14);
    assert.strictEqual(res.data.source, 'simulated');
    assert.strictEqual(res.data.items[0].source, 'simulated');
  });

  await runAsyncTest('GET /admin/audit-logs filters by category', async () => {
    const res = await window.VitalGuardApi.request('/admin/audit-logs?category=Security');
    assert.strictEqual(res.ok, true);
    assert.ok(res.data.items.length >= 1);
    res.data.items.forEach(log => assert.strictEqual(log.category, 'Security'));
  });

  await runAsyncTest('GET /admin/audit-logs filters by action code', async () => {
    const res = await window.VitalGuardApi.request('/admin/audit-logs?action=USER_AUTHENTICATION_SUCCESS');
    assert.strictEqual(res.ok, true);
    assert.ok(res.data.items.length >= 1);
    res.data.items.forEach(log => assert.strictEqual(log.action, 'USER_AUTHENTICATION_SUCCESS'));
  });

  await runAsyncTest('GET /admin/audit-logs/{id} returns single audit record', async () => {
    const res = await window.VitalGuardApi.request('/admin/audit-logs/LOG-1001');
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.data.id, 'LOG-1001');
    assert.strictEqual(res.data.action, 'USER_AUTHENTICATION_SUCCESS');
  });

  await runAsyncTest('Audit Immutability: POST /admin/audit-logs is rejected with 405 Method Not Allowed', async () => {
    const mockRes = await window.VitalGuardMockData.handleRequest('/admin/audit-logs', {
      method: 'POST',
      body: { action: 'UNAUTHORIZED_INJECTION' }
    });
    assert.strictEqual(mockRes.ok, false);
    assert.strictEqual(mockRes.status, 405);
    assert.ok(mockRes.error.includes('immutable'));

    const apiRes = await window.VitalGuardApi.request('/admin/audit-logs', {
      method: 'POST',
      body: { action: 'UNAUTHORIZED_INJECTION' }
    });
    assert.strictEqual(apiRes.ok, false);
    assert.ok(apiRes.error.includes('immutable'));
  });

  await runAsyncTest('Audit Immutability: PATCH /admin/audit-logs/LOG-1001 is rejected with 405', async () => {
    const mockRes = await window.VitalGuardMockData.handleRequest('/admin/audit-logs/LOG-1001', {
      method: 'PATCH',
      body: { details: 'TAMPERED' }
    });
    assert.strictEqual(mockRes.ok, false);
    assert.strictEqual(mockRes.status, 405);
  });

  await runAsyncTest('Audit Immutability: DELETE /admin/audit-logs/LOG-1001 is rejected with 405', async () => {
    const mockRes = await window.VitalGuardMockData.handleRequest('/admin/audit-logs/LOG-1001', {
      method: 'DELETE'
    });
    assert.strictEqual(mockRes.ok, false);
    assert.strictEqual(mockRes.status, 405);
  });

  // -------------------------------------------------------------------------
  // 6. HTML & CSS File Integrity
  // -------------------------------------------------------------------------
  console.log('\n6. HTML & CSS File Integrity:');

  const filesToCheck = [
    'pages/users.html',
    'assets/js/users.js',
    'assets/css/users.css',
    'pages/reports.html',
    'assets/js/reports.js',
    'assets/css/reports.css',
    'pages/audit-logs.html',
    'assets/js/audit-logs.js',
    'assets/css/audit-logs.css'
  ];

  filesToCheck.forEach(f => {
    runTest(`File exists: ${f}`, () => {
      assert.strictEqual(fs.existsSync(path.join(__dirname, f)), true);
    });
  });

  // -------------------------------------------------------------------------
  // 7. Safe DOM Inspection (Zero innerHTML)
  // -------------------------------------------------------------------------
  console.log('\n7. Safe DOM API Inspection:');

  const jsControllers = [
    'assets/js/users.js',
    'assets/js/reports.js',
    'assets/js/audit-logs.js'
  ];

  jsControllers.forEach(ctrl => {
    runTest(`No dynamic innerHTML assignment in ${ctrl}`, () => {
      const content = fs.readFileSync(path.join(__dirname, ctrl), 'utf8');
      assert.strictEqual(content.includes('.innerHTML ='), false, `Forbidden innerHTML assignment in ${ctrl}`);
    });
  });

  // -------------------------------------------------------------------------
  // 8. Mandatory Notices & Disclaimers
  // -------------------------------------------------------------------------
  console.log('\n8. Mandatory Academic & Simulation Notices:');

  runTest('Clinical reports view contains exact disclaimer notice', () => {
    const reportsHtml = fs.readFileSync(path.join(__dirname, 'pages/reports.html'), 'utf8');
    assert.ok(
      reportsHtml.includes('Academic research prototype — report outputs are not clinically validated.'),
      'Mandatory report disclaimer must be present in pages/reports.html'
    );
  });

  runTest('User management controller dispatches simulated change toast notice', () => {
    const usersJs = fs.readFileSync(path.join(__dirname, 'assets/js/users.js'), 'utf8');
    assert.ok(
      usersJs.includes('Demo Mode — this change is simulated and is not saved to a real database.'),
      'Simulation change toast notice must be present in assets/js/users.js'
    );
  });

  runTest('Reports controller dispatches simulated report toast notice', () => {
    const reportsJs = fs.readFileSync(path.join(__dirname, 'assets/js/reports.js'), 'utf8');
    assert.ok(
      reportsJs.includes('Demo Mode — report generation is simulated and saved to this browser session.'),
      'Simulation toast notice must be present in assets/js/reports.js'
    );
  });

  // -------------------------------------------------------------------------
  // 9. Navigation Cross-links Across All App Shell Views
  // -------------------------------------------------------------------------
  console.log('\n9. Navigation Cross-links in App Shell:');

  const appPages = [
    'pages/dashboard.html',
    'pages/patients.html',
    'pages/patient-details.html',
    'pages/predictions.html',
    'pages/prediction-details.html',
    'pages/alerts.html',
    'pages/users.html',
    'pages/reports.html',
    'pages/audit-logs.html'
  ];

  appPages.forEach(p => {
    runTest(`Governance links active in ${p}`, () => {
      const html = fs.readFileSync(path.join(__dirname, p), 'utf8');
      assert.ok(html.includes('href="users.html"'), `Missing active users.html link in ${p}`);
      assert.ok(html.includes('href="reports.html"'), `Missing active reports.html link in ${p}`);
      assert.ok(html.includes('href="audit-logs.html"'), `Missing active audit-logs.html link in ${p}`);
    });
  });

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log(`PHASE 5 TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
  if (passedTests === totalTests) {
    console.log('ALL PHASE 5 VERIFICATION CHECKS PASSED SUCCESSFULLY (0 FAILURES)');
  } else {
    console.error(`FAILED: ${totalTests - passedTests} tests failed`);
    process.exit(1);
  }
  console.log('================================================================================');
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
