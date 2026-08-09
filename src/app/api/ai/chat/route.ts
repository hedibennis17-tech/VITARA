// ── VITARA Chat API v8.0 — propre, zéro couche ───────────────
import { NextRequest, NextResponse } from 'next/server';
import {
  VitaraState, EMPTY_STATE, extractFromMessage, applyUpdates,
  nextStep, buildSlots, buildAck,
} from '@/lib/conversation/engine';

export const maxDuration = 30;
const MODEL = 'llama-3.1-8b-instant';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error:'GROQ_API_KEY manquante' },{ status:500 });

  try {
    const body = await req.json() as {
      messages:           { role:string; content:string }[];
      language?:          string;
      agent?:             string;
      gender?:            'female'|'male';
      conversation_state?: Partial<VitaraState>;
    };
    const { messages, language='fr', agent='houda', gender='female', conversation_state } = body;

    // ── État: reconstruire depuis le client ───────────────────
    const state: VitaraState = conversation_state
      ? { ...EMPTY_STATE, ...conversation_state }
      : { ...EMPTY_STATE };

    // ── Extraction regex du dernier message ───────────────────
    const lastMsg = [...messages].reverse().find(m=>m.role==='user')?.content || '';
    const updates  = extractFromMessage(lastMsg, state);
    const newState = applyUpdates(state, updates);

    // Trouver le premier champ nouvellement confirmé (pour l'ack)
    const justConfirmedField = (Object.keys(updates) as (keyof VitaraState)[])
      .find(k => (updates[k] as any)?.status === 'confirmed');
    const justConfirmedVal   = justConfirmedField
      ? ((updates[justConfirmedField] as any)?.value || '') : '';

    // ── Prochaine étape (déterministe) ────────────────────────
    const step = nextStep(newState);

    // Si tout est collecté → retourner les créneaux SANS Groq
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

    // ── Construire la réponse côté serveur (GARANTI) ──────────
    const ack      = justConfirmedField ? buildAck(justConfirmedField, justConfirmedVal, language) : '';
    const question = step.fr; // FR par défaut, à localiser si besoin
    const guaranteed = [ack, question].filter(Boolean).join(' ');

    // ── Groq: rendre la phrase plus naturelle (rôle limité) ───
    const name   = agent.charAt(0).toUpperCase() + agent.slice(1);
    const isMale = gender === 'male';

    const systemPrompt = `Tu es ${name}, ${isMale?'assistant médical':'assistante médicale'} à la Clinique Médicale JOLIBOURG de Laval.
Genre: ${isMale?'MASCULIN (assistant, prêt)':'FÉMININ (assistante, prête)'}
JSON uniquement: {"speak":"...","intent":"intake","state":{},"slots":null,"booking":null}
Rends ce message légèrement plus naturel sans changer le sens ni ajouter d'autres questions:
"${guaranteed}"`;

    const safeMsg = messages.slice(-4);
    const trimmed = safeMsg[0]?.role!=='user' ? safeMsg.slice(1) : safeMsg;

    let res  = await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
      body:JSON.stringify({
        model:MODEL, max_tokens:100, temperature:0.3,
        response_format:{type:'json_object'},
        messages:[{role:'system',content:systemPrompt},...trimmed],
      }),
    });
    let data = await res.json() as any;

    // TPM retry
    if (res.status===429 && data.error?.message?.includes('per minute')) {
      const w = data.error.message.match(/in (\d+\.?\d*)s/);
      if (w && parseFloat(w[1])<=12) {
        await sleep(parseFloat(w[1])*1000+500);
        res  = await fetch('https://api.groq.com/openai/v1/chat/completions',{
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
          body:JSON.stringify({model:MODEL,max_tokens:100,temperature:0.3,
            response_format:{type:'json_object'},
            messages:[{role:'system',content:systemPrompt},...trimmed]}),
        });
        data = await res.json() as any;
      }
    }

    // TPD — fallback direct sans Groq
    if (res.status===429) {
      const text = JSON.stringify({speak:guaranteed,intent:'intake',state:{},slots:null,booking:null});
      return NextResponse.json({content:[{type:'text',text}],conversation_state:newState,model:'local'});
    }

    // Construire la réponse finale avec fallback garanti
    let speak = guaranteed;
    if (res.ok && data.choices?.[0]?.message?.content) {
      try {
        const p = JSON.parse(data.choices[0].message.content);
        if (p.speak && typeof p.speak==='string' && p.speak.length<250) speak = p.speak;
      } catch { /* garder guaranteed */ }
    }

    const text = JSON.stringify({speak,intent:'intake',state:{},slots:null,booking:null});
    return NextResponse.json({
      content:[{type:'text',text}],
      conversation_state: newState,
      model: MODEL,
      next_field: step.field,
    });

  } catch(err) {
    const fb = '{"speak":"Erreur réseau. Veuillez réessayer.","intent":"error","state":{},"slots":null,"booking":null}';
    return NextResponse.json({content:[{type:'text',text:fb}],code:'SERVER_ERROR'});
  }
}
