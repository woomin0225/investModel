/**
 * Interest/save state fixture shared by Signals, Feed, and Models surfaces.
 * This is a mock user-scoped reading/interest shortcut only. It is separate
 * from model selection, allocation, deposits, orders, TradeIntent, and brokers.
 */

import { and, desc, eq, isNull } from 'drizzle-orm';

import { feedPosts, feedPostSaves, users } from '@/lib/db/schema';

export type InterestSaveItemType =
  | 'feed_post'
  | 'signal_event'
  | 'investment_model';

export type InterestSaveState = 'saved' | 'unsaved' | 'pending' | 'error';

export type InterestSaveItem = {
  generatedFrom: 'deterministic_fixture' | 'db_seed_projection';
  id: string;
  userPublicId: string;
  itemType: InterestSaveItemType;
  itemPublicId: string;
  displayTitle: string;
  sourceSurface: 'Feed' | 'Signals' | 'Models';
  state: InterestSaveState;
  createdAt: string;
  updatedAt: string;
  safetyLabel: string;
  sourceMeta: {
    sourceTables: string[];
    mockUserScoped: true;
    privateShortcutOnly: true;
    modelSelectionSignal: false;
    allocationSignal: false;
    realDeposit: false;
    realOrder: false;
    tradeIntentCreated: false;
    brokerageConnection: false;
    externalPaidApi: false;
    financialAdvice: false;
  };
};

export type InterestSaveReadModel = {
  generatedFrom: 'deterministic_fixture' | 'db_seed_projection';
  userPublicId: string;
  items: InterestSaveItem[];
  emptyState: {
    title: string;
    description: string;
  };
  safetySummary: string;
};

const demoUserPublicId = 'user_demo_001';

const interestSaveSafetyMeta = {
  sourceTables: ['feed_post_saves', 'feed_posts', 'users'],
  mockUserScoped: true,
  privateShortcutOnly: true,
  modelSelectionSignal: false,
  allocationSignal: false,
  realDeposit: false,
  realOrder: false,
  tradeIntentCreated: false,
  brokerageConnection: false,
  externalPaidApi: false,
  financialAdvice: false
} as const;

const deterministicItems: InterestSaveItem[] = [
  {
    generatedFrom: 'deterministic_fixture',
    id: 'interest_save_feed_feed_mock_002',
    userPublicId: demoUserPublicId,
    itemType: 'feed_post',
    itemPublicId: 'feed_mock_002',
    displayTitle: 'Mock model review checklist',
    sourceSurface: 'Feed',
    state: 'saved',
    createdAt: '2026-07-14T10:05:00.000Z',
    updatedAt: '2026-07-14T10:05:00.000Z',
    safetyLabel:
      'Private mock reading shortcut only: no model selection, deposit, order, TradeIntent, brokerage connection, or advice.',
    sourceMeta: {
      ...interestSaveSafetyMeta,
      sourceTables: [...interestSaveSafetyMeta.sourceTables]
    }
  },
  {
    generatedFrom: 'deterministic_fixture',
    id: 'interest_save_signal_sig_mock_news_traffic_001',
    userPublicId: demoUserPublicId,
    itemType: 'signal_event',
    itemPublicId: 'sig_mock_news_traffic_001',
    displayTitle: 'AI chip headline traffic acceleration',
    sourceSurface: 'Signals',
    state: 'unsaved',
    createdAt: '2026-07-14T09:10:00.000Z',
    updatedAt: '2026-07-14T09:10:00.000Z',
    safetyLabel:
      'Mock interest marker only: no recommendation, live quote lookup, order, or broker action.',
    sourceMeta: {
      ...interestSaveSafetyMeta,
      sourceTables: ['model_signal_events']
    }
  },
  {
    generatedFrom: 'deterministic_fixture',
    id: 'interest_save_model_model_mock_signal_observer',
    userPublicId: demoUserPublicId,
    itemType: 'investment_model',
    itemPublicId: 'model_mock_signal_observer',
    displayTitle: 'Demo Signal Observer',
    sourceSurface: 'Models',
    state: 'pending',
    createdAt: '2026-07-14T09:00:00.000Z',
    updatedAt: '2026-07-14T09:00:00.000Z',
    safetyLabel:
      'Mock interest marker only: not a model selection, allocation, deposit, or TradeIntent.',
    sourceMeta: {
      ...interestSaveSafetyMeta,
      sourceTables: ['investment_models']
    }
  }
];

