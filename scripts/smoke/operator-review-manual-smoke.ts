/**
 * Verifies the BK-092 operator review manual stays aligned with existing
 * admin review, creator review, report, and compliance boundaries.
 */

import fs from 'fs';
import path from 'path';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath: string) {
  return fs.readFileSync(path.resolve(filePath), 'utf8');
}

function assertIncludes(text: string, needle: string, message: string) {
  assertCondition(text.includes(needle), message);
}

const manual = readText('docs/operations/operator-review-manual.md');
const adminReview = readText('docs/security/admin-review-audit.md');
const creatorReview = readText('docs/security/creator-review-flow.md');
const featureMatrix = readText('docs/compliance/feature-review-matrix.md');
const modelReport = readText('lib/domain/compliance/model-report.ts');
const adminReviewHelper = readText('lib/domain/models/admin-review.ts');
const adminReviewSmoke = readText(
  'scripts/qa/invest-model-admin-review-flow-smoke.ts'
);

[
  'InvestmentModel',
  'ModelVersion',
  'ModelDisclosure',
  'PortfolioMandate',
  'ModelRiskProfile',
  'ModelReport',
  'request_changes',
  'reject',
  'approve',
  'pause',
  'suspend',
  'retire',
  'escalate_legal_review',
  'escalate_security_review',
  'policy_blocked',
  'Review State Vocabulary',
  'draft',
  'pending_review',
  'changes_requested',
  'rejected',
  'approved',
  'live',
  'paused',
  'suspended',
  'retired',
  'pending_review -> approved',
  'pending_review -> changes_requested',
  'pending_review -> rejected',
  'approved -> live',
  'live -> paused',
  'live -> suspended',
  'pending_review -> live',
  'actorRole=admin',
  'allowed',
  'denied',
  'review_required',
  'real fund movement',
  'real order placement or execution',
  'broker, bank, custody, exchange, or payment account connection',
  'legal suitability judgement',
  'operator-review-manual-smoke.ts'
].forEach((needle) => {
  assertIncludes(manual, needle, `manual documents ${needle}`);
});

[
  'Admin Review Actions',
  'Review Checklist',
  'Audit Event Fields',
  'Blocked Admin Cases',
  'Approve legal wording as final legal advice on behalf of Codex'
].forEach((needle) => {
  assertIncludes(adminReview, needle, `admin review doc keeps ${needle}`);
});

[
  'Submit for review',
  'Review Request Snapshot',
  'creator_sensitive_claim_blocked',
  'Blocked Claim Examples'
].forEach((needle) => {
  assertIncludes(creatorReview, needle, `creator review doc keeps ${needle}`);
});

[
  'financial_operation',
  'legal_review',
  'security_review',
  'Required Stop Checks',
  'Legal disclaimer, terms, risk disclosure final text'
].forEach((needle) => {
  assertIncludes(featureMatrix, needle, `feature matrix keeps ${needle}`);
});

[
  'ModelReport only records a concern for operator review',
  'legalConclusion',
  'compensationAmount',
  'brokerOrderId',
  'apiKey',
  'operatorReviewRequired: true',
  'finalLegalJudgment: false',
  'noTradingAction: true'
].forEach((needle) => {
  assertIncludes(modelReport, needle, `model report contract keeps ${needle}`);
});

[
  "approve: [{ from: 'pending_review', to: 'approved' }]",
  "request_changes: [{ from: 'pending_review', to: 'changes_requested' }]",
  "reject: [{ from: 'pending_review', to: 'rejected' }]",
  "publish_live: [{ from: 'approved', to: 'live' }]",
  "pause: [{ from: 'live', to: 'paused' }]",
  "{ from: 'live', to: 'suspended' }",
  "{ from: 'paused', to: 'suspended' }",
  "{ from: 'approved', to: 'retired' }",
  "{ from: 'live', to: 'retired' }",
  "{ from: 'paused', to: 'retired' }",
  "{ from: 'suspended', to: 'retired' }",
  "z.enum([\n  'draft',\n  'pending_review',\n  'changes_requested',\n  'rejected',\n  'approved',\n  'live',\n  'paused',\n  'suspended',\n  'retired'\n])"
].forEach((needle) => {
  assertIncludes(
    adminReviewHelper,
    needle,
    `admin review helper keeps ${needle}`
  );
});

[
  'creator draft -> admin review -> audit log',
  'policy_blocked',
  'admin_model_approved',
  'creator_visible',
  'not_persisted'
].forEach((needle) => {
  assertIncludes(
    adminReviewSmoke,
    needle,
    `admin review flow smoke covers ${needle}`
  );
});
