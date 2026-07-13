import assert from 'node:assert/strict';

import {
  validateCreatorModelDraftRequest,
  type CreatorModelDraftRequest
} from '../../lib/domain/models/creator-draft';

const validDraftRequest: CreatorModelDraftRequest = {
  name: 'Balanced ETF Rotation',
  shortDescription: 'A mock ETF rotation model for product validation.',
  targetMarkets: ['US equities'],
  allowedAssetClasses: ['ETF'],
  assetUniverseSummary: 'Large and liquid US-listed ETF universe only.',
  strategySummary:
    'Uses mock trend and volatility inputs to rotate between broad market ETF candidates without executing orders.',
  leverageAllowed: false,
  derivativesAllowed: false,
  rebalancePolicy: 'Monthly mock rebalance review',
  primaryDataInputs: ['Mock price trend', 'Mock volatility'],
  forbiddenAssets: ['Single-name equities'],
  riskSummary:
    'Backtest samples can lose value and are only used to demonstrate model metadata validation.',
  performanceSource: 'Mock backtest sample only',
  disclosurePlaceholder:
    'Disclosure copy is a placeholder and must be reviewed before public use.'
};

function assertInvalidInput({
  label,
  input,
  expectedField
}: {
  label: string;
  input: unknown;
  expectedField: keyof CreatorModelDraftRequest;
}) {
  const result = validateCreatorModelDraftRequest(input);

  assert.equal(result.success, false, `${label} should fail validation`);

  if (!result.success) {
    assert.ok(
      result.error.fieldErrors[expectedField]?.length,
      `${label} should include ${expectedField} field errors`
    );
    assert.ok(
      result.error.requiredFields.includes(expectedField),
      `${label} should report ${expectedField} as part of the required contract`
    );
  }
}

assertInvalidInput({
  label: 'missing model description fields',
  input: { name: 'Incomplete Draft' },
  expectedField: 'shortDescription'
});

assertInvalidInput({
  label: 'too-short strategy summary',
  input: {
    ...validDraftRequest,
    strategySummary: 'Too short'
  },
  expectedField: 'strategySummary'
});

assertInvalidInput({
  label: 'invalid leverage type',
  input: {
    ...validDraftRequest,
    leverageAllowed: 'false'
  },
  expectedField: 'leverageAllowed'
});

assertInvalidInput({
  label: 'empty asset class list',
  input: {
    ...validDraftRequest,
    allowedAssetClasses: []
  },
  expectedField: 'allowedAssetClasses'
});

const validResult = validateCreatorModelDraftRequest({
  ...validDraftRequest,
  forbiddenAssets: undefined
});

assert.equal(validResult.success, true, 'complete draft input should pass');

if (validResult.success) {
  assert.deepEqual(
    validResult.data.forbiddenAssets,
    [],
    'omitted forbiddenAssets should default to an empty list'
  );
  assert.equal(
    validResult.data.name,
    validDraftRequest.name,
    'validated data should preserve the model name'
  );
}

console.log('Creator draft validation smoke test passed.');
