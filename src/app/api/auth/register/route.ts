import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';
import { signAccessToken, signRefreshToken, getAccessTokenCookie, getRefreshTokenCookie } from '@/lib/auth/jwt';
import { RegisterSchema, parseBody } from '@/lib/validators';
import { apiError, apiCreated, apiServerError } from '@/lib/auth/middleware';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = parseBody(RegisterSchema, body);
    if (!parsed.success) return apiError(parsed.error, 422);

    const { email, password, firstName, lastName, role, clinicId } = parsed.data;

    // Vérifier unicité email
    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing) return apiError('Email déjà utilisé', 409);

    // Récupérer le role_id
    const roleRow = await queryOne<{ id: string }>(
      'SELECT id FROM roles WHERE name = $1', [role]
    );
    if (!roleRow) return apiError('Rôle invalide', 400);

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const user = await queryOne<{
      id: string; email: string; first_name: string; last_name: string;
    }>(
      `INSERT INTO users (email, password_hash, first_name, last_name, role_id, clinic_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name`,
      [email.toLowerCase(), passwordHash, firstName, lastName, roleRow.id, clinicId ?? null]
    );

    if (!user) return apiError('Erreur lors de la création du compte', 500);

    const accessToken = await signAccessToken({
      sub: user.id, email: user.email, role,
      clinicId: clinicId ?? '', firstName, lastName,
    });
    const refreshToken = await signRefreshToken(user.id);

    const response = apiCreated({
      user: { id: user.id, email: user.email, role, firstName, lastName },
      accessToken,
    });
    response.cookies.set(getAccessTokenCookie(accessToken));
    response.cookies.set(getRefreshTokenCookie(refreshToken));
    return response;
  } catch (err) {
    return apiServerError(err);
  }
}
