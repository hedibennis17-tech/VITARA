// ── VITARA Chat API v9.0 — No Groq for intake questions ──────
import { NextRequest, NextResponse } from 'next/server';
import {
  VitaraState, EMPTY_STATE, extractFromMessage, applyUpdates,
  nextStep, buildSlots, buildAck,
} from '@/lib/conversation/engine';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;

  try {
    const body = await req.json() as {
      messages:           { role:string; content:string }[];
      language?:          string;
      agent?:             string;
      gender?:            'female'|'male';
      conversation_state?: Partial<VitaraState>;
    };
    const { messages, language='fr', agent='houda', gender='female', conversation_state } = body;

    // ── Reconstruire l'état ───────────────────────────────────
    const state: VitaraState = { ...EMPTY_STATE, ...(conversation_state||{}) };

    // ── Extraction regex ──────────────────────────────────────
    const lastMsg = [...messages].reverse().find(m=>m.role==='user')?.content || '';
    const updates  = extractFromMessage(lastMsg, state);
    const newState = applyUpdates(state, updates);

    const justConfirmedField = (Object.keys(updates) as (keyof VitaraState)[])
      .find(k => (updates[k] as any)?.status === 'confirmed');
    const justConfirmedVal = justConfirmedField
      ? ((updates[justConfirmedField] as any)?.value || '') : '';

    // ── Prochaine étape ───────────────────────────────────────
    const step = nextStep(newState);

    // ── Créneaux : retourner directement sans Groq ────────────
    if (step.type === 'slots') {
      const slots = buildSlots(newState);
      const prov  = slots[0].provider;
      const speak = language==='ar'
        ? `إليك 3 مواعيد مع ${prov}. أيها يناسبك؟`
        : language==='en'
        ? `Here are 3 available slots with ${prov}. Which works for you?`
        : `Voici 3 créneaux disponibles avec ${prov}. Lequel vous convient ?`;
      return NextResponse.json({
        content:[{type:'text',text:JSON.stringify({speak,intent:'slots',state:{},slots,booking:null})}],
        conversation_state: newState, model:'local',
      });
    }

    // ── Construire la réponse DIRECTEMENT côté serveur ────────
    // Groq N'EST PLUS appelé pour les questions d'intake — trop peu fiable
    const ack      = justConfirmedField ? buildAck(justConfirmedField, justConfirmedVal, language) : '';
    const question = language==='en' ? (step as any).en : language==='ar' ? (step as any).ar : (step as any).fr;
    const speak    = [ack, question].filter(Boolean).join(' ');

    const text = JSON.stringify({speak, intent:'intake', state:{}, slots:null, booking:null});
    return NextResponse.json({
      content:[{type:'text',text}],
      conversation_state: newState,
      model: 'server',
      next_field: step.field,
    });

  } catch(err) {
    const fb = '{"speak":"Erreur réseau. Veuillez réessayer.","intent":"error","state":{},"slots":null,"booking":null}';
    return NextResponse.json({content:[{type:'text',text:fb}], code:'SERVER_ERROR'});
  }
}
