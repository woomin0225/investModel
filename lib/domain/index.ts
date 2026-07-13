/**
 * lib/domain is the public entry point for investModel canonical domain types.
 * Domain folders below this directory define ownership boundaries, while shared MVP types remain in types.ts until a focused split is needed.
 */
export * from './types';
export * from './audit/audit-log';
export * from './analytics/model-selection-event';
export * from './analytics/model-view-event';
export * from './compliance/model-report';
export * from './decision/mock-decision-engine';
export * from './models/model-creator';
export * from './models/model-artifact-metadata';
export * from './models/model-description';
export * from './models/model-selection';
export * from './models/model-version';
export * from './notifications/model-status-notification';
export * from './notifications/review-result-notification';
export * from './portfolio/mock-deposit';
export * from './portfolio/portfolio-mandate';
export * from './portfolio/trade-intent-policy';
export * from './portfolio/trade-intent';
export * from './signals/market-data-provider';
export * from './signals/news-traffic-provider';
