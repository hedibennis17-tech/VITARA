import { NextRequest, NextResponse } from 'next/server';
import { withAuth, apiSuccess } from '@/lib/auth/middleware';

export const GET = withAuth(async (_req, { user }) => {
  return apiSuccess({ user });
});
