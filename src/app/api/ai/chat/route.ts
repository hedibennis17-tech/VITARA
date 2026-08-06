import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY manquante', code: 'NO_API_KEY' }, { status: 500 });
    }

    const body = await req.json() as { messages: unknown[]; system: string; model?: string; max_tokens?: number };
    const { messages, system, model = 'claude-haiku-4-5-20251001', max_tokens = 600 } = body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens, system, messages }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[AI Chat] Anthropic error:', response.status, JSON.stringify(data));
      return NextResponse.json({
        error: `Anthropic API error ${response.status}`,
        details: data,
        code: 'ANTHROPIC_ERROR'
      }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[AI Chat] Server error:', err);
    return NextResponse.json({ error: String(err), code: 'SERVER_ERROR' }, { status: 500 });
  }
}
