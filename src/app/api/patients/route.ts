import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiCreated, apiError, apiServerError } from '@/lib/auth/middleware';
import { DEMO_MODE, DEMO_PATIENTS } from '@/lib/db/demo';
import { PatientSchema, parseBody } from '@/lib/validators';

export const GET = withAuth(async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.toLowerCase() ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));

    if (DEMO_MODE) {
      let patients = DEMO_PATIENTS;
      if (search) {
        patients = patients.filter(p =>
          p.first_name.toLowerCase().includes(search) ||
          p.last_name.toLowerCase().includes(search) ||
          p.phone.includes(search) ||
          (p.ramq_number?.toLowerCase().includes(search))
        );
      }
      const total = patients.length;
      const paginated = patients.slice((page - 1) * limit, page * limit);
      return apiSuccess({ patients: paginated, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

    const { query } = await import('@/lib/db');
    let where = 'p.clinic_id=$1 AND p.is_active=TRUE';
    const params: unknown[] = [user.clinicId];
    if (search) { params.push(`%${search}%`); where += ` AND (p.first_name ILIKE $${params.length} OR p.last_name ILIKE $${params.length} OR p.phone ILIKE $${params.length} OR p.ramq_number ILIKE $${params.length})`; }
    const offset = (page - 1) * limit;
    const rows = await query(`SELECT p.id,p.first_name,p.last_name,p.date_of_birth,p.gender,p.phone,p.phone_alt,p.email,p.language,p.ramq_number,p.allergies,p.is_active,p.created_at,p.updated_at,pr.title||' '||u.first_name||' '||u.last_name AS primary_provider,COUNT(*) OVER() AS total_count FROM patients p LEFT JOIN providers pr ON p.primary_provider_id=pr.id LEFT JOIN users u ON pr.user_id=u.id WHERE ${where} ORDER BY p.last_name,p.first_name LIMIT $${params.length+1} OFFSET $${params.length+2}`, [...params, limit, offset]);
    const total = rows[0] ? parseInt(String((rows[0] as Record<string,unknown>).total_count)) : 0;
    return apiSuccess({ patients: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { return apiServerError(err); }
});

export const POST = withAuth(async (req, { user }) => {
  try {
    if (DEMO_MODE) return apiError('Création désactivée en mode démo', 403);
    const body = await req.json();
    const parsed = parseBody(PatientSchema, body);
    if (!parsed.success) return apiError(parsed.error, 422);
    const { query: dbQuery, queryOne } = await import('@/lib/db');
    const { v4: uuidv4 } = await import('uuid');
    const d = parsed.data;
    const existing = await queryOne('SELECT id FROM patients WHERE clinic_id=$1 AND phone=$2', [user.clinicId, d.phone]);
    if (existing) return apiError('Un patient avec ce numéro existe déjà', 409);
    const patient = await queryOne(`INSERT INTO patients (id,clinic_id,first_name,last_name,date_of_birth,gender,language,phone,phone_alt,email,address,ramq_number,allergies,primary_provider_id,medical_notes,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`, [uuidv4(),user.clinicId,d.firstName,d.lastName,d.dateOfBirth,d.gender,d.language,d.phone,d.phoneAlt??null,d.email||null,JSON.stringify(d.address??{}),d.ramqNumber??null,d.allergies,d.primaryProviderId??null,d.medicalNotes??null,user.id]);
    return apiCreated({ patient });
  } catch (err) { return apiServerError(err); }
}, { roles: ['receptionist','supervisor','admin'] });
