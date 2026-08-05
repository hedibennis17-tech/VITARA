import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiError, apiNotFound, apiServerError } from '@/lib/auth/middleware';
import { queryOne } from '@/lib/db';
import { RescheduleSchema, parseBody } from '@/lib/validators';

export function POST(req: NextRequest, ctx: { params: { id: string } }) {
  return withAuth(async (innerReq, { user }) => {
    try {
      const body = await innerReq.json();
      const parsed = parseBody(RescheduleSchema, body);
      if (!parsed.success) return apiError(parsed.error, 422);
      const { date, startTime, endTime } = parsed.data;

      // Vérifier conflit
      const appt = await queryOne(
        `SELECT id, provider_id FROM appointments WHERE id = $1 AND clinic_id = $2`,
        [ctx.params.id, user.clinicId]
      );
      if (!appt) return apiNotFound('Rendez-vous');

      const conflict = await queryOne(
        `SELECT id FROM appointments
         WHERE provider_id = $1 AND date = $2 AND id != $3
           AND status NOT IN ('cancelled','no_show')
           AND (start_time < $5 AND end_time > $4)`,
        [(appt as Record<string,unknown>).provider_id, date, ctx.params.id, startTime, endTime]
      );
      if (conflict) return apiError('Créneau déjà occupé', 409);

      const updated = await queryOne(
        `UPDATE appointments SET
           date = $3, start_time = $4, end_time = $5,
           status = 'scheduled', updated_at = NOW()
         WHERE id = $1 AND clinic_id = $2 RETURNING *`,
        [ctx.params.id, user.clinicId, date, startTime, endTime]
      );
      return apiSuccess({ appointment: updated, message: 'Rendez-vous reporté' });
    } catch (err) { return apiServerError(err); }
  }, { roles: ['receptionist','supervisor','admin'] })(req, { params: ctx.params });
}
