import { NextRequest } from 'next/server';
import {
  buildUserModelSelectionDto,
  canCreateModelSelection,
  validateModelSelectionRequest
} from '@/lib/domain/models/model-selection';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route records a mock-safe user selection of an InvestmentModel version.
 * It returns the selection payload for UI development only and never persists funds, places orders, or connects brokerage accounts.
 */

type ApiErrorCode = 'forbidden' | 'validation_error';

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

export async function POST(request: NextRequest) {
  const role = readRole(request);

  if (!canCreateModelSelection(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only user or admin roles can create a mock-safe model selection record.'
    );
  }

  try {
    const validation = validateModelSelectionRequest(await request.json());

    if (!validation.success) {
      return errorResponse(
        422,
        'validation_error',
        'Model selection requires userPublicId, modelPublicId, and modelVersionPublicId.',
        validation.error
      );
    }

    return Response.json(
      {
        data: buildUserModelSelectionDto(validation.data),
        meta: {
          routeStatus: 'mock_backed',
          persistence: 'not_persisted',
          recordsModelVersion: true,
          requiresRiskAcknowledgement: true,
          financialOperationsEnabled: false,
          realDeposit: false,
          realOrder: false,
          brokerageConnection: false
        }
      },
      { status: 201 }
    );
  } catch {
    return errorResponse(
      422,
      'validation_error',
      'Request body must be valid JSON for a mock-safe model selection.'
    );
  }
}
