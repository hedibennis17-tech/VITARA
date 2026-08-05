import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyRefreshToken, signAccessToken, signRefreshToken, getAccessTokenCookie, getRefreshTokenCookie } from '@/lib/auth/jwt';
import { apiError, apiSuccess, apiServerError } from '@/lib/auth/middleware';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const token = req.cookies.get('vitara_refresh_token')?.value;
    if (!token) return apiError('Refresh token manquant', 401);

    const userId = await verifyRefreshToken(token);
    if (!userId) return apiError('Refresh token invalide', 401);

    // Vérifier que le token en DB correspond
    const user = await queryOne<{
      id: string; email: string; first_name: string; last_name: string;
      clinic_id: string; role_name: string; is_active: boolean; refresh_token: string;
    }>(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.clinic_id,
              u.is_active, u.refresh_token, r.name AS role_name
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );

    if (!user || !user.is_active) return apiError('Utilisateur introuvable', 401);
    if (user.refresh_token !== token) return apiError('Token révoqué', 401);

    // Générer nouveaux tokens
    const newAccess = await signAccessToken({
      sub: user.id, email: user.email, role: user.role_name,
      clinicId: user.clinic_id, firstName: user.first_name, lastName: user.last_name,
    });
    const newRefresh = await signRefreshToken(user.id);

    await queryOne(
      `UPDATE users SET refresh_token = $1 WHERE id = $2`,
      [newRefresh, user.id]
    );

    const response = apiSuccess({ accessToken: newAccess });
    response.cookies.set(getAccessTokenCookie(newAccess));
    response.cookies.set(getRefreshTokenCookie(newRefresh));
    return response;
  } catch (err) {
    return apiServerError(err);
  }
}
