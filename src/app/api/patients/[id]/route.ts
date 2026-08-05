import { NextRequest, NextResponse } from 'next/server';
import { withAuth, apiSuccess, apiError, apiNotFound, apiServerError } from '@/lib/auth/middleware';
import { query, queryOne } from '@/lib/db';
import { PatientSchema, parseBody } from '@/lib/validators';

type Ctx = { params: { id: string } };

// GET /api/patients/:id
export function GET(req: NextRequest, ctx: Ctx) {
  return withAuth(async (_req, { user }) => {
    try {
      const patient = await queryOne(
        `SELECT p.*,
                pr.title || ' ' || u.first_name || ' ' || u.last_name AS primary_provider,
                d.name AS department_name,
                (SELECT json_agg(a ORDER BY a.date DESC, a.start_time DESC)
                 FROM appointments a WHERE a.patient_id = p.id
                 LIMIT 5) AS recent_appointments,
                (SELECT json_agg(n ORDER BY n.created_at DESC)
                 FROM medical_notes n WHERE n.patient_id = p.id
                 LIMIT 10) AS recent_notes
         FROM patients p
         LEFT JOIN providers pr ON p.primary_provider_id = pr.id
         LEFT JOIN users u ON pr.user_id = u.id
         LEFT JOIN departments d ON pr.department_id = d.id
         WHERE p.id = $1 AND p.clinic_id = $2`,
        [ctx.params.id, user.clinicId]
      );
      if (!patient) return apiNotFound('Patient');
      return apiSuccess({ patient });
    } catch (err) {
      return apiServerError(err);
    }
  })(req, { params: ctx.params });
}

// PUT /api/patients/:id
export function PUT(req: NextRequest, ctx: Ctx) {
  return withAuth(async (innerReq, { user }) => {
    try {
      const body = await innerReq.json();
      const parsed = parseBody(PatientSchema.partial(), body);
      if (!parsed.success) return apiError(parsed.error, 422);

      const existing = await queryOne(
        `SELECT id FROM patients WHERE id = $1 AND clinic_id = $2`,
        [ctx.params.id, user.clinicId]
      );
      if (!existing) return apiNotFound('Patient');

      const d = parsed.data;
      const updated = await queryOne(
        `UPDATE patients SET
           first_name = COALESCE($3, first_name),
           last_name  = COALESCE($4, last_name),
           phone      = COALESCE($5, phone),
           phone_alt  = COALESCE($6, phone_alt),
           email      = COALESCE($7, email),
           language   = COALESCE($8, language),
           allergies  = COALESCE($9, allergies),
           ramq_number = COALESCE($10, ramq_number),
           medical_notes = COALESCE($11, medical_notes),
           updated_at = NOW()
         WHERE id = $1 AND clinic_id = $2
         RETURNING *`,
        [
          ctx.params.id, user.clinicId,
          d.firstName, d.lastName, d.phone, d.phoneAlt, d.email,
          d.language, d.allergies, d.ramqNumber, d.medicalNotes,
        ]
      );
      return apiSuccess({ patient: updated });
    } catch (err) {
      return apiServerError(err);
    }
  }, { roles: ['receptionist', 'supervisor', 'admin'] })(req, { params: ctx.params });
}

// DELETE /api/patients/:id
export function DELETE(req: NextRequest, ctx: Ctx) {
  return withAuth(async (_req, { user }) => {
    try {
      const existing = await queryOne(
        `SELECT id FROM patients WHERE id = $1 AND clinic_id = $2`,
        [ctx.params.id, user.clinicId]
      );
      if (!existing) return apiNotFound('Patient');

      // Soft delete
      await queryOne(
        `UPDATE patients SET is_active = FALSE, updated_at = NOW() WHERE id = $1`,
        [ctx.params.id]
      );
      return apiSuccess({ message: 'Patient archivé' });
    } catch (err) {
      return apiServerError(err);
    }
  }, { roles: ['admin', 'supervisor'] })(req, { params: ctx.params });
}
