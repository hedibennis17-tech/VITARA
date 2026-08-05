// ================================================================
// Mode DÉMO — données en mémoire quand DATABASE_URL n'est pas défini
// ================================================================

export const DEMO_MODE = !process.env.DATABASE_URL;

export const DEMO_USERS = [
  { id: 'u-admin-001', email: 'admin@vitara.ca',         password_hash: '$2b$12$CkPUTXCGWkilGMk4HKLCmOlqA/raouDHvRuM.OJs4LaWCMBc0GPvS', first_name: 'Admin',        last_name: 'VITARA',    clinic_id: 'c-001', is_active: true, role_name: 'admin' },
  { id: 'u-sup-001',   email: 'superviseur@vitara.ca',   password_hash: '$2b$12$CkPUTXCGWkilGMk4HKLCmOlqA/raouDHvRuM.OJs4LaWCMBc0GPvS', first_name: 'Marie',        last_name: 'Superviseur', clinic_id: 'c-001', is_active: true, role_name: 'supervisor' },
  { id: 'u-rec-001',   email: 'reception@vitara.ca',     password_hash: '$2b$12$CkPUTXCGWkilGMk4HKLCmOlqA/raouDHvRuM.OJs4LaWCMBc0GPvS', first_name: 'Sophie',      last_name: 'Réception', clinic_id: 'c-001', is_active: true, role_name: 'receptionist' },
  { id: 'u-doc-001',   email: 'dr.martin@vitara.ca',     password_hash: '$2b$12$CkPUTXCGWkilGMk4HKLCmOlqA/raouDHvRuM.OJs4LaWCMBc0GPvS', first_name: 'Jean-François', last_name: 'Martin', clinic_id: 'c-001', is_active: true, role_name: 'physician' },
  { id: 'u-doc-002',   email: 'dr.tremblay@vitara.ca',   password_hash: '$2b$12$CkPUTXCGWkilGMk4HKLCmOlqA/raouDHvRuM.OJs4LaWCMBc0GPvS', first_name: 'Marc',        last_name: 'Tremblay', clinic_id: 'c-001', is_active: true, role_name: 'physician' },
  { id: 'u-phy-001',   email: 'o.khalil@vitara.ca',      password_hash: '$2b$12$CkPUTXCGWkilGMk4HKLCmOlqA/raouDHvRuM.OJs4LaWCMBc0GPvS', first_name: 'Omar',        last_name: 'Khalil',  clinic_id: 'c-001', is_active: true, role_name: 'therapist' },
];

export const DEMO_PATIENTS = [
  { id: 'p-001', first_name: 'Marie',  last_name: 'Leclerc',  date_of_birth: '1985-03-12', gender: 'F', phone: '5145550142', email: 'marie.leclerc@email.com', language: 'fr', ramq_number: 'LECM85031298', allergies: ['Pénicilline'], primary_provider: 'Dr. Jean-François Martin', department_name: 'Physiothérapie', last_visit: '2026-07-28', is_active: true },
  { id: 'p-002', first_name: 'Ahmed',  last_name: 'Benali',   date_of_birth: '1978-11-04', gender: 'M', phone: '4385550287', email: 'a.benali@email.com',       language: 'ar', ramq_number: 'BENA78110498', allergies: [], primary_provider: 'Dr. Jean-François Martin', department_name: 'Médecine familiale', last_visit: '2026-07-15', is_active: true },
  { id: 'p-003', first_name: 'Sarah',  last_name: 'Johnson',  date_of_birth: '1992-06-29', gender: 'F', phone: '5145550391', email: 'sjohnson@email.com',        language: 'en', ramq_number: 'JOHS92062994', allergies: ['Aspirine', 'Codéine'], primary_provider: 'Dr. Marc Tremblay', department_name: 'Cardiologie', last_visit: '2026-08-01', is_active: true },
  { id: 'p-004', first_name: 'Jean',   last_name: 'Tremblay', date_of_birth: '1960-01-17', gender: 'M', phone: '4505550054', email: null,                        language: 'fr', ramq_number: 'TREJ60011798', allergies: [], primary_provider: 'Dr. Marc Tremblay', department_name: 'Gériatrie', last_visit: '2026-06-30', is_active: true },
  { id: 'p-005', first_name: 'Fatima', last_name: 'Zahra',    date_of_birth: '2001-08-22', gender: 'F', phone: '5145550918', email: 'f.zahra@email.com',         language: 'ar', ramq_number: 'ZAHF01082207', allergies: ['Latex'], primary_provider: 'Dr. Linh Nguyen', department_name: 'Psychologie', last_visit: '2026-07-20', is_active: true },
  { id: 'p-006', first_name: 'Louis',  last_name: 'Bergeron', date_of_birth: '1975-04-08', gender: 'M', phone: '4385550632', email: 'louis.b@email.com',          language: 'fr', ramq_number: 'BERL75040801', allergies: [], primary_provider: 'Dr. Marc Tremblay', department_name: 'Urgence mineure', last_visit: '2026-08-05', is_active: true },
];

const TODAY = new Date().toISOString().slice(0, 10);

