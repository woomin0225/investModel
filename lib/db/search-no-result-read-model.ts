/**
 * Search no-result seed/read-model fixture for mobile Search empty states.
 * It groups safe fallback keywords by model, feed, and signal categories while
 * IS-004 blocks live search volume, external providers, quotes, paid APIs,
 * orders, deposits, brokerage connections, account data, and financial advice.
 */

export type SearchNoResultCategory = 'model' | 'feed' | 'signal';

export type SearchNoResultTone = 'neutral' | 'attention' | 'risk';

export type SearchNoResultGroup = {
  generatedFrom: 'deterministic_fixture' | 'db_seed_projection';
  groupPublicId: string;
  category: SearchNoResultCategory;
  title: string;
  emptyMessage: string;
  suggestedKeywords: string[];
  helper: string;
  tone: SearchNoResultTone;
  sourceSurface: 'Search';
  sourceTables: string[];
  relatedSuggestionPublicIds: string[];
  safetyLabel: string;
  sourceMeta: {
    mockOnly: true;
    seedOnly: true;
    localReadModelOnly: true;
    emptyStateOnly: true;
    realtimeExternalData: false;
    externalSearchProvider: false;
    liveQuoteLookup: false;
    externalPaidApi: false;
    financialAdvice: false;
    modelSelectionCreated: false;
    tradeIntentCreated: false;
    realOrder: false;
    realDeposit: false;
    brokerageConnection: false;
    accountData: false;
  };
};

const noResultSafetyMeta = {
  mockOnly: true,
  seedOnly: true,
  localReadModelOnly: true,
  emptyStateOnly: true,
  realtimeExternalData: false,
  externalSearchProvider: false,
  liveQuoteLookup: false,
  externalPaidApi: false,
  financialAdvice: false,
  modelSelectionCreated: false,
  tradeIntentCreated: false,
  realOrder: false,
  realDeposit: false,
  brokerageConnection: false,
  accountData: false
} as const;

export const searchNoResultSeedFixture: SearchNoResultGroup[] = [
  {
    generatedFrom: 'deterministic_fixture',
    groupPublicId: 'search_no_result_mock_model_keywords',
    category: 'model',
    title: 'Try a model discovery keyword',
    emptyMessage:
      'No InvestmentModel matched this search. Try local model discovery terms seeded from marketplace rows.',
    suggestedKeywords: [
      'Demo Signal Observer',
      'income model',
      'risk balanced model'
    ],
    helper: 'Seeded InvestmentModel fallback keywords',
    tone: 'neutral',
    sourceSurface: 'Search',
    sourceTables: ['investment_models', 'model_versions'],
    relatedSuggestionPublicIds: ['search_suggestion_mock_model_market'],
    safetyLabel:
      'Model no-result fallback only: local seed keywords do not select a model, create a TradeIntent, place an order, or connect brokerage.',
    sourceMeta: noResultSafetyMeta
  },
  {
    generatedFrom: 'deterministic_fixture',
    groupPublicId: 'search_no_result_mock_feed_keywords',
    category: 'feed',
    title: 'Try an informational FeedPost keyword',
    emptyMessage:
      'No FeedPost matched this search. Try local feed context terms from seeded informational posts.',
    suggestedKeywords: [
      'AI infrastructure',
      'market attention',
      'risk disclosure'
    ],
    helper: 'Seeded FeedPost fallback keywords',
    tone: 'attention',
    sourceSurface: 'Search',
    sourceTables: ['feed_posts'],
    relatedSuggestionPublicIds: ['search_suggestion_mock_ai_infra'],
    safetyLabel:
      'Feed no-result fallback only: informational seed context without live feeds, paid APIs, advice, orders, deposits, or brokerage.',
    sourceMeta: noResultSafetyMeta
  },
  {
    generatedFrom: 'deterministic_fixture',
    groupPublicId: 'search_no_result_mock_signal_keywords',
    category: 'signal',
    title: 'Try an observed SignalEvent keyword',
    emptyMessage:
      'No SignalEvent matched this search. Try local observed-signal terms from seeded SignalEvent rows.',
    suggestedKeywords: ['risk watch', 'price trend', 'news traffic'],
    helper: 'Seeded SignalEvent fallback keywords',
    tone: 'risk',
    sourceSurface: 'Search',
    sourceTables: ['model_signal_events'],
    relatedSuggestionPublicIds: ['search_suggestion_mock_risk_watch'],
    safetyLabel:
      'Signal no-result fallback only: observed seed context without realtime external data, live quotes, advice, orders, account data, or brokerage.',
    sourceMeta: noResultSafetyMeta
  }
];

