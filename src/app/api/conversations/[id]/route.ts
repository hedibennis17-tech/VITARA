import { NextRequest, NextResponse } from 'next/server';
export async function GET(_req: NextRequest, { params }: { params: { id:string } }) {
  const DB = process.env.DATABASE_URL;
  if (!DB) return NextResponse.json({ error:'DB non connectée' },{ status:503 });
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString:DB, ssl:{rejectUnauthorized:false} });
  try {
    const r = await pool.query('SELECT * FROM conversations WHERE id=$1 OR session_id=$1', [params.id]);
    if (!r.rows.length) return NextResponse.json({ error:'Non trouvé' },{ status:404 });
    return NextResponse.json({ conversation: r.rows[0] });
  } catch(e:any) { return NextResponse.json({ error:e.message },{ status:500 });
  } finally { await pool.end(); }
}
