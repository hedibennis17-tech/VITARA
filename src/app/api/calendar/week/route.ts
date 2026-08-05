import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiError, apiServerError } from '@/lib/auth/middleware';
import { query } from '@/lib/db';

// GET /api/calendar/week?date=2026-08-04&provider=uuid
export const GET = withAuth(async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const date       = searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
    const providerId = searchParams.get('provider');

    // Calculer lun-dim de la semaine
    const d = new Date(date);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const from = monday.toISOString().slice(0, 10);
    const to   = sunday.toISOString().slice(0, 10);

    let where = 'a.clinic_id = $1 AND a.date BETWEEN $2 AND $3 AND a.status NOT IN (\'cancelled\')';
    const params: unknown[] = [user.clinicId, from, to];

    if (providerId) {
      params.push(providerId);
      where += ` AND a.provider_id = $${params.length}`;
    }

    const appointments = await query(
      `SELECT
         a.id, a.date, a.start_time, a.end_time, a.status, a.type,
         a.reason, a.duration_min,
         p.first_name || ' ' || p.last_name AS patient_name,
         p.phone AS patient_phone, p.language AS patient_language,
         pr.title || ' ' || u.first_name || ' ' || u.last_name AS provider_name,
         pr.id AS provider_id,
         d.name AS department_name, d.color AS department_color
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN providers pr ON a.provider_id = pr.id
       JOIN users u ON pr.user_id = u.id
       LEFT JOIN departments d ON a.department_id = d.id
       WHERE ${where}
       ORDER BY a.date, a.start_time`,
      params
    );

    // Grouper par jour
    const byDay: Record<string, typeof appointments> = {};
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      byDay[dayDate.toISOString().slice(0, 10)] = [];
    }
    for (const appt of appointments) {
      const key = String((appt as Record<string, unknown>).date).slice(0, 10);
      if (byDay[key]) byDay[key].push(appt);
    }

    return apiSuccess({
      week: { from, to },
      appointments,
      byDay,
      total: appointments.length,
    });
  } catch (err) {
    return apiServerError(err);
  }
});
