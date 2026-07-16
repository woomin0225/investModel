/**
 * Search suggestion seed/read-model fixture for mobile Search suggestion chips.
 * It keeps suggestions local and mock-seeded while IS-004 blocks live search,
 * quote, traffic, brokerage, account, paid API, and order-intent integrations.
 */

export type SearchSuggestionKind = 'topic' | 'model' | 'signal';

export type SearchSuggestionTone = 'neutral' | 'attention' | 'risk';

export type SearchSuggestionItem = {
  generatedFrom: 'deterministic_fixture' | 'db_seed_projection';
  suggestionPublicId: string;
  kind: SearchSuggestionKind;
  label: string;
  query: string;
  helper: string;
  tone: SearchSuggestionTone;
  sourceSurface: 'Search';
  safetyLabel: string;
  relatedPublicIds: string[];
  sourceMeta: {
    sourceTables: string[];
    mockOnly: true;
    seedOnly: true;
    localReadModelOnly: true;
    realtimeExternalData: false;
    externalSearchProvider: false;
    externalPaidApi: false;
    financialAdvice: false;
    modelSelectionCreated: false;
    tradeIntentCreated: false;
    realOrder: false;
    brokerageConnection: false;
  };
};

const searchSuggestionSafetyMeta = {
  sourceTables: [
    'search_query_logs',
    'investment_models',
    'model_signal_events',
    'feed_posts'
  ],
  mockOnly: true,
  seedOnly: true,
  localReadModelOnly: true,
  realtimeExternalData: false,
  externalSearchProvider: false,
  externalPaidApi: false,
  financialAdvice: false,
  modelSelectionCreated: false,
  tradeIntentCreated: false,
  realOrder: false,
  brokerageConnection: false
} as const;

export const searchSuggestionSeedFixture: SearchSuggestionItem[] = [
  {
    generatedFrom: 'deterministic_fixture',
    suggestionPublicId: 'search_suggestion_mock_ai_infra',
    kind: 'topic',
    label: 'AI infrastructure attention',
    query: 'AI infrastructure',
    helper: 'Seeded topic from FeedPosts and SignalEvents',
    tone: 'attention',
    sourceSurface: 'Search',
    safetyLabel:
      'Mock search suggestion only: no live search volume, live quote lookup, paid API, financial advice, order, or brokerage connection.',
    relatedPublicIds: [
      'feed_mock_001',
      'feed_mock_002',
      'sig_mock_news_traffic_001'
    ],
    sourceMeta: {
      ...searchSuggestionSafetyMeta,
      sourceTables: [...searchSuggestionSafetyMeta.sourceTables]
    }
  },
  {
    generatedFrom: 'deterministic_fixture',
    suggestionPublicId: 'search_suggestion_mock_model_market',
    kind: 'model',
    label: 'Demo Signal Observer',
    query: 'Demo Signal Observer',
    helper: 'Mock InvestmentModel discovery keyword',
    tone: 'neutral',
    sourceSurface: 'Search',
    safetyLabel:
      'Mock model suggestion only: opens local discovery context and does not select a model, create a TradeIntent, or place an order.',
    relatedPublicIds: ['model_demo_signal_001', 'version_demo_signal_001'],
    sourceMeta: {
      ...searchSuggestionSafetyMeta,
      sourceTables: [...searchSuggestionSafetyMeta.sourceTables]
    }
  },
  {
    generatedFrom: 'deterministic_fixture',
    suggestionPublicId: 'search_suggestion_mock_risk_watch',
    kind: 'signal',
    label: 'Risk watch context',
    query: 'risk watch',
    helper: 'Seeded SignalEvent and FeedPost caution context',
    tone: 'risk',
    sourceSurface: 'Search',
    safetyLabel:
      'Mock risk suggestion only: informational context without legal judgment, suitability approval, advice, orders, account data, or external providers.',
    relatedPublicIds: ['sig_mock_risk_001', 'feed_mock_003'],
    sourceMeta: {
      ...searchSuggestionSafetyMeta,
      sourceTables: [...searchSuggestionSafetyMeta.sourceTables]
    }
  }
];

function cloneFixture(): SearchSuggestionItem[] {
  return searchSuggestionSeedFixture.map((suggestion) => ({
    ...suggestion,
    relatedPublicIds: [...suggestion.relatedPublicIds],
    sourceMeta: {
      ...suggestion.sourceMeta,
      sourceTables: [...suggestion.sourceMeta.sourceTables]
    }
  }));
}

