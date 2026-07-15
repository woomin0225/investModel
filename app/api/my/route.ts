import { NextRequest } from 'next/server';

import { readMyPageSummary } from '@/lib/db/my-page-read-model';
import type { AccessRole } from '@/lib/domain/types';
import {
  readInvestModelRole,
  resolveInvestModelUserScope
} from '@/lib/server/invest-model-user-scope';

/**
 * This route aggregates My Page read models for the prototype.
 * It never exposes real account balances, connects brokers, creates orders, or sends notifications.
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

function canReadMyPage(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

export async function GET(request: NextRequest) {
  const role = readInvestModelRole(request);

  if (!canReadMyPage(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read My Page summary.'
    );
  }

  const userScope = await resolveInvestModelUserScope(request);

  try {
    const myPageSummary = await readMyPageSummary(userScope.userPublicId);

    return Response.json({
      data: myPageSummary,
      meta: {
        routeStatus: 'db_backed',
        persistence: 'persisted_or_mock_safe_fallback',
        sourceTables: [
          'users',
          'user_model_selections',
          'investment_models',
          'model_versions',
          'feed_posts',
          'feed_post_saves',
          'feed_post_comments',
          'feed_post_reads'
        ],
        userPublicId: userScope.userPublicId,
        userScopeSource: userScope.source,
        clientUserPublicIdIgnored:
          userScope.ignoredClientUserPublicId !== undefined,
        readOnly: true,
        exposesInternalDbIds: false,
        realAccountConnection: false,
        realDeposit: false,
        realOrder: false,
        brokerageConnection: false,
        sendsRealPush: false,
        sendsRealEmail: false,
        sendsRealSms: false,
        financialAdvice: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'My Page summary could not be read. No account, order, brokerage, notification delivery, or advice action was created.'
    );
  }
}
