import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiCreated, apiError, apiServerError } from '@/lib/auth/middleware';
import { DEMO_MODE, DEMO_DEPARTMENTS } from '@/lib/db/demo';
import { DepartmentSchema, parseBody } from '@/lib/validators';

export const GET = withAuth(async (_req, { user }) => {
  try {
    if (DEMO_MODE) return apiSuccess({ departments: DEMO_DEPARTMENTS, total: DEMO_DEPARTMENTS.length });
    const { query } = await import('@/lib/db');
    const depts = await query(`SELECT d.*,COUNT(DISTINCT p.id) AS provider_count FROM departments d LEFT JOIN providers p ON d.id=p.department_id AND p.is_active=TRUE WHERE d.clinic_id=$1 AND d.is_active=TRUE GROUP BY d.id ORDER BY d.sort_order,d.name`, [user.clinicId]);
    return apiSuccess({ departments: depts, total: depts.length });
  } catch (err) { return apiServerError(err); }
});

export const POST = withAuth(async (req, { user }) => {
  try {
    if (DEMO_MODE) return apiError('Création désactivée en mode démo', 403);
    const body = await req.json();
    const parsed = parseBody(DepartmentSchema, body);
    if (!parsed.success) return apiError(parsed.error, 422);
    return apiCreated({ message: 'OK' });
  } catch (err) { return apiServerError(err); }
}, { roles: ['admin','supervisor'] });
