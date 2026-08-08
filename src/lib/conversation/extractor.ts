// ── Extraction déterministe des entités (regex — pas de LLM) ──
// Groq n'est PAS fiable pour normaliser les données. On le fait ici.

export interface ExtractedEntities {
  patient_status?:      string;
  full_name?:           string;
  phone?:               string;  // normalisé 10 chiffres
  email?:               string;  // normalisé minuscule
  ramq_number?:         string;  // normalisé 4L+8D
  requested_service?:   string;
  requested_practitioner?: string;
  accident_type?:       string;
  cnesst_claim_number?: string;
  saaq_claim_number?:   string;
  body_part?:           string;
  urgency_level?:       string;  // chiffre 0-10
  skipped?:             string[];  // champs que le patient n'a pas
}

// Médecins GMF — détection par nom partiel
const DOCTORS: Record<string, string> = {
  'awada':        'Dr. Fahd Awada',
  'caricevic':    'Dr. Bogdan Caricevic',
  'fruchtermann': 'Dr. Lucien Fruchtermann',
  'kalim':        'Dr. Myrlène Kalim',
  'moriconi':     'Dr. Claudette Moriconi',
  'moynihan':     'Dr. Stephanie Moynihan',
  'ohayon':       'Dr. Huguette Ohayon-Gabbay',
  'serfaty':      'Dr. Samuel Serfaty',
  'préfontaine':  'Dr. Odette Préfontaine',
  'prefontaine':  'Dr. Odette Préfontaine',
};

const PHYSIOS: Record<string, string> = {
  'haider':   'Shaheer Haider, PT',
  'khalil':   'Omar Khalil, PT',
  'tremblay': 'Sophie Tremblay, PT',
};

const SERVICES: Record<string, string> = {
  'physio':       'physiotherapie',
  'physiothérap': 'physiotherapie',
  'médecin':      'medecin_de_famille',
  'medecin':      'medecin_de_famille',
  'famille':      'medecin_de_famille',
  'pédiatr':      'pediatrie',
  'pediatr':      'pediatrie',
  'psycholog':    'psychologie',
  'nutritio':     'nutrition',
  'ergo':         'ergotherapie',
  'prise de sang':'prelevement',
  'prélèvement':  'prelevement',
  'sans rendez':  'sans_rdv',
  'urgence':      'urgence_clinique',
  'urgent':       'urgence_clinique',
};

