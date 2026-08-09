import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const r: Record<string, any> = { ts: new Date().toISOString() };

  // 1. Token dans les cookies
  const token = req.cookies.get('vitara_access_token')?.value;
  r.cookie_token = token ? `✅ présent (${token.slice(0,20)}...)` : '❌ ABSENT';

  // 2. Vérifier le token JWT
  if (token) {
    try {
      const { verifyAccessToken } = await import('@/lib/auth/jwt');
      const p = await verifyAccessToken(token);
      r.token_valid = p ? `✅ valide — ${p.email} (${p.role})` : '❌ INVALIDE ou EXPIRÉ';
    } catch (e: any) {
      r.token_error = e.message;
    }
  }

  // 3. Test DB
  const DB = process.env.DATABASE_URL;
  r.db_url = DB ? '✅ présente' : '❌ MANQUANTE';
  if (DB) {
    try {
      const { Pool } = await import('pg');
      const pool = new Pool({ connectionString: DB, ssl: { rejectUnauthorized: false } });
      const [c, p, a] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM conversations'),
        pool.query('SELECT COUNT(*) FROM patients'),
        pool.query('SELECT COUNT(*) FROM appointments'),
      ]);
      r.db_conversations = parseInt(c.rows[0].count);
      r.db_patients      = parseInt(p.rows[0].count);
      r.db_appointments  = parseInt(a.rows[0].count);
      r.db_status = '✅ connectée';
      await pool.end();
    } catch (e: any) {
      r.db_error = e.message;
      r.db_status = '❌ erreur';
    }
  }

  // 4. Test /api/dashboard directement
  try {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    const dash = await fetch(`${base}/api/dashboard`, {
      headers: { Cookie: `vitara_access_token=${token||''}` },
    });
    const d = await dash.json();
    r.dashboard_api_status = dash.status;
    r.dashboard_api_ok     = dash.ok ? '✅' : '❌';
    r.dashboard_response   = d;
  } catch (e: any) {
    r.dashboard_api_error = e.message;
  }

  // 5. Variables d'env
  r.env = {
    GROQ_KEY:        process.env.GROQ_API_KEY       ? '✅' : '❌',
    ELEVENLABS_KEY:  process.env.ELEVENLABS_API_KEY  ? '✅' : '❌',
    JWT_SECRET:      process.env.JWT_SECRET           ? '✅' : '❌ MANQUANT',
    DATABASE_URL:    DB                               ? '✅' : '❌',
    NODE_ENV:        process.env.NODE_ENV,
  };

  // Résumé
  const issues = [];
  if (!token)                        issues.push('❌ Pas de cookie — déconnecté');
  if (token && !r.token_valid?.startsWith('✅')) issues.push('❌ Token invalide/expiré → se reconnecter');
  if (r.db_status !== '✅ connectée') issues.push('❌ DB non connectée → /api/db-setup');
  if (!process.env.JWT_SECRET)       issues.push('❌ JWT_SECRET manquant sur Vercel');

  r.DIAGNOSTIC = issues.length === 0 ? '✅ TOUT OK' : issues;

  return NextResponse.json(r, { status: 200 });
}
