# VitalGuard AI - Admin Web Application (Phase 5 Build)

VitalGuard AI is an administrative and clinical intelligence prototype designed to monitor synthetic patient vital observations, demonstrate clinical telemetry feeds, evaluate machine learning deterioration predictions with explainability (XAI), manage clinical alerts triage, and provide role-based operational oversight.

> **Specification Reference**: Implementation adheres strictly to the master architectural specification in [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md).

---

## 1. Multi-Phase Implementation Summary

* **Phase 1: Foundation & Authentication (Complete)**
  * Design system CSS architecture (`style.css`, `components.css`, `layout.css`, `responsive.css`).
  * Centralized configuration (`config.js`) and unified API client (`api.js`).
  * Authentication service (`auth.js`) with demo accounts and route guarding (`requireAuth()`).
  * Safe DOM utilities (`utils.js`) prohibiting dynamic `innerHTML`.
  * Accessible login interface (`login.html` & `login.js`) and entry-point redirector (`index.html`).

* **Phase 2: App Shell & Operational Dashboard (Complete)**
  * Responsive App Shell with collapsible sidebar and mobile drawer navigation.
  * Clinical Dashboard (`pages/dashboard.html` & `assets/js/dashboard.js`) with cohort metrics summary.
  * Chart.js visualizations: Patient Risk Stratification (donut) and Multi-Vital Trends (line chart).
  * Recent alerts incident triage with `PATCH /admin/alerts/{id}` acknowledgment.
  * Role-guarded activity audit stream.

* **Phase 3: Patient Management & Patient Details (Complete)**
  * **Patient Directory (`pages/patients.html` & `assets/js/patients.js`)**:
    * Searchable, filterable patient roster table displaying Patient ID, Name, Age, Registration Date, Latest Observation Time, Prediction Status, Alert Status, and Record Status.
    * Real-time debounced text search by patient ID or display name.
    * Record-status filter (`Active Monitoring`, `Discharged`, `Deactivated`) and alert-state filter.
    * Bidirectional sorting on all columns with accessible `aria-sort` indicators.
    * Pagination controls supporting 10, 25, and 50 rows per page with "Showing X–Y of Z" summary.
    * Full URL query state synchronization (`q`, `status`, `alertState`, `sortBy`, `sortDir`, `page`, `pageSize`) with browser Back/Forward (`popstate`) restoration.
    * Role-guarded Add Patient and Edit Patient modal dialogs with input validation and focus trapping.
    * Deactivate Patient workflow with accessible confirmation dialog.
    * Role-based visibility: Read-only Reviewers are restricted to viewing records only.
  * **Patient Details (`pages/patient-details.html` & `assets/js/patient-details.js`)**:
    * Route parameter intake via URL query string (`patient-details.html?id=PATIENT_ID`) with not-found state handling.
    * Detailed demographic and admission metadata overview cards.
    * Telemetry date-range selector bar with presets (Last 24 Hours, Last 7 Days, Last 30 Days) and custom From/To inputs with validation.
    * Five physiological vital-sign trend line charts (Heart Rate, Blood Pressure SBP/DBP, Oxygen Saturation SpO2, Respiratory Rate, Body Temperature) rendered with Chart.js.
    * Strict missing measurement handling: missing measurements are represented as gaps using `null` and `spanGaps: false`, never replaced with zero or interpolated.
    * Tabular accessible data summaries for every telemetry trend chart.
    * Comprehensive observation history table reflecting the selected date range, displaying "Not recorded" for sensor gaps.
    * Cross-links to Prediction Details and Alerts Triage.

