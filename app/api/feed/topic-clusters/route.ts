import { NextRequest } from 'next/server';

import { readFeedTopicClusterSeedFixture } from '@/lib/db/feed-topic-cluster-read-model';
import { canReadFeed } from '@/lib/domain/feed/feed-post';
import {
  readInvestModelRole,
  readInvestModelSessionRole
} from '@/lib/server/invest-model-user-scope';

/**
 * This route exposes mock-safe Feed topic clusters for mobile Feed rails.
 * It never reads live news, calls paid APIs, creates advice, orders, or broker actions.
 */

type ApiErrorCode = 'forbidden' | 'server_error';

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

function topicClusterMeta(clusterCount: number) {
  return {
    routeStatus: 'fixture_or_db_seed_projection',
    persistence: 'read_only_seed_projection',
    sourceTables: ['feed_posts', 'model_signal_events', 'investment_models'],
    emptyState:
      clusterCount === 0
        ? {
            title: 'No Feed topic clusters yet',
            message:
              'Seed or mock FeedPost and SignalEvent rows are required before topic clusters appear.'
          }
        : null,
    mockOnly: true,
    observedInputsOnly: true,
    realtimeExternalData: false,
    externalPaidApi: false,
    competitorBrandCopied: false,
    financialAdvice: false,
    tradeIntentCreated: false,
    realOrder: false,
    brokerageConnection: false
  };
}

export async function GET(request: NextRequest) {
  const headerRole = readInvestModelRole(request);
  const role =
    headerRole === 'public'
      ? await readInvestModelSessionRole(request)
      : headerRole;

  if (!canReadFeed(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read Feed topic clusters.'
    );
  }

  try {
    const clusters = await readFeedTopicClusterSeedFixture();

    return Response.json({
      data: clusters,
      meta: topicClusterMeta(clusters.length)
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Feed topic clusters could not be read. No live feed, advice, orders, or brokerage actions were created.'
    );
  }
}
