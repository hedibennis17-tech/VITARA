// ── VITARA Chat v12.0 — DB non-bloquante + stable ─────────────
import { NextRequest, NextResponse } from 'next/server';
import {
  VitaraState, EMPTY_STATE, extractFromMessage, applyUpdates,
  nextStep, buildSlots, buildAck, extractNameFromReply,
} from '@/lib/conversation/engine';

export const maxDuration = 30;

// Pool partagé (singleton par warm instance)
let _pool: any = null;
async function getPool() {
  const DB = process.env.DATABASE_URL;
  if (!DB) return null;
  if (!_pool) {
    const { Pool } = await import('pg');
    _pool = new Pool({ connectionString: DB, ssl: { rejectUnauthorized: false }, max: 3 });
  }
  return _pool;
}

// Sauvegarde DB avec timeout — jamais bloquante pour l'utilisateur
function saveAsync(sessionId: string, state: VitaraState, agentId: string, agentName: string, lang: string) {
  const timeout = new Promise(r => setTimeout(r, 3000)); // max 3s
  const save = async () => {
    const pool = await getPool();
    if (!pool) return;
    await pool.query(`
      INSERT INTO conversations (session_id, agent_id, agent_name, patient_phone, patient_name,
        service, practitioner, reason, body_part, accident_type, claim_number, pain_scale, language, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (session_id) DO UPDATE SET
        patient_name  = COALESCE($5, conversations.patient_name),
        service       = COALESCE($6, conversations.service),
        practitioner  = COALESCE($7, conversations.practitioner),
        reason        = COALESCE($8, conversations.reason),
        body_part     = COALESCE($9, conversations.body_part),
        accident_type = COALESCE($10, conversations.accident_type),
        claim_number  = COALESCE($11, conversations.claim_number),
        pain_scale    = COALESCE($12, conversations.pain_scale),
        status        = COALESCE($14, conversations.status)
    `, [
      sessionId, agentId, agentName,
      (state.phone?.value||'').replace(/\D/g,'')||null,
      state.full_name?.value||null, state.service?.value||null, state.practitioner?.value||null,
      state.reason?.value||null, state.body_part?.value||null, state.accident_type?.value||null,
      state.claim_number?.value||null, state.pain_scale?.value||null, lang, 'in_progress',
    ]);
    // Upsert patient si téléphone connu
    if (state.phone?.value && state.full_name?.value) {
      const ph = state.phone.value.replace(/\D/g,'');
      await pool.query(`
        INSERT INTO patients (full_name,phone,email,ramq,family_doctor)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (phone) DO UPDATE SET
          full_name=COALESCE($1,patients.full_name), email=COALESCE($3,patients.email),
          ramq=COALESCE($4,patients.ramq), family_doctor=COALESCE($5,patients.family_doctor), updated_at=NOW()
      `, [state.full_name.value, ph, state.email?.value||null, state.ramq?.value||null, state.practitioner?.value||null]);
    }
  };
  Promise.race([save(), timeout]).catch(e => console.error('[DB save]', e.message));
}

