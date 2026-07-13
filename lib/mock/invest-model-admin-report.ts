/**
 * investModel admin report mock data represents user-submitted model concerns for operator review screens.
 * It is read-only seed data and must not be treated as a legal conclusion, compensation decision, or trading action.
 */

export type MockAdminReportStatus = 'pending_review' | 'in_review' | 'resolved';

export type MockAdminReport = {
  id: string;
  reportPublicId: string;
  modelName: string;
  creatorName: string;
  reporterLabel: string;
  reportTypeLabel: string;
  status: MockAdminReportStatus;
  statusLabel: string;
  statusTone: 'neutral' | 'low' | 'medium';
  submittedAtLabel: string;
  summary: string;
  blockedActionLabel: string;
  operatorHistory: {
    timeLabel: string;
    title: string;
    description: string;
  }[];
};

export const adminModelReports: MockAdminReport[] = [
  {
    id: 'report-quant-us-leverage-alpha-copy',
    reportPublicId: 'model_report_mock_001',
    modelName: 'Quant US Leverage Alpha v2',
    creatorName: 'Northstar Quant Lab',
    reporterLabel: 'user_mock_18',
    reportTypeLabel: 'Missing risk disclosure',
    status: 'pending_review',
    statusLabel: 'Pending review',
    statusTone: 'medium',
    submittedAtLabel: '2026-07-13 14:12',
    summary:
      'The model card mentions leveraged ETF exposure, but the report says drawdown language is hard to find on the mobile detail screen.',
    blockedActionLabel:
      'Mock screen only - status changes are not persisted yet',
    operatorHistory: [
      {
        timeLabel: '2026-07-13 14:12',
        title: 'Report received',
        description:
          'The concern was routed to operator review without creating a legal finding or trading action.'
      },
      {
        timeLabel: '2026-07-13 14:18',
        title: 'Auto safety boundary checked',
        description:
          'No account, payment, order, API key, or compensation fields were accepted in the report payload.'
      }
    ]
  },
  {
    id: 'report-macro-etf-income-performance',
    reportPublicId: 'model_report_mock_002',
    modelName: 'Macro ETF Income Rotation',
    creatorName: 'Bluewater Signals',
    reporterLabel: 'user_mock_27',
    reportTypeLabel: 'Misleading performance',
    status: 'in_review',
    statusLabel: 'In review',
    statusTone: 'neutral',
    submittedAtLabel: '2026-07-13 15:40',
    summary:
      'The submitted concern asks whether sample backtest copy is too prominent compared with volatility and drawdown caveats.',
    blockedActionLabel:
      'Mock screen only - no public model status transition is connected',
    operatorHistory: [
      {
        timeLabel: '2026-07-13 15:40',
        title: 'Report received',
        description:
          'The report was accepted as review context and does not decide suitability or user compensation.'
      },
      {
        timeLabel: '2026-07-13 16:05',
        title: 'Operator review started',
        description:
          'The model copy is being compared against the required performance caveat checklist.'
      }
    ]
  },
  {
    id: 'report-sector-surge-claim',
    reportPublicId: 'model_report_mock_003',
    modelName: 'Sector Surge Signal',
    creatorName: 'Atlas Market Studio',
    reporterLabel: 'user_mock_31',
    reportTypeLabel: 'Inappropriate claim',
    status: 'resolved',
    statusLabel: 'Resolved in mock',
    statusTone: 'low',
    submittedAtLabel: '2026-07-13 17:02',
    summary:
      'A mock model description used wording that could sound like guaranteed outperformance. The phrase was flagged for rewrite.',
    blockedActionLabel:
      'Mock resolved state - audit persistence is not connected yet',
    operatorHistory: [
      {
        timeLabel: '2026-07-13 17:02',
        title: 'Report received',
        description:
          'The concern was captured for copy review and did not trigger any live investment workflow.'
      },
      {
        timeLabel: '2026-07-13 17:20',
        title: 'Mock resolution noted',
        description:
          'The phrase was marked for rewrite in the mock queue while legal review remains a placeholder.'
      }
    ]
  }
];

