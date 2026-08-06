// ============================================================
// VITARA RAG Engine — Keyword-based retrieval
// Sélectionne les scénarios pertinents selon le message user
// ============================================================

import { SCENARIOS, Scenario } from './scenarios';

interface RAGResult {
  scenarios: Scenario[];
  context: string;
  detectedDept?: string;
  detectedLang?: string;
}

// Score un scénario selon le message de l'utilisateur
function scoreScenario(scenario: Scenario, message: string, history: string): number {
  const text = (message + ' ' + history).toLowerCase();
  let score = 0;

  for (const tag of scenario.tags) {
    if (text.includes(tag.toLowerCase())) {
      // Tag plus long = plus précis = score plus élevé
      score += tag.length > 8 ? 3 : tag.length > 4 ? 2 : 1;
    }
  }

  // Bonus pour la priorité haute
  if (scenario.priority === 1) score *= 1.3;

  return score;
}

// Détecte la langue à partir du message
function detectLanguage(message: string): string {
  const ar = /[\u0600-\u06FF]/;
  const en = /\b(i want|i need|book|appointment|help|please|hello|hi|thank)\b/i;
  if (ar.test(message)) return 'ar';
  if (en.test(message)) return 'en';
  return 'fr';
}

// Détecte le département principal
function detectDepartment(message: string): string | undefined {
  const msg = message.toLowerCase();
  if (/(physio|dos|genou|épaule|muscle|tendon|sport|blessure)/.test(msg)) return 'physiotherapie';
  if (/(médecin|famille|ordonnance|prescription|bilan|grippe|fièvre)/.test(msg)) return 'medecine-familiale';
  if (/(cardio|coeur|heart|tension|cholestérol|palpitation)/.test(msg)) return 'cardiologie';
  if (/(psy|anxiété|dépression|stress|burn|thérapie|mental)/.test(msg)) return 'psychologie';
  if (/(ergo|travail|AVC|fonctionnel|retour au travail)/.test(msg)) return 'ergotherapie';
  if (/(nutrition|diète|poids|diabète|alimentation)/.test(msg)) return 'nutrition';
  if (/(enfant|bébé|pédiatrie|nourrisson)/.test(msg)) return 'pediatrie';
  if (/(urgence|911|inconscient|chest pain|accident)/.test(msg)) return 'urgence';
  return undefined;
}

