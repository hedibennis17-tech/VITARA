import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiError, apiServerError } from '@/lib/auth/middleware';
import { query } from '@/lib/db';

// POST /api/voice-ai/search-patient
// Identifie automatiquement le patient par numéro de téléphone entrant
export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const { phone } = body;
    if (!phone) return apiError('phone requis', 400);

    // Normaliser le numéro
    const normalized = phone.replace(/\D/g, '');

    const patients = await query(
      `SELECT
         p.id, p.first_name, p.last_name, p.date_of_birth, p.gender,
         p.phone, p.language, p.ramq_number, p.allergies,
         p.emergency_contact, p.medical_notes,
         pr.title || ' ' || u.first_name || ' ' || u.last_name AS primary_provider,
         d.name AS department_name,
         (SELECT json_build_object(
            'date', a.date, 'start_time', a.start_time,
            'provider', pr2.title || ' ' || u2.first_name || ' ' || u2.last_name,
            'department', d2.name, 'status', a.status
          )
          FROM appointments a
          JOIN providers pr2 ON a.provider_id = pr2.id
          JOIN users u2 ON pr2.user_id = u2.id
          LEFT JOIN departments d2 ON a.department_id = d2.id
          WHERE a.patient_id = p.id AND a.status NOT IN ('cancelled','completed')
          ORDER BY a.date, a.start_time LIMIT 1
         ) AS next_appointment,
         (SELECT MAX(a.date) FROM appointments a
          WHERE a.patient_id = p.id AND a.status = 'completed'
         ) AS last_visit_date
       FROM patients p
       LEFT JOIN providers pr ON p.primary_provider_id = pr.id
       LEFT JOIN users u ON pr.user_id = u.id
       LEFT JOIN departments d ON pr.department_id = d.id
       WHERE p.clinic_id = $1 AND p.is_active = TRUE
         AND (
           regexp_replace(p.phone, '[^0-9]', '', 'g') = $2 OR
           regexp_replace(p.phone_alt, '[^0-9]', '', 'g') = $2
         )
       LIMIT 3`,
      [user.clinicId, normalized]
    );

    if (patients.length === 0) {
      return apiSuccess({
        found:    false,
        patients: [],
        message:  'Numéro non reconnu — nouveau patient probable',
      });
    }

    return apiSuccess({
      found:    true,
      patients,
      count:    patients.length,
      message:  patients.length === 1
        ? `Patient identifié : ${(patients[0] as Record<string, unknown>).first_name} ${(patients[0] as Record<string, unknown>).last_name}`
        : `${patients.length} patients trouvés pour ce numéro`,
    });
  } catch (err) {
    return apiServerError(err);
  }
});
