// ── VITARA Conversation State Engine v4.0 ────────────────────
// Spec: vitara_v4_workflow.json

export type FieldStatus =
  | 'UNKNOWN'    // peut être posé
  | 'COLLECTED'  // existe, confirmer si nécessaire
  | 'CONFIRMED'  // ✅ NEVER ASK AGAIN
  | 'SKIPPED'    // patient n'a pas l'info → ne pas redemander
  | 'INVALID'    // demander une nouvelle valeur
  | 'AMBIGUOUS'  // demander clarification uniquement
  | 'UPDATED';   // nouvelle valeur après confirmation

export interface Field { value: string | null; status: FieldStatus; }

export interface ConversationState {
  session_id:            string | null;
  language:              string | null;
  patient_status:        string | null;  // NEW_PATIENT | EXISTING_PATIENT
  // Identité
  full_name:             Field;
  date_of_birth:         Field;
  phone:                 Field;
  email:                 Field;
  ramq_number:           Field;
  // Assurances
  accident_type:         Field;  // CNESST | SAAQ | IVAC | NONE
  cnesst_claim_number:   Field;
  saaq_claim_number:     Field;
  ivac_claim_number:     Field;
  private_insurance:     Field;
  // Service / Intent
  requested_service:     Field;  // medecin_de_famille|physiotherapie|pediatrie|...
  requested_practitioner:Field;  // nom du médecin demandé explicitement
  reason:                Field;
  body_part:             Field;
  symptoms:              Field;
  urgency_level:         Field;
  // Rendez-vous
  appointment_date:      string | null;
  appointment_time:      string | null;
  practitioner_id:       string | null;
  // Meta
  last_question_asked:   string | null;
  conversation_turn:     number;
}

export const INITIAL_STATE: ConversationState = {
  session_id: null, language: null, patient_status: null,
  full_name:              { value: null, status: 'UNKNOWN' },
  date_of_birth:          { value: null, status: 'UNKNOWN' },
  phone:                  { value: null, status: 'UNKNOWN' },
  email:                  { value: null, status: 'UNKNOWN' },
  ramq_number:            { value: null, status: 'UNKNOWN' },
  accident_type:          { value: null, status: 'UNKNOWN' },
  cnesst_claim_number:    { value: null, status: 'UNKNOWN' },
  saaq_claim_number:      { value: null, status: 'UNKNOWN' },
  ivac_claim_number:      { value: null, status: 'UNKNOWN' },
  private_insurance:      { value: null, status: 'UNKNOWN' },
  requested_service:      { value: null, status: 'UNKNOWN' },
  requested_practitioner: { value: null, status: 'UNKNOWN' },
  reason:                 { value: null, status: 'UNKNOWN' },
  body_part:              { value: null, status: 'UNKNOWN' },
  symptoms:               { value: null, status: 'UNKNOWN' },
  urgency_level:          { value: null, status: 'UNKNOWN' },
  appointment_date: null, appointment_time: null, practitioner_id: null,
  last_question_asked: null, conversation_turn: 0,
};

export const FIELD_KEYS = [
  'full_name','date_of_birth','phone','email','ramq_number',
  'accident_type','cnesst_claim_number','saaq_claim_number','ivac_claim_number',
  'private_insurance','requested_service','requested_practitioner',
  'reason','body_part','symptoms','urgency_level',
] as const;

// Résumé compact pour le system prompt
export function stateToContext(state: ConversationState): string {
  const lines: string[] = [];
  if (state.patient_status) lines.push(`patient_status: ${state.patient_status}`);
  if (state.language)       lines.push(`language: ${state.language}`);
  for (const k of FIELD_KEYS) {
    const f = state[k] as Field;
    if (!f?.value && f?.status === 'UNKNOWN') continue;
    const statusIcon = f.status === 'CONFIRMED' ? '✅' : f.status === 'SKIPPED' ? '⏭️' : '📋';
    lines.push(`${statusIcon} ${k}: ${f.value ? `"${f.value}"` : 'N/A'} [${f.status}]`);
  }
  if (!lines.length) return '';
  return '\n\n╔═ ÉTAT SESSION (✅CONFIRMED = JAMAIS REDEMANDER | ⏭️SKIPPED = NE PAS INSISTER) ═╗\n' +
    lines.join('\n') + '\n╚══════════════════════════════════════════════════════════════════╝';
}

// Fusionner sans écraser CONFIRMED/SKIPPED sauf si UPDATED
export function mergeState(cur: ConversationState, upd: Partial<ConversationState>): ConversationState {
  const m = { ...cur, conversation_turn: (cur.conversation_turn || 0) + 1 };
  for (const [k, v] of Object.entries(upd)) {
    if (v === null || v === undefined) continue;
    const existing = (cur as any)[k];
    if (existing?.status === 'CONFIRMED' && (v as Field)?.status !== 'UPDATED') continue;
    if (existing?.status === 'SKIPPED'   && (v as Field)?.status !== 'UPDATED') continue;
    (m as any)[k] = v;
  }
  return m;
}
