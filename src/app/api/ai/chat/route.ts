import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY manquante sur Vercel', code: 'NO_API_KEY' }, { status: 500 });
    }

    const body = await req.json() as { messages: {role:string;content:string}[]; system?: string; max_tokens?: number };
    const { messages, system, max_tokens = 600 } = body;

    // Groq utilise le format OpenAI — system = premier message
    const messagesWithSystem = system
      ? [{ role: 'system', content: system }, ...messages]
      : messages;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens,
        messages: messagesWithSystem,
        temperature: 0.7,
      }),
    });

    const data = await response.json() as { choices?: Array<{message:{content:string}}>; error?: unknown };

    if (!response.ok) {
      console.error('[AI Chat] Groq error:', response.status, JSON.stringify(data));
      return NextResponse.json({ error: `Groq error ${response.status}`, details: data, code: 'GROQ_ERROR' }, { status: response.status });
    }

    // Convertir la réponse Groq → format Anthropic (pour compatibilité patient app)
    const text = data.choices?.[0]?.message?.content || '';
    return NextResponse.json({
      content: [{ type: 'text', text }],
      model: 'llama-3.3-70b-versatile',
    });

  } catch (err) {
    console.error('[AI Chat]', err);
    return NextResponse.json({ error: String(err), code: 'SERVER_ERROR' }, { status: 500 });
  }
}
