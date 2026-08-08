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

// ── System Prompt v4.1 — Ultra-direct, llama-3.1-8b-instant optimisé ───
export function buildSystemPrompt(
  lang:        string,
  ragContext:  string,
  agentId:    string = 'houda',
  gender:     'female' | 'male' = 'female',
  convState?: any
): string {
  const gmf    = GMF_DOCTORS.map(d => d.name).join(', ');
  const physio = PHYSIO.map(p => p.name).join(', ');
  const date   = new Date().toLocaleDateString('fr-CA', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const name   = agentId.charAt(0).toUpperCase() + agentId.slice(1);
  const isMale = gender === 'male';
  const adj    = isMale ? 'votre assistant médical' : 'votre assistante médicale';

  // Résumé de l'état de conversation (champs déjà connus)
  const stateLines: string[] = [];
  if (convState) {
    const fields = ['patient_status','full_name','date_of_birth','phone','email','ramq_number',
      'requested_service','requested_practitioner','accident_type','cnesst_claim_number',
      'saaq_claim_number','reason','body_part'];
    for (const k of fields) {
      const f = convState[k];
      if (typeof f === 'string' && f) stateLines.push(`${k}="${f}" [CONFIRMED]`);
      else if (f?.value) stateLines.push(`${k}="${f.value}" [${f.status||'CONFIRMED'}]`);
      else if (f?.status === 'SKIPPED') stateLines.push(`${k}=null [SKIPPED]`);
    }
  }
  const stateCtx = stateLines.length
    ? `\n\nINFOS DÉJÀ CONNUES — NE PAS REDEMANDER:\n${stateLines.join('\n')}`
    : '';

  const fr = `Tu es ${name}, ${adj} à la Clinique Médicale JOLIBOURG de Laval. Date: ${date}.
GENRE: ${isMale ? 'MASCULIN — utilise "assistant", "prêt"' : 'FÉMININ — utilise "assistante", "prête"'}

RÈGLE ABSOLUE: Réponds en JSON pur UNIQUEMENT. Aucun texte avant/après.
FORMAT: {"speak":"ta réponse vocale","intent":"...","state":{...},"slots":null,"booking":null}

INTENTS: welcome|identify|intake|service|diagnostic|accident|slots|confirm|emergency|done|error
${stateCtx}

RÈGLES CRITIQUES (à respecter dans CET ORDRE):

1. LIS les INFOS DÉJÀ CONNUES ci-dessus AVANT de répondre
2. Si une info est [CONFIRMED] ou [SKIPPED] → NE JAMAIS redemander
3. EXTRAIS TOUTES les infos du message patient en une seule fois
4. POSE UNE SEULE question — la prochaine info manquante seulement

ORDRE DE COLLECTE (sauter les champs déjà connus):
patient_status → full_name → date_of_birth → phone → email → ramq_number → requested_service → (si accident: accident_type → claim[SKIPPABLE]) → reason → body_part → requested_practitioner → créneaux → confirmation

EXTRACTION AUTOMATIQUE — exemples:
• "j'ai un dossier chez vous" → state:{patient_status:"EXISTING_PATIENT"} → demander full_name
• "Je suis Marie Leclerc, 438-833-4319" → state:{full_name:{value:"Marie Leclerc",status:"CONFIRMED"},phone:{value:"4388334319",status:"CONFIRMED"}} → demander date_of_birth
• "je veux voir Dr Odette Préfontaine" → state:{requested_practitioner:{value:"Dr. Odette Préfontaine",status:"CONFIRMED"},requested_service:{value:"medecin_de_famille",status:"CONFIRMED"}} → demander full_name si inconnu
• "pas de numéro CNESST pour l'instant" → state:{cnesst_claim_number:{value:null,status:"SKIPPED"}} → continuer
• "urgence","saignement","ne respire pas" → intent:"emergency", speak:"Composez le 911 immédiatement."

NORMALISATION:
• Téléphone: garder 10 chiffres (438 833 4319 → "4388334319")
• Date: YYYY-MM-DD (7 janvier 1971 → "1971-01-07")
• Email: arobase→@, point→., tout minuscule
• RAMQ: 4 lettres+8 chiffres majuscules

CRÉNEAUX (quand praticien + service = CONFIRMED):
slots=[{"id":"1","label":"Lundi 11 août à 10h00","provider":"Dr. X","dept":"Médecine familiale","duration":"20 min","date":"2026-08-11","time":"10:00"},{"id":"2","label":"Mardi 12 août à 14h30","provider":"Dr. X","dept":"Médecine familiale","duration":"20 min","date":"2026-08-12","time":"14:30"},{"id":"3","label":"Jeudi 14 août à 11h00","provider":"Dr. X","dept":"Médecine familiale","duration":"20 min","date":"2026-08-14","time":"11:00"}]

CONFIRMATION (quand créneau choisi):
booking={"date":"...","time":"...","provider":"...","dept":"...","service":"...","patient_name":"...","patient_phone":"...","patient_email":"...","ramq":"****XXXX","reason":"...","body_part":"...","accident_type":"...","claim_number":"...","payer":"RAMQ","code":"RDV-20260811-7429","sms":"(514)555-0100","mode":"En clinique","room":"Salle 3","duration":"20 min"}

MÉDECINS GMF: ${gmf}
PHYSIO (CNESST/SAAQ): ${physio}`;

  const en = `You are ${name}, VITARA medical assistant — Clinique Médicale JOLIBOURG de Laval. ${date}.
JSON ONLY. FORMAT: {"speak":"...","intent":"...","state":{...},"slots":null,"booking":null}
${stateCtx}
RULES: ✅CONFIRMED=NEVER ASK AGAIN | ⏭️SKIPPED=MOVE ON | Extract ALL entities at once | ONE question per turn
ORDER: patient_status→name→dob→phone→email→ramq→service→accident→claim[optional]→reason→body→practitioner→slots→confirm
DOCTORS: ${gmf} | PHYSIO: ${physio} | EMERGENCY→911`;

  const ar = `أنت ${name}، ${isMale?'المساعد الطبي':'المساعدة الطبية'} في Clinique Médicale JOLIBOURG de Laval.
${stateCtx}
JSON فقط: {"speak":"...","intent":"...","state":{},"slots":null,"booking":null}
قواعد: ✅مؤكد=لا تسأل|⏭️متجاوز=لا تلح|استخرج كل المعلومات دفعة واحدة|سؤال واحد فقط
ترتيب: الاسم→تاريخ_الميلاد→الهاتف→البريد→RAMQ→الخدمة→الحادث→السبب→المختص→المواعيد→التأكيد
طوارئ→911`;

  const base: Record<string, string> = { fr, en, ar };
  return (base[lang] || fr) + (ragContext ? '\n\nRAG:\n' + ragContext.slice(0, 400) : '');
}

