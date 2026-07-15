import type { PolicyNoticeDto } from '@/lib/domain/feed/feed-post';
import type { UserModelSelectionDto } from '@/lib/domain/models/model-selection';
import type { NotificationCenterItemDto } from '@/lib/domain/notifications/notification-center';
import type { MyPageFeedActivitySummary } from '@/lib/domain/my-page/feed-activity';

export type MyPageProfileDto = {
  userPublicId: string;
  displayName: string;
  roleLabel: 'member' | 'creator' | 'admin' | 'unknown';
};

export type MyPageNotificationSummaryDto = {
  unreadCount: number;
  totalCount: number;
  latestNotificationTitle?: string;
  latestNotificationHref?: string;
};

export type MyPageSummaryDto = {
  userPublicId: string;
  profile: MyPageProfileDto;
  activeSelection: UserModelSelectionDto | null;
  feedActivity: MyPageFeedActivitySummary;
  notificationSummary: MyPageNotificationSummaryDto;
  recentNotifications: NotificationCenterItemDto[];
  dataContext: 'db_read_model' | 'mock_safe_fallback';
  notices: PolicyNoticeDto[];
};

export function myPagePolicyNotices(): PolicyNoticeDto[] {
  return [
    {
      code: 'my_page_read_model_only',
      severity: 'info',
      message:
        'My Page values are user-scoped in-app read models for the prototype.'
    },
    {
      code: 'no_real_financial_account',
      severity: 'warning',
      message:
        'This DTO does not expose real balances, bank links, broker accounts, orders, or financial advice.'
    },
    {
      code: 'no_notification_delivery',
      severity: 'info',
      message:
        'Notification rows are DB read-model state only and do not send push, email, or SMS.'
    }
  ];
}
