/**
 * investModel admin review mock data represents pending model submissions before any real approval API exists.
 * It is read-only seed data for administrator review screens and never publishes, approves, or executes a model.
 */

export type MockAdminReviewModel = {
  id: string;
  modelName: string;
  creatorName: string;
  submittedAtLabel: string;
  versionLabel: string;
  marketLabel: string;
  riskLabel: string;
  riskTone: 'low' | 'medium' | 'high';
  leverageLabel: string;
  assetScopeLabel: string;
  mandateSummary: string;
  disclosureStatusLabel: string;
  requiredReviewItems: string[];
  blockedActionLabel: string;
  strategySummary: string;
  performanceSourceLabel: string;
  dataInputs: string[];
  forbiddenAssets: string[];
  reviewNotes: string[];
};

export const pendingAdminReviewModels: MockAdminReviewModel[] = [
  {
    id: 'review-quant-us-leverage-alpha-v2',
    modelName: 'Quant US Leverage Alpha v2',
    creatorName: 'Northstar Quant Lab',
    submittedAtLabel: '2026-07-13 09:20',
    versionLabel: 'ModelVersion 2.0.0',
    marketLabel: 'US equities',
    riskLabel: 'High risk',
    riskTone: 'high',
    leverageLabel: 'Leveraged ETF allowed',
    assetScopeLabel: 'Large-cap stocks, sector ETFs, leveraged ETFs',
    mandateSummary:
      'Aggressive US momentum mandate with model-defined risk limits and no user-side risk preference controls.',
    disclosureStatusLabel: 'Disclosure placeholder required',
    requiredReviewItems: [
      'Leverage and drawdown language',
      'Backtest source and caveats',
      'Forbidden asset and market scope',
      'Creator ownership and version history'
    ],
    blockedActionLabel: 'Read-only review queue - approval API is not connected',
    strategySummary:
      'Ranks US large-cap momentum and leveraged ETF exposure from model-owned rules, then stops before any real TradeIntent or order execution.',
    performanceSourceLabel: 'Creator-provided backtest placeholder, unverified',
    dataInputs: [
      'Mock US equity price trend',
      'Mock semiconductor news traffic',
      'Sample volatility guardrail feed'
    ],
    forbiddenAssets: [
      'Crypto assets',
      'Single-name options',
      'Private funds',
      'Any broker order execution'
    ],
    reviewNotes: [
      'Confirm leverage wording does not imply suitability for all users.',
      'Keep performance copy paired with drawdown and volatility caveats.',
      'Require legal disclosure placeholder before public visibility.'
    ]
  },
  {
    id: 'review-macro-etf-income-v1',
    modelName: 'Macro ETF Income Rotation',
    creatorName: 'Bluewater Signals',
    submittedAtLabel: '2026-07-13 10:05',
    versionLabel: 'ModelVersion 1.3.1',
    marketLabel: 'Global ETF',
    riskLabel: 'Medium risk',
    riskTone: 'medium',
    leverageLabel: 'No leverage',
    assetScopeLabel: 'Equity ETFs, bond ETFs, cash-like exposure',
    mandateSummary:
      'Rotates between equity and fixed-income ETFs based on macro and news-traffic signals.',
    disclosureStatusLabel: 'Risk wording needs admin review',
    requiredReviewItems: [
      'Asset universe boundary',
      'News traffic data source label',
      'Rebalance policy',
      'Mock-only portfolio language'
    ],
    blockedActionLabel: 'Read-only review queue - no live status transition',
    strategySummary:
      'Rotates model-defined ETF exposure from macro, price trend, and news-traffic inputs without allowing user-side risk preference changes.',
    performanceSourceLabel: 'Sample backtest placeholder, needs source review',
    dataInputs: [
      'Mock macro trend basket',
      'Mock ETF price momentum',
      'Sample news traffic index'
    ],
    forbiddenAssets: [
      'Leveraged ETFs',
      'Derivatives',
      'Individual stock concentration',
      'Real deposits or withdrawals'
    ],
    reviewNotes: [
      'Check that stock/bond mix is described as the model mandate, not a user setting.',
      'Confirm data source labels are visibly marked as mock.',
      'Require rebalance policy wording before approval.'
    ]
  }
];

export function getPendingAdminReviewModelById(id: string) {
  return pendingAdminReviewModels.find((model) => model.id === id) ?? null;
}
