import { NextResponse } from 'next/server';
export async function GET() {
  const DB = process.env.DATABASE_URL;
  if (!DB) return NextResponse.json({ error:'DATABASE_URL manquante. Ajouter sur Vercel.' },{ status:500 });
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString:DB, ssl:{rejectUnauthorized:false} });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id           SERIAL PRIMARY KEY,
        full_name    TEXT,
        phone        VARCHAR(10) UNIQUE NOT NULL,
        email        TEXT,
        ramq         VARCHAR(12),
        address      TEXT,
        family_doctor TEXT,
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        updated_at   TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS appointments (
        id            SERIAL PRIMARY KEY,
        patient_phone VARCHAR(10),
        code          VARCHAR(20) UNIQUE,
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
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    return NextResponse.json({ success:true, message:'Tables patients + appointments créées ✅' });
  } catch(e:any) {
    return NextResponse.json({ error:e.message },{ status:500 });
  } finally { await pool.end(); }
}
