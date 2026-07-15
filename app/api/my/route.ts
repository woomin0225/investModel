import { NextRequest } from 'next/server';

import { readMyPageSummary } from '@/lib/db/my-page-read-model';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route aggregates My Page read models for the prototype.
 * It never exposes real account balances, connects brokers, creates orders, or sends notifications.
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

function canReadMyPage(role: AccessRole) {
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

  if (!canReadMyPage(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read My Page summary.'
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
    const myPageSummary = await readMyPageSummary(userPublicId);

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
        userPublicId,
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
