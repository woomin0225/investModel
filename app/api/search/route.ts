import { NextRequest } from 'next/server';

import { readFeedPostDtos } from '@/lib/db/feed-read-model';
import { readModelCardDtos } from '@/lib/db/model-read-model';
import { readSignalEventDtos } from '@/lib/db/signal-read-model';
import type { FeedPostDto } from '@/lib/domain/feed/feed-post';
import type { ModelCardDto } from '@/lib/domain/models/model-read-model';
import type { SignalEventDto } from '@/lib/domain/signals/signal-event';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route groups read-only search results for model discovery, FeedPost, and SignalEvent surfaces.
 * It never creates recommendations, model selections, TradeIntent rows, orders, or brokerage actions.
 */

type ApiErrorCode = 'forbidden' | 'validation_error' | 'server_error';

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
  model: ModelCardDto,
  query: string
) {
  return searchableIncludes(
    [
      model.name,
      model.shortDescription,
      model.risk.label,
      model.backtestReturn.display,
      model.maxDrawdown.display,
      model.reviewLabel,
      model.reviewLabel,
      model.status,
      ...model.targetMarkets,
      ...model.assetClassLabels
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
    const [feedPosts, signals, modelCards] = await Promise.all([
      readFeedPostDtos({ limit: 30 }),
      readSignalEventDtos({ limit: 20 }),
      readModelCardDtos(30)
    ]);
    const investmentModels = modelCards
      .filter((model) => matchesInvestmentModelSearch(model, query))
      .map((model) => ({
        modelId: model.slug,
        modelPublicId: model.modelPublicId,
        modelVersionPublicId: model.modelVersionPublicId,
        name: model.name,
        summary: model.shortDescription ?? model.risk.summary ?? '',
        market: model.targetMarkets.join(', ') || 'Marketplace model',
        riskLabel: model.risk.label,
        performanceLabel: `${model.backtestReturn.display} backtest`,
        status: model.status,
        tags: [
          ...model.targetMarkets,
          ...model.assetClassLabels,
          model.reviewLabel
        ],
        href: `/invest-model/models/${model.slug}`
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
        persistence: 'persisted',
        sourceTables: [
          'feed_posts',
          'investment_models',
          'model_creators',
          'model_risk_profiles',
          'model_performance_snapshots',
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
