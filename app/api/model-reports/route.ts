import { NextRequest } from 'next/server';
import {
  buildModelReportDto,
  canCreateModelReport,
  validateModelReportRequest
} from '@/lib/domain/compliance/model-report';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route records mock-safe user concerns about model copy or performance display.
 * It only routes a report to operator review and never makes legal, compensation, account, or trading decisions.
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

  if (!canCreateModelReport(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only user or admin roles can create a mock-safe model report.'
    );
  }

  try {
    const validation = validateModelReportRequest(await request.json());

    if (!validation.success) {
      return errorResponse(
        422,
        'validation_error',
        'Model report requires reporterUserPublicId, modelPublicId, reportType, and summary.',
        validation.error
      );
    }

    return Response.json(
      {
        data: buildModelReportDto(validation.data),
        meta: {
          routeStatus: 'mock_backed',
          persistence: 'not_persisted',
          operatorReviewRequired: true,
          legalReviewPlaceholder: true,
          finalLegalJudgment: false,
          financialOperationsEnabled: false,
          tradingActionEnabled: false
        }
      },
      { status: 201 }
    );
  } catch {
    return errorResponse(
      422,
      'validation_error',
      'Request body must be valid JSON for a mock-safe model report.'
    );
  }
}
