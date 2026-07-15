import { NextRequest } from 'next/server';

import { setFeedPostSaveState } from '@/lib/db/feed-detail-read-model';
import { canReadFeed } from '@/lib/domain/feed/feed-post';
import {
  readInvestModelRole,
  resolveInvestModelUserScope
} from '@/lib/server/invest-model-user-scope';

/**
 * This route mutates only user-scoped FeedPost saved/bookmark state.
 * Save state is a private reading shortcut, not model selection, allocation, or order intent.
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

type SaveRequestBody = {
  userPublicId?: unknown;
  desiredState?: unknown;
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

async function readBody(request: NextRequest): Promise<SaveRequestBody> {
  try {
    return (await request.json()) as SaveRequestBody;
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const role = readInvestModelRole(request);

  if (!canReadFeed(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can update informational FeedPost saved state.'
    );
  }

  const { postId } = await context.params;
  const postPublicId = postId.trim();
  const body = await readBody(request);
  const clientUserPublicId =
    typeof body.userPublicId === 'string' ? body.userPublicId.trim() : '';
  const userScope = await resolveInvestModelUserScope(request, {
    clientUserPublicId
  });
  const desiredState =
    typeof body.desiredState === 'boolean' ? body.desiredState : undefined;

  if (!postPublicId) {
    return errorResponse(
      422,
      'validation_error',
      'FeedPost public id is required.'
    );
  }

  if (
    body.desiredState !== undefined &&
    typeof body.desiredState !== 'boolean'
  ) {
    return errorResponse(
      422,
      'validation_error',
      'desiredState must be a boolean when provided.'
    );
  }

  try {
    const result = await setFeedPostSaveState({
      postPublicId,
      userPublicId: userScope.userPublicId,
      desiredState
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
        'User public id was not found for user-scoped saved state.'
      );
    }

    return Response.json({
      data: result.data,
      meta: {
        routeStatus: 'db_backed',
        persistence: 'persisted',
        action: 'save_toggle',
        sourceTables: ['feed_posts', 'feed_post_saves', 'users'],
        userPublicId: userScope.userPublicId,
        userScopeSource: userScope.source,
        clientUserPublicIdIgnored:
          userScope.ignoredClientUserPublicId !== undefined,
        informationalOnly: true,
        privateReadingShortcutOnly: true,
        modelSelectionSignal: false,
        allocationSignal: false,
        orderIntentSignal: false,
        realOrder: false,
        brokerageConnection: false,
        financialAdvice: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'FeedPost saved state could not be updated. No orders, brokerage actions, or advice were created.'
    );
  }
}
