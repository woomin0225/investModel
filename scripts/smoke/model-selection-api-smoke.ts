/**
 * This smoke test verifies POST /api/model-selections with tracked, temporary DB rows.
 * It creates and cleans up only model_selection_smoke_* records and never touches funds, orders, or brokerage accounts.
 */

import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { GET, POST } from '../../app/api/model-selections/route';
import { db, client } from '../../lib/db/drizzle';
import {
  investmentModels,
  modelCreators,
  modelVersions,
  userModelSelections,
  users
} from '../../lib/db/schema';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const smokeUserPublicId = 'user_model_selection_smoke';
const demoUserPublicId = 'user_demo_001';
const smokeModelPublicId = 'model_selection_smoke_model';
const smokeModelVersionPublicId = 'model_version_selection_smoke_v1';
const smokeBlockedModelVersionPublicId = 'model_version_selection_smoke_blocked';
const smokeRetiredModelVersionPublicId = 'model_version_selection_smoke_retired';
const smokeEmail = 'model-selection-smoke@example.test';
const smokeSlug = 'model-selection-smoke-model';

async function cleanupSmokeRows() {
  const [demoUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.publicId, demoUserPublicId))
    .limit(1);

  const [smokeUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.publicId, smokeUserPublicId))
    .limit(1);

  const [smokeModel] = await db
    .select({ id: investmentModels.id })
    .from(investmentModels)
    .where(eq(investmentModels.publicId, smokeModelPublicId))
    .limit(1);

  if (demoUser && smokeModel) {
    await db
      .delete(userModelSelections)
      .where(
        and(
          eq(userModelSelections.userId, demoUser.id),
          eq(userModelSelections.modelId, smokeModel.id)
        )
      );
  }

  if (smokeUser && smokeModel) {
    await db
      .delete(userModelSelections)
      .where(
        and(
          eq(userModelSelections.userId, smokeUser.id),
          eq(userModelSelections.modelId, smokeModel.id)
        )
      );
  }

  if (smokeModel) {
    await db
      .update(investmentModels)
      .set({ currentVersionId: null })
      .where(eq(investmentModels.id, smokeModel.id));
  }

  if (smokeModel) {
    await db
      .delete(modelVersions)
      .where(eq(modelVersions.modelId, smokeModel.id));
  }

  if (smokeModel) {
    await db
      .delete(investmentModels)
      .where(eq(investmentModels.id, smokeModel.id));
  }

  if (smokeUser) {
    await db.delete(modelCreators).where(eq(modelCreators.userId, smokeUser.id));
    await db.delete(users).where(eq(users.id, smokeUser.id));
  }
}

