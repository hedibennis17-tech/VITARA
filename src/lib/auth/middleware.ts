import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractBearerToken, AuthUser } from './jwt';

// ================================================================
// Types
// ================================================================

export type Role = 'admin' | 'supervisor' | 'receptionist' | 'physician' | 'therapist' | 'nurse';

export type ApiHandler = (
  req: NextRequest,
  ctx: { user: AuthUser; params?: Record<string, string> | Promise<Record<string, string>> }
) => Promise<NextResponse>;

// ================================================================
// Réponses standardisées
// ================================================================

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiCreated<T>(data: T): NextResponse {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function apiError(message: string, status = 400, code?: string): NextResponse {
  return NextResponse.json({ success: false, error: { message, code } }, { status });
}

export function apiUnauthorized(message = 'Non autorisé'): NextResponse {
  return apiError(message, 401, 'UNAUTHORIZED');
}

export function apiForbidden(message = 'Accès refusé'): NextResponse {
  return apiError(message, 403, 'FORBIDDEN');
}

export function apiNotFound(resource = 'Ressource'): NextResponse {
  return apiError(`${resource} introuvable`, 404, 'NOT_FOUND');
}

export function apiServerError(err?: unknown): NextResponse {
  console.error('[VITARA API Error]', err);
  return apiError('Erreur interne du serveur', 500, 'SERVER_ERROR');
}

// ================================================================
// Permissions
// ================================================================

const ROLE_HIERARCHY: Record<Role, number> = {
  admin:        100,
  supervisor:   80,
  receptionist: 60,
  physician:    50,
  therapist:    40,
  nurse:        30,
};

export function hasRole(userRole: string, required: Role): boolean {
  return (ROLE_HIERARCHY[userRole as Role] ?? 0) >= ROLE_HIERARCHY[required];
}

export function isAdminOrSupervisor(role: string): boolean {
  return hasRole(role, 'supervisor');
}

// ================================================================
// Middleware withAuth — protège une route API
// ================================================================

export function withAuth(
  handler: ApiHandler,
  options?: { roles?: Role[] }
) {
  return async (req: NextRequest, context?: { params?: Record<string, string> | Promise<Record<string, string>> }) => {
    try {
      // 1. Extraire le token (cookie ou header)
      const cookieToken = req.cookies.get('vitara_access_token')?.value;
      const headerToken = extractBearerToken(req.headers.get('Authorization'));
      const token = cookieToken ?? headerToken;

      if (!token) return apiUnauthorized('Token manquant');

      // 2. Vérifier le token
      const payload = await verifyAccessToken(token);
      if (!payload) return apiUnauthorized('Token invalide ou expiré');

      const user: AuthUser = {
        id:        payload.sub!,
        email:     payload.email,
        role:      payload.role,
        clinicId:  payload.clinicId,
        firstName: payload.firstName,
        lastName:  payload.lastName,
      };

      // 3. Vérifier le rôle si requis
      if (options?.roles?.length) {
        const allowed = options.roles.some(r => hasRole(user.role, r));
        if (!allowed) return apiForbidden(`Rôle requis: ${options.roles.join(' ou ')}`);
      }

      // 4. Passer à l'handler
      return handler(req, { user, params: context?.params });

    } catch (err) {
      return apiServerError(err);
    }
  };
}

// ================================================================
// Middleware withOptionalAuth — ne bloque pas si pas de token
// ================================================================

export function withOptionalAuth(
  handler: (req: NextRequest, ctx: { user: AuthUser | null }) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const token =
        req.cookies.get('vitara_access_token')?.value ??
        extractBearerToken(req.headers.get('Authorization'));

      let user: AuthUser | null = null;
      if (token) {
        const payload = await verifyAccessToken(token);
        if (payload) {
          user = {
            id: payload.sub!, email: payload.email,
            role: payload.role, clinicId: payload.clinicId,
            firstName: payload.firstName, lastName: payload.lastName,
          };
        }
      }
      return handler(req, { user });
    } catch (err) {
      return apiServerError(err);
    }
  };
}
