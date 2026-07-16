/**
 * Portfolio insight read model for mock allocation rationale and status history.
 * It projects deterministic seed rows only; it never represents real balances,
 * broker activity, order execution, suitability, or investment advice.
 */
import { portfolioMockSafetyMeta } from '@/lib/domain/portfolio/portfolio-summary';

export type PortfolioInsightSourceTable =
  | 'users'
  | 'user_model_selections'
  | 'investment_models'
  | 'model_versions'
  | 'mock_deposits'
  | 'portfolios'
  | 'portfolio_positions'
  | 'allocation_decisions'
  | 'trade_intents'
  | 'portfolio_analysis_snapshots';

export type InvestModelPortfolioInsightRationale = {
  insightId: string;
  label: string;
  detail: string;
  evidenceLabel: string;
  sourceTables: PortfolioInsightSourceTable[];
  safetyLabel: 'mock rationale only';
};

export type InvestModelPortfolioInsightTimelineItem = {
  timelineId: string;
  state: 'mock_deposit_ready' | 'model_selected' | 'allocation_reviewed' | 'policy_blocked';
  previousStatus: string;
  nextStatus: string;
  actorRole: 'mock_seed' | 'policy_guard';
  reasonCode:
    | 'mock_deposit_seeded'
    | 'model_selection_seeded'
    | 'allocation_rationale_seeded'
    | 'trade_intent_policy_blocked';
  changedAt: string;
  occurredAtLabel: string;
  headline: string;
  detail: string;
  sourceTables: PortfolioInsightSourceTable[];
  safetyLabel: 'read-only timeline';
};

export type InvestModelPortfolioInsight = {
  isMockOnly: true;
  safetyMeta: typeof portfolioMockSafetyMeta;
  seedSourceLabel: 'seed_008_portfolio_insight_read_model';
  sourceTables: [
    'users',
    'user_model_selections',
    'investment_models',
    'model_versions',
    'mock_deposits',
    'portfolios',
    'portfolio_positions',
    'allocation_decisions',
    'trade_intents',
    'portfolio_analysis_snapshots'
  ];
  portfolioPublicId: 'portfolio_demo_001';
  selectedModel: {
    selectionPublicId: 'selection_demo_signal_001';
    modelPublicId: 'model_demo_signal_guard';
    modelVersionLabel: 'ModelVersion v1.0 DB mock';
    statusLabel: 'active mock';
  };
  allocationRationales: InvestModelPortfolioInsightRationale[];
  statusTimeline: InvestModelPortfolioInsightTimelineItem[];
  displayHints: {
    cardTitle: 'Mock portfolio insights';
    rationaleTitle: 'Allocation rationale';
    timelineTitle: 'Model status timeline';
    safetyLine: string;
  };
};

const portfolioInsightSourceTables: InvestModelPortfolioInsight['sourceTables'] = [
  'users',
  'user_model_selections',
  'investment_models',
  'model_versions',
  'mock_deposits',
  'portfolios',
  'portfolio_positions',
  'allocation_decisions',
  'trade_intents',
  'portfolio_analysis_snapshots'
];

const allocationRationales: InvestModelPortfolioInsightRationale[] = [
  {
    insightId: 'insight_allocation_ai_infra',
    label: 'AI infrastructure sleeve',
    detail:
      'The seed allocation keeps the SAMPLE_AI_BASKET exposure as simulated evidence from the existing PortfolioPosition rows.',
    evidenceLabel: 'portfolio_positions + allocation_decisions',
    sourceTables: ['portfolio_positions', 'allocation_decisions'],
    safetyLabel: 'mock rationale only'
  },
  {
    insightId: 'insight_allocation_buffer',
    label: 'Mock cash-like buffer',
    detail:
      'The SHV sample row keeps a cash-like simulated buffer visible without describing usable cash or an external account.',
    evidenceLabel: 'mock_deposits + portfolio_positions',
    sourceTables: ['mock_deposits', 'portfolio_positions'],
    safetyLabel: 'mock rationale only'
  },
  {
    insightId: 'insight_policy_boundary',
    label: 'Policy boundary remains blocked',
    detail:
      'The related TradeIntent row is retained as a blocked pre-order simulation so the UI can explain that no execution path exists.',
    evidenceLabel: 'allocation_decisions + trade_intents',
    sourceTables: ['allocation_decisions', 'trade_intents'],
    safetyLabel: 'mock rationale only'
  }
];

