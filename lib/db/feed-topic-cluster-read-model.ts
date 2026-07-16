/**
 * Feed topic cluster read-model fixture for mobile Feed topic chips and rails.
 * It groups seeded FeedPost and SignalEvent context only; it is not live news,
 * investment advice, a TradeIntent, an order, or a broker/account connection.
 */

import { desc, eq } from 'drizzle-orm';

import {
  feedPosts,
  investmentModels,
  modelSignalEvents
} from '@/lib/db/schema';

export type FeedTopicClusterTone = 'info' | 'attention' | 'risk';

export type FeedTopicClusterRelatedSignal = {
  signalPublicId: string;
  signalType: string;
  title: string;
  scoreLabel: string;
};

export type FeedTopicClusterRelatedPost = {
  postPublicId: string;
  postType: string;
  title: string;
  linkedModelName: string;
};

export type FeedTopicClusterReadModel = {
  generatedFrom: 'deterministic_fixture' | 'db_seed_projection';
  clusterPublicId: string;
  topic: string;
  summary: string;
  tone: FeedTopicClusterTone;
  safetyLabel: string;
  relatedSignals: FeedTopicClusterRelatedSignal[];
  relatedPosts: FeedTopicClusterRelatedPost[];
  sourceMeta: {
    sourceTables: string[];
    mockOnly: true;
    observedInputsOnly: true;
    realtimeExternalData: false;
    externalPaidApi: false;
    competitorBrandCopied: false;
    financialAdvice: false;
    tradeIntentCreated: false;
    realOrder: false;
    brokerageConnection: false;
  };
};

const feedTopicSafetyMeta = {
  sourceTables: ['feed_posts', 'model_signal_events', 'investment_models'],
  mockOnly: true,
  observedInputsOnly: true,
  realtimeExternalData: false,
  externalPaidApi: false,
  competitorBrandCopied: false,
  financialAdvice: false,
  tradeIntentCreated: false,
  realOrder: false,
  brokerageConnection: false
} as const;

export const feedTopicClusterSeedFixture: FeedTopicClusterReadModel[] = [
  {
    generatedFrom: 'deterministic_fixture',
    clusterPublicId: 'feed_topic_mock_ai_infra',
    topic: 'AI infrastructure attention',
    summary:
      'Seeded FeedPosts and SignalEvents point to AI infrastructure attention. This cluster is reading context only and does not create advice, orders, or brokerage actions.',
    tone: 'attention',
    safetyLabel:
      'Mock topic cluster only: no live news feed, paid API, copied competitor brand, financial advice, order, or brokerage connection.',
    relatedSignals: [
      {
        signalPublicId: 'sig_mock_news_traffic_001',
        signalType: 'news_traffic',
        title: 'AI chip headline traffic acceleration',
        scoreLabel: '82.50 mock score'
      },
      {
        signalPublicId: 'sig_mock_price_trend_001',
        signalType: 'price_trend',
        title: 'Semiconductor basket trend watch',
        scoreLabel: '76.25 mock score'
      }
    ],
    relatedPosts: [
      {
        postPublicId: 'feed_mock_001',
        postType: 'market_context',
        title: 'News traffic clusters around semiconductor supply chains',
        linkedModelName: 'Demo Signal Observer'
      },
      {
        postPublicId: 'feed_mock_002',
        postType: 'model_note',
        title: 'Model note on seeded AI attention inputs',
        linkedModelName: 'Demo Signal Observer'
      }
    ],
    sourceMeta: {
      ...feedTopicSafetyMeta,
      sourceTables: [...feedTopicSafetyMeta.sourceTables]
    }
  },
  {
    generatedFrom: 'deterministic_fixture',
    clusterPublicId: 'feed_topic_mock_risk_watch',
    topic: 'Risk watch context',
    summary:
      'Seeded risk notes and risk SignalEvents highlight volatility and concentration context. This is cautionary reading, not a suitability judgment or trade instruction.',
    tone: 'risk',
    safetyLabel:
      'Mock risk cluster only: no legal conclusion, recommendation, order, external paid API, or real account data.',
    relatedSignals: [
      {
        signalPublicId: 'sig_mock_risk_001',
        signalType: 'risk',
        title: 'Volatility and concentration risk alert',
        scoreLabel: '68.75 mock score'
      }
    ],
    relatedPosts: [
      {
        postPublicId: 'feed_mock_003',
        postType: 'risk_note',
        title: 'Risk note for concentration and volatility context',
        linkedModelName: 'Demo Signal Observer'
      }
    ],
    sourceMeta: {
      ...feedTopicSafetyMeta,
      sourceTables: [...feedTopicSafetyMeta.sourceTables]
    }
  }
];

