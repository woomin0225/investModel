/**
 * Verifies GET /api/feed/topic-clusters and /api/feed/topic-clusters/[clusterId].
 * It reads BK-516 seed projections only and never calls live feeds, paid APIs,
 * broker accounts, TradeIntent creation, orders, or financial advice paths.
 */

import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

import { GET as getTopicClusterDetail } from '../../app/api/feed/topic-clusters/[clusterId]/route';
import { GET as getTopicClusters } from '../../app/api/feed/topic-clusters/route';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath: string) {
  return fs.readFileSync(path.resolve(filePath), 'utf8');
}

function topicRequest(role = 'user') {
  return new NextRequest('http://localhost/api/feed/topic-clusters', {
    method: 'GET',
    headers: {
      'x-invest-model-role': role
    }
  });
}

function topicDetailRequest(clusterId: string, role = 'user') {
  return getTopicClusterDetail(
    new NextRequest(`http://localhost/api/feed/topic-clusters/${clusterId}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': role
      }
    }),
    {
      params: Promise.resolve({ clusterId })
    }
  );
}

function assertReadOnlySafetyMeta(meta: Record<string, unknown>) {
  assertCondition(
    meta.routeStatus === 'fixture_or_db_seed_projection' &&
      meta.persistence === 'read_only_seed_projection' &&
      Array.isArray(meta.sourceTables) &&
      meta.sourceTables.includes('feed_posts') &&
      meta.sourceTables.includes('model_signal_events') &&
      meta.sourceTables.includes('investment_models') &&
      meta.mockOnly === true &&
      meta.observedInputsOnly === true &&
      meta.realtimeExternalData === false &&
      meta.externalPaidApi === false &&
      meta.competitorBrandCopied === false &&
      meta.financialAdvice === false &&
      meta.tradeIntentCreated === false &&
      meta.realOrder === false &&
      meta.brokerageConnection === false,
    'topic cluster API keeps read-only mock-safe meta'
  );
}

function assertNoOrderCapableFields(payload: unknown, context: string) {
  const serialized = JSON.stringify(payload);

  [
    '"id"',
    'orderId',
    'tradeIntentId',
    'brokerageAccountId',
    'brokerAccount',
    'accountNumber',
    'realBalance'
  ].forEach((needle) => {
    assertCondition(!serialized.includes(needle), `${context} avoids ${needle}`);
  });
}

async function main() {
  const originalMysqlUrl = process.env.MYSQL_URL;
  process.env.MYSQL_URL = '';

  try {
    const forbiddenResponse = await getTopicClusters(
      new NextRequest('http://localhost/api/feed/topic-clusters', {
        method: 'GET'
      })
    );
    const listResponse = await getTopicClusters(topicRequest());
    const listJson = await listResponse.json();
    const detailResponse = await topicDetailRequest('feed_topic_mock_ai_infra');
    const detailJson = await detailResponse.json();
    const missingResponse = await topicDetailRequest('missing_cluster');
    const missingJson = await missingResponse.json();
    const blankResponse = await topicDetailRequest('   ');
    const routeSource = readText('app/api/feed/topic-clusters/route.ts');
    const detailSource = readText(
      'app/api/feed/topic-clusters/[clusterId]/route.ts'
    );
    const packageJson = readText('package.json');

    assertCondition(forbiddenResponse.status === 403, 'public role is forbidden');
    assertCondition(listResponse.status === 200, 'topic cluster list responds');
    assertCondition(
      Array.isArray(listJson.data) &&
        listJson.data.some(
          (cluster: { clusterPublicId?: string }) =>
            cluster.clusterPublicId === 'feed_topic_mock_ai_infra'
        ) &&
        listJson.data.every(
          (cluster: {
            relatedSignals?: unknown[];
            relatedPosts?: unknown[];
            sourceMeta?: Record<string, unknown>;
          }) =>
            Array.isArray(cluster.relatedSignals) &&
            cluster.relatedSignals.length > 0 &&
            Array.isArray(cluster.relatedPosts) &&
            cluster.relatedPosts.length > 0 &&
            cluster.sourceMeta?.mockOnly === true &&
            cluster.sourceMeta?.realtimeExternalData === false &&
            cluster.sourceMeta?.externalPaidApi === false &&
            cluster.sourceMeta?.tradeIntentCreated === false &&
            cluster.sourceMeta?.realOrder === false &&
            cluster.sourceMeta?.brokerageConnection === false
        ),
      'topic cluster list exposes related sample signals, posts, and source meta'
    );
    assertReadOnlySafetyMeta(listJson.meta);
    assertCondition(listJson.meta?.emptyState === null, 'non-empty list has null empty state');
    assertCondition(detailResponse.status === 200, 'topic cluster detail responds');
    assertCondition(
      detailJson.data?.clusterPublicId === 'feed_topic_mock_ai_infra' &&
        detailJson.data?.topic === 'AI infrastructure attention' &&
        detailJson.data?.sourceMeta?.competitorBrandCopied === false,
      'topic cluster detail exposes the requested public seed cluster'
    );
    assertReadOnlySafetyMeta(detailJson.meta);
    assertCondition(
      missingResponse.status === 404 &&
        missingJson.error?.code === 'not_found' &&
        missingJson.error?.message.includes('No live feed was queried'),
      'missing topic cluster returns read-only 404'
    );
    assertCondition(
      blankResponse.status === 422,
      'blank topic cluster public id returns validation error'
    );
    assertNoOrderCapableFields(listJson, 'topic cluster list payload');
    assertNoOrderCapableFields(detailJson, 'topic cluster detail payload');
    assertCondition(
      packageJson.includes(
        '"test:feed-topic-cluster-api": "npx tsx scripts/smoke/feed-topic-cluster-api-smoke.ts"'
      ),
      'package script exposes feed topic cluster API smoke'
    );

    [
      'fetch(',
      'axios',
      'liveNewsProvider',
      'externalApiKey',
      'brokerOrder',
      'buySignal',
      'sellSignal',
      'holdRecommendation',
      'Connect brokerage',
      'Place order',
      'Deposit now'
    ].forEach((needle) => {
      assertCondition(
        !routeSource.includes(needle) && !detailSource.includes(needle),
        `topic cluster routes avoid ${needle}`
      );
    });
  } finally {
    if (originalMysqlUrl === undefined) {
      delete process.env.MYSQL_URL;
    } else {
      process.env.MYSQL_URL = originalMysqlUrl;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