// Fonction principale RAG
export function retrieveContext(
  userMessage: string,
  conversationHistory: {role: string; content: string}[] = []
): RAGResult {
  const historyText = conversationHistory
    .slice(-4) // Derniers 4 messages pour contexte
    .map(m => m.content)
    .join(' ');

  const detectedLang = detectLanguage(userMessage);
  const detectedDept = detectDepartment(userMessage);

  // Scorer tous les scénarios
  const scored = SCENARIOS
    .map(s => ({ scenario: s, score: scoreScenario(s, userMessage, historyText) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  // Top 3 scénarios pertinents
  const top = scored.slice(0, 3).map(x => x.scenario);

  // Toujours inclure le scénario urgence si détecté
  const urgenceScenario = SCENARIOS.find(s => s.id === 'S005' || s.id === 'S006');
  const hasUrgence = userMessage.toLowerCase().includes('urgence') ||
    userMessage.toLowerCase().includes('emergency') ||
    userMessage.toLowerCase().includes('911');

  const finalScenarios = hasUrgence && urgenceScenario
    ? [urgenceScenario, ...top.filter(s => s.id !== 'S005' && s.id !== 'S006')].slice(0, 3)
    : top;

  // Construire le contexte enrichi
  const contextParts = finalScenarios.map(s =>
    `---\n[${s.id}] ${s.title}\n${s.context}`
  );

  const context = contextParts.length > 0
    ? `\n\n## CONTEXTE CLINIQUE PERTINENT (base de connaissances VITARA)\n${contextParts.join('\n')}\n---`
    : '';

  return {
    scenarios: finalScenarios,
    context,
    detectedDept,
    detectedLang
  };
}

// Système de prompt de base complet
export function buildSystemPrompt(language: string, ragContext: string): string {
  const base: Record<string, string> = {
    fr: `Tu es VITARA, assistante IA médicale de la Clinique Santé Montréal.
Tu es chaleureuse, professionnelle et multilingue (FR/EN/AR).
Tu aides les patients à: prendre des rendez-vous, obtenir des informations, gérer leurs dossiers.

RÈGLES CRITIQUES:
1. Réponds TOUJOURS en JSON pur, aucun texte avant ou après
2. Format JSON strict: {"speak":"message patient (max 2 phrases)","intent":"welcome|identify|need|dept|slots|confirm|emergency|done","slots":null,"booking":null}
3. Pour intent "slots": inclure slots=[{"id":"1","label":"Lundi 9h","provider":"Dr. Martin","dept":"Médecine familiale"},...]
4. Pour intent "confirm": inclure booking={"date":"Lundi 7 juillet","time":"9h00","provider":"Dr. Jean-François Martin","dept":"Médecine familiale","code":"VIT-${Math.floor(1000+Math.random()*9000)}","sms":"+1(514)555-0100","email":"patient@vitara.ca"}
5. URGENCES: si danger de vie → intent "emergency" et suggérer 911 IMMÉDIATEMENT
6. Langue: réponds dans la langue détectée (FR/EN/AR)
7. Flux conversation: accueil → identification → besoin → département → 3 créneaux → confirmation

INFORMATIONS CLINIQUE:
- Nom: Clinique Santé Montréal | VITARA
- Tél: +1 (514) 555-0100
- Adresse: 1234 Boulevard Laval, Laval, QC
- Horaires: Lun-Ven 7h30-20h, Sam 8h-17h`,

    en: `You are VITARA, AI medical assistant at Clinique Santé Montréal.
You are warm, professional and multilingual (FR/EN/AR).
You help patients: book appointments, get information, manage their records.

CRITICAL RULES:
1. ALWAYS respond in pure JSON, no text before or after
2. Strict JSON format: {"speak":"patient message (max 2 sentences)","intent":"welcome|identify|need|dept|slots|confirm|emergency|done","slots":null,"booking":null}
3. For intent "slots": include slots=[{"id":"1","label":"Monday 9am","provider":"Dr. Martin","dept":"Family Medicine"},...]
4. For intent "confirm": include booking={"date":"Monday July 7","time":"9:00 AM","provider":"Dr. Jean-François Martin","dept":"Family Medicine","code":"VIT-2847","sms":"+1(514)555-0100","email":"patient@vitara.ca"}
5. EMERGENCIES: life-threatening situation → intent "emergency" and suggest 911 IMMEDIATELY
6. Language: respond in detected language (FR/EN/AR)
7. Conversation flow: welcome → identify → need → department → 3 slots → confirm`,

    ar: `أنت VITARA، المساعدة الطبية الذكية في عيادة Clinique Santé Montréal.
أنت دافئة ومهنية ومتعددة اللغات (الفرنسية/الإنجليزية/العربية).
تساعدين المرضى في: حجز المواعيد، والحصول على المعلومات، وإدارة ملفاتهم.

القواعد الحرجة:
1. الرد دائماً بـ JSON نقي فقط
2. تنسيق JSON: {"speak":"رسالة المريض","intent":"welcome|identify|need|dept|slots|confirm|emergency|done","slots":null,"booking":null}
3. للمواعيد: slots=[{"id":"1","label":"الاثنين 9 صباحاً","provider":"د. مارتن","dept":"طب الأسرة"},...]
4. التأكيد: booking={"date":"الاثنين 7 يوليو","time":"9:00 صباحاً","provider":"د. مارتن","dept":"طب الأسرة","code":"VIT-2847","sms":"+1(514)555-0100","email":"patient@vitara.ca"}
5. الطوارئ: خطر على الحياة → intent "emergency" واقترح 911 فوراً`
  };

  const prompt = base[language] || base.fr;
  return prompt + ragContext;
}
