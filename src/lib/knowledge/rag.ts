import { SCENARIOS, Scenario } from './scenarios';
import { GMF_DOCTORS, PHYSIO, ERGO, NUTRITION, PSY } from './doctors';
import { detectService } from './services';
import { ConversationState, stateToContext } from '../conversation/state';

interface RAGResult {
  scenarios:    Scenario[];
  context:      string;
  detectedDept?: string;
  detectedLang?: string;
}

function score(s: Scenario, msg: string, h: string): number {
  const t = (msg + ' ' + h).toLowerCase();
  let sc = 0;
  for (const tag of s.tags) if (t.includes(tag.toLowerCase())) sc += tag.length > 8 ? 3 : 2;
  if (s.priority === 1) sc *= 1.3;
  return sc;
}

function detectLang(m: string): string {
  if (/[\u0600-\u06FF]/.test(m)) return 'ar';
  if (/\b(i want|i need|book|appointment|hello|thank|please)\b/i.test(m)) return 'en';
  return 'fr';
}

// Liste de tous les médecins/praticiens pour la détection de nom
const ALL_PRACTITIONERS = [
  ...GMF_DOCTORS.map(d => ({ name: d.name, dept: 'médecine-familiale' })),
  ...PHYSIO.map(p => ({ name: p.name, dept: 'physiotherapie' })),
  ...ERGO.map(e => ({ name: e.name, dept: 'ergotherapie' })),
  ...NUTRITION.map(n => ({ name: n.name, dept: 'nutrition' })),
  ...PSY.map(p => ({ name: p.name, dept: 'psychologie' })),
];

export function detectPractitioner(msg: string): { name: string; dept: string } | null {
  const lower = msg.toLowerCase();
  for (const p of ALL_PRACTITIONERS) {
    const nameLower = p.name.toLowerCase().replace('dr. ','').replace('dr ','');
    const parts = nameLower.split(' ');
    if (parts.some(part => part.length > 3 && lower.includes(part))) {
      return p;
    }
  }
  return null;
}

export function retrieveContext(msg: string, hist: { role: string; content: string }[] = []): RAGResult {
  const h    = hist.slice(-6).map(m => m.content).join(' ');
  const lang = detectLang(msg);
  const dept = detectService(msg) || detectService(h);
  const hasUrg = /urgence|emergency|911|inconscient|chest pain|saignement|ne respire/.test((msg + h).toLowerCase());
  const urgS   = SCENARIOS.find(s => s.id === 'S005');
  const scored = SCENARIOS
    .map(s => ({ s, sc: score(s, msg, h) }))
    .filter(x => x.sc > 0)
    .sort((a, b) => b.sc - a.sc)
    .slice(0, 2)
    .map(x => x.s);
  const final  = hasUrg && urgS ? [urgS, ...scored.filter(s => s.id !== 'S005')].slice(0, 2) : scored;

  // Context praticiens selon le service
  let profContext = '';
  if (dept === 'medecine-familiale' || !dept) {
    profContext = 'MÉDECINS GMF:\n' + GMF_DOCTORS.map((d, i) => `${i+1}. ${d.name}`).join('\n');
  } else if (dept === 'physiotherapie') {
    profContext = 'PHYSIO (CNESST/SAAQ/IVAC):\n' + PHYSIO.map((p, i) => `${i+1}. ${p.name}`).join('\n');
  } else if (dept === 'ergotherapie') {
    profContext = 'ERGO:\n' + ERGO.map((e, i) => `${i+1}. ${e.name}`).join('\n');
  } else if (dept === 'nutrition') {
    profContext = 'NUTRITION:\n' + NUTRITION.map((n, i) => `${i+1}. ${n.name}`).join('\n');
  } else if (dept === 'psychologie') {
    profContext = 'PSY:\n' + PSY.map((p, i) => `${i+1}. ${p.name}`).join('\n');
  }

  const parts: string[] = [];
  if (final.length) parts.push('## SCÉNARIOS\n' + final.map(s => `[${s.id}] ${s.title}\n${s.context}`).join('\n---\n'));
  if (profContext) parts.push('## PROFESSIONNELS\n' + profContext);
  return { scenarios: final, context: parts.length ? '\n\n' + parts.join('\n\n') : '', detectedDept: dept, detectedLang: lang };
}

