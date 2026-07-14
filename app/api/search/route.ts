import { NextRequest } from 'next/server';

import { readFeedPostDtos } from '@/lib/db/feed-read-model';
import { readSignalEventDtos } from '@/lib/db/signal-read-model';
import type { FeedPostDto } from '@/lib/domain/feed/feed-post';
import type { SignalEventDto } from '@/lib/domain/signals/signal-event';
import type { AccessRole } from '@/lib/domain/types';
import {
  investModelCopy,
  isPublicDiscoverableInvestmentModel
} from '@/lib/i18n/invest-model';

/**
 * This route groups read-only search results for model discovery, FeedPost, and SignalEvent surfaces.
 * It never creates recommendations, model selections, TradeIntent rows, orders, or brokerage actions.
 */

type ApiErrorCode = 'forbidden' | 'validation_error' | 'server_error';

type SearchableInvestmentModel = (typeof investModelCopy.en.models.models)[number];

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

function readRole(request: NextRequest): AccessRole {
  const role = request.headers.get('x-invest-model-role');

  if (
    role === 'public' ||
    role === 'user' ||
    role === 'creator' ||
    role === 'admin' ||
    role === 'system'
  ) {
    return role;
  }

  return 'public';
}

function canReadSearch(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase();
}

function parseQuery(value: string | null) {
  const query = (value ?? '').trim();

  if (query.length > 120) {
    return null;
  }

  return query;
}

function searchableIncludes(values: Array<string | null | undefined>, query: string) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  return values
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase()
    .includes(normalizedQuery);
}

function matchesFeedPostSearch(post: FeedPostDto, query: string) {
  return searchableIncludes(
    [
      post.title,
      post.body,
      post.linkedModelName,
      post.authorDisplayName,
      post.postType,
      ...post.tags
    ],
    query
  );
}

function matchesSignalEventSearch(signal: SignalEventDto, query: string) {
  return searchableIncludes(
    [
      signal.title,
      signal.summary,
      signal.linkedModelName,
      signal.signalType,
      signal.sourceLabel,
      signal.scoreDisplay
    ],
    query
  );
}

function matchesInvestmentModelSearch(
  model: SearchableInvestmentModel,
  query: string
) {
  return searchableIncludes(
    [
      model.name,
      model.summary,
      model.market,
      model.riskLabel,
      model.performanceLabel,
      model.mandateLabel,
      model.reviewLabel,
      model.simulatedAumLabel,
      model.status,
      ...model.tags
    ],
    query
  );
}

export async function GET(request: NextRequest) {
  const role = readRole(request);

  if (!canReadSearch(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read grouped investModel search results.'
    );
  }

  const query = parseQuery(request.nextUrl.searchParams.get('q'));

  if (query === null) {
    return errorResponse(
      422,
      'validation_error',
      'q must be 120 characters or fewer.'
    );
  }

  try {
    const [feedPosts, signals] = await Promise.all([
      readFeedPostDtos({ limit: 30 }),
      readSignalEventDtos({ limit: 20 })
    ]);
    const investmentModels = investModelCopy.en.models.models
      .filter(isPublicDiscoverableInvestmentModel)
      .filter((model) => matchesInvestmentModelSearch(model, query))
      .map((model) => ({
        modelId: model.id,
        name: model.name,
        summary: model.summary,
        market: model.market,
        riskLabel: model.riskLabel,
        performanceLabel: model.performanceLabel,
        status: model.status,
        tags: model.tags,
        href: `/invest-model/models/${model.id}`
      }));
    const filteredFeedPosts = feedPosts
      .filter((post) => matchesFeedPostSearch(post, query))
      .map((post) => ({
        ...post,
        href: `/invest-model/feed/${post.postPublicId}`
      }));
    const filteredSignals = signals
      .filter((signal) => matchesSignalEventSearch(signal, query))
      .map((signal) => ({
        ...signal,
        href: `/invest-model/signals/${signal.signalPublicId}`
      }));

    return Response.json({
      data: {
        investmentModels,
        feedPosts: filteredFeedPosts,
        signalEvents: filteredSignals
      },
      meta: {
        routeStatus: 'db_backed',
        persistence: 'persisted_and_mock_discovery',
        sourceTables: [
          'feed_posts',
          'investment_models',
          'users',
          'model_signal_events',
          'model_versions',
          'market_instruments'
        ],
        query,
        counts: {
          investmentModels: investmentModels.length,
          feedPosts: filteredFeedPosts.length,
          signalEvents: filteredSignals.length
        },
        readOnly: true,
        modelDiscoveryOnly: true,
        realtimeExternalData: false,
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
      'Search results could not be read. No recommendations, model selections, orders, or brokerage actions were created.'
    );
  }
}
