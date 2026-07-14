import { NextRequest } from 'next/server';

import { setFeedPostReadState } from '@/lib/db/feed-detail-read-model';
import { canReadFeed } from '@/lib/domain/feed/feed-post';
import type { AccessRole } from '@/lib/domain/types';

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

type ReadRequestBody = {
  userPublicId?: unknown;
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

async function readBody(request: NextRequest): Promise<ReadRequestBody> {
  try {
    return (await request.json()) as ReadRequestBody;
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const role = readRole(request);

  if (!canReadFeed(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can update informational FeedPost read state.'
    );
  }

  const { postId } = await context.params;
  const postPublicId = postId.trim();
  const body = await readBody(request);
  const userPublicId =
    typeof body.userPublicId === 'string' ? body.userPublicId.trim() : '';

  if (!postPublicId) {
    return errorResponse(
      422,
      'validation_error',
      'FeedPost public id is required.'
    );
  }

  if (!userPublicId) {
    return errorResponse(
      422,
      'validation_error',
      'userPublicId body field is required for user-scoped read state.'
    );
  }

  try {
    const result = await setFeedPostReadState({
      postPublicId,
      userPublicId
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
