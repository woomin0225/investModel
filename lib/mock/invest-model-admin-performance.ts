/**
 * investModel admin performance mock data represents creator-submitted performance evidence.
 * It is private review seed data and must never publish unreviewed return claims.
 */

export type MockAdminPerformanceSubmission = {
  id: string;
  submissionPublicId: string;
  modelName: string;
  creatorName: string;
  versionLabel: string;
  submittedAtLabel: string;
  statusLabel: string;
  statusTone: 'neutral' | 'medium' | 'high' | 'blocked';
  performancePeriodLabel: string;
  measurementSourceLabel: string;
  returnMetricLabel: string;
  volatilityMetricLabel: string;
  maxDrawdownMetricLabel: string;
  methodologySummary: string;
  exposureLabel: string;
  fileEvidenceLabels: string[];
  reviewChecklist: string[];
  blockedActionLabel: string;
};

export const adminPerformanceSubmissions: MockAdminPerformanceSubmission[] = [
  {
    id: 'performance-quant-us-alpha-v2',
    submissionPublicId: 'PERF-SUB-20260713-001',
    modelName: 'Quant US Leverage Alpha v2',
    creatorName: 'Northstar Quant Lab',
    versionLabel: 'ModelVersion 2.0.0',
    submittedAtLabel: '2026-07-13 11:20',
    statusLabel: 'pending_review',
    statusTone: 'medium',
    performancePeriodLabel: '2023-01 to 2024-12',
    measurementSourceLabel: 'Creator backtest placeholder',
    returnMetricLabel: '+18.4%',
    volatilityMetricLabel: '31.2%',
    maxDrawdownMetricLabel: '-24.1%',
    methodologySummary:
      'Creator supplied a backtest summary for a leveraged ETF mandate. Review must confirm return, volatility, and drawdown are shown together with no suitability or guarantee wording.',
    exposureLabel: 'not_public',
    fileEvidenceLabels: ['summary.pdf', 'backtest-results.csv'],
    reviewChecklist: [
      'Return value is paired with volatility and max drawdown.',
      'No guaranteed return, principal protection, or risk-free leverage wording.',
      'Supporting files are non-executable and remain private.',
      'Public display waits for approved_placeholder disclosure.'
    ],
    blockedActionLabel:
      'Approval and public exposure are disabled until review APIs and audit persistence exist.'
  },
  {
    id: 'performance-macro-etf-income-v1',
    submissionPublicId: 'PERF-SUB-20260713-002',
    modelName: 'Macro ETF Income Rotation',
    creatorName: 'Bluewater Signals',
    versionLabel: 'ModelVersion 1.3.1',
    submittedAtLabel: '2026-07-13 12:05',
    statusLabel: 'changes_requested',
    statusTone: 'high',
    performancePeriodLabel: '2022-07 to 2024-06',
    measurementSourceLabel: 'Paper simulation placeholder',
    returnMetricLabel: '+7.8%',
    volatilityMetricLabel: '12.5%',
    maxDrawdownMetricLabel: '-9.6%',
    methodologySummary:
      'Submission needs clearer source labeling for macro inputs and a neutral description of paper-simulation limits before placeholder approval.',
    exposureLabel: 'not_public',
    fileEvidenceLabels: ['methodology-notes.pdf'],
    reviewChecklist: [
      'Clarify paper simulation source and data freshness.',
      'Keep ETF allocation language as model mandate, not user preference.',
      'Remove any wording that implies final legal approval.',
      'Request revised disclosure placeholder before public use.'
    ],
    blockedActionLabel:
      'Public DTO should show performance under review until requested changes are resolved.'
  }
];
