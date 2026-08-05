import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiCreated, apiError, apiServerError } from '@/lib/auth/middleware';
import { DEMO_MODE, DEMO_APPOINTMENTS } from '@/lib/db/demo';
import { AppointmentSchema, parseBody } from '@/lib/validators';

export const GET = withAuth(async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50'));

    if (DEMO_MODE) {
      let appts = DEMO_APPOINTMENTS;
      if (date) appts = appts.filter(a => a.date === date);
      const total = appts.length;
      return apiSuccess({ appointments: appts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

    const { query } = await import('@/lib/db');
    const offset = (page - 1) * limit;
    let where = 'a.clinic_id=$1';
    const params: unknown[] = [user.clinicId];
    if (date) { params.push(date); where += ` AND a.date=$${params.length}`; }
    const rows = await query(`SELECT a.*,p.first_name||' '||p.last_name AS patient_name,p.phone AS patient_phone,p.language AS patient_language,p.allergies AS patient_allergies,pr.title||' '||u.first_name||' '||u.last_name AS provider_name,d.name AS department_name,d.color AS department_color,COUNT(*) OVER() AS total_count FROM appointments a JOIN patients p ON a.patient_id=p.id JOIN providers pr ON a.provider_id=pr.id JOIN users u ON pr.user_id=u.id LEFT JOIN departments d ON a.department_id=d.id WHERE ${where} ORDER BY a.date,a.start_time LIMIT $${params.length+1} OFFSET $${params.length+2}`, [...params, limit, offset]);
    const total = rows[0] ? parseInt(String((rows[0] as Record<string,unknown>).total_count)) : 0;
    return apiSuccess({ appointments: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { return apiServerError(err); }
});

export const POST = withAuth(async (req, { user }) => {
  try {
    if (DEMO_MODE) return apiError('Création désactivée en mode démo', 403);
    const body = await req.json();
    const parsed = parseBody(AppointmentSchema, body);
    if (!parsed.success) return apiError(parsed.error, 422);
    return apiCreated({ message: 'Non implémenté en mode production sans DB' });
  } catch (err) { return apiServerError(err); }
}, { roles: ['receptionist','supervisor','admin'] });
