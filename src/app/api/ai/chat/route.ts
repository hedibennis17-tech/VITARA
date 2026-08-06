import { NextRequest, NextResponse } from 'next/server';
import { retrieveContext, buildSystemPrompt } from '@/lib/knowledge/rag';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY manquante sur Vercel', code: 'NO_API_KEY' }, { status: 500 });
    }

    const body = await req.json() as {
      messages: { role: string; content: string }[];
      language?: string;
      max_tokens?: number;
    };
    const { messages, language = 'fr', max_tokens = 800 } = body;

    // RAG: récupérer contexte pertinent
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const ragResult = retrieveContext(lastUserMsg, messages);
    const detectedLang = ragResult.detectedLang || language;

    // System prompt enrichi avec workflow + contexte
    const systemPrompt = buildSystemPrompt(detectedLang, ragResult.context);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json() as {
      choices?: Array<{ message: { content: string } }>;
      error?: unknown;
    };

    if (!response.ok) {
      console.error('[VITARA AI]', response.status, JSON.stringify(data));
      return NextResponse.json({
        error: `Groq error ${response.status}`,
        details: data,
        code: 'GROQ_ERROR'
      }, { status: response.status });
    }

    const text = data.choices?.[0]?.message?.content
      || '{"speak":"Je suis là pour vous aider.","intent":"welcome","slots":null,"booking":null,"intake":null}';

    return NextResponse.json({
      content: [{ type: 'text', text }],
      model: 'llama-3.3-70b-versatile',
      rag: {
        scenariosMatched: ragResult.scenarios.map(s => s.id),
        detectedDept: ragResult.detectedDept,
        detectedLang: ragResult.detectedLang,
      }
    });

  } catch (err) {
    console.error('[VITARA AI]', err);
    return NextResponse.json({ error: String(err), code: 'SERVER_ERROR' }, { status: 500 });
  }
}
