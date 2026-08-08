import { NextRequest, NextResponse } from 'next/server';
import { retrieveContext, buildSystemPrompt } from '@/lib/knowledge/rag';
import { ConversationState, mergeState, INITIAL_STATE } from '@/lib/conversation/state';
import { extractEntities, entitiesToStateUpdate } from '@/lib/conversation/extractor';

export const maxDuration = 30;
const MODEL = 'llama-3.1-8b-instant';
const FALLBACK = 'llama-3.3-70b-versatile';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function retryMs(msg: string): number {
  const m = msg.match(/in (\d+)m(\d+\.?\d*)s/);
  const s = msg.match(/in (\d+\.?\d*)s/);
  if (m) return (parseInt(m[1])*60 + parseFloat(m[2]))*1000;
  if (s) return parseFloat(s[1])*1000;
  return 5000;
}

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
    const { messages, language='fr', max_tokens=300, agent='houda', gender='female', conversation_state } = body;

    // ── 1. Reconstruire l'état depuis le client ────────────────
    let currentState: ConversationState = conversation_state
      ? mergeState(INITIAL_STATE, conversation_state as ConversationState)
      : { ...INITIAL_STATE };

    // ── 2. EXTRACTION DÉTERMINISTE (regex — fiable à 100%) ─────
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const extracted   = extractEntities(lastUserMsg, currentState as any);
    const stateUpdate = entitiesToStateUpdate(extracted);

    // Mettre à jour l'état avec les entités extraites
    if (Object.keys(stateUpdate).length > 0) {
      currentState = mergeState(currentState, stateUpdate as Partial<ConversationState>);
    }

    // ── 3. RAG + system prompt avec état mis à jour ────────────
    const trimmed      = messages.slice(-8);
    const safeMessages = trimmed[0]?.role !== 'user' ? trimmed.slice(1) : trimmed;
    const ragResult    = retrieveContext(lastUserMsg, safeMessages);
    const detectedLang = ragResult.detectedLang || language;
    const systemPrompt = buildSystemPrompt(detectedLang, ragResult.context, agent, gender, currentState as any);

    // ── 4. Appel Groq ──────────────────────────────────────────
    async function callGroq(model: string) {
      return fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model, max_tokens,
          messages: [{ role: 'system', content: systemPrompt }, ...safeMessages],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });
    }

    let res  = await callGroq(MODEL);
    let data = await res.json() as any;

    // TPM → retry
    if (res.status === 429 && data.error?.message?.includes('per minute')) {
      const w = retryMs(data.error.message);
      if (w <= 12000) { await sleep(w + 500); res = await callGroq(MODEL); data = await res.json() as any; }
    }
    // TPD → fallback
    if (res.status === 429 && data.error?.message?.includes('per day')) {
      res = await callGroq(FALLBACK); data = await res.json() as any;
      if (res.status === 429) {
        const min = data.error?.message?.match(/(\d+)m/)?.[1] || '30';
        const fb  = `{"speak":"Limite quotidienne. Réessayez dans ${min} min ou appelez le (514) 555-0100.","intent":"error","state":{},"slots":null,"booking":null}`;
        return NextResponse.json({ content:[{type:'text',text:fb}], rate_limit:true });
      }
    }

    if (!res.ok) {
      const fb = `{"speak":"Erreur temporaire. Veuillez réessayer.","intent":"error","state":{},"slots":null,"booking":null}`;
      return NextResponse.json({ content:[{type:'text',text:fb}], groq_error: data.error?.message });
    }

    const text = data.choices?.[0]?.message?.content
      || '{"speak":"Je vous écoute.","intent":"welcome","state":{},"slots":null,"booking":null}';

    // Fusionner l'état Groq + l'état extrait déterministiquement
    let finalState: Record<string, any> = { ...currentState as any };
    try {
      const parsed = JSON.parse(text);
      if (parsed.state && typeof parsed.state === 'object') {
        finalState = { ...finalState, ...parsed.state };
      }
    } catch { /* ignore */ }

    return NextResponse.json({
      content: [{ type: 'text', text }],
      model:   MODEL,
      usage:   data.usage,
      conversation_state: finalState,
      extracted_entities: extracted, // debug
      rag: { scenariosMatched: ragResult.scenarios.map(s=>s.id), detectedDept: ragResult.detectedDept },
    });

  } catch (err) {
    const fb = '{"speak":"Erreur réseau. Veuillez réessayer.","intent":"error","state":{},"slots":null,"booking":null}';
    return NextResponse.json({ content:[{type:'text',text:fb}], code:'SERVER_ERROR' });
  }
}