function cloneNoResultFixture(groups = searchNoResultSeedFixture) {
  return groups.map((group) => ({
    ...group,
    suggestedKeywords: [...group.suggestedKeywords],
    sourceTables: [...group.sourceTables],
    relatedSuggestionPublicIds: [...group.relatedSuggestionPublicIds],
    sourceMeta: { ...group.sourceMeta }
  }));
}

function buildDbProjectionGroup(input: {
  category: SearchNoResultCategory;
  title: string;
  emptyMessage: string;
  suggestedKeywords: string[];
  relatedSuggestionPublicIds: string[];
  sourceTables: string[];
  tone: SearchNoResultTone;
  helper: string;
  safetyLabel: string;
}): SearchNoResultGroup {
  return {
    generatedFrom: 'db_seed_projection',
    groupPublicId: `search_no_result_seed_${input.category}_keywords`,
    sourceSurface: 'Search',
    ...input,
    sourceMeta: { ...noResultSafetyMeta }
  };
}

async function readDbProjection(): Promise<SearchNoResultGroup[] | null> {
  const { readSearchSuggestionSeedFixture } = await import(
    '@/lib/db/search-suggestion-read-model'
  );
  const suggestions = await readSearchSuggestionSeedFixture();

  if (suggestions.length === 0) {
    return null;
  }

  const byKind = {
    model: suggestions.filter((suggestion) => suggestion.kind === 'model'),
    feed: suggestions.filter((suggestion) => suggestion.kind === 'topic'),
    signal: suggestions.filter((suggestion) => suggestion.kind === 'signal')
  };
  const groups: SearchNoResultGroup[] = [];

  if (byKind.model.length > 0) {
    groups.push(
      buildDbProjectionGroup({
        category: 'model',
        title: 'Try a seeded model keyword',
        emptyMessage:
          'No InvestmentModel matched this search. These fallback terms come from local InvestmentModel suggestion seeds.',
        suggestedKeywords: byKind.model
          .slice(0, 3)
          .map((suggestion) => suggestion.query),
        relatedSuggestionPublicIds: byKind.model.map(
          (suggestion) => suggestion.suggestionPublicId
        ),
        sourceTables: ['investment_models', 'model_versions'],
        tone: 'neutral',
        helper: 'DB seed InvestmentModel fallback keywords',
        safetyLabel:
          'DB seed model fallback only: no model selection, TradeIntent, order, deposit, broker action, live quote, paid API, or advice.'
      })
    );
  }

  if (byKind.feed.length > 0) {
    groups.push(
      buildDbProjectionGroup({
        category: 'feed',
        title: 'Try a seeded feed topic',
        emptyMessage:
          'No FeedPost matched this search. These fallback terms come from local FeedPost and topic suggestion seeds.',
        suggestedKeywords: byKind.feed
          .slice(0, 3)
          .map((suggestion) => suggestion.query),
        relatedSuggestionPublicIds: byKind.feed.map(
          (suggestion) => suggestion.suggestionPublicId
        ),
        sourceTables: ['feed_posts', 'search_query_logs'],
        tone: 'attention',
        helper: 'DB seed FeedPost fallback keywords',
        safetyLabel:
          'DB seed feed fallback only: informational context without live feeds, paid APIs, orders, deposits, brokerage, or financial advice.'
      })
    );
  }

  if (byKind.signal.length > 0) {
    groups.push(
      buildDbProjectionGroup({
        category: 'signal',
        title: 'Try a seeded signal keyword',
        emptyMessage:
          'No SignalEvent matched this search. These fallback terms come from local observed SignalEvent suggestion seeds.',
        suggestedKeywords: byKind.signal
          .slice(0, 3)
          .map((suggestion) => suggestion.query),
        relatedSuggestionPublicIds: byKind.signal.map(
          (suggestion) => suggestion.suggestionPublicId
        ),
        sourceTables: ['model_signal_events'],
        tone: 'risk',
        helper: 'DB seed SignalEvent fallback keywords',
        safetyLabel:
          'DB seed signal fallback only: observed input context without realtime external data, live quotes, advice, orders, account data, or brokerage.'
      })
    );
  }

  return groups.length > 0 ? groups : null;
}

export async function readSearchNoResultSeedFixture(): Promise<
  SearchNoResultGroup[]
> {
  if (!process.env.MYSQL_URL) {
    return cloneNoResultFixture();
  }

  try {
    const projection = await readDbProjection();
    return projection && projection.length > 0
      ? cloneNoResultFixture(projection)
      : cloneNoResultFixture();
  } catch {
    return cloneNoResultFixture();
  }
}
