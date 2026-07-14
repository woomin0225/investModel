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
  type ModelSelectionRequest,
  validateModelSelectionRequest
} from '@/lib/domain/models/model-selection';
import type { AccessRole } from '@/lib/domain/types';

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

function readRole(request: NextRequest): AccessRole {
  const role = request.headers.get('x-invest-model-role');

  if (
    role === 'public' ||
    role === 'user' ||
    role === 'creator' ||
    role === 'admin' ||
    role === 'system'
  ) {
    return role;
  }

  return 'public';
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
  const role = readRole(request);

  if (!canCreateModelSelection(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only user or admin roles can read mock-safe model selection records.'
    );
  }

  const userPublicId = request.nextUrl.searchParams
    .get('userPublicId')
    ?.trim();

  if (!userPublicId) {
    return errorResponse(
      422,
      'validation_error',
      'userPublicId query parameter is required to read a mock-safe model selection.'
    );
  }

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
          eq(users.publicId, userPublicId),
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
  const role = readRole(request);

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

  const validation = validateModelSelectionRequest(body);

  if (!validation.success) {
    return errorResponse(
      422,
      'validation_error',
      'Model selection requires userPublicId, modelPublicId, and modelVersionPublicId.',
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
            duplicateActiveSelection: true,
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
          duplicateActiveSelection: false,
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
