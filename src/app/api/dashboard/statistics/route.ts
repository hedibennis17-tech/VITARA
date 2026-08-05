import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiServerError } from '@/lib/auth/middleware';
import { query, queryOne } from '@/lib/db';

// GET /api/dashboard/statistics?from=2026-07-01&to=2026-08-05
export const GET = withAuth(async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') ?? new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const to   = searchParams.get('to')   ?? new Date().toISOString().slice(0, 10);
    const cid  = user.clinicId;

    const [callStats, apptStats, topDepts, aiStats, daily] = await Promise.all([
      // Calls
      queryOne(
        `SELECT
           COUNT(*) AS total_calls,
           COUNT(*) FILTER (WHERE handled_by_ai) AS ai_calls,
           COUNT(*) FILTER (WHERE status = 'missed') AS missed_calls,
           ROUND(AVG(duration_sec))::int AS avg_duration_sec,
           ROUND(AVG(wait_sec))::int AS avg_wait_sec,
           COUNT(DISTINCT patient_id) AS unique_patients
         FROM phone_calls
         WHERE clinic_id = $1 AND queued_at::date BETWEEN $2 AND $3`,
        [cid, from, to]
      ),
      // Appointments
      queryOne(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status = 'completed') AS completed,
           COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
           COUNT(*) FILTER (WHERE status = 'no_show') AS no_show,
           COUNT(*) FILTER (WHERE type = 'teleconsult') AS teleconsult
         FROM appointments
         WHERE clinic_id = $1 AND date BETWEEN $2 AND $3`,
        [cid, from, to]
      ),
      // Top departments
      query(
        `SELECT d.name, d.color, COUNT(a.id) AS count
         FROM appointments a
         JOIN departments d ON a.department_id = d.id
         WHERE a.clinic_id = $1 AND a.date BETWEEN $2 AND $3
           AND a.status != 'cancelled'
         GROUP BY d.id ORDER BY count DESC LIMIT 10`,
        [cid, from, to]
      ),
      // AI intent breakdown
      query(
        `SELECT ai_intent, COUNT(*) AS count
         FROM phone_calls
         WHERE clinic_id = $1 AND queued_at::date BETWEEN $2 AND $3
           AND ai_intent IS NOT NULL
         GROUP BY ai_intent ORDER BY count DESC`,
        [cid, from, to]
      ),
      // Daily calls
      query(
        `SELECT
           queued_at::date AS date,
           COUNT(*) AS calls,
           COUNT(*) FILTER (WHERE handled_by_ai) AS ai_calls
         FROM phone_calls
         WHERE clinic_id = $1 AND queued_at::date BETWEEN $2 AND $3
         GROUP BY date ORDER BY date`,
        [cid, from, to]
      ),
    ]);

    return apiSuccess({
      period: { from, to },
      calls: callStats,
      appointments: apptStats,
      topDepartments: topDepts,
      aiIntents: aiStats,
      dailyTrend: daily,
    });
  } catch (err) {
    return apiServerError(err);
  }
}, { roles: ['supervisor', 'admin'] });
