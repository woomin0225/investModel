import { NextRequest } from 'next/server';

import { readNotificationCenter } from '@/lib/db/notification-read-model';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route exposes DB-backed notification center rows for the prototype.
 * It never sends push, email, SMS, broker, order, or account notifications.
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

function canReadNotifications(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

function parseUserPublicId(value: string | null) {
  if (!value) {
    return demoUserPublicId;
  }

  return value === demoUserPublicId ? value : null;
}

function parseLimit(value: string | null) {
  if (!value) {
    return 12;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 30) {
    return null;
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  const role = readRole(request);

  if (!canReadNotifications(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read investModel notifications.'
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

  const limit = parseLimit(request.nextUrl.searchParams.get('limit'));

  if (!limit) {
    return errorResponse(
      422,
      'validation_error',
      'limit must be an integer between 1 and 30.'
    );
  }

  try {
    const notificationCenter = await readNotificationCenter({
      userPublicId,
      limit
    });

    return Response.json({
      data: notificationCenter,
      meta: {
        routeStatus: 'db_backed',
        persistence: 'persisted_feed_read_state',
        sourceTables: [
          'users',
          'feed_posts',
          'feed_post_reads',
          'investment_models'
        ],
        userPublicId,
        limit,
        readOnly: true,
        sendsRealPush: false,
        sendsRealEmail: false,
        sendsRealSms: false,
        realOrder: false,
        brokerageConnection: false,
        financialAdvice: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Notifications could not be read. No push, email, SMS, orders, brokerage actions, or advice were created.'
    );
  }
}
