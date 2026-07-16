import { randomUUID } from 'crypto';

import type { InvestModelUserScope } from '@/lib/server/invest-model-user-scope';

export type NotificationApiAction =
  | 'read_notifications'
  | 'mark_all_notifications_read';

export type NotificationApiErrorCode =
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'validation_error'
  | 'internal_error';

type NotificationSafetyMetaInput = {
  requestId: string;
  action: NotificationApiAction;
  routeStatus: string;
  limit?: number;
  dataContext?: string;
  userScope?: InvestModelUserScope;
  userScopeSource?: string;
};

type NotificationErrorResponseInput = NotificationSafetyMetaInput & {
  status: number;
  code: NotificationApiErrorCode;
  message: string;
  details?: unknown;
  fieldErrors?: Record<string, string[]>;
  reason?: string;
};

export function createNotificationRequestId() {
  return `req_${randomUUID()}`;
}

export function buildNotificationSafetyMeta({
  requestId,
  action,
  routeStatus,
  limit,
  dataContext,
  userScope,
  userScopeSource
}: NotificationSafetyMetaInput) {
  const isMutation = action === 'mark_all_notifications_read';

  return {
    requestId,
    routeStatus,
    action,
    persistence: 'persisted_feed_read_state',
    sourceTables: isMutation
      ? ['users', 'feed_posts', 'feed_post_reads']
      : ['users', 'feed_posts', 'feed_post_reads', 'investment_models'],
    ...(userScope ? { userPublicId: userScope.userPublicId } : {}),
    userScopeSource:
      userScope?.source ?? userScopeSource ?? 'not_resolved_for_error',
    ...(dataContext ? { dataContext } : {}),
    ...(limit ? { limit } : {}),
    readOnly: !isMutation,
    readStateOnly: isMutation,
    inAppOnly: true,
    feedDerivedInAppReadStateOnly: true,
    sourceReadModel: 'feed_post_read_state',
    sourceEntity: 'feed_post',
    mutationScope: isMutation
      ? 'feed_post_reads_only'
      : 'none_read_only',
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
  };
}

export function notificationErrorResponse({
  status,
  code,
  message,
  requestId,
  action,
  routeStatus,
  limit,
  dataContext,
  userScope,
  userScopeSource,
  details,
  fieldErrors,
  reason
}: NotificationErrorResponseInput) {
  return Response.json(
    {
      ok: false,
      error: {
        code,
        message,
        requestId,
        resource: 'notifications',
        action,
        ...(reason ? { reason } : {}),
        ...(fieldErrors ? { fieldErrors } : {}),
        ...(details !== undefined ? { details } : {})
      },
      meta: buildNotificationSafetyMeta({
        requestId,
        action,
        routeStatus,
        limit,
        dataContext,
        userScope,
        userScopeSource
      })
    },
    { status }
  );
}
