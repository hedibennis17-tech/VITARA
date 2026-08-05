import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth/jwt';

// Routes API publiques (sans auth)
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
];

// Routes frontend publiques
const PUBLIC_PAGES = [
  '/login',
  '/register',
  '/patient',
  '/_next',
  '/favicon',
  '/public',
];

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Laisser passer les ressources statiques
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/public/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Routes API
  if (pathname.startsWith('/api/')) {
    // Routes publiques — pas de vérification
    if (PUBLIC_API_ROUTES.some(r => pathname.startsWith(r))) {
      return NextResponse.next();
    }

    // Vérifier le token
    const token =
      req.cookies.get('vitara_access_token')?.value ??
      extractBearerToken(req.headers.get('Authorization'));

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Non autorisé', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: { message: 'Token invalide ou expiré', code: 'TOKEN_EXPIRED' } },
        { status: 401 }
      );
    }

    // Injecter l'user dans les headers pour les route handlers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id',       payload.sub ?? '');
    requestHeaders.set('x-user-email',    payload.email);
    requestHeaders.set('x-user-role',     payload.role);
    requestHeaders.set('x-user-clinic',   payload.clinicId);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Pages frontend
  const isPublicPage = PUBLIC_PAGES.some(p => pathname.startsWith(p));
  if (isPublicPage) return NextResponse.next();

  // Vérifier auth pour les pages privées
  const token = req.cookies.get('vitara_access_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('vitara_access_token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
