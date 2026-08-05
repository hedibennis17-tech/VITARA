import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth/jwt';

const PUB_API  = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];
const PUB_PAGE = ['/login', '/patient', '/register', '/_next', '/favicon'];

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/_next/') || pathname.includes('.')) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    if (PUB_API.some(r => pathname.startsWith(r))) return NextResponse.next();
    const t = req.cookies.get('vitara_access_token')?.value ?? extractBearerToken(req.headers.get('Authorization'));
    if (!t) return NextResponse.json({ success: false, error: { message: 'Non autorisé', code: 'UNAUTHORIZED' } }, { status: 401 });
    const p = await verifyAccessToken(t);
    if (!p) return NextResponse.json({ success: false, error: { message: 'Token expiré', code: 'TOKEN_EXPIRED' } }, { status: 401 });
    return NextResponse.next();
  }

  if (PUB_PAGE.some(p => pathname.startsWith(p))) return NextResponse.next();

  const t = req.cookies.get('vitara_access_token')?.value;
  if (!t) return NextResponse.redirect(new URL('/login', req.url));
  const p = await verifyAccessToken(t);
  if (!p) { const r = NextResponse.redirect(new URL('/login', req.url)); r.cookies.delete('vitara_access_token'); return r; }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
