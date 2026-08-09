// ════════════════════════════════════════════════════════════
// VITARA CONVERSATION ENGINE — écrit propre, de zéro
// Un seul fichier. Une seule source de vérité.
// ════════════════════════════════════════════════════════════

// ── 1. ÉTAT ─────────────────────────────────────────────────

export type FieldStatus = 'unknown' | 'confirmed' | 'skipped';

export interface Field {
  value:  string | null;
  status: FieldStatus;
}

const F = (v: string | null = null, s: FieldStatus = 'unknown'): Field => ({ value: v, status: s });

export interface VitaraState {
  // Identité
  patient_type:   string | null;     // 'new' | 'existing'
  full_name:      Field;
  phone:          Field;
  email:          Field;
  ramq:           Field;
  // Demande
  service:        Field;             // 'medecin_famille' | 'physiotherapie' | 'pediatrie' | 'urgence' | ...
  practitioner:   Field;             // nom du médecin/physio
  // Diagnostic
  reason:         Field;
  body_part:      Field;
  pain_scale:     Field;             // 0-10
  // Accident
  accident_type:  Field;             // 'CNESST' | 'SAAQ' | 'IVAC' | 'none'
  claim_number:   Field;
  // Enfant (pédiatrie)
  child_name:     Field;
  child_dob:      Field;
  // Diagnostic pédiatrie
  child_temp:     Field;   // température ex: "38.5°C"
  child_breathing:Field;   // respiration
  child_diarrhea: Field;   // diarrhée oui/non
  child_vomiting: Field;   // vomissements
  child_appearance:Field;  // apparence générale
  // RDV
  slot_date:      string | null;
  slot_time:      string | null;
}

export const EMPTY_STATE: VitaraState = {
  patient_type: null,
  full_name:    F(), phone: F(), email: F(), ramq: F(),
  service:      F(), practitioner: F(),
  reason:       F(), body_part: F(), pain_scale: F(),
  accident_type:F(), claim_number: F(),
  child_name:      F(), child_dob:       F(),
  child_temp:      F(), child_breathing: F(), child_diarrhea:  F(),
  child_vomiting:  F(), child_appearance:F(),
  slot_date: null, slot_time: null,
};

const ok  = (f: Field) => f.status === 'confirmed' && !!f.value;
const skip= (f: Field) => f.status === 'skipped';

// ── 2. EXTRACTION REGEX (fiable à 100%) ─────────────────────

const GMF_LOOKUP: Record<string, string> = {
  'awada':       'Dr. Fahd Awada',
  'caricevic':   'Dr. Bogdan Caricevic',
  'fruchtermann':'Dr. Lucien Fruchtermann',
  'kalim':       'Dr. Myrlène Kalim',
  'moriconi':    'Dr. Claudette Moriconi',
  'moynihan':    'Dr. Stephanie Moynihan',
  'ohayon':      'Dr. Huguette Ohayon-Gabbay',
  'serfaty':     'Dr. Samuel Serfaty',
  'prefontaine': 'Dr. Odette Préfontaine',
  'préfontaine': 'Dr. Odette Préfontaine',
  'odette':      'Dr. Odette Préfontaine',
};

const PHYSIO_LOOKUP: Record<string, string> = {
  'haider':   'Shaheer Haider, PT',
  'khalil':   'Omar Khalil, PT',
  'tremblay': 'Sophie Tremblay, PT',
};

const SERVICE_KEYWORDS: Array<[RegExp, string]> = [
  [/phys?io|réadapt|réhab/i,                  'physiotherapie'],
  [/médecin\s+de\s+famille|médecin\s+famil|family doc/i, 'medecin_famille'],
  [/médecin|docteur|dr\b|généraliste/i,        'medecin_famille'],
  [/pédiatr|enfant|bébé|pediatr/i,             'pediatrie'],
  [/psycholog|psy\b|mental|anxié/i,            'psychologie'],
  [/nutritio|diét/i,                            'nutrition'],
  [/ergo/i,                                     'ergotherapie'],
  [/sang|labo|prélève/i,                        'prelevement'],
  [/urgence|urgent|aujourd.hui|ce\s+soir/i,    'urgence'],
  [/sans\s+rendez/i,                            'sans_rdv'],
  [/prescription|ordonnance|renouvelle/i,       'prescription'],
];

