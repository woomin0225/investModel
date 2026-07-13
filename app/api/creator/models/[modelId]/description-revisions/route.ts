import { NextRequest } from 'next/server';
import {
  canRequestModelDescriptionRevision,
  validateCreatorDescriptionRevisionRequest
} from '@/lib/domain/models/description-revision';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route accepts creator requests to revise reviewed InvestmentModel descriptions.
 * It returns a mock-safe pending_review ModelVersion plan and does not mutate live copy, persist rows, or execute model files.
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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ modelId: string }> }
) {
  const role = readRole(request);

  if (!canRequestModelDescriptionRevision(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only creator or admin roles can request a model description revision.'
    );
  }

  const { modelId } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      422,
      'validation_error',
      'Request body must be valid JSON for a model description revision.'
    );
  }

  const validation = validateCreatorDescriptionRevisionRequest({
    actorRole: role,
    modelPublicId: modelId,
    input: body
  });

  if (!validation.success) {
    return errorResponse(
      422,
      'validation_error',
      'Description revision request must include creator ownership, current ModelVersion, changed fields, and a change summary.',
      validation.error
    );
  }

  return Response.json(
    {
      data: validation.plan,
      meta: {
        routeStatus: 'mock_backed',
        persistence: 'not_persisted',
        liveMutationAllowed: false,
        reviewRequiredBeforePublicDiscovery: true
      }
    },
    { status: 202 }
  );
}
