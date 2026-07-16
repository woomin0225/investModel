/**
 * Verifies the BK-545 Feed detail seed/read-model fixture.
 * It never requires live feeds, paid APIs, broker accounts, deposits, push
 * delivery, TradeIntent creation, orders, or financial advice.
 */

import fs from 'fs';
import path from 'path';

import {
  feedDetailSeedFixture,
  readFeedDetailSeedReadModel
} from '../../lib/db/feed-detail-seed-read-model';

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
  const firstRead = await readFeedDetailSeedReadModel();
  const secondRead = await readFeedDetailSeedReadModel();
  const source = readText('lib/db/feed-detail-seed-read-model.ts');
  const seedSql = readText('docs/database/seeds/010_feed_detail_seed.sql');
  const sampleSql = readText(
    'docs/database/samples/feed-detail-read-model.sample.sql'
  );
  const seedReadme = readText('docs/database/seeds/README.md');
  const sampleReadme = readText('docs/database/samples/README.md');
  const packageJson = readText('package.json');
  const serialized = JSON.stringify(feedDetailSeedFixture);

  assertCondition(
    firstRead.length >= 2 &&
      firstRead.every(
        (post) =>
          post.generatedFrom === 'deterministic_fixture' ||
          post.generatedFrom === 'db_seed_projection'
      ),
    'feed detail read-model returns deterministic or DB seed rows'
  );
  assertCondition(
    JSON.stringify(firstRead) === JSON.stringify(secondRead),
    'feed detail fixture read is deterministic without MYSQL_URL'
  );
  assertCondition(
    firstRead.some((post) => post.postPublicId === 'feed_mock_001') &&
      firstRead.some((post) => post.postPublicId === 'feed_mock_003'),
    'feed detail fixture anchors seeded FeedPost detail rows'
  );
  assertCondition(
    firstRead.every(
      (post) =>
        post.body.length > 80 &&
        post.relatedSignalPublicIds.length > 0 &&
        post.comments.length > 0 &&
        post.comments.every((comment) => comment.status === 'visible')
    ),
    'feed detail fixture contains body, related signals, and visible comments'
  );
  assertCondition(
    firstRead.some((post) => post.reactionSummary.savedByMockUser === true) &&
      firstRead.every(
        (post) =>
          typeof post.reactionSummary.likeCount === 'number' &&
          typeof post.reactionSummary.commentCount === 'number' &&
          post.reactionSummary.readByMockUser === true
      ),
    'feed detail fixture contains reactions, saves, and read state'
  );
  assertCondition(
    firstRead.every(
      (post) =>
        post.sourceMeta.mockOnly === true &&
        post.sourceMeta.informationalOnly === true &&
        post.sourceMeta.userScopedMockState === true &&
        post.sourceMeta.realtimeExternalData === false &&
        post.sourceMeta.externalPaidApi === false &&
        post.sourceMeta.financialAdvice === false &&
        post.sourceMeta.tradeIntentCreated === false &&
        post.sourceMeta.realOrder === false &&
        post.sourceMeta.brokerageConnection === false &&
        post.sourceMeta.pushDelivery === false
    ),
    'feed detail fixture keeps mock-safe source meta'
  );
  assertCondition(
    seedSql.includes('feed_mock_detail_001') &&
      seedSql.includes('feed_post_comments') &&
      seedSql.includes('feed_post_reactions') &&
      seedSql.includes('feed_post_saves') &&
      seedSql.includes('feed_post_reads') &&
      seedSql.includes('feed_post_ranking_snapshots') &&
      seedSql.includes('mock/informational only'),
    'seed SQL covers Feed detail body, comments, reactions, saves, reads, and ranking state'
  );
  assertCondition(
    sampleSql.includes('related_signal_public_ids') &&
      sampleSql.includes('visible_comment_count') &&
      sampleSql.includes('saved_by_seed_user') &&
      sampleSql.includes('read_by_seed_user') &&
      sampleSql.includes('moderation_label'),
    'sample SQL documents Feed detail projection columns'
  );
  assertCondition(
    seedReadme.includes('010_feed_detail_seed.sql') &&
      sampleReadme.includes('feed-detail-read-model.sample.sql'),
    'database README files reference the Feed detail seed/read-model sample'
  );
  assertCondition(
    packageJson.includes(
      '"test:feed-detail-read-model": "npx tsx scripts/smoke/feed-detail-read-model-smoke.ts"'
    ),
    'package script exposes feed detail read-model smoke'
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
    'holdRecommendation',
    'guaranteedReturn'
  ].forEach((needle) => {
    assertNotIncludes(source, needle, `feed detail source avoids ${needle}`);
    assertNotIncludes(serialized, needle, `feed detail fixture avoids ${needle}`);
    assertNotIncludes(seedSql, needle, `feed detail seed avoids ${needle}`);
    assertNotIncludes(sampleSql, needle, `feed detail sample avoids ${needle}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
