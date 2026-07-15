import { NextRequest } from 'next/server';

import { getUser } from '@/lib/db/queries';
import type { AccessRole } from '@/lib/domain/types';

export const investModelDemoUserPublicId = 'user_demo_001';

export type InvestModelUserScope = {
  userPublicId: string;
  source: 'session' | 'demo_fallback';
  ignoredClientUserPublicId?: string;
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

export async function resolveInvestModelUserScope(
  request: NextRequest
): Promise<InvestModelUserScope> {
  const clientUserPublicId = request.nextUrl.searchParams
    .get('userPublicId')
    ?.trim();

  try {
    const user = await getUser();

    if (user?.publicId) {
      return {
        userPublicId: user.publicId,
        source: 'session',
        ignoredClientUserPublicId:
          clientUserPublicId && clientUserPublicId !== user.publicId
            ? clientUserPublicId
            : undefined
      };
    }
  } catch {
    // Route-level smoke tests and prototype reads can run without Next cookies.
  }

  return {
    userPublicId: investModelDemoUserPublicId,
    source: 'demo_fallback',
    ignoredClientUserPublicId:
      clientUserPublicId && clientUserPublicId !== investModelDemoUserPublicId
        ? clientUserPublicId
        : undefined
  };
}
