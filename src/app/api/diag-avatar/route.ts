import { NextResponse } from 'next/server';

export async function GET() {
  const r: Record<string, any> = { ts: new Date().toISOString() };

  // Construire la base URL
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  // 1. Vérifier les images agents via HTTP (seule méthode fiable sur Vercel)
  const agents = [
    { id:'houda', ext:'png' }, { id:'said', ext:'png' },
    { id:'hayet', ext:'jpg' }, { id:'alain', ext:'png' },
  ];
  r.agent_images = {};
  for (const a of agents) {
    const url = `${base}/agents/${a.id}.${a.ext}`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      const size = parseInt(res.headers.get('content-length') || '0');
      r.agent_images[a.id] = {
        url, status: res.status,
        ok: res.ok ? '✅ Accessible' : `❌ HTTP ${res.status}`,
        size_kb: Math.round(size / 1024),
        content_type: res.headers.get('content-type'),
      };
    } catch (e: any) {
      r.agent_images[a.id] = { url, error: e.message, ok: '❌ Inaccessible' };
    }
  }

  // 2. Variables d'environnement
  r.env = {
    GROQ_API_KEY:       process.env.GROQ_API_KEY       ? '✅' : '❌',
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY  ? '✅' : '❌',
    JWT_SECRET:         process.env.JWT_SECRET           ? '✅' : '❌',
    DATABASE_URL:       process.env.DATABASE_URL         ? '✅' : '❌',
    VERCEL_URL:         process.env.VERCEL_URL           || 'non défini',
    NODE_ENV:           process.env.NODE_ENV,
  };

  // 3. ElevenLabs — tester avec la vraie clé
  const elKey = process.env.ELEVENLABS_API_KEY;
  if (elKey) {
    try {
      const res = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: { 'xi-api-key': elKey },
      });
      const d = await res.json() as any;
      r.elevenlabs = {
        status: res.status,
        ok: res.ok ? '✅ API valide' : '❌ Clé invalide',
        tier: d.subscription?.tier || 'inconnu',
        chars_used: d.subscription?.character_count,
        chars_limit: d.subscription?.character_limit,
        chars_remaining: d.subscription?.character_limit - d.subscription?.character_count,
        warning: (d.subscription?.character_limit - d.subscription?.character_count) < 1000
          ? '⚠️ CRÉDITS QUASI ÉPUISÉS'
          : undefined,
      };
    } catch (e: any) {
      r.elevenlabs = { error: e.message, status: '❌' };
    }
  } else {
    r.elevenlabs = '❌ Clé manquante';
  }

  // 4. Groq
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const t = Date.now();
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${groqKey}` },
        body: JSON.stringify({ model:'llama-3.1-8b-instant', max_tokens:5, messages:[{role:'user',content:'OK'}] }),
      });
      r.groq = { status: res.status, ok: res.ok ? '✅' : '❌', latency_ms: Date.now()-t };
    } catch (e: any) { r.groq = { error: e.message }; }
  }

  // RÉSUMÉ
  const issues: string[] = [];
  for (const [id, info] of Object.entries(r.agent_images) as any) {
    if (!info.ok?.startsWith('✅')) issues.push(`❌ Image ${id} inaccessible sur Vercel → vider cache Git LFS ?`);
  }
  if (r.elevenlabs?.status === 401) issues.push('❌ ElevenLabs: clé API invalide → régénérer sur elevenlabs.io');
  if (r.elevenlabs?.status === 402 || r.tts_test?.status === 402)
    issues.push('❌ ElevenLabs: plan gratuit épuisé → upgrader sur elevenlabs.io/subscription');
  if (r.elevenlabs?.warning) issues.push(r.elevenlabs.warning);

  r.DIAGNOSTIC = issues.length === 0 ? '✅ TOUT OK' : issues;
  r.FIX_CACHE = 'Sur Android Chrome: appui long sur ↺ → "Vider cache et recharger"';

  return NextResponse.json(r);
}
