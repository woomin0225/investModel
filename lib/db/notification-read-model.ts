import { and, desc, eq, inArray, isNull } from 'drizzle-orm';

import {
  feedPostReads,
  feedPosts,
  investmentModels,
  userNotifications,
  users
} from '@/lib/db/schema';
import {
  buildFeedPostDto,
  type PolicyNoticeDto
} from '@/lib/domain/feed/feed-post';
import type {
  NotificationCenterDto,
  NotificationCenterItemDto
} from '@/lib/domain/notifications/notification-center';

type ReadNotificationCenterInput = {
  userPublicId: string;
  limit: number;
};

export type NotificationFallbackKind = 'empty' | 'unavailable';

export type NotificationUnavailableFallbackRow = {
  generatedFrom: 'deterministic_fixture' | 'db_seed_projection';
  notificationPublicId: string;
  userPublicId: string;
  sourceType: 'notification_fallback';
  sourcePublicId:
    | 'notification_center_empty_state'
    | 'notification_center_unavailable_state';
  fallbackKind: NotificationFallbackKind;
  title: string;
  body: string;
  status: NotificationFallbackKind;
  deliveryChannel: 'in_app_mock';
  createdAt: string;
  readAt?: string;
  safetyMeta: {
    sourceTables: string[];
    inAppMockReadStateOnly: true;
    externalDelivery: false;
    pushDelivery: false;
    emailDelivery: false;
    smsDelivery: false;
    brokerMessaging: false;
    orderMessaging: false;
    accountMessaging: false;
    financialAdvice: false;
    secretRequired: false;
  };
};

export type NotificationUnavailableReadModel = {
  generatedFrom: 'deterministic_fixture' | 'db_seed_projection';
  userPublicId: string;
  rows: NotificationUnavailableFallbackRow[];
  emptyState: NotificationUnavailableFallbackRow;
  unavailableState: NotificationUnavailableFallbackRow;
  safetySummary: string;
};

export type MarkNotificationCenterReadResult =
  | {
      status: 'ok';
      data: NotificationCenterDto;
      markedCount: number;
      readAt: string;
    }
  | { status: 'user_not_found' };

const notificationFallbackSafetyMeta = {
  sourceTables: ['user_notifications', 'users'],
  inAppMockReadStateOnly: true,
  externalDelivery: false,
  pushDelivery: false,
  emailDelivery: false,
  smsDelivery: false,
  brokerMessaging: false,
  orderMessaging: false,
  accountMessaging: false,
  financialAdvice: false,
  secretRequired: false
} as const;

const deterministicFallbackRows: NotificationUnavailableFallbackRow[] = [
  {
    generatedFrom: 'deterministic_fixture',
    notificationPublicId: 'notif_fallback_empty_user_demo_001',
    userPublicId: 'user_demo_001',
    sourceType: 'notification_fallback',
    sourcePublicId: 'notification_center_empty_state',
    fallbackKind: 'empty',
    title: 'No in-app notification rows yet',
    body:
      'Empty notification center state for the prototype. This is local in-app read-model state only and does not send push, email, SMS, account, broker, order, or advice messages.',
    status: 'empty',
    deliveryChannel: 'in_app_mock',
    createdAt: '2026-07-16T13:20:00.000Z',
    safetyMeta: {
      ...notificationFallbackSafetyMeta,
      sourceTables: [...notificationFallbackSafetyMeta.sourceTables]
    }
  },
  {
    generatedFrom: 'deterministic_fixture',
    notificationPublicId: 'notif_fallback_unavailable_user_demo_001',
    userPublicId: 'user_demo_001',
    sourceType: 'notification_fallback',
    sourcePublicId: 'notification_center_unavailable_state',
    fallbackKind: 'unavailable',
    title: 'Notification read model temporarily unavailable',
    body:
      'Unavailable notification center state for DB or seed gaps. It blocks external delivery and keeps all push, email, SMS, account, broker, order, and advice channels disabled.',
    status: 'unavailable',
    deliveryChannel: 'in_app_mock',
    createdAt: '2026-07-16T13:21:00.000Z',
    safetyMeta: {
      ...notificationFallbackSafetyMeta,
      sourceTables: [...notificationFallbackSafetyMeta.sourceTables]
    }
  }
];

function notificationPolicyNotices(): PolicyNoticeDto[] {
  return [
    {
      code: 'feed_derived_in_app_read_state_only',
      severity: 'info',
      message:
        'Notifications are feed-derived in-app rows from DB-backed FeedPost read state for this prototype.'
    },
    {
      code: 'no_real_push_delivery',
      severity: 'warning',
      message:
        'This screen does not send push, email, SMS, broker, order, account, or financial advice notifications.'
    }
  ];
}

