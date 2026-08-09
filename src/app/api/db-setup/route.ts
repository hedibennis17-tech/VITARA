import { NextResponse } from 'next/server';
export async function GET() {
  const DB = process.env.DATABASE_URL;
  if (!DB) return NextResponse.json({ error:'DATABASE_URL manquante' },{ status:500 });
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString:DB, ssl:{rejectUnauthorized:false} });
  try {
    // Tables dans le bon ordre
    await pool.query(`
      DROP TABLE IF EXISTS conversations;

      CREATE TABLE IF NOT EXISTS patients (
        id            SERIAL PRIMARY KEY,
        full_name     TEXT,
        phone         VARCHAR(15) UNIQUE NOT NULL,
        email         TEXT,
        ramq          VARCHAR(12),
        address       TEXT,
        family_doctor TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE conversations (
        id              SERIAL PRIMARY KEY,
        session_id      VARCHAR(80) UNIQUE NOT NULL,
        agent_id        VARCHAR(20),
        agent_name      VARCHAR(50),
        patient_phone   VARCHAR(15),
        patient_name    TEXT,
        service         TEXT,
        practitioner    TEXT,
        reason          TEXT,
        body_part       TEXT,
        accident_type   TEXT,
        claim_number    TEXT,
        pain_scale      VARCHAR(5),
        language        VARCHAR(5) DEFAULT 'fr',
        status          VARCHAR(20) DEFAULT 'in_progress',
        started_at      TIMESTAMPTZ DEFAULT NOW(),
        ended_at        TIMESTAMPTZ,
        duration_sec    INTEGER,
        transcript      JSONB DEFAULT '[]'::jsonb,
        booking_code    VARCHAR(30),
        booking_date    TEXT,
        booking_time    VARCHAR(10)
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id            SERIAL PRIMARY KEY,
        patient_phone VARCHAR(15),
        patient_name  TEXT,
        code          VARCHAR(30) UNIQUE,
        date_label    TEXT,
        time_val      VARCHAR(5),
        provider      TEXT,
        dept          TEXT,
        service       TEXT,
        payer         TEXT,
        reason        TEXT,
        body_part     TEXT,
        accident_type TEXT,
        claim_number  TEXT,
        status        VARCHAR(20) DEFAULT 'confirmed',
        session_id    VARCHAR(80),
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS roles (
        id   SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
      );
      INSERT INTO roles (name) VALUES ('admin'),('supervisor'),('receptionist'),('physician'),('therapist')
      ON CONFLICT (name) DO NOTHING;

      CREATE TABLE IF NOT EXISTS users (
        id            VARCHAR(50) PRIMARY KEY,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name    TEXT,
        last_name     TEXT,
        clinic_id     VARCHAR(50) DEFAULT 'c-001',
        is_active     BOOLEAN DEFAULT true,
        role_id       INTEGER DEFAULT 1,
        last_login_at TIMESTAMPTZ,
        refresh_token TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );
      INSERT INTO users (id,email,password_hash,first_name,last_name,role_id,is_active) VALUES
        ('u-admin-001','admin@vitara.ca',       '$2b$12$CkPUTXCGWkilGMk4HKLCmOlqA/raouDHvRuM.OJs4LaWCMBc0GPvS','Admin','VITARA',1,true),
        ('u-sup-001',  'superviseur@vitara.ca', '$2b$12$CkPUTXCGWkilGMk4HKLCmOlqA/raouDHvRuM.OJs4LaWCMBc0GPvS','Marie','Super',2,true),
        ('u-rec-001',  'reception@vitara.ca',   '$2b$12$CkPUTXCGWkilGMk4HKLCmOlqA/raouDHvRuM.OJs4LaWCMBc0GPvS','Sophie','Réception',3,true),
        ('u-doc-001',  'dr.martin@vitara.ca',   '$2b$12$CkPUTXCGWkilGMk4HKLCmOlqA/raouDHvRuM.OJs4LaWCMBc0GPvS','Jean','Martin',4,true),
        ('u-phy-001',  'o.khalil@vitara.ca',    '$2b$12$CkPUTXCGWkilGMk4HKLCmOlqA/raouDHvRuM.OJs4LaWCMBc0GPvS','Omar','Khalil',5,true)
      ON CONFLICT (id) DO NOTHING;

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_conv_phone   ON conversations(patient_phone);
      CREATE INDEX IF NOT EXISTS idx_conv_started ON conversations(started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_appt_phone   ON appointments(patient_phone);
      CREATE INDEX IF NOT EXISTS idx_pat_phone    ON patients(phone);

      -- Conversation test pour valider le Centre d'appel
      INSERT INTO conversations (session_id, agent_name, patient_name, patient_phone, service, practitioner, reason, status, language)
      VALUES ('test-setup-001', 'Houda', 'Patient Test', '5140000000', 'medecin_famille', 'Dr. Fahd Awada', 'Bilan annuel', 'completed', 'fr')
      ON CONFLICT (session_id) DO NOTHING;
    `);

    return NextResponse.json({ success:true, message:'✅ Tables créées + conversation test insérée' });
  } catch(e:any) {
    return NextResponse.json({ error:e.message },{ status:500 });
  } finally { await pool.end(); }
}
