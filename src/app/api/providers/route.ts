import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiCreated, apiError, apiServerError } from '@/lib/auth/middleware';
import { query, queryOne } from '@/lib/db';
import { ProviderSchema, parseBody } from '@/lib/validators';
import { v4 as uuidv4 } from 'uuid';

export const GET = withAuth(async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const dept     = searchParams.get('department');
    const specialty = searchParams.get('specialty');
    const available = searchParams.get('available');

    let where = 'pr.clinic_id = $1 AND pr.is_active = TRUE';
    const params: unknown[] = [user.clinicId];

    if (dept) { params.push(dept); where += ` AND pr.department_id = $${params.length}`; }
    if (specialty) { params.push(specialty); where += ` AND pr.specialty = $${params.length}`; }
    if (available === 'true') where += ` AND pr.accepts_new_patients = TRUE`;

    const providers = await query(
      `SELECT
         pr.*,
         u.first_name, u.last_name, u.email AS user_email,
         d.name AS department_name, d.color AS department_color,
         COUNT(DISTINCT a.id) FILTER (WHERE a.date = CURRENT_DATE AND a.status NOT IN ('cancelled')) AS appointments_today
       FROM providers pr
       LEFT JOIN users u ON pr.user_id = u.id
       LEFT JOIN departments d ON pr.department_id = d.id
       LEFT JOIN appointments a ON pr.id = a.provider_id
       WHERE ${where}
       GROUP BY pr.id, u.first_name, u.last_name, u.email, d.name, d.color
       ORDER BY u.last_name, u.first_name`,
      params
    );
    return apiSuccess({ providers, total: providers.length });
  } catch (err) {
    return apiServerError(err);
  }
});

export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const parsed = parseBody(ProviderSchema, body);
    if (!parsed.success) return apiError(parsed.error, 422);
    const d = parsed.data;

    const provider = await queryOne(
      `INSERT INTO providers (id, clinic_id, user_id, department_id, specialty, title, license_number, languages, bio, phone, email, consultation_duration)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [uuidv4(), user.clinicId, d.userId ?? null, d.departmentId ?? null, d.specialty, d.title ?? null, d.licenseNumber ?? null, d.languages, d.bio ?? null, d.phone ?? null, d.email ?? null, d.consultationDuration]
    );
    return apiCreated({ provider });
  } catch (err) {
    return apiServerError(err);
  }
}, { roles: ['admin', 'supervisor'] });