export const DEMO_APPOINTMENTS = [
  { id: 'a-001', date: TODAY, start_time: '09:00', end_time: '09:45', status: 'confirmed', type: 'in_person',   patient_name: 'Marie Leclerc',  patient_phone: '5145550142', provider_name: 'M.Pht. Omar Khalil', department_name: 'Physiothérapie',     department_color: '#00E5A0', reason: 'Douleur au dos — séance 3' },
  { id: 'a-002', date: TODAY, start_time: '10:00', end_time: '10:30', status: 'confirmed', type: 'in_person',   patient_name: 'Ahmed Benali',   patient_phone: '4385550287', provider_name: 'Dr. Jean-François Martin', department_name: 'Médecine familiale', department_color: '#00C5D4', reason: 'Bilan annuel' },
  { id: 'a-003', date: TODAY, start_time: '11:00', end_time: '11:30', status: 'scheduled', type: 'teleconsult', patient_name: 'Sarah Johnson',  patient_phone: '5145550391', provider_name: 'Dr. Marc Tremblay', department_name: 'Médecine familiale',   department_color: '#00C5D4', reason: 'Résultats analyses sang' },
  { id: 'a-004', date: TODAY, start_time: '14:00', end_time: '14:30', status: 'scheduled', type: 'in_person',   patient_name: 'Jean Tremblay',  patient_phone: '4505550054', provider_name: 'Dr. Marc Tremblay', department_name: 'Médecine familiale',   department_color: '#00C5D4', reason: 'Contrôle tension artérielle' },
  { id: 'a-005', date: TODAY, start_time: '15:00', end_time: '16:00', status: 'confirmed', type: 'in_person',   patient_name: 'Fatima Zahra',   patient_phone: '5145550918', provider_name: 'Dr. Linh Nguyen', department_name: 'Psychologie',          department_color: '#A78BFA', reason: 'Séance régulière' },
];

export const DEMO_CALLS = [
  { id: 'c-001', caller_phone: '5145550918', status: 'active',    language: 'ar', ai_intent: 'book_appointment',   scenario: 'Prise de rendez-vous — Psychologie', duration_sec: null, patient_name: 'Fatima Zahra',  handled_by_ai: true,  elapsed_sec: 187 },
  { id: 'c-002', caller_phone: '4505550054', status: 'queued',    language: 'fr', ai_intent: null,                  scenario: null, duration_sec: null, patient_name: null, handled_by_ai: true, elapsed_sec: 45 },
  { id: 'c-003', caller_phone: '5145550142', status: 'completed', language: 'fr', ai_intent: 'book_appointment',   scenario: 'Prise de rendez-vous — Physiothérapie', duration_sec: 167, patient_name: 'Marie Leclerc', handled_by_ai: true, elapsed_sec: 167 },
  { id: 'c-004', caller_phone: '4385550287', status: 'completed', language: 'fr', ai_intent: 'cancel_appointment', scenario: 'Annulation rendez-vous', duration_sec: 78, patient_name: 'Ahmed Benali', handled_by_ai: true, elapsed_sec: 78 },
  { id: 'c-005', caller_phone: '5145550391', status: 'completed', language: 'en', ai_intent: 'exam_results',       scenario: 'Résultats d\'examen', duration_sec: 134, patient_name: 'Sarah Johnson', handled_by_ai: true, elapsed_sec: 134 },
  { id: 'c-006', caller_phone: '4505550054', status: 'missed',    language: 'fr', ai_intent: null,                  scenario: null, duration_sec: null, patient_name: 'Jean Tremblay', handled_by_ai: false, elapsed_sec: null },
];

export const DEMO_DASHBOARD = {
  calls: {
    calls_today: 127, calls_active: 2, calls_missed: 3, calls_queued: 1,
    calls_ai: 118, avg_duration_sec: 156, avg_wait_sec: 14,
  },
  appointments: {
    appointments_today: 62, confirmed: 47, completed: 9,
    cancelled: 4, no_show: 2, pending: 13,
  },
  patients: { patients_served_today: 89 },
  activeCalls: DEMO_CALLS.filter(c => ['active','queued'].includes(c.status)),
  upcomingAppointments: DEMO_APPOINTMENTS.filter(a => ['scheduled','confirmed'].includes(a.status)),
};

export const DEMO_DEPARTMENTS = [
  { id: 'd-001', name: 'Médecine familiale', name_en: 'Family Medicine', category: 'medicine',       icon: '🩺', color: '#00C5D4', provider_count: 2, sort_order: 1 },
  { id: 'd-002', name: 'Physiothérapie',     name_en: 'Physiotherapy',   category: 'rehabilitation', icon: '🦾', color: '#00E5A0', provider_count: 1, sort_order: 2 },
  { id: 'd-003', name: 'Psychologie',         name_en: 'Psychology',      category: 'mental_health',  icon: '💭', color: '#A78BFA', provider_count: 1, sort_order: 3 },
  { id: 'd-004', name: 'Cardiologie',         name_en: 'Cardiology',      category: 'specialists',    icon: '❤️', color: '#EF4444', provider_count: 1, sort_order: 4 },
  { id: 'd-005', name: 'Pédiatrie',           name_en: 'Pediatrics',      category: 'medicine',       icon: '👶', color: '#F9A826', provider_count: 1, sort_order: 5 },
  { id: 'd-006', name: 'Nutrition clinique',  name_en: 'Clinical Nutrition', category: 'nutrition',  icon: '🥗', color: '#86EFAC', provider_count: 1, sort_order: 6 },
];
