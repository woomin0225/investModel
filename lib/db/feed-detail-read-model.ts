import { randomUUID } from 'crypto';
import { and, asc, count, eq, isNull } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import {
  feedPostComments,
  feedPostReactions,
  feedPostReads,
  feedPosts,
  feedPostSaves,
  investmentModels,
  users
} from '@/lib/db/schema';
import {
  buildFeedPostDto,
  feedPolicyNotices,
  type FeedCommentDto,
  type FeedPostDetailDto,
  type FeedReactionStateDto
} from '@/lib/domain/feed/feed-post';
import type { DomainPublicId } from '@/lib/domain/types';

type FeedDetailReadResult =
  | { status: 'ok'; data: FeedPostDetailDto }
  | { status: 'post_not_found' }
  | { status: 'user_not_found' };

type FeedLikeActionResult =
  | { status: 'ok'; data: FeedReactionStateDto }
  | { status: 'post_not_found' }
  | { status: 'user_not_found' };

type FeedSaveActionResult =
  | { status: 'ok'; data: FeedReactionStateDto }
  | { status: 'post_not_found' }
  | { status: 'user_not_found' };

type FeedReadActionResult =
  | { status: 'ok'; data: FeedReactionStateDto }
  | { status: 'post_not_found' }
  | { status: 'user_not_found' };

type FeedCommentActionResult =
  | { status: 'ok'; data: FeedPostDetailDto }
  | { status: 'post_not_found' }
  | { status: 'user_not_found' };

