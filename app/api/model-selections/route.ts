import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  investmentModels,
  modelVersions,
  userModelSelections,
  users
} from '@/lib/db/schema';
import {
  buildUserModelSelectionDto,
  canCreateModelSelection,
  findForbiddenModelSelectionRequestFields,
  type ModelSelectionRequest,
  validateModelSelectionRequest
} from '@/lib/domain/models/model-selection';
import {
  readInvestModelRole,
  resolveInvestModelUserScope
} from '@/lib/server/invest-model-user-scope';

/**
 * This route records a mock-safe user selection of an InvestmentModel version.
 * It persists only the selected ModelVersion and never stores funds, places orders, or connects brokerage accounts.
 */

type ApiErrorCode =
  | 'forbidden'
  | 'validation_error'
  | 'not_found'
  | 'policy_blocked'
  | 'server_error';

function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown
) {
  return Response.json(
    {
      error: {
        code,
        message,
        details
      }
    },
    { status }
  );
}

function canSelectModel(model: typeof investmentModels.$inferSelect) {
  return (
    (model.status === 'approved' || model.status === 'live') &&
    model.visibility === 'marketplace'
  );
}

function toSelectionDto(
  input: ModelSelectionRequest,
  row: typeof userModelSelections.$inferSelect
) {
  return buildUserModelSelectionDto(
    {
      ...input,
      riskAcknowledgedAt: row.riskAcknowledgedAt?.toISOString()
    },
    row.selectedAt.toISOString(),
    'persisted',
    row.publicId
  );
}

function selectionMeta(extra?: Record<string, boolean | string>) {
  return {
    routeStatus: 'db_backed',
    persistence: 'persisted',
    recordsModelVersion: true,
    requiresRiskAcknowledgement: true,
    financialOperationsEnabled: false,
    realDeposit: false,
    realOrder: false,
    brokerageConnection: false,
    ...extra
  };
}

