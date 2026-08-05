-- ================================================================
-- VITARA — Données de test (seed)
-- ================================================================

-- Récupérer l'ID de la clinique
DO $$
DECLARE
  clinic_id UUID;
  admin_role_id UUID;
  supervisor_role_id UUID;
  receptionist_role_id UUID;
  physician_role_id UUID;
  therapist_role_id UUID;
  admin_user_id UUID;
  sup_user_id UUID;
  recep_user_id UUID;
  doc1_user_id UUID;
  doc2_user_id UUID;
  physio_user_id UUID;
  dept_med_id UUID;
  dept_physio_id UUID;
  dept_psycho_id UUID;
  dept_cardio_id UUID;
  dept_pedia_id UUID;
  dept_nutri_id UUID;
  provider1_id UUID;
  provider2_id UUID;
  provider3_id UUID;
  provider4_id UUID;
  patient1_id UUID;
  patient2_id UUID;
  patient3_id UUID;
  patient4_id UUID;
  patient5_id UUID;
BEGIN

  SELECT id INTO clinic_id FROM clinics WHERE slug = 'clinique-sante-montreal' LIMIT 1;
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  SELECT id INTO supervisor_role_id FROM roles WHERE name = 'supervisor';
  SELECT id INTO receptionist_role_id FROM roles WHERE name = 'receptionist';
  SELECT id INTO physician_role_id FROM roles WHERE name = 'physician';
  SELECT id INTO therapist_role_id FROM roles WHERE name = 'therapist';

  -- ── Utilisateurs ─────────────────────────────────────────────

  -- Admin
  admin_user_id := gen_random_uuid();
  INSERT INTO users (id, clinic_id, role_id, email, password_hash, first_name, last_name, is_active, is_verified)
  VALUES (admin_user_id, clinic_id, admin_role_id,
    'admin@vitara.ca',
    -- password: Admin1234!
    '$2b$12$CkPUTXCGWkilGMk4HKLCmOlqA/raouDHvRuM.OJs4LaWCMBc0GPvS',
    'Admin', 'VITARA', TRUE, TRUE);

  -- Superviseur
  sup_user_id := gen_random_uuid();
  INSERT INTO users (id, clinic_id, role_id, email, password_hash, first_name, last_name, is_active, is_verified)
  VALUES (sup_user_id, clinic_id, supervisor_role_id,
    'superviseur@vitara.ca',
    '$2b$12$CkPUTXCGWkilGMk4HKLCmOlqA/raouDHvRuM.OJs4LaWCMBc0GPvS',
    'Marie', 'Supervisor', TRUE, TRUE);

  -- Réceptionniste
  recep_user_id := gen_random_uuid();
  INSERT INTO users (id, clinic_id, role_id, email, password_hash, first_name, last_name, is_active, is_verified)
  VALUES (recep_user_id, clinic_id, receptionist_role_id,
    'reception@vitara.ca',
    '$2b$12$CkPUTXCGWkilGMk4HKLCmOlqA/raouDHvRuM.OJs4LaWCMBc0GPvS',
    'Sophie', 'Réception', TRUE, TRUE);

  -- Dr. Martin (médecin)
  doc1_user_id := gen_random_uuid();
  INSERT INTO users (id, clinic_id, role_id, email, password_hash, first_name, last_name, phone, is_active, is_verified)
  VALUES (doc1_user_id, clinic_id, physician_role_id,
    'dr.martin@vitara.ca',
    '$2b$12$CkPUTXCGWkilGMk4HKLCmOlqA/raouDHvRuM.OJs4LaWCMBc0GPvS',
    'Jean-François', 'Martin', '5145550201', TRUE, TRUE);

  -- Dr. Tremblay (médecin)
  doc2_user_id := gen_random_uuid();
  INSERT INTO users (id, clinic_id, role_id, email, password_hash, first_name, last_name, phone, is_active, is_verified)
  VALUES (doc2_user_id, clinic_id, physician_role_id,
    'dr.tremblay@vitara.ca',
    '$2b$12$CkPUTXCGWkilGMk4HKLCmOlqA/raouDHvRuM.OJs4LaWCMBc0GPvS',
    'Marc', 'Tremblay', '5145550202', TRUE, TRUE);

  -- Omar Khalil (physiothérapeute)
  physio_user_id := gen_random_uuid();
  INSERT INTO users (id, clinic_id, role_id, email, password_hash, first_name, last_name, phone, is_active, is_verified)
  VALUES (physio_user_id, clinic_id, therapist_role_id,
    'o.khalil@vitara.ca',
    '$2b$12$CkPUTXCGWkilGMk4HKLCmOlqA/raouDHvRuM.OJs4LaWCMBc0GPvS',
    'Omar', 'Khalil', '5145550205', TRUE, TRUE);

  -- ── Paramètres clinique ───────────────────────────────────────
  INSERT INTO clinic_settings (clinic_id, ai_model, telephony_provider, main_phone_number, reminder_24h, reminder_2h)
  VALUES (clinic_id, 'gpt-4o', 'twilio', '+15145550100', TRUE, TRUE)
  ON CONFLICT DO NOTHING;

  -- ── Départements ──────────────────────────────────────────────

  dept_med_id := gen_random_uuid();
  INSERT INTO departments (id, clinic_id, name, name_en, slug, category, icon, color, sort_order)
  VALUES (dept_med_id, clinic_id, 'Médecine familiale', 'Family Medicine', 'med-familiale', 'medicine', '🩺', '#00C5D4', 1);

  dept_physio_id := gen_random_uuid();
  INSERT INTO departments (id, clinic_id, name, name_en, slug, category, icon, color, sort_order)
  VALUES (dept_physio_id, clinic_id, 'Physiothérapie', 'Physiotherapy', 'physiotherapie', 'rehabilitation', '🦾', '#00E5A0', 2);

  dept_psycho_id := gen_random_uuid();
  INSERT INTO departments (id, clinic_id, name, name_en, slug, category, icon, color, sort_order)
  VALUES (dept_psycho_id, clinic_id, 'Psychologie', 'Psychology', 'psychologie', 'mental_health', '💭', '#A78BFA', 3);

  dept_cardio_id := gen_random_uuid();
  INSERT INTO departments (id, clinic_id, name, name_en, slug, category, icon, color, sort_order)
  VALUES (dept_cardio_id, clinic_id, 'Cardiologie', 'Cardiology', 'cardiologie', 'specialists', '❤️', '#EF4444', 4);

  dept_pedia_id := gen_random_uuid();
  INSERT INTO departments (id, clinic_id, name, name_en, slug, category, icon, color, sort_order)
  VALUES (dept_pedia_id, clinic_id, 'Pédiatrie', 'Pediatrics', 'pediatrie', 'medicine', '👶', '#F9A826', 5);

  dept_nutri_id := gen_random_uuid();
  INSERT INTO departments (id, clinic_id, name, name_en, slug, category, icon, color, sort_order)
  VALUES (dept_nutri_id, clinic_id, 'Nutrition clinique', 'Clinical Nutrition', 'nutrition', 'nutrition', '🥗', '#86EFAC', 6);

  -- ── Professionnels ────────────────────────────────────────────

  provider1_id := gen_random_uuid();
  INSERT INTO providers (id, user_id, clinic_id, department_id, specialty, title, license_number, languages, consultation_duration, accepts_new_patients)
  VALUES (provider1_id, doc1_user_id, clinic_id, dept_med_id, 'family_medicine', 'Dr.', 'QC-MED-001234', '{fr,en}', 30, TRUE);

  provider2_id := gen_random_uuid();
  INSERT INTO providers (id, user_id, clinic_id, department_id, specialty, title, license_number, languages, consultation_duration, accepts_new_patients)
  VALUES (provider2_id, doc2_user_id, clinic_id, dept_med_id, 'family_medicine', 'Dr.', 'QC-MED-005678', '{fr}', 30, TRUE);

  provider3_id := gen_random_uuid();
  INSERT INTO providers (id, user_id, clinic_id, department_id, specialty, title, license_number, languages, consultation_duration, accepts_new_patients)
  VALUES (provider3_id, physio_user_id, clinic_id, dept_physio_id, 'physiotherapy', 'M.Pht.', 'QC-PHY-003456', '{fr,ar,en}', 45, TRUE);

  provider4_id := gen_random_uuid();
  INSERT INTO providers (id, clinic_id, department_id, specialty, title, license_number, languages, consultation_duration, accepts_new_patients, email, phone)
  VALUES (provider4_id, clinic_id, dept_psycho_id, 'psychology', 'Dr.', 'QC-PSY-007890', '{fr,en}', 60, TRUE, 'l.nguyen@vitara.ca', '5145550203');

  -- Disponibilités (lun-ven, 8h-17h)
  INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time, break_start, break_end)
  SELECT provider1_id, d, '08:00', '17:00', '12:00', '13:00' FROM generate_series(1,5) d;

  INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time, break_start, break_end)
  SELECT provider2_id, d, '09:00', '17:30', '12:30', '13:30' FROM generate_series(1,5) d;

  INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time, break_start, break_end)
  SELECT provider3_id, d, '08:00', '18:00', '12:00', '13:00' FROM generate_series(1,5) d;

  -- Aussi le samedi pour le physio
  INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time)
  VALUES (provider3_id, 6, '09:00', '13:00');

  -- ── Patients ──────────────────────────────────────────────────

  patient1_id := gen_random_uuid();
  INSERT INTO patients (id, clinic_id, first_name, last_name, date_of_birth, gender, language,
    phone, email, ramq_number, allergies, primary_provider_id, address, created_by)
  VALUES (patient1_id, clinic_id, 'Marie', 'Leclerc', '1985-03-12', 'F', 'fr',
    '5145550142', 'marie.leclerc@email.com', 'LECM85031298', ARRAY['Pénicilline'],
    provider1_id,
    '{"street":"456 rue Sainte-Catherine","city":"Montréal","province":"QC","postal_code":"H3B 1A1","country":"CA"}',
    admin_user_id);

  patient2_id := gen_random_uuid();
  INSERT INTO patients (id, clinic_id, first_name, last_name, date_of_birth, gender, language,
    phone, email, ramq_number, allergies, primary_provider_id, address, created_by)
  VALUES (patient2_id, clinic_id, 'Ahmed', 'Benali', '1978-11-04', 'M', 'ar',
    '4385550287', 'a.benali@email.com', 'BENA78110498', ARRAY[]::text[],
    provider1_id,
    '{"street":"789 boul. Saint-Laurent","city":"Laval","province":"QC","postal_code":"H7P 2X3","country":"CA"}',
    admin_user_id);

  patient3_id := gen_random_uuid();
  INSERT INTO patients (id, clinic_id, first_name, last_name, date_of_birth, gender, language,
    phone, email, ramq_number, allergies, primary_provider_id, address, created_by)
  VALUES (patient3_id, clinic_id, 'Sarah', 'Johnson', '1992-06-29', 'F', 'en',
    '5145550391', 'sjohnson@email.com', 'JOHS92062994', ARRAY['Aspirine','Codéine'],
    provider2_id,
    '{"street":"123 rue McGill","city":"Montréal","province":"QC","postal_code":"H2Y 1C6","country":"CA"}',
    admin_user_id);

  patient4_id := gen_random_uuid();
  INSERT INTO patients (id, clinic_id, first_name, last_name, date_of_birth, gender, language,
    phone, ramq_number, allergies, primary_provider_id, medical_notes, created_by)
  VALUES (patient4_id, clinic_id, 'Jean', 'Tremblay', '1960-01-17', 'M', 'fr',
    '4505550054', 'TREJ60011798', ARRAY[]::text[],
    provider2_id,
    'Patient gériatrique. Suivi régulier tension artérielle. HTA contrôlée.',
    admin_user_id);

  patient5_id := gen_random_uuid();
  INSERT INTO patients (id, clinic_id, first_name, last_name, date_of_birth, gender, language,
    phone, email, ramq_number, allergies, primary_provider_id, created_by)
  VALUES (patient5_id, clinic_id, 'Fatima', 'Zahra', '2001-08-22', 'F', 'ar',
    '5145550918', 'f.zahra@email.com', 'ZAHF01082207', ARRAY['Latex'],
    provider4_id, admin_user_id);

  -- ── Rendez-vous (passés + futurs) ────────────────────────────

  -- RDV d'aujourd'hui
  INSERT INTO appointments (id, clinic_id, patient_id, provider_id, department_id, date, start_time, end_time, duration_min, type, status, reason, created_by)
  VALUES
  (gen_random_uuid(), clinic_id, patient1_id, provider3_id, dept_physio_id,
    CURRENT_DATE, '09:00', '09:45', 45, 'in_person', 'confirmed', 'Douleur au dos — suivi séance 3', admin_user_id),
  (gen_random_uuid(), clinic_id, patient2_id, provider1_id, dept_med_id,
    CURRENT_DATE, '10:00', '10:30', 30, 'in_person', 'confirmed', 'Bilan annuel', admin_user_id),
  (gen_random_uuid(), clinic_id, patient3_id, provider2_id, dept_med_id,
    CURRENT_DATE, '11:00', '11:30', 30, 'teleconsult', 'scheduled', 'Résultats analyses sang', admin_user_id),
  (gen_random_uuid(), clinic_id, patient4_id, provider2_id, dept_med_id,
    CURRENT_DATE, '14:00', '14:30', 30, 'in_person', 'scheduled', 'Contrôle tension artérielle', admin_user_id),
  (gen_random_uuid(), clinic_id, patient5_id, provider4_id, dept_psycho_id,
    CURRENT_DATE, '15:00', '16:00', 60, 'in_person', 'confirmed', 'Séance régulière', admin_user_id);

  -- RDV futurs (cette semaine)
  INSERT INTO appointments (id, clinic_id, patient_id, provider_id, department_id, date, start_time, end_time, duration_min, type, status, reason, created_by)
  VALUES
  (gen_random_uuid(), clinic_id, patient1_id, provider3_id, dept_physio_id,
    CURRENT_DATE + 2, '10:00', '10:45', 45, 'in_person', 'scheduled', 'Physiothérapie — séance 4', admin_user_id),
  (gen_random_uuid(), clinic_id, patient3_id, provider1_id, dept_med_id,
    CURRENT_DATE + 3, '09:30', '10:00', 30, 'in_person', 'scheduled', 'Consultation générale', admin_user_id),
  (gen_random_uuid(), clinic_id, patient2_id, provider3_id, dept_physio_id,
    CURRENT_DATE + 4, '14:30', '15:15', 45, 'in_person', 'scheduled', 'Rééducation genou', admin_user_id);

  -- RDV passés (complétés)
  INSERT INTO appointments (id, clinic_id, patient_id, provider_id, department_id, date, start_time, end_time, duration_min, type, status, reason, created_by)
  VALUES
  (gen_random_uuid(), clinic_id, patient1_id, provider1_id, dept_med_id,
    CURRENT_DATE - 7, '10:00', '10:30', 30, 'in_person', 'completed', 'Référence physiothérapie', admin_user_id),
  (gen_random_uuid(), clinic_id, patient4_id, provider2_id, dept_med_id,
    CURRENT_DATE - 14, '14:00', '14:30', 30, 'in_person', 'completed', 'Renouvellement ordonnance', admin_user_id),
  (gen_random_uuid(), clinic_id, patient5_id, provider4_id, dept_psycho_id,
    CURRENT_DATE - 7, '15:00', '16:00', 60, 'in_person', 'completed', 'Séance psychologie', admin_user_id);

  -- ── Appels téléphoniques simulés ──────────────────────────────
  INSERT INTO phone_calls (id, clinic_id, patient_id, caller_phone, direction, status, language, priority, handled_by_ai, ai_intent, scenario, duration_sec, wait_sec, queued_at, answered_at, ended_at)
  VALUES
  (gen_random_uuid(), clinic_id, patient1_id, '5145550142', 'inbound', 'completed', 'fr', 'normal', TRUE, 'book_appointment', 'Prise de rendez-vous — Physiothérapie', 167, 12, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours' + INTERVAL '12 seconds', NOW() - INTERVAL '2 hours' + INTERVAL '179 seconds'),
  (gen_random_uuid(), clinic_id, patient2_id, '4385550287', 'inbound', 'completed', 'fr', 'normal', TRUE, 'cancel_appointment', 'Annulation rendez-vous', 78, 8, NOW() - INTERVAL '90 minutes', NOW() - INTERVAL '90 minutes' + INTERVAL '8 seconds', NOW() - INTERVAL '90 minutes' + INTERVAL '86 seconds'),
  (gen_random_uuid(), clinic_id, patient3_id, '5145550391', 'inbound', 'completed', 'en', 'normal', TRUE, 'exam_results', 'Résultats examens', 134, 15, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour' + INTERVAL '15 seconds', NOW() - INTERVAL '1 hour' + INTERVAL '149 seconds'),
  (gen_random_uuid(), clinic_id, NULL, '5145550765', 'inbound', 'completed', 'fr', 'normal', TRUE, 'new_patient', 'Nouveau patient', 245, 20, NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes' + INTERVAL '20 seconds', NOW() - INTERVAL '45 minutes' + INTERVAL '265 seconds'),
  (gen_random_uuid(), clinic_id, patient4_id, '4505550054', 'inbound', 'missed', 'fr', 'high', FALSE, NULL, NULL, NULL, 45, NOW() - INTERVAL '30 minutes', NULL, NULL),
  -- Appels actifs simulés
  (gen_random_uuid(), clinic_id, patient5_id, '5145550918', 'inbound', 'active', 'ar', 'normal', TRUE, 'book_appointment', 'Prise de rendez-vous — Psychologie', NULL, 8, NOW() - INTERVAL '3 minutes', NOW() - INTERVAL '3 minutes' + INTERVAL '8 seconds', NULL);

  -- ── Factures ──────────────────────────────────────────────────
  INSERT INTO invoices (id, clinic_id, patient_id, invoice_number, billing_type, amount, tax_amount, total_amount, status, created_by)
  VALUES
  (gen_random_uuid(), clinic_id, patient1_id, 'INV-2026-1042', 'ramq', 85.00, 0, 85.00, 'paid', admin_user_id),
  (gen_random_uuid(), clinic_id, patient2_id, 'INV-2026-1043', 'ramq', 70.00, 0, 70.00, 'pending', admin_user_id),
  (gen_random_uuid(), clinic_id, patient3_id, 'INV-2026-1044', 'private_insurance', 250.00, 0, 250.00, 'paid', admin_user_id),
  (gen_random_uuid(), clinic_id, patient4_id, 'INV-2026-1045', 'ramq', 95.00, 0, 95.00, 'refused', admin_user_id),
  (gen_random_uuid(), clinic_id, patient5_id, 'INV-2026-1046', 'private_insurance', 180.00, 0, 180.00, 'pending', admin_user_id);

  RAISE NOTICE 'Seed complété avec succès!';
  RAISE NOTICE 'Clinique ID: %', clinic_id;
  RAISE NOTICE '';
  RAISE NOTICE '=== COMPTES DE TEST ===';
  RAISE NOTICE 'admin@vitara.ca       / Admin1234!  (Administrateur)';
  RAISE NOTICE 'superviseur@vitara.ca / Admin1234!  (Superviseur)';
  RAISE NOTICE 'reception@vitara.ca   / Admin1234!  (Réceptionniste)';
  RAISE NOTICE 'dr.martin@vitara.ca   / Admin1234!  (Médecin)';
  RAISE NOTICE 'o.khalil@vitara.ca    / Admin1234!  (Physiothérapeute)';

END $$;
