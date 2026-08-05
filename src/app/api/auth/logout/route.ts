import { NextRequest, NextResponse } from 'next/server';
import { withAuth, apiSuccess } from '@/lib/auth/middleware';
import { query } from '@/lib/db';

export const POST = withAuth(async (_req, { user }) => {
  // Invalider le refresh token en DB
  await query(`UPDATE users SET refresh_token = NULL WHERE id = $1`, [user.id]);

  const response = apiSuccess({ message: 'Déconnexion réussie' });
  response.cookies.delete('vitara_access_token');
  response.cookies.delete('vitara_refresh_token');
  return response;
});
