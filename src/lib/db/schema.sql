-- ================================================================
-- VITARA — Schéma PostgreSQL complet
-- Centre d'appel IA Médical
-- Version 1.0.0
-- ================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- recherche texte floue

-- ================================================================
-- TYPES ENUM
-- ================================================================

CREATE TYPE user_role AS ENUM (
  'admin', 'supervisor', 'receptionist', 'physician', 'therapist', 'nurse'
);

CREATE TYPE patient_gender AS ENUM ('M', 'F', 'other');

CREATE TYPE language_code AS ENUM ('fr', 'en', 'ar', 'es', 'zh', 'pt');

CREATE TYPE appointment_status AS ENUM (
  'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'waiting'
);

CREATE TYPE appointment_type AS ENUM ('in_person', 'teleconsult', 'phone');

CREATE TYPE call_status AS ENUM (
  'queued', 'active', 'completed', 'transferred', 'missed', 'voicemail'
);

CREATE TYPE call_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TYPE billing_type AS ENUM ('ramq', 'private_insurance', 'self_pay', 'wsbc', 'cvs');

CREATE TYPE payment_status AS ENUM (
  'pending', 'paid', 'partial', 'refused', 'refunded', 'disputed'
);

CREATE TYPE notification_channel AS ENUM ('sms', 'email', 'voice', 'push');

CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

CREATE TYPE provider_specialty AS ENUM (
  'family_medicine', 'pediatrics', 'geriatrics', 'emergency',
  'psychiatry', 'psychology', 'physiotherapy', 'occupational_therapy',
  'kinesiology', 'osteopathy', 'chiropractic', 'massage_therapy',
  'nutrition', 'cardiology', 'neurology', 'dermatology', 'ent',
  'gastroenterology', 'endocrinology', 'rheumatology', 'urology',
  'gynecology', 'obstetrics', 'fertility', 'radiology', 'surgery',
  'orthopedics', 'plastic_surgery', 'nursing', 'other'
);

CREATE TYPE department_category AS ENUM (
  'medicine', 'rehabilitation', 'nutrition', 'womens_health',
  'imaging', 'laboratory', 'specialists', 'surgery', 'mental_health', 'other'
);

CREATE TYPE ai_intent AS ENUM (
  'book_appointment', 'cancel_appointment', 'reschedule_appointment',
  'new_patient', 'exam_results', 'billing', 'general_info',
  'transfer_to_human', 'emergency', 'teleconsult', 'prescription',
  'wait_list', 'unknown'
);

-- ================================================================
-- 1. CLINIQUES
-- ================================================================

CREATE TABLE clinics (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(200) NOT NULL,
  name_en       VARCHAR(200),
  slug          VARCHAR(100) UNIQUE NOT NULL,
  phone         VARCHAR(20),
  fax           VARCHAR(20),
  email         VARCHAR(150),
  website       VARCHAR(200),
  address       JSONB NOT NULL DEFAULT '{}',
  -- { street, city, province, postal_code, country }
  timezone      VARCHAR(50) DEFAULT 'America/Toronto',
  locale        language_code DEFAULT 'fr',
  hours         JSONB DEFAULT '{}',
  -- { mon: {open:"08:00", close:"18:00"}, ... }
  settings      JSONB DEFAULT '{}',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 2. RÔLES & PERMISSIONS
-- ================================================================

CREATE TABLE roles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          user_role UNIQUE NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  description   TEXT,
  permissions   JSONB DEFAULT '[]',
  -- ["patients:read", "appointments:write", "billing:read", ...]
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed des rôles
INSERT INTO roles (name, display_name, permissions) VALUES
  ('admin',        'Administrateur',  '["*"]'),
  ('supervisor',   'Superviseur',     '["patients:*","appointments:*","providers:*","reports:read","calls:*"]'),
  ('receptionist', 'Réceptionniste',  '["patients:read","patients:write","appointments:*","calls:read"]'),
  ('physician',    'Médecin',         '["patients:read","appointments:read","notes:*","prescriptions:*"]'),
  ('therapist',    'Thérapeute',      '["patients:read","appointments:read","notes:write"]'),
  ('nurse',        'Infirmière',      '["patients:read","appointments:read","notes:write","vitals:*"]');

-- ================================================================
-- 3. UTILISATEURS
-- ================================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID REFERENCES clinics(id) ON DELETE SET NULL,
  role_id         UUID REFERENCES roles(id) ON DELETE RESTRICT,
  email           VARCHAR(150) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  phone           VARCHAR(20),
  avatar_url      VARCHAR(500),
  language        language_code DEFAULT 'fr',
  is_active       BOOLEAN DEFAULT TRUE,
  is_verified     BOOLEAN DEFAULT FALSE,
  last_login_at   TIMESTAMPTZ,
  refresh_token   VARCHAR(500),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_clinic ON users(clinic_id);

-- ================================================================
-- 4. DÉPARTEMENTS
-- ================================================================

CREATE TABLE departments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name          VARCHAR(150) NOT NULL,
  name_en       VARCHAR(150),
  name_ar       VARCHAR(150),
  slug          VARCHAR(100) NOT NULL,
  category      department_category NOT NULL DEFAULT 'other',
  icon          VARCHAR(10),
  color         VARCHAR(7) DEFAULT '#00C5D4',
  description   TEXT,
  phone_ext     VARCHAR(10),
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, slug)
);

