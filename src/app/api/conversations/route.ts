import { NextRequest, NextResponse } from 'next/server';
const getPool = async () => {
  const DB = process.env.DATABASE_URL;
  if (!DB) return null;
  const { Pool } = await import('pg');
  return new Pool({ connectionString:DB, ssl:{rejectUnauthorized:false} });
};

// GET /api/conversations?limit=50&offset=0 — liste pour dashboard
export async function GET(req: NextRequest) {
  const pool = await getPool();
  if (!pool) return NextResponse.json({ conversations:[], db:false });
  const limit  = parseInt(req.nextUrl.searchParams.get('limit')  || '50');
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');
  const search = req.nextUrl.searchParams.get('search') || '';
  try {
    const where = search ? `WHERE patient_name ILIKE $3 OR patient_phone LIKE $3 OR service ILIKE $3` : '';
    const params: any[] = [limit, offset];
    if (search) params.push(`%${search}%`);
    const r = await pool.query(`
      SELECT id, session_id, agent_name, patient_phone, patient_name,
             service, practitioner, reason, body_part, pain_scale,
             language, status, started_at, ended_at, duration_sec,
             booking_code, booking_date, booking_time, accident_type
      FROM conversations
      ${where}
      ORDER BY started_at DESC
      LIMIT $1 OFFSET $2
    `, params);
    const count = await pool.query(`SELECT COUNT(*) FROM conversations ${where}`, search ? [`%${search}%`] : []);
    return NextResponse.json({ conversations: r.rows, total: parseInt(count.rows[0].count) });
  } catch(e:any) {
    return NextResponse.json({ error:e.message },{ status:500 });
  } finally { await pool.end(); }
}

// POST /api/conversations — créer ou mettre à jour une conversation
export async function POST(req: NextRequest) {
  const pool = await getPool();
  const body = await req.json();
  const {
    session_id, agent_id, agent_name, patient_phone, patient_name,
    service, practitioner, reason, body_part, accident_type, claim_number,
    pain_scale, language, status, transcript, booking_code,
    booking_date, booking_time, duration_sec,
  } = body;
  if (!session_id) return NextResponse.json({ error:'session_id requis' },{ status:400 });
  if (!pool) {
    // Mode démo — localStorage seulement
    return NextResponse.json({ success:true, db:false });
  }
  try {
    await pool.query(`
      INSERT INTO conversations (
        session_id, agent_id, agent_name, patient_phone, patient_name,
        service, practitioner, reason, body_part, accident_type, claim_number,
        pain_scale, language, status, transcript, booking_code,
        booking_date, booking_time, duration_sec,
        ended_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,$17,$18,$19,
        CASE WHEN $14='completed' THEN NOW() ELSE NULL END
      )
      ON CONFLICT (session_id) DO UPDATE SET
        patient_name=COALESCE($5,conversations.patient_name),
        service=COALESCE($6,conversations.service),
        practitioner=COALESCE($7,conversations.practitioner),
        reason=COALESCE($8,conversations.reason),
        body_part=COALESCE($9,conversations.body_part),
        accident_type=COALESCE($10,conversations.accident_type),
        claim_number=COALESCE($11,conversations.claim_number),
        pain_scale=COALESCE($12,conversations.pain_scale),
        status=COALESCE($14,conversations.status),
        transcript=COALESCE($15::jsonb,conversations.transcript),
        booking_code=COALESCE($16,conversations.booking_code),
        booking_date=COALESCE($17,conversations.booking_date),
        booking_time=COALESCE($18,conversations.booking_time),
        duration_sec=COALESCE($19,conversations.duration_sec),
        ended_at=CASE WHEN $14='completed' THEN NOW() ELSE conversations.ended_at END
    `, [
      session_id, agent_id||null, agent_name||null, (patient_phone||'').replace(/\D/g,'')||null,
      patient_name||null, service||null, practitioner||null, reason||null,
      body_part||null, accident_type||null, claim_number||null, pain_scale||null,
      language||'fr', status||'in_progress',
      JSON.stringify(transcript||[]), booking_code||null,
      booking_date||null, booking_time||null, duration_sec||null,
    ]);

    // Upsert patient si on a le téléphone
    if (patient_phone && patient_name) {
      const p = patient_phone.replace(/\D/g,'');
      await pool.query(`
        INSERT INTO patients (full_name, phone) VALUES ($1,$2)
        ON CONFLICT (phone) DO UPDATE SET
          full_name=COALESCE($1,patients.full_name), updated_at=NOW()
      `, [patient_name, p]).catch(()=>{});
    }

    return NextResponse.json({ success:true });
  } catch(e:any) {
    return NextResponse.json({ error:e.message },{ status:500 });
  } finally { await pool.end(); }
}
