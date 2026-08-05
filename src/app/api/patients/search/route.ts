import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiError, apiServerError } from '@/lib/auth/middleware';
import { query } from '@/lib/db';

// GET /api/patients/search?q=Jean&by=name|phone|ramq
export const GET = withAuth(async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const q   = searchParams.get('q')?.trim();
    const by  = searchParams.get('by') ?? 'all';

    if (!q || q.length < 2) return apiError('Requête trop courte (min. 2 caractères)', 400);

    let where = 'p.clinic_id = $1 AND p.is_active = TRUE AND (';
    const params: unknown[] = [user.clinicId];

    if (by === 'phone' || by === 'all') {
      params.push(`%${q.replace(/\D/g, '')}%`);
      where += `regexp_replace(p.phone, '[^0-9]', '', 'g') ILIKE $${params.length}`;
    }
    if (by === 'name' || by === 'all') {
      params.push(`%${q}%`);
      where += (by === 'all' ? ' OR ' : '') +
        `(p.first_name || ' ' || p.last_name) ILIKE $${params.length}`;
    }
    if (by === 'ramq' || by === 'all') {
      params.push(`%${q}%`);
      where += (by === 'all' ? ' OR ' : '') + `p.ramq_number ILIKE $${params.length}`;
    }
    if (by === 'id') {
      params.push(`%${q}%`);
      where += `CAST(p.id AS TEXT) ILIKE $${params.length}`;
    }

    where += ')';

    const patients = await query(
      `SELECT p.id, p.first_name, p.last_name, p.date_of_birth, p.gender,
              p.phone, p.email, p.ramq_number, p.allergies, p.language,
              p.primary_provider_id,
              pr.title || ' ' || u.first_name || ' ' || u.last_name AS primary_provider
       FROM patients p
       LEFT JOIN providers pr ON p.primary_provider_id = pr.id
       LEFT JOIN users u ON pr.user_id = u.id
       WHERE ${where}
       ORDER BY p.last_name, p.first_name
       LIMIT 20`,
      params
    );

    return apiSuccess({ patients, total: patients.length, query: q });
  } catch (err) {
    return apiServerError(err);
  }
});
