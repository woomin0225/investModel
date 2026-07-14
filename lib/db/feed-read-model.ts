import { and, desc, eq, isNull, type SQL } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { feedPosts, investmentModels, users } from '@/lib/db/schema';
import {
  buildFeedPostDto,
  type FeedPostDto,
  type FeedPostType,
} from '@/lib/domain/feed/feed-post';

interface ReadFeedPostDtosInput {
  postType?: FeedPostType | null;
  limit: number;
}

export async function readFeedPostDtos({
  postType,
  limit,
}: ReadFeedPostDtosInput): Promise<FeedPostDto[]> {
  const filters: SQL[] = [
    eq(feedPosts.visibility, 'public'),
    isNull(users.deletedAt),
  ];

  if (postType) {
    filters.push(eq(feedPosts.postType, postType));
  }

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
    })
    .from(feedPosts)
    .leftJoin(investmentModels, eq(feedPosts.modelId, investmentModels.id))
    .leftJoin(users, eq(feedPosts.authorUserId, users.id))
    .where(and(...filters))
    .orderBy(desc(feedPosts.publishedAt), desc(feedPosts.createdAt))
    .limit(limit);

  return rows.map(buildFeedPostDto);
}
