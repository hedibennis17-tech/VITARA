import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  // Test Anthropic API directement
  let anthropicTest: Record<string, unknown> = { status: 'not tested' };
  if (apiKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 50,
          messages: [{ role: 'user', content: 'Dis juste "OK"' }],
        }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (res.ok) {
        anthropicTest = {
          status: '✅ SUCCESS',
          response: (data.content as Array<{text?: string}>)?.[0]?.text,
          model: data.model,
        };
      } else {
        anthropicTest = {
          status: '❌ ERROR',
          httpStatus: res.status,
          error: data,
        };
      }
    } catch (e: unknown) {
      anthropicTest = { status: '❌ FETCH ERROR', error: String(e) };
    }
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      ANTHROPIC_API_KEY: apiKey ? `set (${apiKey.slice(0, 10)}...)` : 'MISSING ❌',
      DATABASE_URL: !!process.env.DATABASE_URL ? 'set ✅' : 'not set (mode démo)',
      NODE_ENV: process.env.NODE_ENV,
    },
    anthropicTest,
  });
}
