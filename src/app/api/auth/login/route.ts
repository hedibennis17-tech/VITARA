import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken, getAccessTokenCookie, getRefreshTokenCookie } from '@/lib/auth/jwt';
import { LoginSchema, parseBody } from '@/lib/validators';
import { apiError, apiSuccess, apiServerError } from '@/lib/auth/middleware';
import { DEMO_MODE, DEMO_USERS } from '@/lib/db/demo';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = parseBody(LoginSchema, body);
    if (!parsed.success) return apiError(parsed.error, 422);

    const { email, password } = parsed.data;

    let user: typeof DEMO_USERS[0] | null = null;

    if (DEMO_MODE) {
      // Mode démo — recherche en mémoire
      user = DEMO_USERS.find(u => u.email === email.toLowerCase()) ?? null;
    } else {
      // Mode production — recherche en base
      const { queryOne } = await import('@/lib/db');
      user = await queryOne<typeof DEMO_USERS[0]>(
        `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name,
                u.clinic_id, u.is_active, r.name AS role_name
         FROM users u JOIN roles r ON u.role_id = r.id
         WHERE u.email = $1`,
        [email.toLowerCase()]
      );
    }

    if (!user) return apiError('Email ou mot de passe incorrect', 401);
    if (!user.is_active) return apiError('Compte désactivé', 403);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return apiError('Email ou mot de passe incorrect', 401);

    const accessToken = await signAccessToken({
      sub:       user.id,
      email:     user.email,
      role:      user.role_name,
      clinicId:  user.clinic_id,
      firstName: user.first_name,
      lastName:  user.last_name,
    });
    const refreshToken = await signRefreshToken(user.id);

    if (!DEMO_MODE) {
      const { queryOne } = await import('@/lib/db');
      await queryOne(
        `UPDATE users SET last_login_at = NOW(), refresh_token = $1 WHERE id = $2`,
        [refreshToken, user.id]
      );
    }

    const response = apiSuccess({
      user: {
        id: user.id, email: user.email, role: user.role_name,
        firstName: user.first_name, lastName: user.last_name,
        clinicId: user.clinic_id,
      },
      accessToken,
      demoMode: DEMO_MODE,
    });

    response.cookies.set(getAccessTokenCookie(accessToken));
    response.cookies.set(getRefreshTokenCookie(refreshToken));
    return response;
  } catch (err) {
    return apiServerError(err);
  }
}
