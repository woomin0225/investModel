/**
 * lib/domain is the public entry point for investModel canonical domain types.
 * Domain folders below this directory define ownership boundaries, while shared MVP types remain in types.ts until a focused split is needed.
 */
export * from './types';
export * from './audit/audit-log';
export * from './models/model-creator';
export * from './models/model-description';
export * from './models/model-selection';
export * from './portfolio/mock-deposit';
export * from './portfolio/portfolio-mandate';
export * from './portfolio/trade-intent';