// Charger profil patient
async function loadProfile(phone: string): Promise<Partial<VitaraState>> {
  try {
    const pool = await getPool();
    if (!pool) return {};
    const r = await pool.query(
      'SELECT full_name,email,ramq,family_doctor FROM patients WHERE phone=$1 LIMIT 1',
      [phone.replace(/\D/g,'')]
    );
    if (!r.rows.length) return {};
    const p = r.rows[0];
    const out: Partial<VitaraState> = {};
    if (p.full_name)     out.full_name    = { value: p.full_name,     status: 'confirmed' };
    if (p.email)         out.email        = { value: p.email,         status: 'confirmed' };
    if (p.ramq)          out.ramq         = { value: p.ramq,          status: 'confirmed' };
    if (p.family_doctor) out.practitioner = { value: p.family_doctor, status: 'confirmed' };
    return out;
  } catch { return {}; }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      messages:            { role:string; content:string }[];
      language?:           string;
      agent?:              string;
      gender?:             'female'|'male';
      conversation_state?: Partial<VitaraState>;
      session_id?:         string;
    };
    const { messages, language='fr', agent='houda', gender='female',
            conversation_state, session_id=`v-${Date.now()}` } = body;

    let state: VitaraState = { ...EMPTY_STATE, ...(conversation_state||{}) };
    const lastMsg = [...messages].reverse().find(m=>m.role==='user')?.content || '';
    const updates  = extractFromMessage(lastMsg, state);
    let   newState = applyUpdates(state, updates);

    // Charger profil si téléphone nouveau
    const phoneNew = updates.phone?.status==='confirmed' && !state.phone?.value;
    if (phoneNew && newState.phone?.value) {
      const profile = await loadProfile(newState.phone.value);
      if (Object.keys(profile).length>0) {
        // Ne JAMAIS écraser un champ déjà CONFIRMED dans newState (peu importe quand)
        const safe = Object.fromEntries(
          Object.entries(profile).filter(([k]) => {
            const cur = (newState as any)[k];
            return !cur?.value || cur?.status !== 'confirmed';
          })
        );
        if (Object.keys(safe).length>0) {
          newState = applyUpdates(newState, safe as any);
          newState = { ...newState, patient_type:'existing' };
        }
      }
    }

    // Extraction contextuelle
    const pendingField = (conversation_state as any)?._pending_field as string|undefined;
    const nothingExtracted = Object.keys(updates).length===0;
    if (pendingField && (nothingExtracted || !(updates as any)[pendingField])) {
      const msg = lastMsg.trim();
      if (msg.length>=2) {
        let v: string|null=null;
        if      (pendingField==='full_name')    v = extractNameFromReply(msg);
        else if (pendingField==='reason'     && msg.split(' ').length<=15 && !/@/.test(msg)) v=msg;
        else if (pendingField==='body_part'  && msg.split(' ').length<=8)  v=msg;
        else if (pendingField==='child_name' && msg.split(' ').length<=5 && !/\d{4,}/.test(msg)) v=msg;
        else if (pendingField==='child_dob') { const d=msg.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/) || msg.match(/\d{4}/); if(d) v=msg; else v=msg; }
        else if (pendingField==='child_temp') v=msg;
        else if (pendingField==='child_breathing') v=msg;
        else if (pendingField==='child_diarrhea') v=msg;
        else if (pendingField==='child_vomiting') v=msg;
        else if (pendingField==='child_appearance') v=msg;
        else if (pendingField==='pain_scale') { const n=msg.match(/\b([0-9]|10)\b/); if(n) v=n[1]; }
        else if (pendingField==='accident_type') {
          if (/travail|cnesst/i.test(msg)) v='CNESST';
          else if (/voiture|route|saaq/i.test(msg)) v='SAAQ';
          else if (/non|aucun|pas/i.test(msg)) v='none';
        }
        else if (pendingField==='service') {
          // Extraire le service depuis la réponse libre
          const svcMap: [RegExp,string][] = [
            [/prise\s+de\s+sang|analyse|labo|prélève/i,'prelevement'],
            [/physio/i,'physiotherapie'],
            [/médecin|famille|docteur/i,'medecin_famille'],
            [/pédiatr|enfant|bébé/i,'pediatrie'],
            [/urgence|urgent/i,'urgence'],
            [/psycholog/i,'psychologie'],
            [/nutri/i,'nutrition'],
            [/prescription|ordonnance/i,'prescription'],
          ];
          for (const [re,svc] of svcMap) { if (re.test(msg)) { v=svc; break; } }
        }
        else if (pendingField==='has_requisition') {
          if (/^(oui|yes|absolument|bien sûr|j'ai|effectivement)/i.test(msg)) v='oui';
          else if (/^(non|no|pas|aucun|je n'ai pas)/i.test(msg)) v='non';
          else if (msg.split(' ').length<=3) v=msg;
        }
        else if (pendingField==='preparation_info') { v=msg; }
        else if (pendingField==='body_side') {
          if (/droit|right|أيمن/i.test(msg)) v='droit';
          else if (/gauche|left|أيسر/i.test(msg)) v='gauche';
          else if (/deux|both|كلا/i.test(msg)) v='les deux';
          else v=msg;
        }
        else if (pendingField==='injury_onset') { v=msg; }
        else if (pendingField==='daily_limitation') { v=msg; }
        else if (pendingField==='functional_limit') { v=msg; }
        if (v) { const fu={[pendingField]:{value:v,status:'confirmed' as const}}; newState=applyUpdates(newState,fu as any); Object.assign(updates,fu); }
      }
    }

    const justField = (Object.keys(updates) as (keyof VitaraState)[]).find(k=>(updates[k] as any)?.status==='confirmed');
    const justVal   = justField ? ((updates[justField] as any)?.value||'') : '';

    // Sauvegarder en background (non-bloquant)
    const agentName = agent.charAt(0).toUpperCase()+agent.slice(1);
    if (justField) saveAsync(session_id, newState, agent, agentName, language);

    const step = nextStep(newState);

    if (step.type==='slots') {
      const slots=buildSlots(newState);
      const speak=language==='ar'?`إليك 3 مواعيد مع ${slots[0].provider}. أيها يناسبك؟`
                 :language==='en'?`Here are 3 available slots with ${slots[0].provider}. Which works for you?`
                 :`Voici 3 créneaux disponibles avec ${slots[0].provider}. Lequel vous convient ?`;
      return NextResponse.json({content:[{type:'text',text:JSON.stringify({speak,intent:'slots',state:{},slots,booking:null})}],conversation_state:newState,session_id,model:'local'});
    }

    const ack=justField?buildAck(justField,justVal,language):'';
    let question=language==='en'?(step as any).en:language==='ar'?(step as any).ar:(step as any).fr;
    if (phoneNew&&newState.full_name?.value) question=`Rebonjour ${newState.full_name.value.split(' ')[0]}! J'ai retrouvé votre dossier. ${question}`;
    const speak=[ack,question].filter(Boolean).join(' ');

    return NextResponse.json({
      content:[{type:'text',text:JSON.stringify({speak,intent:'intake',state:{},slots:null,booking:null})}],
      conversation_state:newState, session_id, model:'server',
      next_field:step.field, _pending_field:step.field,
    });
  } catch(err) {
    const fb='{"speak":"Erreur réseau. Veuillez réessayer.","intent":"error","state":{},"slots":null,"booking":null}';
    return NextResponse.json({content:[{type:'text',text:fb}],code:'SERVER_ERROR'});
  }
}
