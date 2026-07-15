/**
 * Runs the investModel interaction and DB-output smoke suite as one QA gate.
 * Each smoke runs in a separate process so route-level DB clients can close cleanly.
 */

import { spawnSync } from 'child_process';

type SmokeCommand = {
  name: string;
  command: string[];
  covers: string[];
};

const smokeCommands: SmokeCommand[] = [
  {
    name: 'search-api',
    command: ['npx', 'tsx', 'scripts/smoke/search-api-smoke.ts'],
    covers: ['SearchResultDto', 'InvestmentModel', 'SignalEvent', 'FeedPost']
  },
  {
    name: 'notifications-api',
    command: ['npx', 'tsx', 'scripts/smoke/notifications-api-smoke.ts'],
    covers: ['NotificationCenterDto', 'read/unread state']
  },
  {
    name: 'notifications-mark-all-read-api',
    command: [
      'npx',
      'tsx',
      'scripts/smoke/notifications-mark-all-read-api-smoke.ts'
    ],
    covers: ['mark-all-read mutation', 'no push/email/SMS delivery']
  },
  {
    name: 'signal-scoring-service',
    command: ['npx', 'tsx', 'scripts/smoke/signal-scoring-service-smoke.ts'],
    covers: ['score snapshots', 'score inputs', 'rank changes']
  },
  {
    name: 'signal-api',
    command: ['npx', 'tsx', 'scripts/smoke/signal-api-smoke.ts'],
    covers: ['Signals filters', 'SignalEventDto list']
  },
  {
    name: 'signal-detail-api',
    command: ['npx', 'tsx', 'scripts/smoke/signal-detail-api-smoke.ts'],
    covers: ['Signal Detail', 'evidence', 'score snapshot']
  },
  {
    name: 'feed-detail-api',
    command: ['npx', 'tsx', 'scripts/smoke/feed-detail-api-smoke.ts'],
    covers: ['Feed detail', 'comments tree', 'user state']
  },
  {
    name: 'feed-comment-api',
    command: ['npx', 'tsx', 'scripts/smoke/feed-comment-api-smoke.ts'],
    covers: ['top-level comment mutation']
  },
  {
    name: 'feed-reply-api',
    command: ['npx', 'tsx', 'scripts/smoke/feed-reply-api-smoke.ts'],
    covers: ['reply mutation']
  },
  {
    name: 'feed-like-api',
    command: ['npx', 'tsx', 'scripts/smoke/feed-like-api-smoke.ts'],
    covers: ['like toggle', 'DB-backed engagement state']
  },
  {
    name: 'feed-save-api',
    command: ['npx', 'tsx', 'scripts/smoke/feed-save-api-smoke.ts'],
    covers: ['save toggle', 'DB-backed shortcut state']
  },
  {
    name: 'feed-read-api',
    command: ['npx', 'tsx', 'scripts/smoke/feed-read-api-smoke.ts'],
    covers: ['read state upsert']
  },
  {
    name: 'feed-ranking-api',
    command: ['npx', 'tsx', 'scripts/smoke/feed-ranking-api-smoke.ts'],
    covers: ['recent like ranking']
  },
  {
    name: 'portfolio-mock-summary-api',
    command: [
      'npx',
      'tsx',
      'scripts/smoke/portfolio-mock-summary-api-smoke.ts'
    ],
    covers: ['Portfolio dashboard', 'timeSnapshots', 'mock-only boundaries']
  },
  {
    name: 'my-page-api',
    command: ['npx', 'tsx', 'scripts/smoke/my-page-api-smoke.ts'],
    covers: ['MyPageSummaryDto', 'profile/activity/notification summary']
  },
  {
    name: 'my-page-user-scope-read-model',
    command: [
      'npx',
      'tsx',
      'scripts/smoke/my-page-user-scope-read-model-smoke.ts'
    ],
    covers: ['MyPageSummaryDto user scope', 'fallback isolation']
  },
  {
    name: 'my-activity-api',
    command: ['npx', 'tsx', 'scripts/smoke/my-activity-api-smoke.ts'],
    covers: ['My Page saved/comment activity']
  },
  {
    name: '390px-visual-structure',
    command: [
      'npx',
      'tsx',
      'scripts/qa/invest-model-visual-structure-smoke.ts'
    ],
    covers: ['390px mobile structure', 'safe-area', 'visible safety copy']
  }
];

const startedAt = new Date().toISOString();
const results = smokeCommands.map((smoke) => {
  const result = spawnSync(smoke.command[0], smoke.command.slice(1), {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  return {
    name: smoke.name,
    status: result.status === 0 ? 'pass' : 'fail',
    exitCode: result.status,
    covers: smoke.covers,
    stderrTail: result.stderr.trim().split(/\r?\n/).slice(-6)
  };
});
const failed = results.filter((result) => result.status === 'fail');

console.log(
  JSON.stringify(
    {
      status: failed.length === 0 ? 'pass' : 'fail',
      scope: 'investModel interaction and DB-output integration smoke',
      startedAt,
      finishedAt: new Date().toISOString(),
      blockedExternalData: 'IS-004 keeps realtime external data/API-key work out of this suite.',
      realFinancialActions: false,
      realBrokerageConnection: false,
      realNotificationDelivery: false,
      results
    },
    null,
    2
  )
);

if (failed.length > 0) {
  process.exit(1);
}
