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
    notices: [
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
    ]
  };
}
