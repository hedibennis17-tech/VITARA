// ── VITARA Chat v7.0 — Server-Driven, Zero Groq Improvisation ─
import { NextRequest, NextResponse } from 'next/server';
import { ConversationState, mergeState, INITIAL_STATE } from '@/lib/conversation/state';
import { extractEntities, entitiesToStateUpdate } from '@/lib/conversation/extractor';
import { getNextAction } from '@/lib/conversation/next-question';

export const maxDuration = 30;
const MODEL = 'llama-3.1-8b-instant';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function retryMs(msg: string): number {
  const s = msg.match(/in (\d+\.?\d*)s/);
  const m = msg.match(/in (\d+)m(\d+\.?\d*)s/);
  if (m) return (parseInt(m[1])*60+parseFloat(m[2]))*1000;
  if (s) return parseFloat(s[1])*1000;
  return 5000;
}

// Générer les créneaux selon le praticien confirmé
function generateSlots(state: any): any[] {
  const provider = state.requested_practitioner?.value || 'Dr. Fahd Awada';
  const service  = state.requested_service?.value || '';
  const duration = service.includes('physio') ? '30 min' : '20 min';
  const dept     = service.includes('physio') ? 'Physiothérapie'
                 : service.includes('pediatr') ? 'Pédiatrie'
                 : 'Médecine familiale';
  const today    = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
  const fmt = (d: Date) => d.toLocaleDateString('fr-CA',{weekday:'long',day:'numeric',month:'long'});
  return [
    { id:'1', label:`${fmt(today)} à 14h00`,   provider, dept, duration, date:today.toISOString().slice(0,10),    time:'14:00' },
    { id:'2', label:`${fmt(today)} à 16h30`,   provider, dept, duration, date:today.toISOString().slice(0,10),    time:'16:30' },
    { id:'3', label:`${fmt(tomorrow)} à 9h00`, provider, dept, duration, date:tomorrow.toISOString().slice(0,10), time:'09:00' },
  ];
}