const statusTimeline: InvestModelPortfolioInsightTimelineItem[] = [
  {
    timelineId: 'timeline_mock_deposit_ready',
    state: 'mock_deposit_ready',
    previousStatus: 'not_seeded',
    nextStatus: 'mock_context_ready',
    actorRole: 'mock_seed',
    reasonCode: 'mock_deposit_seeded',
    changedAt: '2026-07-14T10:30:00Z',
    occurredAtLabel: '2026-07-14 10:30 UTC',
    headline: 'MockDeposit context ready',
    detail:
      'Seeded mock funding context is available only as simulated PortfolioSummary input.',
    sourceTables: ['mock_deposits', 'portfolios'],
    safetyLabel: 'read-only timeline'
  },
  {
    timelineId: 'timeline_model_selected',
    state: 'model_selected',
    previousStatus: 'unselected',
    nextStatus: 'selected_for_simulation',
    actorRole: 'mock_seed',
    reasonCode: 'model_selection_seeded',
    changedAt: '2026-07-14T10:35:00Z',
    occurredAtLabel: '2026-07-14 10:35 UTC',
    headline: 'Model selected for simulation',
    detail:
      'The active user_model_selection points to the demo model version and is not a suitability decision.',
    sourceTables: ['user_model_selections', 'investment_models', 'model_versions'],
    safetyLabel: 'read-only timeline'
  },
  {
    timelineId: 'timeline_allocation_reviewed',
    state: 'allocation_reviewed',
    previousStatus: 'simulation_ready',
    nextStatus: 'rationale_reviewed',
    actorRole: 'mock_seed',
    reasonCode: 'allocation_rationale_seeded',
    changedAt: '2026-07-14T10:45:00Z',
    occurredAtLabel: '2026-07-14 10:45 UTC',
    headline: 'Allocation rationale reviewed',
    detail:
      'The AllocationDecision rationale is screen evidence for mock analysis, not advice or a rebalance command.',
    sourceTables: ['allocation_decisions', 'portfolio_analysis_snapshots'],
    safetyLabel: 'read-only timeline'
  },
  {
    timelineId: 'timeline_policy_blocked',
    state: 'policy_blocked',
    previousStatus: 'pre_order_simulation',
    nextStatus: 'blocked_policy_check',
    actorRole: 'policy_guard',
    reasonCode: 'trade_intent_policy_blocked',
    changedAt: '2026-07-14T10:50:00Z',
    occurredAtLabel: '2026-07-14 10:50 UTC',
    headline: 'Execution boundary blocked',
    detail:
      'The TradeIntent remains blocked by policy because real orders and broker connections are outside this MVP.',
    sourceTables: ['trade_intents', 'portfolio_analysis_snapshots'],
    safetyLabel: 'read-only timeline'
  }
];

export async function readInvestModelPortfolioInsight(): Promise<InvestModelPortfolioInsight> {
  return {
    isMockOnly: true,
    safetyMeta: portfolioMockSafetyMeta,
    seedSourceLabel: 'seed_008_portfolio_insight_read_model',
    sourceTables: portfolioInsightSourceTables,
    portfolioPublicId: 'portfolio_demo_001',
    selectedModel: {
      selectionPublicId: 'selection_demo_signal_001',
      modelPublicId: 'model_demo_signal_guard',
      modelVersionLabel: 'ModelVersion v1.0 DB mock',
      statusLabel: 'active mock'
    },
    allocationRationales: allocationRationales.map((rationale) => ({
      ...rationale,
      sourceTables: [...rationale.sourceTables]
    })),
    statusTimeline: statusTimeline.map((item) => ({
      ...item,
      sourceTables: [...item.sourceTables]
    })),
    displayHints: {
      cardTitle: 'Mock portfolio insights',
      rationaleTitle: 'Allocation rationale',
      timelineTitle: 'Model status timeline',
      safetyLine:
        'Portfolio insights are mock seed/read-model rows only; no real deposit, real balance, order execution, broker connection, or financial advice.'
    }
  };
}

export const portfolioInsightSeedFixture = {
  sourceTables: [...portfolioInsightSourceTables],
  allocationRationales: allocationRationales.map((rationale) => ({ ...rationale })),
  statusTimeline: statusTimeline.map((item) => ({ ...item }))
};
