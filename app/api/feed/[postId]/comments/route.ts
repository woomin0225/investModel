import { NextRequest } from 'next/server';

import { createFeedPostComment } from '@/lib/db/feed-detail-read-model';
import { canReadFeed } from '@/lib/domain/feed/feed-post';
import {
  readInvestModelRole,
  readInvestModelSessionRole,
  resolveInvestModelUserScope
} from '@/lib/server/invest-model-user-scope';

/**
 * This route creates informational FeedPost comments only.
 * Comments are discussion state, not advice, orders, suitability, or compliance approval.
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

type CommentRequestBody = {
  userPublicId?: unknown;
  body?: unknown;
  clientRequestId?: unknown;
};

const maxCommentLength = 600;

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

async function readBody(request: NextRequest): Promise<CommentRequestBody> {
  try {
    return (await request.json()) as CommentRequestBody;
  } catch {
    return {};
  }
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
      'Only signed-in user or admin roles can create informational FeedPost comments.'
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
  const commentBody = typeof body.body === 'string' ? body.body.trim() : '';

  if (!postPublicId) {
    return errorResponse(
      422,
      'validation_error',
      'FeedPost public id is required.'
    );
  }

  if (!commentBody) {
    return errorResponse(
      422,
      'validation_error',
      'Comment body is required.'
    );
  }

  if (commentBody.length > maxCommentLength) {
    return errorResponse(
      422,
      'validation_error',
      `Comment body must be ${maxCommentLength} characters or fewer.`
    );
  }

  try {
    const result = await createFeedPostComment({
      postPublicId,
      userPublicId: userScope.userPublicId,
      body: commentBody
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
        'User public id was not found for user-scoped comments.'
      );
    }

    if (result.status === 'parent_comment_not_found') {
      return errorResponse(
        404,
        'not_found',
        'Parent FeedComment public id was not found for this visible FeedPost.'
      );
    }

    return Response.json(
      {
        data: result.data,
        meta: {
          routeStatus: 'db_backed',
          persistence: 'persisted',
          action: 'create_comment',
          sourceTables: ['feed_posts', 'feed_post_comments', 'users'],
          userPublicId: userScope.userPublicId,
          userScopeSource: userScope.source,
          clientUserPublicIdIgnored:
            userScope.ignoredClientUserPublicId !== undefined,
          informationalOnly: true,
          discussionOnly: true,
          recommendationSignal: false,
          orderIntentSignal: false,
          realOrder: false,
          brokerageConnection: false,
          financialAdvice: false,
          complianceApproval: false
        }
      },
      { status: 201 }
    );
  } catch {
    return errorResponse(
      500,
      'server_error',
      'FeedPost comment could not be created. No orders, brokerage actions, or advice were created.'
    );
  }
}
