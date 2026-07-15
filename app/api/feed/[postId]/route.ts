import { NextRequest } from 'next/server';

import { readFeedPostDetailDto } from '@/lib/db/feed-detail-read-model';
import { canReadFeed } from '@/lib/domain/feed/feed-post';
import {
  readInvestModelRole,
  readInvestModelSessionRole,
  resolveInvestModelUserScope
} from '@/lib/server/invest-model-user-scope';

/**
 * This route reads one informational FeedPost detail by public id.
 * It exposes comment/reaction/read state only as mock-safe user-scoped UI state.
 */

type ApiErrorCode =
  | 'forbidden'
  | 'validation_error'
  | 'not_found'
  | 'server_error';

type RouteContext = {
  params: Promise<{
    postId: string;
  }>;
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

export async function GET(request: NextRequest, context: RouteContext) {
  const headerRole = readInvestModelRole(request);
  const role =
    headerRole === 'public'
      ? await readInvestModelSessionRole(request)
      : headerRole;

  if (!canReadFeed(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read informational FeedPost detail rows.'
    );
  }

  const { postId } = await context.params;
  const postPublicId = postId.trim();
  const userScope = await resolveInvestModelUserScope(request, {
    ignoreClientUserPublicId: true
  });

  if (!postPublicId) {
    return errorResponse(
      422,
      'validation_error',
      'FeedPost public id is required.'
    );
  }

  try {
    const result = await readFeedPostDetailDto({
      postPublicId,
      userPublicId: userScope.userPublicId
    });

    if (result.status === 'post_not_found') {
      return errorResponse(
        404,
        'not_found',
        'FeedPost public id was not found or is not visible.'
      );
    }

    if (result.status === 'user_not_found') {
      return errorResponse(
        404,
        'not_found',
        'User public id was not found for user-scoped feed state.'
      );
    }

    return Response.json({
      data: result.data,
      meta: {
        routeStatus: 'db_backed',
        persistence: 'persisted',
        sourceTables: [
          'feed_posts',
          'feed_post_comments',
          'feed_post_reactions',
          'feed_post_saves',
          'feed_post_reads',
          'model_signal_events',
          'model_versions',
          'investment_models',
          'users'
        ],
        userPublicId: userScope.userPublicId,
        userScopeSource: userScope.source,
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
      'FeedPost detail could not be read. No orders, brokerage actions, or advice were created.'
    );
  }
}
