import { NextRequest } from 'next/server';

import { GET as readNotifications } from '@/app/api/notifications/route';
import type { NotificationCenterDto } from '@/lib/domain/notifications/notification-center';

export async function readInvestModelNotificationUnreadLabel() {
  try {
    const response = await readNotifications(
      new NextRequest(
        'http://localhost/api/notifications?userPublicId=user_demo_001&limit=12',
        {
          method: 'GET',
          headers: {
            'x-invest-model-role': 'user'
          }
        }
      )
    );

    if (!response.ok) {
      return undefined;
    }

    const payload = (await response.json()) as {
      data?: NotificationCenterDto;
    };
    const unreadCount = payload.data?.unreadCount ?? 0;

    return unreadCount > 0 ? String(unreadCount) : undefined;
  } catch {
    return undefined;
  }
}
