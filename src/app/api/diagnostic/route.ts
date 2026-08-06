import { NextResponse } from 'next/server';
import { SCENARIOS } from '@/lib/knowledge/scenarios';
import { retrieveContext } from '@/lib/knowledge/rag';

export async function GET() {
  const groqKey = process.env.GROQ_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Test Groq
  let groqTest: Record<string, unknown> = { status: 'not tested' };
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 30,
          messages: [{ role: 'user', content: 'Say OK only' }],
        }),
      });
      const data = await res.json() as { choices?: Array<{ message: { content: string } }>; error?: unknown };
      if (res.ok) {
        groqTest = { status: '✅ SUCCESS', response: data.choices?.[0]?.message?.content };
      } else {
        groqTest = { status: '❌ ERROR', httpStatus: res.status, error: data };
      }
    } catch (e) { groqTest = { status: '❌ FETCH ERROR', error: String(e) }; }
  }

  // Test RAG
  const ragTest = retrieveContext('Je veux prendre un rendez-vous de physiothérapie pour un genou', []);

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      GROQ_API_KEY: groqKey ? `set (${groqKey.slice(0, 12)}...)` : 'MISSING ❌',
      ANTHROPIC_API_KEY: anthropicKey ? `set (${anthropicKey.slice(0, 10)}...)` : 'not set',
      DATABASE_URL: !!process.env.DATABASE_URL ? 'set ✅' : 'not set (mode démo)',
      NODE_ENV: process.env.NODE_ENV,
    },
    groqTest,
    knowledgeBase: {
      totalScenarios: SCENARIOS.length,
      departments: [...new Set(SCENARIOS.map(s => s.dept).filter(Boolean))],
      languages: ['fr', 'en', 'ar'],
    },
    ragTest: {
      query: 'Je veux prendre un rendez-vous de physiothérapie pour un genou',
      scenariosMatched: ragTest.scenarios.map(s => ({ id: s.id, title: s.title })),
      detectedDept: ragTest.detectedDept,
      detectedLang: ragTest.detectedLang,
    }
  });
}
