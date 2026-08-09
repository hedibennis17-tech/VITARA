import { NextResponse } from 'next/server';

export async function GET() {
  const result: Record<string, any> = {
    timestamp: new Date().toISOString(),
    status: 'VITARA API en ligne ✅',
  };

  // Test DB
  const DB = process.env.DATABASE_URL;
  result.database = DB ? '✅ DATABASE_URL présente' : '❌ DATABASE_URL manquante';

  if (DB) {
    try {
      const { Pool } = await import('pg');
      const pool = new Pool({ connectionString: DB, ssl: { rejectUnauthorized: false } });
      const r = await pool.query('SELECT COUNT(*) FROM conversations');
      result.conversations_count = parseInt(r.rows[0].count);
      const r2 = await pool.query('SELECT COUNT(*) FROM patients');
      result.patients_count = parseInt(r2.rows[0].count);
      result.db_connected = '✅ Connectée';
      await pool.end();
    } catch (e: any) {
      result.db_error = e.message;
      result.db_connected = '❌ Erreur connexion';
    }
  }

  // Test GROQ
  result.groq_key = process.env.GROQ_API_KEY ? '✅ Présente' : '❌ Manquante';
  result.elevenlabs_key = process.env.ELEVENLABS_API_KEY ? '✅ Présente' : '❌ Manquante';
  result.node_env = process.env.NODE_ENV;

  // Test extraction (simulation)
  try {
    const { extractFromMessage, EMPTY_STATE, nextStep } = await import('@/lib/conversation/engine');
    const state = { ...EMPTY_STATE };
    const updates = extractFromMessage('Alain Trembley', state);
    result.extraction_test = {
      input: 'Alain Trembley',
      full_name_extracted: updates.full_name?.value || '❌ NON EXTRAIT',
      status: updates.full_name?.status || 'unknown',
    };
    const stateAfter = { ...state, ...updates };
    const step = nextStep(stateAfter as any);
    result.next_step_after_name = step.type === 'ask' ? (step as any).fr : 'slots';
  } catch (e: any) {
    result.extraction_error = e.message;
  }

  return NextResponse.json(result, { status: 200 });
}