* **Phase 4: Predictions & Explainability (XAI) + Alerts Management (Complete)**
  * **Module A: Predictions & Explainability (`pages/predictions.html`, `pages/prediction-details.html`, `assets/js/predictions.js`, `assets/js/prediction-details.js`, `assets/css/predictions.css`)**:
    * Prediction Records Directory: filterable and sortable scoring log with debounced search (`q`), risk category filters (`Critical`, `High`, `Moderate`, `Low`), status filters, model version filters, and pagination.
    * Direct record links connecting prediction rows to patient details (`patient-details.html?id=...`) and prediction details (`prediction-details.html?id=...`).
    * Prediction Details View: parses `?id=...`, displays patient summary context, model execution metadata, deterioration risk score gauge, and execution status.
    * Explainable AI (XAI) Feature Attribution: interactive Chart.js horizontal bar chart visualizing relative contribution weights of physiological telemetry drivers (e.g., hyperthermia, hypoxemia, tachypnea, hypotension) with tooltips comparing observed values against baseline normal values.
    * Accessible textual breakdown table accompanying the XAI visualization.
    * Exact Fallback Notice: when model records omit explanation weights, displays the exact notice: `"Explanation not available for this prediction."` with no artificial inferences fabricated on the client.
    * Academic Disclaimer: strict academic disclaimer declaring `"Research prototype output. Not clinically validated."`
  * **Module B: Clinical Alerts Management (`pages/alerts.html`, `assets/js/alerts.js`, `assets/css/alerts.css`)**:
    * Centralized clinical alerts triage table displaying Alert ID, Patient ID, Title, Incident Summary, Severity badge, Status badge, Timestamp, and Handled By attribution.
    * Search and filters by status (`Active`, `Acknowledged`, `Resolved`) and severity (`Critical`, `High`, `Warning`, `Info`).
    * Interactive Alert Details modal with accessible focus management.
    * Lifecycle Status Transitions: interactive Acknowledge and Resolve actions calling `PATCH /admin/alerts/{id}`.
    * Role-Based Access Control (RBAC): only `System Administrator` and `Authorized Healthcare Staff` can transition alert statuses; `Read-only Reviewer` accounts have action buttons disabled/restricted.
    * Session Persistence: alert updates persist in `sessionStorage` (`vitalguard_mock_alerts`) for the current browser session.
    * Exact User Notice: on alert updates, displays the exact notice: `"Demo Mode - saved only in this browser session, not in any real database."`.

* **Phase 5: User Management + Clinical Reports + Audit Logs (Complete)**
  * **Module A: User Management (`pages/users.html`, `assets/js/users.js`, `assets/css/users.css`)**:
    * Role-guarded administrative staff directory (`view:users`) restricted to `System Administrator` accounts. Unauthorized roles are presented with an accessible Access Denied security state.
    * Comprehensive user listing displaying User ID (`USR-1001` through `USR-1012`), Full Name, Email Address, System Role with color-coded badge, Department, Account Status (`Active`, `Inactive`, `Deactivated`), and Last Login timestamp.
    * Real-time debounced keyword search (`q`), role filter (`System Administrator`, `Authorized Healthcare Staff`, `Read-only Reviewer`), and status filter (`Active`, `Inactive`, `Deactivated`).
    * Bidirectional sorting across all user attributes and full URL query state synchronization (`q`, `role`, `status`, `sortBy`, `sortDir`, `page`, `pageSize`).
    * Add User modal (`manage:users`): form with validation for Full Name, Email, Role, Department, and Status. Dispatches simulated session toast: `"Demo Mode — this change is simulated and is not saved to a real database."` and persists to `sessionStorage` (`vitalguard_mock_users`). No passwords collected or stored.
    * Edit User modal (`manage:users`): profile update workflow. Implements mandatory safeguard protection for primary administrator (`USR-1001`): deactivation and demotion are strictly prohibited with clear warning banners.
    * User Details modal: displays comprehensive account metadata, assigned role permissions pills, and academic simulation badge.
  * **Module B: Clinical Reports (`pages/reports.html`, `assets/js/reports.js`, `assets/css/reports.css`)**:
    * Centralized clinical and governance reports directory accessible to all authenticated roles (`view:reports`).
    * Filterable and sortable catalog covering 8 diverse synthetic reports across categories: `Cohort Summary`, `Telemetry Audit`, `Model Performance`, `Alert Incident Analysis`, and `Compliance Summary`.
    * Prominent mandatory academic disclaimer on page and modals: `"Academic research prototype — report outputs are not clinically validated."`.
    * Generate Report modal: interactive simulated report generation (`POST /admin/reports`) with input validation, session persistence (`vitalguard_mock_reports`), and simulation toast.
    * Real CSV Export Download: generates non-empty, structured `.csv` datasets client-side using Blob URLs with synthetic cohort vitals and telemetry parameters.
    * Formatted PDF/Text Executive Summary Export: generates downloadable executive overview documents with prototype watermarks and study disclaimers.
    * Report Details modal: displays abstract, generation timestamp, category badge, reporting period, author, and file size.
  * **Module C: Audit Logs (`pages/audit-logs.html`, `assets/js/audit-logs.js`, `assets/css/audit-logs.css`)**:
    * Chronological, strictly read-only system audit trail (`view:audit_logs`) accessible to `System Administrator` and `Read-only Reviewer`. Restricted roles (`Authorized Healthcare Staff`) receive an accessible Access Denied guard.
    * Immutability enforcement: audit logs are strictly read-only; mutation endpoints return `405 Method Not Allowed`.
    * Search and filters by event category (`Security`, `Clinical Operation`, `System Health`, `Compliance Audit`) and action code (`USER_AUTHENTICATION_SUCCESS`, `ALERT_STATUS_ACKNOWLEDGED`, `ALERT_STATUS_RESOLVED`, `ALERT_TRIGGERED_CRITICAL`, `PATIENT_RECORD_ACCESSED`, `SYSTEM_CONFIG_VERIFIED`, `USER_ROLE_MODIFIED`, `REPORT_GENERATED`, `AUDIT_TRAIL_EXPORT_VIEWED`).
    * Bidirectional sorting (default descending timestamp) and URL state synchronization.
    * Event Inspection modal: renders actor, timestamp, category, action, IP address, description, and raw JSON event metadata safely using `textContent`.
  * **Governance Navigation**:
    * Enabled active navigation links across all app views (`dashboard.html`, `patients.html`, `patient-details.html`, `predictions.html`, `prediction-details.html`, `alerts.html`) pointing to `users.html`, `reports.html`, and `audit-logs.html`.

