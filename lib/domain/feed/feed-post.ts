import type { AccessRole, DomainPublicId, FeedPost } from '@/lib/domain/types';

/**
 * FeedPost DTO helpers keep Feed content informational and prevent DB row ids
 * from leaking into the API surface.
 */

export type FeedPostType = FeedPost['postType'];

export interface PolicyNoticeDto {
  code: string;
  severity: 'info' | 'warning' | 'blocked';
  message: string;
}

export interface FeedPostDto {
  postPublicId: DomainPublicId;
  modelPublicId?: DomainPublicId;
  linkedModelName?: string;
  authorDisplayName?: string;
  postType: FeedPostType;
  title: string;
  body: string;
  tags: string[];
  publishedAt?: string;
  dataContext: 'mock' | 'informational_placeholder';
  notices: PolicyNoticeDto[];
}

export interface FeedCommentDto {
  commentPublicId: DomainPublicId;
  postPublicId: DomainPublicId;
  parentCommentPublicId?: DomainPublicId;
  authorDisplayName: string;
  body: string;
  status: 'visible' | 'hidden' | 'deleted';
  createdAt: string;
  updatedAt?: string;
  replyCount: number;
  replies?: FeedCommentDto[];
  dataContext: 'mock' | 'informational_placeholder';
  notices: PolicyNoticeDto[];
}

export interface FeedReactionStateDto {
  userPublicId: DomainPublicId;
  postPublicId: DomainPublicId;
  liked: boolean;
  saved: boolean;
  read: boolean;
  likeCount: number;
  commentCount: number;
  savedAt?: string;
  readAt?: string;
  updatedAt: string;
  dataContext: 'mock' | 'informational_placeholder';
}

export interface FeedPostDetailDto extends FeedPostDto {
  relatedSignalPublicIds: DomainPublicId[];
  sourceAttribution: {
    sourceLabel: string;
    sourceUrl?: string;
    reviewedBy?: string;
    reviewState: 'mock_reviewed' | 'review_placeholder' | 'requires_review';
  };
  userState: FeedReactionStateDto;
  comments: FeedCommentDto[];
  recentLikeRanking?: {
    rank: number;
    windowLabel: string;
    likeCount: number;
    context: 'mock' | 'informational_placeholder';
  };
}

export const feedPostTypes = [
  'model_note',
  'market_context',
  'risk_note',
  'review_note'
] as const satisfies readonly FeedPostType[];

export function canReadFeed(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

export function parseFeedPostType(value: string | null): FeedPostType | null {
  if (!value) {
    return null;
  }

  return feedPostTypes.includes(value as FeedPostType)
    ? (value as FeedPostType)
    : null;
}

export function parseFeedLimit(value: string | null, fallback = 20) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, 1), 50);
}

function tagsForPostType(postType: FeedPostType) {
  switch (postType) {
    case 'model_note':
      return ['model note', 'seed context'];
    case 'market_context':
      return ['market context', 'observed input'];
    case 'risk_note':
      return ['risk note', 'volatility context'];
    case 'review_note':
      return ['review note', 'operator context'];
  }
}

export function feedPolicyNotices(): PolicyNoticeDto[] {
  return [
    {
      code: 'informational_feed_post',
      severity: 'info',
      message:
        'FeedPost content is informational context, not investment advice.'
    },
    {
      code: 'no_real_order',
      severity: 'warning',
      message:
        'This API does not create orders, broker actions, or portfolio allocations.'
    }
  ];
}

export function buildFeedPostDto(input: {
  postPublicId: string;
  modelPublicId?: string | null;
  linkedModelName?: string | null;
  authorDisplayName?: string | null;
  postType: string;
  title: string;
  body: string;
  publishedAt?: Date | string | null;
}): FeedPostDto {
  const postType = parseFeedPostType(input.postType) ?? 'review_note';
  const publishedAt =
    input.publishedAt instanceof Date
      ? input.publishedAt.toISOString()
      : input.publishedAt ?? undefined;

  return {
    postPublicId: input.postPublicId as DomainPublicId,
    modelPublicId: input.modelPublicId
      ? (input.modelPublicId as DomainPublicId)
      : undefined,
    linkedModelName: input.linkedModelName ?? undefined,
    authorDisplayName: input.authorDisplayName ?? undefined,
    postType,
    title: input.title,
    body: input.body,
    tags: tagsForPostType(postType),
    publishedAt,
    dataContext: 'mock',
    notices: feedPolicyNotices()
  };
}
