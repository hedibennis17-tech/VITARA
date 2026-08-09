import { NextRequest, NextResponse } from 'next/server';
const getPool = async () => {
  const DB = process.env.DATABASE_URL;
  if (!DB) return null;
  const { Pool } = await import('pg');
  return new Pool({ connectionString:DB, ssl:{rejectUnauthorized:false} });
};

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone')?.replace(/\D/g,'');
  if (!phone) return NextResponse.json({ error:'phone requis' },{ status:400 });
  const pool = await getPool();
  if (!pool) return NextResponse.json({ found:false, db:false });
  try {
    const r = await pool.query('SELECT id,full_name,phone,email,ramq,address,family_doctor FROM patients WHERE phone=$1 LIMIT 1',[phone]);
    if (r.rows.length===0) return NextResponse.json({ found:false });
    return NextResponse.json({ found:true, patient:r.rows[0] });
  } catch(e:any) { return NextResponse.json({ error:e.message },{ status:500 });
  } finally { await pool.end(); }
}

export async function POST(req: NextRequest) {
  const { full_name,phone,email,ramq,address,family_doctor } = await req.json();
  const p = (phone||'').replace(/\D/g,'');
  if (!p) return NextResponse.json({ error:'phone requis' },{ status:400 });
  const pool = await getPool();
  if (!pool) return NextResponse.json({ success:false, db:false });
  try {
    await pool.query(`
      INSERT INTO patients (full_name,phone,email,ramq,address,family_doctor)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (phone) DO UPDATE SET
        full_name=COALESCE($1,patients.full_name), email=COALESCE($3,patients.email),
        ramq=COALESCE($4,patients.ramq), address=COALESCE($5,patients.address),
        family_doctor=COALESCE($6,patients.family_doctor), updated_at=NOW()
    `,[full_name||null,p,email||null,ramq||null,address||null,family_doctor||null]);
    return NextResponse.json({ success:true });
  } catch(e:any) { return NextResponse.json({ error:e.message },{ status:500 });
  } finally { await pool.end(); }
}
