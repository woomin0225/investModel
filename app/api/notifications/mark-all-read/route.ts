import { NextRequest } from 'next/server';

import { markNotificationCenterRead } from '@/lib/db/notification-read-model';
import type { AccessRole } from '@/lib/domain/types';
import {
  buildNotificationSafetyMeta,
  createNotificationRequestId,
  notificationErrorResponse
} from '@/lib/domain/notifications/notification-api-meta';
import {
  readInvestModelRole,
  readInvestModelSessionRole,
  resolveInvestModelUserScope,
  type InvestModelUserScope
} from '@/lib/server/invest-model-user-scope';

/**
 * This route mutates only private FeedPost read state behind notification rows.
 * It never sends push, email, SMS, broker, order, or account notifications.
 */

type MarkAllReadRequestBody = {
  limit?: unknown;
};

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
  const requestId = createNotificationRequestId();
  const headerRole = readInvestModelRole(request);
  const role =
    headerRole === 'public'
      ? await readInvestModelSessionRole(request)
      : headerRole;

  if (!canMarkNotificationsRead(role)) {
    const isUnauthenticated = headerRole === 'public' && role === 'public';

    return notificationErrorResponse({
      status: isUnauthenticated ? 401 : 403,
      code: isUnauthenticated ? 'unauthenticated' : 'forbidden',
      message: isUnauthenticated
        ? 'Sign in as a user or admin to update investModel notification read state.'
        : 'Only signed-in user or admin roles can update investModel notification read state.',
      requestId,
      action: 'mark_all_notifications_read',
      routeStatus: isUnauthenticated ? 'unauthenticated' : 'forbidden',
      userScopeSource: 'not_resolved_auth_error',
      reason: isUnauthenticated ? 'session_required' : 'role_not_allowed'
    });
  }

  const body = await readBody(request);
  const limit = parseLimit(body.limit);

  if (!limit) {
    return notificationErrorResponse({
      status: 422,
      code: 'validation_error',
      message: 'limit must be an integer between 1 and 30.',
      requestId,
      action: 'mark_all_notifications_read',
      routeStatus: 'validation_error',
      userScopeSource: 'not_resolved_validation_error',
      fieldErrors: {
        limit: ['limit must be an integer between 1 and 30.']
      }
    });
  }

  let userScope: InvestModelUserScope | undefined;

  try {
    userScope = await resolveInvestModelUserScope(request);
    const result = await markNotificationCenterRead({
      userPublicId: userScope.userPublicId,
      limit
    });

    if (result.status === 'user_not_found') {
      return notificationErrorResponse({
        status: 404,
        code: 'not_found',
        message: 'User public id was not found for notification read state.',
        requestId,
        action: 'mark_all_notifications_read',
        routeStatus: 'user_not_found',
        limit,
        userScope,
        reason: 'server_resolved_user_scope_missing'
      });
    }

    return Response.json({
      ok: true,
      data: {
        notificationCenter: result.data,
        markedCount: result.markedCount,
        readAt: result.readAt
      },
      meta: {
        ...buildNotificationSafetyMeta({
          requestId,
          action: 'mark_all_notifications_read',
          routeStatus: 'db_backed',
          userScope,
          dataContext: result.data.dataContext,
          limit
        }),
        routeStatus: 'db_backed',
        persistence: 'persisted_feed_read_state',
        action: 'mark_all_notifications_read',
        sourceTables: ['users', 'feed_posts', 'feed_post_reads'],
        userPublicId: userScope.userPublicId,
        userScopeSource: userScope.source,
        dataContext: result.data.dataContext,
        limit,
        readStateOnly: true,
        inAppOnly: true,
        feedDerivedInAppReadStateOnly: true,
        sourceReadModel: 'feed_post_read_state',
        sourceEntity: 'feed_post',
        mutationScope: 'feed_post_reads_only',
        deliveryProvider: 'none',
        deliveryChannels: ['in_app_mock'],
        externalDeliveryBlocked: true,
        pushDeliveryBlocked: true,
        emailDeliveryBlocked: true,
        smsDeliveryBlocked: true,
        brokerMessagingBlocked: true,
        orderMessagingBlocked: true,
        financialAdviceBlocked: true,
        sendsRealPush: false,
        sendsRealEmail: false,
        sendsRealSms: false,
        realOrder: false,
        brokerageConnection: false,
        financialAdvice: false
      }
    });
  } catch {
    return notificationErrorResponse({
      status: 503,
      code: 'internal_error',
      message:
        'Notification read state could not be updated. No push, email, SMS, orders, brokerage actions, account messages, or advice were sent.',
      requestId,
      action: 'mark_all_notifications_read',
      routeStatus: 'read_state_unavailable',
      limit,
      dataContext: 'mock',
      userScope,
      userScopeSource: userScope?.source,
      reason: 'notification_read_state_unavailable'
    });
  }
}