const BODY_PARTS: Array<[RegExp, string]> = [
  [/épaule\s*(droite|gauche)?/i, 'épaule'],
  [/genou\s*(droit|gauche)?/i,   'genou'],
  [/dos|lombaire|colonne/i,       'dos'],
  [/cou|cervical/i,               'cou'],
  [/poignet|main|doigt/i,         'poignet/main'],
  [/cheville|pied/i,              'cheville/pied'],
  [/hanche|bassin/i,              'hanche'],
  [/coude|bras/i,                 'coude/bras'],
  [/abdom|ventre|colon|estomac|intestin/i, 'abdomen'],
  [/tête|migraine|crâne/i,       'tête'],
  [/poitrine|thorax|cœur/i,      'poitrine'],
  [/gorge|oreille|nez|sinus/i,   'ORL'],
  [/peau|bouton|éruption/i,       'peau'],
  [/penis|génital|urinaire/i,     'zone génito-urinaire'],
];

export function extractFromMessage(msg: string, state: VitaraState): Partial<VitaraState> {
  const t = msg.trim();
  const l = t.toLowerCase().normalize('NFC');
  const up: Partial<VitaraState> = {};

  // Patient type
  if (!state.patient_type) {
    if (/dossier|déjà patient|existant|déjà venu|déjà inscrit/i.test(l))
      up.patient_type = 'existing';
    else if (/nouveau|première fois|jamais venu/i.test(l))
      up.patient_type = 'new';
  }

  // Téléphone: 10 chiffres consécutifs
  if (!ok(state.phone)) {
    const d = t.replace(/\D/g, '');
    if (d.length === 10) up.phone = F(d, 'confirmed');
  }

  // Email
  if (!ok(state.email)) {
    const norm = l
      .replace(/\s+arobase\s+/g,'@').replace(/\s+à\s+/g,'@').replace(/\s+at\s+/g,'@')
      .replace(/\s+point\s+/g,'.').replace(/\s+dot\s+/g,'.')
      .replace(/\s+underscore\s+/g,'_').replace(/\s+tiret\s+du\s+bas\s+/g,'_')
      .replace(/\s/g,'');
    const em = norm.match(/[\w._+-]+@[\w.-]+\.\w{2,}/);
    if (em) up.email = F(em[0], 'confirmed');
  }

  // RAMQ: 4 lettres + 8 chiffres
  if (!ok(state.ramq)) {
    const clean = t.toUpperCase().replace(/[\s\-]/g,'');
    const rm = clean.match(/[A-Z]{4}\d{8}/);
    if (rm) up.ramq = F(rm[0], 'confirmed');
  }

  // Service
  if (!ok(state.service)) {
    for (const [re, svc] of SERVICE_KEYWORDS) {
      if (re.test(l)) { up.service = F(svc, 'confirmed'); break; }
    }
  }

  // Médecin GMF
  if (!ok(state.practitioner)) {
    for (const [key, name] of Object.entries(GMF_LOOKUP)) {
      if (l.includes(key)) { up.practitioner = F(name, 'confirmed'); break; }
    }
    if (!up.practitioner) {
      for (const [key, name] of Object.entries(PHYSIO_LOOKUP)) {
        if (l.includes(key)) { up.practitioner = F(name, 'confirmed'); break; }
      }
    }
  }

  // Accident
  if (!ok(state.accident_type)) {
    if (/cnesst|accident\s+de\s+travail|blessure\s+au\s+travail/i.test(l))
      up.accident_type = F('CNESST', 'confirmed');
    else if (/saaq|accident\s+de\s+voiture|accident\s+de\s+la\s+route/i.test(l))
      up.accident_type = F('SAAQ', 'confirmed');
    else if (/ivac|victime/i.test(l))
      up.accident_type = F('IVAC', 'confirmed');
    else if (/pas\s+d.accident|aucun\s+accident|sport|personnel|non/i.test(l) && state.accident_type.status === 'unknown')
      up.accident_type = F('none', 'confirmed');
  }

  // Numéro dossier accident
  if (ok(state.accident_type) && state.accident_type.value !== 'none' && !ok(state.claim_number)) {
    if (/pas encore|pas de numéro|je n.ai pas|pas pour le moment/i.test(l)) {
      up.claim_number = F(null, 'skipped');
    } else {
      const cn = t.match(/\d{6,}/);
      if (cn) up.claim_number = F(cn[0], 'confirmed');
    }
  }

  // Zone corporelle
  if (!ok(state.body_part)) {
    for (const [re, part] of BODY_PARTS) {
      if (re.test(t)) { up.body_part = F(t.match(re)![0], 'confirmed'); break; }
    }
  }

  // Intensité douleur 0-10
  if (!ok(state.pain_scale)) {
    const ps = l.match(/\b(10|[0-9])\s*(?:\/\s*10|sur\s+10)?\b/);
    if (ps) up.pain_scale = F(ps[1], 'confirmed');
  }

  // ── EXTRACTION CONTEXTUELLE (champs texte libre) ──────────
  // Si RIEN extrait par regex → regarder l'état pour deviner le champ

  const nothingYet = Object.keys(up).length === 0;

  // Nom: si full_name inconnu ET rien extrait ET message ressemble à un nom
  if (!ok(state.full_name) && nothingYet) {
    const words = t.split(/\s+/).filter((w: string) => w.length > 1);
    if (
      words.length >= 1 && words.length <= 5 &&
      !/\d{4,}/.test(t) &&
      !/@/.test(t) &&
      !/physio|m.decin|urgence|p.diatr|nutrit|ergo|psycho|cnesst|saaq/i.test(t) &&
      !/^(oui|non|je|j |yes|no|okay|ok|bonjour|bonsoir|salut|merci|allo)/i.test(t) &&
      !/d.j.?\s+patient|nouveau\s+patient|d.j.\s+un\s+dossier|un\s+dossier|dossier\s+chez|existant/i.test(t)
    ) {
      const name = words.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      if (name.length >= 3) up.full_name = F(name, 'confirmed');
    }
  }

  // Motif: si full_name+phone connus ET rien extrait ET message court
  if (!ok(state.reason) && !up.reason && ok(state.full_name) && ok(state.phone)) {
    const noOtherUpdate = !up.email && !up.ramq && !up.service && !up.practitioner && !up.phone;
    if (noOtherUpdate && t.length >= 3 && t.split(/\s+/).length <= 20 && !/@/.test(t)) {
      if (!/^(oui|non|ok|yes|no|allo)/i.test(t)) {
        up.reason = F(t.charAt(0).toUpperCase() + t.slice(1), 'confirmed');
      }
    }
  }

  // Zone corporelle: si motif connu ET rien extrait ET message court
  if (!ok(state.body_part) && !up.body_part && ok(state.reason)) {
    const noOtherUpdate2 = !up.email && !up.ramq && !up.service && !up.practitioner && !up.phone && !up.reason;
    if (noOtherUpdate2 && t.length >= 2 && t.split(/\s+/).length <= 8) {
      if (!/^(oui|non|ok|yes|no|allo)/i.test(t) && !/\d{5,}/.test(t)) {
        up.body_part = F(t.charAt(0).toUpperCase() + t.slice(1), 'confirmed');
      }
    }
  }

  return up;
}

