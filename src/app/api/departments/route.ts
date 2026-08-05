import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiCreated, apiError, apiServerError } from '@/lib/auth/middleware';
import { query, queryOne } from '@/lib/db';
import { DepartmentSchema, parseBody } from '@/lib/validators';
import { v4 as uuidv4 } from 'uuid';

export const GET = withAuth(async (_req, { user }) => {
  try {
    const depts = await query(
      `SELECT d.*,
              COUNT(DISTINCT p.id) AS provider_count
       FROM departments d
       LEFT JOIN providers p ON d.id = p.department_id AND p.is_active = TRUE
       WHERE d.clinic_id = $1 AND d.is_active = TRUE
       GROUP BY d.id
       ORDER BY d.sort_order, d.name`,
      [user.clinicId]
    );
    return apiSuccess({ departments: depts, total: depts.length });
  } catch (err) {
    return apiServerError(err);
  }
});

export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const parsed = parseBody(DepartmentSchema, body);
    if (!parsed.success) return apiError(parsed.error, 422);
    const d = parsed.data;
    const slug = d.slug ?? d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const dept = await queryOne(
      `INSERT INTO departments (id, clinic_id, name, name_en, slug, category, icon, color, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [uuidv4(), user.clinicId, d.name, d.nameEn ?? null, slug, d.category, d.icon ?? null, d.color ?? '#00C5D4', d.description ?? null]
    );
    return apiCreated({ department: dept });
  } catch (err) {
    return apiServerError(err);
  }
}, { roles: ['admin', 'supervisor'] });
