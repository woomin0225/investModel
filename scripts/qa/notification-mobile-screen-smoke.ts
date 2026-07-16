/**
 * BK-557 notification mobile smoke.
 *
 * This source smoke keeps the notification center 390px-first and in-app-only.
 * It verifies empty, unread/ready, unavailable, and auth-scope boundaries without
 * requiring browser automation or native mobile tooling.
 */

import { readFileSync } from 'fs';
import path from 'path';

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(source: string, expected: string, label: string) {
  assertCondition(
    source.includes(expected),
    `${label}: expected source to include "${expected}"`
  );
}

function assertNotIncludes(source: string, blocked: string, label: string) {
  assertCondition(
    !source.includes(blocked),
    `${label}: forbidden source text is present "${blocked}"`
  );
}

function assertNoUnsafeInteractiveCta(source: string) {
  const unsafeCtas = [
    'Enable push',
    'Set up push',
    'Set up email',
    'Set up SMS',
    'Connect brokerage',
    'Connect broker',
    'Link account',
    'Open account',
    'Deposit now',
    'Place order',
    'Submit order',
    'Execute trade',
    'Start trading',
    'Invest now',
    'Buy now',
    'Sell now'
  ];

  const interactiveFieldPattern = new RegExp(
    String.raw`(<button|<Link|aria-label|title|label|href|formAction)[\s\S]{0,180}(${unsafeCtas
      .map((copy) => copy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')})`,
    'i'
  );

  assertCondition(
    !interactiveFieldPattern.test(source),
    'Notifications screen must not expose setup/order/broker/advice CTAs'
  );
}

const notificationPageSource = readProjectFile(
  'app/invest-model/notifications/page.tsx'
);
const notificationRouteSource = readProjectFile(
  'app/api/notifications/route.ts'
);
const markAllReadRouteSource = readProjectFile(
  'app/api/notifications/mark-all-read/route.ts'
);
const notificationMetaSource = readProjectFile(
  'lib/domain/notifications/notification-api-meta.ts'
);
const notificationReadModelSource = readProjectFile(
  'lib/db/notification-read-model.ts'
);
const mobileShellSource = readProjectFile(
  'components/invest-model/mobile-shell.tsx'
);
const packageSource = readProjectFile('package.json');
const notificationApiSmokeSource = readProjectFile(
  'scripts/smoke/notifications-api-smoke.ts'
);
const markAllReadApiSmokeSource = readProjectFile(
  'scripts/smoke/notifications-mark-all-read-api-smoke.ts'
);

assertIncludes(notificationPageSource, '<MobileShell', 'notifications page');
assertIncludes(notificationPageSource, 'activeTab="home"', 'notifications page');
assertIncludes(
  notificationPageSource,
  'currentPath="/invest-model/notifications"',
  'notifications page'
);
assertIncludes(
  notificationPageSource,
  'size-invest-touch-target',
  'notifications touch target'
);
assertIncludes(
  notificationPageSource,
  'min-h-invest-touch-target',
  'notifications touch target'
);
assertIncludes(
  notificationPageSource,
  'focus:ring-2 focus:ring-invest-primary',
  'notifications focus state'
);
assertIncludes(
  notificationPageSource,
  'active:translate-y-px',
  'notifications pressed state'
);
assertIncludes(
  notificationPageSource,
  'investMotionClass.interactiveControl',
  'notifications motion states'
);
assertIncludes(
  notificationPageSource,
  'investMotionClass.interactiveCard',
  'notifications card states'
);
assertIncludes(notificationPageSource, 'min-w-0', 'notifications 390px layout');

assertIncludes(
  notificationPageSource,
  "status: 'ready'",
  'notifications ready state'
);
assertIncludes(
  notificationPageSource,
  "status: 'unavailable'",
  'notifications unavailable state'
);
assertIncludes(
  notificationPageSource,
  'notificationUnavailableCopy',
  'notifications unavailable copy'
);
assertIncludes(notificationPageSource, 'BellOff', 'notifications unavailable icon');
assertIncludes(
  notificationPageSource,
  'read_model_unavailable',
  'notifications unavailable route status'
);
assertIncludes(
  notificationPageSource,
  'notification_read_model_unavailable',
  'notifications unavailable reason'
);
assertIncludes(
  notificationPageSource,
  'deliveryProvider none / sendsRealPush false',
  'notifications unavailable delivery boundary'
);
assertIncludes(
  notificationPageSource,
  'in_app_mock',
  'notifications in-app mock boundary'
);

