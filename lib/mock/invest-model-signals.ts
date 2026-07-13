/**
 * investModel signal mock data represents observed market/news inputs for UI development only.
 * These SignalEvent records must not be interpreted as buy, sell, or hold recommendations.
 */

export type MockSignalEvent = {
  id: string;
  rank: number;
  title: string;
  description: string;
  sourceLabel: string;
  scoreLabel: string;
  scoreTone: 'low' | 'medium' | 'high';
  freshnessLabel: string;
  linkedModelName: string;
  marketLabel: string;
  statusLabel: string;
};

export const investModelSignalsMock = {
  summary: {
    title: 'Realtime signal monitor',
    description:
      'Mock signals combine news traffic, price momentum, and model attention for mobile UI testing. They do not create TradeIntent or live orders.',
    activeCountLabel: '6 mock signals',
    latencyLabel: '12s sample lag',
    blockedLabel: '0 live orders'
  },
  filters: ['All signals', 'News traffic', 'Price trend', 'Risk alert'],
  signals: [
    {
      id: 'signal-ai-chip-news-traffic',
      rank: 1,
      title: 'AI chip headlines accelerating',
      description:
        'News traffic and pre-market mentions are elevated across semiconductor leaders watched by Quant US Leverage Alpha.',
      sourceLabel: 'News traffic',
      scoreLabel: '92 score',
      scoreTone: 'high',
      freshnessLabel: '2m ago',
      linkedModelName: 'Quant US Leverage Alpha',
      marketLabel: 'US equities',
      statusLabel: 'Observation only'
    },
    {
      id: 'signal-bond-yield-cooling',
      rank: 2,
      title: 'Short-term yields cooling',
      description:
        'Bond ETF momentum improved in the mock macro basket while equity volatility stayed contained.',
      sourceLabel: 'Price trend',
      scoreLabel: '78 score',
      scoreTone: 'medium',
      freshnessLabel: '7m ago',
      linkedModelName: 'Macro ETF Balance',
      marketLabel: 'Global ETF',
      statusLabel: 'Simulation input'
    },
    {
      id: 'signal-drawdown-guard',
      rank: 3,
      title: 'Drawdown guard near threshold',
      description:
        'Defensive Income Rotation is close to a mock risk-off threshold after a multi-day volatility pickup.',
      sourceLabel: 'Risk alert',
      scoreLabel: '71 score',
      scoreTone: 'medium',
      freshnessLabel: '11m ago',
      linkedModelName: 'Defensive Income Rotation',
      marketLabel: 'US income',
      statusLabel: 'Policy check only'
    },
    {
      id: 'signal-consumer-traffic-fade',
      rank: 4,
      title: 'Consumer traffic fading',
      description:
        'Retail and discretionary topic volume fell in the sample feed, lowering attention for growth-biased models.',
      sourceLabel: 'News traffic',
      scoreLabel: '58 score',
      scoreTone: 'low',
      freshnessLabel: '19m ago',
      linkedModelName: 'Macro ETF Balance',
      marketLabel: 'US sectors',
      statusLabel: 'Observation only'
    }
  ] satisfies MockSignalEvent[]
};
