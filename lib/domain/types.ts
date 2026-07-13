/**
 * DomainPublicId is the stable external identifier exposed by investModel APIs instead of internal database ids.
 */
export type DomainPublicId = string;

/**
 * AccessRole is the canonical RBAC actor role used by API guards, audit logs, and permission checks.
 * User-facing financial actions remain denied unless an explicit later review changes the policy.
 */
export type AccessRole = 'public' | 'user' | 'creator' | 'admin' | 'system';

/**
 * HumanUserRole is the subset of roles that can belong to a signed-in human account.
 * The system role is reserved for scheduled internal jobs and must not be assigned to users.
 */
export type HumanUserRole = 'user' | 'creator' | 'admin';

/**
 * ModelCreatorVerificationStatus tracks creator identity review, not model performance quality or legal approval.
 */
export type ModelCreatorVerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'suspended';

/**
 * PermissionResult records a role check outcome without exposing secret policy details to the UI.
 * Policy-blocked is used for real orders, real deposits, brokerage links, and legal-review boundaries.
 */
export type PermissionResult =
  | 'allowed'
  | 'denied'
  | 'policy_blocked'
  | 'review_required';

/**
 * UserAccount represents a signed-in human account and its coarse application role.
 * It must not store brokerage credentials, bank credentials, or model runtime secrets.
 */
export interface UserAccount {
  publicId: DomainPublicId;
  email: string;
  displayName?: string;
  role: HumanUserRole;
  createdAt: string;
}

/**
 * ModelCreator is the public creator profile shell used to own InvestmentModel drafts.
 * Verification only gates marketplace publishing; it is not an endorsement of returns.
 */