export function applyUpdates(state: VitaraState, updates: Partial<VitaraState>): VitaraState {
  const next = { ...state };
  for (const [k, v] of Object.entries(updates)) {
    const cur = (state as any)[k];
    // Ne jamais écraser un champ confirmé (sauf si skipped → confirmed)
    if (cur?.status === 'confirmed' && (v as Field)?.status !== 'confirmed') continue;
    (next as any)[k] = v;
  }
  return next;
}

// ── 3. PROCHAINE QUESTION (déterministe) ─────────────────────

export type Step =
  | { type: 'ask'; field: keyof VitaraState; fr: string; en: string; ar: string }
  | { type: 'slots' };

const GMF_LIST = Object.values(GMF_LOOKUP).filter((v,i,a)=>a.indexOf(v)===i).join(' · ');
const PHYSIO_LIST = Object.values(PHYSIO_LOOKUP).filter((v,i,a)=>a.indexOf(v)===i).join(' · ');

export function nextStep(s: VitaraState): Step {
  // ── PÉDIATRIE EN PREMIER (si service déjà détecté) ────────────
  // Quand le patient dit "Mon enfant a besoin..." → service=pediatrie
  // → demander l'enfant AVANT le parent
  if (s.service?.value === 'pediatrie') {
    return nextStepPediatrie(s);
  }

  // Identité (tous autres services)
  if (!ok(s.full_name))
    return { type:'ask', field:'full_name',
      fr:'Pouvez-vous me confirmer votre nom complet ?',
      en:'Can you confirm your full name?', ar:'ما اسمك الكامل؟' };

  if (!ok(s.phone))
    return { type:'ask', field:'phone',
      fr:'Quel est votre numéro de téléphone ?',
      en:'What is your phone number?', ar:'ما رقم هاتفك؟' };

  if (!ok(s.email))
    return { type:'ask', field:'email',
      fr:'Quelle est votre adresse courriel ?',
      en:'What is your email?', ar:'ما بريدك الإلكتروني؟' };

  if (!ok(s.ramq))
    return { type:'ask', field:'ramq',
      fr:"Quel est votre numéro d'assurance maladie (RAMQ) ?",
      en:'What is your health card number (RAMQ)?', ar:'ما رقم بطاقة التأمين الصحي؟' };

  // Service
  if (!ok(s.service))
    return { type:'ask', field:'service',
      fr:"Pour quel service consultez-vous aujourd'hui ?",
      en:'Which service do you need today?', ar:'أي خدمة تحتاج اليوم؟' };

  const svc = s.service.value || '';

  // Praticien selon le service
  if (!ok(s.practitioner)) {
    if (svc === 'medecin_famille')
      return { type:'ask', field:'practitioner',
        fr:`Quel est votre médecin de famille ? (${GMF_LIST})`,
        en:`Who is your family doctor? (${GMF_LIST})`, ar:`من هو طبيبك العائلي؟` };
    if (svc === 'physiotherapie')
      return { type:'ask', field:'practitioner',
        fr:`Souhaitez-vous un physiothérapeute en particulier ? (${PHYSIO_LIST})`,
        en:`Any preferred physiotherapist? (${PHYSIO_LIST})`, ar:`هل تفضل معالجًا بعينه؟` };
  }

  // ── (pédiatrie géré en haut de nextStep) ────────────────────────

}

