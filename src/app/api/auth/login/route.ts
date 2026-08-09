import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken, getAccessTokenCookie, getRefreshTokenCookie } from '@/lib/auth/jwt';
import { LoginSchema, parseBody } from '@/lib/validators';
import { apiError, apiSuccess, apiServerError } from '@/lib/auth/middleware';
import { DEMO_USERS } from '@/lib/db/demo';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = parseBody(LoginSchema, body);
    if (!parsed.success) return apiError(parsed.error, 422);

    const { email, password } = parsed.data;
    let user: typeof DEMO_USERS[0] | null = null;
    let fromDB = false;

    // Essayer la DB si DATABASE_URL est défini
    const DB = process.env.DATABASE_URL;
    if (DB) {
      try {
        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString: DB, ssl: { rejectUnauthorized: false } });
        const r = await pool.query(
          `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name,
                  u.clinic_id, u.is_active, COALESCE(ro.name, 'admin') AS role_name
           FROM users u LEFT JOIN roles ro ON u.role_id = ro.id
           WHERE u.email = $1 LIMIT 1`,
          [email.toLowerCase()]
        );
        await pool.end();
        if (r.rows.length > 0) { user = r.rows[0]; fromDB = true; }
      } catch {
        // Table users inexistante ou autre erreur → fallback DEMO_USERS
      }
    }

    // Fallback: DEMO_USERS (toujours disponible)
    if (!user) {
      user = DEMO_USERS.find(u => u.email === email.toLowerCase()) ?? null;
    }

    if (!user) return apiError('Email ou mot de passe incorrect', 401);
    if (!user.is_active) return apiError('Compte désactivé', 403);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return apiError('Email ou mot de passe incorrect', 401);

    const accessToken = await signAccessToken({
      sub: user.id, email: user.email, role: user.role_name,
      clinicId: user.clinic_id, firstName: user.first_name, lastName: user.last_name,
    });
    const refreshToken = await signRefreshToken(user.id);

    // Mettre à jour last_login si user vient de la DB
    if (fromDB && DB) {
      try {
        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString: DB, ssl: { rejectUnauthorized: false } });
        await pool.query('UPDATE users SET last_login_at=NOW(), refresh_token=$1 WHERE id=$2', [refreshToken, user.id]);
        await pool.end();
      } catch { /* ignore */ }
    }

    const response = apiSuccess({
      user: { id: user.id, email: user.email, role: user.role_name, firstName: user.first_name, lastName: user.last_name, clinicId: user.clinic_id },
      accessToken, fromDB,
    });
    response.cookies.set(getAccessTokenCookie(accessToken));
    response.cookies.set(getRefreshTokenCookie(refreshToken));
    return response;
  } catch (err) {
    return apiServerError(err);
  }
}