async function createSmokeRows() {
  const [user] = await db
    .insert(users)
    .values({
      publicId: smokeUserPublicId,
      email: smokeEmail,
      passwordHash: 'model-selection-smoke-password-hash',
      role: 'member'
    })
    .$returningId();

  const [creator] = await db
    .insert(modelCreators)
    .values({
      userId: user.id,
      displayName: 'Model Selection Smoke Creator',
      verificationStatus: 'verified'
    })
    .$returningId();

  const [model] = await db
    .insert(investmentModels)
    .values({
      publicId: smokeModelPublicId,
      creatorId: creator.id,
      slug: smokeSlug,
      name: 'Model Selection Smoke Model',
      status: 'live',
      visibility: 'marketplace',
      shortDescription:
        'Temporary smoke model for DB-backed selection verification.'
    })
    .$returningId();

  const [version] = await db
    .insert(modelVersions)
    .values({
      publicId: smokeModelVersionPublicId,
      modelId: model.id,
      versionLabel: 'v1-smoke',
      strategySummary:
        'Temporary smoke version that records metadata only and does not execute a model.',
      targetMarkets: 'US equities sample universe',
      assetUniverseSummary:
        'Sample large-cap instruments for smoke verification only.',
      rebalanceFrequency: 'not executed',
      inputDataSummary: 'Tracked smoke rows only',
      forbiddenScope:
        'No real deposits, orders, brokerage connections, or suitability decisions.',
      modelArtifactStatus: 'metadata_only',
      createdByUserId: user.id
    })
    .$returningId();

  const [blockedVersion] = await db
    .insert(modelVersions)
    .values({
      publicId: smokeBlockedModelVersionPublicId,
      modelId: model.id,
      versionLabel: 'v0-blocked-smoke',
      strategySummary:
        'Older smoke version that must remain read-only and non-selectable.',
      targetMarkets: 'US equities sample universe',
      assetUniverseSummary:
        'Sample large-cap instruments for blocked smoke verification only.',
      rebalanceFrequency: 'not executed',
      inputDataSummary: 'Tracked blocked smoke rows only',
      forbiddenScope:
        'No real deposits, orders, brokerage connections, mandate overrides, or suitability decisions.',
      modelArtifactStatus: 'metadata_only',
      createdByUserId: user.id
    })
    .$returningId();

  const [retiredVersion] = await db
    .insert(modelVersions)
    .values({
      publicId: smokeRetiredModelVersionPublicId,
      modelId: model.id,
      versionLabel: 'v-retired-smoke',
      strategySummary:
        'Retired smoke version that must remain hidden from selection writes.',
      targetMarkets: 'US equities sample universe',
      assetUniverseSummary:
        'Sample large-cap instruments for retired smoke verification only.',
      rebalanceFrequency: 'not executed',
      inputDataSummary: 'Tracked retired smoke rows only',
      forbiddenScope:
        'No real deposits, orders, brokerage connections, mandate overrides, or suitability decisions.',
      modelArtifactStatus: 'metadata_only',
      createdByUserId: user.id,
      retiredAt: new Date()
    })
    .$returningId();

  await db
    .update(investmentModels)
    .set({ currentVersionId: version.id })
    .where(eq(investmentModels.id, model.id));

  return {
    userId: user.id,
    modelId: model.id,
    versionId: version.id,
    blockedVersionId: blockedVersion.id,
    retiredVersionId: retiredVersion.id
  };
}

async function callModelSelectionApi(
  overrides: Record<string, unknown> = {},
  headers: Record<string, string> = {}
) {
  return POST(
    new NextRequest('http://localhost/api/model-selections', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-invest-model-role': 'user',
        ...headers
      },
      body: JSON.stringify({
        modelPublicId: smokeModelPublicId,
        modelVersionPublicId: smokeModelVersionPublicId,
        riskAcknowledgedAt: new Date().toISOString(),
        ...overrides
      })
    })
  );
}

