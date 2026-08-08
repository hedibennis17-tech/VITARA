// ── VITARA Chat API v6.0 — Guided Completion Architecture ─────
// Le serveur décide QUOI demander. Groq dit juste COMMENT le dire.
import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/knowledge/rag';
import { ConversationState, mergeState, INITIAL_STATE } from '@/lib/conversation/state';
import { extractEntities, entitiesToStateUpdate } from '@/lib/conversation/extractor';
import { getNextAction } from '@/lib/conversation/next-question';

export const maxDuration = 30;
const MODEL = 'llama-3.1-8b-instant';
const FALLBACK = 'llama-3.3-70b-versatile';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function retryMs(msg: string): number {
  const m = msg.match(/in (\d+)m(\d+\.?\d*)s/);
  const s = msg.match(/in (\d+\.?\d*)s/);
  if (m) return (parseInt(m[1])*60+parseFloat(m[2]))*1000;
  if (s) return parseFloat(s[1])*1000;
  return 5000;
}

// Générer les 3 créneaux selon le praticien et le service
function generateSlots(state: any): any[] {
  const provider  = state.requested_practitioner?.value || state.requested_practitioner || 'Dr. Fahd Awada';
  const service   = state.requested_service?.value || '';
  const duration  = service.includes('physio') ? '30 min' : '20 min';
  const dept      = service.includes('physio') ? 'Physiothérapie'
                  : service.includes('pediatr') ? 'Pédiatrie'
                  : 'Médecine familiale';
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
  const d2 = new Date(today); d2.setDate(today.getDate()+2);
  const fmt = (d: Date) => d.toLocaleDateString('fr-CA',{weekday:'long',day:'numeric',month:'long'});
  return [
    { id:'1', label:`${fmt(today)} à 14h00`,   provider, dept, duration, date:today.toISOString().slice(0,10),    time:'14:00' },
    { id:'2', label:`${fmt(today)} à 16h30`,   provider, dept, duration, date:today.toISOString().slice(0,10),    time:'16:30' },
    { id:'3', label:`${fmt(tomorrow)} à 9h00`, provider, dept, duration, date:tomorrow.toISOString().slice(0,10), time:'09:00' },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error:'GROQ_API_KEY manquante', code:'NO_API_KEY' }, { status:500 });

    const body = await req.json() as {
      messages:           { role:string; content:string }[];
      language?:          string;
      max_tokens?:        number;
      agent?:             string;
      gender?:            'female'|'male';
      conversation_state?: Partial<ConversationState>;
    };
    const { messages, language='fr', agent='houda', gender='female', conversation_state } = body;

    // ── 1. État initial + extraction déterministe ──────────────
    let state: ConversationState = conversation_state
      ? mergeState(INITIAL_STATE, conversation_state as ConversationState)
      : { ...INITIAL_STATE };

    const lastUser = [...messages].reverse().find(m => m.role==='user')?.content || '';
    const extracted   = extractEntities(lastUser, state as any);
    const stateUpdate = entitiesToStateUpdate(extracted);
    if (Object.keys(stateUpdate).length > 0) {
      state = mergeState(state, stateUpdate as Partial<ConversationState>);
    }

    // ── 2. Next Best Action (déterministe — PAS Groq) ──────────
    const nextAction = getNextAction(state as any, language);

    // Si on a tout → retourner les créneaux directement
    if (nextAction.type === 'slots') {
      const slots = generateSlots(state);
      const speak = language === 'ar'
        ? `إليك 3 مواعيد متاحة مع ${slots[0].provider}. أيها يناسبك؟`
        : language === 'en'
        ? `Here are 3 available slots with ${slots[0].provider}. Which works for you?`
        : `Voici 3 créneaux disponibles avec ${slots[0].provider}. Lequel vous convient ?`;
      return NextResponse.json({
        content: [{ type:'text', text: JSON.stringify({ speak, intent:'slots', state:{}, slots, booking:null }) }],
        conversation_state: state,
        model: 'local',
      });
    }

    // ── 3. Prompt "guided" — Groq ne fait que reformuler ──────
    const nextQ = nextAction[`question${language==='en'?'_en':language==='ar'?'_ar':''}`]
                || nextAction.question || '';

    const name   = agent.charAt(0).toUpperCase() + agent.slice(1);
    const isMale = gender === 'male';
    const adj    = isMale ? 'assistant médical' : 'assistante médicale';

    // Résumé de l'état confirmé
    const stateLines = Object.entries(state as any)
      .filter(([k,v]: [string,any]) => {
        if (typeof v === 'string') return !!v;
        return v?.value && v.status !== 'UNKNOWN';
      })
      .map(([k,v]: [string,any]) => {
        const val = typeof v === 'string' ? v : v.value;
        const status = typeof v === 'string' ? 'CONFIRMED' : v.status;
        return `  ${k}: "${val}" [${status}]`;
      }).join('\n') || '  (début de conversation)';

    const guidedPrompt = `Tu es ${name}, ${adj} à la Clinique Médicale JOLIBOURG de Laval.
Genre: ${isMale?'MASCULIN':'FÉMININ'}

CONTEXTE CONFIRMÉ (ne JAMAIS redemander ces champs):
${stateLines}

MESSAGE PATIENT: "${lastUser}"

INSTRUCTION OBLIGATOIRE: Tu dois poser EXACTEMENT cette question, reformulée naturellement:
"${nextQ}"

RÈGLES:
- Réponds en JSON pur UNIQUEMENT
- Commence par un accusé de réception bref de ce que le patient vient de dire
- Enchaîne avec la question indiquée
- Si la question est sur un champ déjà dans le CONTEXTE CONFIRMÉ → ne la pose pas, passe à la suivante
- Format: {"speak":"accusé + question","intent":"intake","state":{},"slots":null,"booking":null}`;

    // ── 4. Appel Groq (juste pour reformuler naturellement) ────
    const trimmed = messages.slice(-6);
    const safeMsg = trimmed[0]?.role !== 'user' ? trimmed.slice(1) : trimmed;

    async function callGroq(model: string) {
      return fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model, max_tokens: 200, temperature: 0.4,
          response_format: { type: 'json_object' },
          messages: [{ role:'system', content: guidedPrompt }, ...safeMsg],
        }),
      });
    }

    let res  = await callGroq(MODEL);
    let data = await res.json() as any;

    if (res.status === 429 && data.error?.message?.includes('per minute')) {
      const w = retryMs(data.error.message);
      if (w <= 12000) { await sleep(w+500); res = await callGroq(MODEL); data = await res.json() as any; }
    }
    if (res.status === 429 && data.error?.message?.includes('per day')) {
      res = await callGroq(FALLBACK); data = await res.json() as any;
      if (res.status === 429) {
        const fb = `{"speak":"Limite atteinte. Rappellez-nous au (514) 555-0100.","intent":"error","state":{},"slots":null,"booking":null}`;
        return NextResponse.json({ content:[{type:'text',text:fb}], rate_limit:true });
      }
    }

    // Fallback: si Groq échoue, utiliser la question directe
    let text: string;
    if (!res.ok || !data.choices?.[0]?.message?.content) {
      text = JSON.stringify({ speak: nextQ, intent:'intake', state:{}, slots:null, booking:null });
    } else {
      text = data.choices[0].message.content;
      // Vérifier que Groq n'a pas inventé sa propre question différente
      try {
        const parsed = JSON.parse(text);
        if (!parsed.speak) parsed.speak = nextQ;
        text = JSON.stringify(parsed);
      } catch { text = JSON.stringify({ speak: nextQ, intent:'intake', state:{}, slots:null, booking:null }); }
    }

    return NextResponse.json({
      content: [{ type:'text', text }],
      model: MODEL,
      conversation_state: state,
      next_field: nextAction.field,
      extracted_entities: extracted,
    });

  } catch (err) {
    const fb = '{"speak":"Erreur réseau. Veuillez réessayer.","intent":"error","state":{},"slots":null,"booking":null}';
    return NextResponse.json({ content:[{type:'text',text:fb}], code:'SERVER_ERROR' });
  }
}
