import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import {
  feedPostReads,
  feedPosts,
  investmentModels,
  users
} from '@/lib/db/schema';
import {
  buildFeedPostDto,
  type FeedPostDto,
  type PolicyNoticeDto
} from '@/lib/domain/feed/feed-post';

export type NotificationCenterItemDto = {
  notificationPublicId: string;
  source: 'feed_post';
  title: string;
  body: string;
  status: 'unread' | 'read';
  eventLabel: string;
  occurredAt?: string;
  href: string;
  feedPost: FeedPostDto;
  notices: PolicyNoticeDto[];
};

export type NotificationCenterDto = {
  userPublicId: string;
  unreadCount: number;
  items: NotificationCenterItemDto[];
  dataContext: 'mock' | 'informational_placeholder';
  notices: PolicyNoticeDto[];
};

type ReadNotificationCenterInput = {
  userPublicId: string;
  limit: number;
};

function notificationPolicyNotices(): PolicyNoticeDto[] {
  return [
    {
      code: 'notification_read_model_only',
      severity: 'info',
      message:
        'Notifications are derived from DB-backed FeedPost read state for this prototype.'
    },
    {
      code: 'no_real_push_delivery',
      severity: 'warning',
      message:
        'This screen does not send push, email, SMS, broker, order, or account notifications.'
    }
  ];
}

function formatNotificationDate(value: Date | string | null | undefined) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value ?? undefined;
}

export async function readNotificationCenter({
  userPublicId,
  limit
}: ReadNotificationCenterInput): Promise<NotificationCenterDto> {
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

  const notices = notificationPolicyNotices();
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
      notices
    };
  });

  return {
    userPublicId,
    unreadCount: items.filter((item) => item.status === 'unread').length,
    items,
    dataContext: 'mock',
    notices
  };
}