function cloneItems(items: InterestSaveItem[]) {
  return items.map((item) => ({
    ...item,
    sourceMeta: {
      ...item.sourceMeta,
      sourceTables: [...item.sourceMeta.sourceTables]
    }
  }));
}

function fallbackReadModel(limit: number): InterestSaveReadModel {
  return {
    generatedFrom: 'deterministic_fixture',
    userPublicId: demoUserPublicId,
    items: cloneItems(deterministicItems).slice(0, limit),
    emptyState: {
      title: 'No mock interest shortcuts yet',
      description:
        'Saved FeedPost, SignalEvent, and InvestmentModel markers will appear here as private mock user-scoped state.'
    },
    safetySummary:
      'Interest/save state is mock user-scoped UI state only. It does not select a model, move money, create TradeIntent, place orders, connect brokers, call paid external APIs, or provide advice.'
  };
}

function toIso(value: Date | string | null | undefined) {
  if (!value) {
    return '2026-07-14T10:05:00.000Z';
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

async function readDbProjection(limit: number): Promise<InterestSaveReadModel | null> {
  const { db } = await import('@/lib/db/drizzle');

  const [user] = await db
    .select({
      id: users.id,
      publicId: users.publicId
    })
    .from(users)
    .where(and(eq(users.publicId, demoUserPublicId), isNull(users.deletedAt)))
    .limit(1);

  if (!user) {
    return null;
  }

  const rows = await db
    .select({
      postPublicId: feedPosts.publicId,
      title: feedPosts.title,
      status: feedPostSaves.status,
      savedAt: feedPostSaves.savedAt,
      updatedAt: feedPostSaves.updatedAt
    })
    .from(feedPostSaves)
    .innerJoin(feedPosts, eq(feedPostSaves.postId, feedPosts.id))
    .where(
      and(
        eq(feedPostSaves.userId, user.id),
        eq(feedPosts.visibility, 'public')
      )
    )
    .orderBy(desc(feedPostSaves.updatedAt), desc(feedPostSaves.savedAt))
    .limit(limit);

  if (rows.length === 0) {
    return null;
  }

  const dbItems = rows.map<InterestSaveItem>((row) => {
    const createdAt = toIso(row.savedAt);

    return {
      generatedFrom: 'db_seed_projection',
      id: `interest_save_feed_${row.postPublicId}`,
      userPublicId: user.publicId,
      itemType: 'feed_post',
      itemPublicId: row.postPublicId,
      displayTitle: row.title,
      sourceSurface: 'Feed',
      state: row.status === 'saved' ? 'saved' : 'unsaved',
      createdAt,
      updatedAt: toIso(row.updatedAt ?? row.savedAt),
      safetyLabel:
        'DB seed FeedPost save only: no model selection, allocation, deposit, order, TradeIntent, brokerage connection, or advice.',
      sourceMeta: {
        ...interestSaveSafetyMeta,
        sourceTables: [...interestSaveSafetyMeta.sourceTables]
      }
    };
  });

  return {
    ...fallbackReadModel(limit),
    generatedFrom: 'db_seed_projection',
    items: [
      ...dbItems,
      ...cloneItems(deterministicItems).filter(
        (item) => item.itemType !== 'feed_post'
      )
    ].slice(0, limit)
  };
}

export async function readInterestSaveSeedFixture(
  limit = 6
): Promise<InterestSaveReadModel> {
  if (!process.env.MYSQL_URL) {
    return fallbackReadModel(limit);
  }

  try {
    const projection = await readDbProjection(limit);
    return projection ?? fallbackReadModel(limit);
  } catch {
    return fallbackReadModel(limit);
  }
}