export interface ModelCreator {
  publicId: DomainPublicId;
  userPublicId: DomainPublicId;
  displayName: string;
  bio?: string;
  verificationStatus: ModelCreatorVerificationStatus;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * InvestmentModelStatus tracks whether a model can move from creator draft to public discovery.
 * Only approved/live models should appear in user-facing discovery surfaces.
 */
export type InvestmentModelStatus =
  | 'draft'
  | 'pending_review'
  | 'changes_requested'
  | 'rejected'
  | 'approved'
  | 'live'
  | 'paused'
  | 'suspended'
  | 'retired';

/**
 * ModelRiskLevel describes risk that belongs to an AI model, not a user-editable preference.
 */
export type ModelRiskLevel = 'low' | 'medium' | 'high' | 'very_high';

/**
 * ModelArtifactStatus records whether a model artifact is only metadata, uploaded, quarantined, approved, or rejected.
 * Metadata-only is the MVP default because uploaded model execution is not allowed yet.
 */
export type ModelArtifactStatus =
  | 'metadata_only'
  | 'uploaded'
  | 'quarantined'
  | 'approved'
  | 'rejected';

/**
 * ReviewStatus tracks operator review workflow without claiming final legal approval.
 */
export type ReviewStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested';

/**
 * MockDepositStatus represents simulated money display state only.
 * It must never be interpreted as a real deposit, payment, withdrawal, or brokerage balance.
 */
export type MockDepositStatus =
  | 'created'
  | 'simulated_available'
  | 'simulated_allocated'
  | 'cancelled'
  | 'archived';

/**
 * AllocationDecisionStatus describes model-generated allocation analysis before any order layer exists.
 */
export type AllocationDecisionStatus =
  | 'draft'
  | 'policy_checked'
  | 'blocked'
  | 'ready_for_simulation';

/**
 * TradeIntentStatus describes a pre-order simulation intent.
 * It is not a broker order, execution, fill, or live trading instruction.
 */
export type TradeIntentStatus =
  | 'pending_policy_check'
  | 'approved_for_simulation'
  | 'blocked'
  | 'cancelled';

/**
 * SignalEventType identifies the observed input source for a signal without turning it into advice.
 */
export type SignalEventType = 'news_traffic' | 'price_trend' | 'macro' | 'risk';

/**
 * InvestmentModel is the public AI investment model unit registered by a creator and selected by users.
 * It must not be renamed Strategy, Bot, or Advisor in domain code.
 */
export interface InvestmentModel {
  publicId: DomainPublicId;
  creatorPublicId: DomainPublicId;
  name: string;
  slug: string;
  status: InvestmentModelStatus;
  visibility: 'public' | 'private' | 'unlisted';
  currentVersionPublicId?: DomainPublicId;
  createdAt: string;
  updatedAt: string;
}

/**
 * ModelVersion freezes model description, mandate, risk, disclosure, and performance context for review and display.
 */
export interface ModelVersion {
  publicId: DomainPublicId;
  modelPublicId: DomainPublicId;
  versionLabel: string;
  summary: string;
  modelArtifactStatus: ModelArtifactStatus;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
}

/**
 * ModelRiskProfile describes the model's own risk posture, leverage allowance, volatility, and drawdown context.
 */
export interface ModelRiskProfile {
  modelVersionPublicId: DomainPublicId;
  riskLevel: ModelRiskLevel;
  leverageAllowed: boolean;
  maxDrawdownLabel: string;
  volatilityLabel: string;
  riskSummary: string;
}

/**
 * PortfolioMandate defines what a model is allowed and forbidden to invest in.
 * Users do not edit this mandate as a personal allocation preference in the MVP.
 */
export interface PortfolioMandate {
  modelVersionPublicId: DomainPublicId;
  allowedAssetClasses: string[];
  prohibitedAssetClasses: string[];
  allowedMarkets: string[];
  rebalancePolicy: string;
  mandateSummary: string;
}

/**
 * ModelDisclosure stores risk, performance, limitation, and legal-placeholder copy for a model version.
 * Legal-placeholder values are not final legal advice or approved disclosure text.
 */
export interface ModelDisclosure {
  publicId: DomainPublicId;
  modelVersionPublicId: DomainPublicId;
  disclosureType: 'risk' | 'performance' | 'limitation' | 'legal_placeholder';
  title: string;
  body: string;
  requiresLegalReview: boolean;
}

/**
 * ComplianceReview records an operator review event for model, version, or disclosure changes.
 * It does not mean Codex has made a legal or financial suitability judgment.
 */
export interface ComplianceReview {
  publicId: DomainPublicId;
  modelPublicId: DomainPublicId;
  modelVersionPublicId?: DomainPublicId;
  status: ReviewStatus;
  reviewerUserPublicId?: DomainPublicId;
  notes?: string;
  reviewedAt?: string;
}

/**
 * UserModelSelection records that a user selected a specific model version.
 * It is not a user-controlled risk, leverage, stock ratio, or bond ratio preference.
 */
export interface UserModelSelection {
  publicId: DomainPublicId;
  userPublicId: DomainPublicId;
  modelPublicId: DomainPublicId;
  modelVersionPublicId: DomainPublicId;
  status: 'active' | 'paused' | 'revoked';
  riskAcknowledgedAt?: string;
  createdAt: string;
}

/**
 * MockDeposit represents simulated funds for early UI and API development only.
 * It must not be wired to payment, banking, withdrawal, or brokerage account logic.
 */
export interface MockDeposit {
  publicId: DomainPublicId;
  userPublicId: DomainPublicId;
  amount: string;
  currency: string;
  status: MockDepositStatus;
  sourceType: 'mock';
  createdAt: string;
}

/**
 * Portfolio represents a mock portfolio state connected to a selected model.
 * It is not proof of real holdings or brokerage account positions.
 */
export interface Portfolio {
  publicId: DomainPublicId;
  userPublicId: DomainPublicId;
  modelSelectionPublicId: DomainPublicId;
  status: 'mock_active' | 'paused' | 'closed';
  createdAt: string;
}

/**
 * AllocationDecision captures a model's simulated allocation analysis from signals and mandates.
 * It is upstream of TradeIntent and must not be displayed as a finalized user recommendation.
 */
export interface AllocationDecision {
  publicId: DomainPublicId;
  modelVersionPublicId: DomainPublicId;
  portfolioPublicId: DomainPublicId;
  decisionStatus: AllocationDecisionStatus;
  rationaleSummary: string;
  createdAt: string;
}

/**
 * TradeIntent captures a simulated pre-order intent produced after policy checks.
 * No implementation may treat it as an executed order or broker API request.
 */
export interface TradeIntent {
  publicId: DomainPublicId;
  allocationDecisionPublicId: DomainPublicId;
  portfolioPublicId: DomainPublicId;
  instrumentPublicId: DomainPublicId;
  side: 'buy' | 'sell';
  quantity: string;
  status: TradeIntentStatus;
  createdAt: string;
}

/**
 * SignalEvent represents observed market, news, traffic, macro, or risk input for model analysis.
 * It is not a buy, sell, hold, or rebalance recommendation.
 */
export interface SignalEvent {
  publicId: DomainPublicId;
  modelVersionPublicId: DomainPublicId;
  signalType: SignalEventType;
  score: number;
  title: string;
  summary: string;
  sourceArticlePublicId?: DomainPublicId;
  sourceInstrumentPublicId?: DomainPublicId;
  capturedAt: string;
}

/**
 * FeedPost represents informational model, market, or operator commentary for the feed surface.
 * It must not guarantee returns or encourage a user to trade securities.
 */
export interface FeedPost {
  publicId: DomainPublicId;
  modelPublicId?: DomainPublicId;
  authorUserPublicId?: DomainPublicId;
  title: string;
  body: string;
  postType: 'model_note' | 'market_context' | 'risk_note' | 'review_note';
  publishedAt?: string;
}
