import { NextRequest } from 'next/server';

import { markNotificationCenterRead } from '@/lib/db/notification-read-model';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route mutates only private FeedPost read state behind notification rows.
 * It never sends push, email, SMS, broker, order, or account notifications.
 */

type ApiErrorCode = 'forbidden' | 'validation_error' | 'not_found' | 'server_error';

type MarkAllReadRequestBody = {
  userPublicId?: unknown;
  limit?: unknown;
};

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

function canMarkNotificationsRead(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

async function readBody(request: NextRequest): Promise<MarkAllReadRequestBody> {
  try {
    return (await request.json()) as MarkAllReadRequestBody;
  } catch {
    return {};
  }
}

function parseUserPublicId(value: unknown) {
  if (typeof value !== 'string' || value.trim() === '') {
    return demoUserPublicId;
  }

  const trimmed = value.trim();

  return trimmed === demoUserPublicId ? trimmed : null;
}

function parseLimit(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return 30;
  }

  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 30) {
    return null;
  }

  return parsed;
}

export async function POST(request: NextRequest) {
  const role = readRole(request);

  if (!canMarkNotificationsRead(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can update investModel notification read state.'
    );
  }

  const body = await readBody(request);
  const userPublicId = parseUserPublicId(body.userPublicId);

  if (!userPublicId) {
    return errorResponse(
      422,
      'validation_error',
      'userPublicId is limited to the demo user in this prototype.'
    );
  }

  const limit = parseLimit(body.limit);

  if (!limit) {
    return errorResponse(
      422,
      'validation_error',
      'limit must be an integer between 1 and 30.'
    );
  }

  try {
    const result = await markNotificationCenterRead({
      userPublicId,
      limit
    });

    if (result.status === 'user_not_found') {
      return errorResponse(
        404,
        'not_found',
        'User public id was not found for notification read state.'
      );
    }

    return Response.json({
      data: {
        notificationCenter: result.data,
        markedCount: result.markedCount,
        readAt: result.readAt
      },
      meta: {
        routeStatus: 'db_backed',
        persistence: 'persisted_feed_read_state',
        action: 'mark_all_notifications_read',
        sourceTables: ['users', 'feed_posts', 'feed_post_reads'],
        userPublicId,
        limit,
        readStateOnly: true,
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
      'Notification read state could not be updated. No push, email, SMS, orders, brokerage actions, or advice were created.'
    );
  }
}