function cloneFixture(): FeedTopicClusterReadModel[] {
  return feedTopicClusterSeedFixture.map((cluster) => ({
    ...cluster,
    relatedSignals: cluster.relatedSignals.map((signal) => ({ ...signal })),
    relatedPosts: cluster.relatedPosts.map((post) => ({ ...post })),
    sourceMeta: {
      ...cluster.sourceMeta,
      sourceTables: [...cluster.sourceMeta.sourceTables]
    }
  }));
}

function scoreLabel(value: unknown) {
  const parsed = Number(value);
  return `${Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00'} mock score`;
}

function asLinkedModelName(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : 'Seeded model context';
}

function buildCluster(input: {
  clusterPublicId: string;
  topic: string;
  tone: FeedTopicClusterTone;
  summary: string;
  safetyLabel: string;
  postKeywords: string[];
  signalTypes: string[];
  posts: FeedTopicClusterRelatedPost[];
  signals: FeedTopicClusterRelatedSignal[];
}): FeedTopicClusterReadModel {
  const normalizedKeywords = input.postKeywords.map((keyword) =>
    keyword.toLowerCase()
  );
  const relatedPosts = input.posts
    .filter((post) => {
      const haystack = `${post.title} ${post.postType}`.toLowerCase();
      return normalizedKeywords.some((keyword) => haystack.includes(keyword));
    })
    .slice(0, 3);
  const relatedSignals = input.signals
    .filter((signal) => input.signalTypes.includes(signal.signalType))
    .slice(0, 3);

  return {
    generatedFrom: 'db_seed_projection',
    clusterPublicId: input.clusterPublicId,
    topic: input.topic,
    summary: input.summary,
    tone: input.tone,
    safetyLabel: input.safetyLabel,
    relatedSignals,
    relatedPosts,
    sourceMeta: {
      ...feedTopicSafetyMeta,
      sourceTables: [...feedTopicSafetyMeta.sourceTables]
    }
  };
}

async function readDbProjection(): Promise<FeedTopicClusterReadModel[] | null> {
  const { db } = await import('@/lib/db/drizzle');

  const postRows = await db
    .select({
      postPublicId: feedPosts.publicId,
      postType: feedPosts.postType,
      title: feedPosts.title,
      linkedModelName: investmentModels.name
    })
    .from(feedPosts)
    .leftJoin(investmentModels, eq(feedPosts.modelId, investmentModels.id))
    .where(eq(feedPosts.visibility, 'public'))
    .orderBy(desc(feedPosts.publishedAt), desc(feedPosts.createdAt))
    .limit(12);

  const signalRows = await db
    .select({
      signalPublicId: modelSignalEvents.publicId,
      signalType: modelSignalEvents.signalType,
      title: modelSignalEvents.title,
      score: modelSignalEvents.score
    })
    .from(modelSignalEvents)
    .orderBy(desc(modelSignalEvents.score), desc(modelSignalEvents.createdAt))
    .limit(12);

  if (postRows.length === 0 || signalRows.length === 0) {
    return null;
  }

  const posts = postRows.map((post) => ({
    postPublicId: post.postPublicId,
    postType: post.postType,
    title: post.title,
    linkedModelName: asLinkedModelName(post.linkedModelName)
  }));
  const signals = signalRows.map((signal) => ({
    signalPublicId: signal.signalPublicId,
    signalType: signal.signalType,
    title: signal.title,
    scoreLabel: scoreLabel(signal.score)
  }));

  return [
    buildCluster({
      clusterPublicId: 'feed_topic_seed_ai_infra',
      topic: 'AI infrastructure attention',
      tone: 'attention',
      summary:
        'DB seed FeedPosts and SignalEvents are grouped into an AI infrastructure reading cluster. It remains informational and mock-only.',
      safetyLabel:
        'DB seed topic cluster only: no live news feed, paid API, copied competitor brand, financial advice, order, or brokerage connection.',
      postKeywords: ['ai', 'semiconductor', 'supply', 'model'],
      signalTypes: ['news_traffic', 'price_trend'],
      posts,
      signals
    }),
    buildCluster({
      clusterPublicId: 'feed_topic_seed_risk_watch',
      topic: 'Risk watch context',
      tone: 'risk',
      summary:
        'DB seed FeedPosts and SignalEvents are grouped into a risk context reading cluster without legal, suitability, or trading conclusions.',
      safetyLabel:
        'DB seed risk cluster only: no legal conclusion, recommendation, order, external paid API, or real account data.',
      postKeywords: ['risk', 'volatility', 'concentration'],
      signalTypes: ['risk'],
      posts,
      signals
    })
  ].filter(
    (cluster) =>
      cluster.relatedPosts.length > 0 || cluster.relatedSignals.length > 0
  );
}

export async function readFeedTopicClusterSeedFixture(): Promise<
  FeedTopicClusterReadModel[]
> {
  if (!process.env.MYSQL_URL) {
    return cloneFixture();
  }

  try {
    const projection = await readDbProjection();
    return projection && projection.length > 0 ? projection : cloneFixture();
  } catch {
    return cloneFixture();
  }
}
