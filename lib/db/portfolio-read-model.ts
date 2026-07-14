import { and, desc, eq, isNull } from 'drizzle-orm';

import { investModelPortfolioMock } from '@/lib/mock/invest-model-portfolio';
import { db } from '@/lib/db/drizzle';
import {
  allocationDecisions,
  investmentModels,
  marketInstruments,
  mockDeposits,
  modelVersions,
  portfolioPositions,
  portfolios,
  tradeIntents,
  userModelSelections,
  users
} from '@/lib/db/schema';

export type InvestModelPortfolioSummary = {
  isMockOnly: true;
  selectedModel: {
    selectionPublicId: string;
    modelPublicId: string;
    modelVersionPublicId: string;
    name: string;
    versionLabel: string;
    mandateLabel: string;
    statusLabel: string;
    riskLabel: string;
    selectedAtLabel: string;
    statusDescription: string;
  };
  mockDeposit: {
    displayLabel: string;
    amountLabel: string;
    statusLabel: string;
    sourceLabel: string;
    safetyLabel: string;
  };
  allocationDecision: {
    statusLabel: string;
    sourceLabel: string;
    generatedAtLabel: string;
    rationale: string;
  };
  timeSnapshots: Array<{
    rangeLabel: string;
    valueLabel: string;
    checkpointLabel: string;
    signalLabel: string;
    safetyLabel: string;
  }>;
  positions: Array<{
    symbol: string;
    name: string;
    weightLabel: string;
    valueLabel: string;
    stateLabel: string;
    sourceLabel: string;
  }>;
  tradeIntent: {
    statusLabel: string;
    boundaryLabel: string;
    blockedActions: string[];
  };
};

const fallbackPortfolio: InvestModelPortfolioSummary = {
  ...investModelPortfolioMock,
  selectedModel: { ...investModelPortfolioMock.selectedModel },
  mockDeposit: { ...investModelPortfolioMock.mockDeposit },
  allocationDecision: { ...investModelPortfolioMock.allocationDecision },
  timeSnapshots: investModelPortfolioMock.timeSnapshots.map((snapshot) => ({
    ...snapshot
  })),
  positions: investModelPortfolioMock.positions.map((position) => ({
    ...position
  })),
  tradeIntent: {
    ...investModelPortfolioMock.tradeIntent,
    blockedActions: [...investModelPortfolioMock.tradeIntent.blockedActions]
  }
};

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return 'DB mock-safe fallback';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'DB mock-safe fallback';
  }

  return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

function formatMoney(value: string | number | null | undefined, currency = 'USD') {
  const amount = Number(value ?? 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(safeAmount);
}

function formatWeight(value: string | number | null | undefined, total: number) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount) || total <= 0) {
    return '0% target';
  }

  return `${Math.round((amount / total) * 100)}% target`;
}

function toBlockedActions(rows: Array<{ status: string; blockedReason: string | null }>) {
  if (rows.length === 0) {
    return fallbackPortfolio.tradeIntent.blockedActions;
  }

  const blocked = rows
    .filter((row) => row.status.toLowerCase().includes('blocked'))
    .map((row) => row.blockedReason?.trim())
    .filter((value): value is string => Boolean(value));

  return blocked.length > 0
    ? blocked.slice(0, 3)
    : ['No real deposit', 'No live order', 'No brokerage account'];
}

