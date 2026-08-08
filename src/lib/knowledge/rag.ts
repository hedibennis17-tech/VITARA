// ============================================================
// VITARA RAG Engine v2 — Workflow 10 étapes + Contexte clinique
// ============================================================

import { SCENARIOS, Scenario } from './scenarios';
import { GMF_DOCTORS, PHYSIO, ERGO, NUTRITION, PSY, SPECIALISTS, formatDoctorList } from './doctors';
import { SERVICES, PAYERS, detectService, getServiceById } from './services';

interface RAGResult {
  scenarios: Scenario[];
  context: string;
  detectedDept?: string;
  detectedLang?: string;
}

function scoreScenario(scenario: Scenario, message: string, history: string): number {
  const text = (message + ' ' + history).toLowerCase();
  let score = 0;
  for (const tag of scenario.tags) {
    if (text.includes(tag.toLowerCase())) {
      score += tag.length > 8 ? 3 : tag.length > 4 ? 2 : 1;
    }
  }
  if (scenario.priority === 1) score *= 1.3;
  return score;
}

function detectLanguage(message: string): string {
  const ar = /[\u0600-\u06FF]/;
  const en = /\b(i want|i need|book|appointment|help|please|hello|hi|thank|my|have|do you|can you)\b/i;
  if (ar.test(message)) return 'ar';
  if (en.test(message)) return 'en';
  return 'fr';
}

function buildDoctorContext(dept: string, lang: string): string {
  let list = '';
  switch (dept) {
    case 'medecine-familiale':
      list = `MÉDECINS DE FAMILLE DISPONIBLES:\n` +
        GMF_DOCTORS.map((d,i) => `${i+1}. ${d.name}${d.lang.includes(lang) ? ' [parle '+lang+']' : ''}`).join('\n');
      break;
    case 'physiotherapie':
      list = `PHYSIOTHÉRAPEUTES DISPONIBLES:\n` +
        PHYSIO.map((p,i) => `${i+1}. ${p.name} — ${p.specialties.join(', ')}${p.acceptsCNESST ? ' | CNESST ✓' : ''}${p.acceptsSAAQ ? ' | SAAQ ✓' : ''}`).join('\n');
      break;
    case 'ergotherapie':
      list = `ERGOTHÉRAPEUTES DISPONIBLES:\n` +
        ERGO.map((e,i) => `${i+1}. ${e.name} — ${e.specialties.join(', ')}`).join('\n');
      break;
    case 'nutrition':
      list = `NUTRITIONNISTES DISPONIBLES:\n` +
        NUTRITION.map((n,i) => `${i+1}. ${n.name} — ${n.specialties.join(', ')}`).join('\n');
      break;
    case 'psychologie':
      list = `PROFESSIONNELS EN SANTÉ MENTALE:\n` +
        PSY.map((p,i) => `${i+1}. ${p.name} — ${p.specialties.join(', ')}`).join('\n');
      break;
    default:
      list = '';
  }
  return list;
}

function buildDiagnosticContext(dept: string, lang: string): string {
  const service = getServiceById(dept);
  if (!service) return '';
  const labelLang = service.label[lang as 'fr'|'en'|'ar'] || service.label.fr;
  const questions = service.diagnosticFlow
    .map((q,i) => `Q${i+1}: ${q.question[lang as 'fr'|'en'|'ar'] || q.question.fr}${q.type === 'choice' && q.options ? '\n   Options: ' + q.options.join(' | ') : ''}`)
    .join('\n');
  const payers = (service.payersAccepted || []).join(' | ');
  return `SERVICE: ${labelLang}\nQUESTIONS DIAGNOSTIQUES À POSER:\n${questions}\nPAYEURS ACCEPTÉS: ${payers}`;
}

