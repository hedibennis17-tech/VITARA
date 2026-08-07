// ─── ENDPOINT DIAGNOSTIC VITARA ─────────────────────────────
// GET /api/debug  → rapport complet: Groq, workflow, messages
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      GROQ_API_KEY: apiKey ? `✅ présente (${apiKey.slice(0,8)}...)` : '❌ MANQUANTE',
      DATABASE_URL: process.env.DATABASE_URL ? '✅ présente' : '⚠️ absente (mode démo)',
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  if (!apiKey) {
    return NextResponse.json({ ...results, error: 'GROQ_API_KEY manquante — impossible de tester' }, { status: 500 });
  }

  // ── Test 1: ping Groq avec messages correctement formatés ──
  try {
    const t1 = Date.now();
    const res1 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 30,
        // ✓ Premier message = user (pas assistant)
        messages: [{ role: 'user', content: 'Réponds juste: OK' }],
        response_format: { type: 'json_object' },
      }),
    });
    const d1 = await res1.json() as any;
    results.test1_groq_ping = {
      status: res1.status,
      ok: res1.ok,
      latency_ms: Date.now() - t1,
      response: res1.ok ? d1.choices?.[0]?.message?.content : null,
      error: res1.ok ? null : d1,
    };
  } catch (e: any) {
    results.test1_groq_ping = { status: 'FETCH_ERROR', error: e.message };
  }

  // ── Test 2: workflow réel — comme le patient app ──────────
  try {
    const t2 = Date.now();
    // Simule exactement ce que patient/page.tsx envoie après le fix
    // hist[] est vide au départ → premier msg = user ✓
    const messages = [
      { role: 'user', content: 'Bonjour je voudrais prendre un rendez-vous' }
    ];
    const res2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 200,
        messages: [
          { role: 'system', content: 'Tu es VITARA. Réponds UNIQUEMENT en JSON: {"speak":"message","intent":"identify","slots":null,"booking":null}' },
          ...messages,
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    });
    const d2 = await res2.json() as any;
    const raw = d2.choices?.[0]?.message?.content || '{}';
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch { parsed = { parse_error: raw }; }
    results.test2_workflow_first_msg = {
      status: res2.status,
      ok: res2.ok,
      latency_ms: Date.now() - t2,
      messages_sent: messages.map(m => ({ role: m.role, preview: m.content.slice(0, 40) })),
      raw_response: raw.slice(0, 200),
      parsed,
      error: res2.ok ? null : d2,
    };
  } catch (e: any) {
    results.test2_workflow_first_msg = { status: 'FETCH_ERROR', error: e.message };
  }

  // ── Test 3: deuxième message (conversation continue) ──────
  try {
    const t3 = Date.now();
    const messages = [
      { role: 'user',      content: 'Je voudrais prendre un rendez-vous en physiothérapie' },
      { role: 'assistant', content: '{"speak":"Êtes-vous nouveau patient ?","intent":"identify","slots":null,"booking":null}' },
      { role: 'user',      content: 'Oui je suis nouveau patient, je m\'appelle Jean Tremblay' },
    ];
    const res3 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 200,
        messages: [
          { role: 'system', content: 'Tu es VITARA. JSON uniquement: {"speak":"msg","intent":"intake","slots":null,"booking":null}' },
          ...messages,
        ],
        response_format: { type: 'json_object' },
      }),
    });
    const d3 = await res3.json() as any;
    const raw3 = d3.choices?.[0]?.message?.content || '{}';
    let parsed3 = null;
    try { parsed3 = JSON.parse(raw3); } catch { parsed3 = { parse_error: raw3 }; }
    results.test3_workflow_turn2 = {
      status: res3.status,
      ok: res3.ok,
      latency_ms: Date.now() - t3,
      turns: messages.length,
      parsed: parsed3,
      error: res3.ok ? null : d3,
    };
  } catch (e: any) {
    results.test3_workflow_turn2 = { status: 'FETCH_ERROR', error: e.message };
  }

  // ── Test 4: vérifier l'endpoint /api/ai/chat (proxy interne) ──
  try {
    const t4 = Date.now();
    const base = req.nextUrl.origin;
    const res4 = await fetch(`${base}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Test diagnostic' }],
        language: 'fr',
        max_tokens: 100,
      }),
    });
    const d4 = await res4.json() as any;
    results.test4_internal_chat_api = {
      status: res4.status,
      ok: res4.ok,
      latency_ms: Date.now() - t4,
      rag_matched: d4.rag?.scenariosMatched,
      has_content: !!d4.content?.[0]?.text,
      error: res4.ok ? null : d4.error,
    };
  } catch (e: any) {
    results.test4_internal_chat_api = { status: 'FETCH_ERROR', error: e.message };
  }

  // ── Résumé ────────────────────────────────────────────────
  const allOk = [
    results.test1_groq_ping?.ok,
    results.test2_workflow_first_msg?.ok,
    results.test3_workflow_turn2?.ok,
    results.test4_internal_chat_api?.ok,
  ].every(Boolean);

  results.summary = {
    status: allOk ? '✅ TOUT OK — workflow opérationnel' : '❌ DES ERREURS DÉTECTÉES — voir tests ci-dessus',
    groq_reachable: results.test1_groq_ping?.ok,
    first_message_ok: results.test2_workflow_first_msg?.ok,
    multi_turn_ok: results.test3_workflow_turn2?.ok,
    internal_api_ok: results.test4_internal_chat_api?.ok,
  };

  return NextResponse.json(results, { status: allOk ? 200 : 207 });
}
