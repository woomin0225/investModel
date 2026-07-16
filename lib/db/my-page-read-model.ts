import { and, count, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import {
  feedPostComments,
  feedPosts,
  feedPostSaves,
  investmentModels,
  modelVersions,
  userNotifications,
  userModelSelections,
  users
} from '@/lib/db/schema';
import { readNotificationCenter } from '@/lib/db/notification-read-model';
import type {
  MyPageActivityReadModel,
  MyPageActivityRow,
  MyPageActivityRowType,
  MyPageFeedActivityItem,
  MyPageFeedActivitySummary
} from '@/lib/domain/my-page/feed-activity';
import {
  myPagePolicyNotices,
  type MyPageSummaryDto
} from '@/lib/domain/my-page/summary';
import {
  buildUserModelSelectionDto,
  type UserModelSelectionDto
} from '@/lib/domain/models/model-selection';

const fallbackSummary: MyPageFeedActivitySummary = {
  userPublicId: 'user_demo_001',
  savedCount: 0,
  commentCount: 0,
  recentSavedPosts: [],
  recentCommentPosts: [],
  activityRows: [],
  sourceLabel: 'mock_safe_fallback'
};

const myPageActivitySafetyMeta = {
  userScoped: true,
  inAppReadModelOnly: true,
  accountLinkage: false,
  realDeposit: false,
  realOrder: false,
  brokerageConnection: false,
  externalDelivery: false,
  paidExternalApi: false,
  financialAdvice: false
} as const;

function buildFallbackFeedActivitySummary(
  userPublicId: string
): MyPageFeedActivitySummary {
  return {
    ...fallbackSummary,
    userPublicId,
    recentSavedPosts: [],
    recentCommentPosts: [],
    activityRows: []
  };
}

function buildActivityRow(
  input: Omit<MyPageActivityRow, 'sourceMeta'> & {
    sourceTables: string[];
  }
): MyPageActivityRow {
  return {
    activityPublicId: input.activityPublicId,
    userPublicId: input.userPublicId,
    activityType: input.activityType,
    sourcePublicId: input.sourcePublicId,
    title: input.title,
    bodyPreview: input.bodyPreview,
    activityAt: input.activityAt,
    sourceLabel: input.sourceLabel,
    sourceMeta: {
      ...myPageActivitySafetyMeta,
      sourceTables: input.sourceTables
    }
  };
}

function buildActivityCounts(rows: MyPageActivityRow[]) {
  return rows.reduce<Record<MyPageActivityRowType, number>>(
    (counts, row) => {
      counts[row.activityType] += 1;
      return counts;
    },
    {
      saved_feed: 0,
      comment: 0,
      notification: 0
    }
  );
}

function fallbackActivityReadModel(
  userPublicId: string
): MyPageActivityReadModel {
  return {
    generatedFrom: 'deterministic_fixture',
    userPublicId,
    rows: [],
    counts: {
      saved_feed: 0,
      comment: 0,
      notification: 0
    },
    safetySummary:
      'My Page activity fallback is empty user-scoped in-app read-model state only. It has no account linkage, deposit, order, brokerage, external delivery, paid API, or advice action.'
  };
}

function buildFallbackMyPageSummary(userPublicId: string): MyPageSummaryDto {
  return {
    userPublicId,
    profile: {
      userPublicId,
      displayName: 'Demo User',
      roleLabel: 'unknown'
    },
    activeSelection: null,
    feedActivity: buildFallbackFeedActivitySummary(userPublicId),
    notificationSummary: {
      unreadCount: 0,
      totalCount: 0
    },
    recentNotifications: [],
    dataContext: 'mock_safe_fallback',
    notices: myPagePolicyNotices()
  };
}

function toIso(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : value;
}

export async function readMyPageFeedActivitySummary(
  userPublicId = 'user_demo_001'
): Promise<MyPageFeedActivitySummary> {
  try {
    const [user] = await db
      .select({
        id: users.id,
        publicId: users.publicId
      })
      .from(users)
      .where(and(eq(users.publicId, userPublicId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      return buildFallbackFeedActivitySummary(userPublicId);
    }

    const [{ value: savedCount }] = await db
      .select({ value: count() })
      .from(feedPostSaves)
      .where(
        and(eq(feedPostSaves.userId, user.id), eq(feedPostSaves.status, 'saved'))
      );

    const [{ value: commentCount }] = await db
      .select({ value: count() })
      .from(feedPostComments)
      .where(
        and(
          eq(feedPostComments.authorUserId, user.id),
          eq(feedPostComments.status, 'visible')
        )
      );

    const recentSaves = await db
      .select({
        savedAt: feedPostSaves.savedAt,
        postPublicId: feedPosts.publicId,
        title: feedPosts.title
      })
      .from(feedPostSaves)
      .innerJoin(feedPosts, eq(feedPostSaves.postId, feedPosts.id))
      .where(
        and(
          eq(feedPostSaves.userId, user.id),
          eq(feedPostSaves.status, 'saved'),
          eq(feedPosts.visibility, 'public')
        )
      )
      .orderBy(desc(feedPostSaves.savedAt))
      .limit(2);

    const recentComments = await db
      .select({
        createdAt: feedPostComments.createdAt,
        postPublicId: feedPosts.publicId,
        title: feedPosts.title
      })
      .from(feedPostComments)
      .innerJoin(feedPosts, eq(feedPostComments.postId, feedPosts.id))
      .where(
        and(
          eq(feedPostComments.authorUserId, user.id),
          eq(feedPostComments.status, 'visible'),
          eq(feedPosts.visibility, 'public')
        )
      )
      .orderBy(desc(feedPostComments.createdAt))
      .limit(2);

    const latestSave = recentSaves[0];
    const latestComment = recentComments[0];
    const activityReadModel = await readMyPageActivitySeedFixture(userPublicId);

    return {
      userPublicId: user.publicId,
      savedCount,
      commentCount,
      latestSavedAt: toIso(latestSave?.savedAt),
      latestCommentAt: toIso(latestComment?.createdAt),
      latestSavedPostTitle: latestSave?.title,
      latestCommentPostTitle: latestComment?.title,
      recentSavedPosts: recentSaves.map((item) => ({
        postPublicId: item.postPublicId,
        title: item.title,
        activityAt: toIso(item.savedAt),
        activityLabel: 'saved'
      })),
      recentCommentPosts: recentComments.map((item) => ({
        postPublicId: item.postPublicId,
        title: item.title,
        activityAt: toIso(item.createdAt),
        activityLabel: 'commented'
      })),
      activityRows: activityReadModel.rows,
      sourceLabel: 'db_read_model'
    };
  } catch {
    return buildFallbackFeedActivitySummary(userPublicId);
  }
}

export async function readMyPageActivitySeedFixture(
  userPublicId = 'user_demo_001',
  limit = 8
): Promise<MyPageActivityReadModel> {
  try {
    const [user] = await db
      .select({
        id: users.id,
        publicId: users.publicId
      })
      .from(users)
      .where(and(eq(users.publicId, userPublicId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      return fallbackActivityReadModel(userPublicId);
    }

    const savedRows = await db
      .select({
        savedAt: feedPostSaves.savedAt,
        postPublicId: feedPosts.publicId,
        title: feedPosts.title
      })
      .from(feedPostSaves)
      .innerJoin(feedPosts, eq(feedPostSaves.postId, feedPosts.id))
      .where(
        and(
          eq(feedPostSaves.userId, user.id),
          eq(feedPostSaves.status, 'saved'),
          eq(feedPosts.visibility, 'public')
        )
      )
      .orderBy(desc(feedPostSaves.savedAt))
      .limit(limit);

    const commentRows = await db
      .select({
        commentPublicId: feedPostComments.publicId,
        body: feedPostComments.body,
        createdAt: feedPostComments.createdAt,
        postPublicId: feedPosts.publicId,
        title: feedPosts.title
      })
      .from(feedPostComments)
      .innerJoin(feedPosts, eq(feedPostComments.postId, feedPosts.id))
      .where(
        and(
          eq(feedPostComments.authorUserId, user.id),
          eq(feedPostComments.status, 'visible'),
          eq(feedPosts.visibility, 'public')
        )
      )
      .orderBy(desc(feedPostComments.createdAt))
      .limit(limit);

    const notificationRows = await db
      .select({
        notificationPublicId: userNotifications.publicId,
        sourcePublicId: userNotifications.sourcePublicId,
        title: userNotifications.title,
        body: userNotifications.body,
        status: userNotifications.status,
        deliveryChannel: userNotifications.deliveryChannel,
        createdAt: userNotifications.createdAt
      })
      .from(userNotifications)
      .where(
        and(
          eq(userNotifications.userId, user.id),
          eq(userNotifications.deliveryChannel, 'in_app_mock')
        )
      )
      .orderBy(desc(userNotifications.createdAt))
      .limit(limit);

    const rows: MyPageActivityRow[] = [
      ...savedRows.map((row) =>
        buildActivityRow({
          activityPublicId: `my_activity_saved_${row.postPublicId}`,
          userPublicId: user.publicId,
          activityType: 'saved_feed',
          sourcePublicId: row.postPublicId,
          title: row.title,
          activityAt: toIso(row.savedAt) ?? '2026-07-14T10:05:00.000Z',
          sourceLabel: 'db_seed_projection',
          sourceTables: ['feed_post_saves', 'feed_posts', 'users']
        })
      ),
      ...commentRows.map((row) =>
        buildActivityRow({
          activityPublicId: `my_activity_comment_${row.commentPublicId}`,
          userPublicId: user.publicId,
          activityType: 'comment',
          sourcePublicId: row.commentPublicId,
          title: row.title,
          bodyPreview: row.body.slice(0, 140),
          activityAt: toIso(row.createdAt) ?? '2026-07-14T09:45:00.000Z',
          sourceLabel: 'db_seed_projection',
          sourceTables: ['feed_post_comments', 'feed_posts', 'users']
        })
      ),
      ...notificationRows
        .filter(
          (row) =>
            row.deliveryChannel === 'in_app_mock' &&
            (row.status === 'unread' ||
              row.status === 'read' ||
              row.status === 'empty' ||
              row.status === 'unavailable')
        )
        .map((row) =>
          buildActivityRow({
            activityPublicId: `my_activity_notification_${row.notificationPublicId}`,
            userPublicId: user.publicId,
            activityType: 'notification',
            sourcePublicId: row.sourcePublicId,
            title: row.title,
            bodyPreview: row.body?.slice(0, 140),
            activityAt: toIso(row.createdAt) ?? '2026-07-15T10:00:00.000Z',
            sourceLabel: 'db_seed_projection',
            sourceTables: ['user_notifications', 'users']
          })
        )
    ]
      .sort((left, right) => right.activityAt.localeCompare(left.activityAt))
      .slice(0, limit);

    if (rows.length === 0) {
      return fallbackActivityReadModel(userPublicId);
    }

    return {
      generatedFrom: 'db_seed_projection',
      userPublicId: user.publicId,
      rows,
      counts: buildActivityCounts(rows),
      safetySummary:
        'My Page activity rows are user-scoped in-app read-model rows from saved FeedPost, visible comments, and in_app_mock notifications. They do not expose account linkage, deposits, orders, brokerage, external delivery, paid API data, or financial advice.'
    };
  } catch {
    return fallbackActivityReadModel(userPublicId);
  }
}

async function readActiveUserModelSelection(
  userPublicId: string
): Promise<UserModelSelectionDto | null> {
  const [row] = await db
    .select({
      selection: userModelSelections,
      userPublicId: users.publicId,
      modelPublicId: investmentModels.publicId,
      modelVersionPublicId: modelVersions.publicId
    })
    .from(userModelSelections)
    .innerJoin(users, eq(userModelSelections.userId, users.id))
    .innerJoin(
      investmentModels,
      eq(userModelSelections.modelId, investmentModels.id)
    )
    .innerJoin(
      modelVersions,
      eq(userModelSelections.modelVersionId, modelVersions.id)
    )
    .where(
      and(
        eq(users.publicId, userPublicId),
        eq(userModelSelections.status, 'active')
      )
    )
    .orderBy(desc(userModelSelections.selectedAt))
    .limit(1);

  if (!row) {
    return null;
  }

  return buildUserModelSelectionDto(
    {
      userPublicId: row.userPublicId,
      modelPublicId: row.modelPublicId,
      modelVersionPublicId: row.modelVersionPublicId,
      riskAcknowledgedAt:
        row.selection.riskAcknowledgedAt?.toISOString() ??
        row.selection.selectedAt.toISOString()
    },
    row.selection.selectedAt.toISOString(),
    'persisted',
    row.selection.publicId
  );
}

export async function readMyPageSummary(
  userPublicId = 'user_demo_001'
): Promise<MyPageSummaryDto> {
  const [user] = await db
    .select({
      id: users.id,
      publicId: users.publicId,
      name: users.name,
      role: users.role
    })
    .from(users)
    .where(and(eq(users.publicId, userPublicId), isNull(users.deletedAt)))
    .limit(1);

  if (!user) {
    return buildFallbackMyPageSummary(userPublicId);
  }

  const [feedActivity, activeSelection, notificationCenter] =
    await Promise.all([
      readMyPageFeedActivitySummary(userPublicId),
      readActiveUserModelSelection(userPublicId),
      readNotificationCenter({ userPublicId, limit: 3 })
    ]);
  const latestNotification = notificationCenter.items[0];

  return {
    userPublicId: user.publicId,
    profile: {
      userPublicId: user.publicId,
      displayName: user.name ?? 'Demo User',
      roleLabel:
        user.role === 'member' || user.role === 'creator' || user.role === 'admin'
          ? user.role
          : 'unknown'
    },
    activeSelection,
    feedActivity,
    notificationSummary: {
      unreadCount: notificationCenter.unreadCount,
      totalCount: notificationCenter.items.length,
      latestNotificationTitle: latestNotification?.title,
      latestNotificationHref: latestNotification?.href
    },
    recentNotifications: notificationCenter.items,
    dataContext:
      feedActivity.sourceLabel === 'db_read_model'
        ? 'db_read_model'
        : 'mock_safe_fallback',
    notices: myPagePolicyNotices()
  };
}
