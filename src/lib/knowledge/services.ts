// ============================================================
// VITARA — Hiérarchie des services et questions diagnostiques
// ============================================================

export interface ServiceCategory {
  id: string;
  label: { fr: string; en: string; ar: string };
  dept: string;
  subServices: SubService[];
  diagnosticFlow: DiagnosticQuestion[];
  payersAccepted: string[];
  urgencyCheck?: boolean;
}

export interface SubService {
  id: string;
  label: string;
  duration: number;      // minutes
  requiresRx?: boolean;  // ordonnance requise?
}

export interface DiagnosticQuestion {
  id: string;
  question: { fr: string; en: string; ar: string };
  type: 'open' | 'yesno' | 'scale' | 'choice';
  options?: string[];
  triggers?: Record<string, string>; // réponse → action
}

export const SERVICES: ServiceCategory[] = [

  // ─── MÉDECINE FAMILIALE ───
  {
    id: 'medecine-familiale',
    label: { fr: 'Médecine familiale', en: 'Family Medicine', ar: 'طب الأسرة' },
    dept: 'medecine-familiale',
    subServices: [
      { id:'mf-consult', label:'Consultation générale', duration: 20 },
      { id:'mf-suivi', label:'Suivi de maladie chronique', duration: 20 },
      { id:'mf-ordo', label:'Renouvellement d\'ordonnance', duration: 15, requiresRx: false },
      { id:'mf-bilan', label:'Bilan de santé annuel', duration: 40 },
      { id:'mf-resultats', label:'Discussion de résultats', duration: 20 },
      { id:'mf-gyno', label:'Santé féminine / Pap test', duration: 30 },
      { id:'mf-vaccin', label:'Vaccination', duration: 15 },
    ],
    diagnosticFlow: [
      { id:'q-mf1', question:{ fr:'Quel est le motif principal de votre consultation?', en:'What is the main reason for your visit?', ar:'ما هو السبب الرئيسي لاستشارتك؟' }, type:'open' },
      { id:'q-mf2', question:{ fr:'Avez-vous un médecin de famille chez nous?', en:'Do you have a family doctor here?', ar:'هل لديك طبيب عائلة لدينا؟' }, type:'yesno', triggers:{ oui:'ask-doctor', non:'show-gmf-list' } },
      { id:'q-mf3', question:{ fr:'Depuis quand avez-vous ces symptômes?', en:'How long have you had these symptoms?', ar:'منذ متى لديك هذه الأعراض؟' }, type:'open' },
    ],
    payersAccepted: ['RAMQ', 'assurance-privee', 'paiement-personnel'],
  },

  // ─── SANS RENDEZ-VOUS ───
  {
    id: 'sans-rdv',
    label: { fr: 'Sans rendez-vous (Urgences mineures)', en: 'Walk-In (Minor Emergencies)', ar: 'بدون موعد (طوارئ بسيطة)' },
    dept: 'sans-rdv',
    subServices: [
      { id:'srdv-fievre', label:'Fièvre', duration: 15 },
      { id:'srdv-infection', label:'Infection (gorge, oreille, urinaire)', duration: 15 },
      { id:'srdv-otite', label:'Otite', duration: 15 },
      { id:'srdv-rhume', label:'Rhume / Grippe', duration: 15 },
      { id:'srdv-urinaire', label:'Symptômes urinaires', duration: 15 },
      { id:'srdv-plaie', label:'Plaie / Blessure mineure', duration: 20 },
    ],
    diagnosticFlow: [
      { id:'q-srdv1', question:{ fr:'Quels sont vos symptômes principaux?', en:'What are your main symptoms?', ar:'ما هي أعراضك الرئيسية؟' }, type:'open' },
      { id:'q-srdv2', question:{ fr:'Depuis combien de temps avez-vous ces symptômes?', en:'How long have you had these symptoms?', ar:'منذ متى لديك هذه الأعراض؟' }, type:'open' },
      { id:'q-srdv3', question:{ fr:'Avez-vous de la fièvre? Si oui, quelle température?', en:'Do you have a fever? If yes, what temperature?', ar:'هل لديك حمى؟ إذا كان الأمر كذلك، ما هي درجة الحرارة؟' }, type:'yesno' },
    ],
    payersAccepted: ['RAMQ', 'paiement-personnel'],
    urgencyCheck: true,
  },

  // ─── PÉDIATRIE ───
  {
    id: 'pediatrie',
    label: { fr: 'Pédiatrie', en: 'Pediatrics', ar: 'طب الأطفال' },
    dept: 'pediatrie',
    subServices: [
      { id:'ped-nouveau-ne', label:'Nouveau-né (0-1 mois)', duration: 30 },
      { id:'ped-vaccin', label:'Vaccination pédiatrique', duration: 20 },
      { id:'ped-fievre', label:'Fièvre enfant', duration: 15 },
      { id:'ped-suivi', label:'Suivi de croissance', duration: 20 },
      { id:'ped-asthme', label:'Asthme / Allergie', duration: 20 },
      { id:'ped-otite', label:'Otite enfant', duration: 15 },
    ],
    diagnosticFlow: [
      { id:'q-ped1', question:{ fr:'Quel est l\'âge de l\'enfant?', en:'How old is the child?', ar:'كم عمر الطفل؟' }, type:'open', triggers:{ '<3mois':'ALERTE-URGENCE-PEDIATRIQUE' } },
      { id:'q-ped2', question:{ fr:'Quels sont les symptômes de l\'enfant?', en:'What are the child\'s symptoms?', ar:'ما هي أعراض الطفل؟' }, type:'open' },
      { id:'q-ped3', question:{ fr:'L\'enfant a-t-il de la fièvre? Si oui, quelle température?', en:'Does the child have a fever? Temperature?', ar:'هل الطفل مصاب بحمى؟' }, type:'yesno', triggers:{ '>38.5-3mois':'URGENCE', '>39-enfant':'URGENT' } },
      { id:'q-ped4', question:{ fr:'L\'enfant a-t-il des difficultés à respirer ou des lèvres bleues?', en:'Does the child have breathing difficulties or blue lips?', ar:'هل يعاني الطفل من صعوبة في التنفس؟' }, type:'yesno', triggers:{ oui:'911-IMMÉDIAT' } },
    ],
    payersAccepted: ['RAMQ', 'assurance-privee'],
    urgencyCheck: true,
  },

  // ─── PHYSIOTHÉRAPIE ───
  {
    id: 'physiotherapie',
    label: { fr: 'Physiothérapie', en: 'Physiotherapy', ar: 'العلاج الطبيعي' },
    dept: 'physiotherapie',
    subServices: [
      { id:'physio-eval', label:'Évaluation initiale', duration: 60 },
      { id:'physio-traitement', label:'Traitement / Suivi', duration: 45 },
      { id:'physio-sport', label:'Blessure sportive', duration: 60 },
      { id:'physio-postop', label:'Post-opératoire', duration: 60 },
      { id:'physio-cnesst', label:'CNESST (accident travail)', duration: 60 },
      { id:'physio-saaq', label:'SAAQ (accident auto)', duration: 60 },
    ],
    diagnosticFlow: [
      { id:'q-ph1', question:{ fr:'Quelle partie du corps est touchée?', en:'Which body part is affected?', ar:'أي جزء من الجسم يتأثر؟' }, type:'choice', options:['Dos/rachis','Épaule','Genou','Cheville/pied','Hanche','Poignet/main','Cou','Autre'] },
      { id:'q-ph2', question:{ fr:'Depuis combien de temps avez-vous cette douleur?', en:'How long have you had this pain?', ar:'منذ متى لديك هذا الألم؟' }, type:'open' },
      { id:'q-ph3', question:{ fr:'Sur une échelle de 0 à 10, quelle est l\'intensité de votre douleur?', en:'On a scale of 0-10, what is your pain level?', ar:'على مقياس من 0 إلى 10، ما هو مستوى ألمك؟' }, type:'scale' },
      { id:'q-ph4', question:{ fr:'Cette douleur est-elle due à un accident?', en:'Is this pain from an accident?', ar:'هل هذا الألم ناتج عن حادث؟' }, type:'yesno', triggers:{ oui:'ask-accident-type' } },
      { id:'q-ph5-accident', question:{ fr:'S\'agit-il d\'un accident de travail, d\'un accident de la route ou autre?', en:'Was it a work accident, car accident, or other?', ar:'هل كان حادث عمل أو حادث سيارة أو غير ذلك؟' }, type:'choice', options:['Accident de travail (CNESST)','Accident de route (SAAQ)','Accident sportif','Autre'] },
      { id:'q-ph6', question:{ fr:'Avez-vous déjà subi une chirurgie pour ce problème?', en:'Have you had surgery for this issue?', ar:'هل خضعت لعملية جراحية لهذه المشكلة؟' }, type:'yesno', triggers:{ oui:'ask-surgery-date' } },
      { id:'q-ph7', question:{ fr:'Avez-vous déjà reçu des traitements de physiothérapie pour ce problème?', en:'Have you received physiotherapy for this before?', ar:'هل تلقيت علاجاً طبيعياً لهذه المشكلة من قبل؟' }, type:'yesno' },
      { id:'q-ph8', question:{ fr:'Avez-vous une prescription médicale? (non obligatoire au Québec)', en:'Do you have a medical prescription? (not required in Quebec)', ar:'هل لديك وصفة طبية؟' }, type:'yesno' },
    ],
    payersAccepted: ['RAMQ', 'CNESST', 'SAAQ', 'assurance-privee', 'paiement-personnel'],
  },

  // ─── ERGOTHÉRAPIE ───
  {
    id: 'ergotherapie',
    label: { fr: 'Ergothérapie', en: 'Occupational Therapy', ar: 'العلاج الوظيفي' },
    dept: 'ergotherapie',
    subServices: [
      { id:'ergo-eval', label:'Évaluation fonctionnelle', duration: 90 },
      { id:'ergo-retour-travail', label:'Retour au travail progressif', duration: 60 },
      { id:'ergo-avc', label:'Suite d\'AVC / neurologique', duration: 60 },
      { id:'ergo-cnesst', label:'CNESST (réadaptation)', duration: 60 },
    ],
    diagnosticFlow: [
      { id:'q-erg1', question:{ fr:'Quel est le contexte? (accident de travail, maladie, autre)', en:'What is the context? (work accident, illness, other)', ar:'ما هو السياق؟' }, type:'choice', options:['Accident de travail (CNESST)','AVC / maladie neurologique','Trouble musculo-squelettique','Santé mentale','Autre'] },
      { id:'q-erg2', question:{ fr:'Quelles activités quotidiennes vous causent de la difficulté?', en:'What daily activities cause you difficulty?', ar:'ما هي الأنشطة اليومية التي تسبب لك صعوبة؟' }, type:'open' },
      { id:'q-erg3', question:{ fr:'Avez-vous un numéro de dossier CNESST?', en:'Do you have a CNESST file number?', ar:'هل لديك رقم ملف CNESST؟' }, type:'yesno', triggers:{ oui:'collect-cnesst-number' } },
    ],
    payersAccepted: ['CNESST', 'SAAQ', 'assurance-privee', 'paiement-personnel'],
  },

  // ─── NUTRITION ───
  {
    id: 'nutrition',
    label: { fr: 'Nutrition / Diététique', en: 'Nutrition / Dietetics', ar: 'التغذية' },
    dept: 'nutrition',
    subServices: [
      { id:'nut-eval', label:'Évaluation nutritionnelle initiale', duration: 75 },
      { id:'nut-suivi', label:'Suivi nutritionnel', duration: 45 },
      { id:'nut-diabete', label:'Diabète / Glycémie', duration: 60 },
      { id:'nut-sport', label:'Nutrition sportive', duration: 60 },
    ],
    diagnosticFlow: [
      { id:'q-nut1', question:{ fr:'Quel est votre objectif principal?', en:'What is your main goal?', ar:'ما هو هدفك الرئيسي؟' }, type:'choice', options:['Gestion du poids','Diabète / Glycémie','Cholestérol / Santé cardiovasculaire','Nutrition sportive','Grossesse','Allergie / Intolérance alimentaire','Autre'] },
      { id:'q-nut2', question:{ fr:'Avez-vous des restrictions alimentaires ou des allergies?', en:'Do you have dietary restrictions or allergies?', ar:'هل لديك قيود غذائية أو حساسية؟' }, type:'open' },
      { id:'q-nut3', question:{ fr:'Avez-vous une prescription de votre médecin? (améliore la couverture d\'assurance)', en:'Do you have a doctor\'s prescription?', ar:'هل لديك وصفة طبيبك؟' }, type:'yesno' },
    ],
    payersAccepted: ['assurance-privee', 'paiement-personnel', 'RAMQ'],
  },

  // ─── PSYCHOLOGIE ───
  {
    id: 'psychologie',
    label: { fr: 'Psychologie / Santé mentale', en: 'Psychology / Mental Health', ar: 'الصحة النفسية' },
    dept: 'psychologie',
    subServices: [
      { id:'psy-eval', label:'Évaluation psychologique initiale', duration: 60 },
      { id:'psy-tcc', label:'Thérapie cognitivo-comportementale (TCC)', duration: 50 },
      { id:'psy-couple', label:'Thérapie de couple / famille', duration: 60 },
      { id:'psy-ts', label:'Travail social / soutien', duration: 50 },
    ],
    diagnosticFlow: [
      { id:'q-psy1', question:{ fr:'Qu\'est-ce qui vous amène à consulter aujourd\'hui? (aucune réponse n\'est incorrecte)', en:'What brings you in today? (no answer is wrong)', ar:'ما الذي يجعلك تستشير اليوم؟' }, type:'open' },
      { id:'q-psy2', question:{ fr:'Depuis combien de temps ressentez-vous ces difficultés?', en:'How long have you been experiencing these difficulties?', ar:'منذ متى تعاني من هذه الصعوبات؟' }, type:'open' },
      { id:'q-psy3', question:{ fr:'Avez-vous des pensées de vous faire du mal? (Si oui, numéro de crise: 1-866-APPELLE)', en:'Do you have thoughts of harming yourself? (Crisis: 1-866-APPELLE)', ar:'هل لديك أفكار لإيذاء نفسك؟' }, type:'yesno', triggers:{ oui:'crisis-resources' } },
      { id:'q-psy4', question:{ fr:'Préférez-vous une consultation en personne ou en téléconsultation?', en:'Do you prefer in-person or telehealth?', ar:'هل تفضل الاستشارة الشخصية أم عن بُعد؟' }, type:'choice', options:['En personne','Téléconsultation vidéo'] },
    ],
    payersAccepted: ['assurance-privee', 'paiement-personnel'],
  },

  // ─── PRÉLÈVEMENTS ───
  {
    id: 'prelevements',
    label: { fr: 'Prélèvements / Analyses', en: 'Blood Tests / Lab Work', ar: 'تحاليل الدم' },
    dept: 'prelevements',
    subServices: [
      { id:'prel-sang', label:'Prise de sang', duration: 15 },
      { id:'prel-urine', label:'Analyse d\'urine', duration: 10 },
      { id:'prel-culture', label:'Culture / Bactériologie', duration: 15 },
    ],
    diagnosticFlow: [
      { id:'q-prel1', question:{ fr:'Avez-vous une requête de votre médecin?', en:'Do you have a requisition from your doctor?', ar:'هل لديك طلب من طبيبك؟' }, type:'yesno', triggers:{ non:'explain-requisition-needed' } },
      { id:'q-prel2', question:{ fr:'Y a-t-il des instructions spéciales? (ex: à jeun)', en:'Any special instructions? (e.g., fasting)', ar:'هل هناك تعليمات خاصة؟' }, type:'open' },
    ],
    payersAccepted: ['RAMQ', 'assurance-privee'],
  },
];

