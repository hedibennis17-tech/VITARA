// ── Next Best Question Engine ─────────────────────────────────
// Le SERVEUR décide quoi demander. Groq dit juste comment le dire.
// Jamais de formulaire fixe — on regarde ce qui manque.

export interface NextAction {
  type:     'question' | 'slots' | 'done';
  field?:   string;
  question?: string;  // FR
  question_en?: string;
  question_ar?: string;
}

const FAMILY_DOCTORS = [
  'Dr. Fahd Awada','Dr. Bogdan Caricevic','Dr. Lucien Fruchtermann',
  'Dr. Myrlène Kalim','Dr. Claudette Moriconi','Dr. Stephanie Moynihan',
  'Dr. Huguette Ohayon-Gabbay','Dr. Samuel Serfaty','Dr. Odette Préfontaine',
];
const PHYSIOS = ['Shaheer Haider, PT','Omar Khalil, PT','Sophie Tremblay, PT'];

function confirmed(state: any, field: string): boolean {
  const f = state[field];
  if (!f) return false;
  if (typeof f === 'string') return !!f;
  return f.status === 'CONFIRMED' || f.status === 'UPDATED';
}

function skipped(state: any, field: string): boolean {
  return state[field]?.status === 'SKIPPED';
}

function val(state: any, field: string): string | null {
  const f = state[field];
  if (!f) return null;
  if (typeof f === 'string') return f;
  return f.value || null;
}

export function getNextAction(state: any, lang = 'fr'): NextAction {
  // ── Identité (si pas encore établie) ─────────────────────
  if (!confirmed(state, 'full_name')) return {
    type: 'question', field: 'full_name',
    question: 'Pouvez-vous me confirmer votre nom complet ?',
    question_en: 'Can you confirm your full name?',
    question_ar: 'هل يمكنك تأكيد اسمك الكامل؟',
  };
  if (!confirmed(state, 'phone')) return {
    type: 'question', field: 'phone',
    question: 'Quel est votre numéro de téléphone ?',
    question_en: 'What is your phone number?',
    question_ar: 'ما هو رقم هاتفك؟',
  };
  if (!confirmed(state, 'email')) return {
    type: 'question', field: 'email',
    question: 'Quelle est votre adresse courriel ?',
    question_en: 'What is your email address?',
    question_ar: 'ما هو بريدك الإلكتروني؟',
  };
  if (!confirmed(state, 'ramq_number')) return {
    type: 'question', field: 'ramq_number',
    question: 'Avez-vous votre numéro de carte d\'assurance maladie (RAMQ) ?',
    question_en: 'Do you have your health insurance number (RAMQ)?',
    question_ar: 'هل لديك رقم بطاقة التأمين الصحي (RAMQ)؟',
  };

  // ── Service ───────────────────────────────────────────────
  if (!confirmed(state, 'requested_service')) return {
    type: 'question', field: 'requested_service',
    question: 'Pour quel service souhaitez-vous consulter aujourd\'hui ?',
    question_en: 'Which service do you need today?',
    question_ar: 'أي خدمة تحتاج اليوم؟',
  };

  const service = val(state, 'requested_service') || '';

  // ── Médecin/Praticien selon le service ───────────────────
  if (!confirmed(state, 'requested_practitioner')) {
    if (service.includes('medecin') || service.includes('famille') || service.includes('family')) {
      const list = FAMILY_DOCTORS.join(' | ');
      return {
        type: 'question', field: 'requested_practitioner',
        question: `Quel est votre médecin de famille ? (${list})`,
        question_en: `Who is your family doctor? (${list})`,
        question_ar: `من هو طبيبك العائلي؟ (${list})`,
      };
    }
    if (service.includes('physio')) {
      const list = PHYSIOS.join(' | ');
      return {
        type: 'question', field: 'requested_practitioner',
        question: `Souhaitez-vous un physiothérapeute en particulier ? (${list})`,
        question_en: `Do you prefer a specific physiotherapist? (${list})`,
        question_ar: `هل تفضل معالجًا فيزيائيًا معينًا؟ (${list})`,
      };
    }
  }

  // ── Motif ─────────────────────────────────────────────────
  if (!confirmed(state, 'reason')) return {
    type: 'question', field: 'reason',
    question: 'Pour quel motif souhaitez-vous consulter ?',
    question_en: 'What is the reason for your consultation?',
    question_ar: 'ما سبب استشارتك؟',
  };

  // ── Zone corporelle ───────────────────────────────────────
  if (!confirmed(state, 'body_part')) return {
    type: 'question', field: 'body_part',
    question: 'Où ressentez-vous exactement le problème ?',
    question_en: 'Where exactly do you feel the problem?',
    question_ar: 'أين بالضبط تشعر بالمشكلة؟',
  };

  // ── Intensité douleur ────────────────────────────────────
  if (!confirmed(state, 'urgency_level')) return {
    type: 'question', field: 'urgency_level',
    question: 'Sur une échelle de 0 à 10, quelle est l\'intensité de votre douleur ?',
    question_en: 'On a scale of 0 to 10, how intense is the pain?',
    question_ar: 'على مقياس من 0 إلى 10، ما شدة الألم؟',
  };

  // ── Accident (seulement si physio ou motif évoque accident) ─
  const reason = (val(state, 'reason') || '').toLowerCase();
  const needsAccident = service.includes('physio') ||
    /accident|travail|chute|blessure|cnesst|saaq/i.test(reason);
  if (needsAccident && !confirmed(state, 'accident_type') && !skipped(state, 'accident_type')) {
    return {
      type: 'question', field: 'accident_type',
      question: 'Est-ce lié à un accident de travail (CNESST) ou de la route (SAAQ) ?',
      question_en: 'Is this related to a work accident (CNESST) or road accident (SAAQ)?',
      question_ar: 'هل هذا مرتبط بحادث عمل (CNESST) أو حادث طريق (SAAQ)؟',
    };
  }

  // ── N° dossier accident (SKIPPABLE) ─────────────────────
  const accType = val(state, 'accident_type');
  if (accType === 'CNESST' && !confirmed(state, 'cnesst_claim_number') && !skipped(state, 'cnesst_claim_number')) {
    return {
      type: 'question', field: 'cnesst_claim_number',
      question: 'Avez-vous un numéro de dossier CNESST ? (dites "pas encore" si vous ne l\'avez pas)',
      question_en: 'Do you have a CNESST file number? (say "not yet" if you don\'t have it)',
      question_ar: 'هل لديك رقم ملف CNESST؟ (قل "ليس بعد" إذا لم يكن لديك)',
    };
  }
  if (accType === 'SAAQ' && !confirmed(state, 'saaq_claim_number') && !skipped(state, 'saaq_claim_number')) {
    return {
      type: 'question', field: 'saaq_claim_number',
      question: 'Avez-vous un numéro de dossier SAAQ ? (dites "pas encore" si vous ne l\'avez pas)',
      question_en: 'Do you have a SAAQ file number? (say "not yet" if you don\'t have it)',
      question_ar: 'هل لديك رقم ملف SAAQ؟',
    };
  }

  // ── Tout collecté → présenter les créneaux ───────────────
  return { type: 'slots' };
}