-- ================================================================
-- 5. PROFESSIONNELS (Médecins, Thérapeutes, etc.)
-- ================================================================

CREATE TABLE providers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  clinic_id       UUID REFERENCES clinics(id) ON DELETE CASCADE,
  department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
  specialty       provider_specialty NOT NULL DEFAULT 'other',
  title           VARCHAR(50),    -- Dr., Dre., M.Pht., etc.
  license_number  VARCHAR(100),
  languages       language_code[] DEFAULT '{fr}',
  bio             TEXT,
  avatar_url      VARCHAR(500),
  phone           VARCHAR(20),
  email           VARCHAR(150),
  consultation_duration INTEGER DEFAULT 30,  -- minutes
  is_active       BOOLEAN DEFAULT TRUE,
  accepts_new_patients BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_providers_clinic ON providers(clinic_id);
CREATE INDEX idx_providers_dept ON providers(department_id);
CREATE INDEX idx_providers_specialty ON providers(specialty);

-- ================================================================
-- 6. DISPONIBILITÉS DES PROFESSIONNELS
-- ================================================================

CREATE TABLE provider_availability (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id   UUID REFERENCES providers(id) ON DELETE CASCADE,
  day_of_week   SMALLINT NOT NULL,  -- 0=dim, 1=lun, ..., 6=sam
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  break_start   TIME,
  break_end     TIME,
  is_active     BOOLEAN DEFAULT TRUE
);