assertIncludes(
  notificationPageSource,
  'No DB-backed notifications yet',
  'notifications empty state'
);
assertIncludes(notificationPageSource, '<EmptyStateCta', 'notifications empty CTA');
assertIncludes(notificationPageSource, 'View Feed', 'notifications empty CTA');
assertIncludes(
  notificationPageSource,
  'Browse DB-backed FeedPosts that notification candidates derive from.',
  'notifications empty explanation'
);
assertIncludes(
  notificationPageSource,
  'DB-backed notification empty state, not real push, email, SMS, orders, brokerage action, or investment advice.',
  'notifications empty safety boundary'
);

assertIncludes(
  notificationPageSource,
  'notificationCenter.unreadCount',
  'notifications unread count'
);
assertIncludes(
  notificationPageSource,
  'disabled={!hasUnreadNotifications}',
  'notifications all-read disabled state'
);
assertIncludes(notificationPageSource, 'role="list"', 'notifications list');
assertIncludes(notificationPageSource, 'role="listitem"', 'notifications list items');
assertIncludes(notificationPageSource, 'line-clamp-2', 'notifications text clamp');
assertIncludes(notificationPageSource, 'truncate', 'notifications text truncation');
assertIncludes(
  notificationPageSource,
  'hasUnreadNotifications',
  'notifications unread ready state'
);
assertIncludes(notificationPageSource, 'Mark all read', 'notifications unread action');
assertIncludes(notificationPageSource, 'All read', 'notifications all-read state');
assertIncludes(
  notificationPageSource,
  'notificationSummaryVisibleBoundaries(locale)',
  'notifications summary boundaries'
);
assertIncludes(
  notificationPageSource,
  'notificationActionVisibleBoundaries(locale)',
  'notifications action boundaries'
);
assertIncludes(
  notificationPageSource,
  'notificationItemVisibleBoundaries(locale)',
  'notifications item boundaries'
);
assertIncludes(
  notificationPageSource,
  'notificationEmptyVisibleBoundaries(locale)',
  'notifications empty boundaries'
);

for (const safeCopy of [
  'in-app only',
  'DB read state',
  'FeedPost derived',
  'push/email/SMS false',
  'broker/order/advice blocked',
  'no external delivery',
  'no push/email/SMS',
  'No advice',
  'No orders',
  'No real push'
]) {
  assertIncludes(notificationPageSource, safeCopy, 'notifications safety copy');
}

for (const forbiddenHook of [
  'PUSH_SECRET',
  'SENDGRID_API_KEY',
  'TWILIO_AUTH_TOKEN',
  'deliveryProviderApiKey',
  'brokerageAccountId',
  'brokerage_account',
  'broker_order',
  'placeOrder',
  'submitOrder',
  'executeTrade',
  'orderId',
  'tradeIntentId',
  'connectBrokerage',
  'accountNumber',
  'bankAccount',
  'routingNumber',
  'guaranteed return',
  'risk free',
  'suitabilityApproved',
  'legalApproved'
]) {
  for (const [label, source] of [
    ['notification page', notificationPageSource],
    ['notification API', notificationRouteSource],
    ['notification mark-all API', markAllReadRouteSource],
    ['notification read model', notificationReadModelSource]
  ] as const) {
    assertNotIncludes(source, forbiddenHook, label);
  }
}

assertNotIncludes(
  notificationPageSource,
  "throw new Error('InvestModel notifications API contract returned an error.')",
  'notifications unavailable hard error'
);
assertNotIncludes(
  notificationPageSource,
  "throw new Error('InvestModel notification read-state update failed.')",
  'notifications mark-all hard error'
);
assertNoUnsafeInteractiveCta(notificationPageSource);

for (const routeSource of [notificationRouteSource, markAllReadRouteSource]) {
  assertIncludes(routeSource, 'readInvestModelSessionRole', 'notification auth');
  assertIncludes(routeSource, 'resolveInvestModelUserScope', 'notification scope');
  assertIncludes(routeSource, 'userScopeSource', 'notification scope meta');
  assertIncludes(routeSource, 'not_resolved_auth_error', 'notification auth error');
  assertIncludes(routeSource, 'unauthenticated', 'notification unauthenticated');
  assertIncludes(routeSource, 'forbidden', 'notification forbidden');
  assertIncludes(routeSource, 'deliveryChannels', 'notification delivery meta');
  assertIncludes(routeSource, 'in_app_mock', 'notification delivery meta');
  assertIncludes(routeSource, 'sendsRealPush: false', 'notification delivery meta');
  assertIncludes(routeSource, 'sendsRealEmail: false', 'notification delivery meta');
  assertIncludes(routeSource, 'sendsRealSms: false', 'notification delivery meta');
  assertIncludes(routeSource, 'realOrder: false', 'notification order boundary');
  assertIncludes(
    routeSource,
    'brokerageConnection: false',
    'notification broker boundary'
  );
  assertIncludes(
    routeSource,
    'financialAdvice: false',
    'notification advice boundary'
  );
}

