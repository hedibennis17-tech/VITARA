import { NextRequest, NextResponse } from 'next/server';
import { retrieveContext, buildSystemPrompt } from '@/lib/knowledge/rag';

export const maxDuration = 30;

// ── Modèles Groq disponibles et leurs limites ─────────────────
// llama-3.3-70b-versatile : 100 000 tokens/jour  ← trop peu pour prod
// llama-3.1-8b-instant    : 500 000 tokens/jour  ← 5× plus de quota
// gemma2-9b-it            : 250 000 tokens/jour
const MODEL_PRIMARY  = 'llama-3.1-8b-instant';   // quota 500K/jour
const MODEL_FALLBACK = 'llama-3.3-70b-versatile'; // fallback si 8b fail

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

    // ── Garde-fou: max 10 messages ────────────────────────────
    const trimmed = messages.slice(-10);
    const safeMessages = trimmed[0]?.role !== 'user' ? trimmed.slice(1) : trimmed;

    // ── RAG ──────────────────────────────────────────────────
    const lastUserMsg  = [...safeMessages].reverse().find(m => m.role === 'user')?.content || '';
    const ragResult    = retrieveContext(lastUserMsg, safeMessages);
    const detectedLang = ragResult.detectedLang || language;
    const systemPrompt = buildSystemPrompt(detectedLang, ragResult.context);

    // ── Appel Groq (avec fallback automatique) ────────────────
    async function callGroq(model: string) {
      return fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          max_tokens,
          messages: [{ role: 'system', content: systemPrompt }, ...safeMessages],
          temperature: 0.5,
          response_format: { type: 'json_object' },
        }),
      });
    }

    let response = await callGroq(MODEL_PRIMARY);

    // Si 429 (rate limit) sur le modèle principal → essayer le fallback
    if (response.status === 429) {
      console.warn('[VITARA AI] Rate limit sur', MODEL_PRIMARY, '→ fallback sur', MODEL_FALLBACK);
      response = await callGroq(MODEL_FALLBACK);
    }

    const data = await response.json() as {
      choices?: Array<{ message: { content: string } }>;
      error?:   { message?: string; type?: string };
      usage?:   { total_tokens: number };
    };

    // ── Si encore 429 après fallback → message clair ──────────
    if (response.status === 429) {
      const retryAfter = (data.error as any)?.message?.match(/(\d+)m/)?.[1];
      const fallback = language === 'ar'
        ? `{"speak":"عذراً، الحد اليومي للطلبات تم الوصول إليه. يرجى المحاولة بعد ${retryAfter||30} دقيقة.","intent":"error","slots":null,"booking":null}`
        : language === 'en'
        ? `{"speak":"The daily AI limit has been reached. Please try again in ${retryAfter||30} minutes or call us at (514) 555-0100.","intent":"error","slots":null,"booking":null}`
        : `{"speak":"La limite quotidienne de l'IA a été atteinte. Veuillez réessayer dans ${retryAfter||30} minutes ou appelez-nous au (514) 555-0100.","intent":"error","slots":null,"booking":null}`;
      return NextResponse.json({
        content:   [{ type: 'text', text: fallback }],
        model:     'none',
        rate_limit: true,
        retry_in:  retryAfter,
        rag:       { scenariosMatched: [], detectedDept: ragResult.detectedDept },
      });
    }

    if (!response.ok) {
      const errMsg = (data.error as any)?.message || `Groq error ${response.status}`;
      console.error('[VITARA AI]', response.status, errMsg);
      const fallback = `{"speak":"Une erreur temporaire est survenue. Veuillez réessayer.","intent":"error","slots":null,"booking":null}`;
      return NextResponse.json({
        content: [{ type: 'text', text: fallback }],
        model: MODEL_PRIMARY,
        groq_error: errMsg,
        rag: { scenariosMatched: [], detectedDept: ragResult.detectedDept },
      });
    }

    const text = data.choices?.[0]?.message?.content
      || '{"speak":"Je suis là pour vous aider.","intent":"welcome","slots":null,"booking":null}';

    return NextResponse.json({
      content: [{ type: 'text', text }],
      model:   data.choices ? MODEL_PRIMARY : MODEL_FALLBACK,
      usage:   data.usage,
      rag: {
        scenariosMatched: ragResult.scenarios.map(s => s.id),
        detectedDept:     ragResult.detectedDept,
        detectedLang:     ragResult.detectedLang,
      },
    });

  } catch (err) {
    console.error('[VITARA AI]', err);
    const fallback = '{"speak":"Erreur réseau. Veuillez réessayer.","intent":"error","slots":null,"booking":null}';
    return NextResponse.json({ content: [{ type: 'text', text: fallback }], code: 'SERVER_ERROR', error: String(err) });
  }
}
