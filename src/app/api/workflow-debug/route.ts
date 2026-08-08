import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/knowledge/rag';
import { INITIAL_STATE } from '@/lib/conversation/state';

export const maxDuration = 60;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function groqCall(apiKey: string, sys: string, messages: any[], maxT = 200) {
  const t = Date.now();
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant', max_tokens: maxT, temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: sys }, ...messages],
    }),
  });
  const d = await res.json() as any;
  if (res.status === 429) {
    const w = d.error?.message?.match(/in (\d+\.?\d*)s/)?.[1];
    if (w && parseFloat(w) < 15) { await sleep(parseFloat(w)*1000+500); return groqCall(apiKey, sys, messages, maxT); }
  }
  const raw = d.choices?.[0]?.message?.content || '{}';
  let parsed: any; try { parsed = JSON.parse(raw); } catch { parsed = { _raw: raw.slice(0, 200) }; }
  return { status: res.status, ok: res.ok, ms: Date.now()-t, tokens: d.usage?.total_tokens, parsed, error: res.ok ? null : (d.error?.message||'').slice(0,150) };
}

export async function GET(_req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  const r: any = {
    timestamp: new Date().toISOString(),
    env: { GROQ_API_KEY: apiKey ? `✅ (${apiKey.slice(0,8)}...)` : '❌ MANQUANTE', NODE_ENV: process.env.NODE_ENV },
  };
  if (!apiKey) return NextResponse.json(r, { status: 500 });

  const sys = buildSystemPrompt('fr', '', 'houda', 'female', INITIAL_STATE);
  r.system_prompt = {
    chars: sys.length, tokens_approx: Math.round(sys.length/4),
    first_800_chars: sys.slice(0, 800),
    has_CONFIRMED: sys.includes('CONFIRMED'),
    has_SKIPPED: sys.includes('SKIPPED'),
    has_state_section: sys.includes('ÉTAT SESSION'),
    has_workflow_order: sys.includes('full_name') && sys.includes('date_of_birth'),
    has_multi_entity: sys.includes('multi') || sys.includes('MULTI') || sys.includes('plusieurs'),
  };

  await sleep(2000);
  r.t1_patient_status = await groqCall(apiKey, sys, [{ role:'user', content:"j'ai un dossier chez vous" }]);
  r.t1_patient_status.expected = 'Demander le nom (patient_status=EXISTING_PATIENT confirmé, NE PAS dire Bonjour)';
  r.t1_patient_status.pass = !r.t1_patient_status.parsed?.speak?.toLowerCase().startsWith('bonjour') && !r.t1_patient_status.error;

  await sleep(2500);
  const sys2 = buildSystemPrompt('fr', '', 'houda', 'female', { ...INITIAL_STATE, patient_status: 'EXISTING_PATIENT' } as any);
  r.t2_name_no_ramq = await groqCall(apiKey, sys2, [
    { role:'user', content:"j'ai un dossier chez vous" },
    { role:'assistant', content:'{"speak":"Quel est votre nom ?","intent":"identify","state":{"patient_status":"EXISTING_PATIENT"},"slots":null,"booking":null}' },
    { role:'user', content:'Marie Leclerc' },
  ]);
  r.t2_name_no_ramq.expected = 'Demander DDN (PAS RAMQ tout de suite)';
  const speak2 = r.t2_name_no_ramq.parsed?.speak?.toLowerCase()||'';
  r.t2_name_no_ramq.pass = !speak2.includes('ramq') && !speak2.includes('assurance maladie') && !r.t2_name_no_ramq.error;

  await sleep(2500);
  r.t3_multi_entity = await groqCall(apiKey, sys, [
    { role:'user', content:'Je suis Marie Leclerc, 438-833-4319, je veux de la physio pour mon genou gauche' },
  ]);
  r.t3_multi_entity.expected = 'Extraire full_name + phone + service + body_part en 1 message';
  const s3 = r.t3_multi_entity.parsed?.state||{};
  r.t3_multi_entity.pass = (s3.full_name?.value||s3.phone?.value||s3.service?.value) !== undefined;

  await sleep(2500);
  r.t4_cnesst_skip = await groqCall(apiKey, sys, [
    { role:'user', content:"accident de travail hier, j'ai pas de numéro CNESST pour l'instant" },
  ]);
  r.t4_cnesst_skip.expected = "cnesst_claim_number: SKIPPED → continuer sans redemander";
  const s4 = r.t4_cnesst_skip.parsed?.state||{};
  r.t4_cnesst_skip.pass = s4.cnesst_claim_number?.status === 'SKIPPED' || !r.t4_cnesst_skip.parsed?.speak?.toLowerCase().includes('numéro cnesst');

  await sleep(2500);
  r.t5_named_doctor = await groqCall(apiKey, sys, [
    { role:'user', content:'Je veux un rendez-vous avec le docteur Odette Préfontaine' },
  ]);
  r.t5_named_doctor.expected = 'requested_practitioner: Dr. Odette Préfontaine [CONFIRMED]';
  const spk5 = (r.t5_named_doctor.parsed?.speak||'').toLowerCase();
  const st5  = r.t5_named_doctor.parsed?.state||{};
  r.t5_named_doctor.pass = spk5.includes('préfontaine') || spk5.includes('prefontaine') || st5.requested_practitioner?.value;

  const tests = [r.t1_patient_status, r.t2_name_no_ramq, r.t3_multi_entity, r.t4_cnesst_skip, r.t5_named_doctor];
  const passed = tests.filter(t=>t?.pass).length;
  r.summary = {
    status: passed===tests.length ? '✅ WORKFLOW OK' : `❌ ${tests.length-passed} test(s) échoué(s)`,
    score: `${passed}/${tests.length}`,
    t1_patient_status: r.t1_patient_status?.pass ? '✅' : `❌ "${(r.t1_patient_status?.parsed?.speak||r.t1_patient_status?.error||'').slice(0,80)}"`,
    t2_name_no_ramq:   r.t2_name_no_ramq?.pass   ? '✅' : `❌ "${(r.t2_name_no_ramq?.parsed?.speak||r.t2_name_no_ramq?.error||'').slice(0,80)}"`,
    t3_multi_entity:   r.t3_multi_entity?.pass    ? '✅' : `❌ "${(r.t3_multi_entity?.parsed?.speak||r.t3_multi_entity?.error||'').slice(0,80)}"`,
    t4_cnesst_skip:    r.t4_cnesst_skip?.pass     ? '✅' : `❌ "${(r.t4_cnesst_skip?.parsed?.speak||r.t4_cnesst_skip?.error||'').slice(0,80)}"`,
    t5_named_doctor:   r.t5_named_doctor?.pass    ? '✅' : `❌ "${(r.t5_named_doctor?.parsed?.speak||r.t5_named_doctor?.error||'').slice(0,80)}"`,
    avg_latency_ms: Math.round(tests.reduce((a,t)=>a+(t?.ms||0),0)/tests.length),
    avg_tokens: Math.round(tests.reduce((a,t)=>a+(t?.tokens||0),0)/tests.length),
  };
  return NextResponse.json(r);
}
