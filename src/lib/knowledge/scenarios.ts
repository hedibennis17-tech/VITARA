// ============================================================
// VITARA Knowledge Base — Scénarios conversationnels
// 30 scénarios couvrant FR, EN, AR
// ============================================================

export interface Scenario {
  id: string;
  title: string;
  tags: string[];        // mots-clés pour le matching
  dept?: string;
  priority: number;      // 1=haute, 3=basse
  context: string;       // texte injecté dans le system prompt
}

export const SCENARIOS: Scenario[] = [

  // ────────────── PRISE DE RDV ──────────────
  {
    id: 'S001',
    title: 'Nouveau patient — premier rendez-vous',
    tags: ['nouveau','new','premier','first','inscription','register','jamais venu','never been'],
    dept: 'all',
    priority: 1,
    context: `SCENARIO: Nouveau patient (premier contact)
Actions requises:
- Souhaiter la bienvenue chaleureusement
- Demander: prénom, nom de famille, numéro de téléphone, courriel
- Demander la raison principale de la visite (douleur, suivi, prévention…)
- Orienter vers le bon département selon la raison
- Proposer 3 créneaux dans les 5 prochains jours ouvrables
- Documents à apporter: carte RAMQ + carte assurance maladie complémentaire
- Confirmer par SMS et courriel. Code format: VIT-XXXX`
  },

  {
    id: 'S002',
    title: 'Patient existant — reprise de rendez-vous',
    tags: ['patient existant','existing patient','déjà venu','been before','reprendre','resume','suivi','follow-up'],
    dept: 'all',
    priority: 1,
    context: `SCENARIO: Patient existant — reprise de suivi
Actions requises:
- Identifier le patient: demander nom + téléphone pour retrouver le dossier
- Confirmer les informations dans le dossier
- Demander: avec quel professionnel souhaitez-vous un RDV?
- Vérifier la disponibilité du professionnel habituel en priorité
- Si non disponible, proposer un collègue du même département
- Rappeler si une ordonnance médicale est nécessaire pour le RDV`
  },

  {
    id: 'S003',
    title: 'Annulation de rendez-vous',
    tags: ['annuler','cancel','annulation','cancellation','supprimer','delete','ne peux pas venir','cannot come','absent'],
    dept: 'all',
    priority: 1,
    context: `SCENARIO: Annulation de rendez-vous
Actions requises:
- Identifier le RDV: demander nom, date approximative du RDV
- Exprimer de la compréhension sans jugement
- Confirmer l'annulation (code VIT-XXXX ou date/heure)
- Proposer immédiatement un nouveau créneau (si patient intéressé)
- Mentionner la politique: annulation 24h à l'avance recommandée
- Envoyer confirmation d'annulation par SMS
- Note: liste d'attente active — le créneau libéré est proposé à d'autres patients`
  },

  {
    id: 'S004',
    title: 'Changement / reprogrammation de rendez-vous',
    tags: ['changer','change','modifier','reschedule','déplacer','move','reporter','postpone','autre date','different date'],
    dept: 'all',
    priority: 1,
    context: `SCENARIO: Changement de rendez-vous
Actions requises:
- Identifier le RDV actuel (nom + date approximative)
- Demander la nouvelle préférence: matin/après-midi, jours de la semaine
- Proposer 3 nouveaux créneaux disponibles
- Confirmer le changement avec nouveau code VIT-XXXX
- Envoyer SMS + email de confirmation avec nouveau créneau
- Annuler automatiquement l'ancien RDV`
  },

  // ────────────── URGENCES ──────────────
  {
    id: 'S005',
    title: 'Urgence médicale absolue — redirection 911',
    tags: ['urgence','emergency','911','ambulance','inconscient','unconscious','douleur poitrine','chest pain','souffle','breathe','accident','overdose'],
    dept: 'urgence',
    priority: 1,
    context: `SCENARIO: URGENCE MÉDICALE ABSOLUE ⚠️
Réponse IMMÉDIATE requise:
- Rester calme et rassurant
- Dire CLAIREMENT: "Composez le 911 immédiatement"
- Ne pas maintenir la personne en ligne
- Si symptômes cardiaques: douleur poitrine, bras gauche, mâchoire → 911 URGENT
- Si perte de connaissance, difficultés respiratoires → 911 URGENT
- Rappeler: clinique n'est PAS un service d'urgence
- Intent: TOUJOURS retourner "emergency" pour ces cas
- Numéros utiles: 911 (urgences), 811 (Info-Santé Québec)`
  },

  {
    id: 'S006',
    title: 'Urgence non-vitale — rendez-vous urgent',
    tags: ['urgent','urgently','aujourd\'hui','today','douleur aiguë','acute pain','fièvre élevée','high fever','infection','wound','blessure','plaie'],
    dept: 'all',
    priority: 1,
    context: `SCENARIO: Urgence non-vitale — RDV urgentiste
Actions requises:
- Évaluer la gravité: échelle 1-10 de la douleur
- Si score ≥ 8 ou symptômes alarmants → suggérer clinique urgence/911
- Si score ≤ 7 → chercher créneau AUJOURD'HUI ou lendemain matin
- Vérifier si infirmière praticienne disponible (soins urgents)
- Proposer téléconsultation si déplacement difficile
- Temps d'attente estimé communiqué d'emblée`
  },

  // ────────────── DÉPARTEMENTS SPÉCIALISÉS ──────────────
  {
    id: 'S007',
    title: 'Physiothérapie — douleur musculo-squelettique',
    tags: ['physio','physiothérapie','physiotherapy','dos','back','épaule','shoulder','genou','knee','hanche','hip','cheville','ankle','sport','muscle','tendon','blessure sportive'],
    dept: 'physiotherapie',
    priority: 1,
    context: `SCENARIO: Physiothérapie
Professionnels disponibles: M. Omar Khalil, Mme Sophie Tremblay
Spécialités: rachis, membres inférieurs, membres supérieurs, sport, post-opératoire
Durée séances: évaluation initiale 60min, suivi 45min
Ordonnance médicale: non requise (accès direct au Québec)
Actions requises:
- Identifier la zone douloureuse et la durée des symptômes
- Demander si accident/trauma ou douleur progressive
- Évaluation initiale recommandée d'abord
- Proposer séries de traitements (ex: 6-10 séances)
- Exercices à domicile: une fiche sera remise après évaluation
- Assurances acceptées: RAMQ, Croix Bleue, Desjardins, SSQ, GMS`
  },

  {
    id: 'S008',
    title: 'Médecine familiale — soins primaires',
    tags: ['médecin','doctor','famille','family','généraliste','general','ordonnance','prescription','renouvellement','renewal','résultats','results','bilan','checkup','vaccination','grippe','flu'],
    dept: 'medecine-familiale',
    priority: 1,
    context: `SCENARIO: Médecine familiale
Médecins disponibles: Dr. Jean-François Martin, Dr. Marie Leclerc
Spécialités: soins primaires, prévention, maladies chroniques, pédiatrie de base
Durée séances: consultation standard 20min, bilan complet 40min
Ordonnance médicale: requise pour certains tests
Actions requises:
- Demander la raison principale de la consultation
- Cas renouvellement ordonnance: nom du médicament + pharmacie
- Cas résultats: type de test + date approximative
- Cas bilan annuel: planifier 40min, recommander prise de sang préalable
- Vaccination: vérifier carte de vaccination si possible
- Téléconsultation disponible pour suivis et questions simples`
  },

  {
    id: 'S009',
    title: 'Cardiologie — santé cardiovasculaire',
    tags: ['cardiologie','cardiology','coeur','heart','tension','pressure','cholestérol','cholesterol','palpitations','palpitation','essoufflement','shortness of breath','cardiologue'],
    dept: 'cardiologie',
    priority: 1,
    context: `SCENARIO: Cardiologie
Médecins: Dr. Marc Tremblay (cardiologue certifié)
Spécialités: hypertension, arythmies, insuffisance cardiaque, prévention cardiovasculaire
Durée: consultation initiale 60min, suivi 30min
Pré-requis: ordonnance du médecin de famille recommandée
Actions requises:
- Si douleur thoracique ACTUELLE → rediriger vers 911
- Demander: antécédents familiaux cardiaques, médicaments actuels
- Électrocardiogramme (ECG) peut être requis avant consultation
- Apporter: résultats de prise de sang récents si disponibles
- Liste d'attente: prévoir 2-4 semaines pour consultation initiale`
  },

  {
    id: 'S010',
    title: 'Psychologie — santé mentale',
    tags: ['psychologie','psychology','psy','anxiété','anxiety','dépression','depression','stress','burn-out','burnout','trauma','PTSD','thérapie','therapy','mental','santé mentale','mental health'],
    dept: 'psychologie',
    priority: 1,
    context: `SCENARIO: Psychologie / Santé mentale
Psychologues: Dr. Amira Hassan (Ph.D.), M. Pierre Dubois (M.Ps.)
Spécialités: TCC (thérapie cognitivo-comportementale), trauma, anxiété, dépression, gestion du stress
Durée séances: 50min
Confidentialité: absolue (règles déontologiques strictes)
Actions requises:
- Aborder avec douceur et sans jugement
- Si détresse immédiate → mentionner: 811 (Info-Santé), 1-866-APPELLE (crise)
- Première consultation: évaluation des besoins + objectifs thérapeutiques
- Assurances: vérifier couverture (souvent partiellement couvert)
- Téléconsultation très populaire pour ce département`
  },

  {
    id: 'S011',
    title: 'Ergothérapie — retour aux activités',
    tags: ['ergothérapie','occupational therapy','ergo','ergothérapeute','travail','work','retour au travail','return to work','adaption','handicap','AVC','stroke','fonctionnel'],
    dept: 'ergotherapie',
    priority: 2,
    context: `SCENARIO: Ergothérapie
Ergothérapeutes: Mme Fatima Zahra, M. Lucas Bernard
Spécialités: réadaptation fonctionnelle, retour au travail, AVC, troubles neuromoteurs
Durée évaluation: 90min, suivis 60min
Ordonnance: recommandée mais non obligatoire
Actions requises:
- Identifier le contexte: accident, maladie, post-opératoire, handicap
- Demander les limitations actuelles dans les activités quotidiennes
- Programme personnalisé établi après évaluation complète
- Peut inclure: adaptations domicile, équipements spécialisés
- CSST/CNESST: paperasse administrative gérée par l'équipe`
  },

  {
    id: 'S012',
    title: 'Nutrition / Diététique',
    tags: ['nutrition','diététique','dietitian','nutritionniste','poids','weight','diabète','diabetes','alimentation','diet','obésité','obesity','végétarien','vegan','allergie alimentaire','food allergy'],
    dept: 'nutrition',
    priority: 2,
    context: `SCENARIO: Nutrition et Diététique
Nutritionnistes: Mme Claire Fontaine (Dt.P.), M. Youssef Benali (Dt.P.)
Spécialités: diabète, maladies cardiovasculaires, gestion du poids, troubles alimentaires, végétalisme
Durée: évaluation initiale 75min, suivi 45min
Actions requises:
- Demander l'objectif principal (perte de poids, maladie chronique, performance sportive…)
- Demander: restrictions alimentaires actuelles, allergies
- Bilan alimentaire: journal de 3 jours peut être demandé avant RDV
- Programme: minimum 3-4 consultations recommandées pour résultats
- Note: assurances couvrent généralement si diabète, grossesse ou ordonnance`
  },

  // ────────────── TÉLÉCONSULTATION ──────────────
  {
    id: 'S013',
    title: 'Téléconsultation vidéo',
    tags: ['téléconsultation','teleconsult','vidéo','video','en ligne','online','virtuel','virtual','à distance','remote','Teams','Zoom','maison','home'],
    dept: 'all',
    priority: 1,
    context: `SCENARIO: Téléconsultation (vidéo)
Plateforme: Cortexa Health (lien envoyé par SMS 30min avant)
Disponible pour: médecine familiale, psychologie, nutrition, suivi physiothérapie
Exigences techniques: connexion internet stable, caméra, microphone
Pas disponible pour: première évaluation physio/ergo, examens physiques complexes
Actions requises:
- Confirmer que le patient a accès: smartphone/tablette/ordinateur
- Envoyer lien de connexion 30min avant par SMS
- Rappeler: avoir une pièce calme et privée
- Si problème technique le jour J: numéro support 1-855-VITARA-1
- Tarif identique à une consultation en personne
- Remboursement assurances: identique au présentiel`
  },

  // ────────────── SCÉNARIOS EN ANGLAIS ──────────────
  {
    id: 'S014',
    title: 'English — New patient booking',
    tags: ['new patient english','book appointment','schedule','first time','never been','appointment booking'],
    dept: 'all',
    priority: 1,
    context: `SCENARIO: New Patient (English)
Required actions:
- Welcome warmly and confirm English service
- Collect: first name, last name, phone, email
- Ask main reason for visit
- Offer 3 available slots within the next 5 business days
- Documents to bring: provincial health card + insurance card
- Send SMS and email confirmation (code format: VIT-XXXX)
- Inform about parking: free for first 2 hours, validated at reception`
  },

  {
    id: 'S015',
    title: 'English — Emergency redirect',
    tags: ['english emergency','chest pain','difficulty breathing','unconscious','call 911'],
    dept: 'urgence',
    priority: 1,
    context: `SCENARIO: English Emergency
IMMEDIATE response:
- Stay calm and reassuring
- Clearly state: "Please call 911 immediately"
- Do NOT keep the person on the line
- Chest pain + arm/jaw pain → 911 NOW
- Difficulty breathing → 911 NOW
- For non-life-threatening urgency: direct to walk-in clinic or ER
- Useful numbers: 911 (emergencies), 811 (Info-Santé Quebec, English service available)`
  },

  {
    id: 'S016',
    title: 'English — Physiotherapy',
    tags: ['physiotherapy english','physio','back pain english','sports injury','rehabilitation'],
    dept: 'physiotherapie',
    priority: 2,
    context: `SCENARIO: Physiotherapy (English)
Available therapists: Mr. Omar Khalil, Ms. Sophie Tremblay (both bilingual)
Initial evaluation: 60 min | Follow-up: 45 min
No referral needed in Quebec (direct access)
Required actions:
- Ask location and duration of pain
- Identify if traumatic or gradual onset
- Recommend initial evaluation first
- Insurance: Blue Cross, Sun Life, Manulife, GMS accepted
- Treatment series typically: 6-10 sessions`
  },

  {
    id: 'S017',
    title: 'English — Mental health appointment',
    tags: ['mental health english','anxiety english','depression english','therapy english','psychologist'],
    dept: 'psychologie',
    priority: 1,
    context: `SCENARIO: Mental Health (English)
Psychologists: Dr. Amira Hassan (English/French/Arabic), Mr. Pierre Dubois (English/French)
Specialties: CBT, trauma, anxiety, depression, stress management
Session duration: 50 min | Strict confidentiality
Required actions:
- Approach with care and without judgment
- If in crisis → mention: 1-833-456-4566 (Crisis Services Canada)
- First session: needs assessment + therapeutic goals
- Telehealth very popular for this department
- Insurance often partially covers (verify coverage)`
  },

  // ────────────── SCÉNARIOS EN ARABE ──────────────
  {
    id: 'S018',
    title: 'عربي — حجز موعد جديد',
    tags: ['arabic','arabe','عربي','موعد','appointment arabic','arabic patient','مريض جديد'],
    dept: 'all',
    priority: 1,
    context: `سيناريو: مريض جديد (عربي)
الإجراءات المطلوبة:
- الترحيب بحرارة وتأكيد الخدمة باللغة العربية
- جمع المعلومات: الاسم الأول، اسم العائلة، الهاتف، البريد الإلكتروني
- السؤال عن سبب الزيارة الرئيسي
- تقديم 3 مواعيد متاحة خلال الأيام الخمسة القادمة
- الوثائق المطلوبة: بطاقة RAMQ + بطاقة التأمين الصحي
- إرسال تأكيد SMS + بريد إلكتروني (الرمز: VIT-XXXX)
SCENARIO for AI: Respond in Arabic, be warm and culturally sensitive. 
Professionals available: Dr. Hassan speaks Arabic.`
  },

  // ────────────── SCÉNARIOS SPÉCIAUX ──────────────
  {
    id: 'S019',
    title: 'Renouvellement d\'ordonnance',
    tags: ['renouvellement','renewal','ordonnance','prescription','médicament','medication','pharmacie','pharmacy','pilule','tablets'],
    dept: 'medecine-familiale',
    priority: 1,
    context: `SCENARIO: Renouvellement d'ordonnance
Processus:
- Identifier le médicament + posologie actuelle
- Demander: depuis combien de temps prend ce médicament?
- Vérifier si changements depuis dernière visite (effets secondaires, etc.)
- 2 options: consultation courte 15min OU envoi à la pharmacie si suivi récent (<6 mois)
- Pharmacie partenaires: Jean Coutu, Pharmaprix, Familiprix
- Délai: 24-48h pour transmission ordonnance
- Note: certains médicaments contrôlés nécessitent consultation obligatoire`
  },

  {
    id: 'S020',
    title: 'Résultats d\'examens',
    tags: ['résultats','results','analyse','blood test','prise de sang','radiologie','radiology','scanner','IRM','MRI','xray','rayon-x','mammographie'],
    dept: 'medecine-familiale',
    priority: 1,
    context: `SCENARIO: Résultats d'examens médicaux
Processus:
- Identifier le type d'examen et la date approximative
- Résultats disponibles via: portail patient (si inscrit) OU consultation
- Délai typique: prise de sang 24-48h, imagerie 3-7 jours
- Si résultats urgents → médecin appelle directement le patient
- Consultation pour discussion des résultats: 15-20min
- Portail patient: vitara-patient.ca (inscription en ligne)
- Pour résultats inquiétants: prioriser consultation même-jour ou lendemain`
  },

  {
    id: 'S021',
    title: 'Vaccination — adulte et enfant',
    tags: ['vaccination','vaccin','vaccine','grippe','flu shot','COVID','covid','hépatite','hepatitis','voyage','travel','enfant','child','nourrisson','baby'],
    dept: 'medecine-familiale',
    priority: 2,
    context: `SCENARIO: Vaccination
Types disponibles à la clinique:
- Grippe (saison: oct-nov), COVID (booster annuel)
- Hépatite A/B, Pneumonie, Zona, HPV
- Vaccins voyage: typhoid, hépatite A, fièvre jaune (référence spécialisée)
- Pédiatrie: calendrier standard Québec (0-18 ans)
Actions requises:
- Demander quel vaccin + âge du patient
- Vaccination grippe: pas de RDV nécessaire, clinique sans rendez-vous
- Autres vaccins: RDV 20min
- Apporter: carnet de vaccination si disponible
- Coût: gratuit RAMQ pour grippes, certains payants (voyage)`
  },

  {
    id: 'S022',
    title: 'Pédiatrie — enfant malade',
    tags: ['enfant','child','bébé','baby','nourrisson','pediatrie','pediatrics','fièvre enfant','child fever','oreilles','ears','otite','toux','cough','gorge','throat','nourrisson'],
    dept: 'pediatrie',
    priority: 1,
    context: `SCENARIO: Pédiatrie / Enfant malade
Médecins: Dr. Martin (pédiatrie générale), Infirmière praticienne Mme Roy
Urgences pédiatriques: CHU Sainte-Justine ou Montreal Children's Hospital
Actions requises:
- Demander l'âge de l'enfant et les symptômes
- ALERTE: bébé <3 mois avec fièvre >38°C → urgences pédiatriques IMMÉDIATEMENT
- ALERTE: détresse respiratoire, lèvres bleues → 911
- Fièvre enfant 3 mois-3 ans: RDV urgent si >39°C ou dure >48h
- Éruption cutanée inexpliquée: RDV dans la journée
- Otite, angine: RDV dans 24-48h acceptable
- Téléconsultation disponible pour évaluation préliminaire`
  },

  {
    id: 'S023',
    title: 'Physiothérapie post-opératoire',
    tags: ['post-op','post-opératoire','chirurgie','surgery','opération','operation','récupération','recovery','prothèse','prosthesis','genoux chirurgie','knee surgery','épaule chirurgie'],
    dept: 'physiotherapie',
    priority: 1,
    context: `SCENARIO: Physiothérapie post-opératoire
Spécialistes: M. Omar Khalil (membre certifié en rééducation post-chirurgicale)
Types pris en charge: PTG (genou), PTH (hanche), épaule, rachis, LCA
Délai recommandé: commencer physio selon protocole chirurgien (généralement 2-6 semaines post-op)
Actions requises:
- Demander: type de chirurgie + date + chirurgien
- Demander: protocole de rééducation remis par chirurgien?
- Évaluation initiale: 60min avec bilan complet
- Fréquence: généralement 2-3x/semaine les premières semaines
- Apporter: comptes-rendus opératoires, ordonnance chirurgien si disponible
- Couverture: RAMQ + assurances complémentaires, SAAQ si accident auto, CNESST si travail`
  },

  {
    id: 'S024',
    title: 'Douleur chronique',
    tags: ['douleur chronique','chronic pain','fibromyalgie','fibromyalgia','arthrite','arthritis','rhumatisme','rheumatism','migraines','maux de tête chroniques','douleur permanente'],
    dept: 'all',
    priority: 2,
    context: `SCENARIO: Gestion de la douleur chronique
Approche multidisciplinaire recommandée:
- Médecine familiale: évaluation globale, médication
- Physiothérapie: techniques manuelles, exercices thérapeutiques
- Psychologie: TCC pour gestion de la douleur
- Nutrition: alimentation anti-inflammatoire
Actions requises:
- Demander: depuis combien de temps? Localisation? Impact sur vie quotidienne?
- Demander: traitements déjà essayés?
- Proposer consultation médecine familiale comme point de départ
- Mentionner: programme multidisciplinaire douleur chronique disponible
- Suivi régulier nécessaire: plan de traitement sur 3-6 mois`
  },

  {
    id: 'S025',
    title: 'Bilan de santé annuel (checkup)',
    tags: ['bilan','checkup','annuel','annual','examen médical','medical exam','prévention','preventive','bilan complet','full checkup','physique annuel'],
    dept: 'medecine-familiale',
    priority: 2,
    context: `SCENARIO: Bilan de santé annuel
Recommandé: 1x/an pour adultes de plus de 40 ans, 2x/an pour maladies chroniques
Ce que comprend le bilan:
- Examen physique complet (30-40min)
- Prise de sang (à faire 48h avant le RDV, à jeun)
- Mesure: poids, taille, IMC, tension artérielle, fréquence cardiaque
- Dépistage: cancer, diabète, cholestérol, thyroïde selon âge/risque
Actions requises:
- Planifier RDV de 40min
- Demander de faire prise de sang AVANT le RDV (requête envoyée par courriel)
- Apporter: liste des médicaments actuels
- Dépistages additionnels possibles: mammographie (50+), coloscopie (50+), Pap test`
  },

  {
    id: 'S026',
    title: 'Liste d\'attente — créneau prioritaire',
    tags: ['liste attente','waiting list','plus tôt','earlier','cancellation','annulation','libéré','freed slot','urgent mais pas urgence'],
    dept: 'all',
    priority: 2,
    context: `SCENARIO: Liste d'attente et créneaux prioritaires
Système de liste d'attente VITARA:
- Inscription possible si tous les créneaux sont pris
- Notification automatique par SMS/courriel si annulation
- Patient a 15 minutes pour confirmer le créneau libéré
- Priorité: gravité clinique > ordre d'inscription
Actions requises:
- Proposer inscription sur liste d'attente
- Demander disponibilités préférées (matin/soir, jours semaine)
- Demander si urgence relative (douleur croissante, délai médical)
- Confirmer les coordonnées pour notification rapide
- Créneau le plus proche proposé: selon disponibilité (parfois 24h)`
  },

  {
    id: 'S027',
    title: 'Informations générales — horaires, adresse, stationnement',
    tags: ['horaires','hours','adresse','address','stationnement','parking','où','where','comment arriver','how to get','métro','transport','ouvert','open','fermé','closed'],
    dept: 'all',
    priority: 3,
    context: `SCENARIO: Informations générales clinique
Informations VITARA:
- Adresse: 1234 Boulevard Laval, Laval, QC H7T 1X8
- Téléphone: +1 (514) 555-0100
- Courriel: info@vitara-clinique.ca
- Site web: vitara-clinique.ca | Portail patient: vitara-patient.ca
Horaires:
- Lundi-Vendredi: 7h30 - 20h00
- Samedi: 8h00 - 17h00
- Dimanche: Fermé (urgent: consulter urgences locales)
Stationnement:
- Gratuit: 2 premières heures (valider à la réception)
- Accessible: entrée handicapés côté est, ascenseur disponible
Transport en commun: Autobus 70 arrêt devant la clinique`
  },

  {
    id: 'S028',
    title: 'Assurances et facturation',
    tags: ['assurance','insurance','RAMQ','facturation','billing','remboursement','reimbursement','couverture','coverage','coût','cost','prix','price','tarif','fee'],
    dept: 'all',
    priority: 2,
    context: `SCENARIO: Assurances et facturation
Assurances acceptées: RAMQ, Croix Bleue, Desjardins, SSQ, GMS, Sun Life, Manulife, Great-West
Facturation directe: disponible pour la plupart des assureurs (formulaire à remplir à la première visite)
Tarifs consultations (si non assuré):
- Physiothérapie: 80-120$/séance
- Médecine familiale: couvert RAMQ
- Psychologie: 130-180$/séance (50% couvert certaines assurances)
- Nutrition: 90-130$/séance
- Ergothérapie: 100-150$/séance
Modes de paiement: carte de crédit, débit, comptant
Reçu pour impôts: fourni pour tous les services de santé`
  },

  {
    id: 'S029',
    title: 'Réclamation CNESST / SAAQ',
    tags: ['CNESST','SAAQ','accident travail','work accident','accident auto','car accident','indemnisation','compensation','réclamation','claim','formulaire','form','employeur'],
    dept: 'all',
    priority: 2,
    context: `SCENARIO: Réclamation CNESST / SAAQ
CNESST (accident de travail):
- Apporter: numéro de dossier CNESST, rapport d'accident employeur
- Couverture: 100% des frais de santé liés à l'accident
- Professionnels: physiothérapie, ergothérapie, médecin autorisés CNESST
SAAQ (accident automobile):
- Apporter: numéro de réclamation SAAQ, rapport de police si disponible
- Couverture: soins médicaux + traitements liés à l'accident
- Remboursement direct SAAQ (formulaire fourni à la clinique)
Actions requises:
- Demander type de réclamation et numéro de dossier
- Vérifier que le professionnel demandé est autorisé pour ce type de réclamation
- Expliquer la procédure de facturation directe à l'organisme`
  },

  {
    id: 'S030',
    title: 'Portail patient — inscription et navigation',
    tags: ['portail','portal','compte','account','inscription en ligne','online registration','application','app','mobile','login','connexion','mot de passe','password','profile'],
    dept: 'all',
    priority: 3,
    context: `SCENARIO: Portail patient VITARA
Portail disponible sur: vitara-patient.ca (web) et application mobile iOS/Android
Fonctionnalités:
- Prise de RDV 24h/24 7j/7
- Consultation des résultats d'examens
- Messagerie sécurisée avec l'équipe soignante
- Renouvellement de certaines ordonnances
- Historique des consultations
- Factures et reçus électroniques
Inscription:
- Numéro de carte RAMQ + date de naissance + courriel
- Code d'activation envoyé par SMS
- Premier accès: lier au dossier existant ou créer nouveau profil
Support technique: support@vitara-patient.ca ou 1-855-VITARA-2`
  }
];

