import { NextRequest } from 'next/server';
import {
  buildInvestmentModelDraftDto,
  canCreateModelDraft,
  validateCreatorModelDraftRequest
} from '@/lib/domain/models/creator-draft';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route creates a mock-safe InvestmentModel draft for future creator onboarding.
 * It does not persist to a real database, execute uploaded model files, or expose draft models to public discovery.
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

  if (!canCreateModelDraft(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only creator or admin roles can create a model draft in this mock-safe API.'
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      422,
      'validation_error',
      'Request body must be valid JSON for a model draft.'
    );
  }

  const validation = validateCreatorModelDraftRequest(body);

  if (!validation.success) {
    return errorResponse(
      422,
      'validation_error',
      'Model draft request is missing required creator, mandate, risk, or disclosure fields.',
      validation.error
    );
  }

  const draft = buildInvestmentModelDraftDto(validation.data);

  return Response.json(
    {
      data: draft,
      meta: {
        routeStatus: 'mock_backed',
        persistence: 'not_persisted',
        approvalRequiredBeforePublicDiscovery: true
      }
    },
    { status: 201 }
  );
}
