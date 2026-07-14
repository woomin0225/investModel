import type {
  FeedPostDto,
  PolicyNoticeDto
} from '@/lib/domain/feed/feed-post';

export type NotificationCenterItemDto = {
  notificationPublicId: string;
  source: 'feed_post';
  title: string;
  body: string;
  status: 'unread' | 'read';
  eventLabel: string;
  occurredAt?: string;
  href: string;
  feedPost: FeedPostDto;
  notices: PolicyNoticeDto[];
};

export type NotificationCenterDto = {
  userPublicId: string;
  unreadCount: number;
  items: NotificationCenterItemDto[];
  dataContext: 'mock' | 'informational_placeholder';
  notices: PolicyNoticeDto[];
};
