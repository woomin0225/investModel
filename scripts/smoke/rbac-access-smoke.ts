import assert from 'node:assert/strict';

import { canReviewInvestmentModel } from '../../lib/domain/models/admin-review';
import { canReadFeed } from '../../lib/domain/feed/feed-post';
import { canCreateModelDraft } from '../../lib/domain/models/creator-draft';
import { canRequestModelDescriptionRevision } from '../../lib/domain/models/description-revision';
import { canCreateCreatorDraft } from '../../lib/domain/models/model-creator';
import { canCreateModelSelection } from '../../lib/domain/models/model-selection';
import { canReadSignals } from '../../lib/domain/signals/signal-event';
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

assertRoleGate({
  label: 'GET /api/feed and feed interaction routes',
  gate: canReadFeed,
  allowedRoles: ['user', 'admin']
});

assertRoleGate({
  label: 'GET /api/signals and signal detail routes',
  gate: canReadSignals,
  allowedRoles: ['user', 'admin']
});

assertRoleGate({
  label: 'POST /api/model-selections',
  gate: canCreateModelSelection,
  allowedRoles: ['user', 'admin']
});

console.log(
  'RBAC access smoke test passed for creator/admin model gates and user/admin read scopes.'
);
