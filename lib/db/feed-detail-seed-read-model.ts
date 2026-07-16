/**
 * Feed detail seed/read-model fixture for DB-backed FeedPost detail screens.
 * It is informational commentary only, not advice, an order, or a broker link.
 */

import { and, count, desc, eq } from 'drizzle-orm';

import {
  feedPostComments,
  feedPostReactions,
  feedPostReads,
  feedPosts,
  feedPostSaves,
  investmentModels,
  modelSignalEvents,
  modelVersions
} from '@/lib/db/schema';

export type FeedDetailCommentSeed = {
  commentPublicId: string;
  parentCommentPublicId?: string;
  authorLabel: string;
  body: string;
  status: 'visible';
  createdAt: string;
};

export type FeedDetailSeedReadModel = {
  generatedFrom: 'deterministic_fixture' | 'db_seed_projection';
  postPublicId: string;
  title: string;
  body: string;
  postType: string;
  linkedModelName: string;
  authorLabel: string;
  publishedAt: string;
  relatedSignalPublicIds: string[];
  reactionSummary: {
    likeCount: number;
    savedByMockUser: boolean;
    readByMockUser: boolean;
    commentCount: number;
    savedAt?: string;
    readAt?: string;
  };
  comments: FeedDetailCommentSeed[];
  sourceMeta: {
    sourceTables: string[];
    mockOnly: true;
    informationalOnly: true;
    userScopedMockState: true;
    realtimeExternalData: false;
    externalPaidApi: false;
    financialAdvice: false;
    tradeIntentCreated: false;
    realOrder: false;
    brokerageConnection: false;
    pushDelivery: false;
  };
};

const feedDetailSafetyMeta = {
  sourceTables: [
    'feed_posts',
    'feed_post_comments',
    'feed_post_reactions',
    'feed_post_saves',
    'feed_post_reads',
    'model_signal_events'
  ],
  mockOnly: true,
  informationalOnly: true,
  userScopedMockState: true,
  realtimeExternalData: false,
  externalPaidApi: false,
  financialAdvice: false,
  tradeIntentCreated: false,
  realOrder: false,
  brokerageConnection: false,
  pushDelivery: false
} as const;

export const feedDetailSeedFixture: FeedDetailSeedReadModel[] = [
  {
    generatedFrom: 'deterministic_fixture',
    postPublicId: 'feed_mock_001',
    title: 'Seeded context around AI infrastructure attention',
    body:
      'This FeedPost detail fixture explains observed model input context from seeded FeedPost and SignalEvent rows. It is reading material for mobile UI testing, not a trade instruction or portfolio action.',
    postType: 'market_context',
    linkedModelName: 'Demo Signal Observer',
    authorLabel: 'investModel mock operator',
    publishedAt: '2026-07-14T09:00:00.000Z',
    relatedSignalPublicIds: [
      'sig_mock_news_traffic_001',
      'sig_mock_price_trend_001'
    ],
    reactionSummary: {
      likeCount: 1,
      savedByMockUser: false,
      readByMockUser: true,
      commentCount: 2,
      readAt: '2026-07-14T10:10:00.000Z'
    },
    comments: [
      {
        commentPublicId: 'feed_comment_mock_001',
        authorLabel: 'Demo User',
        body:
          'The seeded context is useful when source labels and score breakdowns stay visible beside the commentary.',
        status: 'visible',
        createdAt: '2026-07-14T09:45:00.000Z'
      },
      {
        commentPublicId: 'feed_comment_mock_002',
        parentCommentPublicId: 'feed_comment_mock_001',
        authorLabel: 'Demo User',
        body:
          'Agreed. The detail screen should keep the evidence label close to the discussion thread.',
        status: 'visible',
        createdAt: '2026-07-14T09:48:00.000Z'
      }
    ],
    sourceMeta: {
      ...feedDetailSafetyMeta,
      sourceTables: [...feedDetailSafetyMeta.sourceTables]
    }
  },
  {
    generatedFrom: 'deterministic_fixture',
    postPublicId: 'feed_mock_003',
    title: 'Seeded risk note discussion state',
    body:
      'This detail fixture keeps risk commentary as informational context for a mock FeedPost. It records discussion and read state without legal conclusions, delivery setup, or account actions.',
    postType: 'risk_note',
    linkedModelName: 'Demo Signal Observer',
    authorLabel: 'investModel mock operator',
    publishedAt: '2026-07-14T09:24:00.000Z',
    relatedSignalPublicIds: ['sig_mock_risk_001'],
    reactionSummary: {
      likeCount: 1,
      savedByMockUser: true,
      readByMockUser: true,
      commentCount: 1,
      savedAt: '2026-07-14T10:05:00.000Z',
      readAt: '2026-07-14T10:10:00.000Z'
    },
    comments: [
      {
        commentPublicId: 'feed_comment_mock_003',
        authorLabel: 'Demo User',
        body:
          'The risk note reads safer when uncertainty and mock-source labels are shown before any metric.',
        status: 'visible',
        createdAt: '2026-07-14T09:55:00.000Z'
      }
    ],
    sourceMeta: {
      ...feedDetailSafetyMeta,
      sourceTables: [...feedDetailSafetyMeta.sourceTables]
    }
  }
];

