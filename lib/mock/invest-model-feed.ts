/**
 * investModel feed mock data represents model and market commentary for UI development.
 * FeedPost entries are informational placeholders, not investment advice or performance guarantees.
 */

export type MockFeedPost = {
  id: string;
  title: string;
  excerpt: string;
  authorLabel: string;
  sourceLabel: string;
  linkedModelName: string;
  timeLabel: string;
  typeLabel: string;
  tone: 'neutral' | 'low' | 'medium' | 'high';
  tags: string[];
};

export const investModelFeedMock = {
  summary: {
    title: 'Model insight feed',
    description:
      'Mock commentary from approved models and operators. Posts explain observed signals and mandate context without recommending trades.',
    postCountLabel: '5 mock posts',
    sourceCountLabel: '3 model sources',
    reviewLabel: 'No legal copy'
  },
  filters: ['All posts', 'Model notes', 'Market context', 'Risk notes'],
  posts: [
    {
      id: 'feed-leverage-alpha-chip-context',
      title: 'Why chip momentum is elevated in the sample feed',
      excerpt:
        'Quant US Leverage Alpha flags higher semiconductor attention, but the post remains an observation and does not change user preferences or place orders.',
      authorLabel: 'Model commentary',
      sourceLabel: 'Mock news traffic',
      linkedModelName: 'Quant US Leverage Alpha',
      timeLabel: '4m ago',
      typeLabel: 'Model note',
      tone: 'high',
      tags: ['AI chips', 'Momentum', 'High risk']
    },
    {
      id: 'feed-macro-etf-yield-context',
      title: 'ETF blend watches cooling short-term yields',
      excerpt:
        'Macro ETF Balance records lower sample yield pressure and keeps its mandate explanation focused on allocation context, not advice.',
      authorLabel: 'Model commentary',
      sourceLabel: 'Mock price trend',
      linkedModelName: 'Macro ETF Balance',
      timeLabel: '12m ago',
      typeLabel: 'Market context',
      tone: 'medium',
      tags: ['Bond ETF', 'Macro', 'Backtest']
    },
    {
      id: 'feed-defensive-income-risk-note',
      title: 'Risk-off guard remains close to threshold',
      excerpt:
        'Defensive Income Rotation explains the mock drawdown guard and highlights that simulated portfolio states are not real assets.',
      authorLabel: 'Operator review',
      sourceLabel: 'Mock policy check',
      linkedModelName: 'Defensive Income Rotation',
      timeLabel: '21m ago',
      typeLabel: 'Risk note',
      tone: 'medium',
      tags: ['Drawdown', 'Income', 'Mock portfolio']
    },
    {
      id: 'feed-review-queue-disclosure',
      title: 'Disclosure review queue placeholder',
      excerpt:
        'Legal and financial disclosure language is intentionally left as a placeholder until a qualified reviewer supplies final wording.',
      authorLabel: 'Compliance placeholder',
      sourceLabel: 'Internal mock',
      linkedModelName: 'All models',
      timeLabel: '38m ago',
      typeLabel: 'Review note',
      tone: 'neutral',
      tags: ['Placeholder', 'Review required']
    },
    {
      id: 'feed-consumer-traffic-fade',
      title: 'Consumer topic volume fades in sample data',
      excerpt:
        'The mock feed records lower consumer-sector attention for UI testing and keeps the interpretation separate from TradeIntent creation.',
      authorLabel: 'Market monitor',
      sourceLabel: 'Mock news traffic',
      linkedModelName: 'Macro ETF Balance',
      timeLabel: '46m ago',
      typeLabel: 'Market context',
      tone: 'low',
      tags: ['Consumer', 'Traffic', 'Observation']
    }
  ] satisfies MockFeedPost[]
};