// Fonction dédiée pédiatrie — appelée en priorité
function nextStepPediatrie(s: VitaraState): Step {
  const prenom = s.child_name?.value?.split(' ')[0] || "votre enfant";
  // 1. Infos enfant
  if (!ok(s.child_name))
    return { type:'ask', field:'child_name',
      fr:"Pour commencer, quel est le prénom et nom complet de votre enfant ?",
      en:"First, what is your child's full name?", ar:"ما اسم طفلك الكامل؟" };
  if (!ok(s.child_dob))
    return { type:'ask', field:'child_dob',
      fr:`Quelle est la date de naissance de ${prenom} ?`,
      en:"What is your child's date of birth?", ar:"ما تاريخ ميلاد طفلك؟" };
  // 2. Infos parent
  if (!ok(s.full_name))
    return { type:'ask', field:'full_name',
      fr:"Merci. Et vous, quel est votre nom complet en tant que parent ou tuteur ?",
      en:"And what is your full name as parent or guardian?", ar:"وما اسمك الكامل كولي أمر؟" };
  if (!ok(s.phone))
    return { type:'ask', field:'phone',
      fr:"Quel est votre numéro de téléphone ?",
      en:"What is your phone number?", ar:"ما رقم هاتفك؟" };
  if (!ok(s.email))
    return { type:'ask', field:'email',
      fr:"Quelle est votre adresse courriel ?",
      en:"What is your email?", ar:"ما بريدك الإلكتروني؟" };
  if (!ok(s.ramq))
    return { type:'ask', field:'ramq',
      fr:`Quel est le numéro de carte d'assurance maladie de ${prenom} ?`,
      en:"What is your child's health card number?", ar:"ما رقم بطاقة التأمين الصحي للطفل؟" };
  // 3. Motif et diagnostic
  if (!ok(s.reason))
    return { type:'ask', field:'reason',
      fr:`Pour quelle raison consultez-vous pour ${prenom} aujourd'hui ?`,
      en:"What is the reason for the consultation?", ar:"ما سبب الاستشارة؟" };
  if (!ok(s.child_temp))
    return { type:'ask', field:'child_temp',
      fr:`Est-ce que ${prenom} a de la fièvre ? Si oui, quelle est sa température ?`,
      en:"Does your child have a fever? What is their temperature?", ar:"هل لدى طفلك حمى؟" };
  if (!ok(s.child_breathing))
    return { type:'ask', field:'child_breathing',
      fr:`Comment respire ${prenom} ? Normalement, difficilement, rapidement ?`,
      en:"How is your child breathing?", ar:"كيف يتنفس طفلك؟" };
  if (!ok(s.child_diarrhea))
    return { type:'ask', field:'child_diarrhea',
      fr:`Est-ce que ${prenom} a des diarrhées ou des selles anormales ?`,
      en:"Does your child have diarrhea?", ar:"هل لدى طفلك إسهال؟" };
  if (!ok(s.child_vomiting))
    return { type:'ask', field:'child_vomiting',
      fr:`Y a-t-il des vomissements ? Depuis combien de temps ?`,
      en:"Is there vomiting? For how long?", ar:"هل هناك قيء؟" };
  if (!ok(s.child_appearance))
    return { type:'ask', field:'child_appearance',
      fr:`Comment est l'état général de ${prenom} ? Actif, somnolent, irritable ?`,
      en:"How is your child's general appearance?", ar:"ما الحالة العامة لطفلك؟" };
  return { type:'slots' };
}

