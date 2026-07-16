import { NextRequest } from 'next/server';

import {
  type InterestSaveItem,
  type InterestSaveItemType,
  readInterestSaveSeedFixture
} from '@/lib/db/interest-save-read-model';
import type { AccessRole } from '@/lib/domain/types';
import {
  readInvestModelRole,
  readInvestModelSessionRole,
  resolveInvestModelUserScope
} from '@/lib/server/invest-model-user-scope';

/**
 * This route reads mock user-scoped interest/save state only.
 * It never selects models, moves deposits, creates orders, emits push delivery,
 * connects brokers, or provides investment advice.
 */

const interestSaveItemTypes = [
  'feed_post',
  'signal_event',
  'investment_model'
] as const satisfies readonly InterestSaveItemType[];

type ApiErrorCode = 'forbidden' | 'validation_error' | 'server_error';

type InterestSaveItemDto = Omit<InterestSaveItem, 'id'> & {
  interestSavePublicId: string;
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

function canReadInterestSaves(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

function parseLimit(value: string | null) {
  if (!value) {
    return {
      value: 6,
      isValid: true
    };
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || `${parsed}` !== value.trim()) {
    return {
      value: 6,
      isValid: false
    };
  }

  return {
    value: Math.min(Math.max(parsed, 1), 6),
    isValid: true
  };
}

function parseItemType(value: string | null): InterestSaveItemType | null {
  if (!value) {
    return null;
  }

  return interestSaveItemTypes.includes(value as InterestSaveItemType)
    ? (value as InterestSaveItemType)
    : null;
}

function toDto(item: InterestSaveItem): InterestSaveItemDto {
  const { id, ...publicItem } = item;

  return {
    ...publicItem,
    interestSavePublicId: id
  };
}

export async function GET(request: NextRequest) {
  const headerRole = readInvestModelRole(request);
  const role =
    headerRole === 'public'
      ? await readInvestModelSessionRole(request)
      : headerRole;

  if (!canReadInterestSaves(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read private mock interest/save state.'
    );
  }

  const requestedItemType = request.nextUrl.searchParams.get('itemType');
  const itemType = parseItemType(requestedItemType);

  if (requestedItemType && !itemType) {
    return errorResponse(
      422,
      'validation_error',
      'itemType must be feed_post, signal_event, or investment_model.',
      {
        itemType: requestedItemType
      }
    );
  }

  const requestedLimit = request.nextUrl.searchParams.get('limit');
  const limit = parseLimit(requestedLimit);

  if (!limit.isValid) {
    return errorResponse(
      422,
      'validation_error',
      'limit must be an integer between 1 and 6.',
      {
        limit: requestedLimit
      }
    );
  }

  const itemPublicId =
    request.nextUrl.searchParams.get('itemPublicId')?.trim() || null;

  try {
    const userScope = await resolveInvestModelUserScope(request);
    const readModel = await readInterestSaveSeedFixture(
      itemType || itemPublicId ? 12 : limit.value
    );
    const items = readModel.items
      .filter((item) => !itemType || item.itemType === itemType)
      .filter((item) => !itemPublicId || item.itemPublicId === itemPublicId)
      .slice(0, limit.value)
      .map((item) =>
        toDto({
          ...item,
          userPublicId: userScope.userPublicId,
          sourceMeta: {
            ...item.sourceMeta,
            sourceTables: [...item.sourceMeta.sourceTables]
          }
        })
      );

    return Response.json({
      data: {
        userPublicId: userScope.userPublicId,
        items,
        emptyState: readModel.emptyState,
        safetySummary: readModel.safetySummary
      },
      meta: {
        routeStatus: 'fixture_or_db_seed_projection',
        contract: 'InterestSaveStateDto',
        persistence: 'read_only_seed_projection',
        sourceTables: ['feed_post_saves', 'feed_posts', 'users'],
        userPublicId: userScope.userPublicId,
        userScopeSource: userScope.source,
        itemTypeFilter: itemType,
        itemPublicIdFilter: itemPublicId,
        limit: limit.value,
        generatedFrom: readModel.generatedFrom,
        dataContext: 'mock',
        readOnly: true,
        mockUserScoped: true,
        privateShortcutOnly: true,
        modelSelectionSignal: false,
        allocationSignal: false,
        depositSignal: false,
        orderIntentSignal: false,
        tradeIntentSignal: false,
        tradeIntentCreated: false,
        realOrder: false,
        realDeposit: false,
        brokerageConnection: false,
        pushDelivery: false,
        sendsRealPush: false,
        deliveryAttempted: false,
        externalPaidApi: false,
        financialAdvice: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Interest/save state could not be read. No model selection, deposits, orders, push delivery, brokerage actions, or advice were created.'
    );
  }
}
