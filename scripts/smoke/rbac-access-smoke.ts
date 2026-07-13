import assert from 'node:assert/strict';

import { canReviewInvestmentModel } from '../../lib/domain/models/admin-review';
import { canCreateModelDraft } from '../../lib/domain/models/creator-draft';
import { canRequestModelDescriptionRevision } from '../../lib/domain/models/description-revision';
import { canCreateCreatorDraft } from '../../lib/domain/models/model-creator';
import type { AccessRole } from '../../lib/domain/types';

const roles = ['public', 'user', 'creator', 'admin', 'system'] as const satisfies
  readonly AccessRole[];

type RoleGate = (role: AccessRole) => boolean;

function assertRoleGate({
  label,
  gate,
  allowedRoles
}: {
  label: string;
  gate: RoleGate;
  allowedRoles: readonly AccessRole[];
}) {
  for (const role of roles) {
    assert.equal(
      gate(role),
      allowedRoles.includes(role),
      `${label} should ${allowedRoles.includes(role) ? 'allow' : 'deny'} ${role}`
    );
  }
}

assertRoleGate({
  label: 'creator profile draft creation',
  gate: canCreateCreatorDraft,
  allowedRoles: ['creator', 'admin']
});

assertRoleGate({
  label: 'POST /api/creator/models',
  gate: canCreateModelDraft,
  allowedRoles: ['creator', 'admin']
});

assertRoleGate({
  label: 'POST /api/creator/models/[modelId]/description-revisions',
  gate: canRequestModelDescriptionRevision,
  allowedRoles: ['creator', 'admin']
});

assertRoleGate({
  label: 'POST /api/admin/models/[modelId]/reviews',
  gate: canReviewInvestmentModel,
  allowedRoles: ['admin']
});

console.log('RBAC access smoke test passed for creator and admin model gates.');
