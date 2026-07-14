import { NextRequest } from 'next/server';
import { readFeedPostDtos } from '@/lib/db/feed-read-model';
import {
  canReadFeed,
  parseFeedLimit,
  parseFeedPostType
} from '@/lib/domain/feed/feed-post';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route reads informational FeedPost rows for the Feed surface.
 * It never creates advice, orders, brokerage actions, or user allocation state.
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

export async function GET(request: NextRequest) {
  const role = readRole(request);

  if (!canReadFeed(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read informational FeedPost rows.'
    );
  }

  const postTypeParam = request.nextUrl.searchParams.get('postType');
  const postType = parseFeedPostType(postTypeParam);

  if (postTypeParam && !postType) {
    return errorResponse(
      422,
      'validation_error',
      'postType must be one of model_note, market_context, risk_note, review_note.'
    );
  }

  const limit = parseFeedLimit(request.nextUrl.searchParams.get('limit'));

  try {
    const posts = await readFeedPostDtos({ postType, limit });

    return Response.json({
      data: posts,
      meta: {
        routeStatus: 'db_backed',
        persistence: 'persisted',
        sourceTables: ['feed_posts', 'investment_models', 'users'],
        limit,
        postType: postType ?? 'all',
        informationalOnly: true,
        realOrder: false,
        brokerageConnection: false,
        financialAdvice: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'FeedPost rows could not be read. No orders, brokerage actions, or advice were created.'
    );
  }
}
