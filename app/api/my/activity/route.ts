import { NextRequest } from 'next/server';

import { readMyPageFeedActivitySummary } from '@/lib/db/my-page-read-model';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route reads My Page in-app activity for the prototype.
 * It never sends push, email, SMS, account, broker, order, or advice actions.
 */

type ApiErrorCode = 'forbidden' | 'validation_error' | 'server_error';

const demoUserPublicId = 'user_demo_001';

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

function canReadMyActivity(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

function parseUserPublicId(value: string | null) {
  if (!value) {
    return demoUserPublicId;
  }

  return value === demoUserPublicId ? value : null;
}

export async function GET(request: NextRequest) {
  const role = readRole(request);

  if (!canReadMyActivity(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read My Page activity.'
    );
  }

  const userPublicId = parseUserPublicId(
    request.nextUrl.searchParams.get('userPublicId')
  );

  if (!userPublicId) {
    return errorResponse(
      422,
      'validation_error',
      'userPublicId is limited to the demo user in this prototype.'
    );
  }

  try {
    const activitySummary = await readMyPageFeedActivitySummary(userPublicId);

    return Response.json({
      data: activitySummary,
      meta: {
        routeStatus: 'db_backed',
        persistence: 'persisted_or_mock_safe_fallback',
        sourceTables: [
          'users',
          'feed_posts',
          'feed_post_saves',
          'feed_post_comments'
        ],
        userPublicId,
        readOnly: true,
        sendsRealPush: false,
        sendsRealEmail: false,
        sendsRealSms: false,
        realAccountConnection: false,
        realOrder: false,
        brokerageConnection: false,
        financialAdvice: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'My Page activity could not be read. No push, email, SMS, account, order, brokerage, or advice action was created.'
    );
  }
}
