import { SCENARIOS, Scenario } from './scenarios';
import { GMF_DOCTORS, PHYSIO, ERGO, NUTRITION, PSY } from './doctors';
import { getServiceById, detectService } from './services';
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
  for (const tag of s.tags) {
    if (t.includes(tag.toLowerCase())) sc += tag.length > 8 ? 3 : tag.length > 4 ? 2 : 1;
  }
  if (s.priority === 1) sc *= 1.3;
  return sc;
}

function detectLang(m: string): string {
  if (/[\u0600-\u06FF]/.test(m)) return 'ar';
  if (/\b(i want|i need|book|appointment|help|please|hello|hi|thank)\b/i.test(m)) return 'en';
  return 'fr';
}

function docCtx(dept: string, l: string): string {
  switch (dept) {
    case 'medecine-familiale': return 'MÉDECINS GMF:\n' + GMF_DOCTORS.map((d,i) => `${i+1}. ${d.name}${d.lang.includes(l) ? ' ['+l+']' : ''}`).join('\n');
    case 'physiotherapie':     return 'PHYSIO:\n' + PHYSIO.map((p,i) => `${i+1}. ${p.name} CNESST:${p.acceptsCNESST?'oui':'non'} SAAQ:${p.acceptsSAAQ?'oui':'non'}`).join('\n');
    case 'ergotherapie':       return 'ERGO:\n' + ERGO.map((e,i) => `${i+1}. ${e.name}`).join('\n');
    case 'nutrition':          return 'NUTRITION:\n' + NUTRITION.map((n,i) => `${i+1}. ${n.name}`).join('\n');
    case 'psychologie':        return 'PSY:\n' + PSY.map((p,i) => `${i+1}. ${p.name} (${p.lang.join('/')})`).join('\n');
    default:                   return '';
  }
}

export function retrieveContext(msg: string, hist: {role:string;content:string}[] = []): RAGResult {
  const h    = hist.slice(-6).map(m => m.content).join(' ');
  const lang = detectLang(msg);
  const dept = detectService(msg) || detectService(h);
  const scored = SCENARIOS
    .map(s => ({ s, sc: score(s, msg, h) }))
    .filter(x => x.sc > 0)
    .sort((a, b) => b.sc - a.sc);
  const top    = scored.slice(0, 2).map(x => x.s);
  const hasUrg = /urgence|emergency|911|inconscient|chest pain/.test((msg + h).toLowerCase());
  const urgS   = SCENARIOS.find(s => s.id === 'S005');
  const final  = hasUrg && urgS ? [urgS, ...top.filter(s => s.id !== 'S005')].slice(0, 2) : top;
  const parts: string[] = [];
  if (final.length) parts.push('## SCÉNARIOS\n' + final.map(s => `[${s.id}] ${s.title}\n${s.context}`).join('\n---\n'));
  if (dept) {
    const dc = docCtx(dept, lang);
    if (dc) parts.push('## PROFESSIONNELS\n' + dc);
  }
  return { scenarios: final, context: parts.length ? '\n\n' + parts.join('\n\n') + '\n' : '', detectedDept: dept, detectedLang: lang };
}

