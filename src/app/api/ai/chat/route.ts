import { NextRequest, NextResponse } from 'next/server';
import { retrieveContext, buildSystemPrompt } from '@/lib/knowledge/rag';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY manquante sur Vercel', code: 'NO_API_KEY' }, { status: 500 });
    }

    const body = await req.json() as {
      messages: { role: string; content: string }[];
      system?: string;
      max_tokens?: number;
      language?: string;
    };
    const { messages, max_tokens = 700, language = 'fr' } = body;

    // ── RAG: récupérer le contexte pertinent ──
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const ragResult = retrieveContext(lastUserMsg, messages);
    const detectedLang = ragResult.detectedLang || language;

    // ── Construire le system prompt enrichi ──
    const systemPrompt = buildSystemPrompt(detectedLang, ragResult.context);

    // ── Appel Groq ──
    const messagesWithSystem = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

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
        temperature: 0.6,
        response_format: { type: 'json_object' }, // Force JSON
      }),
    });

    const data = await response.json() as {
      choices?: Array<{ message: { content: string } }>;
      error?: unknown;
    };

    if (!response.ok) {
      console.error('[AI Chat] Groq error:', response.status, JSON.stringify(data));
      return NextResponse.json(
        { error: `Groq error ${response.status}`, details: data, code: 'GROQ_ERROR' },
        { status: response.status }
      );
    }

    const text = data.choices?.[0]?.message?.content || '{"speak":"Je suis là pour vous aider.","intent":"welcome","slots":null,"booking":null}';

    // Compatibilité format Anthropic (pour le patient app)
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
    console.error('[AI Chat]', err);
    return NextResponse.json({ error: String(err), code: 'SERVER_ERROR' }, { status: 500 });
  }
}
