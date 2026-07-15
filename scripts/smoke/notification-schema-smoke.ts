import { readFileSync } from 'fs';
import path from 'path';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

const dbmlSource = readProjectFile('docs/database/invest-model.dbml');
const mysqlSource = readProjectFile('docs/database/invest-model.mysql.sql');
const schemaSource = readProjectFile('lib/db/schema.ts');
const migrationSource = readProjectFile(
  'lib/db/migrations/0011_user_notifications.sql'
);
const sampleSource = readProjectFile(
  'docs/database/samples/user-notifications-sample.sql'
);
const seedsReadmeSource = readProjectFile('docs/database/seeds/README.md');

for (const [label, source] of [
  ['DBML', dbmlSource],
  ['MySQL SQL', mysqlSource],
  ['Drizzle schema', schemaSource],
  ['migration', migrationSource],
  ['sample SQL', sampleSource],
  ['seed README', seedsReadmeSource]
] as const) {
  assertCondition(
    source.includes('user_notifications') ||
      source.includes('userNotifications'),
    `${label} must reference the user notification read model`
  );
}

for (const requiredColumn of [
  'source_type',
  'source_public_id',
  'delivery_channel',
  'read_at',
  'created_at'
]) {
  assertCondition(
    dbmlSource.includes(requiredColumn) &&
      mysqlSource.includes(requiredColumn) &&
      migrationSource.includes(requiredColumn),
    `notification schema is missing ${requiredColumn}`
  );
}

assertCondition(
  schemaSource.includes("deliveryChannel: varchar('delivery_channel'") &&
    schemaSource.includes(".default('in_app_mock')") &&
    sampleSource.includes("'in_app_mock'"),
  'notification ORM/sample must keep in-app mock delivery only'
);

assertCondition(
  sampleSource.includes('No external delivery or advice') &&
    sampleSource.includes('push') &&
    sampleSource.includes('SMS') &&
    sampleSource.includes('broker') &&
    sampleSource.includes('order'),
  'notification sample must keep no real delivery/order/broker/advice boundary'
);

console.log(
  JSON.stringify(
    {
      status: 'pass',
      scope: 'user_notifications DB schema and sample alignment',
      writesDatabase: false
    },
    null,
    2
  )
);
