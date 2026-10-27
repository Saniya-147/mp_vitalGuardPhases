/**
 * VitalGuard AI - Admin Dashboard Controller
 * assets/js/dashboard.js
 *
 * Implements Phase 2 Dashboard behaviors:
 * - Route protection & role verification
 * - Dynamic retrieval of metrics, predictions, observations, alerts, and audit logs
 * - Chart.js visualizations (Risk Distribution Donut & Multi-Vital Line Trend)
 * - Accessible tabular data summaries for assistive technologies
 * - Interactive alert triage with PATCH acknowledgment
 * - Responsive mobile navigation drawer
 *
 * CLINICAL & ACADEMIC DISCLAIMER:
 * All displayed records and risk scores are synthetic demonstration values
 * tagged source: "simulated". Not for clinical triage or diagnostic decisions.
 */

(function (window, document) {
  'use strict';

  var Utils = window.VitalGuardUtils;
  var Auth = window.VitalGuardAuth;
  var Api = window.VitalGuardApi;
  var Config = window.VitalGuardConfig || {};

  var riskChartInstance = null;
  var trendChartInstance = null;

  /**
   * Initializes the dashboard upon DOM readiness.
   */
  function initDashboard() {
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

    // 3. Load Dashboard Data
    loadDashboardData(currentUser);
  }

  /**
   * Updates user identity information in topbar and sidebar.
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
   * Orchestrates parallel API requests to fetch dashboard content.
   */
  function loadDashboardData(user) {
    var endpoints = Config.ENDPOINTS || {};

    var pDashboard = Api.request(endpoints.ADMIN_DASHBOARD || '/admin/dashboard');
    var pPredictions = Api.request(endpoints.ADMIN_PREDICTIONS || '/admin/predictions');
    var pObservations = Api.request(endpoints.ADMIN_OBSERVATIONS || '/admin/observations');
    var pAlerts = Api.request(endpoints.ADMIN_ALERTS || '/admin/alerts');

    // Fetch audit logs only if permitted for role
    var canViewAudit = Auth.hasPermission('view:audit_logs');
    var pAudit = canViewAudit ? Api.request(endpoints.ADMIN_AUDIT_LOGS || '/admin/audit-logs') : Promise.resolve({ ok: true, data: { items: [] } });

    Promise.all([pDashboard, pPredictions, pObservations, pAlerts, pAudit])
      .then(function (results) {
        var resDashboard = results[0];
        var resPredictions = results[1];
        var resObservations = results[2];
        var resAlerts = results[3];
        var resAudit = results[4];

        // 1. Render Metrics
        if (resDashboard.ok && resDashboard.data) {
          renderMetrics(resDashboard.data);
        } else {
          renderMetricsFallback();
        }

        // 2. Render Risk Distribution Donut Chart
        var predictions = (resPredictions.ok && resPredictions.data && resPredictions.data.items) ? resPredictions.data.items : [];
        renderRiskDistribution(predictions);

        // 3. Render Vital Observation Trend Line Chart
        var observations = (resObservations.ok && resObservations.data && resObservations.data.items) ? resObservations.data.items : [];
        renderVitalTrends(observations);

        // 4. Render Alerts Triage
        var alerts = (resAlerts.ok && resAlerts.data && resAlerts.data.items) ? resAlerts.data.items : [];
        renderAlertsTriage(alerts, user);

        // 5. Render Activity Stream (Role-Guarded)
        var auditLogs = (resAudit.ok && resAudit.data && resAudit.data.items) ? resAudit.data.items : [];
        renderActivityStream(auditLogs, canViewAudit);
      })
      .catch(function (err) {
        console.error('Dashboard data ingestion error:', err);
        Utils.showToast('Unable to load some simulated dashboard metrics.', 'warning');
      });
  }

  /**
   * Populates overview metric cards safely.
   */
  function renderMetrics(data) {
    Utils.setText('#metric-patients-active', data.activeMonitoring || 20);
    Utils.setText('#metric-patients-total', data.totalPatients || 25);
    Utils.setText('#metric-alerts-total', data.activeAlerts !== undefined ? data.activeAlerts : 2);
    Utils.setText('#metric-critical-badge', (data.criticalAlerts || 1) + ' Critical');
    Utils.setText('#metric-observations-count', data.totalObservations || 150);
    Utils.setText('#metric-system-status', data.systemStatus ? 'Operational' : 'Simulated');
    
    var syncTime = data.lastSync ? Utils.formatDate(data.lastSync) : 'Today';
    Utils.setText('#metric-last-sync', syncTime);
  }

  function renderMetricsFallback() {
    Utils.setText('#metric-patients-active', '20');
    Utils.setText('#metric-patients-total', '25');
    Utils.setText('#metric-alerts-total', '2');
    Utils.setText('#metric-critical-badge', '1 Critical');
    Utils.setText('#metric-observations-count', '150');
    Utils.setText('#metric-system-status', 'Operational');
    Utils.setText('#metric-last-sync', 'Today');
  }

  /**
   * Renders the Patient Risk Distribution Donut Chart and accessible table.
   */
  function renderRiskDistribution(predictions) {
    var counts = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
    for (var i = 0; i < predictions.length; i++) {
      var cat = predictions[i].riskCategory;
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts.Low++;
      }
    }

    var total = predictions.length || 1;
    var labels = ['Low Risk', 'Moderate Risk', 'High Risk', 'Critical Risk'];
    var dataValues = [counts.Low, counts.Moderate, counts.High, counts.Critical];
    var bgColors = ['#16A34A', '#D97706', '#EA580C', '#DC2626'];

    // Render Accessible Data Table
    var tbody = Utils.qs('#table-body-risk-summary');
    if (tbody) {
      while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

      var protocols = [
        'Standard Routine Observation (q8h)',
        'Increased Frequency Telemetry (q4h)',
        'Intensive Care Nursing Review (q1h)',
        'Immediate Clinical Triage & Rapid Response'
      ];

      for (var j = 0; j < labels.length; j++) {
        var tr = document.createElement('tr');

        var tdLabel = Utils.createElement('td', { style: 'font-weight: 500;' });
        var badge = Utils.createElement('span', {
          className: 'badge ' + (j === 0 ? 'badge-success' : (j === 1 ? 'badge-warning' : (j === 2 ? 'badge-warning' : 'badge-error'))),
          textContent: labels[j]
        });
        tdLabel.appendChild(badge);

        var tdCount = Utils.createElement('td', { textContent: String(dataValues[j]) });
        var pct = ((dataValues[j] / total) * 100).toFixed(0) + '%';
        var tdPct = Utils.createElement('td', { textContent: pct });
        var tdProtocol = Utils.createElement('td', { textContent: protocols[j] });

        tr.appendChild(tdLabel);
        tr.appendChild(tdCount);
        tr.appendChild(tdPct);
        tr.appendChild(tdProtocol);
        tbody.appendChild(tr);
      }
    }

    // Initialize Chart.js
    var canvas = Utils.qs('#chart-risk-distribution');
    if (!canvas || typeof window.Chart === 'undefined') return;

    if (riskChartInstance) {
      riskChartInstance.destroy();
    }

    riskChartInstance = new window.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: bgColors,
          borderColor: '#FFFFFF',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 16,
              font: { family: 'Inter', size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var val = ctx.raw || 0;
                var p = ((val / total) * 100).toFixed(1);
                return ' ' + ctx.label + ': ' + val + ' patients (' + p + '%)';
              }
            }
          }
        },
        cutout: '68%'
      }
    });
  }

  /**
   * Renders the Multi-Vital Observation Trends Line Chart and accessible table.
   */
  function renderVitalTrends(observations) {
    // Group observations by timestamp
    var hrPoints = [];
    var spo2Points = [];
    var bpPoints = [];
    var timeLabels = [];

    // Filter deterministic observation feed
    for (var i = 0; i < observations.length; i++) {
      var obs = observations[i];
      var timeStr = obs.timestamp ? obs.timestamp.substring(11, 16) : ('T-' + i);
      if (timeLabels.indexOf(timeStr) === -1 && timeLabels.length < 8) {
        timeLabels.push(timeStr);
      }

      if (obs.type === 'Heart Rate' && hrPoints.length < 8) {
        hrPoints.push(obs.value);
      } else if (obs.type.indexOf('Oxygen') !== -1 && spo2Points.length < 8) {
        spo2Points.push(obs.value);
      } else if (obs.type.indexOf('Systolic') !== -1 && bpPoints.length < 8) {
        bpPoints.push(obs.value);
      }
    }

    if (timeLabels.length === 0) {
      timeLabels = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
      hrPoints = [74, 76, 78, 82, 79, 75];
      spo2Points = [98, 97, 98, 96, 97, 98];
      bpPoints = [120, 122, 124, 126, 122, 120];
    }

    // Render Accessible Data Table
    var tbody = Utils.qs('#table-body-vital-summary');
    if (tbody) {
      while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

      var calcMean = function (arr) {
        if (!arr.length) return 'N/A';
        var sum = arr.reduce(function (a, b) { return a + b; }, 0);
        return (sum / arr.length).toFixed(1);
      };

      var summaryRows = [
        { name: 'Heart Rate (HR)', mean: calcMean(hrPoints), unit: 'bpm', reliability: '99.2% High (Simulated)' },
        { name: 'Oxygen Saturation (SpO2)', mean: calcMean(spo2Points), unit: '%', reliability: '98.8% High (Simulated)' },
        { name: 'Systolic Blood Pressure (SBP)', mean: calcMean(bpPoints), unit: 'mmHg', reliability: '97.5% High (Simulated)' }
      ];

      for (var r = 0; r < summaryRows.length; r++) {
        var row = summaryRows[r];
        var tr = document.createElement('tr');
        tr.appendChild(Utils.createElement('td', { textContent: row.name, style: 'font-weight: 500;' }));
        tr.appendChild(Utils.createElement('td', { textContent: row.mean }));
        tr.appendChild(Utils.createElement('td', { textContent: row.unit }));
        tr.appendChild(Utils.createElement('td', { textContent: row.reliability }));
        tbody.appendChild(tr);
      }
    }

    // Initialize Chart.js
    var canvas = Utils.qs('#chart-vital-trends');
    if (!canvas || typeof window.Chart === 'undefined') return;

    if (trendChartInstance) {
      trendChartInstance.destroy();
    }

    trendChartInstance = new window.Chart(canvas, {
      type: 'line',
      data: {
        labels: timeLabels,
        datasets: [
          {
            label: 'Heart Rate (bpm)',
            data: hrPoints,
            borderColor: '#0E9FA8',
            backgroundColor: 'rgba(14, 159, 168, 0.08)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Oxygen Saturation (%)',
            data: spo2Points,
            borderColor: '#0284C7',
            backgroundColor: 'transparent',
            borderDash: [4, 4],
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Systolic BP (mmHg)',
            data: bpPoints,
            borderColor: '#0B1F3A',
            backgroundColor: 'transparent',
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: { font: { family: 'Inter', size: 11 } }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 } }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 16,
              font: { family: 'Inter', size: 12 }
            }
          }
        }
      }
    });
  }

  /**
   * Renders the recent alerts triage list with interactive acknowledgment.
   */
  function renderAlertsTriage(alerts, user) {
    var container = Utils.qs('#alerts-triage-container');
    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    if (!alerts || alerts.length === 0) {
      var emptyEl = Utils.createElement('div', {
        className: 'empty-state',
        style: 'padding: var(--space-lg);'
      }, [
        Utils.createElement('div', { className: 'empty-state-title', textContent: 'No Active Alerts' }),
        Utils.createElement('p', { className: 'empty-state-description', textContent: 'All synthetic telemetry parameters are currently within normal simulated thresholds.' })
      ]);
      container.appendChild(emptyEl);
      return;
    }

    var canUpdateAlerts = Auth.hasPermission('update:alerts');

    for (var i = 0; i < alerts.length; i++) {
      (function (alert) {
        var item = Utils.createElement('div', {
          className: 'alert-triage-item severity-' + alert.severity,
          id: 'alert-item-' + alert.id
        });

        var header = Utils.createElement('div', { className: 'alert-triage-header' });

        var patientInfo = Utils.createElement('div', { style: 'display: flex; align-items: center; gap: var(--space-xs);' });
        var patientBadge = Utils.createElement('span', {
          className: 'badge badge-neutral',
          textContent: alert.patientId || 'PT-1000'
        });
        var alertTitle = Utils.createElement('span', {
          className: 'alert-triage-patient',
          textContent: alert.title || 'Threshold Warning'
        });
        patientInfo.appendChild(patientBadge);
        patientInfo.appendChild(alertTitle);

        var badgesContainer = Utils.createElement('div', { style: 'display: flex; gap: var(--space-2xs);' });
        var severityClass = alert.severity === 'Critical' ? 'badge-error' : (alert.severity === 'High' ? 'badge-warning' : (alert.severity === 'Warning' ? 'badge-warning' : 'badge-info'));
        var sevBadge = Utils.createElement('span', {
          className: 'badge ' + severityClass,
          textContent: alert.severity
        });

        var statusBadge = Utils.createElement('span', {
          className: 'badge ' + (alert.status === 'Active' ? 'badge-error' : 'badge-success'),
          id: 'alert-status-' + alert.id,
          textContent: alert.status
        });

        badgesContainer.appendChild(sevBadge);
        badgesContainer.appendChild(statusBadge);

        header.appendChild(patientInfo);
        header.appendChild(badgesContainer);

        var msg = Utils.createElement('div', {
          className: 'alert-triage-msg',
          textContent: alert.message || 'Simulated telemetry anomaly detected.'
        });

        var footer = Utils.createElement('div', { className: 'alert-triage-footer' });
        var timeSpan = Utils.createElement('span', {
          textContent: 'Triggered: ' + Utils.formatDateTime(alert.createdAt)
        });
        footer.appendChild(timeSpan);

        // Action button for Authorized Staff & Admin
        if (canUpdateAlerts && alert.status === 'Active') {
          var ackBtn = Utils.createElement('button', {
            type: 'button',
            className: 'btn btn-outline btn-sm',
            textContent: 'Acknowledge',
            'aria-label': 'Acknowledge alert ' + alert.id
          });

          ackBtn.addEventListener('click', function () {
            var restore = Utils.setButtonLoading(ackBtn, 'Updating...');
            Api.request('/admin/alerts/' + alert.id, {
              method: 'PATCH',
              body: {
                status: 'Acknowledged',
                acknowledgedBy: user.name || 'Healthcare Staff'
              }
            }).then(function (res) {
              restore();
              if (res.ok) {
                alert.status = 'Acknowledged';
                Utils.setText('#alert-status-' + alert.id, 'Acknowledged');
                var badgeEl = Utils.qs('#alert-status-' + alert.id);
                if (badgeEl) {
                  badgeEl.className = 'badge badge-success';
                }
                ackBtn.style.display = 'none';
                Utils.showToast('Alert ' + alert.id + ' acknowledged.', 'success');
              } else {
                Utils.showToast(res.error || 'Failed to update alert.', 'error');
              }
            });
          });

          footer.appendChild(ackBtn);
        } else if (alert.acknowledgedBy) {
          var ackNote = Utils.createElement('span', {
            style: 'font-style: italic; color: var(--color-text-secondary);',
            textContent: 'Ack by: ' + alert.acknowledgedBy
          });
          footer.appendChild(ackNote);
        }

        item.appendChild(header);
        item.appendChild(msg);
        item.appendChild(footer);
        container.appendChild(item);
      })(alerts[i]);
    }
  }

  /**
   * Renders the activity stream or staff operational note depending on role permissions.
   */
  function renderActivityStream(auditLogs, canViewAudit) {
    var container = Utils.qs('#activity-stream-container');
    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    if (!canViewAudit) {
      // Authorized Healthcare Staff view (audit logs restricted)
      Utils.setText('#activity-card-title', 'Clinical Operations Summary');
      Utils.setText('#activity-card-subtitle', 'Staff operational telemetry focus');
      Utils.setText('#activity-card-badge', 'Staff View');

      var staffNote = Utils.createElement('div', {
        className: 'alert alert-info',
        style: 'font-size: var(--font-size-xs); margin: 0;'
      }, [
        Utils.createElement('div', { className: 'alert-title', textContent: 'Operational Telemetry Mode' }),
        Utils.createElement('div', { textContent: 'Your account is focused on patient monitoring, observation ingestion, and alert triage. Detailed compliance audit logs are reserved for System Administrators and Reviewers.' })
      ]);

      container.appendChild(staffNote);
      return;
    }

    // Administrator and Reviewer View
    if (!auditLogs || auditLogs.length === 0) {
      container.appendChild(Utils.createElement('div', {
        style: 'text-align: center; color: var(--color-text-muted); padding: var(--space-md);',
        textContent: 'No recent audit events recorded.'
      }));
      return;
    }

    for (var i = 0; i < auditLogs.length; i++) {
      var log = auditLogs[i];
      var item = Utils.createElement('div', { className: 'activity-feed-item' });

      var iconBox = Utils.createElement('div', {
        style: 'width: 2rem; height: 2rem; border-radius: 50%; background-color: var(--color-bg-subtle); border: 1px solid var(--color-border-medium); display: flex; align-items: center; justify-content: center; flex-shrink: 0;'
      });
      var iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('viewBox', '0 0 24 24');
      iconSvg.setAttribute('width', '14');
      iconSvg.setAttribute('height', '14');
      iconSvg.setAttribute('fill', 'none');
      iconSvg.setAttribute('stroke', 'currentColor');
      iconSvg.setAttribute('stroke-width', '2');
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z');
      iconSvg.appendChild(path);
      iconBox.appendChild(iconSvg);

      var content = Utils.createElement('div', { className: 'activity-feed-content' });
      var headerDiv = Utils.createElement('div', { style: 'display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-xs);' });
      var actorSpan = Utils.createElement('span', { className: 'activity-feed-actor', textContent: log.actor || 'System' });
      var timeSpan = Utils.createElement('span', { className: 'activity-feed-time', textContent: Utils.formatDateTime(log.timestamp) });
      headerDiv.appendChild(actorSpan);
      headerDiv.appendChild(timeSpan);

      var actionDiv = Utils.createElement('div', { className: 'activity-feed-action' });
      var categoryBadge = Utils.createElement('span', {
        className: 'badge badge-neutral',
        style: 'font-size: 0.6rem; margin-right: var(--space-2xs);',
        textContent: log.category || 'Security'
      });
      var detailSpan = Utils.createElement('span', { textContent: log.details || log.action });
      actionDiv.appendChild(categoryBadge);
      actionDiv.appendChild(detailSpan);

      content.appendChild(headerDiv);
      content.appendChild(actionDiv);
      item.appendChild(iconBox);
      item.appendChild(content);
      container.appendChild(item);
    }
  }

  // Bind to DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
  } else {
    initDashboard();
  }
})(window, document);
