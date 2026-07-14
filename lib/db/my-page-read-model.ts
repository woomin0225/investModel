import { and, count, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import {
  feedPostComments,
  feedPosts,
  feedPostSaves,
  users
} from '@/lib/db/schema';

export type MyPageFeedActivitySummary = {
  userPublicId: string;
  savedCount: number;
  commentCount: number;
  latestSavedAt?: string;
  latestCommentAt?: string;
  latestSavedPostTitle?: string;
  latestCommentPostTitle?: string;
  recentSavedPosts: MyPageFeedActivityItem[];
  recentCommentPosts: MyPageFeedActivityItem[];
  sourceLabel: 'db_read_model' | 'mock_safe_fallback';
};

export type MyPageFeedActivityItem = {
  postPublicId: string;
  title: string;
  activityAt?: string;
  activityLabel: 'saved' | 'commented';
};

const fallbackSummary: MyPageFeedActivitySummary = {
  userPublicId: 'user_demo_001',
  savedCount: 0,
  commentCount: 0,
  recentSavedPosts: [],
  recentCommentPosts: [],
  sourceLabel: 'mock_safe_fallback'
};

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
      return { ...fallbackSummary, userPublicId };
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
    return { ...fallbackSummary, userPublicId };
  }
}
