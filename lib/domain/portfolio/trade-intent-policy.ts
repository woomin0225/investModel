import type { PermissionResult, PortfolioMandate } from '@/lib/domain/types';
import type { TradeIntentDto } from './trade-intent';
import { tradeIntentSafetyBoundary } from './trade-intent';

/**
 * This module defines the mock-only TradeIntent policy check contract.
 * It evaluates a simulated TradeIntent against a PortfolioMandate and mock context before any UI or API can show it as approved for simulation.
 */

export type TradeIntentPolicyDecision = Extract<
  PermissionResult,
  'allowed' | 'policy_blocked' | 'review_required'
>;

export interface TradeIntentInstrumentContext {
  assetClass: string;
  market: string;
  leverageExposure: boolean;
  instrumentType: string;
}

export interface TradeIntentPolicyContext {
  mandate: PortfolioMandate;
  instrument: TradeIntentInstrumentContext;
  modelIsLive: boolean;
  userSelectionIsActive: boolean;
  portfolioIsMockOnly: boolean;
  mockDepositAllowsAllocation: boolean;
  disclosureReviewed: boolean;
  hasRationale: boolean;
  highRiskWarningRequired?: boolean;
}

export interface TradeIntentPolicyCheckResult {
  decision: TradeIntentPolicyDecision;
  nextStatus: 'approved_for_simulation' | 'blocked';
  reasons: string[];
  warnings: string[];
  auditAction:
    | 'trade_intent_approved_for_simulation'
    | 'trade_intent_blocked'
    | 'trade_intent_real_order_blocked';
  safetyBoundary: typeof tradeIntentSafetyBoundary;
}

function includesNormalized(values: readonly string[], target: string) {
  const normalizedTarget = target.trim().toLowerCase();

  return values.some((value) => value.trim().toLowerCase() === normalizedTarget);
}

export function evaluateTradeIntentPolicy(
  tradeIntent: TradeIntentDto,
  context: TradeIntentPolicyContext
): TradeIntentPolicyCheckResult {
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (tradeIntent.safetyBoundary.mockOnly !== true) {
    reasons.push('TradeIntent must be mock-only.');
  }

  if (tradeIntent.status !== 'pending_policy_check') {
    reasons.push('TradeIntent must start from pending_policy_check.');
  }

  if (!context.modelIsLive) {
    reasons.push('InvestmentModel and ModelVersion must be live.');
  }

  if (!context.userSelectionIsActive) {
    reasons.push('UserModelSelection must be active.');
  }

  if (!context.portfolioIsMockOnly) {
    reasons.push('Portfolio must be mock-only.');
  }

  if (!context.mockDepositAllowsAllocation) {
    reasons.push('MockDeposit must allow simulated allocation.');
  }

  if (!context.disclosureReviewed) {
    reasons.push('Model disclosure must be reviewed before simulation.');
  }

  if (!context.hasRationale && !tradeIntent.rationaleSummary) {
    reasons.push('TradeIntent requires a deterministic rationale.');
  }

  if (
    !includesNormalized(
      context.mandate.allowedAssetClasses,
      context.instrument.assetClass
    )
  ) {
    reasons.push('Instrument asset class is outside PortfolioMandate.');
  }

  if (
    includesNormalized(
      context.mandate.prohibitedAssetClasses,
      context.instrument.assetClass
    )
  ) {
    reasons.push('Instrument asset class is prohibited by PortfolioMandate.');
  }

  if (!includesNormalized(context.mandate.allowedMarkets, context.instrument.market)) {
    reasons.push('Instrument market is outside PortfolioMandate.');
  }

  if (context.instrument.leverageExposure) {
    warnings.push('Leveraged exposure requires user-facing high-risk warning.');
  }

  if (context.highRiskWarningRequired) {
    warnings.push('High-risk warning must be displayed before mock preview.');
  }

  if (reasons.length > 0) {
    return {
      decision: 'policy_blocked',
      nextStatus: 'blocked',
      reasons,
      warnings,
      auditAction: 'trade_intent_blocked',
      safetyBoundary: tradeIntentSafetyBoundary
    };
  }

  return {
    decision: warnings.length > 0 ? 'review_required' : 'allowed',
    nextStatus: 'approved_for_simulation',
    reasons: [],
    warnings,
    auditAction: 'trade_intent_approved_for_simulation',
    safetyBoundary: tradeIntentSafetyBoundary
  };
}
