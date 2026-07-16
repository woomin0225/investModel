/**
 * Verifies the BK-554 notification fallback read-model fixture.
 * It is local in-app mock read state only and never sends push, email, SMS,
 * account, broker, order, external-provider, or advice notifications.
 */

import fs from 'fs';
import path from 'path';

import { readNotificationUnavailableSeedFixture } from '../../lib/db/notification-read-model';

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
  const firstRead = await readNotificationUnavailableSeedFixture();
  const secondRead = await readNotificationUnavailableSeedFixture();
  const source = readText('lib/db/notification-read-model.ts');
  const sampleSql = readText(
    'docs/database/samples/notification-unavailable-read-model.sample.sql'
  );
  const seedSql = readText(
    'docs/database/seeds/012_notification_unavailable_read_model_seed.sql'
  );
  const seedReadme = readText('docs/database/seeds/README.md');
  const packageJson = readText('package.json');
  const serialized = JSON.stringify(firstRead);

  assertCondition(
    firstRead.userPublicId === 'user_demo_001' &&
      firstRead.rows.length === 2 &&
      firstRead.rows.some((row) => row.fallbackKind === 'empty') &&
      firstRead.rows.some((row) => row.fallbackKind === 'unavailable'),
    'notification fallback fixture exposes empty and unavailable rows'
  );
  assertCondition(
    JSON.stringify(firstRead) === JSON.stringify(secondRead),
    'notification fallback fixture read is deterministic without MYSQL_URL'
  );
  assertCondition(
    firstRead.rows.every(
      (row) =>
        row.sourceType === 'notification_fallback' &&
        row.deliveryChannel === 'in_app_mock' &&
        row.safetyMeta.inAppMockReadStateOnly === true &&
        row.safetyMeta.externalDelivery === false &&
        row.safetyMeta.pushDelivery === false &&
        row.safetyMeta.emailDelivery === false &&
        row.safetyMeta.smsDelivery === false &&
        row.safetyMeta.brokerMessaging === false &&
        row.safetyMeta.orderMessaging === false &&
        row.safetyMeta.accountMessaging === false &&
        row.safetyMeta.financialAdvice === false &&
        row.safetyMeta.secretRequired === false
    ),
    'notification fallback rows distinguish in-app mock read state from external delivery'
  );
  assertCondition(
    firstRead.emptyState.status === 'empty' &&
      firstRead.unavailableState.status === 'unavailable',
    'read model exposes named empty and unavailable fallback states'
  );
  assertCondition(
    sampleSql.includes('notification_fallback') &&
      sampleSql.includes('notification_center_empty_state') &&
      sampleSql.includes('notification_center_unavailable_state') &&
      sampleSql.includes("delivery_channel = 'in_app_mock'") &&
      sampleSql.includes('no push, email, SMS'),
    'sample SQL documents the fallback projection and delivery boundary'
  );
  assertCondition(
    seedSql.includes('012_notification_unavailable_read_model_seed.sql') ||
      seedSql.includes('Notification unavailable read-model seed'),
    'seed SQL identifies the notification unavailable seed'
  );
  assertCondition(
    seedSql.includes("'empty'") &&
      seedSql.includes("'unavailable'") &&
      seedSql.includes("'in_app_mock'") &&
      seedSql.includes('no push, email, SMS'),
    'seed SQL inserts empty/unavailable in-app mock fallback rows only'
  );
  assertCondition(
    seedReadme.includes('012_notification_unavailable_read_model_seed.sql') &&
      seedReadme.includes('empty and unavailable'),
    'seed README lists the notification unavailable fixture seed'
  );
  assertCondition(
    packageJson.includes(
      '"test:notification-unavailable-read-model": "npx tsx scripts/smoke/notification-unavailable-read-model-smoke.ts"'
    ),
    'package script exposes notification unavailable read-model smoke'
  );

  [
    'deliveryProviderApiKey',
    'PUSH_SECRET',
    'SENDGRID_API_KEY',
    'TWILIO_AUTH_TOKEN',
    'brokerage_account',
    'broker_order',
    'accountNumber',
    'bankAccount',
    'routingNumber',
    'externalApiKey',
    'DATABASE_URL=',
    'STRIPE_SECRET_KEY',
    'realBalance',
    'cash available',
    'order placed',
    'guaranteed',
    'risk free',
    'suitabilityApproved',
    'legalApproved'
  ].forEach((needle) => {
    assertNotIncludes(source, needle, `notification source avoids ${needle}`);
    assertNotIncludes(
      serialized,
      needle,
      `notification fixture avoids ${needle}`
    );
    assertNotIncludes(sampleSql, needle, `notification sample avoids ${needle}`);
    assertNotIncludes(seedSql, needle, `notification seed avoids ${needle}`);
  });

  console.log('PASS notification unavailable read-model smoke');
}

async function closeDbClientIfOpen() {
  if (!process.env.MYSQL_URL) {
    return;
  }

  const { client } = await import('../../lib/db/drizzle');
  await client.end();
}

main()
  .then(closeDbClientIfOpen)
  .catch(async (error) => {
    console.error(error);
    await closeDbClientIfOpen();
    process.exit(1);
  });
