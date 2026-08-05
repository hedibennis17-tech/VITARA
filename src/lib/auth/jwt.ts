import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'vitara-secret-change-in-production-32chars-min'
);
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? 'vitara-refresh-secret-change-in-prod-32c'
);

export const ACCESS_TOKEN_TTL  = '15m';
export const REFRESH_TOKEN_TTL = '7d';

// ================================================================
// Types
// ================================================================

export interface TokenPayload extends JWTPayload {
  sub: string;      // user_id
  email: string;
  role: string;
  clinicId: string;
  firstName: string;
  lastName: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  clinicId: string;
  firstName: string;
  lastName: string;
}

// ================================================================
// Génération de tokens
// ================================================================

export async function signAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .setIssuer('vitara')
    .setAudience('vitara-app')
    .sign(JWT_SECRET);
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .setIssuer('vitara')
    .sign(JWT_REFRESH_SECRET);
}

// ================================================================
// Vérification de tokens
// ================================================================

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'vitara',
      audience: 'vitara-app',
    });
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET, {
      issuer: 'vitara',
    });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

// ================================================================
// Extraction depuis les cookies/headers
// ================================================================

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('vitara_access_token')?.value;
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload) return null;
  return {
    id:        payload.sub!,
    email:     payload.email,
    role:      payload.role,
    clinicId:  payload.clinicId,
    firstName: payload.firstName,
    lastName:  payload.lastName,
  };
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

// ================================================================
// Cookies helpers
// ================================================================

export function getAccessTokenCookie(token: string) {
  return {
    name: 'vitara_access_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 15 * 60,  // 15 minutes
    path: '/',
  };
}

export function getRefreshTokenCookie(token: string) {
  return {
    name: 'vitara_refresh_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60,  // 7 jours
    path: '/api/auth',
  };
}