export async function readInvestModelPortfolioSummary(
  userPublicId = 'user_demo_001'
): Promise<InvestModelPortfolioSummary> {
  try {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.publicId, userPublicId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      return fallbackPortfolio;
    }

    const [portfolioRow] = await db
      .select({
        id: portfolios.id,
        totalMarketValue: portfolios.totalMarketValue,
        cashBalance: portfolios.cashBalance,
        currency: portfolios.currency,
        status: portfolios.status,
        updatedAt: portfolios.updatedAt,
        selectionPublicId: userModelSelections.publicId,
        selectedAt: userModelSelections.selectedAt,
        modelPublicId: investmentModels.publicId,
        modelName: investmentModels.name,
        modelStatus: investmentModels.status,
        modelVersionPublicId: modelVersions.publicId,
        versionLabel: modelVersions.versionLabel,
        targetMarkets: modelVersions.targetMarkets,
        assetUniverseSummary: modelVersions.assetUniverseSummary
      })
      .from(portfolios)
      .innerJoin(
        userModelSelections,
        eq(portfolios.modelSelectionId, userModelSelections.id)
      )
      .innerJoin(investmentModels, eq(userModelSelections.modelId, investmentModels.id))
      .innerJoin(modelVersions, eq(userModelSelections.modelVersionId, modelVersions.id))
      .where(and(eq(portfolios.userId, user.id), eq(userModelSelections.status, 'active')))
      .orderBy(desc(portfolios.updatedAt))
      .limit(1);

    if (!portfolioRow) {
      return fallbackPortfolio;
    }

    const [deposit] = await db
      .select({
        amount: mockDeposits.amount,
        currency: mockDeposits.currency,
        status: mockDeposits.status,
        sourceType: mockDeposits.sourceType,
        completedAt: mockDeposits.completedAt
      })
      .from(mockDeposits)
      .where(eq(mockDeposits.userId, user.id))
      .orderBy(desc(mockDeposits.createdAt))
      .limit(1);

    const [decision] = await db
      .select({
        status: allocationDecisions.decisionStatus,
        rationale: allocationDecisions.rationale,
        decidedAt: allocationDecisions.decidedAt
      })
      .from(allocationDecisions)
      .where(eq(allocationDecisions.portfolioId, portfolioRow.id))
      .orderBy(desc(allocationDecisions.decidedAt))
      .limit(1);

    const positionRows = await db
      .select({
        symbol: marketInstruments.symbol,
        name: marketInstruments.name,
        marketValue: portfolioPositions.marketValue,
        asOf: portfolioPositions.asOf
      })
      .from(portfolioPositions)
      .innerJoin(
        marketInstruments,
        eq(portfolioPositions.instrumentId, marketInstruments.id)
      )
      .where(eq(portfolioPositions.portfolioId, portfolioRow.id))
      .orderBy(desc(portfolioPositions.marketValue));

    const tradeIntentRows = await db
      .select({
        status: tradeIntents.status,
        blockedReason: tradeIntents.blockedReason
      })
      .from(tradeIntents)
      .where(eq(tradeIntents.portfolioId, portfolioRow.id))
      .orderBy(desc(tradeIntents.createdAt))
      .limit(3);

    const currency = portfolioRow.currency || deposit?.currency || 'USD';
    const totalMarketValue = Number(portfolioRow.totalMarketValue ?? 0);
    const latestPositionAsOf = positionRows[0]?.asOf ?? portfolioRow.updatedAt;
    const activeTradeIntent = tradeIntentRows[0];

    return {
      isMockOnly: true,
      selectedModel: {
        selectionPublicId: portfolioRow.selectionPublicId,
        modelPublicId: portfolioRow.modelPublicId,
        modelVersionPublicId: portfolioRow.modelVersionPublicId,
        name: portfolioRow.modelName,
        versionLabel: `ModelVersion ${portfolioRow.versionLabel} DB mock`,
        mandateLabel: `PortfolioMandate: ${portfolioRow.targetMarkets}; ${portfolioRow.assetUniverseSummary}`,
        statusLabel: `${portfolioRow.modelStatus} mock`,
        riskLabel: fallbackPortfolio.selectedModel.riskLabel,
        selectedAtLabel: `selected DB mock: ${formatDateTime(portfolioRow.selectedAt)}`,
        statusDescription:
          'Current selected model status comes from DB read model; it cannot create real orders or account activity.'
      },
      mockDeposit: {
        displayLabel: `${formatMoney(deposit?.amount, deposit?.currency ?? currency)} MockDeposit`,
        amountLabel: formatMoney(deposit?.amount, deposit?.currency ?? currency),
        statusLabel: deposit?.status ?? 'mock_safe_fallback',
        sourceLabel: `sourceType: ${deposit?.sourceType ?? 'mock'}`,
        safetyLabel: 'Not a real deposit or cash balance'
      },
      allocationDecision: {
        statusLabel: decision?.status ?? 'mock_safe_fallback',
        sourceLabel: 'DB read model',
        generatedAtLabel: formatDateTime(decision?.decidedAt),
        rationale:
          decision?.rationale ??
          'No DB AllocationDecision row yet; showing mock-safe fallback state only.'
      },
      timeSnapshots: [
        {
          rangeLabel: '1D',
          valueLabel: `${formatMoney(portfolioRow.totalMarketValue, currency)} simulated`,
          checkpointLabel: `${formatDateTime(portfolioRow.updatedAt)} DB checkpoint`,
          signalLabel: `${positionRows.length} simulated PortfolioPositions`,
          safetyLabel: 'No real P/L'
        },
        {
          rangeLabel: '1W',
          valueLabel: `${formatMoney(portfolioRow.cashBalance, currency)} mock cash`,
          checkpointLabel: 'DB read model sample window',
          signalLabel: portfolioRow.status,
          safetyLabel: 'No return claim'
        },
        {
          rangeLabel: '1M',
          valueLabel: `${formatMoney(portfolioRow.totalMarketValue, currency)} simulated`,
          checkpointLabel: `${formatDateTime(latestPositionAsOf)} position snapshot`,
          signalLabel: 'PortfolioMandate guardrails only',
          safetyLabel: 'No brokerage data'
        }
      ],
      positions:
        positionRows.length > 0
          ? positionRows.map((position) => ({
              symbol: position.symbol,
              name: `${position.name} simulated holding`,
              weightLabel: formatWeight(position.marketValue, totalMarketValue),
              valueLabel: `${formatMoney(position.marketValue, currency)} simulated`,
              stateLabel: 'simulated position',
              sourceLabel: 'DB mock position'
            }))
          : fallbackPortfolio.positions,
      tradeIntent: {
        statusLabel: activeTradeIntent?.status ?? 'mock_safe_fallback',
        boundaryLabel: 'pre-order simulation only',
        blockedActions: toBlockedActions(tradeIntentRows)
      }
    };
  } catch {
    return fallbackPortfolio;
  }
}