---

## 2. Supported API Contracts & Mock-Mode Implementation

### 2.1 Proposed API Contracts vs. Implemented Mock Endpoints

All network requests flow through `VitalGuardApi.request(endpoint, options)`. In development (`MOCK_MODE: true`), calls are intercepted and serviced client-side by `assets/js/mock-data.js`.

| Method | Endpoint | Status | Description / Query Parameters |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | **Implemented (Mock)** | Demo authentication returning simulated user and token |
| `GET` | `/users/me` | **Implemented (Mock)** | Current authenticated identity profile |
| `GET` | `/admin/dashboard` | **Implemented (Mock)** | Cohort metric aggregations and status |
| `GET` | `/admin/patients` | **Implemented (Mock)** | Paginated patient roster. Query params: `q`, `status`, `alertState`, `sortBy`, `sortDir`, `page`, `pageSize` |
| `POST` | `/admin/patients` | **Implemented (Mock)** | Adds a new synthetic patient record (Session-persisted) |
| `GET` | `/admin/patients/{id}` | **Implemented (Mock)** | Single patient demographic and status record |
| `PATCH`| `/admin/patients/{id}` | **Implemented (Mock)** | Updates patient profile fields or deactivates record |
| `GET` | `/admin/observations` | **Implemented (Mock)** | Vital observations. Query params: `patientId`, `from`, `to`, `type` |
| `GET` | `/admin/predictions` | **Implemented (Mock)** | Deterioration predictions. Query params: `q`, `patientId`, `riskCategory`, `status`, `modelVersion`, `sortBy`, `sortDir`, `page`, `pageSize` |
| `GET` | `/admin/predictions/{id}` | **Implemented (Mock)** | Single prediction record with XAI feature attribution weights |
| `GET` | `/admin/alerts` | **Implemented (Mock)** | Clinical threshold alerts. Query params: `q`, `patientId`, `status`, `severity`, `sortBy`, `sortDir`, `page`, `pageSize` |
| `GET` | `/admin/alerts/{id}` | **Implemented (Mock)** | Single alert incident record |
| `PATCH`| `/admin/alerts/{id}` | **Implemented (Mock)** | Updates alert status (`Acknowledged`, `Resolved`) with staff attribution |
| `GET` | `/admin/users` | **Implemented (Mock)** | User management roster. Query params: `q`, `role`, `status`, `department`, `sortBy`, `sortDir`, `page`, `pageSize` |
| `GET` | `/admin/users/{id}` | **Implemented (Mock)** | Single user record |
| `POST` | `/admin/users` | **Implemented (Mock)** | Adds new simulated user. Validates name, email, role, dept (Session-persisted) |
| `PATCH`| `/admin/users/{id}` | **Implemented (Mock)** | Updates user profile. Enforces safeguard preventing USR-1001 deactivation/demotion |
| `GET` | `/admin/reports` | **Implemented (Mock)** | Clinical reports catalog. Query params: `q`, `type`, `status`, `format`, `sortBy`, `sortDir`, `page`, `pageSize` |
| `GET` | `/admin/reports/{id}` | **Implemented (Mock)** | Single report record |
| `POST` | `/admin/reports` | **Implemented (Mock)** | Generates simulated report record (Session-persisted) |
| `GET` | `/admin/audit-logs` | **Implemented (Mock)** | System audit logs. Query params: `q`, `category`, `action`, `actor`, `sortBy`, `sortDir`, `page`, `pageSize` |
| `GET` | `/admin/audit-logs/{id}` | **Implemented (Mock)** | Single audit event record (Immutable; mutations return 405) |

