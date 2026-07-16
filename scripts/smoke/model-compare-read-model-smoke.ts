/**
 * Verifies the BK-549 model compare seed/read-model fixture.
 * It uses risk, mandate, disclosure, and backtest metadata only.
 */

import fs from 'fs';
import path from 'path';

import {
  modelCompareSeedFixture,
  readModelCompareSeedFixture
} from '../../lib/db/model-compare-read-model';

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
  const firstRead = await readModelCompareSeedFixture();
  const secondRead = await readModelCompareSeedFixture();
  const source = readText('lib/db/model-compare-read-model.ts');
  const seedSql = readText(
    'docs/database/seeds/011_model_compare_read_model_seed.sql'
  );
  const sampleSql = readText(
    'docs/database/samples/model-compare-read-model.sample.sql'
  );
  const packageJson = readText('package.json');
  const serialized = JSON.stringify(modelCompareSeedFixture);

  assertCondition(
    firstRead.length === 3 &&
      firstRead.every(
        (item) =>
          item.generatedFrom === 'deterministic_fixture' ||
          item.generatedFrom === 'db_seed_projection'
      ),
    'model compare fixture returns three deterministic or DB seed items'
  );
  assertCondition(
    JSON.stringify(firstRead) === JSON.stringify(secondRead),
    'model compare fixture read is deterministic without MYSQL_URL'
  );
  assertCondition(
    firstRead.every(
      (item) =>
        item.risk.leverageAllowed === false &&
        item.risk.derivativeAllowed === false &&
        item.risk.shortSellingAllowed === false &&
        item.mandate.userOverrideAllowed === false
    ),
    'model compare fixture keeps model-owned risk and mandate boundaries'
  );
  assertCondition(
    firstRead.every(
      (item) =>
        item.disclosures.length >= 3 &&
        item.disclosures.some(
          (disclosure) => disclosure.type === 'backtest_notice'
        ) &&
        item.disclosures.every(
          (disclosure) => disclosure.requiresLegalReview === true
        )
    ),
    'model compare fixture includes disclosure placeholders'
  );
  assertCondition(
    firstRead.every(
      (item) =>
        item.backtestContext.isBacktest === true &&
        item.backtestContext.periodLabel.includes('backtest') &&
        item.backtestContext.cumulativeReturn.context ===
          'backtest_placeholder' &&
        item.backtestContext.volatility.context === 'backtest_placeholder' &&
        item.backtestContext.maxDrawdown.context === 'backtest_placeholder'
    ),
    'model compare fixture exposes backtest placeholder context'
  );
  assertCondition(
    firstRead.every(
      (item) =>
        item.sourceMeta.mockOnly === true &&
        item.sourceMeta.informationalOnly === true &&
        item.sourceMeta.backtestOnly === true &&
        item.sourceMeta.externalPaidApi === false &&
        item.sourceMeta.sourceTables.includes('model_risk_profiles') &&
        item.sourceMeta.sourceTables.includes('portfolio_mandates') &&
        item.sourceMeta.sourceTables.includes('model_disclosures') &&
        item.sourceMeta.sourceTables.includes('model_performance_snapshots')
    ),
    'model compare fixture records mock-safe source metadata'
  );
  assertCondition(
    seedSql.includes('model_compare_quant_us_leverage_alpha') &&
      seedSql.includes('model_compare_macro_etf_balance') &&
      seedSql.includes('model_compare_defensive_income_rotation') &&
      seedSql.includes('sample_backtest_12m') &&
      seedSql.includes('user_override_allowed') &&
      seedSql.includes('requires_legal_review'),
    'seed SQL documents the three model compare rows'
  );
  assertCondition(
    sampleSql.includes('investment_models') &&
      sampleSql.includes('model_risk_profiles') &&
      sampleSql.includes('portfolio_mandates') &&
      sampleSql.includes('model_disclosures') &&
      sampleSql.includes('model_performance_snapshots') &&
      sampleSql.includes('backtest_period_label'),
    'sample SQL documents model compare projection'
  );
  assertCondition(
    packageJson.includes(
      '"test:model-compare-read-model": "npx tsx scripts/smoke/model-compare-read-model-smoke.ts"'
    ),
    'package script exposes model compare read-model smoke'
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
    'liveQuoteProvider',
    'externalApiKey',
    'realBalance',
    'buySignal',
    'sellSignal',
    'holdRecommendation',
    'suitabilityApproved',
    'suitabilityAssessment',
    'suitabilityProfile',
    'legalApproved'
  ].forEach((needle) => {
    assertNotIncludes(source, needle, `model compare source avoids ${needle}`);
    assertNotIncludes(
      serialized,
      needle,
      `model compare fixture avoids ${needle}`
    );
    assertNotIncludes(seedSql, needle, `model compare seed avoids ${needle}`);
    assertNotIncludes(
      sampleSql,
      needle,
      `model compare sample avoids ${needle}`
    );
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