CREATE TABLE provider_exceptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id   UUID REFERENCES providers(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  is_available  BOOLEAN DEFAULT FALSE,
  start_time    TIME,
  end_time      TIME,
  reason        VARCHAR(200),  -- vacances, formation, maladie
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 7. PATIENTS
-- ================================================================

CREATE TABLE patients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID REFERENCES clinics(id) ON DELETE CASCADE,
  -- Identité
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  date_of_birth   DATE NOT NULL,
  gender          patient_gender NOT NULL,
  language        language_code DEFAULT 'fr',
  -- Contact
  phone           VARCHAR(20) NOT NULL,
  phone_alt       VARCHAR(20),
  email           VARCHAR(150),
  address         JSONB DEFAULT '{}',
  -- { street, city, province, postal_code, country }
  -- Assurance
  ramq_number     VARCHAR(20),
  ramq_expiry     DATE,
  insurance_number     VARCHAR(100),
  insurance_provider   VARCHAR(150),
  insurance_group      VARCHAR(100),
  -- Médical
  primary_provider_id  UUID REFERENCES providers(id) ON DELETE SET NULL,
  allergies       TEXT[],
  blood_type      VARCHAR(5),
  height_cm       SMALLINT,
  weight_kg       DECIMAL(5,2),
  medical_notes   TEXT,
  -- Emergency contact
  emergency_contact JSONB DEFAULT '{}',
  -- { name, relation, phone }
  -- Méta
  external_id     VARCHAR(100),  -- ID dans un autre système
  is_active       BOOLEAN DEFAULT TRUE,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_ramq ON patients(ramq_number);
CREATE INDEX idx_patients_name ON patients USING gin(
  (first_name || ' ' || last_name) gin_trgm_ops
);

-- ================================================================
-- 8. DOSSIERS MÉDICAUX / NOTES
-- ================================================================

CREATE TABLE medical_notes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  provider_id     UUID REFERENCES providers(id) ON DELETE SET NULL,
  appointment_id  UUID,  -- FK ajouté après (circular ref)
  type            VARCHAR(50) DEFAULT 'note',
  -- note, prescription, referral, diagnosis, progress
  content         TEXT NOT NULL,
  is_private      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 9. RENDEZ-VOUS
-- ================================================================

CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id      UUID REFERENCES patients(id) ON DELETE RESTRICT,
  provider_id     UUID REFERENCES providers(id) ON DELETE RESTRICT,
  department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
  -- Horaire
  date            DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  duration_min    SMALLINT NOT NULL DEFAULT 30,
  -- Type & Statut
  type            appointment_type NOT NULL DEFAULT 'in_person',
  status          appointment_status NOT NULL DEFAULT 'scheduled',
  -- Contenu
  reason          VARCHAR(500),
  chief_complaint VARCHAR(500),
  notes           TEXT,
  -- Téléconsulte
  video_link      VARCHAR(500),
  -- Référence à l'appel IA qui a créé ce RDV
  call_id         UUID,
  -- Confirmations
  confirmed_at    TIMESTAMPTZ,
  reminder_sent   BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMPTZ,
  -- Annulation
  cancelled_at    TIMESTAMPTZ,
  cancelled_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  cancel_reason   VARCHAR(300),
  -- Méta
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_provider ON appointments(provider_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- FK circulaire sur medical_notes
ALTER TABLE medical_notes
  ADD CONSTRAINT fk_note_appointment
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL;

-- ================================================================
-- 10. LISTE D'ATTENTE
-- ================================================================

CREATE TABLE waitlist (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  provider_id     UUID REFERENCES providers(id) ON DELETE CASCADE,
  department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
  preferred_dates JSONB DEFAULT '[]',
  preferred_times JSONB DEFAULT '[]',
  priority        call_priority DEFAULT 'normal',
  notes           TEXT,
  fulfilled_at    TIMESTAMPTZ,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 11. APPELS TÉLÉPHONIQUES
-- ================================================================

CREATE TABLE phone_calls (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id      UUID REFERENCES patients(id) ON DELETE SET NULL,
  -- Info appel
  caller_phone    VARCHAR(20) NOT NULL,
  direction       VARCHAR(10) DEFAULT 'inbound',  -- inbound / outbound
  status          call_status NOT NULL DEFAULT 'queued',
  priority        call_priority DEFAULT 'normal',
  language        language_code DEFAULT 'fr',
  -- Timestamps
  queued_at       TIMESTAMPTZ DEFAULT NOW(),
  answered_at     TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  duration_sec    INTEGER,
  wait_sec        INTEGER,
  -- IA
  handled_by_ai   BOOLEAN DEFAULT TRUE,
  transferred_to  UUID REFERENCES users(id) ON DELETE SET NULL,
  transfer_reason VARCHAR(300),
  -- Contenu
  ai_intent       ai_intent,
  scenario        VARCHAR(200),
  transcript      TEXT,
  ai_summary      TEXT,
  -- Enregistrement
  recording_url   VARCHAR(500),
  recording_duration_sec INTEGER,
  -- Twilio / SIP
  external_call_id VARCHAR(200),
  -- RDV créé pendant l'appel
  appointment_created_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  -- Méta
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calls_clinic ON phone_calls(clinic_id);
CREATE INDEX idx_calls_patient ON phone_calls(patient_id);
CREATE INDEX idx_calls_status ON phone_calls(status);
CREATE INDEX idx_calls_phone ON phone_calls(caller_phone);
CREATE INDEX idx_calls_date ON phone_calls(queued_at);

-- ================================================================
-- 12. CONVERSATIONS IA
-- ================================================================

CREATE TABLE ai_conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id         UUID REFERENCES phone_calls(id) ON DELETE CASCADE,
  -- Messages alternés patient/IA
  messages        JSONB DEFAULT '[]',
  -- [{ role: "user"|"assistant", content: "...", timestamp: "..." }]
  intent          ai_intent,
  intent_confidence DECIMAL(4,3),
  context         JSONB DEFAULT '{}',
  -- { patient_id, appointment_id, ... }
  model_used      VARCHAR(100),
  tokens_input    INTEGER,
  tokens_output   INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 13. FACTURATION
-- ================================================================

CREATE TABLE invoices (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id           UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id          UUID REFERENCES patients(id) ON DELETE RESTRICT,
  appointment_id      UUID REFERENCES appointments(id) ON DELETE SET NULL,
  provider_id         UUID REFERENCES providers(id) ON DELETE SET NULL,
  -- Facturation
  invoice_number      VARCHAR(50) UNIQUE NOT NULL,
  billing_type        billing_type NOT NULL DEFAULT 'self_pay',
  amount              DECIMAL(10,2) NOT NULL,
  tax_amount          DECIMAL(10,2) DEFAULT 0,
  total_amount        DECIMAL(10,2) NOT NULL,
  -- Assurance
  insurance_claim_number VARCHAR(100),
  insurance_submitted_at TIMESTAMPTZ,
  insurance_response  JSONB,
  -- Statut
  status              payment_status NOT NULL DEFAULT 'pending',
  paid_at             TIMESTAMPTZ,
  payment_method      VARCHAR(50),
  -- transaction, chèque, carte, virement
  transaction_id      VARCHAR(200),
  -- Notes
  notes               TEXT,
  issued_at           TIMESTAMPTZ DEFAULT NOW(),
  due_at              TIMESTAMPTZ,
  created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_clinic ON invoices(clinic_id);
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- ================================================================
-- 14. ASSURANCES
-- ================================================================

CREATE TABLE insurance_providers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(200) NOT NULL,
  code            VARCHAR(50) UNIQUE,
  phone           VARCHAR(20),
  email           VARCHAR(150),
  website         VARCHAR(300),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 15. DOCUMENTS
-- ================================================================

CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  uploaded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  type            VARCHAR(50) NOT NULL,
  -- lab_result, prescription, referral, imaging, consent, other
  name            VARCHAR(300) NOT NULL,
  file_url        VARCHAR(1000) NOT NULL,
  file_size       INTEGER,
  mime_type       VARCHAR(100),
  is_private      BOOLEAN DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 16. NOTIFICATIONS
-- ================================================================

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  channel         notification_channel NOT NULL,
  status          notification_status DEFAULT 'pending',
  -- Contenu
  template        VARCHAR(100),
  recipient       VARCHAR(200) NOT NULL,
  subject         VARCHAR(300),
  body            TEXT NOT NULL,
  -- Envoi
  scheduled_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  -- Réponse du fournisseur
  external_id     VARCHAR(200),  -- Twilio SID, SendGrid ID, etc.
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_patient ON notifications(patient_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- ================================================================
-- 17. JOURNAL D'AUDIT
-- ================================================================

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID REFERENCES clinics(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  action          VARCHAR(100) NOT NULL,
  -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW, EXPORT
  resource        VARCHAR(100) NOT NULL,
  -- patients, appointments, invoices, ...
  resource_id     UUID,
  old_data        JSONB,
  new_data        JSONB,
  ip_address      VARCHAR(45),
  user_agent      VARCHAR(500),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_clinic ON audit_logs(clinic_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource, resource_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);

-- ================================================================
-- 18. SESSIONS / REFRESH TOKENS
-- ================================================================

CREATE TABLE refresh_tokens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash      VARCHAR(255) UNIQUE NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked         BOOLEAN DEFAULT FALSE,
  ip_address      VARCHAR(45),
  user_agent      VARCHAR(500),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_tokens_hash ON refresh_tokens(token_hash);

-- ================================================================
-- 19. PARAMÈTRES CLINIQUE
-- ================================================================

CREATE TABLE clinic_settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID REFERENCES clinics(id) ON DELETE CASCADE UNIQUE,
  -- IA
  ai_model        VARCHAR(100) DEFAULT 'gpt-4o',
  ai_stt_provider VARCHAR(100) DEFAULT 'openai',
  ai_tts_provider VARCHAR(100) DEFAULT 'elevenlabs',
  ai_voice_id     VARCHAR(200),
  -- Téléphonie
  telephony_provider VARCHAR(50) DEFAULT 'twilio',
  main_phone_number  VARCHAR(20),
  twilio_account_sid VARCHAR(200),
  twilio_auth_token  VARCHAR(200),
  -- SMS / Email
  sms_from_number VARCHAR(20),
  email_from      VARCHAR(150),
  email_provider  VARCHAR(50) DEFAULT 'sendgrid',
  -- Rendez-vous
  default_appt_duration INTEGER DEFAULT 30,
  advance_booking_days  INTEGER DEFAULT 60,
  cancellation_hours    INTEGER DEFAULT 24,
  -- Rappels
  reminder_24h    BOOLEAN DEFAULT TRUE,
  reminder_2h     BOOLEAN DEFAULT TRUE,
  -- Données
  settings        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- FONCTIONS & TRIGGERS
-- ================================================================

-- updated_at auto
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger à toutes les tables avec updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'clinics','users','departments','providers','patients',
      'appointments','invoices','ai_conversations','clinic_settings',
      'medical_notes'
    )
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ================================================================
-- VUES UTILES
-- ================================================================

-- Vue patients avec infos complètes
CREATE VIEW v_patients_full AS
SELECT
  p.*,
  pr.title || ' ' || pr_u.first_name || ' ' || pr_u.last_name AS primary_provider_name,
  c.name AS clinic_name,
  COUNT(a.id) AS total_appointments,
  MAX(a.date) AS last_appointment_date
FROM patients p
LEFT JOIN providers pr ON p.primary_provider_id = pr.id
LEFT JOIN users pr_u ON pr.user_id = pr_u.id
LEFT JOIN clinics c ON p.clinic_id = c.id
LEFT JOIN appointments a ON p.id = a.patient_id AND a.status != 'cancelled'
GROUP BY p.id, pr.title, pr_u.first_name, pr_u.last_name, c.name;

-- Vue rendez-vous du jour
CREATE VIEW v_appointments_today AS
SELECT
  a.*,
  p.first_name || ' ' || p.last_name AS patient_name,
  p.phone AS patient_phone,
  pr.title || ' ' || u.first_name || ' ' || u.last_name AS provider_name,
  d.name AS department_name
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN providers pr ON a.provider_id = pr.id
JOIN users u ON pr.user_id = u.id
LEFT JOIN departments d ON a.department_id = d.id
WHERE a.date = CURRENT_DATE
  AND a.status NOT IN ('cancelled');

-- Vue statistiques appels
CREATE VIEW v_call_stats_today AS
SELECT
  clinic_id,
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE handled_by_ai = TRUE) AS ai_handled,
  COUNT(*) FILTER (WHERE status = 'missed') AS missed,
  COUNT(*) FILTER (WHERE status = 'active') AS active_now,
  AVG(duration_sec) FILTER (WHERE duration_sec IS NOT NULL) AS avg_duration_sec,
  AVG(wait_sec) FILTER (WHERE wait_sec IS NOT NULL) AS avg_wait_sec
FROM phone_calls
WHERE queued_at::date = CURRENT_DATE
GROUP BY clinic_id;

-- ================================================================
-- DONNÉES DE DÉMARRAGE (SEED)
-- ================================================================

-- Clinique exemple
INSERT INTO clinics (name, slug, phone, email, timezone, address) VALUES
  ('Clinique Santé Montréal', 'clinique-sante-montreal',
   '+15145550100', 'info@cliniquesante.ca',
   'America/Toronto',
   '{"street":"123 rue Peel","city":"Montréal","province":"QC","postal_code":"H3C 1A1","country":"CA"}');
