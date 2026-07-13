import type {
  AccessRole,
  ModelCreator,
  ModelCreatorVerificationStatus
} from '@/lib/domain/types';

/**
 * ModelCreator policy helpers centralize creator profile verification rules.
 * They gate marketplace publishing without claiming model quality, suitability, or legal approval.
 */

export const modelCreatorVerificationStatuses: readonly ModelCreatorVerificationStatus[] =
  ['unverified', 'pending', 'verified', 'rejected', 'suspended'] as const;

export interface CreatorPublishingPolicyInput {
  role: AccessRole;
  creator?: Pick<ModelCreator, 'verificationStatus'>;
}

export interface CreatorPublishingPolicyResult {
  allowed: boolean;
  reason:
    | 'allowed'
    | 'role_denied'
    | 'creator_profile_missing'
    | 'creator_unverified'
    | 'creator_review_pending'
    | 'creator_rejected'
    | 'creator_suspended';
}

export function canCreateCreatorDraft(role: AccessRole) {
  return role === 'creator' || role === 'admin';
}

export function canCreatorPublishLiveModel({
  role,
  creator
}: CreatorPublishingPolicyInput): CreatorPublishingPolicyResult {
  if (role !== 'creator' && role !== 'admin') {
    return { allowed: false, reason: 'role_denied' };
  }

  if (!creator) {
    return { allowed: false, reason: 'creator_profile_missing' };
  }

  if (creator.verificationStatus === 'verified') {
    return { allowed: true, reason: 'allowed' };
  }

  if (creator.verificationStatus === 'pending') {
    return { allowed: false, reason: 'creator_review_pending' };
  }

  if (creator.verificationStatus === 'rejected') {
    return { allowed: false, reason: 'creator_rejected' };
  }

  if (creator.verificationStatus === 'suspended') {
    return { allowed: false, reason: 'creator_suspended' };
  }

  return { allowed: false, reason: 'creator_unverified' };
}
