import { NextRequest } from 'next/server';

import {
  readFeedPostRankingDtos,
  type FeedRankingWindow
} from '@/lib/db/feed-ranking-read-model';
import { canReadFeed } from '@/lib/domain/feed/feed-post';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route exposes FeedPost popularity rankings from tracked seed likes.
 * It is popularity context only, never model quality, advice, or order intent.
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

function parseRankingLimit(value: string | null) {
  if (!value) {
    return 5;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 20) {
    return null;
  }

  return parsed;
}

function parseRankingWindow(value: string | null): FeedRankingWindow | null {
  if (!value) {
    return 'tracked_seed';
  }

  return value === 'tracked_seed' || value === 'all_time' ? value : null;
}

export async function GET(request: NextRequest) {
  const role = readRole(request);

  if (!canReadFeed(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read FeedPost popularity rankings.'
    );
  }

  const limit = parseRankingLimit(request.nextUrl.searchParams.get('limit'));

  if (!limit) {
    return errorResponse(
      422,
      'validation_error',
      'limit must be an integer between 1 and 20.'
    );
  }

  const window = parseRankingWindow(request.nextUrl.searchParams.get('window'));

  if (!window) {
    return errorResponse(
      422,
      'validation_error',
      'window must be tracked_seed or all_time.'
    );
  }

  try {
    const rankings = await readFeedPostRankingDtos({ limit, window });

    return Response.json({
      data: rankings,
      meta: {
        routeStatus: 'db_backed',
        persistence: 'persisted_feed_interactions',
        sourceTables: [
          'feed_posts',
          'feed_post_reactions',
          'investment_models',
          'users'
        ],
        limit,
        window,
        rankingBasis: 'active_like_count',
        popularityContextOnly: true,
        recommendationSignal: false,
        modelQualitySignal: false,
        expectedReturnSignal: false,
        realOrder: false,
        brokerageConnection: false,
        financialAdvice: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'FeedPost rankings could not be read. No advice, orders, or brokerage actions were created.'
    );
  }
}
