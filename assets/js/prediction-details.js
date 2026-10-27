/**
 * VitalGuard AI - Prediction Details & Explainability Controller
 * assets/js/prediction-details.js
 *
 * Responsibilities:
 * - Route guarding via Auth.requireAuth('view:predictions')
 * - Loading single prediction from GET /admin/predictions/{id} via Api.request
 * - Rendering prediction metadata, deterioration score gauge, and patient context
 * - Visualizing XAI feature attributions via Chart.js horizontal bar chart & accessible fallback table
 * - Displaying exact fallback notice: "Explanation not available for this prediction." when explanations are absent
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

  // Verify authentication
  var currentUser = null;
  if (Auth && typeof Auth.requireAuth === 'function') {
    currentUser = Auth.requireAuth('view:predictions');
    if (!currentUser) return;
  }

  var chartInstance = null;

  /**
   * Initializes controller, reads ?id=... from query string, loads record.
   */
  function init() {
    setupUserDisplay();
    setupSidebarToggle();
    setupLogout();

    var params = Utils.getUrlParams();
    var predictionId = (params.id || '').trim();

    if (!predictionId) {
      showError('Prediction Identifier Missing', 'No prediction record identifier was provided in the query parameters.');
      return;
    }

    loadPredictionRecord(predictionId);
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
   * Sidebar toggle drawer for small screens.
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
   * Loads prediction record from GET /admin/predictions/{id}.
   */
  function loadPredictionRecord(id) {
    showLoading();

    Api.request('/admin/predictions/' + encodeURIComponent(id))
      .then(function (response) {
        if (response.ok && response.data) {
          renderPrediction(response.data);
        } else {
          showError('Prediction Record Not Found', response.error || ('Simulated prediction record "' + id + '" was not found.'));
        }
      })
      .catch(function (err) {
        showError('Network / Client Error', err.message || 'An error occurred while communicating with the simulated prediction service.');
      });
  }

  /**
   * Displays loading spinner.
   */
  function showLoading() {
    var loadingEl = Utils.qs('#prediction-loading-state');
    var errorEl = Utils.qs('#prediction-error-state');
    var contentEl = Utils.qs('#prediction-loaded-content');

    if (loadingEl) loadingEl.style.display = 'block';
    if (errorEl) errorEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'none';
  }

  /**
   * Displays accessible error state.
   */
  function showError(title, message) {
    var loadingEl = Utils.qs('#prediction-loading-state');
    var errorEl = Utils.qs('#prediction-error-state');
    var contentEl = Utils.qs('#prediction-loaded-content');

    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'none';

    if (errorEl) {
      errorEl.style.display = 'block';
      while (errorEl.firstChild) errorEl.removeChild(errorEl.firstChild);

      var errorComponent = UI.createErrorState(title, message, function () {
        window.location.href = 'predictions.html';
      });

      // Update button text to return to predictions list
      var retryBtn = errorComponent.querySelector('button');
      if (retryBtn) {
        retryBtn.textContent = 'Return to Predictions List';
      }

      errorEl.appendChild(errorComponent);
    }
  }

  /**
   * Renders prediction record, metadata cards, score gauge, and XAI explainability.
   */
  function renderPrediction(pred) {
    var loadingEl = Utils.qs('#prediction-loading-state');
    var errorEl = Utils.qs('#prediction-error-state');
    var contentEl = Utils.qs('#prediction-loaded-content');

    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';

    // 1. Breadcrumb and Header
    Utils.setText('#breadcrumb-prediction-id', pred.id || 'Prediction Details');
    Utils.setText('#pred-header-title', pred.id || 'N/A');

    // Risk badge
    var tier = pred.riskCategory || 'Low';
    var riskBadgeClass = 'badge-neutral';
    var barColor = 'var(--color-success)';
    if (tier === 'Low') {
      riskBadgeClass = 'badge-success';
      barColor = 'var(--color-success)';
    } else if (tier === 'Moderate') {
      riskBadgeClass = 'badge-warning';
      barColor = 'var(--color-warning)';
    } else if (tier === 'High' || tier === 'Critical') {
      riskBadgeClass = 'badge-error';
      barColor = 'var(--color-error)';
    }

    var riskBadge = Utils.qs('#pred-header-risk-badge');
    if (riskBadge) {
      riskBadge.className = 'badge ' + riskBadgeClass;
      riskBadge.textContent = tier + ' Risk Tier';
    }

    // Status badge
    var statusBadge = Utils.qs('#pred-header-status-badge');
    if (statusBadge) {
      statusBadge.textContent = pred.status || 'Completed';
      statusBadge.className = 'badge badge-info';
    }

    // Patient record shortcut
    var shortcutContainer = Utils.qs('#patient-record-shortcut');
    if (shortcutContainer && pred.patientId) {
      while (shortcutContainer.firstChild) shortcutContainer.removeChild(shortcutContainer.firstChild);
      var ptShortcut = Utils.createElement('a', {
        href: 'patient-details.html?id=' + encodeURIComponent(pred.patientId),
        className: 'btn btn-primary btn-sm',
        style: 'text-decoration: none;',
        textContent: 'View Patient ' + pred.patientId + ' Record \u2192'
      });
      shortcutContainer.appendChild(ptShortcut);
    }

    // 2. Metadata Card 1: Patient Context
    var ptIdValue = Utils.qs('#meta-patient-id-value');
    if (ptIdValue) {
      while (ptIdValue.firstChild) ptIdValue.removeChild(ptIdValue.firstChild);
      var ptLink = Utils.createElement('a', {
        href: 'patient-details.html?id=' + encodeURIComponent(pred.patientId),
        style: 'color: var(--color-accent-teal); text-decoration: underline;',
        textContent: pred.patientId || 'PT-XXXX'
      });
      ptIdValue.appendChild(ptLink);
    }

    Utils.setText('#meta-horizon', pred.predictionHorizon || '12 Hours');
    Utils.setText('#meta-generated-at', Utils.formatDateTime(pred.generatedAt));

    // 3. Metadata Card 2: Model Execution Details
    Utils.setText('#meta-model-version', pred.modelVersion || 'v1.4.2-sim');
    Utils.setText('#meta-target-condition', pred.targetCondition || 'Simulated Deterioration Risk');
    var confPct = pred.confidence !== undefined ? (Math.round(pred.confidence * 100) + '%') : 'N/A';
    Utils.setText('#meta-confidence', confPct);
    Utils.setText('#meta-status', pred.status || 'Completed');

    // 4. Metadata Card 3: Deterioration Score Gauge
    var rawScore = pred.predictedScore !== undefined ? Number(pred.predictedScore) : 0;
    Utils.setText('#meta-score-value', rawScore.toFixed(2));

    var scoreBarFill = Utils.qs('#meta-score-bar-fill');
    if (scoreBarFill) {
      var scorePct = Math.min(100, Math.max(0, Math.round(rawScore * 100)));
      scoreBarFill.style.width = scorePct + '%';
      scoreBarFill.style.backgroundColor = barColor;
    }

    // 5. Explainability (XAI) Section
    renderExplainability(pred);
  }

  /**
   * Renders either Chart.js horizontal bar chart + textual table,
   * OR the exact fallback notice "Explanation not available for this prediction."
   */
  function renderExplainability(pred) {
    var container = Utils.qs('#xai-content-area');
    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    var hasExplanation = pred.explanation &&
      pred.explanation.available &&
      Array.isArray(pred.explanation.features) &&
      pred.explanation.features.length > 0;

    if (!hasExplanation) {
      // EXACT REQUIREMENT: Render "Explanation not available for this prediction."
      var emptyNotice = Utils.createElement('div', {
        className: 'empty-state',
        style: 'padding: var(--space-2xl); background-color: var(--color-bg-subtle); border-radius: var(--radius-md);'
      }, [
        Utils.createElement('div', {
          className: 'empty-state-title',
          textContent: 'Explanation not available for this prediction.'
        }),
        Utils.createElement('p', {
          className: 'empty-state-description',
          style: 'max-width: 540px; margin: var(--space-xs) auto 0 auto; line-height: 1.5;',
          textContent: 'The selected model inference record did not supply feature attribution weights. No artificial explanations or weights are generated on the client.'
        })
      ]);

      container.appendChild(emptyNotice);
      return;
    }

    var validFeatures = explanation.features.filter(function (f) {
      return f && typeof f === 'object' && typeof f.feature === 'string';
    });

    if (validFeatures.length === 0) {
      var emptyNotice = Utils.createElement('div', {
        className: 'empty-state',
        style: 'padding: var(--space-2xl); background-color: var(--color-bg-subtle); border-radius: var(--radius-md);'
      }, [
        Utils.createElement('div', {
          className: 'empty-state-title',
          textContent: 'Explanation not available for this prediction.'
        }),
        Utils.createElement('p', {
          className: 'empty-state-description',
          style: 'max-width: 540px; margin: var(--space-xs) auto 0 auto; line-height: 1.5;',
          textContent: 'The selected model inference record did not supply feature attribution weights. No artificial explanations or weights are generated on the client.'
        })
      ]);

      container.appendChild(emptyNotice);
      return;
    }

    // 1. Summary Callout
    if (explanation.summary) {
      var summaryCallout = Utils.createElement('div', {
        className: 'xai-summary-callout',
        role: 'note'
      }, [
        Utils.createElement('strong', {
          style: 'display: block; margin-bottom: 4px; font-weight: var(--font-weight-bold); color: var(--color-primary-navy);',
          textContent: 'Model Feature Attribution Summary:'
        }),
        Utils.createElement('div', {
          textContent: String(explanation.summary)
        })
      ]);
      container.appendChild(summaryCallout);
    }

    // 2. Chart.js Horizontal Bar Chart Wrapper
    var chartWrapper = Utils.createElement('div', {
      className: 'xai-chart-wrapper'
    });
    var canvas = Utils.createElement('canvas', {
      id: 'chart-feature-attributions',
      'aria-label': 'Feature contribution horizontal bar chart'
    });
    chartWrapper.appendChild(canvas);
    container.appendChild(chartWrapper);

    // Initialize Chart.js
    initFeatureAttributionChart(canvas, validFeatures);

    // 3. Accessible Textual Table Fallback / Summary
    var tableTitle = Utils.createElement('h3', {
      style: 'font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--color-primary-navy); margin-top: var(--space-xl); margin-bottom: var(--space-xs);',
      textContent: 'Feature Attribution Telemetry Breakdown Table'
    });
    container.appendChild(tableTitle);

    var tableWrapper = Utils.createElement('div', { className: 'xai-features-table-wrapper' });
    var table = Utils.createElement('table', {
      className: 'table',
      style: 'margin: 0; width: 100%; border-collapse: collapse; font-size: var(--font-size-sm);',
      'aria-label': 'Predictive feature weight breakdown table'
    });

    var thead = document.createElement('thead');
    thead.style.backgroundColor = 'var(--color-bg-subtle)';
    var trHead = document.createElement('tr');
    trHead.appendChild(Utils.createElement('th', { textContent: 'Feature Name', scope: 'col', style: 'padding: 0.75rem 1rem;' }));
    trHead.appendChild(Utils.createElement('th', { textContent: 'Observed Telemetry', scope: 'col', style: 'padding: 0.75rem 1rem;' }));
    trHead.appendChild(Utils.createElement('th', { textContent: 'Normal Baseline', scope: 'col', style: 'padding: 0.75rem 1rem;' }));
    trHead.appendChild(Utils.createElement('th', { textContent: 'Relative Feature Weight', scope: 'col', style: 'padding: 0.75rem 1rem;' }));
    thead.appendChild(trHead);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    for (var f = 0; f < validFeatures.length; f++) {
      var feat = validFeatures[f];
      var tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--color-border-light)';

      var featureName = feat.feature || 'Unspecified Telemetry Metric';
      var obsText = (feat.observed !== undefined && feat.observed !== null ? feat.observed : 'N/A') + (feat.unit ? (' ' + feat.unit) : '');
      var baseText = (feat.baseline !== undefined && feat.baseline !== null ? feat.baseline : 'N/A') + (feat.unit ? (' ' + feat.unit) : '');
      var contribVal = typeof feat.contribution === 'number' && !isNaN(feat.contribution) ? feat.contribution : 0;
      var weightPct = Math.round(contribVal * 100);

      var tdFeat = Utils.createElement('td', {
        style: 'font-weight: var(--font-weight-medium); padding: 0.75rem 1rem;',
        textContent: featureName
      });

      var tdObs = Utils.createElement('td', {
        style: 'padding: 0.75rem 1rem;',
        textContent: obsText
      });

      var tdBase = Utils.createElement('td', {
        style: 'padding: 0.75rem 1rem; color: var(--color-text-secondary);',
        textContent: baseText
      });

      var tdWeight = Utils.createElement('td', {
        style: 'font-weight: var(--font-weight-bold); font-family: var(--font-family-mono); padding: 0.75rem 1rem;',
        textContent: weightPct + '%'
      });

      tr.appendChild(tdFeat);
      tr.appendChild(tdObs);
      tr.appendChild(tdBase);
      tr.appendChild(tdWeight);
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    container.appendChild(tableWrapper);
  }

  /**
   * Initializes or updates Chart.js horizontal bar chart for feature attributions.
   */
  function initFeatureAttributionChart(canvas, features) {
    if (!canvas || typeof window.Chart === 'undefined') return;

    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    var labels = [];
    var dataValues = [];
    var backgroundColors = [];
    var borderColors = [];

    for (var i = 0; i < features.length; i++) {
      var feat = features[i];
      var labelName = feat.feature || ('Metric ' + (i + 1));
      labels.push(labelName);

      var contribVal = typeof feat.contribution === 'number' && !isNaN(feat.contribution) ? feat.contribution : 0;
      var pct = Math.round(contribVal * 100);
      dataValues.push(pct);

      // Color coding based on contribution weight
      if (contribVal >= 0.35) {
        backgroundColors.push('rgba(220, 38, 38, 0.85)'); // Red / Critical
        borderColors.push('#DC2626');
      } else if (contribVal >= 0.20) {
        backgroundColors.push('rgba(217, 119, 6, 0.85)'); // Amber / Moderate-High
        borderColors.push('#D97706');
      } else {
        backgroundColors.push('rgba(14, 159, 168, 0.85)'); // Teal / Standard
        borderColors.push('#0E9FA8');
      }
    }

    chartInstance = new window.Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Relative Attribution Weight (%)',
          data: dataValues,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 24
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal bar chart
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Relative Feature Weight (%)',
              font: { family: 'Inter', size: 12, weight: 'bold' },
              color: '#475569'
            },
            ticks: {
              callback: function (val) { return val + '%'; },
              font: { family: 'Inter', size: 11 }
            },
            grid: { color: 'rgba(226, 232, 240, 0.8)' }
          },
          y: {
            ticks: {
              font: { family: 'Inter', size: 12, weight: '500' },
              color: '#0B1F3A'
            },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var idx = ctx.dataIndex;
                var item = features[idx] || {};
                var pct = ctx.raw !== undefined ? ctx.raw : 0;
                var obsVal = (item.observed !== undefined && item.observed !== null ? item.observed : 'N/A') + (item.unit ? (' ' + item.unit) : '');
                var baseVal = (item.baseline !== undefined && item.baseline !== null ? item.baseline : 'N/A') + (item.unit ? (' ' + item.unit) : '');
                return [
                  ' Weight: ' + pct + '%',
                  ' Observed: ' + obsVal,
                  ' Baseline Normal: ' + baseVal
                ];
              }
            }
          }
        }
      }
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
