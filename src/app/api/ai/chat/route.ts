// ── VITARA Chat v10.0 — Mémoire DB + Zéro répétition ─────────
import { NextRequest, NextResponse } from 'next/server';
import {
  VitaraState, EMPTY_STATE, extractFromMessage, applyUpdates,
  nextStep, buildSlots, buildAck, extractNameFromReply,
} from '@/lib/conversation/engine';

export const maxDuration = 30;

// Charger le profil patient depuis la DB quand on a le téléphone
async function loadPatientProfile(phone: string): Promise<Partial<VitaraState>> {
  try {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    const r = await fetch(`${base}/api/patients?phone=${phone}`, {
      headers: { 'x-internal': '1' },
      next: { revalidate: 0 },
    });
    if (!r.ok) return {};
    const d = await r.json();
    if (!d.found || !d.patient) return {};

    const p = d.patient;
    const updates: Partial<VitaraState> = {};
    if (p.full_name)     updates.full_name     = { value: p.full_name,     status: 'confirmed' };
    if (p.email)         updates.email         = { value: p.email,         status: 'confirmed' };
    if (p.ramq)          updates.ramq          = { value: p.ramq,          status: 'confirmed' };
    if (p.address)       updates.full_name     = updates.full_name; // ne pas écraser
    if (p.family_doctor) updates.practitioner  = { value: p.family_doctor, status: 'confirmed' };
    return updates;
  } catch { return {}; }
}

// Sauvegarder l'état progressif de la conversation
async function saveProgress(sessionId: string, state: VitaraState, agentId: string, agentName: string, lang: string) {
  try {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    await fetch(`${base}/api/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal': '1' },
      body: JSON.stringify({
        session_id:   sessionId,
        agent_id:     agentId,
        agent_name:   agentName,
        patient_phone:(state.phone?.value || '').replace(/\D/g,''),
        patient_name: state.full_name?.value || '',
        service:      state.service?.value || '',
        practitioner: state.practitioner?.value || '',
        reason:       state.reason?.value || '',
        body_part:    state.body_part?.value || '',
        accident_type:state.accident_type?.value || '',
        claim_number: state.claim_number?.value || '',
        pain_scale:   state.pain_scale?.value || '',
        language:     lang,
        status:       'in_progress',
      }),
    });
  } catch { /* fire & forget */ }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      messages:           { role:string; content:string }[];
      language?:          string;
      agent?:             string;
      gender?:            'female'|'male';
      conversation_state?: Partial<VitaraState>;
      session_id?:        string;
    };
    const {
      messages, language='fr', agent='houda', gender='female',
      conversation_state, session_id = `v-${Date.now()}`,
    } = body;

    // ── 1. Reconstruire l'état ─────────────────────────────────
    let state: VitaraState = { ...EMPTY_STATE, ...(conversation_state||{}) };

    // ── 2. Extraction regex du dernier message ─────────────────
    const lastMsg = [...messages].reverse().find(m=>m.role==='user')?.content || '';
    const updates  = extractFromMessage(lastMsg, state);
    let   newState = applyUpdates(state, updates);

    // ── 3. CHARGEMENT PROFIL DB (quand téléphone nouveau) ─────
    const phoneJustConfirmed = updates.phone?.status === 'confirmed' && !state.phone?.value;
    if (phoneJustConfirmed && newState.phone?.value) {
      const profile = await loadPatientProfile(newState.phone.value);
      if (Object.keys(profile).length > 0) {
        newState = applyUpdates(newState, profile);
        // Marquer que le patient est existant
        newState = { ...newState, patient_type: 'existing' };
      }
    }

    // ── Extraction contextuelle pour champs texte libre ─────────
    // Quand le serveur attendait un champ spécifique et rien n'a été extrait par regex
    const pendingField = (conversation_state as any)?._pending_field as string | undefined;
    const nothingExtracted = Object.keys(updates).length === 0;

    if (pendingField && (nothingExtracted || !(updates as any)[pendingField])) {
      const msg = lastMsg.trim();
      // Ignorer les réponses trop courtes ou vides
      if (msg.length >= 2) {
        let fieldValue: string | null = null;

        if (pendingField === 'full_name') {
          fieldValue = extractNameFromReply(msg);
        } else if (pendingField === 'reason') {
          // Tout texte court = motif de consultation
          if (msg.split(' ').length <= 15 && !/@/.test(msg)) fieldValue = msg;
        } else if (pendingField === 'body_part') {
          if (msg.split(' ').length <= 8) fieldValue = msg;
        } else if (pendingField === 'pain_scale') {
          const n = msg.match(/\b([0-9]|10)\b/);
          if (n) fieldValue = n[1];
        } else if (pendingField === 'accident_type') {
          if (/travail|cnesst/i.test(msg)) fieldValue = 'CNESST';
          else if (/voiture|route|saaq/i.test(msg)) fieldValue = 'SAAQ';
          else if (/non|aucun|pas/i.test(msg)) fieldValue = 'none';
        } else if (pendingField === 'claim_number') {
          const nums = msg.match(/\d{5,}/);
          if (nums) fieldValue = nums[0];
          else if (/pas encore|pas de numéro|je n.ai pas/i.test(msg)) {
            newState = applyUpdates(newState, { claim_number: { value: null, status: 'skipped' as const } });
            (updates as any).claim_number = { value: null, status: 'skipped' };
          }
        }

        if (fieldValue) {
          const fieldUpdate = { [pendingField]: { value: fieldValue, status: 'confirmed' as const } };
          newState = applyUpdates(newState, fieldUpdate as any);
          Object.assign(updates, fieldUpdate);
        }
      }
    }

    // Champ juste confirmé pour l'ack
    const justField = (Object.keys(updates) as (keyof VitaraState)[])
      .find(k => (updates[k] as any)?.status === 'confirmed');
    const justVal   = justField ? ((updates[justField] as any)?.value || '') : '';

    // ── 4. Sauvegarder progressivement en DB ─────────────────
    if (justField) {
      saveProgress(session_id, newState, agent, agent.charAt(0).toUpperCase()+agent.slice(1), language);
    }

    // ── 5. Prochaine étape (déterministe) ────────────────────
    const step = nextStep(newState);

    // Créneaux → retour direct
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
        conversation_state: newState, session_id, model:'local',
      });
    }

    // ── 6. Construire la réponse — 100% côté serveur ─────────
    const ack      = justField ? buildAck(justField, justVal, language) : '';

    // Message spécial si patient reconnu depuis la DB
    let question: string;
    if (phoneJustConfirmed && newState.full_name?.value) {
      const name = newState.full_name.value;
      question = language==='en'
        ? `Welcome back, ${name}! I found your profile. ${(step as any).en}`
        : `Rebonjour ${name} ! J'ai retrouvé votre dossier. ${(step as any).fr}`;
    } else {
      question = language==='en' ? (step as any).en
                : language==='ar' ? (step as any).ar
                : (step as any).fr;
    }

    const speak = [ack, question].filter(Boolean).join(' ');
    const text  = JSON.stringify({speak, intent:'intake', state:{}, slots:null, booking:null});

    return NextResponse.json({
      content:[{type:'text',text}],
      conversation_state: newState,
      session_id,
      model: 'server',
      next_field: step.field,
      profile_loaded: phoneJustConfirmed && newState.full_name?.value ? true : false,
    });

  } catch(err) {
    const fb = '{"speak":"Erreur réseau. Veuillez réessayer.","intent":"error","state":{},"slots":null,"booking":null}';
    return NextResponse.json({content:[{type:'text',text:fb}], code:'SERVER_ERROR'});
  }
}
