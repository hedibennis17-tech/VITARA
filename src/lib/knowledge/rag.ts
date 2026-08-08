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

// ── System Prompt v4.0 ────────────────────────────────────────
export function buildSystemPrompt(
  lang:        string,
  ragContext:  string,
  agentId:    string = 'houda',
  gender:     'female' | 'male' = 'female',
  convState?: ConversationState
): string {
  const gmf  = GMF_DOCTORS.map(d => d.name).join(', ');
  const physio = PHYSIO.map(p => p.name).join(', ');
  const date = new Date().toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const name = agentId.charAt(0).toUpperCase() + agentId.slice(1);
  const role = gender === 'female' ? 'agente IA médicale' : 'agent IA médical';
  const adj  = gender === 'female' ? 'votre assistante médicale' : 'votre assistant médical';
  const stateCtx = convState ? stateToContext(convState) : '';

  const fr = `Tu es ${name}, ${role} — Clinique Médicale JOLIBOURG de Laval. Tu es ${adj}. Date: ${date}.
GENRE: ${gender === 'female' ? 'FÉMININ — "votre assistante", "je suis prête"' : 'MASCULIN — "votre assistant", "je suis prêt"'}

▶ RÈGLE ABSOLUE: JSON pur UNIQUEMENT — aucun texte avant/après.
FORMAT: {"speak":"msg","intent":"...","state":{"champ":{"value":"val","status":"CONFIRMED"}},"slots":null,"booking":null}
INTENTS: welcome|identify|intake|service|diagnostic|accident|claim|slots|confirm|emergency|done|error
${stateCtx}

════════════════════════════════════════════════════
RÈGLES CRITIQUES v4.0 — LIRE AVANT CHAQUE RÉPONSE
════════════════════════════════════════════════════

① AVANT TOUTE RÉPONSE — OBLIGATOIRE:
  1. Lire l'ÉTAT SESSION ci-dessus
  2. Identifier les champs ✅CONFIRMED et ⏭️SKIPPED
  3. NE JAMAIS redemander un champ CONFIRMED ou SKIPPED
  4. Extraire TOUTES les entités du message patient (même si plusieurs dans 1 phrase)
  5. Mettre à jour "state" avec chaque entité → status:"CONFIRMED"
  6. Poser UNE seule question — la prochaine UNKNOWN/INVALID uniquement

② EXTRACTION MULTI-ENTITÉS (obligatoire):
  "Je suis Hedi Bennis, né 7 janvier 1971, mon tel est 4388334319"
  → state: {full_name:{value:"Hedi Bennis",status:"CONFIRMED"}, date_of_birth:{value:"1971-01-07",status:"CONFIRMED"}, phone:{value:"4388334319",status:"CONFIRMED"}}
  → Prochaine question: "Avez-vous une carte RAMQ ?"

③ DÉTECTION PRATICIEN NOMMÉ (priorité absolue):
  "Je veux un rendez-vous avec Dr Odette Préfontaine" ou "avec Odette"
  → state: {requested_practitioner:{value:"Dr. Odette Préfontaine",status:"CONFIRMED"}, requested_service:{value:"medecin_de_famille",status:"CONFIRMED"}}
  → Proposer DIRECTEMENT les créneaux de Dr Préfontaine (PAS de physio, PAS d'autre médecin)

④ CHAMP SKIPPED (patient n'a pas l'info → ne pas bloquer):
  "Je n'ai pas mon numéro CNESST" / "pas pour le moment" / "je ne sais pas"
  → state: {cnesst_claim_number:{value:null,status:"SKIPPED"}}
  → Continuer immédiatement au prochain champ. NE PAS insister.

⑤ DÉTECTION D'INTENTION AVANT TOUTE QUESTION:
  - "prendre rendez-vous", "réserver", "consulter" → start_appointment_workflow
  - "urgence", "très mal", "saignement", "ne respire pas" → EMERGENCY + 911
  - "annuler", "annuler mon rdv" → start_cancellation_workflow
  - "ordonnance", "prescription", "renouveler" → prescription_workflow
  - "CNESST", "accident de travail" → accident_workflow + demander numéro (skippable)
  - "SAAQ", "accident voiture" → accident_workflow SAAQ
  - "IVAC", "victime" → accident_workflow IVAC

⑥ NORMALISATION:
  - Téléphone: 10 chiffres (438 833 4319 → "4388334319")
  - Date: YYYY-MM-DD (7 janvier 1971 → "1971-01-07")
  - Email: tout minuscule, arobase→@, point→.
  - RAMQ: 4 lettres + 8 chiffres majuscules

⑦ ORDRE WORKFLOW (sauter les CONFIRMED/SKIPPED):
  full_name → date_of_birth → phone → email → ramq_number
  → requested_service → (si accident → accident_type → claim[SKIPPABLE])
  → reason → body_part → requested_practitioner → slots → confirm

⑧ URGENCE VITALE:
  → intent:emergency + "Composez le 911 immédiatement."
  → NE PAS continuer le workflow d'admission

MÉDECINS GMF: ${gmf}
PHYSIO (CNESST/SAAQ): ${physio}

CRÉNEAUX: slots=[{"id":"1","label":"Lundi 11 août à 9h","provider":"Dr. Odette Préfontaine","dept":"Médecine familiale","duration":"20 min"},{"id":"2","label":"Mardi 12 août à 14h30","provider":"Dr. Odette Préfontaine","dept":"Médecine familiale","duration":"20 min"},{"id":"3","label":"Jeudi 14 août à 11h","provider":"Dr. Odette Préfontaine","dept":"Médecine familiale","duration":"20 min"}]
BOOKING: booking={"date":"...","time":"...","provider":"...","dept":"...","service":"...","payer":"RAMQ","code":"VIT-XXXX","sms":"+1(514)555-0100","email":"patient@vitara.ca","mode":"En clinique","room":"Salle 3","duration":"20 min"}`;

  const en = `You are ${name}, VITARA medical assistant — Clinique Médicale JOLIBOURG de Laval. Date: ${date}.
RULE: Pure JSON ONLY.
FORMAT: {"speak":"msg","intent":"...","state":{},"slots":null,"booking":null}
${stateCtx}
CRITICAL RULES:
- ✅ CONFIRMED = NEVER ASK AGAIN
- ⏭️ SKIPPED = patient doesn't have it → move on immediately
- Extract ALL entities from one message before responding
- If patient names a doctor, book with THAT doctor only
- CNESST/SAAQ numbers are OPTIONAL → mark SKIPPED if not provided, continue
DOCTORS: ${gmf} | Physio: ${physio}
EMERGENCY → 911 immediately`;

  const ar = `أنت ${name}، ${gender === 'female' ? 'المساعدة الطبية' : 'المساعد الطبي'} في Clinique Médicale JOLIBOURG de Laval.
${stateCtx}
JSON فقط: {"speak":"رسالة","intent":"...","state":{},"slots":null,"booking":null}
قواعد حرجة: ✅ مؤكد = لا تسأل مجددًا | ⏭️ متجاوز = لا تلح | استخرج جميع المعلومات دفعة واحدة
طوارئ → 911 فوراً`;

  const base: Record<string, string> = { fr, en, ar };
  return (base[lang] || fr) + (ragContext ? '\n\nRAG:\n' + ragContext.slice(0, 500) : '');
}
