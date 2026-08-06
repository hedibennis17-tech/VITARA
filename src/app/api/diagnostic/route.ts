import { NextResponse } from 'next/server';

export async function GET() {
  const groqKey = process.env.GROQ_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  let groqTest: Record<string, unknown> = { status: 'not tested' };
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 20,
          messages: [{ role: 'user', content: 'Say OK only' }],
        }),
      });
      const data = await res.json() as { choices?: Array<{message:{content:string}}>; error?: unknown };
      if (res.ok) {
        groqTest = { status: '✅ SUCCESS', response: data.choices?.[0]?.message?.content, model: 'llama-3.3-70b-versatile' };
      } else {
        groqTest = { status: '❌ ERROR', httpStatus: res.status, error: data };
      }
    } catch (e) { groqTest = { status: '❌ FETCH ERROR', error: String(e) }; }
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      GROQ_API_KEY: groqKey ? `set (${groqKey.slice(0, 12)}...)` : 'MISSING ❌ — Ajoutez-la sur Vercel',
      ANTHROPIC_API_KEY: anthropicKey ? `set (${anthropicKey.slice(0, 10)}...)` : 'not set',
      DATABASE_URL: !!process.env.DATABASE_URL ? 'set ✅' : 'not set (mode démo)',
      NODE_ENV: process.env.NODE_ENV,
    },
    groqTest,
  });
}