export async function GET(request: NextRequest) {
  const role = readInvestModelRole(request);

  if (!canCreateModelSelection(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only user or admin roles can read mock-safe model selection records.'
    );
  }

  const userScope = await resolveInvestModelUserScope(request);

  try {
    const [row] = await db
      .select({
        selection: userModelSelections,
        userPublicId: users.publicId,
        modelPublicId: investmentModels.publicId,
        modelVersionPublicId: modelVersions.publicId
      })
      .from(userModelSelections)
      .innerJoin(users, eq(userModelSelections.userId, users.id))
      .innerJoin(
        investmentModels,
        eq(userModelSelections.modelId, investmentModels.id)
      )
      .innerJoin(
        modelVersions,
        eq(userModelSelections.modelVersionId, modelVersions.id)
      )
      .where(
        and(
          eq(users.publicId, userScope.userPublicId),
          eq(userModelSelections.status, 'active')
        )
      )
      .orderBy(desc(userModelSelections.selectedAt))
      .limit(1);

    if (!row) {
      return Response.json(
        {
          data: null,
          meta: selectionMeta({
            userPublicId: userScope.userPublicId,
            userScopeSource: userScope.source,
            activeSelectionFound: false,
            emptyState: 'no_active_model_selection'
          })
        },
        { status: 200 }
      );
    }

    return Response.json({
      data: toSelectionDto(
        {
          userPublicId: row.userPublicId,
          modelPublicId: row.modelPublicId,
          modelVersionPublicId: row.modelVersionPublicId,
          riskAcknowledgedAt:
            row.selection.riskAcknowledgedAt?.toISOString() ??
            row.selection.selectedAt.toISOString()
        },
        row.selection
      ),
      meta: selectionMeta({
        userPublicId: userScope.userPublicId,
        userScopeSource: userScope.source,
        activeSelectionFound: true
      })
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Model selection could not be read. No funds, orders, or brokerage actions were attempted.'
    );
  }
}

export async function POST(request: NextRequest) {
  const role = readInvestModelRole(request);

  if (!canCreateModelSelection(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only user or admin roles can create a mock-safe model selection record.'
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      422,
      'validation_error',
      'Request body must be valid JSON for a mock-safe model selection.'
    );
  }

  const userScope = await resolveInvestModelUserScope(request);
  const forbiddenFields = findForbiddenModelSelectionRequestFields(body);

  if (forbiddenFields.length > 0) {
    return errorResponse(
      403,
      'policy_blocked',
      'Model selection records only the chosen ModelVersion. User mandate, allocation, leverage, risk preference, deposit, brokerage, or balance overrides are blocked.',
      {
        forbiddenFields,
        financialOperationsEnabled: false,
        realDeposit: false,
        realOrder: false,
        brokerageConnection: false
      }
    );
  }

  const scopedBody =
    typeof body === 'object' && body !== null
      ? { ...body, userPublicId: userScope.userPublicId }
      : body;
  const validation = validateModelSelectionRequest(scopedBody);

  if (!validation.success) {
    return errorResponse(
      422,
      'validation_error',
      'Model selection requires modelPublicId and modelVersionPublicId. User scope is resolved by the session.',
      validation.error
    );
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.publicId, validation.data.userPublicId))
      .limit(1);

    if (!user || user.deletedAt) {
      return errorResponse(
        404,
        'not_found',
        'User public id was not found for this mock-safe model selection.'
      );
    }

    const [model] = await db
      .select()
      .from(investmentModels)
      .where(eq(investmentModels.publicId, validation.data.modelPublicId))
      .limit(1);

    if (!model) {
      return errorResponse(
        404,
        'not_found',
        'InvestmentModel public id was not found for this mock-safe selection.'
      );
    }

    if (!canSelectModel(model)) {
      return errorResponse(
        403,
        'policy_blocked',
        'Only approved or live marketplace InvestmentModels can be selected.'
      );
    }

    const [modelVersion] = await db
      .select()
      .from(modelVersions)
      .where(
        and(
          eq(modelVersions.publicId, validation.data.modelVersionPublicId),
          eq(modelVersions.modelId, model.id)
        )
      )
      .limit(1);

    if (!modelVersion || modelVersion.retiredAt) {
      return errorResponse(
        404,
        'not_found',
        'ModelVersion public id was not found for this InvestmentModel.'
      );
    }

    if (model.currentVersionId !== modelVersion.id) {
      return errorResponse(
        403,
        'policy_blocked',
        'Only the current live ModelVersion can be selected. Older or non-current versions remain read-only metadata.',
        {
          modelPublicId: model.publicId,
          modelVersionPublicId: modelVersion.publicId,
          currentVersionRequired: true,
          financialOperationsEnabled: false,
          realDeposit: false,
          realOrder: false,
          brokerageConnection: false
        }
      );
    }

    const [existingSelection] = await db
      .select()
      .from(userModelSelections)
      .where(
        and(
          eq(userModelSelections.userId, user.id),
          eq(userModelSelections.modelId, model.id),
          eq(userModelSelections.modelVersionId, modelVersion.id),
          eq(userModelSelections.status, 'active')
        )
      )
      .limit(1);

    if (existingSelection) {
      return Response.json(
        {
          data: toSelectionDto(validation.data, existingSelection),
          meta: selectionMeta({
            userPublicId: userScope.userPublicId,
            userScopeSource: userScope.source,
            duplicateActiveSelection: true
          })
        },
        { status: 200 }
      );
    }

    const selectedAt = new Date();
    const riskAcknowledgedAt = validation.data.riskAcknowledgedAt
      ? new Date(validation.data.riskAcknowledgedAt)
      : selectedAt;

    const [createdSelectionId] = await db
      .insert(userModelSelections)
      .values({
        publicId: `model_selection_${crypto.randomUUID()}`,
        userId: user.id,
        modelId: model.id,
        modelVersionId: modelVersion.id,
        status: 'active',
        riskAcknowledgedAt,
        selectedAt
      })
      .$returningId();

    const [createdSelection] = await db
      .select()
      .from(userModelSelections)
      .where(eq(userModelSelections.id, createdSelectionId.id))
      .limit(1);

    if (!createdSelection) {
      return errorResponse(
        500,
        'server_error',
        'Model selection was created but could not be loaded.'
      );
    }

    return Response.json(
      {
        data: toSelectionDto(validation.data, createdSelection),
        meta: selectionMeta({
          userPublicId: userScope.userPublicId,
          userScopeSource: userScope.source,
          duplicateActiveSelection: false
        })
      },
      { status: 201 }
    );
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Model selection could not be persisted. No funds, orders, or brokerage actions were attempted.'
    );
  }
}
