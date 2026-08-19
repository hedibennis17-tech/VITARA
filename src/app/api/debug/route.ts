// ─── DIAGNOSTIC VITARA ──────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt, retrieveContext } from '@/lib/knowledge/rag';

export const maxDuration = 60; // 60s pour les 3 tests séquentiels

const MODEL = 'llama-3.3-70b-versatile';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function groqCall(apiKey: string, messages: any[], system: string, label: string) {
  const t = Date.now();
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 150,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  });
  const d = await res.json() as any;

  // Retry auto si TPM 429 avec attente courte
  if (res.status === 429 && d.error?.message?.includes('per minute')) {
    const secMatch = d.error.message.match(/in (\d+\.?\d*)s/);
    const waitMs   = secMatch ? parseFloat(secMatch[1]) * 1000 + 500 : 5500;
    console.log(`[DEBUG] TPM 429 sur ${label} — attente ${waitMs}ms`);
    await sleep(waitMs);
    const res2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: MODEL, max_tokens: 150, messages: [{ role:'system', content:system }, ...messages], temperature: 0.4, response_format: { type:'json_object' } }),
    });
    const d2 = await res2.json() as any;
    const raw2 = d2.choices?.[0]?.message?.content || '{}';
    let parsed2: any; try { parsed2 = JSON.parse(raw2); } catch { parsed2 = { raw: raw2.slice(0,80) }; }
    return { status: res2.status, ok: res2.ok, latency_ms: Date.now()-t, retried: true, parsed: parsed2, error: res2.ok ? null : d2.error?.message?.slice(0,100) };
  }

  const raw = d.choices?.[0]?.message?.content || '{}';
  let parsed: any; try { parsed = JSON.parse(raw); } catch { parsed = { raw: raw.slice(0,80) }; }
  return {
    status: res.status, ok: res.ok, latency_ms: Date.now()-t, retried: false,
    parsed, error: res.ok ? null : d.error?.message?.slice(0,120),
    tokens: d.usage?.total_tokens,
  };
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  const result: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      GROQ_API_KEY: apiKey ? `✅ (${apiKey.slice(0,8)}...)` : '❌ MANQUANTE',
      NODE_ENV: process.env.NODE_ENV,
    },
    model: MODEL,
    note: 'Tests séquentiels avec 2s de délai entre chaque appel',
  };

  if (!apiKey) return NextResponse.json({ ...result, error: 'Clé manquante' }, { status: 500 });

  const rag = retrieveContext('physiothérapie genou rendez-vous', []);
  const sys = buildSystemPrompt('fr', rag.context);
  result.system_prompt_tokens_approx = Math.round(sys.length / 4);

  // ── TEST 1: premier message ────────────────────────────────
  result.test1 = await groqCall(apiKey,
    [{ role:'user', content:'Bonjour je veux un rendez-vous de physiothérapie pour mon genou' }],
    sys, 'test1'
  );
  result.test1.label = 'Premier message (messages[0].role=user ✓)';
  await sleep(2000); // 2s entre chaque test

  // ── TEST 2: tour 2 ────────────────────────────────────────
  result.test2 = await groqCall(apiKey, [
    { role:'user',      content:'Physio genou' },
    { role:'assistant', content:'{"speak":"Êtes-vous nouveau patient?","intent":"identify","slots":null,"booking":null}' },
    { role:'user',      content:'Oui nouveau, Marie Leclerc' },
  ], sys, 'test2');
  result.test2.label = 'Tour 2 — conversation continue';
  await sleep(2000);

  // ── TEST 3: tour 4-5 (là où ça plantait avant) ───────────
  result.test3 = await groqCall(apiKey, [
    { role:'user',      content:'Physio genou'},
    { role:'assistant', content:'{"speak":"Nouveau?","intent":"identify","slots":null,"booking":null}'},
    { role:'user',      content:'Oui, Marie Leclerc, 514-555-0142'},
    { role:'assistant', content:'{"speak":"Date de naissance?","intent":"intake","slots":null,"booking":null}'},
    { role:'user',      content:'12/03/1985, RAMQ LECM85031298'},
    { role:'assistant', content:'{"speak":"Zone touchée?","intent":"diagnostic","slots":null,"booking":null}'},
    { role:'user',      content:'Genou gauche, douleur 7/10, accident CNESST'},
  ], sys, 'test3');
  result.test3.label = 'Tour 4-5 — là où ça crashait avant';

  // ── RÉSUMÉ ────────────────────────────────────────────────
  const allOk = result.test1?.ok && result.test2?.ok && result.test3?.ok;
  result.summary = {
    status: allOk ? '✅ WORKFLOW 100% OPÉRATIONNEL' : '❌ ERREURS DÉTECTÉES',
    test1: result.test1?.ok ? `✅ ${result.test1.latency_ms}ms` : `❌ ${result.test1?.error?.slice(0,60)}`,
    test2: result.test2?.ok ? `✅ ${result.test2.latency_ms}ms` : `❌ ${result.test2?.error?.slice(0,60)}`,
    test3: result.test3?.ok ? `✅ ${result.test3.latency_ms}ms` : `❌ ${result.test3?.error?.slice(0,60)}`,
    tokens_per_call: result.test1?.tokens || '~N/A',
    system_prompt_tokens: result.system_prompt_tokens_approx,
  };

  return NextResponse.json(result, { status: 200 });
}