export const PAYERS = [
  { id:'RAMQ', label:'RAMQ (Régie de l\'assurance maladie du Québec)', requiresInfo:['ramq-number'], fr:'Couvert RAMQ' },
  { id:'CNESST', label:'CNESST (Accident de travail)', requiresInfo:['cnesst-file-number','employer-name'], fr:'Accident de travail' },
  { id:'SAAQ', label:'SAAQ (Accident de la route)', requiresInfo:['saaq-claim-number','accident-date'], fr:'Accident automobile' },
  { id:'assurance-privee', label:'Assurance privée complémentaire', requiresInfo:['insurance-company','policy-number'], fr:'Assurance privée' },
  { id:'anciens-combattants', label:'Anciens Combattants Canada', requiresInfo:['veteran-id'], fr:'Anciens Combattants' },
  { id:'paiement-personnel', label:'Paiement personnel (comptant/carte)', requiresInfo:[], fr:'Paiement personnel' },
];

export function getServiceById(id: string): ServiceCategory | undefined {
  return SERVICES.find(s => s.id === id);
}

export function detectService(message: string): string | undefined {
  const msg = message.toLowerCase();
  if (/(physio|dos|genou|épaule|muscle|tendon|sport|blessure physio)/.test(msg)) return 'physiotherapie';
  if (/(médecin|famille|généraliste|ordonnance|prescription|bilan|grippe|fièvre adulte)/.test(msg)) return 'medecine-familiale';
  if (/(sans rdv|walk-in|urgent|infection|otite|rhume|urinaire|plaie)/.test(msg)) return 'sans-rdv';
  if (/(enfant|bébé|pédiatrie|nourrisson|ped|peds)/.test(msg)) return 'pediatrie';
  if (/(ergo|retour au travail|AVC|fonctionnel)/.test(msg)) return 'ergotherapie';
  if (/(nutrition|diète|poids|diabète|cholestérol|alimentation)/.test(msg)) return 'nutrition';
  if (/(psy|anxiété|dépression|stress|burn|thérapie|mental|santé mentale)/.test(msg)) return 'psychologie';
  if (/(prise de sang|analyse|prélèvement|laboratoire|bilan sanguin|urine)/.test(msg)) return 'prelevements';
  if (/(cardio|coeur|tension|palpitations)/.test(msg)) return 'cardiologie';
  return undefined;
}
