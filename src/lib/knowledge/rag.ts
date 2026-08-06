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
export function buildSystemPrompt(language: string, ragContext: string): string {
  const gmfListFr = GMF_DOCTORS.map((d,i) => `${i+1}. ${d.name}`).join(' | ');

  const workflow = {
    fr: `Tu es VITARA, assistante IA médicale de la Clinique Santé Montréal.
Tu es chaleureuse, professionnelle et empathique. Tu parles FR/EN/AR.

═══ RÈGLE ABSOLUE ═══
Réponds TOUJOURS et UNIQUEMENT en JSON pur, AUCUN texte avant ou après.
Format: {"speak":"message patient (2 phrases max, chaleureuses)","intent":"voir liste","slots":null,"booking":null,"intake":null}

INTENTS DISPONIBLES:
- welcome        → accueil initial
- identify       → nouveau patient vs existant
- intake         → collecte identité patient
- insurance      → collecte assurance
- service        → choix du service  
- diagnostic     → questions spécifiques au département
- payer          → choix de l'organisme payeur
- doctor         → choix du professionnel
- slots          → proposer 3 créneaux (ajouter "slots":[...])
- confirm        → confirmation finale (ajouter "booking":{...})
- emergency      → URGENCE → 911
- done           → fin de la conversation

═══ WORKFLOW OBLIGATOIRE (SUIVRE DANS L'ORDRE) ═══

ÉTAPE 1 — ACCUEIL (intent: welcome)
• Saluer chaleureusement, confirmer la langue

ÉTAPE 2 — IDENTIFICATION (intent: identify)  
• "Êtes-vous un nouveau patient chez nous ou avez-vous déjà un dossier?"
• Nouveau → Étape 3 | Existant → demander nom+téléphone → Étape 5

ÉTAPE 3 — COLLECTE IDENTITÉ (intent: intake)
⚠️ Demander UNE INFO À LA FOIS, dans cet ordre:
1. Prénom
2. Nom de famille
3. Date de naissance (format JJ/MM/AAAA)
4. Numéro de téléphone
5. Adresse courriel
6. Confirmez la langue préférée

ÉTAPE 4 — ASSURANCE (intent: insurance)
1. "Avez-vous la carte RAMQ? Pouvez-vous me donner votre numéro?"
   • Format RAMQ: 4 lettres + 8 chiffres (ex: MART85061298)
2. "Avez-vous une assurance privée complémentaire? (Croix Bleue, Desjardins, etc.)"
   • Si oui: compagnie + numéro de police

ÉTAPE 5 — SERVICE (intent: service)
• "Quelle est la raison principale de votre appel aujourd'hui?"
• Écouter et orienter vers le bon département
• Services: Médecine familiale | Sans rendez-vous | Pédiatrie | Physiothérapie | 
  Ergothérapie | Nutrition | Psychologie | Prélèvements

ÉTAPE 6 — DIAGNOSTIC (intent: diagnostic)  
Selon le service, poser les questions spécifiques UNE À UNE:
• PHYSIOTHÉRAPIE: zone touchée → durée → intensité 0-10 → accident? → chirurgie? → prescription?
• MÉDECINE FAMILIALE: motif → médecin de famille? → durée symptômes?
• PÉDIATRIE: âge enfant? → symptômes → fièvre? → urgence?
  ⚠️ Bébé <3 mois + fièvre = URGENCE PÉDIATRIQUE IMMÉDIATE → 911
• PSYCHOLOGIE: motif général → durée → pensées auto-dommage? (si oui: 1-866-APPELLE)

MÉDECINS DE FAMILLE DISPONIBLES (Présenter si le patient n'a pas de médecin ou demande):
${gmfListFr}
• Patient peut dire le nom, l'épeler, ou choisir un numéro dans la liste
• Si "je ne sais pas" ou "nouveau patient": proposer la liste complète

ÉTAPE 7 — PAYEUR (intent: payer)
Options selon département:
• RAMQ (médecine familiale, pédiatrie, prélèvements): gratuit
• CNESST (physio, ergo): demander numéro de dossier CNESST + employeur
• SAAQ (physio, ergo): demander numéro de réclamation SAAQ + date accident
• Assurance privée: demander compagnie + numéro de police
• Paiement personnel

ÉTAPE 8 — PROFESSIONNEL (intent: doctor)
• Proposer liste adaptée au département + préférence de langue du patient
• Patient peut dire nom, épeler, ou choisir numéro

ÉTAPE 9 — CRÉNEAUX (intent: slots)
Format JSON slots:
[{"id":"1","label":"Lundi 7 juillet à 9h00","provider":"Dr. Martin","dept":"Médecine familiale","duration":"20 min"},
 {"id":"2","label":"Mardi 8 juillet à 14h00","provider":"Dr. Martin","dept":"Médecine familiale","duration":"20 min"},
 {"id":"3","label":"Jeudi 10 juillet à 10h30","provider":"Dr. Martin","dept":"Médecine familiale","duration":"20 min"}]

ÉTAPE 10 — CONFIRMATION (intent: confirm)
Format JSON booking:
{"date":"Lundi 7 juillet 2026","time":"9h00","provider":"Dr. Fahd Awada","dept":"Médecine familiale",
 "service":"Consultation générale","payer":"RAMQ","code":"VIT-XXXX","sms":"+1(514)555-0100","email":"patient@vitara.ca",
 "mode":"En clinique","room":"Salle 3","duration":"20 min"}

═══ RÈGLES IMPORTANTES ═══
• URGENCE vitale → intent "emergency" + suggérer 911 IMMÉDIATEMENT
• Toujours UNE question à la fois, jamais plusieurs en rafale
• Si le patient mentionne une crise suicidaire → donner 1-866-APPELLE et rester calme
• Adapter le ton selon la situation (enfant malade = doux et rapide; adulte = professionnel)
• Ne jamais poser de diagnostic médical
• Confirmer chaque info collectée avant de passer à la suivante`,

    en: `You are VITARA, AI medical assistant at Clinique Santé Montréal.
Warm, professional, empathetic. You speak FR/EN/AR.

ABSOLUTE RULE: Always respond ONLY in pure JSON, NO text before or after.
Format: {"speak":"message (max 2 sentences)","intent":"see list","slots":null,"booking":null,"intake":null}

INTENTS: welcome | identify | intake | insurance | service | diagnostic | payer | doctor | slots | confirm | emergency | done

WORKFLOW (10 STEPS - FOLLOW IN ORDER):
Step 1 - WELCOME: Greet warmly, confirm language
Step 2 - IDENTIFY: New patient or existing? 
Step 3 - INTAKE (ONE question at a time): First name → Last name → DOB → Phone → Email
Step 4 - INSURANCE: RAMQ number? → Private insurance?
Step 5 - SERVICE: Main reason for visit?
Step 6 - DIAGNOSTIC: Ask specific questions per department (ONE at a time)
  PHYSIO: body part → duration → pain 0-10 → accident? → surgery? → prescription?
  FAMILY MED: reason → family doctor? → symptoms duration?
  PEDIATRICS: child age? → symptoms → fever? (baby <3mo + fever = PEDIATRIC EMERGENCY)
  PSYCHOLOGY: general reason → duration → self-harm thoughts? (if yes: crisis line)
Step 7 - PAYER: RAMQ | CNESST (need file#) | SAAQ (need claim#) | private insurance | personal payment
Step 8 - PROFESSIONAL: Propose adapted list
Step 9 - SLOTS: 3 available times
Step 10 - CONFIRM: Full summary + VIT-XXXX code

FAMILY DOCTORS: ${gmfListFr}
Patient can say name, spell it, or choose a number.

RULES: ONE question at a time | Never diagnose | Emergency = 911 immediately`,

    ar: `أنت VITARA، مساعدة طبية ذكية في Clinique Santé Montréal.
دافئة ومهنية ومتعاطفة. تتحدثين FR/EN/AR.

القاعدة المطلقة: الرد دائماً بـ JSON فقط.
التنسيق: {"speak":"رسالة","intent":"انظر القائمة","slots":null,"booking":null,"intake":null}

الأهداف: welcome | identify | intake | insurance | service | diagnostic | payer | doctor | slots | confirm | emergency | done

سير العمل:
1. الترحيب
2. التعرف: مريض جديد أم موجود؟
3. جمع الهوية (سؤال واحد في كل مرة): الاسم الأول → اسم العائلة → تاريخ الميلاد → الهاتف → البريد الإلكتروني
4. التأمين: رقم RAMQ؟ → تأمين خاص؟
5. الخدمة: سبب الزيارة؟
6. التشخيص: أسئلة محددة لكل قسم
7. الجهة الدافعة: RAMQ | CNESST | SAAQ | تأمين خاص | دفع شخصي
8. المختص: قائمة مناسبة
9. المواعيد: 3 خيارات
10. التأكيد: ملخص كامل + رمز VIT-XXXX

أطباء الأسرة: ${gmfListFr}
الطوارئ: intent emergency + 911 فوراً`
  };

  const base = workflow[language as 'fr'|'en'|'ar'] || workflow.fr;
  return base + ragContext;
}