type CommentRow = {
  id: number;
  publicId: string;
  parentCommentId: number | null;
  authorDisplayName: string | null;
  body: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type CommentNode = FeedCommentDto & {
  internalId: number;
  internalParentId: number | null;
};

function toIso(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function buildCommentTree(
  postPublicId: string,
  rows: CommentRow[]
): FeedCommentDto[] {
  const byId = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];

  for (const row of rows) {
    byId.set(row.id, {
      internalId: row.id,
      internalParentId: row.parentCommentId,
      commentPublicId: row.publicId as DomainPublicId,
      postPublicId: postPublicId as DomainPublicId,
      authorDisplayName: row.authorDisplayName ?? 'Demo User',
      body: row.body,
      status: row.status === 'visible' ? 'visible' : 'hidden',
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      replyCount: 0,
      replies: [],
      dataContext: 'mock',
      notices: feedPolicyNotices()
    });
  }

  for (const comment of byId.values()) {
    if (comment.internalParentId && byId.has(comment.internalParentId)) {
      const parent = byId.get(comment.internalParentId);
      comment.parentCommentPublicId = parent?.commentPublicId;
      parent?.replies?.push(comment);
      if (parent) {
        parent.replyCount += 1;
      }
    } else {
      roots.push(comment);
    }
  }

  const stripInternal = (comment: CommentNode): FeedCommentDto => {
    const { internalId: _internalId, internalParentId: _internalParentId, ...dto } = comment;
    const replies = (comment.replies as CommentNode[] | undefined)?.map(stripInternal);

    return {
      ...dto,
      replies: replies && replies.length > 0 ? replies : undefined
    };
  };

  return roots.map(stripInternal);
}

export async function readFeedPostDetailDto({
  postPublicId,
  userPublicId
}: {
  postPublicId: string;
  userPublicId: string;
}): Promise<FeedDetailReadResult> {
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

  const [postRow] = await db
    .select({
      postId: feedPosts.id,
      postPublicId: feedPosts.publicId,
      modelPublicId: investmentModels.publicId,
      linkedModelName: investmentModels.name,
      authorDisplayName: users.name,
      postType: feedPosts.postType,
      title: feedPosts.title,
      body: feedPosts.body,
      publishedAt: feedPosts.publishedAt
    })
    .from(feedPosts)
    .leftJoin(investmentModels, eq(feedPosts.modelId, investmentModels.id))
    .leftJoin(users, eq(feedPosts.authorUserId, users.id))
    .where(
      and(
        eq(feedPosts.publicId, postPublicId),
        eq(feedPosts.visibility, 'public'),
        isNull(users.deletedAt)
      )
    )
    .limit(1);

  if (!postRow) {
    return { status: 'post_not_found' };
  }

  const commentRows = await db
    .select({
      id: feedPostComments.id,
      publicId: feedPostComments.publicId,
      parentCommentId: feedPostComments.parentCommentId,
      authorDisplayName: users.name,
      body: feedPostComments.body,
      status: feedPostComments.status,
      createdAt: feedPostComments.createdAt,
      updatedAt: feedPostComments.updatedAt
    })
    .from(feedPostComments)
    .leftJoin(users, eq(feedPostComments.authorUserId, users.id))
    .where(
      and(
        eq(feedPostComments.postId, postRow.postId),
        eq(feedPostComments.status, 'visible')
      )
    )
    .orderBy(asc(feedPostComments.createdAt));

  const [{ value: likeCount }] = await db
    .select({ value: count() })
    .from(feedPostReactions)
    .where(
      and(
        eq(feedPostReactions.postId, postRow.postId),
        eq(feedPostReactions.reactionType, 'like'),
        eq(feedPostReactions.status, 'active')
      )
    );
  const [{ value: commentCount }] = await db
    .select({ value: count() })
    .from(feedPostComments)
    .where(
      and(
        eq(feedPostComments.postId, postRow.postId),
        eq(feedPostComments.status, 'visible')
      )
    );
  const [liked] = await db
    .select({ updatedAt: feedPostReactions.updatedAt })
    .from(feedPostReactions)
    .where(
      and(
        eq(feedPostReactions.postId, postRow.postId),
        eq(feedPostReactions.userId, user.id),
        eq(feedPostReactions.reactionType, 'like'),
        eq(feedPostReactions.status, 'active')
      )
    )
    .limit(1);
  const [saved] = await db
    .select({
      savedAt: feedPostSaves.savedAt,
      updatedAt: feedPostSaves.updatedAt
    })
    .from(feedPostSaves)
    .where(
      and(
        eq(feedPostSaves.postId, postRow.postId),
        eq(feedPostSaves.userId, user.id),
        eq(feedPostSaves.status, 'saved')
      )
    )
    .limit(1);
  const [read] = await db
    .select({
      readAt: feedPostReads.readAt,
      updatedAt: feedPostReads.updatedAt
    })
    .from(feedPostReads)
    .where(
      and(
        eq(feedPostReads.postId, postRow.postId),
        eq(feedPostReads.userId, user.id)
      )
    )
    .limit(1);

  const basePost = buildFeedPostDto(postRow);
  const updatedAt =
    toIso(read?.updatedAt) ??
    toIso(saved?.updatedAt) ??
    toIso(liked?.updatedAt) ??
    new Date().toISOString();

  return {
    status: 'ok',
    data: {
      ...basePost,
      relatedSignalPublicIds: [],
      sourceAttribution: {
        sourceLabel: 'tracked seed feed_posts',
        reviewedBy: 'investModel mock operator',
        reviewState: 'review_placeholder'
      },
      userState: {
        userPublicId: user.publicId as DomainPublicId,
        postPublicId: basePost.postPublicId,
        liked: Boolean(liked),
        saved: Boolean(saved),
        read: Boolean(read),
        likeCount,
        commentCount,
        savedAt: toIso(saved?.savedAt),
        readAt: toIso(read?.readAt),
        updatedAt,
        dataContext: 'mock'
      },
      comments: buildCommentTree(postRow.postPublicId, commentRows),
      recentLikeRanking: {
        rank: 1,
        windowLabel: 'tracked seed window',
        likeCount,
        context: 'mock'
      },
      notices: feedPolicyNotices()
    }
  };
}

export async function setFeedPostLikeState({
  postPublicId,
  userPublicId,
  desiredState
}: {
  postPublicId: string;
  userPublicId: string;
  desiredState?: boolean;
}): Promise<FeedLikeActionResult> {
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

  const [post] = await db
    .select({
      id: feedPosts.id
    })
    .from(feedPosts)
    .where(
      and(eq(feedPosts.publicId, postPublicId), eq(feedPosts.visibility, 'public'))
    )
    .limit(1);

  if (!post) {
    return { status: 'post_not_found' };
  }

  const [existing] = await db
    .select({
      id: feedPostReactions.id,
      status: feedPostReactions.status
    })
    .from(feedPostReactions)
    .where(
      and(
        eq(feedPostReactions.postId, post.id),
        eq(feedPostReactions.userId, user.id),
        eq(feedPostReactions.reactionType, 'like')
      )
    )
    .limit(1);

  const now = new Date();
  const shouldLike =
    typeof desiredState === 'boolean'
      ? desiredState
      : existing?.status !== 'active';
  const nextStatus = shouldLike ? 'active' : 'inactive';

  if (existing) {
    await db
      .update(feedPostReactions)
      .set({
        status: nextStatus,
        updatedAt: now
      })
      .where(eq(feedPostReactions.id, existing.id));
  } else {
    await db.insert(feedPostReactions).values({
      postId: post.id,
      userId: user.id,
      reactionType: 'like',
      status: nextStatus,
      createdAt: now,
      updatedAt: now
    });
  }

  const detail = await readFeedPostDetailDto({ postPublicId, userPublicId });

  if (detail.status !== 'ok') {
    return detail;
  }

  return {
    status: 'ok',
    data: detail.data.userState
  };
}

export async function setFeedPostSaveState({
  postPublicId,
  userPublicId,
  desiredState
}: {
  postPublicId: string;
  userPublicId: string;
  desiredState?: boolean;
}): Promise<FeedSaveActionResult> {
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

  const [post] = await db
    .select({
      id: feedPosts.id
    })
    .from(feedPosts)
    .where(
      and(eq(feedPosts.publicId, postPublicId), eq(feedPosts.visibility, 'public'))
    )
    .limit(1);

  if (!post) {
    return { status: 'post_not_found' };
  }

  const [existing] = await db
    .select({
      id: feedPostSaves.id,
      status: feedPostSaves.status
    })
    .from(feedPostSaves)
    .where(and(eq(feedPostSaves.postId, post.id), eq(feedPostSaves.userId, user.id)))
    .limit(1);

  const now = new Date();
  const shouldSave =
    typeof desiredState === 'boolean' ? desiredState : existing?.status !== 'saved';
  const nextStatus = shouldSave ? 'saved' : 'removed';

  if (existing) {
    await db
      .update(feedPostSaves)
      .set({
        status: nextStatus,
        savedAt: shouldSave ? now : undefined,
        updatedAt: now
      })
      .where(eq(feedPostSaves.id, existing.id));
  } else {
    await db.insert(feedPostSaves).values({
      postId: post.id,
      userId: user.id,
      status: nextStatus,
      savedAt: now,
      updatedAt: now
    });
  }

  const detail = await readFeedPostDetailDto({ postPublicId, userPublicId });

  if (detail.status !== 'ok') {
    return detail;
  }

  return {
    status: 'ok',
    data: detail.data.userState
  };
}

export async function setFeedPostReadState({
  postPublicId,
  userPublicId
}: {
  postPublicId: string;
  userPublicId: string;
}): Promise<FeedReadActionResult> {
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

  const [post] = await db
    .select({
      id: feedPosts.id
    })
    .from(feedPosts)
    .where(
      and(eq(feedPosts.publicId, postPublicId), eq(feedPosts.visibility, 'public'))
    )
    .limit(1);

  if (!post) {
    return { status: 'post_not_found' };
  }

  const [existing] = await db
    .select({
      id: feedPostReads.id
    })
    .from(feedPostReads)
    .where(and(eq(feedPostReads.postId, post.id), eq(feedPostReads.userId, user.id)))
    .limit(1);

  const now = new Date();

  if (existing) {
    await db
      .update(feedPostReads)
      .set({
        readAt: now,
        updatedAt: now
      })
      .where(eq(feedPostReads.id, existing.id));
  } else {
    await db.insert(feedPostReads).values({
      postId: post.id,
      userId: user.id,
      readAt: now,
      updatedAt: now
    });
  }

  const detail = await readFeedPostDetailDto({ postPublicId, userPublicId });

  if (detail.status !== 'ok') {
    return detail;
  }

  return {
    status: 'ok',
    data: detail.data.userState
  };
}

export async function createFeedPostComment({
  postPublicId,
  userPublicId,
  body
}: {
  postPublicId: string;
  userPublicId: string;
  body: string;
}): Promise<FeedCommentActionResult> {
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

  const [post] = await db
    .select({
      id: feedPosts.id
    })
    .from(feedPosts)
    .where(
      and(eq(feedPosts.publicId, postPublicId), eq(feedPosts.visibility, 'public'))
    )
    .limit(1);

  if (!post) {
    return { status: 'post_not_found' };
  }

  const now = new Date();

  await db.insert(feedPostComments).values({
    publicId: `feed_comment_${randomUUID()}`,
    postId: post.id,
    authorUserId: user.id,
    body,
    status: 'visible',
    createdAt: now,
    updatedAt: now
  });

  const detail = await readFeedPostDetailDto({ postPublicId, userPublicId });

  if (detail.status !== 'ok') {
    return detail;
  }

  return {
    status: 'ok',
    data: detail.data
  };
}
