import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiError, apiNotFound, apiServerError } from '@/lib/auth/middleware';
import { queryOne } from '@/lib/db';
import { CancelSchema, parseBody } from '@/lib/validators';

export function POST(req: NextRequest, ctx: { params: { id: string } }) {
  return withAuth(async (innerReq, { user }) => {
    try {
      const body = await innerReq.json().catch(() => ({}));
      const parsed = parseBody(CancelSchema, body);
      if (!parsed.success) return apiError(parsed.error, 422);

      const appt = await queryOne(
        `UPDATE appointments SET
           status = 'cancelled', cancelled_at = NOW(),
           cancelled_by = $3, cancel_reason = $4, updated_at = NOW()
         WHERE id = $1 AND clinic_id = $2 AND status NOT IN ('cancelled','completed')
         RETURNING id, status, cancel_reason`,
        [ctx.params.id, user.clinicId, user.id, parsed.data.reason ?? null]
      );
      if (!appt) return apiNotFound('Rendez-vous (ou déjà annulé)');
      return apiSuccess({ appointment: appt, message: 'Rendez-vous annulé' });
    } catch (err) { return apiServerError(err); }
  })(req, { params: ctx.params });
}
