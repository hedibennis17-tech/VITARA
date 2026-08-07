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
    const { messages, language = 'fr', max_tokens = 600 } = body;

    // ── Garde-fou: max 10 messages dans l'historique ──────────
    // Évite de dépasser les limites de tokens Groq après plusieurs tours
    const trimmedMessages = messages.slice(-10);

    // ── S'assurer que le premier message est toujours 'user' ──
    // Groq rejette si messages[0].role === 'assistant'
    const safeMessages = trimmedMessages.filter((_, i) => {
      if (i === 0) return trimmedMessages[0].role === 'user';
      return true;
    });
    // Si après filtrage le premier n'est pas user, on le force
    const finalMessages = safeMessages.length > 0 && safeMessages[0].role !== 'user'
      ? safeMessages.slice(1)
      : safeMessages;

    // ── RAG context ───────────────────────────────────────────
    const lastUserMsg = [...finalMessages].reverse().find(m => m.role === 'user')?.content || '';
    const ragResult   = retrieveContext(lastUserMsg, finalMessages);
    const detectedLang = ragResult.detectedLang || language;
    const systemPrompt = buildSystemPrompt(detectedLang, ragResult.context);

    // ── Appel Groq ────────────────────────────────────────────
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
          ...finalMessages,
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json() as {
      choices?: Array<{ message: { content: string } }>;
      error?: { message?: string; type?: string };
      usage?: { total_tokens: number };
    };

    if (!response.ok) {
      const errMsg = (data.error as any)?.message || `Groq error ${response.status}`;
      console.error('[VITARA AI]', response.status, errMsg);
      // Retourner un JSON valide même en cas d'erreur Groq
      const fallback = language === 'ar'
        ? '{"speak":"عذراً، حدث خطأ. أعد المحاولة.","intent":"error","slots":null,"booking":null}'
        : language === 'en'
        ? '{"speak":"Sorry, a temporary error occurred. Please try again.","intent":"error","slots":null,"booking":null}'
        : '{"speak":"Désolé, une erreur temporaire est survenue. Veuillez réessayer.","intent":"error","slots":null,"booking":null}';
      return NextResponse.json({
        content: [{ type: 'text', text: fallback }],
        model: 'llama-3.3-70b-versatile',
        groq_error: errMsg,
        rag: { scenariosMatched: [], detectedDept: ragResult.detectedDept }
      });
    }

    const text = data.choices?.[0]?.message?.content
      || '{"speak":"Je suis là pour vous aider.","intent":"welcome","slots":null,"booking":null}';

    return NextResponse.json({
      content: [{ type: 'text', text }],
      model: 'llama-3.3-70b-versatile',
      usage: data.usage,
      rag: {
        scenariosMatched: ragResult.scenarios.map(s => s.id),
        detectedDept: ragResult.detectedDept,
        detectedLang: ragResult.detectedLang,
      }
    });

  } catch (err) {
    console.error('[VITARA AI]', err);
    const fallback = '{"speak":"Erreur réseau. Veuillez réessayer.","intent":"error","slots":null,"booking":null}';
    return NextResponse.json({
      content: [{ type: 'text', text: fallback }],
      code: 'SERVER_ERROR',
      error: String(err)
    });
  }
}
