import { NextResponse } from 'next/server';

export async function GET() {
  const r: Record<string,any> = { ts: new Date().toISOString() };

  // 1. DB Neon
  const DB = process.env.DATABASE_URL;
  if (DB) {
    try {
      const t = Date.now();
      const { Pool } = await import('pg');
      const pool = new Pool({ connectionString:DB, ssl:{rejectUnauthorized:false}, connectionTimeoutMillis:5000 });
      const res = await pool.query('SELECT NOW() as now, COUNT(*) as convs FROM conversations');
      await pool.end();
      r.db = { status:'✅ OK', latency_ms:Date.now()-t, conversations:res.rows[0].convs };
    } catch(e:any) { r.db = { status:'❌ ERREUR', error:e.message }; }
  } else { r.db = { status:'❌ DATABASE_URL manquante' }; }

  // 2. Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const t = Date.now();
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST', signal:AbortSignal.timeout(8000),
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.GROQ_API_KEY}`},
        body:JSON.stringify({model:'llama3-8b-8192',max_tokens:5,messages:[{role:'user',content:'ok'}]}),
      });
      const d = await res.json() as any;
      r.groq = {
        status: res.ok?'✅ OK':'❌ Erreur',
        latency_ms: Date.now()-t, http: res.status,
        error_detail: res.ok ? undefined : (d?.error?.message || JSON.stringify(d)).slice(0,120),
        key_prefix: process.env.GROQ_API_KEY?.slice(0,12)+'...',
      };
    } catch(e:any) { r.groq = { status:'❌ TIMEOUT', error:e.message }; }
  } else { r.groq = '❌ Clé manquante'; }

  // 3. ElevenLabs
  if (process.env.ELEVENLABS_API_KEY) {
    try {
      const t = Date.now();
      const res = await fetch('https://api.elevenlabs.io/v1/user', {
        signal:AbortSignal.timeout(5000),
        headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY},
      });
      const d = await res.json() as any;
      const remaining = (d.subscription?.character_limit||0)-(d.subscription?.character_count||0);
      r.elevenlabs = { status:res.ok?'✅ OK':'❌ Erreur', latency_ms:Date.now()-t, tier:d.subscription?.tier, chars_remaining:remaining };
      if (remaining < 500) r.elevenlabs.warning = '⚠️ CRÉDITS ÉPUISÉS → erreur réseau sur TTS';
    } catch(e:any) { r.elevenlabs = { status:'❌ TIMEOUT', error:e.message }; }
  } else { r.elevenlabs = '❌ Clé manquante'; }

  // 4. Self-test Chat API
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  try {
    const t = Date.now();
    const res = await fetch(`${base}/api/ai/chat`, {
      method:'POST', signal:AbortSignal.timeout(12000),
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:[{role:'user',content:'test'}],language:'fr',agent:'houda',conversation_state:{},session_id:'diag'}),
    });
    const d = await res.json() as any;
    const text = d.content?.[0]?.text ? JSON.parse(d.content[0].text) : null;
    r.chat_api = { status:res.ok?'✅ OK':'❌ Erreur', latency_ms:Date.now()-t, speak:text?.speak?.slice(0,60) };
  } catch(e:any) { r.chat_api = { status:'❌ TIMEOUT', error:e.message, tip:'Si DB cold-start → retry' }; }

  const issues: string[] = [];
  if (!r.db?.status?.startsWith('✅'))       issues.push(`DB: ${r.db?.error||'erreur'}`);
  if (!r.groq?.status?.startsWith('✅'))     issues.push(`Groq: ${r.groq?.error||'erreur'}`);
  if (r.elevenlabs?.warning)                 issues.push(r.elevenlabs.warning);
  if (!r.chat_api?.status?.startsWith('✅')) issues.push(`Chat: ${r.chat_api?.error||'timeout'}`);

  if ((r.db?.latency_ms||0) > 500) issues.push(`⚠️ DB lente (${r.db.latency_ms}ms) — Neon cold start → peut causer Erreur réseau`);
  r.DIAGNOSTIC = issues.length===0 ? '✅ TOUT OK' : issues;
  r.CAUSE_ERREUR_RESEAU = !r.db?.status?.startsWith('✅')
    ? '→ DB Neon cold-start (première connexion lente ~3s) → saveAsync timeout → erreur retournée'
    : !r.chat_api?.status?.startsWith('✅')
    ? '→ Chat API timeout (probablement DB ou ElevenLabs)'
    : '→ Vérifier ElevenLabs crédits';

  return NextResponse.json(r);
}