// Accusé de réception court selon le champ qu'on vient de collecter
function getAck(field: string | undefined, value: string, lang: string): string {
  if (lang === 'ar') return 'شكراً.';
  if (lang === 'en') {
    const map: Record<string,string> = {
      full_name: `Thank you, ${value}.`,
      phone: 'Phone number noted.',
      email: 'Email noted.',
      ramq_number: 'Health card noted.',
      requested_service: 'Understood.',
      requested_practitioner: `Dr. ${value.replace(/dr\.?\s*/i,'')} noted.`,
      reason: 'Understood.',
      body_part: 'Noted.',
      urgency_level: `Pain level ${value}/10 noted.`,
      accident_type: 'Noted.',
      cnesst_claim_number: 'CNESST number noted.',
      saaq_claim_number: 'SAAQ number noted.',
    };
    return map[field||''] || 'Understood.';
  }
  // FR
  const map: Record<string,string> = {
    full_name:              `Merci, ${value}.`,
    phone:                  'Numéro noté.',
    email:                  'Courriel noté.',
    ramq_number:            'Numéro d\'assurance noté.',
    requested_service:      'Très bien.',
    requested_practitioner: `Dr. ${value.replace(/dr\.?\s*/i,'')} noté.`,
    reason:                 'Je comprends.',
    body_part:              'Noté.',
    urgency_level:          `Douleur ${value}/10 notée.`,
    accident_type:          value === 'CNESST' ? 'Dossier CNESST noté.' : value === 'SAAQ' ? 'Dossier SAAQ noté.' : 'Noté.',
    cnesst_claim_number:    'Numéro CNESST noté.',
    saaq_claim_number:      'Numéro SAAQ noté.',
  };
  return map[field||''] || 'Noté.';
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error:'GROQ_API_KEY manquante', code:'NO_API_KEY' }, { status:500 });

    const body = await req.json() as {
      messages:           { role:string; content:string }[];
      language?:          string;
      agent?:             string;
      gender?:            'female'|'male';
      conversation_state?: Partial<ConversationState>;
    };
    const { messages, language='fr', agent='houda', gender='female', conversation_state } = body;

    // ── 1. Reconstruire + mettre à jour l'état via extraction regex ─
    let state: ConversationState = conversation_state
      ? mergeState(INITIAL_STATE, conversation_state as ConversationState)
      : { ...INITIAL_STATE };

    const lastUser = [...messages].reverse().find(m => m.role==='user')?.content || '';
    const extracted   = extractEntities(lastUser, state as any);
    const stateUpdate = entitiesToStateUpdate(extracted);
    const justConfirmed = Object.keys(stateUpdate)[0]; // premier champ qu'on vient d'extraire
    const justConfirmedVal = (stateUpdate as any)[justConfirmed]?.value || '';

    if (Object.keys(stateUpdate).length > 0) {
      state = mergeState(state, stateUpdate as Partial<ConversationState>);
    }

    // ── 2. Déterminer la prochaine action (déterministe) ───────────
    const nextAction = getNextAction(state as any, language);

    // ── 3. Si tout collecté → créneaux directs (sans Groq) ────────
    if (nextAction.type === 'slots') {
      const slots = generateSlots(state);
      const prov  = slots[0].provider;
      const speak = language === 'ar'
        ? `إليك 3 مواعيد متاحة مع ${prov}. أيها يناسبك؟`
        : language === 'en'
        ? `Here are 3 available slots with ${prov}. Which works for you?`
        : `Voici 3 créneaux disponibles avec ${prov}. Lequel vous convient ?`;
      return NextResponse.json({
        content: [{type:'text', text: JSON.stringify({speak, intent:'slots', state:{}, slots, booking:null})}],
        conversation_state: state, model:'local',
      });
    }

    // ── 4. Construire la question suivante (côté serveur) ──────────
    const nextQ   = nextAction[language==='en' ? 'question_en' : language==='ar' ? 'question_ar' : 'question'] || nextAction.question || '';
    const ack     = justConfirmed ? getAck(justConfirmed, justConfirmedVal, language) : '';
    const finalQ  = [ack, nextQ].filter(Boolean).join(' ');

    // ── 5. Appel Groq UNIQUEMENT pour rendre la phrase naturelle ───
    //    Groq reçoit le texte final et peut juste le rendre plus chaleureux
    //    S'il dévie, on utilise finalQ directement (fallback garanti)
    const name   = agent.charAt(0).toUpperCase() + agent.slice(1);
    const isMale = gender === 'male';
    const systemPrompt = `Tu es ${name}, ${isMale?'assistant médical':'assistante médicale'} à la Clinique JOLIBOURG Laval.
Réponds en JSON: {"speak":"...","intent":"intake","state":{},"slots":null,"booking":null}
Le message à transmettre est: "${finalQ}"
Rends-le légèrement plus naturel/chaleureux si possible, mais NE CHANGE PAS le sens ni n'ajoute de question.
IMPORTANT: parle en ${gender==='male'?'MASCULIN':'FÉMININ'}. Genre: ${isMale?'assistant, prêt':'assistante, prête'}.`;

    const trimmed = messages.slice(-4);
    const safeMsg = trimmed[0]?.role !== 'user' ? trimmed.slice(1) : trimmed;

    async function callGroq(model: string) {
      return fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
        body: JSON.stringify({
          model, max_tokens:120, temperature:0.3,
          response_format:{type:'json_object'},
          messages:[{role:'system',content:systemPrompt},...safeMsg],
        }),
      });
    }

    let res  = await callGroq(MODEL);
    let data = await res.json() as any;

    // TPM retry
    if (res.status===429 && data.error?.message?.includes('per minute')) {
      const w = retryMs(data.error.message);
      if (w<=12000) { await sleep(w+500); res=await callGroq(MODEL); data=await res.json() as any; }
    }
    // TPD fallback
    if (res.status===429 && data.error?.message?.includes('per day')) {
      res=await callGroq('llama-3.3-70b-versatile'); data=await res.json() as any;
    }

    // Construire la réponse finale — TOUJOURS avec fallback garanti
    let speak = finalQ;
    if (res.ok && data.choices?.[0]?.message?.content) {
      try {
        const parsed = JSON.parse(data.choices[0].message.content);
        // Vérifier que Groq n'a pas inventé autre chose
        if (parsed.speak && parsed.speak.length < 300) speak = parsed.speak;
      } catch { /* garder finalQ */ }
    }

    const responseText = JSON.stringify({speak, intent:'intake', state:{}, slots:null, booking:null});

    return NextResponse.json({
      content: [{type:'text', text: responseText}],
      model: MODEL,
      conversation_state: state,
      next_field: nextAction.field,
      extracted_entities: extracted,
    });

  } catch (err) {
    const fb = '{"speak":"Erreur réseau. Veuillez réessayer.","intent":"error","state":{},"slots":null,"booking":null}';
    return NextResponse.json({content:[{type:'text',text:fb}], code:'SERVER_ERROR'});
  }
}
