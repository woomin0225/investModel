import {
  mysqlTable,
  int,
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

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  modelCreators: many(modelCreators),
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
  ({ one }) => ({
    creator: one(modelCreators, {
      fields: [investmentModels.creatorId],
      references: [modelCreators.id],
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
