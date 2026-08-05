import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiNotFound, apiServerError } from '@/lib/auth/middleware';
import { queryOne } from '@/lib/db';

export function POST(req: NextRequest, ctx: { params: { id: string } }) {
  return withAuth(async (_req, { user }) => {
    try {
      const appt = await queryOne(
        `UPDATE appointments SET status = 'confirmed', confirmed_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND clinic_id = $2 AND status IN ('scheduled','waiting')
         RETURNING id, status, date, start_time`,
        [ctx.params.id, user.clinicId]
      );
      if (!appt) return apiNotFound('Rendez-vous');
      return apiSuccess({ appointment: appt, message: 'Rendez-vous confirmé' });
    } catch (err) { return apiServerError(err); }
  })(req, { params: ctx.params });
}
