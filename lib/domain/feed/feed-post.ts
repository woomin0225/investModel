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

export type FeedSafeActionCode =
  | 'read_feed_post'
  | 'like_feed_post'
  | 'save_feed_post'
  | 'comment_feed_post'
  | 'reply_feed_comment';

export interface FeedSafeActionContractDto {
  code: FeedSafeActionCode;
  label: string;
  method: 'GET' | 'POST';
  routeTemplate: string;
  persistence: 'read_only' | 'user_scoped_mock_state';
  dataContext: 'mock' | 'informational_placeholder';
  requiresUserScope: boolean;
  externalDelivery: false;
  recommendationSignal: false;
  orderIntentSignal: false;
  realOrder: false;
  brokerageConnection: false;
  financialAdvice: false;
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
  safeActionContracts: FeedSafeActionContractDto[];
  comments: FeedCommentDto[];
  recentLikeRanking?: {
    rank: number;
    windowLabel: string;
    likeCount: number;
    context: 'mock' | 'informational_placeholder';
  };
}

export interface FeedPostRankingDto extends FeedPostDto {
  rank: number;
  likeCount: number;
  windowLabel: string;
  rankingContext: 'mock_popularity' | 'informational_placeholder';
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

export function feedSafeActionContracts(
  postPublicId: DomainPublicId
): FeedSafeActionContractDto[] {
  const detailRoute = `/api/feed/${postPublicId}`;
  const common = {
    dataContext: 'mock' as const,
    requiresUserScope: true,
    externalDelivery: false as const,
    recommendationSignal: false as const,
    orderIntentSignal: false as const,
    realOrder: false as const,
    brokerageConnection: false as const,
    financialAdvice: false as const
  };

  return [
    {
      code: 'read_feed_post',
      label: 'Read informational FeedPost detail',
      method: 'GET',
      routeTemplate: detailRoute,
      persistence: 'read_only',
      ...common
    },
    {
      code: 'like_feed_post',
      label: 'Toggle user-scoped mock like state',
      method: 'POST',
      routeTemplate: `${detailRoute}/likes`,
      persistence: 'user_scoped_mock_state',
      ...common
    },
    {
      code: 'save_feed_post',
      label: 'Toggle user-scoped mock saved state',
      method: 'POST',
      routeTemplate: `${detailRoute}/saves`,
      persistence: 'user_scoped_mock_state',
      ...common
    },
    {
      code: 'comment_feed_post',
      label: 'Create informational mock comment state',
      method: 'POST',
      routeTemplate: `${detailRoute}/comments`,
      persistence: 'user_scoped_mock_state',
      ...common
    },
    {
      code: 'reply_feed_comment',
      label: 'Create informational mock reply state',
      method: 'POST',
      routeTemplate: `${detailRoute}/comments/{commentPublicId}/replies`,
      persistence: 'user_scoped_mock_state',
      ...common
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
