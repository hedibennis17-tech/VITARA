import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiServerError } from '@/lib/auth/middleware';
import { DEMO_MODE, DEMO_DASHBOARD } from '@/lib/db/demo';

export const GET = withAuth(async (_req, { user }) => {
  try {
    if (DEMO_MODE) {
      return apiSuccess({ ...DEMO_DASHBOARD, generatedAt: new Date().toISOString(), demoMode: true });
    }

    const { query, queryOne } = await import('@/lib/db');
    const clinicId = user.clinicId;

    const [callStats, apptStats, patientStats] = await Promise.all([
      queryOne(`SELECT COUNT(*) AS calls_today, COUNT(*) FILTER (WHERE status='active') AS calls_active, COUNT(*) FILTER (WHERE status='missed') AS calls_missed, COUNT(*) FILTER (WHERE status='queued') AS calls_queued, COUNT(*) FILTER (WHERE handled_by_ai=TRUE) AS calls_ai, ROUND(AVG(duration_sec) FILTER (WHERE duration_sec IS NOT NULL))::int AS avg_duration_sec, ROUND(AVG(wait_sec) FILTER (WHERE wait_sec IS NOT NULL))::int AS avg_wait_sec FROM phone_calls WHERE clinic_id=$1 AND queued_at::date=CURRENT_DATE`, [clinicId]),
      queryOne(`SELECT COUNT(*) AS appointments_today, COUNT(*) FILTER (WHERE status='confirmed') AS confirmed, COUNT(*) FILTER (WHERE status='completed') AS completed, COUNT(*) FILTER (WHERE status='cancelled') AS cancelled, COUNT(*) FILTER (WHERE status='no_show') AS no_show, COUNT(*) FILTER (WHERE status IN ('scheduled','waiting')) AS pending FROM appointments WHERE clinic_id=$1 AND date=CURRENT_DATE`, [clinicId]),
      queryOne(`SELECT COUNT(DISTINCT patient_id) AS patients_served_today FROM appointments WHERE clinic_id=$1 AND date=CURRENT_DATE AND status='completed'`, [clinicId]),
    ]);

    const activeCalls = await query(`SELECT pc.id, pc.caller_phone, pc.status, pc.language, pc.ai_intent, pc.scenario, pc.queued_at, pc.answered_at, pc.handled_by_ai, p.first_name||' '||p.last_name AS patient_name, EXTRACT(EPOCH FROM (NOW()-pc.answered_at))::int AS elapsed_sec FROM phone_calls pc LEFT JOIN patients p ON pc.patient_id=p.id WHERE pc.clinic_id=$1 AND pc.status IN ('active','queued') ORDER BY pc.queued_at`, [clinicId]);
    const upcomingAppointments = await query(`SELECT a.id, a.date, a.start_time, a.end_time, a.status, a.type, p.first_name||' '||p.last_name AS patient_name, p.phone AS patient_phone, pr.title||' '||u.first_name||' '||u.last_name AS provider_name, d.name AS department_name, d.color AS department_color FROM appointments a JOIN patients p ON a.patient_id=p.id JOIN providers pr ON a.provider_id=pr.id JOIN users u ON pr.user_id=u.id LEFT JOIN departments d ON a.department_id=d.id WHERE a.clinic_id=$1 AND a.date=CURRENT_DATE AND a.status NOT IN ('cancelled','completed') AND a.start_time>=NOW()::time ORDER BY a.start_time LIMIT 10`, [clinicId]);

    return apiSuccess({ calls: callStats, appointments: apptStats, patients: patientStats, activeCalls, upcomingAppointments, generatedAt: new Date().toISOString() });
  } catch (err) {
    return apiServerError(err);
  }
});
