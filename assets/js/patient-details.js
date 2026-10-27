/**
 * VitalGuard AI - Patient Details & Telemetry Controller
 * assets/js/patient-details.js
 *
 * Implements Phase 3 Patient Details:
 * - Patient identification from URL query parameter
 * - Overview demographics and simulated cohort metadata
 * - Date-range telemetry filtering (24h, 7d, 30d, Custom From/To)
 * - Chart.js vital-sign trend visualizations with missing data gaps (null, spanGaps: false)
 * - Observation history table with missing values displayed as "Not recorded"
 * - Prediction history table and explainable AI (XAI) feature attribution display
 * - Alert history associated with the patient
 * - Sensor data-quality flags and hardware telemetry diagnostics
 * - Safe return navigation preserving previous list state
 *
 * CLINICAL & ACADEMIC DISCLAIMER:
 * All records, risk scores, and telemetry feeds are synthetic demonstration values
 * tagged source: "simulated". Not for clinical triage or diagnostic decisions.
 */

(function (window, document) {
  'use strict';

  var Utils = window.VitalGuardUtils;
  var Auth = window.VitalGuardAuth;
  var Api = window.VitalGuardApi;
  var UI = window.VitalGuardUI;
  var Config = window.VitalGuardConfig || {};

  var patientId = null;
  var currentPatient = null;
  var allObservations = [];
  var filteredObservations = [];
  var chartInstances = {};

  // Current date range state
  var dateRangeState = {
    preset: '24h',
    from: null,
    to: null
  };

  // Observation table pagination
  var obsPageState = {
    page: 1,
    pageSize: 10
  };

  /**
   * Initializes the Patient Details controller on DOM ready.
   */
  function initPatientDetails() {
    // 1. Enforce Authentication Route Guard
    if (!Auth || !Auth.requireAuth('../login.html')) {
      return;
    }

    var currentUser = Auth.getCurrentUser();
    if (!currentUser) {
      window.location.href = '../login.html';
      return;
    }

    // 2. Render User Details & Navigation States
    renderUserProfile(currentUser);
    setupNavigationHandlers();
    setupBackNavigation();

    // 3. Extract and validate Patient ID from URL
    var params = new URLSearchParams(window.location.search);
    patientId = (params.get('id') || '').trim();

    if (!patientId) {
      showNotFoundState('No patient identifier was provided in the URL query string.');
      return;
    }

    // Update topbar breadcrumb with patient ID
    Utils.setText('#topbar-breadcrumb-patient-id', patientId);

    // 4. Load Patient Data
    loadPatientData(patientId);
  }

  /**
   * Updates user identity in topbar and sidebar.
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
  }

  /**
   * Sets up responsive sidebar drawer and sign-out button.
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
   * Sets up safe Back to Patients navigation preserving search/filters where available.
   */
  function setupBackNavigation() {
    var backBtn = Utils.qs('#btn-back-to-patients');
    if (!backBtn) return;

    // If coming from patients.html on the same host, preserve referrer query params safely
    try {
      if (document.referrer && document.referrer.indexOf('patients.html') !== -1) {
        var refUrl = new URL(document.referrer);
        if (refUrl.origin === window.location.origin) {
          backBtn.href = refUrl.pathname + refUrl.search;
        }
      }
    } catch (e) {
      // Fallback default href is 'patients.html'
    }
  }

  /**
   * Orchestrates parallel retrieval of patient profile, observations, predictions, and alerts.
   */
  function loadPatientData(id) {
    showLoadingState();

    var pPatient = Api.request('/admin/patients/' + encodeURIComponent(id));
    var pObs = Api.request('/admin/observations?patientId=' + encodeURIComponent(id));
    var pPred = Api.request('/admin/predictions?patientId=' + encodeURIComponent(id));
    var pAlerts = Api.request('/admin/alerts?patientId=' + encodeURIComponent(id));

    Promise.all([pPatient, pObs, pPred, pAlerts])
      .then(function (results) {
        var resPatient = results[0];
        var resObs = results[1];
        var resPred = results[2];
        var resAlerts = results[3];

        if (!resPatient.ok || !resPatient.data) {
          showNotFoundState(resPatient.error || ('Simulated patient record with identifier "' + id + '" was not found.'));
          return;
        }

        currentPatient = resPatient.data;
        allObservations = (resObs.ok && resObs.data && resObs.data.items) ? resObs.data.items : [];
        var predictions = (resPred.ok && resPred.data && resPred.data.items) ? resPred.data.items : [];
        var alerts = (resAlerts.ok && resAlerts.data && resAlerts.data.items) ? resAlerts.data.items : [];

        // 1. Render Header & Overview Section
        renderPatientOverview(currentPatient);

        // 2. Setup Date Range Filters
        setupDateRangeControls();

        // 3. Apply initial 24h filter and render charts & table
        applyDateRangeFilter('24h');

        // 4. Render Prediction History & Latest Explanation
        renderPredictions(predictions);

        // 5. Render Alert History
        renderAlerts(alerts);

        // 6. Render Data Quality Information
        renderDataQuality(allObservations);

        // Reveal content
        hideLoadingState();
      })
      .catch(function (err) {
        showNotFoundState((err && err.message) ? err.message : 'A network error occurred while loading patient data.');
      });
  }

  /**
   * Renders patient header banner and overview demographics.
   */
  function renderPatientOverview(patient) {
    Utils.setText('#patient-banner-id', patient.id || 'PT-XXXX');
    Utils.setText('#patient-banner-name', patient.name || 'Not recorded');

    var ageGenderText = (patient.age !== undefined && patient.age !== null ? (patient.age + ' yrs') : 'Age not recorded') +
      ' • ' + (patient.gender || 'Not specified') +
      ' • ' + (patient.department || 'General Observation') +
      ' • ' + (patient.room || 'Unassigned Room') +
      ' • Admitted: ' + (patient.admissionDate ? Utils.formatDate(patient.admissionDate) : 'Not recorded');
    Utils.setText('#patient-banner-meta', ageGenderText);

    // Record Status badge
    var recStatus = patient.status || 'Active Monitoring';
    var recBadge = Utils.qs('#patient-banner-record-status');
    if (recBadge) {
      recBadge.className = 'badge ' + (recStatus === 'Active Monitoring' ? 'badge-info' : (recStatus === 'Discharged' ? 'badge-neutral' : 'badge-error'));
      recBadge.textContent = recStatus;
    }

    // Alert Status badge
    var alertStatus = patient.alertStatus || 'No Alerts';
    var alertBadge = Utils.qs('#patient-banner-alert-status');
    if (alertBadge) {
      var alertClass = 'badge-neutral';
      if (alertStatus === 'Active Alert') alertClass = 'badge-error';
      else if (alertStatus === 'Acknowledged') alertClass = 'badge-warning';
      else if (alertStatus === 'Resolved') alertClass = 'badge-success';
      alertBadge.className = 'badge ' + alertClass;
      alertBadge.textContent = alertStatus;
    }

    // Overview Metric Cards
    Utils.setText('#overview-id-gender', (patient.id || 'N/A') + ' (' + (patient.gender || 'N/A') + ')');
    Utils.setText('#overview-age', patient.age !== undefined ? String(patient.age) : 'N/A');
    Utils.setText('#overview-dept', patient.department || 'Not recorded');
    Utils.setText('#overview-room', patient.room || 'Unassigned');
    Utils.setText('#overview-admission', patient.admissionDate ? Utils.formatDate(patient.admissionDate) : 'Not recorded');
    Utils.setText('#overview-registration', patient.registrationDate ? Utils.formatDate(patient.registrationDate) : 'Not recorded');
    Utils.setText('#overview-obs-time', patient.latestObservationTime ? Utils.formatDateTime(patient.latestObservationTime) : 'Not recorded');
  }

  /**
   * Sets up event listeners for date range presets and custom date form.
   */
  function setupDateRangeControls() {
    var presetBtns = Utils.qsa('.date-range-preset-btn');
    for (var b = 0; b < presetBtns.length; b++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var preset = btn.getAttribute('data-preset');
          for (var pb = 0; pb < presetBtns.length; pb++) {
            presetBtns[pb].classList.remove('is-active');
          }
          btn.classList.add('is-active');
          applyDateRangeFilter(preset);
        });
      })(presetBtns[b]);
    }

    var customForm = Utils.qs('#form-custom-date-range');
    if (customForm) {
      customForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var fromVal = Utils.qs('#input-date-from').value;
        var toVal = Utils.qs('#input-date-to').value;

        if (!fromVal || !toVal) {
          Utils.showToast('Please select both From and To dates.', 'warning');
          return;
        }

        var range = UI.calculateDateRange('custom', fromVal, toVal);
        if (!range.isValid) {
          Utils.showToast(range.error || 'Invalid date range selected.', 'error');
          return;
        }

        // De-activate presets
        for (var pb = 0; pb < presetBtns.length; pb++) {
          presetBtns[pb].classList.remove('is-active');
        }

        dateRangeState.preset = 'custom';
        dateRangeState.from = range.from;
        dateRangeState.to = range.to;

        Utils.setText('#charts-range-indicator', 'Window: ' + Utils.formatDate(range.from) + ' to ' + Utils.formatDate(range.to));
        filterAndRenderObservations();
      });
    }
  }

  /**
   * Applies preset date range.
   */
  function applyDateRangeFilter(preset) {
    var range = UI.calculateDateRange(preset);
    dateRangeState.preset = preset;
    dateRangeState.from = range.from;
    dateRangeState.to = range.to;

    var presetLabels = {
      '24h': 'Window: Last 24 Hours',
      '7d': 'Window: Last 7 Days',
      '30d': 'Window: Last 30 Days'
    };
    Utils.setText('#charts-range-indicator', presetLabels[preset] || 'Window: Custom Range');

    // Populate custom inputs to match
    if (range.from && range.to) {
      var fromInput = Utils.qs('#input-date-from');
      var toInput = Utils.qs('#input-date-to');
      if (fromInput) fromInput.value = range.from.toISOString().substring(0, 10);
      if (toInput) toInput.value = range.to.toISOString().substring(0, 10);
    }

    filterAndRenderObservations();
  }

  /**
   * Filters the observations array according to current date range,
   * then updates both the trend charts and the observation history table.
   */
  function filterAndRenderObservations() {
    var fromTime = dateRangeState.from ? dateRangeState.from.getTime() : 0;
    var toTime = dateRangeState.to ? dateRangeState.to.getTime() : Infinity;

    filteredObservations = allObservations.filter(function (obs) {
      var obsTime = new Date(obs.timestamp).getTime();
      return obsTime >= fromTime && obsTime <= toTime;
    });

    // Check if empty in selected window
    var emptyNotice = Utils.qs('#charts-empty-notice');
    var chartsContainer = Utils.qs('#vital-charts-container');

    if (filteredObservations.length === 0) {
      if (chartsContainer) chartsContainer.style.display = 'none';
      if (emptyNotice) {
        emptyNotice.style.display = 'block';
        while (emptyNotice.firstChild) emptyNotice.removeChild(emptyNotice.firstChild);
        emptyNotice.appendChild(UI.createEmptyState(
          'No Telemetry Observations in Selected Window',
          'No vital measurements were recorded for this patient within the specified date range. Try selecting a broader telemetry window.'
        ));
      }
    } else {
      if (emptyNotice) emptyNotice.style.display = 'none';
      if (chartsContainer) chartsContainer.style.display = 'grid';

      // Render Charts
      renderVitalTrendCharts(filteredObservations);
    }

    // Render Observation History Table
    obsPageState.page = 1;
    renderObservationTable();
  }

  /**
   * Renders the 5 vital trend charts using Chart.js with missing values as gaps.
   *
   * REQUIREMENTS:
   * - Use null for missing values
   * - spanGaps: false (NEVER interpolate or connect across missing data)
   * - Never replace missing values with zero
   * - Label axes with units
   * - Accessible data table summary for each chart
   */
  function renderVitalTrendCharts(observations) {
    if (typeof window.Chart === 'undefined') return;

    // 1. Group observations by chronological timestamp
    // Sort timestamps ascending for charts
    var timeMap = {};
    for (var i = 0; i < observations.length; i++) {
      var o = observations[i];
      if (!timeMap[o.timestamp]) {
        timeMap[o.timestamp] = {};
      }
      timeMap[o.timestamp][o.type] = o.value; // May be null if missing
    }

    var sortedTimestamps = Object.keys(timeMap).sort(function (a, b) {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    // Format chart x-axis labels
    var chartLabels = sortedTimestamps.map(function (ts) {
      var d = new Date(ts);
      var month = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      var hours = String(d.getHours()).padStart(2, '0');
      var mins = String(d.getMinutes()).padStart(2, '0');
      return (month + '/' + day + ' ' + hours + ':' + mins);
    });

    // 2. Extract series with strict null handling
    var hrData = [];
    var sbpData = [];
    var dbpData = [];
    var spo2Data = [];
    var rrData = [];
    var tempData = [];

    for (var t = 0; t < sortedTimestamps.length; t++) {
      var stamp = sortedTimestamps[t];
      var entry = timeMap[stamp];

      hrData.push(entry['Heart Rate'] !== undefined ? entry['Heart Rate'] : null);
      sbpData.push(entry['Systolic Blood Pressure'] !== undefined ? entry['Systolic Blood Pressure'] : null);
      dbpData.push(entry['Diastolic Blood Pressure'] !== undefined ? entry['Diastolic Blood Pressure'] : null);
      spo2Data.push(entry['Oxygen Saturation (SpO2)'] !== undefined ? entry['Oxygen Saturation (SpO2)'] : null);
      rrData.push(entry['Respiratory Rate'] !== undefined ? entry['Respiratory Rate'] : null);
      tempData.push(entry['Body Temperature'] !== undefined ? entry['Body Temperature'] : null);
    }

    // Helper to calculate mean excluding nulls
    function calcStats(dataArray) {
      var valid = dataArray.filter(function (v) { return v !== null && !isNaN(v); });
      if (valid.length === 0) return { mean: 'N/A', min: 'N/A', max: 'N/A', count: 0, missing: dataArray.length };
      var sum = valid.reduce(function (a, b) { return a + b; }, 0);
      var mean = (sum / valid.length).toFixed(1);
      var min = Math.min.apply(null, valid);
      var max = Math.max.apply(null, valid);
      return { mean: mean, min: min, max: max, count: valid.length, missing: dataArray.length - valid.length };
    }

    // Helper to build accessible table summary
    function renderChartSummary(containerId, summaryData) {
      var container = Utils.qs(containerId);
      if (!container) return;
      while (container.firstChild) container.removeChild(container.firstChild);

      var table = Utils.createElement('table', { 'aria-label': 'Tabular summary of vital trend measurements' });
      var thead = Utils.createElement('thead', {}, [
        Utils.createElement('tr', {}, [
          Utils.createElement('th', { scope: 'col', textContent: 'Parameter' }),
          Utils.createElement('th', { scope: 'col', textContent: 'Mean' }),
          Utils.createElement('th', { scope: 'col', textContent: 'Range (Min-Max)' }),
          Utils.createElement('th', { scope: 'col', textContent: 'Recorded / Missing' }),
          Utils.createElement('th', { scope: 'col', textContent: 'Unit' })
        ])
      ]);

      var tbody = Utils.createElement('tbody');
      for (var s = 0; s < summaryData.length; s++) {
        var row = summaryData[s];
        var tr = Utils.createElement('tr', {}, [
          Utils.createElement('td', { style: 'font-weight: 500;', textContent: row.name }),
          Utils.createElement('td', { textContent: String(row.stats.mean) }),
          Utils.createElement('td', { textContent: row.stats.min + ' – ' + row.stats.max }),
          Utils.createElement('td', { textContent: row.stats.count + ' rec / ' + row.stats.missing + ' gap' }),
          Utils.createElement('td', { textContent: row.unit })
        ]);
        tbody.appendChild(tr);
      }

      table.appendChild(thead);
      table.appendChild(tbody);
      container.appendChild(table);
    }

    // Shared chart options builder
    function buildChartOptions(yTitle, yMin, yMax) {
      return {
        responsive: true,
        maintainAspectRatio: false,
        spanGaps: false, // Critical: Missing values are rendered as gaps
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          y: {
            beginAtZero: false,
            min: yMin,
            max: yMax,
            title: {
              display: true,
              text: yTitle,
              font: { family: 'Inter', size: 11, weight: '500' }
            },
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: { font: { family: 'Inter', size: 11 } }
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Inter', size: 10 },
              maxRotation: 45,
              minRotation: 0
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 12, font: { family: 'Inter', size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var val = ctx.raw;
                return val === null ? (' ' + ctx.dataset.label + ': Not recorded') : (' ' + ctx.dataset.label + ': ' + val);
              }
            }
          }
        }
      };
    }

    // 1. Chart: Heart Rate
    createOrUpdateChart('heart-rate', '#chart-heart-rate', {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Heart Rate (bpm)',
          data: hrData,
          borderColor: '#0E9FA8',
          backgroundColor: 'rgba(14, 159, 168, 0.08)',
          fill: true,
          spanGaps: false, // Strict requirement
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: buildChartOptions('Heart Rate (bpm)', 40, 160)
    });
    renderChartSummary('#summary-heart-rate', [
      { name: 'Heart Rate (ECG)', stats: calcStats(hrData), unit: 'bpm' }
    ]);

    // 2. Chart: Blood Pressure (Systolic & Diastolic)
    createOrUpdateChart('blood-pressure', '#chart-blood-pressure', {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: 'Systolic BP (mmHg)',
            data: sbpData,
            borderColor: '#0B1F3A',
            backgroundColor: 'transparent',
            spanGaps: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Diastolic BP (mmHg)',
            data: dbpData,
            borderColor: '#64748B',
            backgroundColor: 'transparent',
            borderDash: [4, 4],
            spanGaps: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: buildChartOptions('Blood Pressure (mmHg)', 50, 200)
    });
    renderChartSummary('#summary-blood-pressure', [
      { name: 'Systolic Blood Pressure (SBP)', stats: calcStats(sbpData), unit: 'mmHg' },
      { name: 'Diastolic Blood Pressure (DBP)', stats: calcStats(dbpData), unit: 'mmHg' }
    ]);

    // 3. Chart: SpO2
    createOrUpdateChart('spo2', '#chart-spo2', {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Oxygen Saturation (%)',
          data: spo2Data,
          borderColor: '#0284C7',
          backgroundColor: 'rgba(2, 132, 199, 0.08)',
          fill: true,
          spanGaps: false,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: buildChartOptions('SpO2 (%)', 80, 100)
    });
    renderChartSummary('#summary-spo2', [
      { name: 'Pulse Oximetry (SpO2)', stats: calcStats(spo2Data), unit: '%' }
    ]);

    // 4. Chart: Respiratory Rate
    createOrUpdateChart('respiratory-rate', '#chart-respiratory-rate', {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Respiratory Rate (breaths/min)',
          data: rrData,
          borderColor: '#D97706',
          backgroundColor: 'rgba(217, 119, 6, 0.08)',
          fill: true,
          spanGaps: false,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: buildChartOptions('Respiratory Rate (breaths/min)', 8, 40)
    });
    renderChartSummary('#summary-respiratory-rate', [
      { name: 'Respiratory Rate (RR)', stats: calcStats(rrData), unit: 'breaths/min' }
    ]);

    // 5. Chart: Body Temperature
    createOrUpdateChart('temperature', '#chart-temperature', {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Body Temperature (°C)',
          data: tempData,
          borderColor: '#DC2626',
          backgroundColor: 'rgba(220, 38, 38, 0.08)',
          fill: true,
          spanGaps: false,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: buildChartOptions('Temperature (°C)', 35.0, 41.0)
    });
    renderChartSummary('#summary-temperature', [
      { name: 'Core Body Temperature', stats: calcStats(tempData), unit: '°C' }
    ]);
  }

  /**
   * Helper to create or safely re-render Chart.js instance.
   */
  function createOrUpdateChart(key, canvasSelector, config) {
    var canvas = Utils.qs(canvasSelector);
    if (!canvas) return;

    if (chartInstances[key]) {
      chartInstances[key].destroy();
    }

    chartInstances[key] = new window.Chart(canvas, config);
  }

  /**
   * Renders the tabular observation history log.
   * Grouped by timestamp with pagination. Missing measurements show "Not recorded".
   */
  function renderObservationTable() {
    var tbody = Utils.qs('#observations-table-body');
    var badgeCount = Utils.qs('#obs-table-count-badge');
    var paginationContainer = Utils.qs('#observations-pagination-container');

    if (!tbody) return;
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    if (paginationContainer) while (paginationContainer.firstChild) paginationContainer.removeChild(paginationContainer.firstChild);

    // Group observations by timestamp
    var timeMap = {};
    for (var i = 0; i < filteredObservations.length; i++) {
      var o = filteredObservations[i];
      if (!timeMap[o.timestamp]) {
        timeMap[o.timestamp] = {
          timestamp: o.timestamp,
          vitals: {},
          dq: o.dataQuality || null
        };
      }
      timeMap[o.timestamp].vitals[o.type] = {
        value: o.value,
        unit: o.unit
      };
      if (o.dataQuality && !timeMap[o.timestamp].dq) {
        timeMap[o.timestamp].dq = o.dataQuality;
      }
    }

    var timestamps = Object.keys(timeMap).sort(function (a, b) {
      return new Date(b).getTime() - new Date(a).getTime(); // Newest first for log
    });

    var totalRecords = timestamps.length;
    if (badgeCount) {
      badgeCount.textContent = totalRecords + ' Recording' + (totalRecords === 1 ? '' : 's');
    }

    if (totalRecords === 0) {
      var emptyTr = document.createElement('tr');
      var tdEmpty = Utils.createElement('td', {
        colSpan: 7,
        style: 'text-align: center; color: var(--color-text-muted); padding: var(--space-xl);',
        textContent: 'No telemetry observations recorded within the selected date window.'
      });
      emptyTr.appendChild(tdEmpty);
      tbody.appendChild(emptyTr);
      return;
    }

    // Paginate table rows (10 per page)
    var startIndex = (obsPageState.page - 1) * obsPageState.pageSize;
    var pagedTimestamps = timestamps.slice(startIndex, startIndex + obsPageState.pageSize);

    for (var r = 0; r < pagedTimestamps.length; r++) {
      var rowStamp = pagedTimestamps[r];
      var entry = timeMap[rowStamp];
      var tr = document.createElement('tr');

      // 1. Timestamp
      var tdTime = document.createElement('td');
      tdTime.style.fontWeight = '500';
      tdTime.textContent = Utils.formatDateTime(entry.timestamp);
      tr.appendChild(tdTime);

      // Helper for vital cells
      function createVitalCell(type, expectedUnit) {
        var td = document.createElement('td');
        var item = entry.vitals[type];
        if (item && item.value !== null && item.value !== undefined) {
          td.textContent = item.value + ' ' + (item.unit || expectedUnit);
        } else {
          var missingSpan = Utils.createElement('span', {
            style: 'color: var(--color-text-muted); font-style: italic;',
            textContent: 'Not recorded'
          });
          td.appendChild(missingSpan);
        }
        return td;
      }

      // 2. Heart Rate
      tr.appendChild(createVitalCell('Heart Rate', 'bpm'));

      // 3. Blood Pressure (SBP / DBP)
      var tdBP = document.createElement('td');
      var sbpItem = entry.vitals['Systolic Blood Pressure'];
      var dbpItem = entry.vitals['Diastolic Blood Pressure'];
      if (sbpItem && sbpItem.value !== null && dbpItem && dbpItem.value !== null) {
        tdBP.textContent = sbpItem.value + '/' + dbpItem.value + ' mmHg';
      } else if (sbpItem && sbpItem.value !== null) {
        tdBP.textContent = sbpItem.value + '/-- mmHg';
      } else if (dbpItem && dbpItem.value !== null) {
        tdBP.textContent = '--/' + dbpItem.value + ' mmHg';
      } else {
        tdBP.appendChild(Utils.createElement('span', {
          style: 'color: var(--color-text-muted); font-style: italic;',
          textContent: 'Not recorded'
        }));
      }
      tr.appendChild(tdBP);

      // 4. SpO2
      tr.appendChild(createVitalCell('Oxygen Saturation (SpO2)', '%'));

      // 5. Respiratory Rate
      tr.appendChild(createVitalCell('Respiratory Rate', 'breaths/min'));

      // 6. Body Temperature
      tr.appendChild(createVitalCell('Body Temperature', '°C'));

      // 7. Sensor Reliability / Flags
      var tdFlags = document.createElement('td');
      if (entry.dq) {
        var flagClass = entry.dq.level === 'warning' ? 'badge-data-quality level-warning' : 'badge-data-quality level-info';
        var flagBadge = Utils.createElement('span', {
          className: flagClass,
          textContent: entry.dq.flag || 'Flag'
        });
        tdFlags.appendChild(flagBadge);
      } else {
        var normalBadge = Utils.createElement('span', {
          className: 'badge badge-neutral',
          style: 'font-size: 0.65rem;',
          textContent: 'Nominal Sensor Feed'
        });
        tdFlags.appendChild(normalBadge);
      }
      tr.appendChild(tdFlags);

      tbody.appendChild(tr);
    }

    // Render table pagination if needed
    if (totalRecords > obsPageState.pageSize && paginationContainer) {
      var paginationEl = UI.createPagination({
        page: obsPageState.page,
        pageSize: obsPageState.pageSize,
        total: totalRecords,
        itemName: 'timestamps',
        onPageChange: function (newPage) {
          obsPageState.page = newPage;
          renderObservationTable();
        },
        onPageSizeChange: function (newSize) {
          obsPageState.pageSize = newSize;
          obsPageState.page = 1;
          renderObservationTable();
        }
      });
      paginationContainer.appendChild(paginationEl);
    }
  }

  /**
   * Renders the Prediction History table and the Latest Prediction Explanation.
   */
  function renderPredictions(predictions) {
    var tbody = Utils.qs('#predictions-table-body');
    var explanationContainer = Utils.qs('#prediction-explanation-container');

    if (!tbody || !explanationContainer) return;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    while (explanationContainer.firstChild) explanationContainer.removeChild(explanationContainer.firstChild);

    if (!predictions || predictions.length === 0) {
      // Empty state for predictions
      var emptyTr = document.createElement('tr');
      emptyTr.appendChild(Utils.createElement('td', {
        colSpan: 7,
        style: 'text-align: center; color: var(--color-text-muted); padding: var(--space-xl);',
        textContent: 'No predictive deterioration records generated for this patient.'
      }));
      tbody.appendChild(emptyTr);

      // Empty explanation
      explanationContainer.appendChild(UI.createEmptyState(
        'No Predictive Inference',
        'Explanation not available because no predictions have been evaluated for this patient.'
      ));
      return;
    }

    // Sort predictions newest first
    predictions.sort(function (a, b) {
      return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
    });

    for (var p = 0; p < predictions.length; p++) {
      var pred = predictions[p];
      var tr = document.createElement('tr');

      // 1. Prediction ID
      var tdPredId = document.createElement('td');
      var predIdLink = Utils.createElement('a', {
        href: 'prediction-details.html?id=' + encodeURIComponent(pred.id),
        style: 'font-family: var(--font-family-mono); font-weight: 500; color: var(--color-accent-teal); text-decoration: underline;',
        textContent: pred.id || 'N/A'
      });
      tdPredId.appendChild(predIdLink);
      tr.appendChild(tdPredId);

      // 2. Timestamp
      tr.appendChild(Utils.createElement('td', {
        textContent: Utils.formatDateTime(pred.generatedAt)
      }));

      // 3. Horizon
      tr.appendChild(Utils.createElement('td', {
        textContent: pred.predictionHorizon || '12h'
      }));

      // 4. Model Version
      tr.appendChild(Utils.createElement('td', {
        style: 'font-family: var(--font-family-mono); font-size: var(--font-size-2xs);',
        textContent: pred.modelVersion || 'v1.0.0-sim'
      }));

      // 5. Score (NOT labelled as a probability unless specified)
      var scoreVal = pred.predictedScore !== undefined ? pred.predictedScore.toFixed(2) : 'N/A';
      tr.appendChild(Utils.createElement('td', {
        style: 'font-weight: 600;',
        textContent: scoreVal
      }));

      // 6. Risk Tier
      var tier = pred.riskCategory || 'Low';
      var badgeClass = 'badge-neutral';
      if (tier === 'Low') badgeClass = 'badge-success';
      else if (tier === 'Moderate') badgeClass = 'badge-warning';
      else if (tier === 'High' || tier === 'Critical') badgeClass = 'badge-error';

      var tdTier = document.createElement('td');
      tdTier.appendChild(Utils.createElement('span', {
        className: 'badge ' + badgeClass,
        textContent: tier
      }));
      tr.appendChild(tdTier);

      // 7. Status
      tr.appendChild(Utils.createElement('td', {
        textContent: pred.status || 'Completed'
      }));

      tbody.appendChild(tr);
    }

    // Render Latest Prediction Explanation
    var latestPred = predictions[0];
    if (latestPred && latestPred.explanation && latestPred.explanation.available && latestPred.explanation.features) {
      var explWrapper = Utils.createElement('div', { style: 'display: flex; flex-direction: column; gap: var(--space-sm);' });

      // Model & Target metadata
      var metaDiv = Utils.createElement('div', {
        style: 'display: flex; align-items: center; justify-content: space-between; gap: var(--space-xs); flex-wrap: wrap; padding-bottom: var(--space-xs); border-bottom: 1px solid var(--color-border-light); font-size: var(--font-size-xs); color: var(--color-text-secondary);'
      }, [
        Utils.createElement('span', { textContent: 'Evaluation: ' + (latestPred.targetCondition || 'Deterioration Score') }),
        Utils.createElement('span', { textContent: 'Score: ' + latestPred.predictedScore.toFixed(2) + ' (' + latestPred.riskCategory + ' Risk)' })
      ]);
      explWrapper.appendChild(metaDiv);

      // Summary note
      if (latestPred.explanation.summary) {
        var summaryNote = Utils.createElement('div', {
          className: 'alert alert-info',
          style: 'font-size: var(--font-size-xs); margin: 0;'
        }, [
          Utils.createElement('div', { className: 'alert-title', textContent: 'Inference Summary (Simulated Attribution)' }),
          Utils.createElement('div', { textContent: latestPred.explanation.summary })
        ]);
        explWrapper.appendChild(summaryNote);
      }

      // Feature contributions bar visualization
      var featuresList = Utils.createElement('div', { className: 'feature-contrib-list' });
      var features = latestPred.explanation.features;

      for (var f = 0; f < features.length; f++) {
        var feat = features[f];
        var item = Utils.createElement('div', { className: 'feature-contrib-item' });

        var header = Utils.createElement('div', { className: 'feature-contrib-header' });
        var nameSpan = Utils.createElement('span', { className: 'feature-contrib-name', textContent: feat.feature });
        var statsSpan = Utils.createElement('span', {
          className: 'feature-contrib-stats',
          textContent: 'Observed: ' + feat.observed + ' ' + (feat.unit || '') + ' (Base: ' + feat.baseline + ')'
        });
        header.appendChild(nameSpan);
        header.appendChild(statsSpan);

        var barTrack = Utils.createElement('div', { className: 'feature-contrib-bar-track' });
        var pctWidth = Math.min(100, Math.max(5, Math.round(feat.contribution * 100)));
        var barFill = Utils.createElement('div', {
          className: 'feature-contrib-bar-fill',
          style: 'width: ' + pctWidth + '%;'
        });
        barTrack.appendChild(barFill);

        var footer = Utils.createElement('div', {
          style: 'display: flex; justify-content: flex-end; font-size: 0.6875rem; color: var(--color-text-muted); margin-top: 2px;',
          textContent: 'Feature Weight: ' + (feat.contribution * 100).toFixed(0) + '%'
        });

        item.appendChild(header);
        item.appendChild(barTrack);
        item.appendChild(footer);
        featuresList.appendChild(item);
      }

      explWrapper.appendChild(featuresList);
      explanationContainer.appendChild(explWrapper);
    } else {
      // Explanation unavailable notice
      var unavailableEl = Utils.createElement('div', {
        className: 'empty-state',
        style: 'padding: var(--space-xl);'
      }, [
        Utils.createElement('div', {
          className: 'empty-state-title',
          textContent: 'Explanation not available for this prediction.'
        }),
        Utils.createElement('p', {
          className: 'empty-state-description',
          textContent: 'The selected model inference record did not supply feature attribution weights. No artificial explanations or weights are generated on the client.'
        })
      ]);
      explanationContainer.appendChild(unavailableEl);
    }
  }

  /**
   * Renders the Alert History table or empty state.
   */
  function renderAlerts(alerts) {
    var tbody = Utils.qs('#alerts-table-body');
    if (!tbody) return;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (!alerts || alerts.length === 0) {
      var emptyTr = document.createElement('tr');
      emptyTr.appendChild(Utils.createElement('td', {
        colSpan: 5,
        style: 'text-align: center; color: var(--color-text-muted); padding: var(--space-xl);',
        textContent: 'No alert incidents recorded for this patient.'
      }));
      tbody.appendChild(emptyTr);
      return;
    }

    for (var a = 0; a < alerts.length; a++) {
      var al = alerts[a];
      var tr = document.createElement('tr');

      // 1. Alert ID
      var tdAlertId = document.createElement('td');
      var alertIdLink = Utils.createElement('a', {
        href: 'alerts.html?q=' + encodeURIComponent(al.id),
        style: 'font-family: var(--font-family-mono); font-weight: 500; color: var(--color-accent-teal); text-decoration: underline;',
        textContent: al.id || 'N/A'
      });
      tdAlertId.appendChild(alertIdLink);
      tr.appendChild(tdAlertId);

      // 2. Triggered Timestamp
      tr.appendChild(Utils.createElement('td', {
        textContent: Utils.formatDateTime(al.createdAt)
      }));

      // 3. Title / Message
      var tdDesc = document.createElement('td');
      tdDesc.appendChild(Utils.createElement('div', {
        style: 'font-weight: 600; color: var(--color-primary-navy);',
        textContent: al.title || 'Threshold Warning'
      }));
      tdDesc.appendChild(Utils.createElement('div', {
        style: 'font-size: var(--font-size-2xs); color: var(--color-text-secondary);',
        textContent: al.message || ''
      }));
      tr.appendChild(tdDesc);

      // 4. Severity
      var tdSev = document.createElement('td');
      var sevClass = al.severity === 'Critical' ? 'badge-error' : (al.severity === 'High' ? 'badge-warning' : (al.severity === 'Warning' ? 'badge-warning' : 'badge-info'));
      tdSev.appendChild(Utils.createElement('span', {
        className: 'badge ' + sevClass,
        textContent: al.severity || 'Info'
      }));
      tr.appendChild(tdSev);

      // 5. Status
      var tdStatus = document.createElement('td');
      var stClass = al.status === 'Active' ? 'badge-error' : (al.status === 'Acknowledged' ? 'badge-warning' : 'badge-success');
      tdStatus.appendChild(Utils.createElement('span', {
        className: 'badge ' + stClass,
        textContent: al.status || 'Active'
      }));
      tr.appendChild(tdStatus);

      tbody.appendChild(tr);
    }
  }

  /**
   * Renders the Data Quality and Sensor Diagnostics section.
   * Uses only flags supplied by the dataset. Does not invent clinical rules.
   */
  function renderDataQuality(observations) {
    var container = Utils.qs('#data-quality-container');
    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    var flagsFound = [];
    for (var i = 0; i < observations.length; i++) {
      var o = observations[i];
      if (o.dataQuality && flagsFound.indexOf(o.dataQuality.flag) === -1) {
        flagsFound.push(o.dataQuality);
      }
    }

    var content = Utils.createElement('div', { style: 'display: flex; flex-direction: column; gap: var(--space-md);' });

    // Hardware status card
    var hwCard = Utils.createElement('div', {
      style: 'background-color: var(--color-bg-subtle); border: 1px solid var(--color-border-light); border-radius: var(--radius-md); padding: var(--space-md); font-size: var(--font-size-xs);'
    }, [
      Utils.createElement('div', { style: 'font-weight: 600; color: var(--color-primary-navy); margin-bottom: var(--space-2xs);', textContent: 'Hardware Ingest Diagnostics' }),
      Utils.createElement('div', { style: 'color: var(--color-text-secondary); line-height: 1.5;', textContent: 'Continuous telemetry feed ingested from SyntheticTelemetrySensor-Model-X. Ingest reliability verified at nominal operational threshold.' })
    ]);
    content.appendChild(hwCard);

    // Sensor Flags list
    if (flagsFound.length > 0) {
      var flagSection = Utils.createElement('div', { style: 'display: flex; flex-direction: column; gap: var(--space-xs);' });
      flagSection.appendChild(Utils.createElement('div', {
        style: 'font-size: var(--font-size-xs); font-weight: 600; color: var(--color-primary-navy);',
        textContent: 'Telemetry Flags in Ingest Feed:'
      }));

      for (var f = 0; f < flagsFound.length; f++) {
        var flag = flagsFound[f];
        var isWarn = flag.level === 'warning';
        var flagItem = Utils.createElement('div', {
          className: isWarn ? 'alert alert-warning' : 'alert alert-info',
          style: 'font-size: var(--font-size-xs); margin: 0;'
        }, [
          Utils.createElement('div', { className: 'alert-title', textContent: flag.flag }),
          Utils.createElement('div', { textContent: flag.message || 'Sensor telemetry flag detected.' })
        ]);
        flagSection.appendChild(flagItem);
      }
      content.appendChild(flagSection);
    } else {
      var cleanStatus = Utils.createElement('div', {
        className: 'alert alert-success',
        style: 'font-size: var(--font-size-xs); margin: 0;'
      }, [
        Utils.createElement('div', { className: 'alert-title', textContent: 'Nominal Signal Integrity' }),
        Utils.createElement('div', { textContent: 'Zero hardware sensor artifact flags or calibration warnings recorded across observation feeds.' })
      ]);
      content.appendChild(cleanStatus);
    }

    container.appendChild(content);
  }

  /**
   * Displays loading state.
   */
  function showLoadingState() {
    var loadEl = Utils.qs('#patient-loading-container');
    var errEl = Utils.qs('#patient-error-container');
    var contentEl = Utils.qs('#patient-details-content');

    if (contentEl) contentEl.style.display = 'none';
    if (errEl) errEl.style.display = 'none';

    if (loadEl) {
      loadEl.style.display = 'block';
      while (loadEl.firstChild) loadEl.removeChild(loadEl.firstChild);
      loadEl.appendChild(UI.createLoadingState('Loading simulated patient telemetry profile...'));
    }
  }

  /**
   * Hides loading state.
   */
  function hideLoadingState() {
    var loadEl = Utils.qs('#patient-loading-container');
    var contentEl = Utils.qs('#patient-details-content');

    if (loadEl) loadEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';
  }

  /**
   * Displays Not Found / Error state with Back button.
   */
  function showNotFoundState(message) {
    var loadEl = Utils.qs('#patient-loading-container');
    var errEl = Utils.qs('#patient-error-container');
    var contentEl = Utils.qs('#patient-details-content');

    if (loadEl) loadEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'none';

    if (errEl) {
      errEl.style.display = 'block';
      while (errEl.firstChild) errEl.removeChild(errEl.firstChild);

      var backActionBtn = Utils.createElement('a', {
        href: 'patients.html',
        className: 'btn btn-primary btn-sm',
        style: 'margin-top: var(--space-md); text-decoration: none;',
        textContent: 'Back to Patients Roster'
      });

      var emptyView = UI.createEmptyState(
        'Simulated Patient Record Not Found',
        message || 'The requested patient identifier does not exist in the synthetic cohort.',
        backActionBtn
      );

      errEl.appendChild(emptyView);
    }
  }

  // Bind to DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPatientDetails);
  } else {
    initPatientDetails();
  }
})(window, document);
