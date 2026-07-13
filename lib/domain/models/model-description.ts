import { z } from 'zod';

/**
 * This module defines the required InvestmentModel description schema.
 * Creator drafts, future forms, and API validation should use it so market, asset, leverage, rebalance, risk, and disclosure fields stay consistent.
 */

const requiredText = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

const requiredLabelList = (minItems: number, maxItems: number) =>
  z.array(z.string().trim().min(2).max(80)).min(minItems).max(maxItems);

export const modelDescriptionSchema = z.object({
  shortDescription: requiredText(12, 220),
  targetMarkets: requiredLabelList(1, 8),
  allowedAssetClasses: requiredLabelList(1, 12),
  assetUniverseSummary: requiredText(12, 260),
  strategySummary: requiredText(20, 600),
  leverageAllowed: z.boolean(),
  derivativesAllowed: z.boolean().default(false),
  rebalancePolicy: requiredText(4, 120),
  primaryDataInputs: requiredLabelList(1, 12),
  forbiddenAssets: z.array(z.string().trim().min(2).max(80)).max(20).default([]),
  riskSummary: requiredText(20, 600),
  performanceSource: requiredText(8, 160),
  disclosurePlaceholder: requiredText(12, 600)
});

export type ModelDescriptionInput = z.infer<typeof modelDescriptionSchema>;

export const requiredModelDescriptionFields = [
  'shortDescription',
  'targetMarkets',
  'allowedAssetClasses',
  'assetUniverseSummary',
  'strategySummary',
  'leverageAllowed',
  'derivativesAllowed',
  'rebalancePolicy',
  'primaryDataInputs',
  'riskSummary',
  'performanceSource',
  'disclosurePlaceholder'
] as const;
