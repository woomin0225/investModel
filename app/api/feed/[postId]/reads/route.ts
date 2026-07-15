import { NextRequest } from 'next/server';

import { setFeedPostReadState } from '@/lib/db/feed-detail-read-model';
import { canReadFeed } from '@/lib/domain/feed/feed-post';
import {
  readInvestModelRole,
  readInvestModelSessionRole,
  resolveInvestModelUserScope
} from '@/lib/server/invest-model-user-scope';

/**
 * This route mutates only private user-scoped FeedPost read state.
 * Read state is UI history, not recommendation, suitability, or order intent.
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

export async function POST(request: NextRequest, context: RouteContext) {
  const headerRole = readInvestModelRole(request);
  const role =
    headerRole === 'public'
      ? await readInvestModelSessionRole(request)
      : headerRole;

  if (!canReadFeed(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can update informational FeedPost read state.'
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
    const result = await setFeedPostReadState({
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
        'User public id was not found for user-scoped read state.'
      );
    }

    return Response.json({
      data: result.data,
      meta: {
        routeStatus: 'db_backed',
        persistence: 'persisted',
        action: 'mark_read',
        sourceTables: ['feed_posts', 'feed_post_reads', 'users'],
        userPublicId: userScope.userPublicId,
        userScopeSource: userScope.source,
        informationalOnly: true,
        privateReadingStateOnly: true,
        recommendationSignal: false,
        modelQualitySignal: false,
        expectedReturnSignal: false,
        orderIntentSignal: false,
        realOrder: false,
        brokerageConnection: false,
        financialAdvice: false,
        complianceApproval: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'FeedPost read state could not be updated. No orders, brokerage actions, or advice were created.'
    );
  }
}
