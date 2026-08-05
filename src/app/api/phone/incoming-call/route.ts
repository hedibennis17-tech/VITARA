import { NextRequest } from 'next/server';
import { withAuth, apiCreated, apiServerError } from '@/lib/auth/middleware';
import { query, queryOne } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// POST /api/phone/incoming-call
// Déclenché par Twilio webhook ou test interne
export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const {
      callerPhone,
      language = 'fr',
      priority = 'normal',
      externalCallId,
    } = body;

    // Rechercher le patient par téléphone
    const patient = await queryOne<{ id: string; first_name: string; last_name: string }>(
      `SELECT id, first_name, last_name FROM patients
       WHERE clinic_id = $1 AND phone = $2 AND is_active = TRUE LIMIT 1`,
      [user.clinicId, callerPhone]
    );

    // Créer l'enregistrement de l'appel
    const call = await queryOne(
      `INSERT INTO phone_calls (
         id, clinic_id, patient_id, caller_phone, direction, status,
         language, priority, handled_by_ai, external_call_id, queued_at
       ) VALUES ($1,$2,$3,$4,'inbound','queued',$5,$6,TRUE,$7,NOW())
       RETURNING *`,
      [
        uuidv4(), user.clinicId,
        patient?.id ?? null,
        callerPhone, language, priority,
        externalCallId ?? null,
      ]
    );

    // Créer la conversation IA initiale
    await queryOne(
      `INSERT INTO ai_conversations (id, call_id, messages, context)
       VALUES ($1, $2, $3, $4)`,
      [
        uuidv4(),
        (call as Record<string, unknown>).id,
        JSON.stringify([{
          role: 'assistant',
          content: language === 'fr'
            ? 'Bonjour et bienvenue à la Clinique. Je suis votre assistante virtuelle. En quoi puis-je vous aider aujourd\'hui ?'
            : 'Hello and welcome to the Clinic. I am your virtual assistant. How can I help you today?',
          timestamp: new Date().toISOString(),
        }]),
        JSON.stringify({ patientId: patient?.id ?? null, clinicId: user.clinicId }),
      ]
    );

    return apiCreated({
      call,
      patient: patient ?? null,
      message: patient
        ? `Patient identifié : ${patient.first_name} ${patient.last_name}`
        : 'Patient inconnu — identification en cours',
    });
  } catch (err) {
    return apiServerError(err);
  }
});
