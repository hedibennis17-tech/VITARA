import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne } from '@/lib/db';
import { signAccessToken, signRefreshToken, getAccessTokenCookie, getRefreshTokenCookie } from '@/lib/auth/jwt';
import { LoginSchema, parseBody } from '@/lib/validators';
import { apiError, apiSuccess, apiServerError } from '@/lib/auth/middleware';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = parseBody(LoginSchema, body);
    if (!parsed.success) return apiError(parsed.error, 422);

    const { email, password } = parsed.data;

    // Rechercher l'utilisateur
    const user = await queryOne<{
      id: string; email: string; password_hash: string;
      first_name: string; last_name: string; clinic_id: string;
      is_active: boolean; role_name: string;
    }>(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name,
              u.clinic_id, u.is_active, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (!user) return apiError('Email ou mot de passe incorrect', 401);
    if (!user.is_active) return apiError('Compte désactivé', 403);

    // Vérifier le mot de passe
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return apiError('Email ou mot de passe incorrect', 401);

    // Générer les tokens
    const accessToken = await signAccessToken({
      sub:       user.id,
      email:     user.email,
      role:      user.role_name,
      clinicId:  user.clinic_id,
      firstName: user.first_name,
      lastName:  user.last_name,
    });
    const refreshToken = await signRefreshToken(user.id);

    // Mettre à jour last_login + refresh_token en DB
    await queryOne(
      `UPDATE users SET last_login_at = NOW(), refresh_token = $1 WHERE id = $2`,
      [refreshToken, user.id]
    );

    // Réponse avec cookies
    const response = apiSuccess({
      user: {
        id:        user.id,
        email:     user.email,
        role:      user.role_name,
        firstName: user.first_name,
        lastName:  user.last_name,
        clinicId:  user.clinic_id,
      },
      accessToken,
    });

    response.cookies.set(getAccessTokenCookie(accessToken));
    response.cookies.set(getRefreshTokenCookie(refreshToken));

    return response;
  } catch (err) {
    return apiServerError(err);
  }
}