// ── 4. CRÉNEAUX ───────────────────────────────────────────────

export function buildSlots(s: VitaraState): any[] {
  const provider = s.practitioner.value || 'Dr. Fahd Awada';
  const svc      = s.service.value || '';
  const duration = svc==='physiotherapie' ? '30 min' : '20 min';
  const dept     = svc==='physiotherapie' ? 'Physiothérapie'
                 : svc==='pediatrie'      ? 'Pédiatrie'
                 : 'Médecine familiale';
  const today    = new Date();
  const tmr      = new Date(); tmr.setDate(today.getDate()+1);
  const fmt      = (d: Date) => d.toLocaleDateString('fr-CA',{weekday:'long',day:'numeric',month:'long'});
  return [
    { id:'1', label:`${fmt(today)} à 14h00`,  provider, dept, duration, date:today.toISOString().slice(0,10), time:'14:00' },
    { id:'2', label:`${fmt(today)} à 16h30`,  provider, dept, duration, date:today.toISOString().slice(0,10), time:'16:30' },
    { id:'3', label:`${fmt(tmr)} à 9h00`,     provider, dept, duration, date:tmr.toISOString().slice(0,10),   time:'09:00' },
  ];
}

// ── 4b. Extraction contextuelle du nom ───────────────────────
// Appelé quand la question précédente était "full_name"
// et que le patient a répondu avec un texte qui n'est pas un autre champ
export function extractNameFromReply(msg: string): string | null {
  const t = msg.trim();
  
  // Ignorer si c'est un numéro de téléphone
  if (/^\d[\d\s\-().]{8,}$/.test(t)) return null;
  // Ignorer si c'est un email
  if (/@/.test(t)) return null;
  // Ignorer si c'est un RAMQ
  if (/^[A-Za-z]{4}\d{8}/.test(t.replace(/\s/,''))) return null;
  // Ignorer si c'est un service
  if (/physio|médecin|urgence|pédiatr|nutrit|ergo|psycho/i.test(t)) return null;
  // Ignorer si trop long (> 5 mots = probablement une phrase)
  const words = t.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 5) return null;
  // Ignorer si commence par "oui", "non", "je", etc.
  if (/^(oui|non|je|j'|yes|no|okay|ok|peut)/i.test(t)) return null;
  
  // Capitaliser chaque mot
  const name = words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  
  return name.length >= 2 ? name : null;
}

// ── 5. ACK court après confirmation d'un champ ───────────────

export function buildAck(field: keyof VitaraState, value: string, lang: string): string {
  if (lang==='ar') return 'شكراً جزيلاً.';
  if (lang==='en') {
    const m: Partial<Record<keyof VitaraState,string>> = {
      full_name:`Thank you very much, ${value.split(' ')[0]}!`, phone:'Perfect, phone number noted.',
      email:'Thank you, email noted.', ramq:'Health card number noted, thank you.',
      service:'Of course, I will help you with that.',
      practitioner:`Noted, I will check availability for ${value}.`,
      reason:"I understand, thank you for letting me know.", body_part:'Noted.',
      pain_scale:`Understood, pain level ${value}/10 noted.`,
      accident_type:value==='CNESST'?'Work accident noted.':value==='SAAQ'?'Road accident noted.':'Noted.',
      claim_number:'File number noted.',
      child_name:`Thank you. I have noted your child's name.`,
      child_dob:'Date of birth noted, thank you.',
      child_temp:`Temperature noted, thank you.`,
      child_breathing:'Noted.', child_diarrhea:'Understood.', child_vomiting:'Noted.',
      child_appearance:'Noted, thank you for these details.',
    };
    return m[field] || 'Noted, thank you.';
  }
  const fn = value.split(' ')[0];
  const m: Partial<Record<keyof VitaraState,string>> = {
    full_name:`Merci beaucoup, ${fn} !`,
    phone:`Parfait, numéro de téléphone bien noté.`,
    email:`Merci beaucoup, votre courriel est bien noté.`,
    ramq:`Merci, votre numéro d'assurance maladie est bien enregistré.`,
    service:`Bien sûr, je vais vous aider pour cela.`,
    practitioner:`Noté, je vais vérifier les disponibilités de ${value}.`,
    reason:`Je comprends, merci de me l'avoir indiqué.`,
    body_part:`Merci, j'ai bien noté la zone concernée.`,
    pain_scale:`Je suis désolée d'entendre cela. Douleur ${value}/10 notée.`,
    accident_type:value==='CNESST'?'Accident de travail noté.':value==='SAAQ'?'Accident de route noté.':value==='none'?'Très bien.':'Noté.',
    claim_number:`Merci, numéro de dossier bien enregistré.`,
    child_name:`Merci beaucoup. J'ai bien noté le nom de votre enfant.`,
    child_dob:`Date de naissance notée, merci.`,
    child_temp:`Merci, j'ai bien noté la température.`,
    child_breathing:`Merci pour cette précision.`,
    child_diarrhea:`Merci, j'ai noté.`,
    child_vomiting:`Je comprends, merci de me l'avoir indiqué.`,
    child_appearance:`Merci beaucoup pour tous ces détails.`,
  };
  return m[field] || 'Merci.';
}