function formatNotificationDate(value: Date | string | null | undefined) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value ?? undefined;
}

function cloneFallbackRows(rows: NotificationUnavailableFallbackRow[]) {
  return rows.map((row) => ({
    ...row,
    safetyMeta: {
      ...row.safetyMeta,
      sourceTables: [...row.safetyMeta.sourceTables]
    }
  }));
}

function buildFallbackReadModel(
  generatedFrom: NotificationUnavailableReadModel['generatedFrom'],
  userPublicId: string,
  rows: NotificationUnavailableFallbackRow[]
): NotificationUnavailableReadModel {
  const clonedRows = cloneFallbackRows(rows).map((row) => ({
    ...row,
    generatedFrom,
    userPublicId
  }));
  const emptyState =
    clonedRows.find((row) => row.fallbackKind === 'empty') ?? clonedRows[0];
  const unavailableState =
    clonedRows.find((row) => row.fallbackKind === 'unavailable') ??
    clonedRows[clonedRows.length - 1];

  return {
    generatedFrom,
    userPublicId,
    rows: clonedRows,
    emptyState,
    unavailableState,
    safetySummary:
      'Notification fallback rows are local in-app mock read-model rows only. They do not send push, email, SMS, broker, account, order, or investment-advice messages.'
  };
}

function deterministicFallbackReadModel(
  userPublicId: string
): NotificationUnavailableReadModel {
  return buildFallbackReadModel(
    'deterministic_fixture',
    userPublicId,
    deterministicFallbackRows
  );
}