export function retrieveContext(
  userMessage: string,
  conversationHistory: {role: string; content: string}[] = []
): RAGResult {
  const historyText = conversationHistory.slice(-6).map(m => m.content).join(' ');
  const detectedLang = detectLanguage(userMessage);
  const detectedDept = detectService(userMessage) || detectService(historyText);

  // Scorer les scénarios
  const scored = SCENARIOS
    .map(s => ({ scenario: s, score: scoreScenario(s, userMessage, historyText) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 2).map(x => x.scenario);

  // Urgence: toujours prioritaire
  const hasUrgence = /urgence|emergency|911|inconscient|chest pain|douleur poitrine|difficultés respiratoires/.test((userMessage + historyText).toLowerCase());
  const urgenceScenario = SCENARIOS.find(s => s.id === 'S005');
  const finalScenarios = hasUrgence && urgenceScenario
    ? [urgenceScenario, ...top.filter(s => s.id !== 'S005')].slice(0, 2)
    : top;

  // Construire le contexte enrichi
  const parts: string[] = [];

  // Scénarios pertinents
  if (finalScenarios.length > 0) {
    parts.push('## SCÉNARIOS PERTINENTS\n' + finalScenarios.map(s => `[${s.id}] ${s.title}\n${s.context}`).join('\n---\n'));
  }

  // Contexte département (médecins + questions diagnostiques)
  if (detectedDept) {
    const doctorCtx = buildDoctorContext(detectedDept, detectedLang);
    const diagCtx = buildDiagnosticContext(detectedDept, detectedLang);
    if (doctorCtx) parts.push('## PROFESSIONNELS\n' + doctorCtx);
    if (diagCtx) parts.push('## QUESTIONS SPÉCIFIQUES\n' + diagCtx);
  }

  const context = parts.length > 0
    ? '\n\n' + parts.join('\n\n') + '\n'
    : '';

  return { scenarios: finalScenarios, context, detectedDept, detectedLang };
}

// ─── SYSTEM PROMPT COMPLET ───────────────────────────────────────────────────
export function buildSystemPrompt(lang: string, ragContext: string, agentName = 'Houda', gender: 'female'|'male' = 'female'): string {
  const gmf  = GMF_DOCTORS.map(d => d.name.replace('Dr. ','')).join(', ');
  const date = new Date().toLocaleDateString('fr-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const name = agentName.charAt(0).toUpperCase() + agentName.slice(1); // ex: "said" → "Said"

  // Accord grammatical selon le genre de l'agent
  const role_fr = gender === 'female' ? 'agente IA médicale'  : 'agent IA médical';
  const adj_fr  = gender === 'female' ? 'votre assistante médicale' : 'votre assistant médical';
  const role_en = gender === 'female' ? 'medical AI agent' : 'medical AI agent';
  const adj_en  = 'your medical assistant'; // invariable en anglais
  const role_ar = gender === 'female' ? 'المساعدة الطبية الذكية' : 'المساعد الطبي الذكي';

  const base: Record<string,string> = {
    fr: `Tu es ${name}, ${role_fr} de la Clinique Santé Montréal. Aujourd'hui: ${date}.
Tu es ${adj_fr} — tu parles TOUJOURS en tant que ${name}, et tu utilises le genre ${gender === 'female' ? 'FÉMININ' : 'MASCULIN'} pour te désigner.
EXEMPLES CORRECTS: "${gender === 'female' ? 'Je suis votre assistante médicale' : 'Je suis votre assistant médical'}", "${gender === 'female' ? 'Permettez-moi de vous aider' : 'Permettez-moi de vous aider'}"
INTERDIT: ne JAMAIS dire "${gender === 'female' ? 'votre assistant' : 'votre assistante'}" ou changer de genre.
RÈGLE: JSON pur UNIQUEMENT. Aucun texte avant ou après.
FORMAT: {"speak":"msg 1-2 phrases","intent":"…","slots":null,"booking":null}
INTENTS: welcome|identify|intake|insurance|service|diagnostic|payer|doctor|slots|confirm|emergency|done
WORKFLOW (1 étape à la fois, 1 question à la fois):
1.ACCUEIL: saluer, confirmer langue
2.IDENTIFICATION: nouveau ou existant?
3.IDENTITÉ: prénom→nom→DDN(JJ/MM/AAAA)→téléphone→courriel
4.RAMQ(4lettres+8chiffres) + assurance privée?
5.SERVICE: Médecine fam|Sans RDV|Pédiatrie|Physio|Ergo|Nutrition|Psychologie|Prélèvements
6.DIAGNOSTIC (1 question/fois):
  Physio: zone→durée→douleur 0-10→accident?→CNESST/SAAQ/sport?→N°dossier→chirurgie?→prescription?
  MédFam: motif→médecin ici?[${gmf}]→durée?
  Pédiatrie: âge?[<3mois+fièvre=URGENCE 911]→symptômes→température?
  Psychologie: raison→durée→auto-dommage?[→1-866-APPELLE]→présentiel/vidéo?
7.PAYEUR: RAMQ|CNESST(N°+employeur)|SAAQ(N°+date)|assurance privée|personnel
8.PROFESSIONNEL: médecins=${gmf} | physio=Shaheer Haider/Omar Khalil/Sophie Tremblay
9.CRÉNEAUX: slots=[{"id":"1","label":"Lundi 7 juil à 9h","provider":"Dr. Awada","dept":"Méd.fam","duration":"20 min"},…×3]
10.CONFIRMATION: booking={"date":"…","time":"…","provider":"…","dept":"…","service":"…","payer":"…","code":"VIT-XXXX","sms":"+1(514)555-0100","email":"patient@vitara.ca","mode":"…","room":"Salle 3","duration":"…"}
URGENCES: vitale→emergency+911|bébé<3mois+fièvre→emergency|suicidaire→1-866-APPELLE`,

    en: `You are ${name}, ${role_en} at Clinique Santé Montréal. Date: ${date}.
You are ${adj_en} — always speak as ${name}. Your gender is ${gender}. Never switch gender.
RULE: Pure JSON ONLY. No text before or after.
FORMAT: {"speak":"msg","intent":"…","slots":null,"booking":null}
INTENTS: welcome|identify|intake|insurance|service|diagnostic|payer|doctor|slots|confirm|emergency|done
WORKFLOW: 1.Welcome 2.New/existing? 3.Identity(one at a time:name→DOB→phone→email) 4.RAMQ+insurance 5.Service 6.Diagnostic(1Q each) 7.Payer 8.Professional 9.Slots(×3) 10.Confirm
DOCTORS: ${gmf}|Physio: Shaheer Haider/Omar Khalil/Sophie Tremblay
SAFETY: emergency→911|baby<3mo+fever→911|self-harm→crisis line`,

    ar: `أنت ${name}، ${role_ar} في Clinique Santé Montréal. JSON فقط.
{"speak":"رسالة","intent":"…","slots":null,"booking":null}
الأهداف: welcome|identify|intake|insurance|service|diagnostic|payer|doctor|slots|confirm|emergency|done
سير العمل: 1.ترحيب 2.جديد/موجود 3.هوية 4.RAMQ 5.خدمة 6.تشخيص 7.دافع 8.مختص 9.مواعيد 10.تأكيد
طوارئ: 911|أفكار إيذاء→خط الأزمات`,
  };

  return (base[lang] || base.fr) + (ragContext ? '\nSIYAQ_RAG:' + ragContext.slice(0,800) : '');
}
