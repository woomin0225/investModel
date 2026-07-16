import { NextRequest } from 'next/server';

import { readFeedTopicClusterSeedFixture } from '@/lib/db/feed-topic-cluster-read-model';
import { canReadFeed } from '@/lib/domain/feed/feed-post';
import {
  readInvestModelRole,
  readInvestModelSessionRole
} from '@/lib/server/invest-model-user-scope';

/**
 * This route exposes one mock-safe Feed topic cluster by public id.
 * It never creates advice, TradeIntent rows, orders, brokerage actions, or live-feed calls.
 */

type ApiErrorCode = 'forbidden' | 'not_found' | 'validation_error' | 'server_error';

type RouteContext = {
  params: Promise<{
    clusterId: string;
  }>;
};

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

function topicClusterDetailMeta() {
  return {
    routeStatus: 'fixture_or_db_seed_projection',
    persistence: 'read_only_seed_projection',
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
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
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

  const { clusterId } = await context.params;
  const clusterPublicId = clusterId.trim();

  if (!clusterPublicId) {
    return errorResponse(
      422,
      'validation_error',
      'Feed topic cluster public id is required.'
    );
  }

  try {
    const clusters = await readFeedTopicClusterSeedFixture();
    const cluster = clusters.find(
      (candidate) => candidate.clusterPublicId === clusterPublicId
    );

    if (!cluster) {
      return errorResponse(
        404,
        'not_found',
        'Feed topic cluster was not found in the seed projection. No live feed was queried.'
      );
    }

    return Response.json({
      data: cluster,
      meta: topicClusterDetailMeta()
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Feed topic cluster could not be read. No live feed, advice, orders, or brokerage actions were created.'
    );
  }
}
