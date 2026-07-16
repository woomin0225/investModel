import { NextRequest } from 'next/server';

import {
  readSearchSuggestionSeedFixture,
  type SearchSuggestionItem,
  type SearchSuggestionKind
} from '@/lib/db/search-suggestion-read-model';
import {
  readSearchNoResultSeedFixture,
  type SearchNoResultCategory,
  type SearchNoResultGroup
} from '@/lib/db/search-no-result-read-model';
import type { AccessRole } from '@/lib/domain/types';
import {
  readInvestModelRole,
  readInvestModelSessionRole
} from '@/lib/server/invest-model-user-scope';

/**
 * This route reads seeded Search suggestion chips only.
 * It never performs live quote lookup, external search provider calls,
 * model selection, TradeIntent creation, orders, or brokerage actions.
 */

const searchSuggestionKinds = [
  'topic',
  'model',
  'signal'
] as const satisfies readonly SearchSuggestionKind[];

type ApiErrorCode = 'forbidden' | 'validation_error' | 'server_error';

type SearchSuggestionDto = SearchSuggestionItem & {
  href: string;
};

type SearchNoResultGroupDto = SearchNoResultGroup & {
  suggestedSearches: {
    query: string;
    href: string;
  }[];
};

function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown
) {
  return Response.json(
    {
      error: {
        code,
        message,
        details
      }
    },
    { status }
  );
}

function canReadSearchSuggestions(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

function parseLimit(value: string | null) {
  if (!value) {
    return {
      value: 6,
      isValid: true
    };
  }

  const trimmed = value.trim();
  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed) || `${parsed}` !== trimmed) {
    return {
      value: 6,
      isValid: false
    };
  }

  return {
    value: Math.min(Math.max(parsed, 1), 8),
    isValid: true
  };
}

function parseKind(value: string | null): SearchSuggestionKind | null {
  if (!value) {
    return null;
  }

  return searchSuggestionKinds.includes(value as SearchSuggestionKind)
    ? (value as SearchSuggestionKind)
    : null;
}

function normalizeQuery(value: string | null) {
  const query = (value ?? '').replace(/\s+/g, ' ').trim();

  if (query.length > 80) {
    return null;
  }

  return query;
}

function searchableIncludes(values: string[], query: string) {
  const normalizedQuery = query.toLocaleLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return values.join(' ').toLocaleLowerCase().includes(normalizedQuery);
}

function matchesSuggestion(suggestion: SearchSuggestionItem, query: string) {
  return searchableIncludes(
    [
      suggestion.label,
      suggestion.query,
      suggestion.helper,
      suggestion.kind,
      suggestion.tone,
      suggestion.safetyLabel
    ],
    query
  );
}

function toDto(suggestion: SearchSuggestionItem): SearchSuggestionDto {
  return {
    ...suggestion,
    relatedPublicIds: [...suggestion.relatedPublicIds],
    sourceMeta: {
      ...suggestion.sourceMeta,
      sourceTables: [...suggestion.sourceMeta.sourceTables]
    },
    href: `/invest-model/search?q=${encodeURIComponent(suggestion.query)}`
  };
}

function suggestionKindToNoResultCategory(
  kind: SearchSuggestionKind
): SearchNoResultCategory {
  if (kind === 'topic') {
    return 'feed';
  }

  return kind;
}

function toNoResultGroupDto(
  group: SearchNoResultGroup
): SearchNoResultGroupDto {
  return {
    ...group,
    suggestedKeywords: [...group.suggestedKeywords],
    sourceTables: [...group.sourceTables],
    relatedSuggestionPublicIds: [...group.relatedSuggestionPublicIds],
    sourceMeta: { ...group.sourceMeta },
    suggestedSearches: group.suggestedKeywords.map((keyword) => ({
      query: keyword,
      href: `/invest-model/search?q=${encodeURIComponent(keyword)}`
    }))
  };
}

function uniqueKeywords(groups: SearchNoResultGroupDto[]) {
  return Array.from(
    new Set(groups.flatMap((group) => group.suggestedKeywords))
  ).slice(0, 8);
}

