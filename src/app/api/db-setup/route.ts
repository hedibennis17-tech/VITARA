import { NextResponse } from 'next/server';
export async function GET() {
  const DB = process.env.DATABASE_URL;
  if (!DB) return NextResponse.json({ error:'DATABASE_URL manquante' },{ status:500 });
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString:DB, ssl:{rejectUnauthorized:false} });
  try {
    await pool.query(`
      -- Patients
      CREATE TABLE IF NOT EXISTS patients (
        id            SERIAL PRIMARY KEY,
        full_name     TEXT,
        phone         VARCHAR(10) UNIQUE NOT NULL,
        email         TEXT,
        ramq          VARCHAR(12),
        address       TEXT,
        family_doctor TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );

      -- Conversations / Appels
      CREATE TABLE IF NOT EXISTS conversations (
        id              SERIAL PRIMARY KEY,
        session_id      VARCHAR(40) UNIQUE NOT NULL,
        agent_id        VARCHAR(20),
        agent_name      VARCHAR(50),
        patient_phone   VARCHAR(10),
        patient_name    TEXT,
        service         TEXT,
        practitioner    TEXT,
        reason          TEXT,
        body_part       TEXT,
        accident_type   TEXT,
        claim_number    TEXT,
        pain_scale      VARCHAR(3),
        language        VARCHAR(5) DEFAULT 'fr',
        status          VARCHAR(20) DEFAULT 'in_progress',
        started_at      TIMESTAMPTZ DEFAULT NOW(),
        ended_at        TIMESTAMPTZ,
        duration_sec    INTEGER,
        transcript      JSONB DEFAULT '[]',
        booking_code    VARCHAR(30),
        booking_date    TEXT,
        booking_time    VARCHAR(10),
        notes           TEXT
      );

      -- Rendez-vous
      CREATE TABLE IF NOT EXISTS appointments (
        id              SERIAL PRIMARY KEY,
        patient_phone   VARCHAR(10),
        patient_name    TEXT,
        code            VARCHAR(30) UNIQUE,
        date_label      TEXT,
        time_val        VARCHAR(5),
        provider        TEXT,
        dept            TEXT,
        service         TEXT,
        payer           TEXT,
        reason          TEXT,
        body_part       TEXT,
        accident_type   TEXT,
        claim_number    TEXT,
        status          VARCHAR(20) DEFAULT 'confirmed',
        session_id      VARCHAR(40),
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );

      -- Index
      CREATE INDEX IF NOT EXISTS idx_conv_phone   ON conversations(patient_phone);
      CREATE INDEX IF NOT EXISTS idx_conv_started ON conversations(started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_appt_phone   ON appointments(patient_phone);
      CREATE INDEX IF NOT EXISTS idx_pat_phone    ON patients(phone);
    `);
    return NextResponse.json({ success:true, message:'✅ Tables créées: patients, conversations, appointments' });
  } catch(e:any) {
    return NextResponse.json({ error:e.message },{ status:500 });
  } finally { await pool.end(); }
}
