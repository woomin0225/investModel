/**
 * Verifies the BK-516 Feed topic cluster seed/read-model fixture.
 * It does not require live news, paid APIs, broker accounts, deposits,
 * TradeIntent creation, orders, copied competitor brands, or financial advice.
 */

import fs from 'fs';
import path from 'path';

import {
  feedTopicClusterSeedFixture,
  readFeedTopicClusterSeedFixture
} from '../../lib/db/feed-topic-cluster-read-model';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath: string) {
  return fs.readFileSync(path.resolve(filePath), 'utf8');
}

function assertNotIncludes(text: string, needle: string, message: string) {
  assertCondition(!text.includes(needle), message);
}

async function main() {
  const firstRead = await readFeedTopicClusterSeedFixture();
  const secondRead = await readFeedTopicClusterSeedFixture();
  const source = readText('lib/db/feed-topic-cluster-read-model.ts');
  const sampleSql = readText(
    'docs/database/samples/feed-topic-cluster-read-model.sample.sql'
  );
  const packageJson = readText('package.json');
  const serialized = JSON.stringify(feedTopicClusterSeedFixture);

  assertCondition(
    firstRead.length >= 2 &&
      firstRead.every(
        (cluster) =>
          cluster.generatedFrom === 'deterministic_fixture' ||
          cluster.generatedFrom === 'db_seed_projection'
      ),
    'feed topic fixture returns deterministic or DB seed clusters'
  );
  assertCondition(
    JSON.stringify(firstRead) === JSON.stringify(secondRead),
    'feed topic fixture read is deterministic without MYSQL_URL'
  );
  assertCondition(
    firstRead.some((cluster) => cluster.topic.includes('AI infrastructure')) &&
      firstRead.some((cluster) => cluster.topic.includes('Risk watch')),
    'feed topic fixture exposes expected topic labels'
  );
  assertCondition(
    firstRead.every(
      (cluster) =>
        cluster.summary.includes('not') ||
        cluster.summary.includes('informational') ||
        cluster.summary.includes('reading')
    ) &&
      firstRead.every((cluster) => cluster.safetyLabel.includes('no')),
    'feed topic fixture includes informational safety copy'
  );
  assertCondition(
    firstRead.every(
      (cluster) =>
        cluster.relatedPosts.length > 0 &&
        cluster.relatedPosts.every((post) =>
          post.postPublicId.startsWith('feed_mock_')
        )
    ),
    'feed topic fixture links seeded FeedPost rows'
  );
  assertCondition(
    firstRead.every(
      (cluster) =>
        cluster.relatedSignals.length > 0 &&
        cluster.relatedSignals.every(
          (signal) =>
            signal.signalPublicId.startsWith('sig_mock_') &&
            signal.scoreLabel.includes('mock score')
        )
    ),
    'feed topic fixture links seeded SignalEvent rows'
  );
  assertCondition(
    firstRead.every(
      (cluster) =>
        cluster.sourceMeta.mockOnly === true &&
        cluster.sourceMeta.observedInputsOnly === true &&
        cluster.sourceMeta.realtimeExternalData === false &&
        cluster.sourceMeta.externalPaidApi === false &&
        cluster.sourceMeta.competitorBrandCopied === false &&
        cluster.sourceMeta.financialAdvice === false &&
        cluster.sourceMeta.tradeIntentCreated === false &&
        cluster.sourceMeta.realOrder === false &&
        cluster.sourceMeta.brokerageConnection === false
    ),
    'feed topic fixture keeps mock-only safety meta'
  );
  assertCondition(
    sampleSql.includes('feed_posts') &&
      sampleSql.includes('model_signal_events') &&
      sampleSql.includes('investment_models') &&
      sampleSql.includes('feed_topic_seed_ai_infra') &&
      sampleSql.includes('feed_topic_seed_risk_watch') &&
      sampleSql.includes('no live news feed'),
    'sample SQL documents Feed topic cluster projection'
  );
  assertCondition(
    packageJson.includes(
      '"test:feed-topic-cluster-read-model": "npx tsx scripts/smoke/feed-topic-cluster-read-model-smoke.ts"'
    ),
    'package script exposes feed topic cluster smoke'
  );

  [
    'brokerAccount',
    'broker_account',
    'accountNumber',
    'bankAccount',
    'routingNumber',
    'tradeFill',
    'orderExecution',
    'brokerOrder',
    'liveNewsProvider',
    'liveQuoteProvider',
    'externalApiKey',
    'realBalance',
    'buySignal',
    'sellSignal',
    'holdRecommendation'
  ].forEach((needle) => {
    assertNotIncludes(source, needle, `feed topic source avoids ${needle}`);
    assertNotIncludes(serialized, needle, `feed topic fixture avoids ${needle}`);
    assertNotIncludes(sampleSql, needle, `feed topic sample avoids ${needle}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