export function extractEntities(msg: string, currentState: Record<string,any>): ExtractedEntities {
  const txt   = msg.trim();
  const lower = txt.toLowerCase().normalize('NFC');
  const result: ExtractedEntities = {};
  const skipped: string[] = [];

  // ── Patient status ─────────────────────────────────────────
  if (!currentState.patient_status) {
    if (/dossier|déjà patient|existant|déjà venu|déjà inscrit/i.test(lower)) {
      result.patient_status = 'EXISTING_PATIENT';
    } else if (/nouveau|première fois|jamais venu|créer un dossier/i.test(lower)) {
      result.patient_status = 'NEW_PATIENT';
    }
  }

  // ── Téléphone — 10 chiffres, peu importe le format ─────────
  if (!currentState.phone?.value) {
    const digits = txt.replace(/\D/g, '');
    // "4 3 8 8 3 3 4 3 1 9" → "4388334319"
    if (digits.length === 10 && /^[0-9]{10}$/.test(digits)) {
      result.phone = digits;
    }
  }

  // ── Email ─────────────────────────────────────────────────
  if (!currentState.email?.value) {
    // Normaliser email vocal: arobase→@, point→.
    let normalized = lower
      .replace(/\s+arobase\s+/g, '@').replace(/\s+à\s+/g, '@').replace(/\s+at\s+/g, '@')
      .replace(/\s+point\s+/g, '.').replace(/\s+dot\s+/g, '.')
      .replace(/\s+tiret\s+du\s+bas\s+/g, '_').replace(/\s+underscore\s+/g, '_')
      .replace(/\s+tiret\s+/g, '-')
      .replace(/\s/g, '');
    const emailMatch = normalized.match(/[\w._+-]+@[\w.-]+\.\w{2,}/);
    if (emailMatch) {
      result.email = emailMatch[0].toLowerCase();
    }
  }

  // ── RAMQ — 4 lettres + 8 chiffres ─────────────────────────
  if (!currentState.ramq_number?.value) {
    const clean = txt.toUpperCase().replace(/[\s\-]/g, '');
    const ramq  = clean.match(/[A-Z]{4}\d{8}/);
    if (ramq) result.ramq_number = ramq[0];
  }

  // ── Médecin nommé ──────────────────────────────────────────
  if (!currentState.requested_practitioner?.value) {
    for (const [key, fullName] of Object.entries(DOCTORS)) {
      if (lower.includes(key)) {
        result.requested_practitioner = fullName;
        result.requested_service = result.requested_service || 'medecin_de_famille';
        break;
      }
    }
    for (const [key, fullName] of Object.entries(PHYSIOS)) {
      if (lower.includes(key)) {
        result.requested_practitioner = fullName;
        result.requested_service = result.requested_service || 'physiotherapie';
        break;
      }
    }
  }

  // ── Service demandé ────────────────────────────────────────
  if (!currentState.requested_service?.value && !result.requested_service) {
    for (const [key, svc] of Object.entries(SERVICES)) {
      if (lower.includes(key)) {
        result.requested_service = svc;
        break;
      }
    }
  }

  // ── Type accident ──────────────────────────────────────────
  if (!currentState.accident_type?.value) {
    if (/cnesst|accident de travail|blessure au travail/i.test(lower)) {
      result.accident_type = 'CNESST';
    } else if (/saaq|accident de voiture|accident de la route|accident routier/i.test(lower)) {
      result.accident_type = 'SAAQ';
    } else if (/ivac|victime|acte criminel/i.test(lower)) {
      result.accident_type = 'IVAC';
    } else if (/pas d'accident|aucun accident|non pas d'accident|pas un accident/i.test(lower)) {
      result.accident_type = 'NONE';
    }
  }

  // ── Numéro dossier CNESST ──────────────────────────────────
  if (!currentState.cnesst_claim_number?.value && currentState.accident_type?.value === 'CNESST') {
    const cnMatch = txt.match(/\d{5,}/);
    if (cnMatch) result.cnesst_claim_number = cnMatch[0];
    if (/pas encore|pas pour le moment|pas de numéro|je n'ai pas|pas disponible/i.test(lower)) {
      skipped.push('cnesst_claim_number');
    }
  }

  // ── Saaq numéro ────────────────────────────────────────────
  if (!currentState.saaq_claim_number?.value && currentState.accident_type?.value === 'SAAQ') {
    const snMatch = txt.match(/\d{5,}/);
    if (snMatch) result.saaq_claim_number = snMatch[0];
    if (/pas encore|pas pour le moment|pas de numéro|je n'ai pas/i.test(lower)) {
      skipped.push('saaq_claim_number');
    }
  }

  // ── Intensité douleur 0-10 ─────────────────────────────────
  if (!currentState.urgency_level?.value) {
    const scoreMatch = lower.match(/\b([0-9]|10)\s*\/?\s*10\b/) || lower.match(/\b([0-9]|10)\b/);
    if (scoreMatch) result.urgency_level = scoreMatch[1];
  }

  // ── Zone corporelle ────────────────────────────────────────
  if (!currentState.body_part?.value) {
    const bodyParts: [RegExp, string][] = [
      [/épaule\s+(droite|gauche)?/i, 'épaule'],
      [/genou\s+(droit|gauche)?/i, 'genou'],
      [/dos|lombaire|colonne/i, 'dos'],
      [/cou|cervicale/i, 'cou'],
      [/poignet|main|doigt/i, 'poignet/main'],
      [/cheville|pied/i, 'cheville/pied'],
      [/hanche|bassin/i, 'hanche'],
      [/coude|bras/i, 'coude/bras'],
      [/abdom|ventre|colon|estomac/i, 'abdomen'],
      [/tête|migraine|crâne/i, 'tête'],
      [/poitrine|thorax|cœur/i, 'poitrine'],
      [/gorge|oreille|nez|sinus/i, 'ORL'],
      [/peau|bouton|éruption/i, 'peau'],
    ];
    for (const [re, label] of bodyParts) {
      const m = txt.match(re);
      if (m) { result.body_part = m[0]; break; }
    }
  }

  if (skipped.length) result.skipped = skipped;
  return result;
}

// Convertir les entités extraites en mise à jour de l'état
export function entitiesToStateUpdate(entities: ExtractedEntities): Record<string, any> {
  const update: Record<string, any> = {};
  const skipped = entities.skipped || [];

  const fieldMap: [keyof ExtractedEntities, string][] = [
    ['phone',                   'phone'],
    ['email',                   'email'],
    ['ramq_number',             'ramq_number'],
    ['requested_service',       'requested_service'],
    ['requested_practitioner',  'requested_practitioner'],
    ['accident_type',           'accident_type'],
    ['cnesst_claim_number',     'cnesst_claim_number'],
    ['saaq_claim_number',       'saaq_claim_number'],
    ['urgency_level',           'urgency_level'],
    ['body_part',               'body_part'],
  ];

  for (const [eKey, sKey] of fieldMap) {
    const val = entities[eKey];
    if (val && typeof val === 'string') {
      update[sKey] = { value: val, status: 'CONFIRMED' };
    }
    if (skipped.includes(sKey)) {
      update[sKey] = { value: null, status: 'SKIPPED' };
    }
  }

  if (entities.patient_status) update.patient_status = entities.patient_status;

  return update;
}