function suggestionFromLabel(input: {
  generatedFrom: 'db_seed_projection';
  suggestionPublicId: string;
  kind: SearchSuggestionKind;
  label: string;
  query: string;
  helper: string;
  tone: SearchSuggestionTone;
  relatedPublicIds: string[];
  safetyLabel: string;
}): SearchSuggestionItem {
  return {
    ...input,
    sourceSurface: 'Search',
    sourceMeta: {
      ...searchSuggestionSafetyMeta,
      sourceTables: [...searchSuggestionSafetyMeta.sourceTables]
    }
  };
}

async function readDbProjection(): Promise<SearchSuggestionItem[] | null> {
  const [{ readModelCardDtos }, { readSignalEventDtos }, { readFeedPostDtos }] =
    await Promise.all([
      import('@/lib/db/model-read-model'),
      import('@/lib/db/signal-read-model'),
      import('@/lib/db/feed-read-model')
    ]);

  const [models, signals, feedPosts] = await Promise.all([
    readModelCardDtos(8),
    readSignalEventDtos({ limit: 8 }),
    readFeedPostDtos({ limit: 8 })
  ]);

  if (models.length === 0 && signals.length === 0 && feedPosts.length === 0) {
    return null;
  }

  const suggestions: SearchSuggestionItem[] = [];
  const firstModel = models[0];
  const firstAttentionSignal =
    signals.find((signal) =>
      ['news_traffic', 'price_trend', 'model_inclusion'].includes(
        signal.signalType
      )
    ) ?? signals[0];
  const firstRiskSignal =
    signals.find((signal) => signal.signalType === 'risk') ?? signals[1];

  if (firstAttentionSignal || feedPosts.length > 0) {
    suggestions.push(
      suggestionFromLabel({
        generatedFrom: 'db_seed_projection',
        suggestionPublicId: 'search_suggestion_seed_attention',
        kind: 'topic',
        label: 'Seeded market attention',
        query: 'market attention',
        helper: 'DB seed FeedPost and SignalEvent keyword',
        tone: 'attention',
        safetyLabel:
          'DB seed topic suggestion only: no live search volume, live quote lookup, paid API, advice, order, or brokerage connection.',
        relatedPublicIds: [
          ...feedPosts.slice(0, 2).map((post) => post.postPublicId),
          ...(firstAttentionSignal ? [firstAttentionSignal.signalPublicId] : [])
        ]
      })
    );
  }

  if (firstModel) {
    suggestions.push(
      suggestionFromLabel({
        generatedFrom: 'db_seed_projection',
        suggestionPublicId: 'search_suggestion_seed_model',
        kind: 'model',
        label: firstModel.name,
        query: firstModel.name,
        helper: 'DB seed InvestmentModel discovery keyword',
        tone: 'neutral',
        safetyLabel:
          'DB seed model suggestion only: local discovery context without model selection, TradeIntent creation, order, or broker action.',
        relatedPublicIds: [
          firstModel.modelPublicId,
          firstModel.modelVersionPublicId
        ].filter((publicId): publicId is string => Boolean(publicId))
      })
    );
  }

  if (firstRiskSignal) {
    suggestions.push(
      suggestionFromLabel({
        generatedFrom: 'db_seed_projection',
        suggestionPublicId: 'search_suggestion_seed_risk',
        kind: 'signal',
        label: 'Seeded risk watch',
        query: 'risk watch',
        helper: 'DB seed SignalEvent caution keyword',
        tone: 'risk',
        safetyLabel:
          'DB seed risk suggestion only: informational context without legal judgment, suitability approval, advice, orders, account data, or external providers.',
        relatedPublicIds: [firstRiskSignal.signalPublicId]
      })
    );
  }

  return suggestions.length > 0 ? suggestions : null;
}

export async function readSearchSuggestionSeedFixture(): Promise<
  SearchSuggestionItem[]
> {
  if (!process.env.MYSQL_URL) {
    return cloneFixture();
  }

  try {
    const projection = await readDbProjection();
    return projection && projection.length > 0 ? projection : cloneFixture();
  } catch {
    return cloneFixture();
  }
}