---

## 3. Demo Credentials (Simulation Only)

| Role | Email Address | Password | Permissions Scope |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@demo.vitalguard.test` | `Demo@12345` | Full administrative: dashboard, patients, predictions, alerts, `view:users`, `manage:users`, `view:reports`, `view:audit_logs` |
| **Authorized Healthcare Staff** | `staff@demo.vitalguard.test` | `Staff@12345` | Clinical operations: dashboard, patients, predictions, alerts, `view:reports`. (Users and audit logs restricted) |
| **Read-only Reviewer** | `reviewer@demo.vitalguard.test` | `Review@12345` | Governance review: dashboard, patients, predictions, alerts, `view:reports`, `view:audit_logs`. (User management and mutation actions restricted) |

---

## 4. Local Execution Instructions

To run the application locally using Python's static HTTP server:

1. Open PowerShell or terminal in the project root:
   ```powershell
   cd "c:\Users\saniy\OneDrive\Documents\MINI_PROJECT_SEM V\VitalGuard_MP"
   ```

2. Start the HTTP server on port 5500:
   ```bash
   python -m http.server 5500
   ```

3. Open in your browser:
   * Login Portal: `http://localhost:5500/login.html`
   * Dashboard: `http://localhost:5500/pages/dashboard.html`
   * Patient Management: `http://localhost:5500/pages/patients.html`
   * Patient Details (Sample): `http://localhost:5500/pages/patient-details.html?id=PT-1007`
   * Predictions & Explainability: `http://localhost:5500/pages/predictions.html`
   * Prediction Details (Sample with XAI): `http://localhost:5500/pages/prediction-details.html?id=PRED-1003`
   * Alerts Triage: `http://localhost:5500/pages/alerts.html`
   * User Management: `http://localhost:5500/pages/users.html`
   * Clinical Reports: `http://localhost:5500/pages/reports.html`
   * Audit Trail Logs: `http://localhost:5500/pages/audit-logs.html`

---

## 5. Security & Architectural Governance

1. **Frontend Role Checks Are Presentation Only**: Client-side checks in `auth.hasPermission()` control UI element visibility only. A production backend must enforce authentication and authorization independently on every endpoint.
2. **Safe DOM Construction**: Dynamic HTML injection via unsafe `innerHTML` is strictly forbidden. All views construct DOM trees using `document.createElement()`, `Utils.createElement()`, and `textContent`.
3. **No Credential Persistence**: Plaintext credentials are never persisted to web storage. Passwords are never collected in user management forms.
4. **All Data Fictional**: All patient records, predictive inferences, user profiles, clinical reports, and audit logs are synthetic fixtures tagged `source: "simulated"`.
5. **Research Prototype Notice**: Outputs are strictly for academic demonstration and must never be presented as clinically validated.

