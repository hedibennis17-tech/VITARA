import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiError, apiNotFound, apiServerError } from '@/lib/auth/middleware';
import { queryOne } from '@/lib/db';
import { AppointmentSchema, parseBody } from '@/lib/validators';

type Ctx = { params: { id: string } };

export function GET(req: NextRequest, ctx: Ctx) {
  return withAuth(async (_req, { user }) => {
    try {
      const appt = await queryOne(
        `SELECT a.*,
                p.first_name || ' ' || p.last_name AS patient_name, p.phone, p.language,
                pr.title || ' ' || u.first_name || ' ' || u.last_name AS provider_name,
                d.name AS department_name
         FROM appointments a
         JOIN patients p ON a.patient_id = p.id
         JOIN providers pr ON a.provider_id = pr.id
         JOIN users u ON pr.user_id = u.id
         LEFT JOIN departments d ON a.department_id = d.id
         WHERE a.id = $1 AND a.clinic_id = $2`,
        [ctx.params.id, user.clinicId]
      );
      if (!appt) return apiNotFound('Rendez-vous');
      return apiSuccess({ appointment: appt });
    } catch (err) { return apiServerError(err); }
  })(req, { params: ctx.params });
}

export function PUT(req: NextRequest, ctx: Ctx) {
  return withAuth(async (innerReq, { user }) => {
    try {
      const body = await innerReq.json();
      const parsed = parseBody(AppointmentSchema.partial(), body);
      if (!parsed.success) return apiError(parsed.error, 422);
      const d = parsed.data;

      const updated = await queryOne(
        `UPDATE appointments SET
           date        = COALESCE($3, date),
           start_time  = COALESCE($4, start_time),
           end_time    = COALESCE($5, end_time),
           type        = COALESCE($6, type),
           reason      = COALESCE($7, reason),
           notes       = COALESCE($8, notes),
           updated_at  = NOW()
         WHERE id = $1 AND clinic_id = $2
         RETURNING *`,
        [ctx.params.id, user.clinicId, d.date, d.startTime, d.endTime, d.type, d.reason, d.notes]
      );
      if (!updated) return apiNotFound('Rendez-vous');
      return apiSuccess({ appointment: updated });
    } catch (err) { return apiServerError(err); }
  }, { roles: ['receptionist', 'supervisor', 'admin'] })(req, { params: ctx.params });
}

export function DELETE(req: NextRequest, ctx: Ctx) {
  return withAuth(async (_req, { user }) => {
    try {
      const updated = await queryOne(
        `UPDATE appointments SET status = 'cancelled', cancelled_at = NOW(),
                                  cancelled_by = $3, updated_at = NOW()
         WHERE id = $1 AND clinic_id = $2 RETURNING id`,
        [ctx.params.id, user.clinicId, user.id]
      );
      if (!updated) return apiNotFound('Rendez-vous');
      return apiSuccess({ message: 'Rendez-vous annulé' });
    } catch (err) { return apiServerError(err); }
  }, { roles: ['receptionist', 'supervisor', 'admin'] })(req, { params: ctx.params });
}
