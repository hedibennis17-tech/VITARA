// ─── ENDPOINT DIAGNOSTIC VITARA ─────────────────────────────
import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt, retrieveContext } from '@/lib/knowledge/rag';

export const maxDuration = 30;

const MODEL = 'llama-3.1-8b-instant'; // 500K tokens/jour vs 100K pour le 70b

async function groqCall(apiKey: string, messages: any[], system: string, maxTokens = 100) {
  const t = Date.now();
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    }),
  });
  const d = await res.json() as any;
  const raw = d.choices?.[0]?.message?.content || '{}';
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch { parsed = { parse_error: raw.slice(0, 100) }; }
  return {
    status: res.status,
    ok: res.ok,
    latency_ms: Date.now() - t,
    messages_sent: messages.map(m => ({ role: m.role, chars: m.content.length })),
    parsed,
    error: res.ok ? null : (d.error?.message || d),
  };
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      GROQ_API_KEY: apiKey ? `✅ (${apiKey.slice(0, 8)}...)` : '❌ MANQUANTE',
      DATABASE_URL: process.env.DATABASE_URL ? '✅' : '⚠️ absent (mode démo)',
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  results.model_used = MODEL;
  results.model_quota = '500 000 tokens/jour (5× plus que llama-70b)';

  // System prompt réel utilisé par VITARA
  const ctx = retrieveContext('physiothérapie genou rendez-vous', []);
  const sys = buildSystemPrompt('fr', ctx.context);
  results.system_prompt_chars = sys.length;
  results.rag_scenarios = ctx.scenarios.map(s => s.id);

  // ── Test 1: Premier message (premier appel après greeting) ──
  try {
    results.test1_first_message = await groqCall(apiKey,
      [{ role: 'user', content: 'Bonjour je voudrais prendre un rendez-vous en physiothérapie pour mon genou' }],
      sys, 200
    );
  } catch (e: any) { results.test1_first_message = { error: e.message }; }

  // ── Test 2: Tour 2 (après réponse IA) ───────────────────────
  try {
    results.test2_turn2 = await groqCall(apiKey, [
      { role: 'user',      content: 'Physiothérapie pour mon genou gauche' },
      { role: 'assistant', content: '{"speak":"Êtes-vous un nouveau patient?","intent":"identify","slots":null,"booking":null}' },
      { role: 'user',      content: 'Oui nouveau patient, je suis Marie Leclerc' },
    ], sys, 200);
  } catch (e: any) { results.test2_turn2 = { error: e.message }; }

  // ── Test 3: Tour 4-5 (là où ça plantait) ────────────────────
  try {
    results.test3_turn4 = await groqCall(apiKey, [
      { role: 'user',      content: 'Physio genou' },
      { role: 'assistant', content: '{"speak":"Nouveau patient?","intent":"identify","slots":null,"booking":null}' },
      { role: 'user',      content: 'Oui, Marie Leclerc, 514-555-0100' },
      { role: 'assistant', content: '{"speak":"Votre date de naissance?","intent":"intake","slots":null,"booking":null}' },
      { role: 'user',      content: '12 mars 1985' },
      { role: 'assistant', content: '{"speak":"Votre courriel?","intent":"intake","slots":null,"booking":null}' },
      { role: 'user',      content: 'marie@email.com, RAMQ: LECM85031298' },
      { role: 'assistant', content: '{"speak":"Zone touchée?","intent":"diagnostic","slots":null,"booking":null}' },
      { role: 'user',      content: 'Genou gauche, douleur 7/10 depuis 2 semaines, pas d\'accident' },
    ], sys, 300);
  } catch (e: any) { results.test3_turn4 = { error: e.message }; }

  // ── Test 4: Tokens utilisés / risque dépassement ─────────────
  results.test4_token_analysis = {
    system_prompt_chars: sys.length,
    system_prompt_tokens_approx: Math.round(sys.length / 4),
    max_history_sent: 10,
    note: sys.length > 8000 ? '⚠️ System prompt très long — risque de dépasser context window' : '✅ Taille OK',
  };

  const allOk = [
    results.test1_first_message?.ok,
    results.test2_turn2?.ok,
    results.test3_turn4?.ok,
  ].every(Boolean);

  results.summary = {
    status: allOk ? '✅ WORKFLOW OK — les 4 premiers tours fonctionnent' : '❌ ERREUR DÉTECTÉE',
    test1_premier_msg: results.test1_first_message?.ok ? '✅' : `❌ ${results.test1_first_message?.error}`,
    test2_tour2:       results.test2_turn2?.ok       ? '✅' : `❌ ${results.test2_turn2?.error}`,
    test3_tour4_5:     results.test3_turn4?.ok       ? '✅' : `❌ ${results.test3_turn4?.error}`,
    latences: {
      tour1_ms: results.test1_first_message?.latency_ms,
      tour2_ms: results.test2_turn2?.latency_ms,
      tour4_ms: results.test3_turn4?.latency_ms,
    }
  };

  return NextResponse.json(results, { status: 200 });
}
