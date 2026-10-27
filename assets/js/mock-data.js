/**
 * VitalGuard AI - Deterministic Mock Data Provider
 * assets/js/mock-data.js
 *
 * IMPORTANT CLINICAL & ARCHITECTURAL DISCLAIMERS:
 * 1. ALL DATA IN THIS FILE IS ENTIRELY FICTIONAL, SYNTHETIC, AND DETERMINISTIC.
 * 2. NAMES, IDENTIFIERS, AND CLINICAL VALUES CANNOT AND MUST NOT BE MISTAKEN FOR REAL PATIENT RECORDS.
 * 3. NO CLINICAL RULES, RISK CALCULATIONS, OR MACHINE LEARNING INFERENCES ARE DERIVED HERE.
 * 4. ALL PREDICTIONS AND RISK CATEGORIES ARE STATIC PRE-WRITTEN SAMPLES LABELED AS SIMULATED EXAMPLES.
 * 5. ALL SAMPLE VALUES ARE FOR FRONTEND INTERFACE VALIDATION ONLY AND ARE NOT CLINICALLY VALIDATED.
 *
 * SIMULATED ENVIRONMENT REFERENCE TIME: 2026-10-15T12:00:00Z
 */

(function (window) {
  'use strict';

  // --- Static Users ---
  var MOCK_USERS = [
    {
      id: 'USR-1001',
      name: 'Dr. Evelyn Carter (Simulated Admin)',
      email: 'admin@demo.vitalguard.test',
      role: 'System Administrator',
      department: 'Clinical Informatics & Administration',
      status: 'Active',
      lastLogin: '2026-10-15T08:30:00Z',
      source: 'simulated',
      metadata: { simulatedEnvironment: true, accessLevel: 'Full Administrative' }
    },
    {
      id: 'USR-1002',
      name: 'Nurse Marcus Vance (Simulated Staff)',
      email: 'staff@demo.vitalguard.test',
      role: 'Authorized Healthcare Staff',
      department: 'Intensive Care Unit (Simulated)',
      status: 'Active',
      lastLogin: '2026-10-15T09:12:00Z',
      source: 'simulated',
      metadata: { simulatedEnvironment: true, accessLevel: 'Clinical Operational' }
    },
    {
      id: 'USR-1003',
      name: 'Auditor Sarah Lin (Simulated Reviewer)',
      email: 'reviewer@demo.vitalguard.test',
      role: 'Read-only Reviewer',
      department: 'Quality Assurance & Regulatory Audit',
      status: 'Active',
      lastLogin: '2026-10-14T16:45:00Z',
      source: 'simulated',
      metadata: { simulatedEnvironment: true, accessLevel: 'Read-Only Audit' }
    },
    {
      id: 'USR-1004',
      name: 'Dr. Julian Ross (Simulated Attending)',
      email: 'j.ross@demo.vitalguard.test',
      role: 'Authorized Healthcare Staff',
      department: 'Emergency Medicine (Simulated)',
      status: 'Active',
      lastLogin: '2026-10-14T12:00:00Z',
      source: 'simulated',
      metadata: { simulatedEnvironment: true, accessLevel: 'Clinical Operational' }
    },
    {
      id: 'USR-1005',
      name: 'System Service Account (Simulated)',
      email: 'system.daemon@demo.vitalguard.test',
      role: 'System Administrator',
      department: 'Infrastructure Automated Monitor',
      status: 'Active',
      lastLogin: '2026-10-15T00:00:00Z',
      source: 'simulated',
      metadata: { simulatedEnvironment: true, accessLevel: 'Daemon Service' }
    },
    {
      id: 'USR-1006',
      name: 'Nurse Priya Sharma (Simulated Staff)',
      email: 'p.sharma@demo.vitalguard.test',
      role: 'Authorized Healthcare Staff',
      department: 'Cardiology Care Unit (Simulated)',
      status: 'Active',
      lastLogin: '2026-10-15T06:40:00Z',
      source: 'simulated',
      metadata: { simulatedEnvironment: true, accessLevel: 'Clinical Operational' }
    },
    {
      id: 'USR-1007',
      name: 'Dr. Alan Turing (Simulated Research PI)',
      email: 'a.turing@demo.vitalguard.test',
      role: 'Read-only Reviewer',
      department: 'Medical AI Ethics Board',
      status: 'Active',
      lastLogin: '2026-10-13T14:15:00Z',
      source: 'simulated',
      metadata: { simulatedEnvironment: true, accessLevel: 'Read-Only Audit' }
    },
    {
      id: 'USR-1008',
      name: 'Nurse David Chen (Simulated Staff)',
      email: 'd.chen@demo.vitalguard.test',
      role: 'Authorized Healthcare Staff',
      department: 'Respiratory Step-Down (Simulated)',
      status: 'Inactive',
      lastLogin: '2026-10-01T11:20:00Z',
      source: 'simulated',
      metadata: { simulatedEnvironment: true, accessLevel: 'Clinical Operational' }
    },
    {
      id: 'USR-1009',
      name: 'Dr. Rachel Gomez (Simulated Specialist)',
      email: 'r.gomez@demo.vitalguard.test',
      role: 'Authorized Healthcare Staff',
      department: 'Neurological Ward (Simulated)',
      status: 'Active',
      lastLogin: '2026-10-15T07:10:00Z',
      source: 'simulated',
      metadata: { simulatedEnvironment: true, accessLevel: 'Clinical Operational' }
    },
    {
      id: 'USR-1010',
      name: 'Auditor Kenneth Clark (Simulated Compliance)',
      email: 'k.clark@demo.vitalguard.test',
      role: 'Read-only Reviewer',
      department: 'Clinical Governance Directorate',
      status: 'Deactivated',
      lastLogin: '2026-09-18T15:00:00Z',
      source: 'simulated',
      metadata: { simulatedEnvironment: true, accessLevel: 'Read-Only Audit' }
    },
    {
      id: 'USR-1011',
      name: 'Admin James Foster (Simulated SecOps)',
      email: 'j.foster@demo.vitalguard.test',
      role: 'System Administrator',
      department: 'Information Security Operations',
      status: 'Active',
      lastLogin: '2026-10-14T19:30:00Z',
      source: 'simulated',
      metadata: { simulatedEnvironment: true, accessLevel: 'Security Admin' }
    },
    {
      id: 'USR-1012',
      name: 'Nurse Beatrice O\'Connor (Simulated Staff)',
      email: 'b.oconnor@demo.vitalguard.test',
      role: 'Authorized Healthcare Staff',
      department: 'Post-Surgical Recovery (Simulated)',
      status: 'Active',
      lastLogin: '2026-10-15T05:50:00Z',
      source: 'simulated',
      metadata: { simulatedEnvironment: true, accessLevel: 'Clinical Operational' }
    }
  ];

  // Restore persisted mock users from sessionStorage if present
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      var savedUsers = window.sessionStorage.getItem('vitalguard_mock_users');
      if (savedUsers) {
        var parsedUsers = JSON.parse(savedUsers);
        if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
          MOCK_USERS = parsedUsers;
        }
      }
    }
  } catch (storageUserErr) {}

  /**
   * Helper to persist modified mock users to sessionStorage for the current browser session.
   */
  function saveUsersToSession() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('vitalguard_mock_users', JSON.stringify(MOCK_USERS));
      }
    } catch (saveUserErr) {}
  }

  // --- Static Patients (PT-1001 to PT-1025) ---
  var PATIENT_NAMES = [
    'Synthetic Subject Alpha-01',
    'Synthetic Subject Beta-02',
    'Synthetic Subject Gamma-03',
    'Synthetic Subject Delta-04',
    'Synthetic Subject Epsilon-05',
    'Synthetic Subject Zeta-06',
    'Synthetic Subject Eta-07',
    'Synthetic Subject Theta-08',
    'Synthetic Subject Iota-09',
    'Synthetic Subject Kappa-10',
    'Synthetic Subject Lambda-11',
    'Synthetic Subject Mu-12',
    'Synthetic Subject Nu-13',
    'Synthetic Subject Xi-14',
    'Synthetic Subject Omicron-15',
    'Synthetic Subject Pi-16',
    'Synthetic Subject Rho-17',
    'Synthetic Subject Sigma-18',
    'Synthetic Subject Tau-19',
    'Synthetic Subject Upsilon-20',
    'Synthetic Subject Phi-21',
    'Synthetic Subject Chi-22',
    'Synthetic Subject Psi-23',
    'Synthetic Subject Omega-24',
    'Synthetic Subject Prime-25'
  ];

  var DEPARTMENTS = [
    'Cardiology Care Unit (Simulated)',
    'Medical Intensive Care (Simulated)',
    'Neurological Ward (Simulated)',
    'Post-Surgical Recovery (Simulated)',
    'Respiratory Step-Down (Simulated)'
  ];

  var GENDERS = ['Female', 'Male', 'Non-Binary', 'Female', 'Male'];

  // Static baseline prediction risk categories per patient index
  var PATIENT_PRED_STATUSES = {
    'PT-1001': 'Low Risk',
    'PT-1002': 'Moderate Risk',
    'PT-1003': 'High Risk',
    'PT-1004': 'Low Risk',
    'PT-1005': 'Moderate Risk',
    'PT-1006': 'Low Risk',
    'PT-1007': 'Critical Risk',
    'PT-1008': 'Low Risk'
  };

  // Static baseline alert status per patient
  var PATIENT_ALERT_STATUSES = {
    'PT-1007': 'Active Alert',
    'PT-1003': 'Active Alert',
    'PT-1005': 'Acknowledged',
    'PT-1002': 'Resolved'
  };

  var MOCK_PATIENTS = [];
  for (var i = 1; i <= 25; i++) {
    var pId = 'PT-' + (1000 + i);
    var pAge = 35 + ((i * 7) % 50);
    var pGender = GENDERS[(i - 1) % GENDERS.length];
    var pDept = DEPARTMENTS[(i - 1) % DEPARTMENTS.length];
    var day = (i < 10 ? '0' : '') + i;
    var regDay = (i < 10 ? '0' : '') + ((i % 28) + 1);

    var admissionDate = '2026-09-' + (i <= 20 ? day : '20') + 'T10:00:00Z';
    var registrationDate = '2026-08-' + regDay + 'T08:30:00Z';
    var createdAt = registrationDate;
    var updatedAt = '2026-10-15T09:00:00Z';
    var latestObservationTime = '2026-10-15T11:00:00Z';

    MOCK_PATIENTS.push({
      id: pId,
      name: PATIENT_NAMES[i - 1],
      age: pAge,
      gender: pGender,
      department: pDept,
      room: 'Room-S' + (100 + i),
      admissionDate: admissionDate,
      registrationDate: registrationDate,
      createdAt: createdAt,
      updatedAt: updatedAt,
      latestObservationTime: latestObservationTime,
      latestPredictionStatus: PATIENT_PRED_STATUSES[pId] || 'Not Assessed',
      alertStatus: PATIENT_ALERT_STATUSES[pId] || 'No Alerts',
      status: i % 5 === 0 ? 'Discharged' : 'Active Monitoring',
      source: 'simulated',
      metadata: {
        dataset: 'VitalGuard-Synthetic-Cohort-V1',
        clinicalValidation: 'None (Academic Mock Data)',
        isSimulated: true
      }
    });
  }

  // Restore persisted mock patients from sessionStorage if present in current browser session
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      var savedPatients = window.sessionStorage.getItem('vitalguard_mock_patients');
      if (savedPatients) {
        var parsedPatients = JSON.parse(savedPatients);
        if (Array.isArray(parsedPatients) && parsedPatients.length > 0) {
          MOCK_PATIENTS = parsedPatients;
        }
      }
    }
  } catch (storageErr) {}

  /**
   * Helper to persist modified mock patients to sessionStorage for the current browser session.
   */
  function savePatientsToSession() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('vitalguard_mock_patients', JSON.stringify(MOCK_PATIENTS));
      }
    } catch (saveErr) {}
  }

  // --- Static Observations (Comprehensive Chronological Feed) ---
  // Covers:
  // - Last 24 Hours (multiple time points on Oct 14 & 15)
  // - Last 7 Days (Oct 09 - Oct 15)
  // - Last 30 Days (Sept 16 - Oct 15)
  // Intentionally includes missing vital-sign measurements (`null`) to test gaps with spanGaps: false
  // Intentionally includes sensor data-quality warning flags on select readings.

  var TIMESTAMPS_SERIES = [
    // 24 Hours window
    { ts: '2026-10-15T11:00:00Z', skipVitals: [] },
    { ts: '2026-10-15T08:00:00Z', skipVitals: ['Body Temperature'], dq: { flag: 'Motion Artifact Warning', level: 'warning', message: 'Transient subject movement during sampling window' } },
    { ts: '2026-10-15T04:00:00Z', skipVitals: [] },
    { ts: '2026-10-14T22:00:00Z', skipVitals: ['Oxygen Saturation (SpO2)'], dq: { flag: 'Low Perfusion Warning', level: 'info', message: 'Peripheral perfusion index slightly reduced' } },
    { ts: '2026-10-14T16:00:00Z', skipVitals: [] },
    { ts: '2026-10-14T12:00:00Z', skipVitals: [] },
    // 7 Days window
    { ts: '2026-10-13T10:00:00Z', skipVitals: [] },
    { ts: '2026-10-12T10:00:00Z', skipVitals: ['Diastolic Blood Pressure'] },
    { ts: '2026-10-11T10:00:00Z', skipVitals: [] },
    { ts: '2026-10-10T10:00:00Z', skipVitals: [] },
    { ts: '2026-10-09T10:00:00Z', skipVitals: [] },
    // 30 Days window
    { ts: '2026-10-05T10:00:00Z', skipVitals: [] },
    { ts: '2026-09-30T10:00:00Z', skipVitals: [] },
    { ts: '2026-09-25T10:00:00Z', skipVitals: ['Body Temperature'] },
    { ts: '2026-09-20T10:00:00Z', skipVitals: [] }
  ];

  var VITAL_DEFS = [
    { type: 'Heart Rate', unit: 'bpm', base: 74, variance: [0, 5, -4, 9, -6, 3, 7, -2, 4, 1, -3, 6, 2, -1, 4] },
    { type: 'Systolic Blood Pressure', unit: 'mmHg', base: 122, variance: [0, 7, -5, 12, -8, 4, 9, -3, 6, 2, -4, 8, 3, -2, 5] },
    { type: 'Diastolic Blood Pressure', unit: 'mmHg', base: 78, variance: [0, 4, -3, 6, -5, 2, 4, -1, 3, 1, -2, 4, 1, -1, 3] },
    { type: 'Oxygen Saturation (SpO2)', unit: '%', base: 97, variance: [0, 1, -2, 0, -3, 1, -1, 0, 1, -2, 0, 1, -1, 0, 1] },
    { type: 'Respiratory Rate', unit: 'breaths/min', base: 16, variance: [0, 3, -1, 4, -2, 1, 3, 0, 2, -1, 1, 3, 0, -1, 2] },
    { type: 'Body Temperature', unit: '°C', base: 37.0, variance: [0, 0.3, -0.2, 0.6, -0.3, 0.1, 0.4, -0.1, 0.2, 0.0, -0.2, 0.5, 0.1, -0.1, 0.2] }
  ];

  var MOCK_OBSERVATIONS = [];
  var obsIdCounter = 1001;

  for (var p = 0; p < MOCK_PATIENTS.length; p++) {
    var patient = MOCK_PATIENTS[p];
    
    // Discharged patients have fewer recent observations, active monitoring patients have full series
    var seriesLimit = patient.status === 'Discharged' ? 8 : TIMESTAMPS_SERIES.length;

    for (var t = 0; t < seriesLimit; t++) {
      var timeEntry = TIMESTAMPS_SERIES[t];
      
      for (var v = 0; v < VITAL_DEFS.length; v++) {
        var vDef = VITAL_DEFS[v];
        var isSkipped = timeEntry.skipVitals.indexOf(vDef.type) !== -1;
        var varIndex = (p + t + v) % vDef.variance.length;
        var rawVal = vDef.base + vDef.variance[varIndex];
        var finalVal = isSkipped ? null : (vDef.type === 'Body Temperature' ? parseFloat(rawVal.toFixed(1)) : Math.round(rawVal));

        // Critical patient PT-1007 has elevated heart rate and drop in SpO2 at recent timestamps
        if (patient.id === 'PT-1007' && t < 3 && !isSkipped) {
          if (vDef.type === 'Heart Rate') finalVal = 114 + t * 2;
          if (vDef.type === 'Oxygen Saturation (SpO2)') finalVal = 89 + t;
          if (vDef.type === 'Systolic Blood Pressure') finalVal = 88 - t * 2;
        }

        var obsItem = {
          id: 'OBS-' + obsIdCounter,
          patientId: patient.id,
          patientName: patient.name,
          type: vDef.type,
          value: finalVal, // null for intentionally missing observations
          unit: vDef.unit,
          timestamp: timeEntry.ts,
          status: isSkipped ? 'Missing / Sensor Gap' : 'Recorded',
          source: 'simulated',
          dataQuality: timeEntry.dq || null,
          metadata: {
            sensorModel: 'SyntheticTelemetrySensor-Model-X',
            measurementReliability: isSkipped ? 'Unavailable' : 'High (Simulated)',
            validationStatus: 'Mock Telemetry Feed'
          }
        };

        MOCK_OBSERVATIONS.push(obsItem);
        obsIdCounter++;
      }
    }
  }

  // --- Static Predictions with Feature Attributions (XAI) ---
  var MOCK_PREDICTIONS = [
    {
      id: 'PRED-1001',
      patientId: 'PT-1001',
      targetCondition: 'Simulated Cardiopulmonary Instability Risk',
      riskCategory: 'Low',
      predictedScore: 0.14,
      confidence: 0.91,
      predictionHorizon: '12 Hours',
      modelVersion: 'v1.4.2-sim',
      status: 'Completed',
      generatedAt: '2026-10-15T09:30:00Z',
      source: 'simulated',
      disclaimer: 'Static simulated example for UI testing. Not clinically derived.',
      explanation: {
        available: true,
        summary: 'All vital telemetry parameters remain stable near patient simulated baseline values.',
        features: [
          { feature: 'Heart Rate (Resting Stability)', contribution: 0.08, unit: 'bpm', baseline: 74, observed: 75 },
          { feature: 'Oxygen Saturation (Optimal)', contribution: 0.04, unit: '%', baseline: 98, observed: 97 },
          { feature: 'Systolic Blood Pressure (Normotensive)', contribution: 0.07, unit: 'mmHg', baseline: 120, observed: 122 },
          { feature: 'Respiratory Rate (Eupneic)', contribution: 0.05, unit: 'breaths/min', baseline: 16, observed: 16 }
        ]
      }
    },
    {
      id: 'PRED-1002',
      patientId: 'PT-1002',
      targetCondition: 'Simulated Cardiopulmonary Instability Risk',
      riskCategory: 'Moderate',
      predictedScore: 0.48,
      confidence: 0.86,
      predictionHorizon: '12 Hours',
      modelVersion: 'v1.4.2-sim',
      status: 'Completed',
      generatedAt: '2026-10-15T09:00:00Z',
      source: 'simulated',
      disclaimer: 'Static simulated example for UI testing. Not clinically derived.',
      explanation: null // Intentionally null to test "Explanation not available"
    },
    {
      id: 'PRED-1003',
      patientId: 'PT-1003',
      targetCondition: 'Simulated Sepsis Onset Risk Indicator',
      riskCategory: 'High',
      predictedScore: 0.82,
      confidence: 0.89,
      predictionHorizon: '24 Hours',
      modelVersion: 'v1.4.2-sim',
      status: 'Flagged',
      generatedAt: '2026-10-15T08:00:00Z',
      source: 'simulated',
      disclaimer: 'Static simulated example for UI testing. Not clinically derived.',
      explanation: {
        available: true,
        summary: 'Significant core temperature elevation and tachycardia combined with elevated respiratory rate drive the high-risk score.',
        features: [
          { feature: 'Body Temperature (Hyperthermia)', contribution: 0.38, unit: '°C', baseline: 37.0, observed: 38.6 },
          { feature: 'Heart Rate (Tachycardia)', contribution: 0.28, unit: 'bpm', baseline: 74, observed: 108 },
          { feature: 'Respiratory Rate (Tachypnea)', contribution: 0.22, unit: 'breaths/min', baseline: 16, observed: 25 },
          { feature: 'Systolic Blood Pressure (Drift)', contribution: 0.12, unit: 'mmHg', baseline: 120, observed: 104 }
        ]
      }
    },
    {
      id: 'PRED-1004',
      patientId: 'PT-1004',
      targetCondition: 'Simulated Respiratory Fatigue Risk',
      riskCategory: 'Low',
      predictedScore: 0.19,
      confidence: 0.94,
      predictionHorizon: '6 Hours',
      modelVersion: 'v1.4.2-sim',
      status: 'Completed',
      generatedAt: '2026-10-15T07:30:00Z',
      source: 'simulated',
      disclaimer: 'Static simulated example for UI testing. Not clinically derived.',
      explanation: null // Intentionally null
    },
    {
      id: 'PRED-1005',
      patientId: 'PT-1005',
      targetCondition: 'Simulated Acute Deterioration Score',
      riskCategory: 'Moderate',
      predictedScore: 0.52,
      confidence: 0.83,
      predictionHorizon: '12 Hours',
      modelVersion: 'v1.4.2-sim',
      status: 'Review Requested',
      generatedAt: '2026-10-15T06:00:00Z',
      source: 'simulated',
      disclaimer: 'Static simulated example for UI testing. Not clinically derived.',
      explanation: {
        available: true,
        summary: 'Subtle hemodynamic drift detected across multiple observations.',
        features: [
          { feature: 'Systolic BP Instability', contribution: 0.26, unit: 'mmHg', baseline: 120, observed: 136 },
          { feature: 'Diastolic BP Elevation', contribution: 0.20, unit: 'mmHg', baseline: 78, observed: 88 },
          { feature: 'Heart Rate Variability', contribution: 0.15, unit: 'bpm', baseline: 74, observed: 84 }
        ]
      }
    },
    {
      id: 'PRED-1006',
      patientId: 'PT-1006',
      targetCondition: 'Simulated Post-Operative Hemodynamic Risk',
      riskCategory: 'Low',
      predictedScore: 0.11,
      confidence: 0.95,
      predictionHorizon: '12 Hours',
      modelVersion: 'v1.4.2-sim',
      status: 'Completed',
      generatedAt: '2026-10-15T05:00:00Z',
      source: 'simulated',
      disclaimer: 'Static simulated example for UI testing. Not clinically derived.',
      explanation: null
    },
    {
      id: 'PRED-1007',
      patientId: 'PT-1007',
      targetCondition: 'Simulated Cardiopulmonary Instability Risk',
      riskCategory: 'Critical',
      predictedScore: 0.91,
      confidence: 0.92,
      predictionHorizon: '6 Hours',
      modelVersion: 'v1.4.2-sim',
      status: 'Critical Alert',
      generatedAt: '2026-10-15T08:15:00Z',
      source: 'simulated',
      disclaimer: 'Static simulated example for UI testing. Not clinically derived.',
      explanation: {
        available: true,
        summary: 'Concurrent profound hypoxemia (SpO2 89%) and hypotensive collapse (SBP 88 mmHg) constitute primary risk drivers.',
        features: [
          { feature: 'Oxygen Saturation Decline (Hypoxemia)', contribution: 0.44, unit: '%', baseline: 98, observed: 89 },
          { feature: 'Systolic Blood Pressure Drop (Hypotension)', contribution: 0.32, unit: 'mmHg', baseline: 120, observed: 88 },
          { feature: 'Tachycardia (Compensatory Heart Rate)', contribution: 0.16, unit: 'bpm', baseline: 74, observed: 118 },
          { feature: 'Tachypnea (Respiratory Compensation)', contribution: 0.08, unit: 'breaths/min', baseline: 16, observed: 28 }
        ]
      }
    },
    {
      id: 'PRED-1008',
      patientId: 'PT-1008',
      targetCondition: 'Simulated Sepsis Onset Risk Indicator',
      riskCategory: 'Low',
      predictedScore: 0.22,
      confidence: 0.88,
      predictionHorizon: '24 Hours',
      modelVersion: 'v1.4.2-sim',
      status: 'Completed',
      generatedAt: '2026-10-15T04:00:00Z',
      source: 'simulated',
      disclaimer: 'Static simulated example for UI testing. Not clinically derived.',
      explanation: null
    },
    {
      id: 'PRED-1009',
      patientId: 'PT-1009',
      targetCondition: 'Simulated Cardiopulmonary Instability Risk',
      riskCategory: 'Moderate',
      predictedScore: 0.58,
      confidence: 0.85,
      predictionHorizon: '12 Hours',
      modelVersion: 'v1.4.1-sim',
      status: 'Completed',
      generatedAt: '2026-10-15T03:15:00Z',
      source: 'simulated',
      disclaimer: 'Static simulated example for UI testing. Not clinically derived.',
      explanation: {
        available: true,
        summary: 'Elevated respiratory rate and systolic BP variability contribute to moderate risk profile.',
        features: [
          { feature: 'Respiratory Rate (Moderate Tachypnea)', contribution: 0.32, unit: 'breaths/min', baseline: 16, observed: 22 },
          { feature: 'Systolic BP (Elevated Drift)', contribution: 0.28, unit: 'mmHg', baseline: 120, observed: 138 },
          { feature: 'Heart Rate (Mild Tachycardia)', contribution: 0.18, unit: 'bpm', baseline: 74, observed: 86 }
        ]
      }
    },
    {
      id: 'PRED-1010',
      patientId: 'PT-1010',
      targetCondition: 'Simulated Acute Deterioration Score',
      riskCategory: 'High',
      predictedScore: 0.79,
      confidence: 0.87,
      predictionHorizon: '24 Hours',
      modelVersion: 'v1.4.2-sim',
      status: 'Flagged',
      generatedAt: '2026-10-15T02:00:00Z',
      source: 'simulated',
      disclaimer: 'Static simulated example for UI testing. Not clinically derived.',
      explanation: {
        available: true,
        summary: 'Hypoxemia and elevated core body temperature flag potential acute deterioration.',
        features: [
          { feature: 'Oxygen Saturation Decline (SpO2)', contribution: 0.40, unit: '%', baseline: 98, observed: 91 },
          { feature: 'Body Temperature (Fever Spike)', contribution: 0.30, unit: '°C', baseline: 37.0, observed: 38.4 },
          { feature: 'Heart Rate (Compensatory)', contribution: 0.19, unit: 'bpm', baseline: 74, observed: 98 }
        ]
      }
    },
    {
      id: 'PRED-1011',
      patientId: 'PT-1011',
      targetCondition: 'Simulated Post-Operative Hemodynamic Risk',
      riskCategory: 'Low',
      predictedScore: 0.16,
      confidence: 0.93,
      predictionHorizon: '12 Hours',
      modelVersion: 'v1.3.9-sim',
      status: 'Completed',
      generatedAt: '2026-10-14T23:30:00Z',
      source: 'simulated',
      disclaimer: 'Static simulated example for UI testing. Not clinically derived.',
      explanation: null
    },
    {
      id: 'PRED-1012',
      patientId: 'PT-1012',
      targetCondition: 'Simulated Sepsis Onset Risk Indicator',
      riskCategory: 'Critical',
      predictedScore: 0.94,
      confidence: 0.91,
      predictionHorizon: '6 Hours',
      modelVersion: 'v1.4.2-sim',
      status: 'Critical Alert',
      generatedAt: '2026-10-14T21:00:00Z',
      source: 'simulated',
      disclaimer: 'Static simulated example for UI testing. Not clinically derived.',
      explanation: {
        available: true,
        summary: 'Profound triad of hyperthermia, tachycardia, and severe hypotension detected.',
        features: [
          { feature: 'Systolic Blood Pressure (Hypotension)', contribution: 0.42, unit: 'mmHg', baseline: 120, observed: 82 },
          { feature: 'Heart Rate (Severe Tachycardia)', contribution: 0.31, unit: 'bpm', baseline: 74, observed: 124 },
          { feature: 'Body Temperature (High Hyperthermia)', contribution: 0.22, unit: '°C', baseline: 37.0, observed: 39.2 }
        ]
      }
    },
    {
      id: 'PRED-1013',
      patientId: 'PT-1013',
      targetCondition: 'Simulated Respiratory Fatigue Risk',
      riskCategory: 'Moderate',
      predictedScore: 0.44,
      confidence: 0.86,
      predictionHorizon: '6 Hours',
      modelVersion: 'v1.4.1-sim',
      status: 'Completed',
      generatedAt: '2026-10-14T18:00:00Z',
      source: 'simulated',
      disclaimer: 'Static simulated example for UI testing. Not clinically derived.',
      explanation: null
    },
    {
      id: 'PRED-1014',
      patientId: 'PT-1014',
      targetCondition: 'Simulated Cardiopulmonary Instability Risk',
      riskCategory: 'Low',
      predictedScore: 0.09,
      confidence: 0.96,
      predictionHorizon: '48 Hours',
      modelVersion: 'v1.3.9-sim',
      status: 'Completed',
      generatedAt: '2026-10-14T15:00:00Z',
      source: 'simulated',
      disclaimer: 'Static simulated example for UI testing. Not clinically derived.',
      explanation: {
        available: true,
        summary: 'Hemodynamic indices remain fully compliant with baseline physiological parameters.',
        features: [
          { feature: 'Heart Rate Normality', contribution: 0.05, unit: 'bpm', baseline: 74, observed: 73 },
          { feature: 'Normotensive SBP', contribution: 0.04, unit: 'mmHg', baseline: 120, observed: 119 }
        ]
      }
    }
  ];

  // --- Static Alerts ---
  var MOCK_ALERTS = [
    {
      id: 'ALERT-1001',
      patientId: 'PT-1007',
      severity: 'Critical',
      title: 'Simulated Elevated Risk Threshold',
      message: 'Synthetic telemetry indicates acute deterioration index exceeding critical threshold.',
      status: 'Active',
      createdAt: '2026-10-15T08:15:00Z',
      acknowledgedBy: null,
      resolvedBy: null,
      updatedAt: null,
      source: 'simulated',
      metadata: { mockRuleId: 'RULE-SIM-09', protocol: 'Standard Simulated Response' }
    },
    {
      id: 'ALERT-1002',
      patientId: 'PT-1003',
      severity: 'High',
      title: 'Simulated Sepsis Marker Alert',
      message: 'Synthetic multi-parameter test pattern triggered simulated sepsis notification.',
      status: 'Active',
      createdAt: '2026-10-15T07:45:00Z',
      acknowledgedBy: null,
      resolvedBy: null,
      updatedAt: null,
      source: 'simulated',
      metadata: { mockRuleId: 'RULE-SIM-04', protocol: 'Standard Simulated Response' }
    },
    {
      id: 'ALERT-1003',
      patientId: 'PT-1005',
      severity: 'Warning',
      title: 'Simulated Moderate Trend Drift',
      message: 'Observation baseline shift detected in synthetic dataset.',
      status: 'Acknowledged',
      createdAt: '2026-10-14T22:10:00Z',
      acknowledgedBy: 'Nurse Marcus Vance (Simulated Staff)',
      resolvedBy: null,
      updatedAt: '2026-10-14T22:12:00Z',
      source: 'simulated',
      metadata: { mockRuleId: 'RULE-SIM-02', protocol: 'Standard Simulated Response' }
    },
    {
      id: 'ALERT-1004',
      patientId: 'PT-1002',
      severity: 'Info',
      title: 'Telemetry Sensor Calibrated',
      message: 'Simulated sensor hardware calibration successfully verified.',
      status: 'Resolved',
      createdAt: '2026-10-14T14:00:00Z',
      acknowledgedBy: 'System Service Account (Simulated)',
      resolvedBy: 'System Service Account (Simulated)',
      updatedAt: '2026-10-14T14:02:00Z',
      source: 'simulated',
      metadata: { mockRuleId: 'RULE-SIM-01', protocol: 'Hardware Diagnostic' }
    },
    {
      id: 'ALERT-1005',
      patientId: 'PT-1010',
      severity: 'High',
      title: 'Simulated SpO2 Desaturation Warning',
      message: 'Simulated oxygen saturation dropped below 92% across consecutive observations.',
      status: 'Active',
      createdAt: '2026-10-15T02:05:00Z',
      acknowledgedBy: null,
      resolvedBy: null,
      updatedAt: null,
      source: 'simulated',
      metadata: { mockRuleId: 'RULE-SIM-06', protocol: 'Respiratory Step-Down Protocol' }
    },
    {
      id: 'ALERT-1006',
      patientId: 'PT-1012',
      severity: 'Critical',
      title: 'Simulated Hypotensive Shock Risk',
      message: 'Simulated systolic BP fell below 85 mmHg with concurrent tachycardia.',
      status: 'Active',
      createdAt: '2026-10-14T21:05:00Z',
      acknowledgedBy: null,
      resolvedBy: null,
      updatedAt: null,
      source: 'simulated',
      metadata: { mockRuleId: 'RULE-SIM-08', protocol: 'Rapid Response Team Alert' }
    },
    {
      id: 'ALERT-1007',
      patientId: 'PT-1009',
      severity: 'Warning',
      title: 'Simulated Tachypnea Event',
      message: 'Synthetic respiratory rate sustained at 24 breaths/min over 30 min window.',
      status: 'Acknowledged',
      createdAt: '2026-10-14T19:30:00Z',
      acknowledgedBy: 'Nurse Marcus Vance (Simulated Staff)',
      resolvedBy: null,
      updatedAt: '2026-10-14T19:40:00Z',
      source: 'simulated',
      metadata: { mockRuleId: 'RULE-SIM-03', protocol: 'Telemetry Bedside Check' }
    },
    {
      id: 'ALERT-1008',
      patientId: 'PT-1001',
      severity: 'Info',
      title: 'Baseline Telemetry Calibrated',
      message: 'Synthetic multi-channel telemetry sensor sync verified without packet drop.',
      status: 'Resolved',
      createdAt: '2026-10-14T16:20:00Z',
      acknowledgedBy: 'System Service Account (Simulated)',
      resolvedBy: 'System Service Account (Simulated)',
      updatedAt: '2026-10-14T16:25:00Z',
      source: 'simulated',
      metadata: { mockRuleId: 'RULE-SIM-01', protocol: 'Hardware Diagnostic' }
    },
    {
      id: 'ALERT-1009',
      patientId: 'PT-1004',
      severity: 'Warning',
      title: 'Simulated Arrhythmia Pattern',
      message: 'Synthetic telemetry detected transient irregularity in resting interval.',
      status: 'Active',
      createdAt: '2026-10-14T13:45:00Z',
      acknowledgedBy: null,
      resolvedBy: null,
      updatedAt: null,
      source: 'simulated',
      metadata: { mockRuleId: 'RULE-SIM-05', protocol: 'Cardiology Telemetry Review' }
    },
    {
      id: 'ALERT-1010',
      patientId: 'PT-1008',
      severity: 'Info',
      title: 'Scheduled Battery Exchange',
      message: 'Simulated wearable telemetry monitor battery replacement cycle completed.',
      status: 'Resolved',
      createdAt: '2026-10-14T11:00:00Z',
      acknowledgedBy: 'Nurse Marcus Vance (Simulated Staff)',
      resolvedBy: 'Dr. Evelyn Carter (Simulated Admin)',
      updatedAt: '2026-10-14T11:15:00Z',
      source: 'simulated',
      metadata: { mockRuleId: 'RULE-SIM-11', protocol: 'Preventive Maintenance' }
    },
    {
      id: 'ALERT-1011',
      patientId: 'PT-1011',
      severity: 'High',
      title: 'Simulated Post-Op Temperature Rise',
      message: 'Post-surgical telemetry indicates febrile trajectory exceeding 38.3 °C.',
      status: 'Acknowledged',
      createdAt: '2026-10-14T09:15:00Z',
      acknowledgedBy: 'Dr. Evelyn Carter (Simulated Admin)',
      resolvedBy: null,
      updatedAt: '2026-10-14T09:30:00Z',
      source: 'simulated',
      metadata: { mockRuleId: 'RULE-SIM-07', protocol: 'Post-Surgical Infectious Watch' }
    },
    {
      id: 'ALERT-1012',
      patientId: 'PT-1006',
      severity: 'Warning',
      title: 'Sensor Electrode Displacement',
      message: 'Transient electrode impedance increase detected on simulated chest lead.',
      status: 'Resolved',
      createdAt: '2026-10-14T07:30:00Z',
      acknowledgedBy: 'Dr. Julian Ross (Simulated Attending)',
      resolvedBy: 'Dr. Julian Ross (Simulated Attending)',
      updatedAt: '2026-10-14T07:45:00Z',
      source: 'simulated',
      metadata: { mockRuleId: 'RULE-SIM-10', protocol: 'Electrode Reapplication' }
    }
  ];

  // Restore persisted mock alerts from sessionStorage if present in current browser session
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      var savedAlerts = window.sessionStorage.getItem('vitalguard_mock_alerts');
      if (savedAlerts) {
        var parsedAlerts = JSON.parse(savedAlerts);
        if (Array.isArray(parsedAlerts) && parsedAlerts.length > 0) {
          MOCK_ALERTS = parsedAlerts;
        }
      }
    }
  } catch (storageAlertErr) {}

  /**
   * Helper to persist modified mock alerts to sessionStorage for the current browser session.
   */
  function saveAlertsToSession() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('vitalguard_mock_alerts', JSON.stringify(MOCK_ALERTS));
      }
    } catch (saveAlertErr) {}
  }

  // --- Static Audit Logs ---
  var MOCK_AUDIT_LOGS = [
    {
      id: 'LOG-1001',
      actor: 'admin@demo.vitalguard.test',
      action: 'USER_AUTHENTICATION_SUCCESS',
      category: 'Security',
      ipAddress: '127.0.0.1 (Localhost)',
      timestamp: '2026-10-15T08:30:00Z',
      details: 'Administrator session initiated via simulated credential provider.',
      source: 'simulated',
      metadata: { authMethod: 'Password', role: 'System Administrator' }
    },
    {
      id: 'LOG-1002',
      actor: 'staff@demo.vitalguard.test',
      action: 'ALERT_STATUS_ACKNOWLEDGED',
      category: 'Clinical Operation',
      ipAddress: '127.0.0.1 (Localhost)',
      timestamp: '2026-10-14T22:12:00Z',
      details: 'Alert ALERT-1003 status transitioned to Acknowledged by staff.',
      source: 'simulated',
      metadata: { alertId: 'ALERT-1003', patientId: 'PT-1005' }
    },
    {
      id: 'LOG-1003',
      actor: 'system.daemon@demo.vitalguard.test',
      action: 'SYSTEM_CONFIG_VERIFIED',
      category: 'System Health',
      ipAddress: '127.0.0.1 (Localhost)',
      timestamp: '2026-10-14T00:00:00Z',
      details: 'Simulated storage and memory integrity checks passed.',
      source: 'simulated',
      metadata: { memoryAllocated: '248MB', checkPassed: true }
    },
    {
      id: 'LOG-1004',
      actor: 'reviewer@demo.vitalguard.test',
      action: 'AUDIT_TRAIL_EXPORT_VIEWED',
      category: 'Compliance Audit',
      ipAddress: '127.0.0.1 (Localhost)',
      timestamp: '2026-10-13T15:20:00Z',
      details: 'Simulated monthly regulatory log view accessed.',
      source: 'simulated',
      metadata: { exportPeriod: '2026-09', recordCount: 120 }
    },
    {
      id: 'LOG-1005',
      actor: 'staff@demo.vitalguard.test',
      action: 'USER_AUTHENTICATION_SUCCESS',
      category: 'Security',
      ipAddress: '127.0.0.1 (Localhost)',
      timestamp: '2026-10-15T09:12:00Z',
      details: 'Healthcare Staff session initiated successfully.',
      source: 'simulated',
      metadata: { authMethod: 'Password', role: 'Authorized Healthcare Staff' }
    },
    {
      id: 'LOG-1006',
      actor: 'system.daemon@demo.vitalguard.test',
      action: 'ALERT_TRIGGERED_CRITICAL',
      category: 'Clinical Operation',
      ipAddress: '127.0.0.1 (Localhost)',
      timestamp: '2026-10-15T08:15:30Z',
      details: 'Deterioration rule RULE-SIM-09 triggered Critical Alert ALERT-1001 for PT-1007.',
      source: 'simulated',
      metadata: { alertId: 'ALERT-1001', score: 0.91 }
    },
    {
      id: 'LOG-1007',
      actor: 'system.daemon@demo.vitalguard.test',
      action: 'ALERT_TRIGGERED_HIGH',
      category: 'Clinical Operation',
      ipAddress: '127.0.0.1 (Localhost)',
      timestamp: '2026-10-15T07:45:00Z',
      details: 'Deterioration rule RULE-SIM-04 triggered High Alert ALERT-1002 for PT-1003.',
      source: 'simulated',
      metadata: { alertId: 'ALERT-1002', score: 0.82 }
    },
    {
      id: 'LOG-1008',
      actor: 'admin@demo.vitalguard.test',
      action: 'PATIENT_RECORD_ACCESSED',
      category: 'Clinical Operation',
      ipAddress: '127.0.0.1 (Localhost)',
      timestamp: '2026-10-15T06:30:00Z',
      details: 'Patient PT-1007 telemetry history viewed in clinical dashboard.',
      source: 'simulated',
      metadata: { patientId: 'PT-1007', section: 'Telemetry' }
    },
    {
      id: 'LOG-1009',
      actor: 'staff@demo.vitalguard.test',
      action: 'ALERT_STATUS_RESOLVED',
      category: 'Clinical Operation',
      ipAddress: '127.0.0.1 (Localhost)',
      timestamp: '2026-10-14T21:10:00Z',
      details: 'Alert ALERT-1004 status transitioned to Resolved following calibration.',
      source: 'simulated',
      metadata: { alertId: 'ALERT-1004' }
    },
    {
      id: 'LOG-1010',
      actor: 'admin@demo.vitalguard.test',
      action: 'USER_ROLE_MODIFIED',
      category: 'Security',
      ipAddress: '127.0.0.1 (Localhost)',
      timestamp: '2026-10-14T18:00:00Z',
      details: 'Role assignment updated for user USR-1004 to Authorized Healthcare Staff.',
      source: 'simulated',
      metadata: { targetUserId: 'USR-1004', newRole: 'Authorized Healthcare Staff' }
    },
    {
      id: 'LOG-1011',
      actor: 'reviewer@demo.vitalguard.test',
      action: 'USER_AUTHENTICATION_SUCCESS',
      category: 'Security',
      ipAddress: '127.0.0.1 (Localhost)',
      timestamp: '2026-10-14T16:45:00Z',
      details: 'Read-only Reviewer session initiated via credentials.',
      source: 'simulated',
      metadata: { authMethod: 'Password', role: 'Read-only Reviewer' }
    },
    {
      id: 'LOG-1012',
      actor: 'system.daemon@demo.vitalguard.test',
      action: 'MODEL_INFERENCE_BATCH_COMPLETED',
      category: 'System Health',
      ipAddress: '127.0.0.1 (Localhost)',
      timestamp: '2026-10-14T12:05:00Z',
      details: 'Batch deterioration scoring cycle completed for 25 synthetic subjects.',
      source: 'simulated',
      metadata: { batchSize: 25, modelVersion: 'v1.4.2-sim', durationMs: 42 }
    },
    {
      id: 'LOG-1013',
      actor: 'admin@demo.vitalguard.test',
      action: 'REPORT_GENERATED',
      category: 'Compliance Audit',
      ipAddress: '127.0.0.1 (Localhost)',
      timestamp: '2026-10-14T11:15:00Z',
      details: 'Synthetic Patient Cohort Summary report generated and archived.',
      source: 'simulated',
      metadata: { reportId: 'REP-1001', format: 'PDF' }
    },
    {
      id: 'LOG-1014',
      actor: 'reviewer@demo.vitalguard.test',
      action: 'MODEL_EXPLAINABILITY_EXPORTED',
      category: 'Compliance Audit',
      ipAddress: '127.0.0.1 (Localhost)',
      timestamp: '2026-10-13T10:00:00Z',
      details: 'SHAP feature contribution summary downloaded for validation review.',
      source: 'simulated',
      metadata: { predictionId: 'PRED-1003' }
    },
    {
      id: 'LOG-1015',
      actor: 'admin@demo.vitalguard.test',
      action: 'USER_ACCOUNT_DEACTIVATED',
      category: 'Security',
      ipAddress: '127.0.0.1 (Localhost)',
      timestamp: '2026-10-12T09:30:00Z',
      details: 'User account USR-1010 deactivated per compliance protocol.',
      source: 'simulated',
      metadata: { targetUserId: 'USR-1010', reason: 'Role transition' }
    },
    {
      id: 'LOG-1016',
      actor: 'system.daemon@demo.vitalguard.test',
      action: 'SENSOR_TELEMETRY_SYNC',
      category: 'System Health',
      ipAddress: '127.0.0.1 (Localhost)',
      timestamp: '2026-10-11T14:20:00Z',
      details: 'Telemetry synchronization verified across 25 telemetry streams without packet corruption.',
      source: 'simulated',
      metadata: { streamCount: 25, packetsReceived: 150 }
    }
  ];

  // --- Static Reports ---
  var MOCK_REPORTS = [
    {
      id: 'REP-1001',
      title: 'Synthetic Patient Cohort Summary - Q3 2026',
      type: 'Cohort Summary',
      generatedDate: '2026-10-01T00:00:00Z',
      status: 'Archived',
      format: 'PDF',
      period: 'Q3 2026 (July - September)',
      recordCount: '25 Monitored Records',
      size: '1.8 MB',
      generatedBy: 'Dr. Evelyn Carter (Simulated Admin)',
      description: 'Quarterly aggregate synthesis of patient admission trends, demographic breakdown, and ward occupancy metrics across synthetic cohorts.',
      source: 'simulated'
    },
    {
      id: 'REP-1002',
      title: 'Simulated Telemetry Ingestion Reliability Audit',
      type: 'Telemetry Audit',
      generatedDate: '2026-10-10T12:00:00Z',
      status: 'Completed',
      format: 'CSV',
      period: 'Last 30 Days (Sep 11 - Oct 10)',
      recordCount: '150 Telemetry Observations',
      size: '42 KB',
      generatedBy: 'system.daemon@demo.vitalguard.test',
      description: 'Sensor packet integrity check, measurement latency distribution, and frequency of simulated sensor gaps across all monitored beds.',
      source: 'simulated'
    },
    {
      id: 'REP-1003',
      title: 'Deterioration Model Sensitivity & Explainability Benchmark',
      type: 'Model Performance',
      generatedDate: '2026-10-12T14:30:00Z',
      status: 'Completed',
      format: 'PDF',
      period: 'Academic Validation Run 4B',
      recordCount: '14 Prediction Inferences',
      size: '2.4 MB',
      generatedBy: 'Dr. Alan Turing (Simulated Research PI)',
      description: 'Evaluation of simulated XGBoost deterioration model sensitivity, SHAP feature importance distribution, and false-positive triage rates.',
      source: 'simulated'
    },
    {
      id: 'REP-1004',
      title: 'Critical Ward Deterioration Incident Log - October W1',
      type: 'Alert Incident Analysis',
      generatedDate: '2026-10-08T09:00:00Z',
      status: 'Completed',
      format: 'CSV',
      period: '2026-10-01 to 2026-10-07',
      recordCount: '12 Alert Events',
      size: '38 KB',
      generatedBy: 'Nurse Marcus Vance (Simulated Staff)',
      description: 'Comprehensive incident retrospective of all critical and high severity early deterioration alarms triggered within Medical ICU and CCU.',
      source: 'simulated'
    },
    {
      id: 'REP-1005',
      title: 'Clinical Governance & Privacy Compliance Audit',
      type: 'Compliance Summary',
      generatedDate: '2026-10-14T17:00:00Z',
      status: 'Completed',
      format: 'PDF',
      period: 'Fiscal Year 2026 H2',
      recordCount: 'Full Audit Trail (16 Events)',
      size: '3.1 MB',
      generatedBy: 'Auditor Sarah Lin (Simulated Reviewer)',
      description: 'Formal assessment verifying that all prototype records remain 100% synthetic, unlinked to real PHI, and compliant with academic research protocols.',
      source: 'simulated'
    },
    {
      id: 'REP-1006',
      title: 'High-Risk Cardiopulmonary Trend Synopsis',
      type: 'Cohort Summary',
      generatedDate: '2026-10-15T06:00:00Z',
      status: 'Completed',
      format: 'CSV',
      period: 'Last 24 Hours',
      recordCount: '8 Target Patients',
      size: '18 KB',
      generatedBy: 'Dr. Julian Ross (Simulated Attending)',
      description: 'Filtered vital trajectory snapshot focusing exclusively on subjects exhibiting moderate to critical cardiopulmonary instability scores.',
      source: 'simulated'
    },
    {
      id: 'REP-1007',
      title: 'Telemetry Hardware Sensor Diagnostic Report',
      type: 'Telemetry Audit',
      generatedDate: '2026-10-14T02:00:00Z',
      status: 'Archived',
      format: 'PDF',
      period: '2026-10-01 to 2026-10-14',
      recordCount: '25 Sensor Channels',
      size: '940 KB',
      generatedBy: 'system.daemon@demo.vitalguard.test',
      description: 'Hardware diagnostic summary reporting sensor battery cycles, impedance fluctuations, and motion artifact prevalence.',
      source: 'simulated'
    },
    {
      id: 'REP-1008',
      title: 'Alert Response Time & Acknowledgment Audit',
      type: 'Alert Incident Analysis',
      generatedDate: '2026-10-15T10:15:00Z',
      status: 'Completed',
      format: 'CSV',
      period: 'Last 7 Days',
      recordCount: '12 Incident Records',
      size: '24 KB',
      generatedBy: 'Auditor Sarah Lin (Simulated Reviewer)',
      description: 'Analysis of mean time to acknowledgment (MTTA) and resolution intervals for acute patient deterioration notifications.',
      source: 'simulated'
    }
  ];

  // Restore persisted mock reports from sessionStorage if present
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      var savedReports = window.sessionStorage.getItem('vitalguard_mock_reports');
      if (savedReports) {
        var parsedReports = JSON.parse(savedReports);
        if (Array.isArray(parsedReports) && parsedReports.length > 0) {
          MOCK_REPORTS = parsedReports;
        }
      }
    }
  } catch (storageReportErr) {}

  /**
   * Helper to persist modified mock reports to sessionStorage for the current browser session.
   */
  function saveReportsToSession() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('vitalguard_mock_reports', JSON.stringify(MOCK_REPORTS));
      }
    } catch (saveReportErr) {}
  }

  /**
   * Safe identifier path matcher helper.
   * Matches `/path/{id}` patterns and extracts ID parameter.
   */
  function matchEndpointWithId(routeTemplate, actualPath) {
    var regexPattern = '^' + routeTemplate.replace('{id}', '([a-zA-Z0-9_-]+)') + '$';
    var match = actualPath.match(new RegExp(regexPattern));
    if (match && match[1]) {
      return match[1];
    }
    return null;
  }

  /**
   * Central Mock Request Router
   * Simulates backend routing, query param parsing, sorting, filtering,
   * pagination, status codes, and JSON response bodies.
   */
  function handleMockRequest(endpoint, options) {
    options = options || {};
    var method = (options.method || 'GET').toUpperCase();

    // Parse endpoint into clean path and query parameters
    var urlParts = endpoint.split('?');
    var path = urlParts[0];
    var queryString = urlParts[1] || '';
    var params = {};

    if (queryString) {
      var pairs = queryString.split('&');
      for (var pi = 0; pi < pairs.length; pi++) {
        var pair = pairs[pi].split('=');
        if (pair[0]) {
          var key = decodeURIComponent(pair[0].replace(/\+/g, ' '));
          var val = decodeURIComponent((pair[1] || '').replace(/\+/g, ' '));
          params[key] = val;
        }
      }
    }

    return new Promise(function (resolve) {
      var delay = 80;

      setTimeout(function () {
        // -------------------------------------------------------------
        // 1. POST /auth/login
        // -------------------------------------------------------------
        if (path === '/auth/login' && method === 'POST') {
          var payload = options.body;
          if (typeof payload === 'string') {
            try { payload = JSON.parse(payload); } catch (e) {
              return resolve({ ok: false, data: null, error: 'Invalid JSON request payload.', status: 400 });
            }
          }

          if (!payload || !payload.email || !payload.password) {
            return resolve({ ok: false, data: null, error: 'Email and password are required.', status: 400 });
          }

          var email = String(payload.email).trim().toLowerCase();
          var password = String(payload.password);

          var foundCred = null;
          if (window.VitalGuardConfig && window.VitalGuardConfig.DEMO_CREDENTIALS) {
            for (var c = 0; c < window.VitalGuardConfig.DEMO_CREDENTIALS.length; c++) {
              var cred = window.VitalGuardConfig.DEMO_CREDENTIALS[c];
              if (cred.email.toLowerCase() === email && cred.password === password) {
                foundCred = cred;
                break;
              }
            }
          }

          if (foundCred) {
            var matchedUser = null;
            for (var u = 0; u < MOCK_USERS.length; u++) {
              if (MOCK_USERS[u].email.toLowerCase() === email) {
                matchedUser = MOCK_USERS[u];
                break;
              }
            }

            if (!matchedUser) {
              matchedUser = {
                id: 'USR-TEMP',
                name: foundCred.role + ' (Simulated)',
                email: foundCred.email,
                role: foundCred.role,
                department: 'Clinical Administration',
                status: 'Active',
                source: 'simulated'
              };
            }

            return resolve({
              ok: true,
              data: {
                user: {
                  id: matchedUser.id,
                  name: matchedUser.name,
                  email: matchedUser.email,
                  role: matchedUser.role,
                  department: matchedUser.department,
                  source: matchedUser.source
                },
                token: 'simulated-demo-session-token-' + Date.now(),
                expiresIn: 3600,
                sessionType: 'frontend-demo-simulation'
              },
              error: null,
              status: 200
            });
          } else {
            return resolve({
              ok: false,
              data: null,
              error: 'Invalid email address or password provided.',
              status: 401
            });
          }
        }

        // -------------------------------------------------------------
        // 2. GET /users/me
        // -------------------------------------------------------------
        if (path === '/users/me' && method === 'GET') {
          return resolve({ ok: true, data: MOCK_USERS[0], error: null, status: 200 });
        }

        // -------------------------------------------------------------
        // 3. GET /admin/dashboard
        // -------------------------------------------------------------
        if (path === '/admin/dashboard' && method === 'GET') {
          var activeCount = 0;
          for (var pIdx = 0; pIdx < MOCK_PATIENTS.length; pIdx++) {
            if (MOCK_PATIENTS[pIdx].status === 'Active Monitoring') activeCount++;
          }
          return resolve({
            ok: true,
            data: {
              totalPatients: MOCK_PATIENTS.length,
              activeMonitoring: activeCount,
              dischargedPatients: MOCK_PATIENTS.length - activeCount,
              totalObservations: MOCK_OBSERVATIONS.length,
              activeAlerts: 2,
              criticalAlerts: 1,
              systemStatus: 'Operational (Simulated Mode)',
              source: 'simulated',
              lastSync: '2026-10-15T11:30:00Z'
            },
            error: null,
            status: 200
          });
        }

        // -------------------------------------------------------------
        // 4. GET /admin/patients (Query params: q, status, alertState, sortBy, sortDir, page, pageSize)
        // -------------------------------------------------------------
        if (path === '/admin/patients' && method === 'GET') {
          var q = (params.q || '').trim().toLowerCase();
          var filterStatus = params.status || 'all';
          var filterAlert = params.alertState || 'all';
          var sortBy = params.sortBy || 'id';
          var sortDir = (params.sortDir || 'asc').toLowerCase();
          var page = Math.max(1, parseInt(params.page, 10) || 1);
          var pageSize = Math.max(1, parseInt(params.pageSize, 10) || 10);

          // 1. Filter
          var filtered = MOCK_PATIENTS.filter(function (patient) {
            // Text search (ID or Name)
            if (q) {
              var matchId = patient.id.toLowerCase().indexOf(q) !== -1;
              var matchName = patient.name.toLowerCase().indexOf(q) !== -1;
              if (!matchId && !matchName) return false;
            }

            // Record status filter
            if (filterStatus !== 'all' && filterStatus !== '') {
              if (patient.status.toLowerCase() !== filterStatus.toLowerCase()) {
                return false;
              }
            }

            // Alert status filter
            if (filterAlert !== 'all' && filterAlert !== '') {
              if (patient.alertStatus.toLowerCase() !== filterAlert.toLowerCase()) {
                return false;
              }
            }

            return true;
          });

          // 2. Sort
          filtered.sort(function (a, b) {
            var valA = a[sortBy];
            var valB = b[sortBy];

            if (sortBy === 'id') {
              valA = parseInt(a.id.replace(/\D/g, ''), 10) || a.id;
              valB = parseInt(b.id.replace(/\D/g, ''), 10) || b.id;
            } else if (sortBy === 'name') {
              valA = (a.name || '').toLowerCase();
              valB = (b.name || '').toLowerCase();
            } else if (sortBy === 'age') {
              valA = Number(a.age) || 0;
              valB = Number(b.age) || 0;
            } else if (sortBy === 'registrationDate' || sortBy === 'admissionDate') {
              valA = new Date(a.registrationDate || a.admissionDate).getTime();
              valB = new Date(b.registrationDate || b.admissionDate).getTime();
            } else if (sortBy === 'latestObservationTime' || sortBy === 'latestObservation') {
              valA = new Date(a.latestObservationTime || 0).getTime();
              valB = new Date(b.latestObservationTime || 0).getTime();
            } else if (sortBy === 'latestPredictionStatus' || sortBy === 'riskCategory') {
              valA = (a.latestPredictionStatus || '').toLowerCase();
              valB = (b.latestPredictionStatus || '').toLowerCase();
            } else if (sortBy === 'alertStatus') {
              valA = (a.alertStatus || '').toLowerCase();
              valB = (b.alertStatus || '').toLowerCase();
            } else if (sortBy === 'status') {
              valA = (a.status || '').toLowerCase();
              valB = (b.status || '').toLowerCase();
            }

            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
          });

          // 3. Paginate
          var total = filtered.length;
          var startIndex = (page - 1) * pageSize;
          var pagedItems = filtered.slice(startIndex, startIndex + pageSize);

          return resolve({
            ok: true,
            data: {
              items: pagedItems,
              page: page,
              pageSize: pageSize,
              total: total,
              source: 'simulated'
            },
            error: null,
            status: 200
          });
        }

        // -------------------------------------------------------------
        // 5. POST /admin/patients (Add Patient)
        // -------------------------------------------------------------
        if (path === '/admin/patients' && method === 'POST') {
          var createBody = options.body;
          if (typeof createBody === 'string') {
            try { createBody = JSON.parse(createBody); } catch (e) {
              return resolve({ ok: false, data: null, error: 'Invalid JSON request payload.', status: 400 });
            }
          }
          createBody = createBody || {};

          // Field validation
          var name = (createBody.name || '').trim();
          var age = parseInt(createBody.age, 10);
          var gender = createBody.gender || 'Not specified';
          var department = createBody.department || 'General Observation (Simulated)';

          if (!name) {
            return resolve({ ok: false, data: null, error: 'Display name is required.', status: 400 });
          }
          if (name.length > 60) {
            return resolve({ ok: false, data: null, error: 'Display name must not exceed 60 characters.', status: 400 });
          }
          if (isNaN(age) || age < 0 || age > 120) {
            return resolve({ ok: false, data: null, error: 'Valid age between 0 and 120 is required.', status: 400 });
          }

          var maxIdNum = 1000;
          for (var pIdx = 0; pIdx < MOCK_PATIENTS.length; pIdx++) {
            var parsedNum = parseInt(String(MOCK_PATIENTS[pIdx].id).replace(/\D/g, ''), 10);
            if (!isNaN(parsedNum) && parsedNum > maxIdNum) {
              maxIdNum = parsedNum;
            }
          }
          var newId = 'PT-' + (maxIdNum + 1);
          var nowIso = new Date().toISOString();

          var newPatient = {
            id: newId,
            name: name,
            age: age,
            gender: gender,
            department: department,
            room: 'Room-S' + (maxIdNum + 1 - 900),
            admissionDate: nowIso,
            registrationDate: nowIso,
            createdAt: nowIso,
            updatedAt: nowIso,
            latestObservationTime: nowIso,
            latestPredictionStatus: 'Not Assessed',
            alertStatus: 'No Alerts',
            status: 'Active Monitoring',
            source: 'simulated',
            metadata: {
              dataset: 'VitalGuard-Synthetic-Cohort-V1',
              clinicalValidation: 'None (Academic Mock Data)',
              isSimulated: true,
              mockSessionCreated: true
            }
          };

          // In mock mode, mutations are saved to session array and sessionStorage
          MOCK_PATIENTS.unshift(newPatient);
          savePatientsToSession();

          return resolve({
            ok: true,
            data: newPatient,
            error: null,
            status: 201
          });
        }

        // -------------------------------------------------------------
        // 6. GET /admin/patients/{id}
        // -------------------------------------------------------------
        var patientId = matchEndpointWithId('/admin/patients/{id}', path);
        if (patientId && method === 'GET') {
          var foundPatient = null;
          for (var pi = 0; pi < MOCK_PATIENTS.length; pi++) {
            if (MOCK_PATIENTS[pi].id.toUpperCase() === patientId.toUpperCase()) {
              foundPatient = MOCK_PATIENTS[pi];
              break;
            }
          }
          if (foundPatient) {
            return resolve({
              ok: true,
              data: foundPatient,
              error: null,
              status: 200
            });
          } else {
            return resolve({
              ok: false,
              data: null,
              error: 'Simulated patient record with identifier "' + patientId + '" was not found.',
              status: 404
            });
          }
        }

        // -------------------------------------------------------------
        // 7. PATCH /admin/patients/{id} (Edit or Deactivate Patient)
        // -------------------------------------------------------------
        if (patientId && method === 'PATCH') {
          var editPatient = null;
          for (var ep = 0; ep < MOCK_PATIENTS.length; ep++) {
            if (MOCK_PATIENTS[ep].id.toUpperCase() === patientId.toUpperCase()) {
              editPatient = MOCK_PATIENTS[ep];
              break;
            }
          }

          if (!editPatient) {
            return resolve({
              ok: false,
              data: null,
              error: 'Simulated patient record with identifier "' + patientId + '" was not found.',
              status: 404
            });
          }

          var patchBody = options.body || {};
          if (typeof patchBody === 'string') {
            try { patchBody = JSON.parse(patchBody); } catch (e) {
              return resolve({ ok: false, data: null, error: 'Invalid JSON request payload.', status: 400 });
            }
          }

          // Permit editing only authorized non-sensitive profile fields
          if (patchBody.name !== undefined) {
            var updatedName = String(patchBody.name).trim();
            if (!updatedName) {
              return resolve({ ok: false, data: null, error: 'Display name cannot be empty.', status: 400 });
            }
            if (updatedName.length > 60) {
              return resolve({ ok: false, data: null, error: 'Display name must not exceed 60 characters.', status: 400 });
            }
            editPatient.name = updatedName;
          }

          if (patchBody.age !== undefined) {
            var updatedAge = parseInt(patchBody.age, 10);
            if (isNaN(updatedAge) || updatedAge < 0 || updatedAge > 120) {
              return resolve({ ok: false, data: null, error: 'Valid age between 0 and 120 is required.', status: 400 });
            }
            editPatient.age = updatedAge;
          }

          if (patchBody.gender !== undefined) {
            editPatient.gender = patchBody.gender;
          }

          if (patchBody.department !== undefined) {
            editPatient.department = patchBody.department;
          }

          if (patchBody.room !== undefined) {
            editPatient.room = patchBody.room;
          }

          if (patchBody.status !== undefined) {
            editPatient.status = patchBody.status;
          }

          editPatient.updatedAt = new Date().toISOString();
          savePatientsToSession();

          return resolve({
            ok: true,
            data: editPatient,
            error: null,
            status: 200
          });
        }

        // -------------------------------------------------------------
        // 8. GET /admin/observations (Query params: q, patientId, from, to, type, status, sortBy, sortDir, page, pageSize)
        // -------------------------------------------------------------
        var obsDetailId = matchEndpointWithId('/admin/observations/{id}', path);

        if ((path === '/admin/observations' || obsDetailId) && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
          return resolve({
            ok: false,
            data: null,
            error: 'Telemetry observation logs are continuous read-only sensor recordings in this prototype (Method Not Allowed).',
            status: 405
          });
        }

        if (obsDetailId && method === 'GET') {
          var foundObs = null;
          for (var oi = 0; oi < MOCK_OBSERVATIONS.length; oi++) {
            if (MOCK_OBSERVATIONS[oi].id.toUpperCase() === obsDetailId.toUpperCase()) {
              foundObs = MOCK_OBSERVATIONS[oi];
              break;
            }
          }
          if (foundObs) {
            return resolve({
              ok: true,
              data: foundObs,
              error: null,
              status: 200
            });
          } else {
            return resolve({
              ok: false,
              data: null,
              error: 'Simulated observation record with identifier "' + obsDetailId + '" was not found.',
              status: 404
            });
          }
        }

        if (path === '/admin/observations' && method === 'GET') {
          var obsPatientId = params.patientId;
          var obsQ = (params.q || '').trim().toLowerCase();
          var fromDate = params.from ? new Date(params.from) : null;
          var toDate = params.to ? new Date(params.to) : null;
          var vitalType = params.type;
          var obsStatus = params.status;

          var sortBy = params.sortBy || 'timestamp';
          var sortDir = (params.sortDir || 'desc').toLowerCase();

          var matchedObs = MOCK_OBSERVATIONS.filter(function (obs) {
            if (obsPatientId && obs.patientId.toUpperCase() !== obsPatientId.toUpperCase()) {
              return false;
            }
            if (vitalType && vitalType !== 'all' && obs.type.toLowerCase() !== vitalType.toLowerCase()) {
              return false;
            }
            if (obsStatus && obsStatus !== 'all' && obs.status.toLowerCase() !== obsStatus.toLowerCase()) {
              return false;
            }
            if (obsQ) {
              var idMatch = obs.id.toLowerCase().indexOf(obsQ) !== -1;
              var pidMatch = obs.patientId.toLowerCase().indexOf(obsQ) !== -1;
              var nameMatch = (obs.patientName || '').toLowerCase().indexOf(obsQ) !== -1;
              var typeMatch = obs.type.toLowerCase().indexOf(obsQ) !== -1;
              var sensorMatch = (obs.metadata && obs.metadata.sensorModel ? obs.metadata.sensorModel.toLowerCase() : '').indexOf(obsQ) !== -1;
              if (!idMatch && !pidMatch && !nameMatch && !typeMatch && !sensorMatch) {
                return false;
              }
            }
            if (fromDate && !isNaN(fromDate.getTime())) {
              if (new Date(obs.timestamp) < fromDate) return false;
            }
            if (toDate && !isNaN(toDate.getTime())) {
              if (new Date(obs.timestamp) > toDate) return false;
            }
            return true;
          });

          // Sort observations
          matchedObs.sort(function (a, b) {
            var valA = a[sortBy];
            var valB = b[sortBy];

            if (sortBy === 'timestamp') {
              valA = new Date(a.timestamp).getTime();
              valB = new Date(b.timestamp).getTime();
            } else if (sortBy === 'id') {
              valA = parseInt(String(a.id).replace(/\D/g, ''), 10) || 0;
              valB = parseInt(String(b.id).replace(/\D/g, ''), 10) || 0;
            } else if (sortBy === 'patientId') {
              valA = parseInt(String(a.patientId).replace(/\D/g, ''), 10) || 0;
              valB = parseInt(String(b.patientId).replace(/\D/g, ''), 10) || 0;
            } else if (sortBy === 'patientName') {
              valA = (a.patientName || '').toLowerCase();
              valB = (b.patientName || '').toLowerCase();
            } else if (sortBy === 'type') {
              valA = (a.type || '').toLowerCase();
              valB = (b.type || '').toLowerCase();
            } else if (sortBy === 'value') {
              valA = a.value !== null && a.value !== undefined ? Number(a.value) : -Infinity;
              valB = b.value !== null && b.value !== undefined ? Number(b.value) : -Infinity;
            } else if (sortBy === 'status') {
              valA = (a.status || '').toLowerCase();
              valB = (b.status || '').toLowerCase();
            }

            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
          });

          // If pagination requested (page query param provided)
          if (params.page !== undefined) {
            var page = Math.max(1, parseInt(params.page, 10) || 1);
            var pageSize = Math.max(1, parseInt(params.pageSize, 10) || 10);
            var total = matchedObs.length;
            var startIndex = (page - 1) * pageSize;
            var pagedItems = matchedObs.slice(startIndex, startIndex + pageSize);

            return resolve({
              ok: true,
              data: {
                items: pagedItems,
                page: page,
                pageSize: pageSize,
                total: total,
                source: 'simulated'
              },
              error: null,
              status: 200
            });
          }

          return resolve({
            ok: true,
            data: {
              items: matchedObs,
              total: matchedObs.length,
              source: 'simulated'
            },
            error: null,
            status: 200
          });
        }

        // -------------------------------------------------------------
        // 9. GET /admin/predictions (Query params: q, patientId, riskCategory, status, modelVersion, sortBy, sortDir, page, pageSize)
        // -------------------------------------------------------------
        if (path === '/admin/predictions' && method === 'GET') {
          var predQ = (params.q || '').trim().toLowerCase();
          var predPatientId = (params.patientId || '').trim();
          var filterRisk = (params.riskCategory || '').trim();
          var filterPredStatus = (params.status || '').trim();
          var filterModel = (params.modelVersion || '').trim();

          var sortBy = params.sortBy || 'generatedAt';
          var sortDir = (params.sortDir || 'desc').toLowerCase();

          // 1. Filter
          var filteredPreds = MOCK_PREDICTIONS.filter(function (pred) {
            // Patient ID exact filter
            if (predPatientId && pred.patientId.toUpperCase() !== predPatientId.toUpperCase()) {
              return false;
            }

            // Keyword search (ID, patientId, targetCondition)
            if (predQ) {
              var matchId = (pred.id || '').toLowerCase().indexOf(predQ) !== -1;
              var matchPid = (pred.patientId || '').toLowerCase().indexOf(predQ) !== -1;
              var matchCond = (pred.targetCondition || '').toLowerCase().indexOf(predQ) !== -1;
              if (!matchId && !matchPid && !matchCond) return false;
            }

            // Risk category filter
            if (filterRisk && filterRisk.toLowerCase() !== 'all') {
              if ((pred.riskCategory || '').toLowerCase() !== filterRisk.toLowerCase()) {
                return false;
              }
            }

            // Status filter
            if (filterPredStatus && filterPredStatus.toLowerCase() !== 'all') {
              if ((pred.status || '').toLowerCase() !== filterPredStatus.toLowerCase()) {
                return false;
              }
            }

            // Model version filter
            if (filterModel && filterModel.toLowerCase() !== 'all') {
              if ((pred.modelVersion || '').toLowerCase() !== filterModel.toLowerCase()) {
                return false;
              }
            }

            return true;
          });

          // 2. Sort
          filteredPreds.sort(function (a, b) {
            var valA = a[sortBy];
            var valB = b[sortBy];

            if (sortBy === 'generatedAt') {
              valA = new Date(a.generatedAt || 0).getTime();
              valB = new Date(b.generatedAt || 0).getTime();
            } else if (sortBy === 'predictedScore') {
              valA = Number(a.predictedScore) || 0;
              valB = Number(b.predictedScore) || 0;
            } else if (sortBy === 'confidence') {
              valA = Number(a.confidence) || 0;
              valB = Number(b.confidence) || 0;
            } else if (sortBy === 'riskCategory') {
              var riskWeights = { 'critical': 4, 'high': 3, 'moderate': 2, 'low': 1 };
              valA = riskWeights[(a.riskCategory || '').toLowerCase()] || 0;
              valB = riskWeights[(b.riskCategory || '').toLowerCase()] || 0;
            } else if (sortBy === 'id') {
              valA = parseInt(String(a.id).replace(/\D/g, ''), 10) || a.id;
              valB = parseInt(String(b.id).replace(/\D/g, ''), 10) || b.id;
            } else if (sortBy === 'patientId') {
              valA = parseInt(String(a.patientId).replace(/\D/g, ''), 10) || a.patientId;
              valB = parseInt(String(b.patientId).replace(/\D/g, ''), 10) || b.patientId;
            } else {
              valA = String(valA || '').toLowerCase();
              valB = String(valB || '').toLowerCase();
            }

            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
          });

          // 3. Paginate
          var totalPreds = filteredPreds.length;
          var isPaginated = params.page !== undefined || params.pageSize !== undefined || !predPatientId;
          var page = Math.max(1, parseInt(params.page, 10) || 1);
          var pageSize = Math.max(1, parseInt(params.pageSize, 10) || 10);

          var pagedPreds = isPaginated
            ? filteredPreds.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
            : filteredPreds;

          return resolve({
            ok: true,
            data: {
              items: pagedPreds,
              page: isPaginated ? page : 1,
              pageSize: isPaginated ? pageSize : totalPreds,
              total: totalPreds,
              source: 'simulated'
            },
            error: null,
            status: 200
          });
        }

        // -------------------------------------------------------------
        // 9b. GET /admin/predictions/{id}
        // -------------------------------------------------------------
        var predictionDetailId = matchEndpointWithId('/admin/predictions/{id}', path);
        if (predictionDetailId && method === 'GET') {
          var foundPred = null;
          for (var pdi = 0; pdi < MOCK_PREDICTIONS.length; pdi++) {
            if (MOCK_PREDICTIONS[pdi].id.toUpperCase() === predictionDetailId.toUpperCase()) {
              foundPred = MOCK_PREDICTIONS[pdi];
              break;
            }
          }
          if (foundPred) {
            return resolve({
              ok: true,
              data: foundPred,
              error: null,
              status: 200
            });
          } else {
            return resolve({
              ok: false,
              data: null,
              error: 'Simulated prediction record with identifier "' + predictionDetailId + '" was not found.',
              status: 404
            });
          }
        }

        // -------------------------------------------------------------
        // 10. GET /admin/alerts (Query params: q, patientId, status, severity, sortBy, sortDir, page, pageSize)
        // -------------------------------------------------------------
        if (path === '/admin/alerts' && method === 'GET') {
          var alertQ = (params.q || '').trim().toLowerCase();
          var alertPatientId = (params.patientId || '').trim();
          var filterAlertStatus = (params.status || '').trim();
          var filterSeverity = (params.severity || '').trim();

          var alertSortBy = params.sortBy || 'createdAt';
          var alertSortDir = (params.sortDir || 'desc').toLowerCase();

          // 1. Filter
          var filteredAlerts = MOCK_ALERTS.filter(function (al) {
            // Patient ID exact match
            if (alertPatientId && al.patientId.toUpperCase() !== alertPatientId.toUpperCase()) {
              return false;
            }

            // Keyword search (id, patientId, title, message)
            if (alertQ) {
              var matchAid = (al.id || '').toLowerCase().indexOf(alertQ) !== -1;
              var matchPid = (al.patientId || '').toLowerCase().indexOf(alertQ) !== -1;
              var matchTitle = (al.title || '').toLowerCase().indexOf(alertQ) !== -1;
              var matchMsg = (al.message || '').toLowerCase().indexOf(alertQ) !== -1;
              if (!matchAid && !matchPid && !matchTitle && !matchMsg) return false;
            }

            // Status filter
            if (filterAlertStatus && filterAlertStatus.toLowerCase() !== 'all') {
              if ((al.status || '').toLowerCase() !== filterAlertStatus.toLowerCase()) {
                return false;
              }
            }

            // Severity filter
            if (filterSeverity && filterSeverity.toLowerCase() !== 'all') {
              if ((al.severity || '').toLowerCase() !== filterSeverity.toLowerCase()) {
                return false;
              }
            }

            return true;
          });

          // 2. Sort
          filteredAlerts.sort(function (a, b) {
            var valA = a[alertSortBy];
            var valB = b[alertSortBy];

            if (alertSortBy === 'createdAt') {
              valA = new Date(a.createdAt || 0).getTime();
              valB = new Date(b.createdAt || 0).getTime();
            } else if (alertSortBy === 'severity') {
              var sevWeights = { 'critical': 4, 'high': 3, 'warning': 2, 'info': 1 };
              valA = sevWeights[(a.severity || '').toLowerCase()] || 0;
              valB = sevWeights[(b.severity || '').toLowerCase()] || 0;
            } else if (alertSortBy === 'status') {
              var statusWeights = { 'active': 3, 'acknowledged': 2, 'resolved': 1 };
              valA = statusWeights[(a.status || '').toLowerCase()] || 0;
              valB = statusWeights[(b.status || '').toLowerCase()] || 0;
            } else if (alertSortBy === 'id') {
              valA = parseInt(String(a.id).replace(/\D/g, ''), 10) || a.id;
              valB = parseInt(String(b.id).replace(/\D/g, ''), 10) || b.id;
            } else if (alertSortBy === 'patientId') {
              valA = parseInt(String(a.patientId).replace(/\D/g, ''), 10) || a.patientId;
              valB = parseInt(String(b.patientId).replace(/\D/g, ''), 10) || b.patientId;
            } else {
              valA = String(valA || '').toLowerCase();
              valB = String(valB || '').toLowerCase();
            }

            if (valA < valB) return alertSortDir === 'asc' ? -1 : 1;
            if (valA > valB) return alertSortDir === 'asc' ? 1 : -1;
            return 0;
          });

          // 3. Paginate
          var totalAlerts = filteredAlerts.length;
          var isAlertsPaginated = params.page !== undefined || params.pageSize !== undefined || !alertPatientId;
          var aPage = Math.max(1, parseInt(params.page, 10) || 1);
          var aPageSize = Math.max(1, parseInt(params.pageSize, 10) || 10);

          var pagedAlerts = isAlertsPaginated
            ? filteredAlerts.slice((aPage - 1) * aPageSize, (aPage - 1) * aPageSize + aPageSize)
            : filteredAlerts;

          return resolve({
            ok: true,
            data: {
              items: pagedAlerts,
              page: isAlertsPaginated ? aPage : 1,
              pageSize: isAlertsPaginated ? aPageSize : totalAlerts,
              total: totalAlerts,
              source: 'simulated'
            },
            error: null,
            status: 200
          });
        }

        // -------------------------------------------------------------
        // 10b. GET /admin/alerts/{id}
        // -------------------------------------------------------------
        var alertDetailId = matchEndpointWithId('/admin/alerts/{id}', path);
        if (alertDetailId && method === 'GET') {
          var foundSingleAlert = null;
          for (var dai = 0; dai < MOCK_ALERTS.length; dai++) {
            if (MOCK_ALERTS[dai].id.toUpperCase() === alertDetailId.toUpperCase()) {
              foundSingleAlert = MOCK_ALERTS[dai];
              break;
            }
          }
          if (foundSingleAlert) {
            return resolve({
              ok: true,
              data: foundSingleAlert,
              error: null,
              status: 200
            });
          } else {
            return resolve({
              ok: false,
              data: null,
              error: 'Simulated alert with identifier "' + alertDetailId + '" was not found.',
              status: 404
            });
          }
        }

        // -------------------------------------------------------------
        // 11. PATCH /admin/alerts/{id}
        // -------------------------------------------------------------
        var alertId = matchEndpointWithId('/admin/alerts/{id}', path);
        if (alertId && method === 'PATCH') {
          var foundAlert = null;
          for (var ai = 0; ai < MOCK_ALERTS.length; ai++) {
            if (MOCK_ALERTS[ai].id.toUpperCase() === alertId.toUpperCase()) {
              foundAlert = MOCK_ALERTS[ai];
              break;
            }
          }
          if (foundAlert) {
            var alertPatchBody = options.body || {};
            if (typeof alertPatchBody === 'string') {
              try { alertPatchBody = JSON.parse(alertPatchBody); } catch (e) {}
            }
            if (alertPatchBody.status) {
              foundAlert.status = alertPatchBody.status;
            }
            if (alertPatchBody.acknowledgedBy) {
              foundAlert.acknowledgedBy = alertPatchBody.acknowledgedBy;
            }
            if (alertPatchBody.resolvedBy) {
              foundAlert.resolvedBy = alertPatchBody.resolvedBy;
            } else if (alertPatchBody.status === 'Resolved' && alertPatchBody.acknowledgedBy && !foundAlert.resolvedBy) {
              foundAlert.resolvedBy = alertPatchBody.acknowledgedBy;
            }
            foundAlert.updatedAt = new Date().toISOString();
            saveAlertsToSession();

            return resolve({ ok: true, data: foundAlert, error: null, status: 200 });
          } else {
            return resolve({
              ok: false,
              data: null,
              error: 'Simulated alert with identifier "' + alertId + '" was not found.',
              status: 404
            });
          }
        }

        // -------------------------------------------------------------
        // 12. GET /admin/users (Query params: q, role, status, department, sortBy, sortDir, page, pageSize)
        // -------------------------------------------------------------
        if (path === '/admin/users' && method === 'GET') {
          var userQ = (params.q || '').trim().toLowerCase();
          var filterRole = (params.role || '').trim();
          var filterStatus = (params.status || '').trim();
          var filterDept = (params.department || '').trim();

          var userSortBy = params.sortBy || 'id';
          var userSortDir = (params.sortDir || 'asc').toLowerCase();

          // 1. Filter
          var filteredUsers = MOCK_USERS.filter(function (u) {
            // Keyword search (id, name, email, department)
            if (userQ) {
              var matchId = (u.id || '').toLowerCase().indexOf(userQ) !== -1;
              var matchName = (u.name || '').toLowerCase().indexOf(userQ) !== -1;
              var matchEmail = (u.email || '').toLowerCase().indexOf(userQ) !== -1;
              var matchDept = (u.department || '').toLowerCase().indexOf(userQ) !== -1;
              if (!matchId && !matchName && !matchEmail && !matchDept) return false;
            }

            // Role filter
            if (filterRole && filterRole.toLowerCase() !== 'all') {
              if ((u.role || '').toLowerCase() !== filterRole.toLowerCase()) {
                return false;
              }
            }

            // Status filter
            if (filterStatus && filterStatus.toLowerCase() !== 'all') {
              if ((u.status || '').toLowerCase() !== filterStatus.toLowerCase()) {
                return false;
              }
            }

            // Department filter
            if (filterDept && filterDept.toLowerCase() !== 'all') {
              if ((u.department || '').toLowerCase() !== filterDept.toLowerCase()) {
                return false;
              }
            }

            return true;
          });

          // 2. Sort
          filteredUsers.sort(function (a, b) {
            var valA = a[userSortBy];
            var valB = b[userSortBy];

            if (userSortBy === 'lastLogin') {
              valA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
              valB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
            } else if (userSortBy === 'id') {
              valA = parseInt(String(a.id).replace(/\D/g, ''), 10) || a.id;
              valB = parseInt(String(b.id).replace(/\D/g, ''), 10) || b.id;
            } else {
              valA = String(valA || '').toLowerCase();
              valB = String(valB || '').toLowerCase();
            }

            if (valA < valB) return userSortDir === 'asc' ? -1 : 1;
            if (valA > valB) return userSortDir === 'asc' ? 1 : -1;
            return 0;
          });

          // 3. Paginate
          var totalUsers = filteredUsers.length;
          var isUsersPaginated = params.page !== undefined || params.pageSize !== undefined;
          var uPage = Math.max(1, parseInt(params.page, 10) || 1);
          var uPageSize = Math.max(1, parseInt(params.pageSize, 10) || 10);

          var pagedUsers = isUsersPaginated
            ? filteredUsers.slice((uPage - 1) * uPageSize, (uPage - 1) * uPageSize + uPageSize)
            : filteredUsers;

          return resolve({
            ok: true,
            data: {
              items: pagedUsers,
              page: isUsersPaginated ? uPage : 1,
              pageSize: isUsersPaginated ? uPageSize : totalUsers,
              total: totalUsers,
              source: 'simulated'
            },
            error: null,
            status: 200
          });
        }

        // -------------------------------------------------------------
        // 12b. GET /admin/users/{id}
        // -------------------------------------------------------------
        var userDetailId = matchEndpointWithId('/admin/users/{id}', path);
        if (userDetailId && method === 'GET') {
          var foundSingleUser = null;
          for (var ui = 0; ui < MOCK_USERS.length; ui++) {
            if (MOCK_USERS[ui].id.toUpperCase() === userDetailId.toUpperCase()) {
              foundSingleUser = MOCK_USERS[ui];
              break;
            }
          }
          if (foundSingleUser) {
            return resolve({ ok: true, data: foundSingleUser, error: null, status: 200 });
          } else {
            return resolve({
              ok: false,
              data: null,
              error: 'Simulated user record with identifier "' + userDetailId + '" was not found.',
              status: 404
            });
          }
        }

        // -------------------------------------------------------------
        // 12c. POST /admin/users (Add New User)
        // -------------------------------------------------------------
        if (path === '/admin/users' && method === 'POST') {
          var userPostBody = options.body;
          if (typeof userPostBody === 'string') {
            try { userPostBody = JSON.parse(userPostBody); } catch (e) {
              return resolve({ ok: false, data: null, error: 'Invalid JSON request payload.', status: 400 });
            }
          }
          userPostBody = userPostBody || {};

          // Validate required fields
          var rawName = String(userPostBody.name || '').trim();
          var rawEmail = String(userPostBody.email || '').trim().toLowerCase();
          var rawRole = String(userPostBody.role || '').trim();
          var rawDept = String(userPostBody.department || '').trim();
          var rawStatus = String(userPostBody.status || 'Active').trim();

          if (!rawName || rawName.length < 2) {
            return resolve({ ok: false, data: null, error: 'Full Name is required and must be at least 2 characters.', status: 400 });
          }

          var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!rawEmail || !emailRegex.test(rawEmail)) {
            return resolve({ ok: false, data: null, error: 'A valid email address is required.', status: 400 });
          }

          // Duplicate email check
          for (var em = 0; em < MOCK_USERS.length; em++) {
            if (MOCK_USERS[em].email.toLowerCase() === rawEmail) {
              return resolve({ ok: false, data: null, error: 'A user account with email "' + rawEmail + '" already exists.', status: 400 });
            }
          }

          if (!rawRole) {
            return resolve({ ok: false, data: null, error: 'A valid user role must be selected.', status: 400 });
          }

          if (!rawDept) {
            return resolve({ ok: false, data: null, error: 'Department assignment is required.', status: 400 });
          }

          // Generate next unique user ID
          var maxNum = 1000;
          for (var uix = 0; uix < MOCK_USERS.length; uix++) {
            var num = parseInt(String(MOCK_USERS[uix].id).replace(/\D/g, ''), 10);
            if (num && num > maxNum) maxNum = num;
          }
          var newUserId = 'USR-' + (maxNum + 1);

          var newUser = {
            id: newUserId,
            name: rawName,
            email: rawEmail,
            role: rawRole,
            department: rawDept,
            status: rawStatus || 'Active',
            lastLogin: null,
            source: 'simulated',
            metadata: {
              simulatedEnvironment: true,
              isSimulated: true,
              accessLevel: rawRole === 'System Administrator' ? 'Full Administrative' : (rawRole === 'Read-only Reviewer' ? 'Read-Only Audit' : 'Clinical Operational')
            }
          };

          MOCK_USERS.push(newUser);
          saveUsersToSession();

          return resolve({ ok: true, data: newUser, error: null, status: 201 });
        }

        // -------------------------------------------------------------
        // 12d. PATCH /admin/users/{id} (Update User)
        // -------------------------------------------------------------
        var userPatchId = matchEndpointWithId('/admin/users/{id}', path);
        if (userPatchId && method === 'PATCH') {
          var userPatchBody = options.body;
          if (typeof userPatchBody === 'string') {
            try { userPatchBody = JSON.parse(userPatchBody); } catch (e) {
              return resolve({ ok: false, data: null, error: 'Invalid JSON request payload.', status: 400 });
            }
          }
          userPatchBody = userPatchBody || {};

          var foundPatchUser = null;
          for (var pui = 0; pui < MOCK_USERS.length; pui++) {
            if (MOCK_USERS[pui].id.toUpperCase() === userPatchId.toUpperCase()) {
              foundPatchUser = MOCK_USERS[pui];
              break;
            }
          }

          if (!foundPatchUser) {
            return resolve({
              ok: false,
              data: null,
              error: 'Simulated user record with identifier "' + userPatchId + '" was not found.',
              status: 404
            });
          }

          // Safeguard: Primary administrator USR-1001 protection
          if (foundPatchUser.id === 'USR-1001') {
            if (userPatchBody.status && (userPatchBody.status.toLowerCase() === 'inactive' || userPatchBody.status.toLowerCase() === 'deactivated')) {
              return resolve({
                ok: false,
                data: null,
                error: 'The primary system administrator account (USR-1001) cannot be deactivated.',
                status: 400
              });
            }
            if (userPatchBody.role && userPatchBody.role !== 'System Administrator') {
              return resolve({
                ok: false,
                data: null,
                error: 'The primary system administrator account (USR-1001) cannot be demoted.',
                status: 400
              });
            }
          }

          // Apply updates
          if (userPatchBody.name) foundPatchUser.name = String(userPatchBody.name).trim();
          if (userPatchBody.role) foundPatchUser.role = String(userPatchBody.role).trim();
          if (userPatchBody.department) foundPatchUser.department = String(userPatchBody.department).trim();
          if (userPatchBody.status) foundPatchUser.status = String(userPatchBody.status).trim();
          if (userPatchBody.email) {
            var updatedEmail = String(userPatchBody.email).trim().toLowerCase();
            // Verify not taken by another user
            for (var uce = 0; uce < MOCK_USERS.length; uce++) {
              if (MOCK_USERS[uce].id !== foundPatchUser.id && MOCK_USERS[uce].email.toLowerCase() === updatedEmail) {
                return resolve({
                  ok: false,
                  data: null,
                  error: 'Email "' + updatedEmail + '" is already registered to another user account.',
                  status: 400
                });
              }
            }
            foundPatchUser.email = updatedEmail;
          }

          saveUsersToSession();
          return resolve({ ok: true, data: foundPatchUser, error: null, status: 200 });
        }

        // -------------------------------------------------------------
        // 13. GET /admin/reports (Query params: q, type, status, format, sortBy, sortDir, page, pageSize)
        // -------------------------------------------------------------
        if (path === '/admin/reports' && method === 'GET') {
          var repQ = (params.q || '').trim().toLowerCase();
          var filterRepType = (params.type || '').trim();
          var filterRepStatus = (params.status || '').trim();
          var filterRepFormat = (params.format || '').trim();

          var repSortBy = params.sortBy || 'generatedDate';
          var repSortDir = (params.sortDir || 'desc').toLowerCase();

          // 1. Filter
          var filteredReports = MOCK_REPORTS.filter(function (rep) {
            if (repQ) {
              var matchId = (rep.id || '').toLowerCase().indexOf(repQ) !== -1;
              var matchTitle = (rep.title || '').toLowerCase().indexOf(repQ) !== -1;
              var matchType = (rep.type || '').toLowerCase().indexOf(repQ) !== -1;
              var matchDesc = (rep.description || '').toLowerCase().indexOf(repQ) !== -1;
              if (!matchId && !matchTitle && !matchType && !matchDesc) return false;
            }

            if (filterRepType && filterRepType.toLowerCase() !== 'all') {
              if ((rep.type || '').toLowerCase() !== filterRepType.toLowerCase()) {
                return false;
              }
            }

            if (filterRepStatus && filterRepStatus.toLowerCase() !== 'all') {
              if ((rep.status || '').toLowerCase() !== filterRepStatus.toLowerCase()) {
                return false;
              }
            }

            if (filterRepFormat && filterRepFormat.toLowerCase() !== 'all') {
              if ((rep.format || '').toLowerCase() !== filterRepFormat.toLowerCase()) {
                return false;
              }
            }

            return true;
          });

          // 2. Sort
          filteredReports.sort(function (a, b) {
            var valA = a[repSortBy];
            var valB = b[repSortBy];

            if (repSortBy === 'generatedDate') {
              valA = new Date(a.generatedDate || 0).getTime();
              valB = new Date(b.generatedDate || 0).getTime();
            } else if (repSortBy === 'id') {
              valA = parseInt(String(a.id).replace(/\D/g, ''), 10) || a.id;
              valB = parseInt(String(b.id).replace(/\D/g, ''), 10) || b.id;
            } else {
              valA = String(valA || '').toLowerCase();
              valB = String(valB || '').toLowerCase();
            }

            if (valA < valB) return repSortDir === 'asc' ? -1 : 1;
            if (valA > valB) return repSortDir === 'asc' ? 1 : -1;
            return 0;
          });

          // 3. Paginate
          var totalReports = filteredReports.length;
          var isRepPaginated = params.page !== undefined || params.pageSize !== undefined;
          var rPage = Math.max(1, parseInt(params.page, 10) || 1);
          var rPageSize = Math.max(1, parseInt(params.pageSize, 10) || 10);

          var pagedReports = isRepPaginated
            ? filteredReports.slice((rPage - 1) * rPageSize, (rPage - 1) * rPageSize + rPageSize)
            : filteredReports;

          return resolve({
            ok: true,
            data: {
              items: pagedReports,
              page: isRepPaginated ? rPage : 1,
              pageSize: isRepPaginated ? rPageSize : totalReports,
              total: totalReports,
              source: 'simulated'
            },
            error: null,
            status: 200
          });
        }

        // -------------------------------------------------------------
        // 13b. GET /admin/reports/{id}
        // -------------------------------------------------------------
        var reportDetailId = matchEndpointWithId('/admin/reports/{id}', path);
        if (reportDetailId && method === 'GET') {
          var foundReport = null;
          for (var ri = 0; ri < MOCK_REPORTS.length; ri++) {
            if (MOCK_REPORTS[ri].id.toUpperCase() === reportDetailId.toUpperCase()) {
              foundReport = MOCK_REPORTS[ri];
              break;
            }
          }
          if (foundReport) {
            return resolve({ ok: true, data: foundReport, error: null, status: 200 });
          } else {
            return resolve({
              ok: false,
              data: null,
              error: 'Simulated report with identifier "' + reportDetailId + '" was not found.',
              status: 404
            });
          }
        }

        // -------------------------------------------------------------
        // 13c. POST /admin/reports (Generate Simulated Report)
        // -------------------------------------------------------------
        if (path === '/admin/reports' && method === 'POST') {
          var repPostBody = options.body;
          if (typeof repPostBody === 'string') {
            try { repPostBody = JSON.parse(repPostBody); } catch (e) {
              return resolve({ ok: false, data: null, error: 'Invalid JSON request payload.', status: 400 });
            }
          }
          repPostBody = repPostBody || {};

          var rawRepTitle = String(repPostBody.title || '').trim();
          var rawRepType = String(repPostBody.type || '').trim();
          var rawRepFormat = String(repPostBody.format || 'CSV').trim().toUpperCase();
          var rawRepPeriod = String(repPostBody.period || 'Custom Timeframe').trim();
          var rawRepDesc = String(repPostBody.description || '').trim();

          if (!rawRepTitle || rawRepTitle.length < 3) {
            return resolve({ ok: false, data: null, error: 'Report title is required and must be at least 3 characters.', status: 400 });
          }

          if (!rawRepType) {
            return resolve({ ok: false, data: null, error: 'Report type is required.', status: 400 });
          }

          if (rawRepFormat !== 'CSV' && rawRepFormat !== 'PDF') {
            return resolve({ ok: false, data: null, error: 'Report format must be either CSV or PDF.', status: 400 });
          }

          // Generate next report ID
          var maxRepNum = 1000;
          for (var rx = 0; rx < MOCK_REPORTS.length; rx++) {
            var rnum = parseInt(String(MOCK_REPORTS[rx].id).replace(/\D/g, ''), 10);
            if (rnum && rnum > maxRepNum) maxRepNum = rnum;
          }
          var newRepId = 'REP-' + (maxRepNum + 1);

          var newReport = {
            id: newRepId,
            title: rawRepTitle,
            type: rawRepType,
            generatedDate: new Date().toISOString(),
            status: 'Completed',
            format: rawRepFormat,
            period: rawRepPeriod,
            recordCount: repPostBody.recordCount || '25 Monitored Records',
            size: rawRepFormat === 'CSV' ? '32 KB' : '1.6 MB',
            generatedBy: repPostBody.generatedBy || 'Dr. Evelyn Carter (Simulated Admin)',
            description: rawRepDesc || ('Simulated ' + rawRepType + ' produced for research validation and dashboard evaluation.'),
            source: 'simulated'
          };

          MOCK_REPORTS.unshift(newReport);
          saveReportsToSession();

          return resolve({ ok: true, data: newReport, error: null, status: 201 });
        }

        // -------------------------------------------------------------
        // 14. GET /admin/audit-logs (Query params: q, category, action, actor, sortBy, sortDir, page, pageSize)
        // -------------------------------------------------------------
        if (path === '/admin/audit-logs' && method === 'GET') {
          var logQ = (params.q || '').trim().toLowerCase();
          var filterCategory = (params.category || '').trim();
          var filterAction = (params.action || '').trim();
          var filterActor = (params.actor || '').trim().toLowerCase();

          var logSortBy = params.sortBy || 'timestamp';
          var logSortDir = (params.sortDir || 'desc').toLowerCase();

          // 1. Filter
          var filteredLogs = MOCK_AUDIT_LOGS.filter(function (entry) {
            if (logQ) {
              var matchId = (entry.id || '').toLowerCase().indexOf(logQ) !== -1;
              var matchActor = (entry.actor || '').toLowerCase().indexOf(logQ) !== -1;
              var matchAction = (entry.action || '').toLowerCase().indexOf(logQ) !== -1;
              var matchDetails = (entry.details || '').toLowerCase().indexOf(logQ) !== -1;
              var matchIp = (entry.ipAddress || '').toLowerCase().indexOf(logQ) !== -1;
              if (!matchId && !matchActor && !matchAction && !matchDetails && !matchIp) return false;
            }

            if (filterCategory && filterCategory.toLowerCase() !== 'all') {
              if ((entry.category || '').toLowerCase() !== filterCategory.toLowerCase()) {
                return false;
              }
            }

            if (filterAction && filterAction.toLowerCase() !== 'all') {
              if ((entry.action || '').toLowerCase() !== filterAction.toLowerCase()) {
                return false;
              }
            }

            if (filterActor && filterActor.toLowerCase() !== 'all') {
              if ((entry.actor || '').toLowerCase().indexOf(filterActor) === -1) {
                return false;
              }
            }

            return true;
          });

          // 2. Sort
          filteredLogs.sort(function (a, b) {
            var valA = a[logSortBy];
            var valB = b[logSortBy];

            if (logSortBy === 'timestamp') {
              valA = new Date(a.timestamp || 0).getTime();
              valB = new Date(b.timestamp || 0).getTime();
            } else if (logSortBy === 'id') {
              valA = parseInt(String(a.id).replace(/\D/g, ''), 10) || a.id;
              valB = parseInt(String(b.id).replace(/\D/g, ''), 10) || b.id;
            } else {
              valA = String(valA || '').toLowerCase();
              valB = String(valB || '').toLowerCase();
            }

            if (valA < valB) return logSortDir === 'asc' ? -1 : 1;
            if (valA > valB) return logSortDir === 'asc' ? 1 : -1;
            return 0;
          });

          // 3. Paginate
          var totalLogs = filteredLogs.length;
          var isLogPaginated = params.page !== undefined || params.pageSize !== undefined;
          var lPage = Math.max(1, parseInt(params.page, 10) || 1);
          var lPageSize = Math.max(1, parseInt(params.pageSize, 10) || 10);

          var pagedLogs = isLogPaginated
            ? filteredLogs.slice((lPage - 1) * lPageSize, (lPage - 1) * lPageSize + lPageSize)
            : filteredLogs;

          return resolve({
            ok: true,
            data: {
              items: pagedLogs,
              page: isLogPaginated ? lPage : 1,
              pageSize: isLogPaginated ? lPageSize : totalLogs,
              total: totalLogs,
              source: 'simulated'
            },
            error: null,
            status: 200
          });
        }

        // -------------------------------------------------------------
        // 14b. GET /admin/audit-logs/{id}
        // -------------------------------------------------------------
        var auditLogDetailId = matchEndpointWithId('/admin/audit-logs/{id}', path);
        if (auditLogDetailId && method === 'GET') {
          var foundLog = null;
          for (var li = 0; li < MOCK_AUDIT_LOGS.length; li++) {
            if (MOCK_AUDIT_LOGS[li].id.toUpperCase() === auditLogDetailId.toUpperCase()) {
              foundLog = MOCK_AUDIT_LOGS[li];
              break;
            }
          }
          if (foundLog) {
            return resolve({ ok: true, data: foundLog, error: null, status: 200 });
          } else {
            return resolve({
              ok: false,
              data: null,
              error: 'Simulated audit log with identifier "' + auditLogDetailId + '" was not found.',
              status: 404
            });
          }
        }

        // -------------------------------------------------------------
        // 14c. Disallow Mutation Operations on Audit Logs (Strictly Read-Only)
        // -------------------------------------------------------------
        if ((path === '/admin/audit-logs' || auditLogDetailId) && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
          return resolve({
            ok: false,
            data: null,
            error: 'System audit logs are strictly immutable and cannot be modified or deleted.',
            status: 405
          });
        }

        // -------------------------------------------------------------
        // Unrecognized endpoint
        // -------------------------------------------------------------
        return resolve({
          ok: false,
          data: null,
          error: 'Proposed mock endpoint "' + endpoint + '" [' + method + '] is not recognized.',
          status: 404
        });
      }, delay);
    });
  }

  // Expose mock data and mock router globally
  window.VitalGuardMockData = {
    handleRequest: handleMockRequest,
    getPatientsCount: function () { return MOCK_PATIENTS.length; },
    getObservationsCount: function () { return MOCK_OBSERVATIONS.length; },
    getPatients: function () { return MOCK_PATIENTS; },
    getObservations: function () { return MOCK_OBSERVATIONS; },
    getUsers: function () { return MOCK_USERS; },
    getReports: function () { return MOCK_REPORTS; },
    getAuditLogs: function () { return MOCK_AUDIT_LOGS; },
    getAlerts: function () { return MOCK_ALERTS; },
    getPredictions: function () { return MOCK_PREDICTIONS; }
  };
})(window);