// ── System prompt v3.0 — Conversation Memory + No Repetition ─
export function buildSystemPrompt(
  lang:        string,
  ragContext:  string,
  agentId:    string = 'houda',
  gender:     'female'|'male' = 'female',
  convState?: ConversationState
): string {
  const gmf  = GMF_DOCTORS.map(d => d.name.replace('Dr. ', '')).join(', ');
  const date = new Date().toLocaleDateString('fr-CA', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const name = agentId.charAt(0).toUpperCase() + agentId.slice(1);
  const role = gender === 'female' ? 'agente IA médicale' : 'agent IA médical';
  const adj  = gender === 'female' ? 'votre assistante médicale' : 'votre assistant médical';
  const stateCtx = convState ? stateToContext(convState) : '';

  const base: Record<string, string> = {
    fr: `Tu es ${name}, ${role} de la Clinique Santé Montréal. Tu es ${adj}. Date: ${date}.
GENRE: ${gender === 'female' ? 'FÉMININ — dis "votre assistante", "je suis prête"' : 'MASCULIN — dis "votre assistant", "je suis prêt"'}

RÈGLE ABSOLUE: JSON pur UNIQUEMENT. Aucun texte avant ou après.
FORMAT: {"speak":"msg","intent":"…","state":{},"slots":null,"booking":null}
INTENTS: welcome|identify|intake|service|diagnostic|accident|claim|slots|confirm|emergency|done|error

═══ CONVERSATION MEMORY — RÈGLES CRITIQUES ═══
${stateCtx}

AVANT CHAQUE RÉPONSE — OBLIGATOIRE:
1. Extraire TOUTES les entités du message patient (même si plusieurs dans 1 phrase)
2. Mettre à jour "state" avec chaque entité extraite → status:"CONFIRMED"
3. Vérifier l'état actuel — ne JAMAIS redemander un champ CONFIRMED
4. Identifier le PROCHAIN champ UNKNOWN/INVALID
5. Poser UNE seule question claire

ORDRE WORKFLOW (poser uniquement les UNKNOWN):
patient_status → full_name → date_of_birth → phone → email → ramq_number
→ service → accident? → claim_number → reason → body_part → slots → confirm

NORMALISATION OBLIGATOIRE:
- Téléphone: 10 chiffres seulement (438 833 4319 → "4388334319")
- Date: YYYY-MM-DD (7 janvier 1971 → "1971-01-07")  
- Email: arobase→@, point→., tout minuscule
- RAMQ: 4 lettres+8 chiffres majuscules (ABCD12345678)
- Chiffres épelés: "quatre trois huit" → "438"

EXTRACTION MULTI-ENTITÉS (exemple):
Patient: "Je suis Hedi Bennis, mon tel est 4388334319, je veux de la physio pour mon épaule"
→ state: {full_name:{value:"Hedi Bennis",status:"CONFIRMED"}, phone:{value:"4388334319",status:"CONFIRMED"}, service:{value:"physiotherapie",status:"CONFIRMED"}, body_part:{value:"épaule droite",status:"COLLECTED"}}
→ Prochaine question: confirmation épaule droite/gauche

EN CAS D'ERREUR VOCALE: demander UNIQUEMENT la donnée incomprise. NE JAMAIS recommencer.

URGENCE VITALE: intent:emergency + "Appelez le 911 immédiatement"
CNESST/SAAQ détecté → demander numéro dossier
Suicidaire → "1-866-APPELLE"

MÉDECINS GMF: ${gmf}
PHYSIO (CNESST/SAAQ): Shaheer Haider, Omar Khalil, Sophie Tremblay

CRÉNEAUX: slots=[{"id":"1","label":"Mercredi 13 août à 10h","provider":"Shaheer Haider, PT","dept":"Physiothérapie","duration":"60 min"},{"id":"2",...},{"id":"3",...}]
CONFIRMATION: booking={"date":"...","time":"...","provider":"...","dept":"...","service":"...","payer":"CNESST","code":"VIT-XXXX","sms":"+1(514)555-0100","email":"patient@vitara.ca","mode":"En clinique","room":"Salle 3","duration":"60 min"}`,

    en: `You are ${name}, VITARA medical ${gender === 'female' ? 'assistant (female)' : 'assistant (male)'} — Clinique Santé Montréal. Date: ${date}.
RULE: Pure JSON ONLY.
FORMAT: {"speak":"msg","intent":"…","state":{},"slots":null,"booking":null}
${stateCtx}
CRITICAL: Extract ALL entities from patient message. Never re-ask CONFIRMED fields.
WORKFLOW (UNKNOWN only): patient_status→name→dob→phone→email→ramq→service→accident→claim→reason→body_part→slots→confirm
NORMALIZE: phone=10digits, date=YYYY-MM-DD, email=lowercase
DOCTORS: ${gmf} | Physio(CNESST/SAAQ): Shaheer Haider, Omar Khalil
EMERGENCY→911 | self-harm→crisis line`,

    ar: `أنت ${name}، ${gender === 'female' ? 'المساعدة الطبية الذكية' : 'المساعد الطبي الذكي'} في Clinique Santé Montréal.
${stateCtx}
JSON فقط: {"speak":"رسالة","intent":"…","state":{},"slots":null,"booking":null}
استخرج جميع المعلومات من رسالة المريض. لا تعيد طرح الأسئلة المؤكدة.
طوارئ: 911 | أفكار إيذاء → خط الأزمات`,
  };

  return (base[lang] || base.fr) + (ragContext ? '\n\nRAG:\n' + ragContext.slice(0, 600) : '');
}