function toIso(value: Date | string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

async function readNotificationFallbackDbProjection(
  userPublicId: string
): Promise<NotificationUnavailableReadModel | null> {
  const { db } = await import('@/lib/db/drizzle');

  const rows = await db
    .select({
      notificationPublicId: userNotifications.publicId,
      userPublicId: users.publicId,
      sourceType: userNotifications.sourceType,
      sourcePublicId: userNotifications.sourcePublicId,
      title: userNotifications.title,
      body: userNotifications.body,
      status: userNotifications.status,
      deliveryChannel: userNotifications.deliveryChannel,
      createdAt: userNotifications.createdAt,
      readAt: userNotifications.readAt
    })
    .from(userNotifications)
    .innerJoin(users, eq(userNotifications.userId, users.id))
    .where(
      and(
        eq(users.publicId, userPublicId),
        isNull(users.deletedAt),
        eq(userNotifications.sourceType, 'notification_fallback'),
        eq(userNotifications.deliveryChannel, 'in_app_mock')
      )
    )
    .orderBy(desc(userNotifications.createdAt))
    .limit(4);

  if (rows.length === 0) {
    return null;
  }

  const fallbackRows = rows
    .filter(
      (row) =>
        (row.status === 'empty' || row.status === 'unavailable') &&
        (row.sourcePublicId === 'notification_center_empty_state' ||
          row.sourcePublicId === 'notification_center_unavailable_state')
    )
    .map<NotificationUnavailableFallbackRow>((row) => ({
      generatedFrom: 'db_seed_projection',
      notificationPublicId: row.notificationPublicId,
      userPublicId: row.userPublicId,
      sourceType: 'notification_fallback',
      sourcePublicId: row.sourcePublicId as
        | 'notification_center_empty_state'
        | 'notification_center_unavailable_state',
      fallbackKind: row.status as NotificationFallbackKind,
      title: row.title,
      body: row.body ?? '',
      status: row.status as NotificationFallbackKind,
      deliveryChannel: 'in_app_mock',
      createdAt: toIso(row.createdAt, '2026-07-16T13:20:00.000Z'),
      readAt: row.readAt
        ? toIso(row.readAt, '2026-07-16T13:20:00.000Z')
        : undefined,
      safetyMeta: {
        ...notificationFallbackSafetyMeta,
        sourceTables: [...notificationFallbackSafetyMeta.sourceTables]
      }
    }));

  if (
    !fallbackRows.some((row) => row.fallbackKind === 'empty') ||
    !fallbackRows.some((row) => row.fallbackKind === 'unavailable')
  ) {
    return null;
  }

  return buildFallbackReadModel(
    'db_seed_projection',
    userPublicId,
    fallbackRows
  );
}

export async function readNotificationUnavailableSeedFixture(
  userPublicId = 'user_demo_001'
): Promise<NotificationUnavailableReadModel> {
  if (!process.env.MYSQL_URL) {
    return deterministicFallbackReadModel(userPublicId);
  }

  try {
    const projection = await readNotificationFallbackDbProjection(userPublicId);
    return projection ?? deterministicFallbackReadModel(userPublicId);
  } catch {
    return deterministicFallbackReadModel(userPublicId);
  }
}

export async function readNotificationCenter({
  userPublicId,
  limit
}: ReadNotificationCenterInput): Promise<NotificationCenterDto> {
  const { db } = await import('@/lib/db/drizzle');

  const rows = await db
    .select({
      postInternalId: feedPosts.id,
      postPublicId: feedPosts.publicId,
      modelPublicId: investmentModels.publicId,
      linkedModelName: investmentModels.name,
      authorDisplayName: users.name,
      postType: feedPosts.postType,
      title: feedPosts.title,
      body: feedPosts.body,
      publishedAt: feedPosts.publishedAt,
      readAt: feedPostReads.readAt
    })
    .from(feedPosts)
    .leftJoin(investmentModels, eq(feedPosts.modelId, investmentModels.id))
    .leftJoin(users, eq(feedPosts.authorUserId, users.id))
    .leftJoin(
      feedPostReads,
      and(
        eq(feedPostReads.postId, feedPosts.id),
        eq(
          feedPostReads.userId,
          db
            .select({ id: users.id })
            .from(users)
            .where(and(eq(users.publicId, userPublicId), isNull(users.deletedAt)))
            .limit(1)
        )
      )
    )
    .where(and(eq(feedPosts.visibility, 'public'), isNull(users.deletedAt)))
    .orderBy(desc(feedPosts.publishedAt), desc(feedPosts.createdAt))
    .limit(limit);

  const items = rows.map((row): NotificationCenterItemDto => {
    const feedPost = buildFeedPostDto(row);
    const status = row.readAt ? 'read' : 'unread';

    return {
      notificationPublicId: `notification_${row.postPublicId}`,
      source: 'feed_post',
      title: feedPost.title,
      body: feedPost.body,
      status,
      eventLabel:
        status === 'unread'
          ? 'New DB-backed FeedPost'
          : 'Read FeedPost update',
      occurredAt: formatNotificationDate(row.publishedAt),
      href: `/invest-model/feed/${feedPost.postPublicId}`,
      feedPost,
      notices: notificationPolicyNotices()
    };
  });

  return {
    userPublicId,
    unreadCount: items.filter((item) => item.status === 'unread').length,
    items,
    dataContext: 'mock',
    notices: notificationPolicyNotices()
  };
}

export async function markNotificationCenterRead({
  userPublicId,
  limit
}: ReadNotificationCenterInput): Promise<MarkNotificationCenterReadResult> {
  const { db } = await import('@/lib/db/drizzle');

  const [user] = await db
    .select({
      id: users.id,
      publicId: users.publicId
    })
    .from(users)
    .where(and(eq(users.publicId, userPublicId), isNull(users.deletedAt)))
    .limit(1);

  if (!user) {
    return { status: 'user_not_found' };
  }

  const centerBefore = await readNotificationCenter({ userPublicId, limit });
  const now = new Date();
  const postPublicIds = centerBefore.items.map(
    (item) => item.feedPost.postPublicId
  );

  if (postPublicIds.length === 0) {
    return {
      status: 'ok',
      data: centerBefore,
      markedCount: 0,
      readAt: now.toISOString()
    };
  }

  const postRows = await db
    .select({
      id: feedPosts.id,
      publicId: feedPosts.publicId
    })
    .from(feedPosts)
    .where(inArray(feedPosts.publicId, postPublicIds));
  const postIds = postRows.map((post) => post.id);
  const existingReads = await db
    .select({
      id: feedPostReads.id,
      postId: feedPostReads.postId
    })
    .from(feedPostReads)
    .where(
      and(eq(feedPostReads.userId, user.id), inArray(feedPostReads.postId, postIds))
    );
  const existingPostIds = new Set(existingReads.map((read) => read.postId));
  const missingReads = postRows
    .filter((post) => !existingPostIds.has(post.id))
    .map((post) => ({
      postId: post.id,
      userId: user.id,
      readAt: now,
      updatedAt: now
    }));

  if (existingReads.length > 0) {
    await db
      .update(feedPostReads)
      .set({
        readAt: now,
        updatedAt: now
      })
      .where(inArray(feedPostReads.id, existingReads.map((read) => read.id)));
  }

  if (missingReads.length > 0) {
    await db.insert(feedPostReads).values(missingReads);
  }

  const data = await readNotificationCenter({ userPublicId, limit });

  return {
    status: 'ok',
    data,
    markedCount: centerBefore.unreadCount,
    readAt: now.toISOString()
  };
}
