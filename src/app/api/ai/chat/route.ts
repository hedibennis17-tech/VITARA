import { NextRequest, NextResponse } from 'next/server';
import { retrieveContext, buildSystemPrompt } from '@/lib/knowledge/rag';
import { ConversationState, mergeState, INITIAL_STATE } from '@/lib/conversation/state';

export const maxDuration = 30;
const MODEL_PRIMARY  = 'llama-3.1-8b-instant';
const MODEL_FALLBACK = 'llama-3.3-70b-versatile';

function extractRetryAfter(msg: string): number {
  const m = msg.match(/in (\d+)m(\d+\.?\d*)s/);
  const s = msg.match(/in (\d+\.?\d*)s/);
  if (m) return (parseInt(m[1]) * 60 + parseFloat(m[2])) * 1000;
  if (s) return parseFloat(s[1]) * 1000;
  return 5000;
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'GROQ_API_KEY manquante', code: 'NO_API_KEY' }, { status: 500 });

    const body = await req.json() as {
      messages:          { role: string; content: string }[];
      language?:         string;
      max_tokens?:       number;
      agent?:            string;
      gender?:           'female'|'male';
      conversation_state?: Partial<ConversationState>;
    };
    const { messages, language = 'fr', max_tokens = 300, agent = 'houda', gender = 'female', conversation_state } = body;

    const trimmed      = messages.slice(-10);
    const safeMessages = trimmed[0]?.role !== 'user' ? trimmed.slice(1) : trimmed;
    const lastUser     = [...safeMessages].reverse().find(m => m.role === 'user')?.content || '';
    const ragResult    = retrieveContext(lastUser, safeMessages);
    const detectedLang = ragResult.detectedLang || language;

    // Reconstruire l'état complet depuis le partiel reçu
    const currentState: ConversationState = conversation_state
      ? mergeState(INITIAL_STATE, conversation_state as ConversationState)
      : INITIAL_STATE;

    const systemPrompt = buildSystemPrompt(detectedLang, ragResult.context, agent, gender, currentState);

    async function callGroq(model: string) {
      return fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model, max_tokens,
          messages: [{ role: 'system', content: systemPrompt }, ...safeMessages],
          temperature: 0.3,  // Plus bas = plus cohérent pour le suivi d'état
          response_format: { type: 'json_object' },
        }),
      });
    }

    let response = await callGroq(MODEL_PRIMARY);
    let data     = await response.json() as any;

    // TPM 429 → retry
    if (response.status === 429 && data.error?.message?.includes('per minute')) {
      const waitMs = extractRetryAfter(data.error.message);
      if (waitMs <= 12000) { await sleep(waitMs + 500); response = await callGroq(MODEL_PRIMARY); data = await response.json() as any; }
    }
    // TPD 429 → fallback
    if (response.status === 429 && data.error?.message?.includes('per day')) {
      response = await callGroq(MODEL_FALLBACK);
      data = await response.json() as any;
      if (response.status === 429) {
        const min = data.error?.message?.match(/(\d+)m/)?.[1] || '30';
        const fb = `{"speak":"Limite atteinte. Réessayez dans ${min} minutes ou appelez le (514) 555-0100.","intent":"error","state":{},"slots":null,"booking":null}`;
        return NextResponse.json({ content: [{ type: 'text', text: fb }], rate_limit: true });
      }
    }

    if (!response.ok) {
      const fb = `{"speak":"Erreur temporaire. Veuillez réessayer.","intent":"error","state":{},"slots":null,"booking":null}`;
      return NextResponse.json({ content: [{ type: 'text', text: fb }], groq_error: data.error?.message });
    }

    const text = data.choices?.[0]?.message?.content
      || '{"speak":"Je vous écoute.","intent":"welcome","state":{},"slots":null,"booking":null}';

    // Extraire l'état mis à jour retourné par l'IA
    let updatedState: Partial<ConversationState> = {};
    try {
      const parsed = JSON.parse(text);
      if (parsed.state && typeof parsed.state === 'object') {
        updatedState = mergeState(currentState, parsed.state as ConversationState);
      }
    } catch { /* ignore */ }

    return NextResponse.json({
      content: [{ type: 'text', text }],
      model:   MODEL_PRIMARY,
      usage:   data.usage,
      conversation_state: updatedState,
      rag:     { scenariosMatched: ragResult.scenarios.map(s => s.id), detectedDept: ragResult.detectedDept },
    });

  } catch (err) {
    const fb = '{"speak":"Erreur réseau. Veuillez réessayer.","intent":"error","state":{},"slots":null,"booking":null}';
    return NextResponse.json({ content: [{ type: 'text', text: fb }], code: 'SERVER_ERROR' });
  }
}
