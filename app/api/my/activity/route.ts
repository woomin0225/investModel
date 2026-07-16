import { NextRequest } from 'next/server';

import { readMyPageFeedActivitySummary } from '@/lib/db/my-page-read-model';
import type { AccessRole } from '@/lib/domain/types';
import {
  readInvestModelRole,
  readInvestModelSessionRole,
  resolveInvestModelUserScope
} from '@/lib/server/invest-model-user-scope';

/**
 * This route reads My Page in-app activity for the prototype.
 * It never sends push, email, SMS, account, broker, order, or advice actions.
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

function canReadMyActivity(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

export async function GET(request: NextRequest) {
  const headerRole = readInvestModelRole(request);
  const role =
    headerRole === 'public'
      ? await readInvestModelSessionRole(request)
      : headerRole;

  if (!canReadMyActivity(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read My Page activity.'
    );
  }

  const userScope = await resolveInvestModelUserScope(request);

  try {
    const activitySummary = await readMyPageFeedActivitySummary(
      userScope.userPublicId
    );

    return Response.json({
      data: activitySummary,
      meta: {
        routeStatus: 'db_backed',
        persistence: 'persisted_or_mock_safe_fallback',
        sourceTables: [
          'users',
          'feed_posts',
          'feed_post_saves',
          'feed_post_comments',
          'user_notifications'
        ],
        feedActivityReadModelSource:
          'feed_post_saves_comments_and_in_app_notifications',
        dataContext: activitySummary.sourceLabel,
        userPublicId: userScope.userPublicId,
        userScopeSource: userScope.source,
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
