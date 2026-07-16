import { NextRequest } from 'next/server';

import { GET as readInterestSaves } from '@/app/api/my/interest-saves/route';
import type {
  InterestSaveItemState,
  InterestSaveItemType
} from '@/components/invest-model/interest-save-state-rail';

type InterestSaveApiItem = {
  itemType: InterestSaveItemType;
  itemPublicId: string;
  sourceSurface: 'Feed' | 'Signals' | 'Models';
  state: InterestSaveItemState;
  safetyLabel: string;
  sourceMeta?: {
    mockUserScoped?: boolean;
    privateShortcutOnly?: boolean;
    modelSelectionSignal?: boolean;
    realDeposit?: boolean;
    realOrder?: boolean;
    tradeIntentCreated?: boolean;
    brokerageConnection?: boolean;
    financialAdvice?: boolean;
  };
};

export type InterestSaveStateLookup = Record<string, InterestSaveApiItem>;

/**
 * Reads only private mock user-scoped interest/save state for UI badges.
 * It does not mutate saved state, select models, deliver push, create orders,
 * connect brokers, or create deposit/TradeIntent records.
 */
export async function readInterestSaveStateLookup(
  itemType: InterestSaveItemType
): Promise<InterestSaveStateLookup> {
  try {
    const searchParams = new URLSearchParams({
      itemType,
      limit: '6'
    });
    const response = await readInterestSaves(
      new NextRequest(`http://localhost/api/my/interest-saves?${searchParams}`, {
        method: 'GET',
        headers: {
          'x-invest-model-role': 'user'
        }
      })
    );

    if (!response.ok) {
      throw new Error('Interest/save state route read failed.');
    }

    const payload = (await response.json()) as {
      data?: {
        items?: InterestSaveApiItem[];
      };
      meta?: {
        readOnly?: boolean;
        mockUserScoped?: boolean;
        privateShortcutOnly?: boolean;
        modelSelectionSignal?: boolean;
        realDeposit?: boolean;
        realOrder?: boolean;
        tradeIntentCreated?: boolean;
        brokerageConnection?: boolean;
        pushDelivery?: boolean;
        financialAdvice?: boolean;
      };
    };

    if (
      payload.meta?.readOnly !== true ||
      payload.meta.mockUserScoped !== true ||
      payload.meta.privateShortcutOnly !== true ||
      payload.meta.modelSelectionSignal !== false ||
      payload.meta.realDeposit !== false ||
      payload.meta.realOrder !== false ||
      payload.meta.tradeIntentCreated !== false ||
      payload.meta.brokerageConnection !== false ||
      payload.meta.pushDelivery !== false ||
      payload.meta.financialAdvice !== false
    ) {
      throw new Error('Interest/save state route returned unsafe meta.');
    }

    return Object.fromEntries(
      (payload.data?.items ?? []).map((item) => [item.itemPublicId, item])
    );
  } catch {
    return {};
  }
}