async function readModelSelectionApi() {
  return GET(
    new NextRequest('http://localhost/api/model-selections', {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );
}

async function main() {
  await cleanupSmokeRows();
  const smokeRows = await createSmokeRows();
  const [demoUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.publicId, demoUserPublicId))
    .limit(1);

  assertCondition(Boolean(demoUser), 'demo user must exist for session fallback scope');

  await db
    .update(investmentModels)
    .set({ visibility: 'private', status: 'draft' })
    .where(eq(investmentModels.id, smokeRows.modelId));
  const privateModelResponse = await callModelSelectionApi();
  const privateModelJson = await privateModelResponse.json();

  await db
    .update(investmentModels)
    .set({ visibility: 'marketplace', status: 'live' })
    .where(eq(investmentModels.id, smokeRows.modelId));

  const forbiddenOverrideResponse = await callModelSelectionApi({
    mandateOverride: { targetAllocationPct: 90 },
    leveragePreference: '2x',
    riskPreference: 'aggressive',
    depositAmount: '10000',
    brokerageAccountId: 'acct_real_like_forbidden'
  });
  const forbiddenOverrideJson = await forbiddenOverrideResponse.json();

  const nonCurrentVersionResponse = await callModelSelectionApi({
    modelVersionPublicId: smokeBlockedModelVersionPublicId
  });
  const nonCurrentVersionJson = await nonCurrentVersionResponse.json();
  const retiredVersionResponse = await callModelSelectionApi({
    modelVersionPublicId: smokeRetiredModelVersionPublicId
  });
  const retiredVersionJson = await retiredVersionResponse.json();

  const preAllowedRows = await db
    .select({ publicId: userModelSelections.publicId })
    .from(userModelSelections)
    .where(eq(userModelSelections.modelId, smokeRows.modelId));

  const firstResponse = await callModelSelectionApi();
  const firstJson = await firstResponse.json();
  const secondResponse = await callModelSelectionApi();
  const secondJson = await secondResponse.json();
  const readResponse = await readModelSelectionApi();
  const readJson = await readResponse.json();

  const persistedRows = await db
    .select({
      publicId: userModelSelections.publicId,
      status: userModelSelections.status
    })
    .from(userModelSelections)
    .where(
      and(
        eq(userModelSelections.userId, smokeRows.userId),
        eq(userModelSelections.modelId, smokeRows.modelId),
        eq(userModelSelections.modelVersionId, smokeRows.versionId),
        eq(userModelSelections.status, 'active')
      )
    );
  const demoPersistedRows = await db
    .select({
      publicId: userModelSelections.publicId,
      status: userModelSelections.status
    })
    .from(userModelSelections)
    .where(
      and(
        eq(userModelSelections.userId, demoUser!.id),
        eq(userModelSelections.modelId, smokeRows.modelId),
        eq(userModelSelections.modelVersionId, smokeRows.versionId),
        eq(userModelSelections.status, 'active')
      )
    );

  assertCondition(
    privateModelResponse.status === 403 &&
      privateModelJson.error?.code === 'policy_blocked',
    'private or draft InvestmentModels should be policy_blocked'
  );
  assertCondition(
    forbiddenOverrideResponse.status === 403 &&
      forbiddenOverrideJson.error?.code === 'policy_blocked' &&
      forbiddenOverrideJson.error?.details?.financialOperationsEnabled === false &&
      forbiddenOverrideJson.error?.details?.realDeposit === false &&
      forbiddenOverrideJson.error?.details?.realOrder === false &&
      forbiddenOverrideJson.error?.details?.brokerageConnection === false,
    'mandate, allocation, leverage, risk, deposit, or brokerage override fields should be policy_blocked'
  );
  assertCondition(
    Array.isArray(forbiddenOverrideJson.error?.details?.forbiddenFields) &&
      forbiddenOverrideJson.error.details.forbiddenFields.includes('mandateOverride') &&
      forbiddenOverrideJson.error.details.forbiddenFields.includes('leveragePreference') &&
      forbiddenOverrideJson.error.details.forbiddenFields.includes('riskPreference') &&
      forbiddenOverrideJson.error.details.forbiddenFields.includes('depositAmount') &&
      forbiddenOverrideJson.error.details.forbiddenFields.includes('brokerageAccountId'),
    'policy_blocked override response should name forbidden selection fields'
  );
  assertCondition(
    nonCurrentVersionResponse.status === 403 &&
      nonCurrentVersionJson.error?.code === 'policy_blocked' &&
      nonCurrentVersionJson.error?.details?.currentVersionRequired === true &&
      nonCurrentVersionJson.error?.details?.financialOperationsEnabled === false &&
      nonCurrentVersionJson.error?.details?.realDeposit === false &&
      nonCurrentVersionJson.error?.details?.realOrder === false &&
      nonCurrentVersionJson.error?.details?.brokerageConnection === false,
    'non-current ModelVersions should be policy_blocked without financial side effects'
  );
  assertCondition(
    retiredVersionResponse.status === 404 &&
      retiredVersionJson.error?.code === 'not_found',
    'retired ModelVersions should be hidden as not_found'
  );
  assertCondition(
    preAllowedRows.length === 0,
    'policy_blocked model-selection calls should not persist user_model_selections rows'
  );
  assertCondition(firstResponse.status === 201, 'first selection should create');
  assertCondition(secondResponse.status === 200, 'duplicate selection should reuse');
  assertCondition(
    persistedRows.length === 0,
    'client-provided smoke user should not receive a selection'
  );
  assertCondition(
    demoPersistedRows.length === 1,
    'one active demo-scoped user_model_selections row should be persisted'
  );
  assertCondition(
    firstJson.meta?.persistence === 'persisted' &&
      secondJson.meta?.persistence === 'persisted',
    'responses should be DB-backed and persisted'
  );
  assertCondition(
    firstJson.meta?.duplicateActiveSelection === false &&
      secondJson.meta?.duplicateActiveSelection === true &&
      firstJson.meta?.clientUserPublicIdIgnored === undefined &&
      secondJson.meta?.clientUserPublicIdIgnored === undefined,
    'duplicateActiveSelection should distinguish create and reuse without client userPublicId compatibility metadata'
  );
  assertCondition(
    firstJson.data?.userPublicId === demoUserPublicId &&
      secondJson.data?.userPublicId === demoUserPublicId,
    'POST responses should be scoped to the server-resolved demo user'
  );
  assertCondition(
    firstJson.meta?.financialOperationsEnabled === false &&
      firstJson.meta?.realDeposit === false &&
      firstJson.meta?.realOrder === false &&
      firstJson.meta?.brokerageConnection === false,
    'selection API must not enable financial operations'
  );
  assertCondition(readResponse.status === 200, 'GET selection should respond');
  assertCondition(
    readJson.meta?.activeSelectionFound === true &&
      readJson.data?.publicId === demoPersistedRows[0]?.publicId &&
      readJson.meta?.clientUserPublicIdIgnored === undefined,
    'GET selection should read the same active DB selection'
  );
  assertCondition(
    readJson.data?.userPublicId === demoUserPublicId,
    'GET response should be scoped to the server-resolved demo user'
  );
  assertCondition(
    readJson.data?.modelPublicId === smokeModelPublicId &&
      readJson.data?.modelVersionPublicId === smokeModelVersionPublicId,
    'GET selection should include model and version public ids'
  );
  assertCondition(
    readJson.meta?.financialOperationsEnabled === false &&
      readJson.meta?.realDeposit === false &&
      readJson.meta?.realOrder === false &&
      readJson.meta?.brokerageConnection === false,
    'GET selection read model must stay mock-safe'
  );

  console.log(
    JSON.stringify(
      {
        status: 'pass',
        flow: 'POST /api/model-selections -> persist -> duplicate reuse',
        checked: {
          firstStatus: firstResponse.status,
          secondStatus: secondResponse.status,
          readStatus: readResponse.status,
          activeSelectionCount: demoPersistedRows.length,
          clientRequestedSelectionCount: persistedRows.length,
          persistence: firstJson.meta?.persistence,
          duplicateActiveSelection: secondJson.meta?.duplicateActiveSelection,
          privateModelPolicyCode: privateModelJson.error?.code,
          forbiddenOverridePolicyCode: forbiddenOverrideJson.error?.code,
          nonCurrentVersionPolicyCode: nonCurrentVersionJson.error?.code,
          retiredVersionCode: retiredVersionJson.error?.code,
          blockedCallsPersistedRows: preAllowedRows.length,
          clientUserPublicIdCompatibility:
            firstJson.meta?.clientUserPublicIdIgnored ?? 'not_exposed',
          readActiveSelectionFound: readJson.meta?.activeSelectionFound,
          readSelectionPublicId: readJson.data?.publicId,
          financialOperationsEnabled:
            firstJson.meta?.financialOperationsEnabled,
          realDeposit: firstJson.meta?.realDeposit,
          realOrder: firstJson.meta?.realOrder,
          brokerageConnection: firstJson.meta?.brokerageConnection
        }
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanupSmokeRows();
    await client.end();
  });