function cloneFixture(): FeedDetailSeedReadModel[] {
  return feedDetailSeedFixture.map((post) => ({
    ...post,
    relatedSignalPublicIds: [...post.relatedSignalPublicIds],
    reactionSummary: { ...post.reactionSummary },
    comments: post.comments.map((comment) => ({ ...comment })),
    sourceMeta: {
      ...post.sourceMeta,
      sourceTables: [...post.sourceMeta.sourceTables]
    }
  }));
}

function toIso(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : value;
}

async function readDbProjection(): Promise<FeedDetailSeedReadModel[] | null> {
  const { db } = await import('@/lib/db/drizzle');

  const postRows = await db
    .select({
      postId: feedPosts.id,
      postPublicId: feedPosts.publicId,
      modelId: feedPosts.modelId,
      title: feedPosts.title,
      body: feedPosts.body,
      postType: feedPosts.postType,
      linkedModelName: investmentModels.name,
      authorLabel: investmentModels.name,
      publishedAt: feedPosts.publishedAt
    })
    .from(feedPosts)
    .leftJoin(investmentModels, eq(feedPosts.modelId, investmentModels.id))
    .where(eq(feedPosts.visibility, 'public'))
    .orderBy(desc(feedPosts.publishedAt), desc(feedPosts.createdAt))
    .limit(4);

  if (postRows.length === 0) {
    return null;
  }

  const result: FeedDetailSeedReadModel[] = [];

  for (const post of postRows) {
    const signalRows = post.modelId
      ? await db
          .select({ signalPublicId: modelSignalEvents.publicId })
          .from(modelSignalEvents)
          .innerJoin(
            modelVersions,
            eq(modelSignalEvents.modelVersionId, modelVersions.id)
          )
          .where(eq(modelVersions.modelId, post.modelId))
          .orderBy(
            desc(modelSignalEvents.score),
            desc(modelSignalEvents.createdAt)
          )
          .limit(3)
      : [];
    const comments = await db
      .select({
        id: feedPostComments.id,
        commentPublicId: feedPostComments.publicId,
        parentCommentId: feedPostComments.parentCommentId,
        body: feedPostComments.body,
        createdAt: feedPostComments.createdAt
      })
      .from(feedPostComments)
      .where(
        and(
          eq(feedPostComments.postId, post.postId),
          eq(feedPostComments.status, 'visible')
        )
      )
      .orderBy(feedPostComments.createdAt)
      .limit(6);
    const [{ value: likeCount }] = await db
      .select({ value: count() })
      .from(feedPostReactions)
      .where(
        and(
          eq(feedPostReactions.postId, post.postId),
          eq(feedPostReactions.reactionType, 'like'),
          eq(feedPostReactions.status, 'active')
        )
      );
    const [{ value: commentCount }] = await db
      .select({ value: count() })
      .from(feedPostComments)
      .where(
        and(
          eq(feedPostComments.postId, post.postId),
          eq(feedPostComments.status, 'visible')
        )
      );
    const [saved] = await db
      .select({ savedAt: feedPostSaves.savedAt })
      .from(feedPostSaves)
      .where(
        and(
          eq(feedPostSaves.postId, post.postId),
          eq(feedPostSaves.status, 'saved')
        )
      )
      .limit(1);
    const [read] = await db
      .select({ readAt: feedPostReads.readAt })
      .from(feedPostReads)
      .where(eq(feedPostReads.postId, post.postId))
      .limit(1);

    const byInternalId = new Map<number, string>();

    comments.forEach((comment) => {
      byInternalId.set(comment.id, comment.commentPublicId);
    });

    result.push({
      generatedFrom: 'db_seed_projection',
      postPublicId: post.postPublicId,
      title: post.title,
      body: post.body,
      postType: post.postType,
      linkedModelName: post.linkedModelName ?? 'Seeded model context',
      authorLabel: post.authorLabel ?? 'investModel mock operator',
      publishedAt: toIso(post.publishedAt) ?? new Date(0).toISOString(),
      relatedSignalPublicIds: signalRows.map((signal) => signal.signalPublicId),
      reactionSummary: {
        likeCount,
        savedByMockUser: Boolean(saved),
        readByMockUser: Boolean(read),
        commentCount,
        savedAt: toIso(saved?.savedAt),
        readAt: toIso(read?.readAt)
      },
      comments: comments.map((comment) => ({
        commentPublicId: comment.commentPublicId,
        parentCommentPublicId:
          comment.parentCommentId === null
            ? undefined
            : byInternalId.get(comment.parentCommentId),
        authorLabel: 'Seeded feed participant',
        body: comment.body,
        status: 'visible',
        createdAt: toIso(comment.createdAt) ?? new Date(0).toISOString()
      })),
      sourceMeta: {
        ...feedDetailSafetyMeta,
        sourceTables: [...feedDetailSafetyMeta.sourceTables]
      }
    });
  }

  return result;
}

export async function readFeedDetailSeedReadModel(): Promise<
  FeedDetailSeedReadModel[]
> {
  if (!process.env.MYSQL_URL) {
    return cloneFixture();
  }

  try {
    const projection = await readDbProjection();
    return projection && projection.length > 0 ? projection : cloneFixture();
  } catch {
    return cloneFixture();
  }
}
