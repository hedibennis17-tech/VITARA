// ── VITARA Conversation State Engine v3.0 ────────────────────
export type FieldStatus = 'UNKNOWN'|'COLLECTED'|'CONFIRMED'|'INVALID'|'AMBIGUOUS'|'UPDATED';
export interface Field { value:string|null; status:FieldStatus; }

export interface ConversationState {
  language:            string|null;
  patient_status:      string|null;
  full_name:           Field;
  date_of_birth:       Field;
  phone:               Field;
  email:               Field;
  ramq_number:         Field;
  service:             Field;
  reason:              Field;
  body_part:           Field;
  symptoms:            Field;
  accident_type:       Field;
  cnesst_claim_number: Field;
  saaq_claim_number:   Field;
  private_insurance:   Field;
  appointment_date:    string|null;
  appointment_time:    string|null;
  practitioner_id:     string|null;
}

export const INITIAL_STATE: ConversationState = {
  language:null, patient_status:null,
  full_name:           {value:null,status:'UNKNOWN'},
  date_of_birth:       {value:null,status:'UNKNOWN'},
  phone:               {value:null,status:'UNKNOWN'},
  email:               {value:null,status:'UNKNOWN'},
  ramq_number:         {value:null,status:'UNKNOWN'},
  service:             {value:null,status:'UNKNOWN'},
  reason:              {value:null,status:'UNKNOWN'},
  body_part:           {value:null,status:'UNKNOWN'},
  symptoms:            {value:null,status:'UNKNOWN'},
  accident_type:       {value:null,status:'UNKNOWN'},
  cnesst_claim_number: {value:null,status:'UNKNOWN'},
  saaq_claim_number:   {value:null,status:'UNKNOWN'},
  private_insurance:   {value:null,status:'UNKNOWN'},
  appointment_date:null, appointment_time:null, practitioner_id:null,
};

export const FIELD_KEYS = [
  'full_name','date_of_birth','phone','email','ramq_number',
  'service','reason','body_part','symptoms','accident_type',
  'cnesst_claim_number','saaq_claim_number','private_insurance',
] as const;

// Résumé de l'état pour le system prompt — seulement les champs connus
export function stateToContext(state: ConversationState): string {
  const lines: string[] = [];
  if (state.patient_status) lines.push(`patient_status: ${state.patient_status} [CONFIRMED]`);
  if (state.language)       lines.push(`language: ${state.language}`);
  for (const k of FIELD_KEYS) {
    const f = state[k] as Field;
    if (f?.value) lines.push(`${k}: "${f.value}" [${f.status}]`);
  }
  if (!lines.length) return '';
  return '\n\nÉTAT_SESSION (NE PAS REDEMANDER les champs CONFIRMED):\n' + lines.join('\n');
}

// Fusionner les mises à jour retournées par l'IA
export function mergeState(cur: ConversationState, upd: Partial<ConversationState>): ConversationState {
  const m = { ...cur };
  for (const [k, v] of Object.entries(upd)) {
    if (v === null || v === undefined) continue;
    const existing = (cur as any)[k];
    // Ne pas écraser CONFIRMED sauf si status=UPDATED
    if (existing?.status === 'CONFIRMED' && (v as Field)?.status !== 'UPDATED') continue;
    (m as any)[k] = v;
  }
  return m;
}
