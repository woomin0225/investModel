/**
 * Verifies GET /api/models/compare for BK-551.
 * The route is read-only and exposes selected public model ids with review-safe comparison fields.
 */

import fs from 'fs';
import path from 'path';

import { NextRequest } from 'next/server';

import { GET as GET_MODEL_COMPARE } from '../../app/api/models/compare/route';

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

type CompareItem = {
  id?: unknown;
  modelPublicId?: string;
  modelVersionPublicId?: string;
  status?: string;
  risk?: {
    leverageAllowed?: boolean;
    derivativeAllowed?: boolean;
    shortSellingAllowed?: boolean;
  };
  mandate?: {
    userOverrideAllowed?: boolean;
  };
  disclosures?: Array<{
    requiresLegalReview?: boolean;
    reviewState?: string;
  }>;
  backtestContext?: {
    isBacktest?: boolean;
  };
  sourceMeta?: {
    mockOnly?: boolean;
    informationalOnly?: boolean;
    backtestOnly?: boolean;
    externalPaidApi?: boolean;
  };
};

async function main() {
  const selectedIds = [
    'model_compare_macro_etf_balance',
    'model_compare_quant_us_leverage_alpha'
  ];
  const compareResponse = await GET_MODEL_COMPARE(
    new NextRequest(
      `http://localhost/api/models/compare?ids=${selectedIds.join(',')}`,
      {
        method: 'GET'
      }
    )
  );
  const compareJson = await compareResponse.json();
  const data = compareJson.data as CompareItem[];

  assertCondition(compareResponse.status === 200, 'compare API responds');
  assertCondition(Array.isArray(data) && data.length === 2, 'selected ids are filtered');
  assertCondition(
    data.map((item) => item.modelPublicId).join(',') === selectedIds.join(','),
    'compare API preserves selected public id request order'
  );
  assertCondition(
    data.every(
      (item) =>
        item.id === undefined &&
        typeof item.modelPublicId === 'string' &&
        typeof item.modelVersionPublicId === 'string'
    ),
    'compare API exposes public identifiers only'
  );
  assertCondition(
    data.every((item) => item.status === 'approved' || item.status === 'live'),
    'compare API exposes visible marketplace statuses only'
  );
  assertCondition(
    data.every(
      (item) =>
        item.risk?.leverageAllowed === false &&
        item.risk?.derivativeAllowed === false &&
        item.risk?.shortSellingAllowed === false &&
        item.mandate?.userOverrideAllowed === false
    ),
    'compare API keeps model-owned risk and mandate boundaries'
  );
  assertCondition(
    data.every(
      (item) =>
        Array.isArray(item.disclosures) &&
        item.disclosures.length >= 3 &&
        item.disclosures.every(
          (disclosure) =>
            disclosure.requiresLegalReview === true &&
            disclosure.reviewState !== 'approved'
        )
    ),
    'compare API returns review-safe disclosure placeholders'
  );
  assertCondition(
    data.every(
      (item) =>
        item.backtestContext?.isBacktest === true &&
        item.sourceMeta?.mockOnly === true &&
        item.sourceMeta?.informationalOnly === true &&
        item.sourceMeta?.backtestOnly === true &&
        item.sourceMeta?.externalPaidApi === false
    ),
    'compare API exposes mock/backtest-only source metadata'
  );
  assertCondition(
    compareJson.meta?.readOnly === true &&
      compareJson.meta?.reviewSafeDisclosuresOnly === true &&
      compareJson.meta?.backtestMetricsOnly === true &&
      compareJson.meta?.financialAdvice === false &&
      compareJson.meta?.modelSelectionCreated === false &&
      compareJson.meta?.tradeIntentCreated === false &&
      compareJson.meta?.realOrder === false &&
      compareJson.meta?.brokerageConnection === false,
    'compare API keeps safe route meta'
  );

  const missingResponse = await GET_MODEL_COMPARE(
    new NextRequest(
      'http://localhost/api/models/compare?ids=no_such_model_public_id',
      {
        method: 'GET'
      }
    )
  );
  const missingJson = await missingResponse.json();

  assertCondition(
    missingResponse.status === 200 &&
      Array.isArray(missingJson.data) &&
      missingJson.data.length === 0,
    'unknown selected id returns an empty list without falling back to defaults'
  );

  const defaultResponse = await GET_MODEL_COMPARE(
    new NextRequest('http://localhost/api/models/compare', {
      method: 'GET'
    })
  );
  const defaultJson = await defaultResponse.json();

  assertCondition(
    defaultResponse.status === 200 &&
      Array.isArray(defaultJson.data) &&
      defaultJson.data.length === 3 &&
      defaultJson.meta?.defaultLimit === 3,
    'missing ids returns the default safe comparison set'
  );

  const forbiddenResponse = await GET_MODEL_COMPARE(
    new NextRequest('http://localhost/api/models/compare', {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'system'
      }
    })
  );

  assertCondition(
    forbiddenResponse.status === 403,
    'system role cannot read public model comparison API'
  );

  const routeSource = readText('app/api/models/compare/route.ts');
  [
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
    assertNotIncludes(routeSource, needle, `compare API route avoids ${needle}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
