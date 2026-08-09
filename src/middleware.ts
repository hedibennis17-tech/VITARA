import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth/jwt';

// ── Routes publiques ──────────────────────────────────────────
const PUB_API  = [
  '/api/auth/login', '/api/auth/register', '/api/auth/refresh',
  '/api/ai/chat', '/api/diagnostic', '/api/voice',
  '/api/debug', '/api/workflow-debug', '/api/patients', '/api/db-setup', '/api/conversations',
];
const PUB_PAGE = [
  '/login', '/register',
  '/patient',        // App patient — toujours publique
  '/patient-portal', // Portail patient — toujours public
  '/_next', '/favicon',
];

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Fichiers statiques → passer
  if (pathname.startsWith('/_next/') || pathname.includes('.')) return NextResponse.next();

  // ── API ────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    if (PUB_API.some(r => pathname.startsWith(r))) return NextResponse.next();
    const t = req.cookies.get('vitara_access_token')?.value
              ?? extractBearerToken(req.headers.get('Authorization'));
    if (!t) return NextResponse.json({ success:false, error:{ message:'Non autorisé', code:'UNAUTHORIZED' } },{ status:401 });
    const p = await verifyAccessToken(t);
    if (!p) return NextResponse.json({ success:false, error:{ message:'Token expiré', code:'TOKEN_EXPIRED' } },{ status:401 });
    return NextResponse.next();
  }

  // ── Pages publiques (patient, portail, login) ─────────────
  if (PUB_PAGE.some(p => pathname.startsWith(p))) return NextResponse.next();

  // ── Dashboard admin — protégé ─────────────────────────────
  // "/" et toutes les autres routes → vérifier le token admin
  const t = req.cookies.get('vitara_access_token')?.value;
  if (!t) return NextResponse.redirect(new URL('/login', req.url)); // ← admin sans token → login
  const p = await verifyAccessToken(t);
  if (!p) {
    const r = NextResponse.redirect(new URL('/login', req.url));
    r.cookies.delete('vitara_access_token');
    return r;
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
