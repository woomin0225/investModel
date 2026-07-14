import { NextRequest } from 'next/server';

import { createFeedPostCommentReply } from '@/lib/db/feed-detail-read-model';
import { canReadFeed } from '@/lib/domain/feed/feed-post';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route creates informational FeedPost comment replies only.
 * Replies are discussion state, not advice, orders, suitability, or compliance approval.
 */

type ApiErrorCode =
  | 'forbidden'
  | 'validation_error'
  | 'not_found'
  | 'server_error';

type RouteContext = {
  params: Promise<{
    postId: string;
    commentId: string;
  }>;
};

type ReplyRequestBody = {
  userPublicId?: unknown;
  body?: unknown;
  clientRequestId?: unknown;
};

const maxReplyLength = 600;

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

async function readBody(request: NextRequest): Promise<ReplyRequestBody> {
  try {
    return (await request.json()) as ReplyRequestBody;
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
      'Only signed-in user or admin roles can create informational FeedPost replies.'
    );
  }

  const { postId, commentId } = await context.params;
  const postPublicId = postId.trim();
  const parentCommentPublicId = commentId.trim();
  const body = await readBody(request);
  const userPublicId =
    typeof body.userPublicId === 'string' ? body.userPublicId.trim() : '';
  const replyBody = typeof body.body === 'string' ? body.body.trim() : '';

  if (!postPublicId) {
    return errorResponse(
      422,
      'validation_error',
      'FeedPost public id is required.'
    );
  }

  if (!parentCommentPublicId) {
    return errorResponse(
      422,
      'validation_error',
      'Parent FeedComment public id is required.'
    );
  }

  if (!userPublicId) {
    return errorResponse(
      422,
      'validation_error',
      'userPublicId body field is required for user-scoped replies.'
    );
  }

  if (!replyBody) {
    return errorResponse(422, 'validation_error', 'Reply body is required.');
  }

  if (replyBody.length > maxReplyLength) {
    return errorResponse(
      422,
      'validation_error',
      `Reply body must be ${maxReplyLength} characters or fewer.`
    );
  }

  try {
    const result = await createFeedPostCommentReply({
      postPublicId,
      parentCommentPublicId,
      userPublicId,
      body: replyBody
    });

    if (result.status === 'post_not_found') {
      return errorResponse(
        404,
        'not_found',
        'FeedPost public id was not found or is not visible.'
      );
    }

    if (result.status === 'parent_comment_not_found') {
      return errorResponse(
        404,
        'not_found',
        'Parent FeedComment public id was not found for this visible FeedPost.'
      );
    }

    if (result.status === 'user_not_found') {
      return errorResponse(
        404,
        'not_found',
        'User public id was not found for user-scoped replies.'
      );
    }

    return Response.json(
      {
        data: result.data,
        meta: {
          routeStatus: 'db_backed',
          persistence: 'persisted',
          action: 'create_comment_reply',
          sourceTables: ['feed_posts', 'feed_post_comments', 'users'],
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
      'FeedPost reply could not be created. No orders, brokerage actions, or advice were created.'
    );
  }
}
