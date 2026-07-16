import { NextRequest } from 'next/server';

import {
  readNotificationCenter,
  readNotificationUnavailableSeedFixture
} from '@/lib/db/notification-read-model';
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
 * This route exposes DB-backed notification center rows for the prototype.
 * It never sends push, email, SMS, broker, order, or account notifications.
 */

function canReadNotifications(role: AccessRole) {
  return role === 'user' || role === 'admin';
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
  const requestId = createNotificationRequestId();
  const headerRole = readInvestModelRole(request);
  const role =
    headerRole === 'public'
      ? await readInvestModelSessionRole(request)
      : headerRole;

  if (!canReadNotifications(role)) {
    const isUnauthenticated = headerRole === 'public' && role === 'public';

    return notificationErrorResponse({
      status: isUnauthenticated ? 401 : 403,
      code: isUnauthenticated ? 'unauthenticated' : 'forbidden',
      message: isUnauthenticated
        ? 'Sign in as a user or admin to read investModel notifications.'
        : 'Only signed-in user or admin roles can read investModel notifications.',
      requestId,
      action: 'read_notifications',
      routeStatus: isUnauthenticated ? 'unauthenticated' : 'forbidden',
      userScopeSource: 'not_resolved_auth_error',
      reason: isUnauthenticated ? 'session_required' : 'role_not_allowed'
    });
  }

  const limit = parseLimit(request.nextUrl.searchParams.get('limit'));

  if (!limit) {
    return notificationErrorResponse({
      status: 422,
      code: 'validation_error',
      message: 'limit must be an integer between 1 and 30.',
      requestId,
      action: 'read_notifications',
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
    const notificationCenter = await readNotificationCenter({
      userPublicId: userScope.userPublicId,
      limit
    });

    return Response.json({
      ok: true,
      data: notificationCenter,
      meta: {
        ...buildNotificationSafetyMeta({
          requestId,
          action: 'read_notifications',
          routeStatus: 'db_backed',
          userScope,
          dataContext: notificationCenter.dataContext,
          limit
        }),
        routeStatus: 'db_backed',
        persistence: 'persisted_feed_read_state',
        sourceTables: [
          'users',
          'feed_posts',
          'feed_post_reads',
          'investment_models'
        ],
        userPublicId: userScope.userPublicId,
        userScopeSource: userScope.source,
        dataContext: notificationCenter.dataContext,
        limit,
        readOnly: true,
        inAppOnly: true,
        feedDerivedInAppReadStateOnly: true,
        sourceReadModel: 'feed_post_read_state',
        sourceEntity: 'feed_post',
        mutationScope: 'none_read_only',
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
    const fallback = await readNotificationUnavailableSeedFixture(
      userScope?.userPublicId
    );

    return notificationErrorResponse({
      status: 503,
      code: 'internal_error',
      message:
        'Notifications are temporarily unavailable. No push, email, SMS, orders, brokerage actions, account messages, or advice were sent.',
      requestId,
      action: 'read_notifications',
      routeStatus: 'read_model_unavailable',
      limit,
      dataContext: 'mock',
      userScope,
      userScopeSource: userScope?.source,
      reason: 'notification_read_model_unavailable',
      details: {
        fallbackKind: fallback.unavailableState.fallbackKind,
        fallbackStatus: fallback.unavailableState.status,
        fallbackDeliveryChannel: fallback.unavailableState.deliveryChannel,
        fallbackGeneratedFrom: fallback.generatedFrom,
        fallbackSafetySummary: fallback.safetySummary
      }
    });
  }
}
