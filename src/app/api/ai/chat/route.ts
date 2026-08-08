import { NextRequest, NextResponse } from 'next/server';
import { retrieveContext, buildSystemPrompt } from '@/lib/knowledge/rag';

export const maxDuration = 30;

const MODEL_PRIMARY  = 'llama-3.1-8b-instant';   // 500K tokens/jour
const MODEL_FALLBACK = 'llama-3.3-70b-versatile'; // fallback

// ── Attente intelligente sur TPM 429 ─────────────────────────
function extractRetryAfter(errorMsg: string): number {
  // "Please try again in 5.49s" ou "14m1.536s"
  const secMatch = errorMsg.match(/in (\d+\.?\d*)s/);
  const minMatch = errorMsg.match(/in (\d+)m(\d+\.?\d*)s/);
  if (minMatch) return (parseInt(minMatch[1]) * 60 + parseFloat(minMatch[2])) * 1000;
  if (secMatch)  return parseFloat(secMatch[1]) * 1000;
  return 5000; // défaut 5s
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY manquante', code: 'NO_API_KEY' }, { status: 500 });
    }

    const body = await req.json() as {
      messages: { role: string; content: string }[];
      language?: string;
      max_tokens?: number;
    };
    const { messages, language = 'fr', max_tokens = 500 } = body;

    // ── Historique propre: max 10 messages, commence par user ─
    const trimmed     = messages.slice(-10);
    const safeMessages = trimmed[0]?.role !== 'user' ? trimmed.slice(1) : trimmed;

    // ── RAG léger ─────────────────────────────────────────────
    const lastUser     = [...safeMessages].reverse().find(m => m.role === 'user')?.content || '';
    const ragResult    = retrieveContext(lastUser, safeMessages);
    const detectedLang = ragResult.detectedLang || language;
    const systemPrompt = buildSystemPrompt(detectedLang, ragResult.context);

    // ── Appel Groq avec retry automatique sur TPM ─────────────
    async function callGroq(model: string) {
      return fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          max_tokens,
          messages: [{ role: 'system', content: systemPrompt }, ...safeMessages],
          temperature: 0.4,
          response_format: { type: 'json_object' },
        }),
      });
    }

    let response = await callGroq(MODEL_PRIMARY);
    let data     = await response.json() as any;

    // TPM 429 → wait + retry (max 12 secondes d'attente)
    if (response.status === 429 && data.error?.message?.includes('per minute')) {
      const waitMs = extractRetryAfter(data.error.message);
      if (waitMs <= 12000) {
        console.log(`[VITARA] TPM 429 — attente ${waitMs}ms puis retry`);
        await sleep(waitMs + 500);
        response = await callGroq(MODEL_PRIMARY);
        data     = await response.json() as any;
      }
    }

    // TPD 429 (quota jour épuisé) → essayer le fallback
    if (response.status === 429 && data.error?.message?.includes('per day')) {
      console.warn('[VITARA] TPD épuisé sur 8b → fallback 70b');
      response = await callGroq(MODEL_FALLBACK);
      data     = await response.json() as any;

      // Si le fallback est aussi en 429 TPD → message clair
      if (response.status === 429) {
        const retryMin = data.error?.message?.match(/(\d+)m/)?.[1] || '30';
        const fallback = detectedLang === 'ar'
          ? `{"speak":"عذراً، تم الوصول إلى الحد اليومي. يرجى المحاولة بعد ${retryMin} دقيقة أو الاتصال: (514) 555-0100.","intent":"error","slots":null,"booking":null}`
          : detectedLang === 'en'
          ? `{"speak":"Daily AI limit reached. Please try again in ${retryMin} minutes or call (514) 555-0100.","intent":"error","slots":null,"booking":null}`
          : `{"speak":"Limite quotidienne atteinte. Réessayez dans ${retryMin} minutes ou appelez le (514) 555-0100.","intent":"error","slots":null,"booking":null}`;
        return NextResponse.json({ content: [{ type:'text', text: fallback }], rate_limit: true, retry_in_min: retryMin });
      }
    }

    // Autre erreur Groq non-429
    if (!response.ok && response.status !== 429) {
      const fallback = `{"speak":"Erreur temporaire. Veuillez réessayer.","intent":"error","slots":null,"booking":null}`;
      return NextResponse.json({ content: [{ type:'text', text: fallback }], groq_error: data.error?.message });
    }

    const text = data.choices?.[0]?.message?.content
      || '{"speak":"Je suis là pour vous aider.","intent":"welcome","slots":null,"booking":null}';

    return NextResponse.json({
      content: [{ type: 'text', text }],
      model:   response.headers?.get('x-groq-model') || MODEL_PRIMARY,
      usage:   data.usage,
      rag:     { scenariosMatched: ragResult.scenarios.map(s => s.id), detectedDept: ragResult.detectedDept },
    });

  } catch (err) {
    console.error('[VITARA AI]', err);
    const fallback = '{"speak":"Erreur réseau. Veuillez réessayer.","intent":"error","slots":null,"booking":null}';
    return NextResponse.json({ content: [{ type:'text', text: fallback }], code: 'SERVER_ERROR' });
  }
}
