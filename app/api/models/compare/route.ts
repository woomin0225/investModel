import { NextRequest } from 'next/server';

import { readModelCompareSeedFixture } from '@/lib/db/model-compare-read-model';
import type { ModelCompareItem } from '@/lib/db/model-compare-read-model';
import { canReadModels } from '@/lib/domain/models/model-read-model';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route reads model-owned comparison metadata for selected public ids.
 * It never creates advice, model selections, TradeIntent rows, orders, brokerage actions, or allocation state.
 */

type ApiErrorCode = 'forbidden' | 'server_error';

const MODEL_COMPARE_DEFAULT_LIMIT = 3;
const MODEL_COMPARE_MAX_LIMIT = 5;

function errorResponse(status: number, code: ApiErrorCode, message: string) {
  return Response.json(
    {
      error: {
        code,
        message
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

function parseSelectedPublicIds(value: string | null) {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, MODEL_COMPARE_MAX_LIMIT)
    )
  );
}

function orderBySelectedPublicIds(
  items: ModelCompareItem[],
  selectedPublicIds: string[]
) {
  const itemsByPublicId = new Map(
    items.map((item) => [item.modelPublicId, item])
  );

  return selectedPublicIds.reduce<ModelCompareItem[]>((ordered, publicId) => {
    const item = itemsByPublicId.get(publicId);

    if (item) {
      ordered.push(item);
    }

    return ordered;
  }, []);
}

export async function GET(request: NextRequest) {
  const role = readRole(request);

  if (!canReadModels(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only public, signed-in user, or admin roles can read marketplace model comparisons.'
    );
  }

  const selectedPublicIds = parseSelectedPublicIds(
    request.nextUrl.searchParams.get('ids')
  );

  try {
    const compareItems = await readModelCompareSeedFixture();
    const visibleItems = compareItems.filter(
      (item) => item.status === 'approved' || item.status === 'live'
    );
    const filteredItems =
      selectedPublicIds.length > 0
        ? orderBySelectedPublicIds(visibleItems, selectedPublicIds)
        : visibleItems.slice(0, MODEL_COMPARE_DEFAULT_LIMIT);

    return Response.json({
      data: filteredItems,
      meta: {
        routeStatus: 'db_backed_with_fixture_fallback',
        persistence:
          filteredItems.some((item) => item.generatedFrom === 'db_seed_projection')
            ? 'persisted'
            : 'deterministic_fixture',
        sourceTables: [
          'investment_models',
          'model_versions',
          'model_risk_profiles',
          'portfolio_mandates',
          'model_disclosures',
          'model_performance_snapshots'
        ],
        selectedPublicIds,
        requestedCount: selectedPublicIds.length,
        returnedCount: filteredItems.length,
        defaultLimit:
          selectedPublicIds.length === 0 ? MODEL_COMPARE_DEFAULT_LIMIT : null,
        maxSelectedPublicIds: MODEL_COMPARE_MAX_LIMIT,
        filtersApplied: {
          selectedPublicIds: selectedPublicIds.length > 0,
          marketplaceVisibleOnly: true
        },
        marketplaceVisibleOnly: true,
        reviewSafeDisclosuresOnly: true,
        backtestMetricsOnly: true,
        readOnly: true,
        mockOnly: true,
        informationalOnly: true,
        externalPaidApi: false,
        financialAdvice: false,
        modelSelectionCreated: false,
        tradeIntentCreated: false,
        realOrder: false,
        brokerageConnection: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Marketplace model comparison could not be read. No advice, model selection, TradeIntent, orders, or brokerage actions were created.'
    );
  }
}
