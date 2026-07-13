import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import {
  adminModelReviewRequestSchema,
  buildAdminModelReviewResult,
  canReviewInvestmentModel
} from '@/lib/domain/models/admin-review';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route records a mock-safe admin review decision for an InvestmentModel status transition.
 * It validates admin-only access and returns an AuditLog payload, but does not persist state or publish a live model.
 */

type ApiErrorCode = 'forbidden' | 'validation_error' | 'policy_blocked';

type AdminModelReviewRouteContext = {
  params: Promise<{
    modelId: string;
  }>;
};

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
  { params }: AdminModelReviewRouteContext
) {
  const role = readRole(request);

  if (!canReviewInvestmentModel(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only admin roles can review or change InvestmentModel status in this mock-safe API.'
    );
  }

  try {
    const { modelId } = await params;
    const parsed = adminModelReviewRequestSchema.parse(await request.json());
    const result = buildAdminModelReviewResult({
      modelPublicId: modelId,
      input: parsed,
      requestIp: request.headers.get('x-forwarded-for') ?? undefined
    });

    if (!result.allowed) {
      return errorResponse(
        409,
        result.error.code,
        result.error.message,
        {
          currentStatus: parsed.currentStatus,
          decision: parsed.decision
        }
      );
    }

    return Response.json(
      {
        data: result.data,
        meta: {
          routeStatus: 'mock_backed',
          persistence: 'not_persisted',
          auditLogReturned: true,
          reviewCommentReturned: true,
          realModelExecution: false,
          realTrading: false
        }
      },
      { status: 202 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        422,
        'validation_error',
        'Admin model review requests require a valid decision, currentStatus, and review reason comment.',
        error.flatten()
      );
    }

    return errorResponse(
      422,
      'validation_error',
      'Request body must be valid JSON for an admin model review decision.'
    );
  }
}
