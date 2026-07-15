import { NextRequest } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';

import { verifyToken } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { users } from '@/lib/db/schema';
import type { AccessRole } from '@/lib/domain/types';

export const investModelDemoUserPublicId = 'user_demo_001';

export type InvestModelUserScope = {
  userPublicId: string;
  source: 'session' | 'demo_fallback';
};

export function readInvestModelRole(request: NextRequest): AccessRole {
  const role = request.headers.get('x-invest-model-role');

  if (
    role === 'public' ||
    role === 'user' ||
    role === 'creator' ||
    role === 'admin' ||
    role === 'system'
  ) {
    return role;
  }

  return 'public';
}

function mapStoredUserRoleToAccessRole(role: string | null): AccessRole {
  if (role === 'admin' || role === 'creator') {
    return role;
  }

  if (role === 'member' || role === 'user') {
    return 'user';
  }

  return 'public';
}

async function readUserFromRequestCookie(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie);

  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number' ||
    new Date(sessionData.expires) < new Date()
  ) {
    return null;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  return user ?? null;
}

export async function readInvestModelSessionRole(
  request: NextRequest
): Promise<AccessRole> {
  try {
    const user = await getUser();

    if (user) {
      return mapStoredUserRoleToAccessRole(user.role);
    }
  } catch {
    // Route-level smoke tests can run without a Next cookies context.
  }

  try {
    const user = await readUserFromRequestCookie(request);

    if (user) {
      return mapStoredUserRoleToAccessRole(user.role);
    }
  } catch {
    // Invalid or absent request cookies are treated as public access.
  }

  return 'public';
}

export async function resolveInvestModelUserScope(
  request: NextRequest
): Promise<InvestModelUserScope> {
  try {
    const user = await getUser();

    if (user?.publicId) {
      return {
        userPublicId: user.publicId,
        source: 'session'
      };
    }
  } catch {
    // Route-level smoke tests and prototype reads can run without Next cookies.
  }

  try {
    const user = await readUserFromRequestCookie(request);

    if (user?.publicId) {
      return {
        userPublicId: user.publicId,
        source: 'session'
      };
    }
  } catch {
    // Invalid or absent request cookies fall back to the mock-safe demo scope.
  }

  return {
    userPublicId: investModelDemoUserPublicId,
    source: 'demo_fallback'
  };
}
