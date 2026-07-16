/**
 * Verifies GET /api/search/suggestions seeded Search suggestion chips.
 * It is read-only and never performs live quote lookup, external search,
 * model selection, TradeIntent creation, orders, or brokerage actions.
 */

import { NextRequest } from 'next/server';

import { GET } from '../../app/api/search/suggestions/route';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function readSuggestions(search = '', role = 'user') {
  return GET(
    new NextRequest(`http://localhost/api/search/suggestions${search}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': role
      }
    })
  );
}

async function main() {
  const publicResponse = await GET(
    new NextRequest('http://localhost/api/search/suggestions', {
      method: 'GET'
    })
  );
  const creatorResponse = await readSuggestions('', 'creator');
  const emptyQueryResponse = await readSuggestions();
  const emptyQueryJson = await emptyQueryResponse.json();
  const kindResponse = await readSuggestions('?kind=model&limit=1');
  const kindJson = await kindResponse.json();
  const normalizedResponse = await readSuggestions('?q=AI%20%20infrastructure');
  const normalizedJson = await normalizedResponse.json();
  const noMatchResponse = await readSuggestions('?q=zzzzzzzz');
  const noMatchJson = await noMatchResponse.json();
  const invalidKindResponse = await readSuggestions('?kind=quote');
  const invalidLimitResponse = await readSuggestions('?limit=abc');
  const longQueryResponse = await readSuggestions(`?q=${'x'.repeat(81)}`);

  assertCondition(publicResponse.status === 403, 'public role is forbidden');
  assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
  assertCondition(emptyQueryResponse.status === 200, 'empty query responds');
  assertCondition(kindResponse.status === 200, 'kind-filtered query responds');
  assertCondition(
    normalizedResponse.status === 200,
    'whitespace-normalized query responds'
  );
  assertCondition(noMatchResponse.status === 200, 'no-match query responds');
  assertCondition(invalidKindResponse.status === 422, 'invalid kind returns 422');
  assertCondition(
    invalidLimitResponse.status === 422,
    'invalid limit returns 422'
  );
  assertCondition(longQueryResponse.status === 422, 'long q returns 422');

  assertCondition(
    Array.isArray(emptyQueryJson.data?.suggestions) &&
      emptyQueryJson.data.suggestions.length >= 3 &&
      Array.isArray(emptyQueryJson.data?.recentMockTerms),
    'suggestions API returns chips and recent mock terms'
  );
  assertCondition(
    emptyQueryJson.data.suggestions.every(
      (item: {
        suggestionPublicId?: string;
        href?: string;
        sourceMeta?: Record<string, unknown>;
      }) =>
        item.suggestionPublicId?.startsWith('search_suggestion_') &&
        typeof item.href === 'string' &&
        item.sourceMeta?.mockOnly === true &&
        item.sourceMeta?.seedOnly === true &&
        item.sourceMeta?.localReadModelOnly === true &&
        item.sourceMeta?.realtimeExternalData === false &&
        item.sourceMeta?.externalSearchProvider === false &&
        item.sourceMeta?.externalPaidApi === false &&
        item.sourceMeta?.financialAdvice === false &&
        item.sourceMeta?.modelSelectionCreated === false &&
        item.sourceMeta?.tradeIntentCreated === false &&
        item.sourceMeta?.realOrder === false &&
        item.sourceMeta?.brokerageConnection === false
    ),
    'suggestion chips preserve seed-only safety meta'
  );
  assertCondition(
    kindJson.data.suggestions.length === 1 &&
      kindJson.data.suggestions.every(
        (item: { kind?: string }) => item.kind === 'model'
      ) &&
      kindJson.meta?.kindFilter === 'model' &&
      kindJson.meta?.limit === 1,
    'kind and limit filters are applied'
  );
  assertCondition(
    normalizedJson.meta?.query === 'AI infrastructure' &&
      normalizedJson.data.suggestions.length >= 1,
    'q is whitespace-normalized and matched'
  );
  assertCondition(
    noMatchJson.data.suggestions.length === 0 &&
      noMatchJson.data.emptyState?.message.includes('Live quote lookup'),
    'no-match response returns a safe empty state'
  );
  assertCondition(
    emptyQueryJson.meta?.routeStatus === 'fixture_or_db_seed_projection' &&
      emptyQueryJson.meta?.persistence === 'read_only_seed_projection' &&
      emptyQueryJson.meta?.readOnly === true &&
      emptyQueryJson.meta?.suggestionChipsOnly === true &&
      emptyQueryJson.meta?.localReadModelOnly === true &&
      emptyQueryJson.meta?.realtimeExternalData === false &&
      emptyQueryJson.meta?.externalSearchProvider === false &&
      emptyQueryJson.meta?.liveQuoteLookup === false &&
      emptyQueryJson.meta?.externalPaidApi === false &&
      emptyQueryJson.meta?.financialAdvice === false &&
      emptyQueryJson.meta?.modelSelectionCreated === false &&
      emptyQueryJson.meta?.tradeIntentCreated === false &&
      emptyQueryJson.meta?.realOrder === false &&
      emptyQueryJson.meta?.brokerageConnection === false,
    'suggestions API keeps mock-safe route meta'
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