assertIncludes(
  notificationMetaSource,
  "userScopeSource:\n      userScope?.source ?? userScopeSource ?? 'not_resolved_for_error'",
  'notification normalized error meta'
);
assertIncludes(
  notificationMetaSource,
  "deliveryProvider: 'none'",
  'notification normalized delivery meta'
);
assertIncludes(
  notificationMetaSource,
  "deliveryChannels: ['in_app_mock']",
  'notification normalized delivery meta'
);

for (const readModelPattern of [
  "export type NotificationFallbackKind = 'empty' | 'unavailable';",
  "sourcePublicId: 'notification_center_empty_state'",
  "sourcePublicId: 'notification_center_unavailable_state'",
  "fallbackKind: 'empty'",
  "fallbackKind: 'unavailable'",
  "deliveryChannel: 'in_app_mock'",
  'inAppMockReadStateOnly: true',
  'externalDelivery: false',
  'pushDelivery: false',
  'emailDelivery: false',
  'smsDelivery: false',
  'brokerMessaging: false',
  'orderMessaging: false',
  'accountMessaging: false',
  'financialAdvice: false',
  'secretRequired: false'
]) {
  assertIncludes(
    notificationReadModelSource,
    readModelPattern,
    'notification fallback read model'
  );
}

assertIncludes(mobileShellSource, 'max-w-[var(--invest-mobile-frame-width)]', 'MobileShell 390px frame');
assertIncludes(mobileShellSource, 'overflow-x-clip', 'MobileShell overflow clamp');
assertIncludes(mobileShellSource, '390px-first mobile app frame', 'MobileShell 390px doc');
assertIncludes(
  mobileShellSource,
  'pt-[calc(var(--invest-screen-top)+env(safe-area-inset-top))]',
  'MobileShell top safe area'
);
assertIncludes(
  mobileShellSource,
  'pb-[calc(var(--invest-bottom-nav-height)+env(safe-area-inset-bottom)+24px)]',
  'MobileShell bottom safe area'
);
assertIncludes(mobileShellSource, 'var(--invest-bottom-nav-height)', 'MobileShell bottom nav reserve');
assertIncludes(mobileShellSource, 'fixed inset-x-0 bottom-0 z-30', 'MobileShell fixed bottom nav');
assertIncludes(mobileShellSource, 'grid-cols-5', 'MobileShell stable bottom nav');
assertIncludes(mobileShellSource, 'data-touch-target="44px"', 'MobileShell touch target metadata');
assertIncludes(mobileShellSource, 'min-h-invest-touch-target', 'MobileShell touch targets');
assertIncludes(mobileShellSource, 'min-w-invest-touch-target', 'MobileShell touch targets');
assertIncludes(mobileShellSource, 'active:scale-95', 'MobileShell pressed state');
assertIncludes(mobileShellSource, 'focus:ring-2', 'MobileShell focus state');
assertIncludes(mobileShellSource, 'focus-visible:ring-2', 'MobileShell focus-visible state');
assertIncludes(
  mobileShellSource,
  "aria-current={isActive ? 'page' : undefined}",
  'MobileShell current tab'
);

for (const smokeSource of [notificationApiSmokeSource, markAllReadApiSmokeSource]) {
  assertIncludes(smokeSource, 'x-invest-model-role', 'notification smoke auth role');
  assertIncludes(smokeSource, 'userScopeSource', 'notification smoke scope meta');
  assertIncludes(smokeSource, 'not_resolved_auth_error', 'notification smoke auth errors');
  assertIncludes(smokeSource, 'clientUserPublicIdIgnored', 'notification smoke ignored client scope');
  assertIncludes(smokeSource, "'session'", 'notification smoke session scope');
  assertIncludes(smokeSource, 'in_app_mock', 'notification smoke delivery');
  assertIncludes(smokeSource, 'sendsRealPush', 'notification smoke delivery');
  assertIncludes(smokeSource, 'brokerageConnection', 'notification smoke broker boundary');
  assertIncludes(smokeSource, 'financialAdvice', 'notification smoke advice boundary');
}

assertIncludes(
  packageSource,
  '"test:notification-mobile-screen": "npx tsx scripts/qa/notification-mobile-screen-smoke.ts"',
  'package notification mobile smoke script'
);

console.log(
  JSON.stringify(
    {
      status: 'pass',
      scope: 'BK-557 notification 390px source smoke',
      states: ['empty', 'unread-ready', 'unavailable'],
      authScope: 'session/header role and server-resolved user scope are source-checked',
      mobile: '390px MobileShell safe-area, bottom tab, touch, pressed, and focus states are source-checked',
      externalDelivery: 'blocked: push/email/SMS/broker/order/advice'
    },
    null,
    2
  )
);