function buildEmptyState(query: string, groups: SearchNoResultGroupDto[]) {
  return {
    title: 'No seeded suggestions matched',
    message: query
      ? 'Try another mock or seeded topic. Live quote lookup and external search providers are not connected.'
      : 'Seed Search suggestions will appear after mock or DB seed read-model rows are available.',
    groupedSuggestionCount: groups.length,
    safeFallbackKeywords: uniqueKeywords(groups),
    safetyLabel:
      'Grouped empty-state suggestions come from local seed/read-model rows only; no live quote lookup, external search provider, paid API, advice, order, deposit, or brokerage action is connected.'
  };
}

export async function GET(request: NextRequest) {
  const headerRole = readInvestModelRole(request);
  const role =
    headerRole === 'public'
      ? await readInvestModelSessionRole(request)
      : headerRole;

  if (!canReadSearchSuggestions(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read seeded Search suggestions.'
    );
  }

  const requestedKind = request.nextUrl.searchParams.get('kind');
  const kind = parseKind(requestedKind);

  if (requestedKind && !kind) {
    return errorResponse(
      422,
      'validation_error',
      'kind must be topic, model, or signal.',
      {
        kind: requestedKind
      }
    );
  }

  const requestedLimit = request.nextUrl.searchParams.get('limit');
  const limit = parseLimit(requestedLimit);

  if (!limit.isValid) {
    return errorResponse(
      422,
      'validation_error',
      'limit must be an integer between 1 and 8.',
      {
        limit: requestedLimit
      }
    );
  }

  const query = normalizeQuery(request.nextUrl.searchParams.get('q'));

  if (query === null) {
    return errorResponse(
      422,
      'validation_error',
      'q must be 80 characters or fewer after whitespace normalization.'
    );
  }

  try {
    const [fixture, noResultFixture] = await Promise.all([
      readSearchSuggestionSeedFixture(),
      readSearchNoResultSeedFixture()
    ]);
    const suggestions = fixture
      .filter((suggestion) => !kind || suggestion.kind === kind)
      .filter((suggestion) => matchesSuggestion(suggestion, query))
      .slice(0, limit.value)
      .map(toDto);
    const noResultGroups = noResultFixture
      .filter(
        (group) => !kind || group.category === suggestionKindToNoResultCategory(kind)
      )
      .map(toNoResultGroupDto);
    const recentMockTerms = fixture
      .slice(0, 5)
      .map((suggestion) => suggestion.query);
    const groupedEmptyState =
      suggestions.length === 0
        ? {
            query,
            groups: noResultGroups,
            safetyMeta: {
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
            }
          }
        : null;

    return Response.json({
      data: {
        suggestions,
        recentMockTerms,
        noResultGroups: suggestions.length === 0 ? noResultGroups : [],
        groupedEmptyState,
        emptyState:
          suggestions.length === 0
            ? buildEmptyState(query, noResultGroups)
            : null,
        safetySummary:
          'Seeded suggestions are read-only discovery shortcuts, not live market search, investment advice, model selection, orders, or brokerage actions.'
      },
      meta: {
        routeStatus: 'fixture_or_db_seed_projection',
        contract: 'SearchSuggestionDto',
        persistence: 'read_only_seed_projection',
        sourceTables: [
          'search_query_logs',
          'investment_models',
          'model_signal_events',
          'feed_posts'
        ],
        query,
        kindFilter: kind,
        limit: limit.value,
        counts: {
          suggestions: suggestions.length,
          recentMockTerms: recentMockTerms.length,
          noResultGroups:
            suggestions.length === 0 ? noResultGroups.length : 0
        },
        dataContext: 'mock_or_seed',
        readOnly: true,
        suggestionChipsOnly: true,
        groupedEmptyStateOnly: suggestions.length === 0,
        localReadModelOnly: true,
        realtimeExternalData: false,
        externalSearchProvider: false,
        liveQuoteLookup: false,
        externalPaidApi: false,
        financialAdvice: false,
        modelSelectionCreated: false,
        tradeIntentCreated: false,
        realOrder: false,
        realDeposit: false,
        accountData: false,
        brokerageConnection: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Search suggestions could not be read. No live quote lookup, model selection, order, TradeIntent, brokerage action, or advice was created.'
    );
  }
}
