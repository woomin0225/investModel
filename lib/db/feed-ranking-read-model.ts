import { and, count, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import {
  feedPostReactions,
  feedPosts,
  investmentModels,
  users
} from '@/lib/db/schema';
import {
  buildFeedPostDto,
  type FeedPostRankingDto
} from '@/lib/domain/feed/feed-post';

export type FeedRankingWindow = 'tracked_seed' | 'all_time';

interface ReadFeedPostRankingDtosInput {
  limit: number;
  window: FeedRankingWindow;
}

export async function readFeedPostRankingDtos({
  limit,
  window
}: ReadFeedPostRankingDtosInput): Promise<FeedPostRankingDto[]> {
  const likeCount = count(feedPostReactions.id);
  const rows = await db
    .select({
      postPublicId: feedPosts.publicId,
      modelPublicId: investmentModels.publicId,
      linkedModelName: investmentModels.name,
      authorDisplayName: users.name,
      postType: feedPosts.postType,
      title: feedPosts.title,
      body: feedPosts.body,
      publishedAt: feedPosts.publishedAt,
      likeCount
    })
    .from(feedPosts)
    .leftJoin(investmentModels, eq(feedPosts.modelId, investmentModels.id))
    .leftJoin(users, eq(feedPosts.authorUserId, users.id))
    .leftJoin(
      feedPostReactions,
      and(
        eq(feedPostReactions.postId, feedPosts.id),
        eq(feedPostReactions.reactionType, 'like'),
        eq(feedPostReactions.status, 'active')
      )
    )
    .where(and(eq(feedPosts.visibility, 'public'), isNull(users.deletedAt)))
    .groupBy(
      feedPosts.id,
      feedPosts.publicId,
      investmentModels.publicId,
      investmentModels.name,
      users.name,
      feedPosts.postType,
      feedPosts.title,
      feedPosts.body,
      feedPosts.publishedAt,
      feedPosts.createdAt
    )
    .orderBy(
      desc(likeCount),
      desc(feedPosts.publishedAt),
      desc(feedPosts.createdAt)
    )
    .limit(limit);

  return rows.map((row, index) => ({
    ...buildFeedPostDto(row),
    rank: index + 1,
    likeCount: row.likeCount,
    windowLabel:
      window === 'all_time' ? 'all tracked seed history' : 'tracked seed window',
    rankingContext: 'mock_popularity'
  }));
}
