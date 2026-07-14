import {
  mysqlTable,
  int,
  boolean,
  decimal,
  json,
  index,
  uniqueIndex,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = mysqlTable('teams', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).unique(),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).unique(),
  stripeProductId: varchar('stripe_product_id', { length: 255 }),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = mysqlTable('team_members', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id')
    .notNull()
    .references(() => users.id),
  teamId: int('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = mysqlTable('activity_logs', {
  id: int('id').autoincrement().primaryKey(),
  teamId: int('team_id')
    .notNull()
    .references(() => teams.id),
  userId: int('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = mysqlTable('invitations', {
  id: int('id').autoincrement().primaryKey(),
  teamId: int('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: int('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

/**
 * modelCreators stores the creator profile shell required before an InvestmentModel can be registered.
 * Verification workflow details stay in creator/review tasks and do not approve investment performance.
 */
export const modelCreators = mysqlTable(
  'model_creators',
  {
    id: int('id').autoincrement().primaryKey(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id),
    displayName: varchar('display_name', { length: 100 }).notNull(),
    bio: text('bio'),
    verificationStatus: varchar('verification_status', { length: 30 })
      .notNull()
      .default('unverified'),
    verifiedAt: timestamp('verified_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_model_creators_user_id').on(table.userId),
    index('idx_model_creators_verification_status').on(
      table.verificationStatus
    ),
  ]
);

/**
 * investmentModels is the marketplace model unit users browse and select.
 * Strategy, risk, mandate, and disclosures belong to version/profile tables rather than user preferences.
 */
export const investmentModels = mysqlTable(
  'investment_models',
  {
    id: int('id').autoincrement().primaryKey(),
    creatorId: int('creator_id')
      .notNull()
      .references(() => modelCreators.id),
    slug: varchar('slug', { length: 120 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('draft'),
    visibility: varchar('visibility', { length: 30 })
      .notNull()
      .default('private'),
    currentVersionId: int('current_version_id'),
    shortDescription: varchar('short_description', { length: 500 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    retiredAt: timestamp('retired_at'),
  },
  (table) => [
    uniqueIndex('uq_investment_models_slug').on(table.slug),
    index('idx_investment_models_creator_id').on(table.creatorId),
    index('idx_investment_models_status_visibility').on(
      table.status,
      table.visibility
    ),
    index('idx_investment_models_current_version_id').on(
      table.currentVersionId
    ),
  ]
);

/**
 * modelVersions fixes an InvestmentModel's mandate, risk inputs, and performance context.
 * It is model-owned metadata, not a user-customized investment profile.
 */
export const modelVersions = mysqlTable(
  'model_versions',
  {
    id: int('id').autoincrement().primaryKey(),
    modelId: int('model_id')
      .notNull()
      .references(() => investmentModels.id),
    versionLabel: varchar('version_label', { length: 60 }).notNull(),
    strategySummary: text('strategy_summary').notNull(),
    targetMarkets: varchar('target_markets', { length: 500 }).notNull(),
    assetUniverseSummary: varchar('asset_universe_summary', {
      length: 700,
    }).notNull(),
    rebalanceFrequency: varchar('rebalance_frequency', { length: 80 }),
    inputDataSummary: text('input_data_summary'),
    forbiddenScope: text('forbidden_scope'),
    modelArtifactStatus: varchar('model_artifact_status', { length: 30 })
      .notNull()
      .default('metadata_only'),
    createdByUserId: int('created_by_user_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    effectiveFrom: timestamp('effective_from'),
    retiredAt: timestamp('retired_at'),
  },
  (table) => [
    uniqueIndex('uq_model_versions_model_label').on(
      table.modelId,
      table.versionLabel
    ),
    index('idx_model_versions_artifact_status').on(
      table.modelArtifactStatus
    ),
    index('idx_model_versions_created_by_user_id').on(
      table.createdByUserId
    ),
  ]
);

/**
 * modelRiskProfiles stores model-version-owned risk traits for display and review.
 * It is not a user risk preference, suitability judgment, or performance promise.
 */
export const modelRiskProfiles = mysqlTable(
  'model_risk_profiles',
  {
    id: int('id').autoincrement().primaryKey(),
    modelVersionId: int('model_version_id')
      .notNull()
      .references(() => modelVersions.id),
    riskLevel: varchar('risk_level', { length: 30 }).notNull(),
    leverageAllowed: boolean('leverage_allowed').notNull().default(false),
    derivativeAllowed: boolean('derivative_allowed').notNull().default(false),
    shortSellingAllowed: boolean('short_selling_allowed')
      .notNull()
      .default(false),
    concentrationLimitPct: decimal('concentration_limit_pct', {
      precision: 5,
      scale: 2,
    }),
    expectedVolatilityNote: varchar('expected_volatility_note', {
      length: 500,
    }),
    maxDrawdownNote: varchar('max_drawdown_note', { length: 500 }),
    riskSummary: text('risk_summary').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_model_risk_profiles_version_id').on(table.modelVersionId),
    index('idx_model_risk_profiles_level_leverage').on(
      table.riskLevel,
      table.leverageAllowed
    ),
  ]
);

/**
 * modelDisclosures stores placeholder or reviewed disclosure copy for a future ModelVersion.
 * Codex records review state here but does not finalize legal or financial wording.
 */
export const modelDisclosures = mysqlTable(
  'model_disclosures',
  {
    id: int('id').autoincrement().primaryKey(),
    modelVersionId: int('model_version_id')
      .notNull()
      .references(() => modelVersions.id),
    disclosureType: varchar('disclosure_type', { length: 40 }).notNull(),
    title: varchar('title', { length: 160 }).notNull(),
    body: text('body').notNull(),
    requiresLegalReview: boolean('requires_legal_review')
      .notNull()
      .default(false),
    reviewedByUserId: int('reviewed_by_user_id').references(() => users.id),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_model_disclosures_version_type').on(
      table.modelVersionId,
      table.disclosureType
    ),
    index('idx_model_disclosures_legal_review').on(
      table.requiresLegalReview
    ),
    index('idx_model_disclosures_reviewed_by').on(table.reviewedByUserId),
  ]
);

/**
 * portfolioMandates describe what a ModelVersion may analyze.
 * Users do not directly edit these mandate limits in the MVP.
 */
export const portfolioMandates = mysqlTable(
  'portfolio_mandates',
  {
    id: int('id').autoincrement().primaryKey(),
    modelVersionId: int('model_version_id')
      .notNull()
      .references(() => modelVersions.id),
    allowedMarkets: varchar('allowed_markets', { length: 700 }).notNull(),
    allowedAssetClasses: varchar('allowed_asset_classes', {
      length: 700,
    }).notNull(),
    forbiddenAssets: text('forbidden_assets'),
    minCashPct: decimal('min_cash_pct', { precision: 5, scale: 2 }),
    maxSinglePositionPct: decimal('max_single_position_pct', {
      precision: 5,
      scale: 2,
    }),
    leveragePolicy: varchar('leverage_policy', { length: 500 }),
    rebalancePolicy: varchar('rebalance_policy', { length: 700 }),
    userOverrideAllowed: boolean('user_override_allowed')
      .notNull()
      .default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_portfolio_mandates_version_id').on(
      table.modelVersionId
    ),
  ]
);

/**
 * complianceReviews records operator review workflow state.
 * An approved row is not a Codex legal suitability determination.
 */
export const complianceReviews = mysqlTable(
  'compliance_reviews',
  {
    id: int('id').autoincrement().primaryKey(),
    modelId: int('model_id')
      .notNull()
      .references(() => investmentModels.id),
    modelVersionId: int('model_version_id').references(
      () => modelVersions.id
    ),
    reviewType: varchar('review_type', { length: 40 }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('pending'),
    reviewerUserId: int('reviewer_user_id').references(() => users.id),
    notes: text('notes'),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_compliance_reviews_model_status').on(
      table.modelId,
      table.status
    ),
    index('idx_compliance_reviews_version_type').on(
      table.modelVersionId,
      table.reviewType
    ),
    index('idx_compliance_reviews_reviewer').on(table.reviewerUserId),
  ]
);

/**
 * modelPerformanceSnapshots stores measured backtest or placeholder context only.
 * These values must not be presented as future return promises.
 */
export const modelPerformanceSnapshots = mysqlTable(
  'model_performance_snapshots',
  {
    id: int('id').autoincrement().primaryKey(),
    modelVersionId: int('model_version_id')
      .notNull()
      .references(() => modelVersions.id),
    periodLabel: varchar('period_label', { length: 40 }).notNull(),
    cumulativeReturnPct: decimal('cumulative_return_pct', {
      precision: 8,
      scale: 4,
    }),
    volatilityPct: decimal('volatility_pct', {
      precision: 8,
      scale: 4,
    }),
    maxDrawdownPct: decimal('max_drawdown_pct', {
      precision: 8,
      scale: 4,
    }),
    benchmarkSymbol: varchar('benchmark_symbol', { length: 30 }),
    isBacktest: boolean('is_backtest').notNull().default(true),
    measuredAt: timestamp('measured_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_model_performance_version_period').on(
      table.modelVersionId,
      table.periodLabel,
      table.measuredAt
    ),
  ]
);

/**
 * marketInstruments are reference instruments for mock analysis and signals.
 * They do not imply live market data connectivity or broker tradability.
 */
export const marketInstruments = mysqlTable(
  'market_instruments',
  {
    id: int('id').autoincrement().primaryKey(),
    symbol: varchar('symbol', { length: 40 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    assetType: varchar('asset_type', { length: 30 }).notNull(),
    market: varchar('market', { length: 30 }).notNull(),
    exchange: varchar('exchange', { length: 60 }),
    currency: varchar('currency', { length: 3 }).notNull(),
    isLeveraged: boolean('is_leveraged').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_market_instruments_symbol_market').on(
      table.symbol,
      table.market
    ),
    index('idx_market_instruments_asset_market').on(
      table.assetType,
      table.market
    ),
  ]
);

/**
 * userModelSelections records a user's selected ModelVersion.
 * It is a mock-safe selection record, not a suitability profile or funding instruction.
 */
export const userModelSelections = mysqlTable(
  'user_model_selections',
  {
    id: int('id').autoincrement().primaryKey(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id),
    modelId: int('model_id')
      .notNull()
      .references(() => investmentModels.id),
    modelVersionId: int('model_version_id')
      .notNull()
      .references(() => modelVersions.id),
    status: varchar('status', { length: 30 }).notNull().default('active'),
    riskAcknowledgedAt: timestamp('risk_acknowledged_at'),
    selectedAt: timestamp('selected_at').notNull().defaultNow(),
    revokedAt: timestamp('revoked_at'),
  },
  (table) => [
    index('idx_user_model_selections_user_status').on(
      table.userId,
      table.status
    ),
    index('idx_user_model_selections_model_version').on(
      table.modelId,
      table.modelVersionId
    ),
  ]
);

/**
 * mockDeposits are simulated funds for prototype visibility.
 * They are not real deposits, cash balances, payments, or bank transfers.
 */
export const mockDeposits = mysqlTable(
  'mock_deposits',
  {
    id: int('id').autoincrement().primaryKey(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id),
    amount: decimal('amount', { precision: 18, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('KRW'),
    status: varchar('status', { length: 30 }).notNull().default('pending'),
    sourceType: varchar('source_type', { length: 40 })
      .notNull()
      .default('mock'),
    memo: varchar('memo', { length: 255 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (table) => [
    index('idx_mock_deposits_user_status').on(table.userId, table.status),
  ]
);

/**
 * portfolios store a simulated portfolio state for a selected ModelVersion.
 * Balances and positions are mock read-model values, not real account data.
 */
export const portfolios = mysqlTable(
  'portfolios',
  {
    id: int('id').autoincrement().primaryKey(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id),
    modelSelectionId: int('model_selection_id')
      .notNull()
      .references(() => userModelSelections.id),
    cashBalance: decimal('cash_balance', {
      precision: 18,
      scale: 2,
    })
      .notNull()
      .default('0'),
    totalMarketValue: decimal('total_market_value', {
      precision: 18,
      scale: 2,
    })
      .notNull()
      .default('0'),
    currency: varchar('currency', { length: 3 }).notNull().default('KRW'),
    status: varchar('status', { length: 30 })
      .notNull()
      .default('mock_active'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_portfolios_user_status').on(table.userId, table.status),
    index('idx_portfolios_model_selection_id').on(table.modelSelectionId),
  ]
);

/**
 * portfolioPositions are simulated holdings used by Portfolio read models.
 * They must not be displayed as broker-confirmed positions.
 */
export const portfolioPositions = mysqlTable(
  'portfolio_positions',
  {
    id: int('id').autoincrement().primaryKey(),
    portfolioId: int('portfolio_id')
      .notNull()
      .references(() => portfolios.id),
    instrumentId: int('instrument_id')
      .notNull()
      .references(() => marketInstruments.id),
    quantity: decimal('quantity', { precision: 24, scale: 8 })
      .notNull()
      .default('0'),
    averagePrice: decimal('average_price', { precision: 18, scale: 6 }),
    marketValue: decimal('market_value', { precision: 18, scale: 2 }),
    asOf: timestamp('as_of').notNull(),
  },
  (table) => [
    uniqueIndex('uq_portfolio_positions_portfolio_instrument').on(
      table.portfolioId,
      table.instrumentId
    ),
    index('idx_portfolio_positions_as_of').on(table.asOf),
    index('idx_portfolio_positions_instrument_id').on(table.instrumentId),
  ]
);

/**
 * allocationDecisions are simulated model analysis outputs.
 * They are not investment advice and do not execute allocations.
 */
export const allocationDecisions = mysqlTable(
  'allocation_decisions',
  {
    id: int('id').autoincrement().primaryKey(),
    modelVersionId: int('model_version_id')
      .notNull()
      .references(() => modelVersions.id),
    portfolioId: int('portfolio_id')
      .notNull()
      .references(() => portfolios.id),
    decisionStatus: varchar('decision_status', { length: 40 })
      .notNull()
      .default('draft'),
    rationale: text('rationale').notNull(),
    inputSnapshotJson: json('input_snapshot_json'),
    policyResultJson: json('policy_result_json'),
    decidedAt: timestamp('decided_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_allocation_decisions_model_time').on(
      table.modelVersionId,
      table.decidedAt
    ),
    index('idx_allocation_decisions_portfolio_time').on(
      table.portfolioId,
      table.decidedAt
    ),
  ]
);

/**
 * tradeIntents are pre-order simulation intents only.
 * They are not broker orders, executions, fills, or settlement records.
 */
export const tradeIntents = mysqlTable(
  'trade_intents',
  {
    id: int('id').autoincrement().primaryKey(),
    allocationDecisionId: int('allocation_decision_id')
      .notNull()
      .references(() => allocationDecisions.id),
    portfolioId: int('portfolio_id')
      .notNull()
      .references(() => portfolios.id),
    instrumentId: int('instrument_id')
      .notNull()
      .references(() => marketInstruments.id),
    intentType: varchar('intent_type', { length: 40 }).notNull(),
    targetQuantity: decimal('target_quantity', {
      precision: 24,
      scale: 8,
    }),
    targetValue: decimal('target_value', { precision: 18, scale: 2 }),
    status: varchar('status', { length: 40 })
      .notNull()
      .default('pending_policy_check'),
    blockedReason: varchar('blocked_reason', { length: 700 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_trade_intents_allocation_decision_id').on(
      table.allocationDecisionId
    ),
    index('idx_trade_intents_portfolio_status').on(
      table.portfolioId,
      table.status
    ),
    index('idx_trade_intents_instrument_id').on(table.instrumentId),
  ]
);

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  modelCreators: many(modelCreators),
  userModelSelections: many(userModelSelections),
  mockDeposits: many(mockDeposits),
  portfolios: many(portfolios),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const modelCreatorsRelations = relations(
  modelCreators,
  ({ one, many }) => ({
    user: one(users, {
      fields: [modelCreators.userId],
      references: [users.id],
    }),
    investmentModels: many(investmentModels),
  })
);

export const investmentModelsRelations = relations(
  investmentModels,
  ({ one, many }) => ({
    creator: one(modelCreators, {
      fields: [investmentModels.creatorId],
      references: [modelCreators.id],
    }),
    currentVersion: one(modelVersions, {
      fields: [investmentModels.currentVersionId],
      references: [modelVersions.id],
    }),
    modelVersions: many(modelVersions),
    complianceReviews: many(complianceReviews),
    userModelSelections: many(userModelSelections),
  })
);

export const modelVersionsRelations = relations(
  modelVersions,
  ({ one, many }) => ({
    model: one(investmentModels, {
      fields: [modelVersions.modelId],
      references: [investmentModels.id],
    }),
    createdBy: one(users, {
      fields: [modelVersions.createdByUserId],
      references: [users.id],
    }),
    riskProfile: one(modelRiskProfiles),
    portfolioMandate: one(portfolioMandates),
    disclosures: many(modelDisclosures),
    performanceSnapshots: many(modelPerformanceSnapshots),
    complianceReviews: many(complianceReviews),
    userModelSelections: many(userModelSelections),
    allocationDecisions: many(allocationDecisions),
  })
);

export const modelRiskProfilesRelations = relations(
  modelRiskProfiles,
  ({ one }) => ({
    modelVersion: one(modelVersions, {
      fields: [modelRiskProfiles.modelVersionId],
      references: [modelVersions.id],
    }),
  })
);

export const modelDisclosuresRelations = relations(
  modelDisclosures,
  ({ one }) => ({
    modelVersion: one(modelVersions, {
      fields: [modelDisclosures.modelVersionId],
      references: [modelVersions.id],
    }),
    reviewedBy: one(users, {
      fields: [modelDisclosures.reviewedByUserId],
      references: [users.id],
    }),
  })
);

export const portfolioMandatesRelations = relations(
  portfolioMandates,
  ({ one }) => ({
    modelVersion: one(modelVersions, {
      fields: [portfolioMandates.modelVersionId],
      references: [modelVersions.id],
    }),
  })
);

export const complianceReviewsRelations = relations(
  complianceReviews,
  ({ one }) => ({
    model: one(investmentModels, {
      fields: [complianceReviews.modelId],
      references: [investmentModels.id],
    }),
    modelVersion: one(modelVersions, {
      fields: [complianceReviews.modelVersionId],
      references: [modelVersions.id],
    }),
    reviewer: one(users, {
      fields: [complianceReviews.reviewerUserId],
      references: [users.id],
    }),
  })
);

export const modelPerformanceSnapshotsRelations = relations(
  modelPerformanceSnapshots,
  ({ one }) => ({
    modelVersion: one(modelVersions, {
      fields: [modelPerformanceSnapshots.modelVersionId],
      references: [modelVersions.id],
    }),
  })
);

export const marketInstrumentsRelations = relations(
  marketInstruments,
  ({ many }) => ({
    portfolioPositions: many(portfolioPositions),
    tradeIntents: many(tradeIntents),
  })
);

export const userModelSelectionsRelations = relations(
  userModelSelections,
  ({ one, many }) => ({
    user: one(users, {
      fields: [userModelSelections.userId],
      references: [users.id],
    }),
    model: one(investmentModels, {
      fields: [userModelSelections.modelId],
      references: [investmentModels.id],
    }),
    modelVersion: one(modelVersions, {
      fields: [userModelSelections.modelVersionId],
      references: [modelVersions.id],
    }),
    portfolios: many(portfolios),
  })
);

export const mockDepositsRelations = relations(
  mockDeposits,
  ({ one }) => ({
    user: one(users, {
      fields: [mockDeposits.userId],
      references: [users.id],
    }),
  })
);

export const portfoliosRelations = relations(
  portfolios,
  ({ one, many }) => ({
    user: one(users, {
      fields: [portfolios.userId],
      references: [users.id],
    }),
    modelSelection: one(userModelSelections, {
      fields: [portfolios.modelSelectionId],
      references: [userModelSelections.id],
    }),
    positions: many(portfolioPositions),
    allocationDecisions: many(allocationDecisions),
    tradeIntents: many(tradeIntents),
  })
);

export const portfolioPositionsRelations = relations(
  portfolioPositions,
  ({ one }) => ({
    portfolio: one(portfolios, {
      fields: [portfolioPositions.portfolioId],
      references: [portfolios.id],
    }),
    instrument: one(marketInstruments, {
      fields: [portfolioPositions.instrumentId],
      references: [marketInstruments.id],
    }),
  })
);

export const allocationDecisionsRelations = relations(
  allocationDecisions,
  ({ one, many }) => ({
    modelVersion: one(modelVersions, {
      fields: [allocationDecisions.modelVersionId],
      references: [modelVersions.id],
    }),
    portfolio: one(portfolios, {
      fields: [allocationDecisions.portfolioId],
      references: [portfolios.id],
    }),
    tradeIntents: many(tradeIntents),
  })
);

export const tradeIntentsRelations = relations(
  tradeIntents,
  ({ one }) => ({
    allocationDecision: one(allocationDecisions, {
      fields: [tradeIntents.allocationDecisionId],
      references: [allocationDecisions.id],
    }),
    portfolio: one(portfolios, {
      fields: [tradeIntents.portfolioId],
      references: [portfolios.id],
    }),
    instrument: one(marketInstruments, {
      fields: [tradeIntents.instrumentId],
      references: [marketInstruments.id],
    }),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
/**
 * ModelCreator is the persisted creator identity shell used to own InvestmentModel rows.
 */
export type ModelCreator = typeof modelCreators.$inferSelect;
export type NewModelCreator = typeof modelCreators.$inferInsert;
/**
 * InvestmentModel is the persisted marketplace model row, not a user preference or trading bot.
 */
export type InvestmentModel = typeof investmentModels.$inferSelect;
export type NewInvestmentModel = typeof investmentModels.$inferInsert;
/**
 * ModelVersion fixes model-owned mandate and performance context for a reviewable version.
 */
export type ModelVersion = typeof modelVersions.$inferSelect;
export type NewModelVersion = typeof modelVersions.$inferInsert;
/**
 * ModelRiskProfile is a persisted risk disclosure profile owned by a future ModelVersion.
 */
export type ModelRiskProfile = typeof modelRiskProfiles.$inferSelect;
export type NewModelRiskProfile = typeof modelRiskProfiles.$inferInsert;
/**
 * ModelDisclosure is persisted disclosure copy or placeholder text awaiting review.
 */
export type ModelDisclosure = typeof modelDisclosures.$inferSelect;
export type NewModelDisclosure = typeof modelDisclosures.$inferInsert;
/**
 * PortfolioMandate stores model-owned analysis boundaries, not user preferences.
 */
export type PortfolioMandate = typeof portfolioMandates.$inferSelect;
export type NewPortfolioMandate = typeof portfolioMandates.$inferInsert;
/**
 * ComplianceReview is an operator review workflow record, not a legal decision.
 */
export type ComplianceReview = typeof complianceReviews.$inferSelect;
export type NewComplianceReview = typeof complianceReviews.$inferInsert;
/**
 * ModelPerformanceSnapshot stores backtest or placeholder performance context only.
 */
export type ModelPerformanceSnapshot =
  typeof modelPerformanceSnapshots.$inferSelect;
export type NewModelPerformanceSnapshot =
  typeof modelPerformanceSnapshots.$inferInsert;
/**
 * MarketInstrument is reference data for simulated model analysis and signals.
 */
export type MarketInstrument = typeof marketInstruments.$inferSelect;
export type NewMarketInstrument = typeof marketInstruments.$inferInsert;
/**
 * UserModelSelection records selected ModelVersion state without funding or suitability settings.
 */
export type UserModelSelection = typeof userModelSelections.$inferSelect;
export type NewUserModelSelection = typeof userModelSelections.$inferInsert;
/**
 * MockDeposit is simulated money for prototype read models, not real funds.
 */
export type MockDeposit = typeof mockDeposits.$inferSelect;
export type NewMockDeposit = typeof mockDeposits.$inferInsert;
/**
 * Portfolio is a simulated read-model portfolio, not a broker account.
 */
export type Portfolio = typeof portfolios.$inferSelect;
export type NewPortfolio = typeof portfolios.$inferInsert;
/**
 * PortfolioPosition stores simulated holdings for display and analysis.
 */
export type PortfolioPosition = typeof portfolioPositions.$inferSelect;
export type NewPortfolioPosition = typeof portfolioPositions.$inferInsert;
/**
 * AllocationDecision is simulated model analysis, not investment advice.
 */
export type AllocationDecision = typeof allocationDecisions.$inferSelect;
export type NewAllocationDecision = typeof allocationDecisions.$inferInsert;
/**
 * TradeIntent is a pre-order simulation intent, not an executed broker order.
 */
export type TradeIntent = typeof tradeIntents.$inferSelect;
export type NewTradeIntent = typeof tradeIntents.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
