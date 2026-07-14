import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import {
  adminForceStopRequestSchema,
  buildAdminForceStopResult,
  canForceStopInvestmentModel
} from '@/lib/domain/models/admin-force-stop';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route returns a mock-safe admin force-stop contract for emergency InvestmentModel suspension.
 * It does not persist state, cancel real orders, move funds, or connect to brokerage systems.
 */

type ApiErrorCode = 'forbidden' | 'validation_error';

type AdminForceStopRouteContext = {
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
  { params }: AdminForceStopRouteContext
) {
  const role = readRole(request);

  if (!canForceStopInvestmentModel(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only admin roles can force-stop an InvestmentModel in this mock-safe API.'
    );
  }

  try {
    const { modelId } = await params;
    const parsed = adminForceStopRequestSchema.parse(await request.json());
    const result = buildAdminForceStopResult({
      modelPublicId: modelId,
      input: parsed,
      requestIp: request.headers.get('x-forwarded-for') ?? undefined
    });

    return Response.json(
      {
        data: result.data,
        meta: {
          routeStatus: 'mock_backed',
          persistence: 'not_persisted',
          auditLogReturned: true,
          realOrderCancellation: false,
          realFundsMovement: false,
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
        'Admin force-stop requests require currentStatus live/paused, severity, affectedSurfaces, and a reason.',
        error.flatten()
      );
    }

    return errorResponse(
      422,
      'validation_error',
      'Request body must be valid JSON for an admin force-stop request.'
    );
  }
}
