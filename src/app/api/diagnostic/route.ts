import { NextResponse } from 'next/server';
import { SCENARIOS } from '@/lib/knowledge/scenarios';
import { GMF_DOCTORS, PHYSIO } from '@/lib/knowledge/doctors';
import { SERVICES } from '@/lib/knowledge/services';
import { retrieveContext } from '@/lib/knowledge/rag';

export async function GET() {
  const groqKey = process.env.GROQ_API_KEY;
  let groqTest: Record<string, unknown> = { status: 'not tested' };

  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 30,
          messages: [{ role: 'user', content: 'Say OK' }],
        }),
      });
      const data = await res.json() as { choices?: Array<{ message: { content: string } }>; error?: unknown };
      groqTest = res.ok
        ? { status: '✅ SUCCESS', response: data.choices?.[0]?.message?.content }
        : { status: '❌ ERROR', httpStatus: res.status, error: data };
    } catch (e) { groqTest = { status: '❌ FETCH ERROR', error: String(e) }; }
  }

  const ragTest = retrieveContext('Je veux voir un physiothérapeute pour mon genou, accident CNESST', []);

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      GROQ_API_KEY: groqKey ? `✅ set (${groqKey.slice(0, 12)}...)` : '❌ MISSING — Ajoutez sur Vercel',
      DATABASE_URL: !!process.env.DATABASE_URL ? '✅ set' : '⚠️ not set (mode démo)',
      NODE_ENV: process.env.NODE_ENV,
    },
    groqTest,
    knowledgeBase: {
      scenarios: SCENARIOS.length,
      gmfDoctors: GMF_DOCTORS.length,
      physiotherapists: PHYSIO.length,
      services: SERVICES.length,
      departments: SERVICES.map(s => s.id),
    },
    ragTest: {
      query: 'Physio + CNESST genou',
      scenariosMatched: ragTest.scenarios.map(s => `[${s.id}] ${s.title}`),
      detectedDept: ragTest.detectedDept,
      detectedLang: ragTest.detectedLang,
    },
    workflow: '10 étapes: accueil → identification → identité → assurance → service → diagnostic → payeur → professionnel → créneaux → confirmation',
  });
}