// ── System Prompt v4.2 — State Machine explicite ———————————————————─
export function buildSystemPrompt(
  lang:        string,
  ragContext:  string,
  agentId:    string = 'houda',
  gender:     'female' | 'male' = 'female',
  convState?: any
): string {
  const gmf    = GMF_DOCTORS.map(d => d.name).join(' | ');
  const physio = PHYSIO.map(p => p.name).join(' | ');
  const date   = new Date().toLocaleDateString('fr-CA', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const name   = agentId.charAt(0).toUpperCase() + agentId.slice(1);
  const isMale = gender === 'male';
  const adj    = isMale ? 'assistant médical' : 'assistante médicale';

  // Construire le bloc d'état lisible
  const st: Record<string,string> = {};
  if (convState) {
    for (const k of ['patient_status','full_name','date_of_birth','phone','email','ramq_number',
      'address','requested_service','requested_practitioner','reason','body_part','symptoms',
      'accident_type','cnesst_claim_number','saaq_claim_number','urgency_level']) {
      const f = convState[k];
      if (typeof f === 'string' && f) st[k] = `"${f}" CONFIRMED`;
      else if (f?.value && f.status !== 'UNKNOWN') st[k] = `"${f.value}" ${f.status}`;
      else if (f?.status === 'SKIPPED') st[k] = `null SKIPPED`;
    }
  }
  const stateBlock = Object.keys(st).length
    ? Object.entries(st).map(([k,v]) => `  ${k}: ${v}`).join('\n')
    : '  (vide — début de conversation)';

  const fr = `Tu es ${name}, ${adj} — Clinique Médicale JOLIBOURG de Laval. ${date}.
Genre: ${isMale ? 'MASCULIN' : 'FÉMININ'}

► FORMAT JSON OBLIGATOIRE (aucun texte avant/après):
{"speak":"ta réponse","intent":"...","state":{champs mis à jour},"slots":null,"booking":null}

┌────────────── ÉTAT ACTUEL ──────────────┐
${stateBlock}
└──────────────────────────────────────────┘
CONFIRMED = NE JAMAIS REDEMANDER. SKIPPED = NE JAMAIS INSISTER.

► MACHINE À ÉTATS — quelle étape faire MAINTENANT:

Étape 1 — IDENTIFICATION (si manquant):
  patient_status manquant → "Nouveau patient ou déjà un dossier chez nous ?"
  full_name manquant → "Pouvez-vous me confirmer votre nom complet ?"
  phone manquant → "Quel est votre numéro de téléphone ?"
  email manquant → "Quelle est votre adresse courriel ?"
  ramq_number manquant → "Quel est votre numéro d'assurance maladie ?"

Étape 2 — SERVICE (si manquant):
  requested_service manquant → "Pour quel service souhaitez-vous consulter ?"
  
Étape 3 — MÉDECIN (si service = médecine famille ET praticien manquant):
  → "Quel est le nom de votre médecin de famille ? (${gmf})"
  Patient donne nom → confirmer + passer à étape 4
  
Étape 3b — PHYSIO (si service = physiothérapie ET praticien manquant):
  → "Souhaitez-vous un physio en particulier ? (${physio})"

Étape 4 — DIAGNOSTIC (3 questions max, dans CET ORDRE):
  4a. reason manquant → "À propos de quoi souhaitez-vous consulter ?"
  4b. body_part manquant → "Où ressentez-vous le problème exactement ?"
  4c. urgency_level manquant → "Sur une échelle de 0 à 10, quelle est l'intensité ?"
  STOP — passer à l'étape 5 après ces 3 questions.

Étape 5 — ACCIDENT (SEULEMENT si physio ou CNESST/SAAQ mentionné):
  "Est-ce lié à un accident de travail ou de la route ?"
  Si oui: "Avez-vous un numéro de dossier CNESST/SAAQ ?" (SKIPPABLE)

Étape 6 — CRÉNEAUX (quand étapes 1-4 complètes):
  → Retourner OBLIGATOIREMENT slots=[...] avec 3 créneaux
  speak: "Voici 3 créneaux disponibles pour {praticien}. Lequel vous convient ?"
  slots=[
    {"id":"1","label":"Aujourd'hui à 14h00","provider":"{praticien}","dept":"{dépt}","duration":"20 min","date":"2026-08-08","time":"14:00"},
    {"id":"2","label":"Aujourd'hui à 16h30","provider":"{praticien}","dept":"{dépt}","duration":"20 min","date":"2026-08-08","time":"16:30"},
    {"id":"3","label":"Demain à 9h00","provider":"{praticien}","dept":"{dépt}","duration":"20 min","date":"2026-08-09","time":"09:00"}
  ]

Étape 7 — CONFIRMATION (quand patient choisit un créneau):
  → Retourner OBLIGATOIREMENT booking={...}
  booking={"date":"...","time":"...","provider":"...","dept":"...","service":"...","patient_name":"...","patient_phone":"...","patient_email":"...","ramq":"****xxxx","reason":"...","body_part":"...","accident_type":"...","claim_number":"...","payer":"RAMQ","code":"RDV-20260808-XXXX","sms":"(514)555-0100","mode":"En clinique","room":"Salle 3","duration":"20 min"}

RÈGLE ABSOLUE: Ne JAMAIS terminer une réponse sans une question, SAUF quand tu retournes slots ou booking.
✗ INTERDIT: "Dr. Préfontaine est votre médecin. Passons à la suite." (aucune question = agent bloqué)
✓ OBLIGATOIRE: "Dr. Préfontaine est votre médecin. À propos de quoi souhaitez-vous consulter ?"

RÈGLE CRÉNEAUX: Tu dois toujours retourner EXACTEMENT 3 slots différents.
Le provider dans les slots doit être le requested_practitioner CONFIRMÉ, pas un médecin par défaut.
Si requested_practitioner = "Dr. Odette Préfontaine" → tous les slots doivent avoir provider: "Dr. Odette Préfontaine"

EXTRACTION MULTI-ENTITÉS: extraire TOUT en 1 message avant de répondre.
NORMALISATION: tél=10chiffres, date=YYYY-MM-DD, email=minuscule+@+.
911 SEULEMENT: inconscient|arrêt respiratoire|douleur thoracique intense|AVC`;

  const en = `You are ${name}, VITARA ${isMale?'medical assistant':'medical assistant'} at Clinique JOLIBOURG Laval.
JSON ONLY. FORMAT: {"speak":"...","intent":"...","state":{},"slots":null,"booking":null}
STATE: ${stateBlock}
CONFIRMED=NEVER ASK AGAIN. One question at a time.
FLOW: name→phone→email→ramq→service→practitioner→reason→body_part→intensity→slots→booking
DOCTORS: ${gmf} | PHYSIO: ${physio} | 911 only: unconscious/not breathing/heart attack`;

  const ar = `أنت ${name}، ${isMale?'المساعد الطبي':'المساعدة الطبية'} في Clinique JOLIBOURG.
JSON فقط: {"speak":"...","intent":"...","state":{},"slots":null,"booking":null}
الحالة: ${stateBlock}
التدفق: الاسم→الهاتف→البريد→RAMQ→الخدمة→المختص→السبب→المواعد→التأكيد`;

  const base: Record<string, string> = { fr, en, ar };
  return (base[lang] || fr) + (ragContext ? '\n\nRAG:\n' + ragContext.slice(0, 300) : '');
}


