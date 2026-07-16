import { NextRequest } from 'next/server';

import { readMyPageFeedActivitySummary } from '@/lib/db/my-page-read-model';
import type { MyPageFeedActivitySummary } from '@/lib/domain/my-page/feed-activity';
import type { AccessRole } from '@/lib/domain/types';
import {
  readInvestModelRole,
  readInvestModelSessionRole,
  resolveInvestModelUserScope,
  type InvestModelUserScope
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

function buildCompactActivitySummary(
  activitySummary: MyPageFeedActivitySummary,
  userScope: InvestModelUserScope
) {
  const activityRows = activitySummary.activityRows ?? [];
  const latestActivity = activityRows[0];
  const notificationCount = activityRows.filter(
    (row) => row.activityType === 'notification'
  ).length;

  return {
    userPublicId: userScope.userPublicId,
    userScopeSource: userScope.source,
    savedCount: activitySummary.savedCount,
    commentCount: activitySummary.commentCount,
    notificationCount,
    totalActivityCount:
      activityRows.length ||
      activitySummary.savedCount + activitySummary.commentCount,
    latestActivityAt:
      latestActivity?.activityAt ??
      activitySummary.latestSavedAt ??
      activitySummary.latestCommentAt,
    latestActivityTitle:
      latestActivity?.title ??
      activitySummary.latestSavedPostTitle ??
      activitySummary.latestCommentPostTitle,
    latestActivityType: latestActivity?.activityType,
    readModelSource: activitySummary.sourceLabel,
    readOnly: true,
    serverScoped: true,
    clientUserPublicIdOverride: 'ignored',
    realAccountConnection: false,
    realOrder: false,
    brokerageConnection: false,
    externalDelivery: false,
    financialAdvice: false
  };
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
    const compactActivitySummary = buildCompactActivitySummary(
      activitySummary,
      userScope
    );

    return Response.json({
      data: {
        ...activitySummary,
        compactActivitySummary
      },
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
        scopeResolution: 'server_side',
        clientUserPublicIdOverride: request.nextUrl.searchParams.has(
          'userPublicId'
        )
          ? 'ignored'
          : 'not_provided',
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
