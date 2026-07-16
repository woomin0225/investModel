import { NextRequest } from 'next/server';

import {
  readSearchSuggestionSeedFixture,
  type SearchSuggestionItem,
  type SearchSuggestionKind
} from '@/lib/db/search-suggestion-read-model';
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

function buildEmptyState(query: string) {
  return {
    title: 'No seeded suggestions matched',
    message: query
      ? 'Try another mock or seeded topic. Live quote lookup and external search providers are not connected.'
      : 'Seed Search suggestions will appear after mock or DB seed read-model rows are available.'
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
    const fixture = await readSearchSuggestionSeedFixture();
    const suggestions = fixture
      .filter((suggestion) => !kind || suggestion.kind === kind)
      .filter((suggestion) => matchesSuggestion(suggestion, query))
      .slice(0, limit.value)
      .map(toDto);
    const recentMockTerms = fixture
      .slice(0, 5)
      .map((suggestion) => suggestion.query);

    return Response.json({
      data: {
        suggestions,
        recentMockTerms,
        emptyState: suggestions.length === 0 ? buildEmptyState(query) : null,
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
          recentMockTerms: recentMockTerms.length
        },
        dataContext: 'mock_or_seed',
        readOnly: true,
        suggestionChipsOnly: true,
        localReadModelOnly: true,
        realtimeExternalData: false,
        externalSearchProvider: false,
        liveQuoteLookup: false,
        externalPaidApi: false,
        financialAdvice: false,
        modelSelectionCreated: false,
        tradeIntentCreated: false,
        realOrder: false,
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
