import { withAuth, apiSuccess, apiServerError } from '@/lib/auth/middleware';
import { DEMO_DASHBOARD } from '@/lib/db/demo';

export const GET = withAuth(async (_req, { user }) => {
  try {
    const DB = process.env.DATABASE_URL;

    // Stats depuis nos vraies tables (conversations + appointments + patients)
    if (DB) {
      try {
        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString: DB, ssl: { rejectUnauthorized: false } });

        const [convStats, apptStats, patStats, recentConvs] = await Promise.all([
          pool.query(`
            SELECT
              COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status='completed')   AS completed,
              COUNT(*) FILTER (WHERE status='in_progress') AS in_progress,
              COUNT(*) FILTER (WHERE started_at::date = CURRENT_DATE) AS today,
              ROUND(AVG(duration_sec) FILTER (WHERE duration_sec IS NOT NULL))::int AS avg_duration_sec
            FROM conversations
          `),
          pool.query(`
            SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status='confirmed') AS confirmed,
              COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS today
            FROM appointments
          `),
          pool.query(`SELECT COUNT(*) AS total FROM patients`),
          pool.query(`
            SELECT session_id, agent_name, patient_name, patient_phone,
                   service, practitioner, reason, status, started_at, duration_sec
            FROM conversations
            ORDER BY started_at DESC LIMIT 5
          `),
        ]);

        await pool.end();

        const c = convStats.rows[0];
        const a = apptStats.rows[0];
        const p = patStats.rows[0];

        return apiSuccess({
          calls: {
            calls_today:      parseInt(c.today),
            calls_active:     parseInt(c.in_progress),
            calls_missed:     0,
            calls_queued:     0,
            calls_ai:         parseInt(c.total),
            avg_duration_sec: parseInt(c.avg_duration_sec) || 0,
          },
          appointments: {
            appointments_today: parseInt(a.today),
            confirmed:          parseInt(a.confirmed),
            completed:          0,
            cancelled:          0,
            pending:            0,
          },
          patients: {
            patients_served_today: parseInt(p.total),
          },
          activeCalls: recentConvs.rows.map((r: any) => ({
            id:           r.session_id,
            caller_phone: r.patient_phone || '',
            status:       r.status,
            language:     r.language || 'fr',
            patient_name: r.patient_name || 'Patient',
            elapsed_sec:  r.duration_sec,
            handled_by_ai:true,
            ai_intent:    r.service || '',
            scenario:     r.reason || '',
          })),
          upcomingAppointments: [],
          generatedAt: new Date().toISOString(),
          liveData: true,
        });
      } catch (dbErr: any) {
        console.error('[Dashboard DB]', dbErr.message);
        // Fallback vers démo si erreur DB
      }
    }

    // Mode démo (pas de DB ou erreur)
    return apiSuccess({ ...DEMO_DASHBOARD, generatedAt: new Date().toISOString(), demoMode: true });

  } catch (err) {
    return apiServerError(err);
  }
});
