import { and, count, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import {
  feedPostComments,
  feedPosts,
  feedPostSaves,
  investmentModels,
  modelVersions,
  userModelSelections,
  users
} from '@/lib/db/schema';
import { readNotificationCenter } from '@/lib/db/notification-read-model';
import type {
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
  sourceLabel: 'mock_safe_fallback'
};

function buildFallbackFeedActivitySummary(
  userPublicId: string
): MyPageFeedActivitySummary {
  return {
    ...fallbackSummary,
    userPublicId,
    recentSavedPosts: [],
    recentCommentPosts: []
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
      sourceLabel: 'db_read_model'
    };
  } catch {
    return buildFallbackFeedActivitySummary(userPublicId);
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
