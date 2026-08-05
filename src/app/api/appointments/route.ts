import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiCreated, apiError, apiServerError } from '@/lib/auth/middleware';
import { query, queryOne } from '@/lib/db';
import { AppointmentSchema, parseBody } from '@/lib/validators';
import { v4 as uuidv4 } from 'uuid';

// GET /api/appointments
export const GET = withAuth(async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const date       = searchParams.get('date');
    const dateFrom   = searchParams.get('from');
    const dateTo     = searchParams.get('to');
    const providerId = searchParams.get('provider');
    const patientId  = searchParams.get('patient');
    const status     = searchParams.get('status');
    const page       = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit      = Math.min(100, parseInt(searchParams.get('limit') ?? '50'));
    const offset     = (page - 1) * limit;

    let where = 'a.clinic_id = $1';
    const params: unknown[] = [user.clinicId];

    if (date) {
      params.push(date);
      where += ` AND a.date = $${params.length}`;
    }
    if (dateFrom) {
      params.push(dateFrom);
      where += ` AND a.date >= $${params.length}`;
    }
    if (dateTo) {
      params.push(dateTo);
      where += ` AND a.date <= $${params.length}`;
    }
    if (providerId) {
      params.push(providerId);
      where += ` AND a.provider_id = $${params.length}`;
    }
    if (patientId) {
      params.push(patientId);
      where += ` AND a.patient_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      where += ` AND a.status = $${params.length}`;
    }

    const rows = await query(
      `SELECT
         a.*,
         p.first_name || ' ' || p.last_name AS patient_name,
         p.phone AS patient_phone, p.language AS patient_language,
         p.allergies AS patient_allergies,
         pr.title || ' ' || u.first_name || ' ' || u.last_name AS provider_name,
         d.name AS department_name, d.color AS department_color,
         COUNT(*) OVER() AS total_count
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN providers pr ON a.provider_id = pr.id
       JOIN users u ON pr.user_id = u.id
       LEFT JOIN departments d ON a.department_id = d.id
       WHERE ${where}
       ORDER BY a.date, a.start_time
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const total = rows[0] ? parseInt(String((rows[0] as Record<string, unknown>).total_count)) : 0;
    return apiSuccess({
      appointments: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return apiServerError(err);
  }
});

// POST /api/appointments
export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const parsed = parseBody(AppointmentSchema, body);
    if (!parsed.success) return apiError(parsed.error, 422);

    const d = parsed.data;

    // Vérifier disponibilité — pas de conflit
    const conflict = await queryOne(
      `SELECT id FROM appointments
       WHERE provider_id = $1 AND date = $2
         AND status NOT IN ('cancelled','no_show')
         AND (
           (start_time < $4 AND end_time > $3)
         )`,
      [d.providerId, d.date, d.startTime, d.endTime]
    );
    if (conflict) return apiError('Créneau déjà occupé pour ce professionnel', 409);

    const appointment = await queryOne(
      `INSERT INTO appointments (
         id, clinic_id, patient_id, provider_id, department_id,
         date, start_time, end_time, duration_min, type,
         reason, notes, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        uuidv4(), user.clinicId, d.patientId, d.providerId, d.departmentId ?? null,
        d.date, d.startTime, d.endTime, d.durationMin, d.type,
        d.reason ?? null, d.notes ?? null, user.id,
      ]
    );

    return apiCreated({ appointment });
  } catch (err) {
    return apiServerError(err);
  }
}, { roles: ['receptionist', 'supervisor', 'admin'] });
