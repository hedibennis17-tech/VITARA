import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiCreated, apiError, apiServerError } from '@/lib/auth/middleware';
import { queryOne } from '@/lib/db';
import { NotificationSchema, parseBody } from '@/lib/validators';
import { v4 as uuidv4 } from 'uuid';

// POST /api/notifications/sms
export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const parsed = parseBody(NotificationSchema.omit({ channel: true }), body);
    if (!parsed.success) return apiError(parsed.error, 422);
    const d = parsed.data;

    // Enregistrer la notification
    const notif = await queryOne(
      `INSERT INTO notifications (
         id, clinic_id, patient_id, appointment_id, channel,
         recipient, template, body, scheduled_at, status
       ) VALUES ($1,$2,$3,$4,'sms',$5,$6,$7,$8,'pending')
       RETURNING *`,
      [uuidv4(), user.clinicId, d.patientId, d.appointmentId ?? null, d.recipient, d.template ?? null, d.body, d.scheduledAt ?? null]
    );

    // Envoyer via Twilio (si configuré)
    let externalId: string | null = null;
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + Buffer.from(
                `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
              ).toString('base64'),
            },
            body: new URLSearchParams({
              From: process.env.TWILIO_FROM_NUMBER ?? '',
              To:   d.recipient,
              Body: d.body,
            }),
          }
        );
        if (twilioRes.ok) {
          const twilioData = await twilioRes.json() as { sid: string };
          externalId = twilioData.sid;
        }
      } catch { /* Twilio non configuré */ }
    }

    // Marquer comme envoyé
    if (externalId) {
      await queryOne(
        `UPDATE notifications SET status = 'sent', sent_at = NOW(), external_id = $1 WHERE id = $2`,
        [externalId, (notif as Record<string, unknown>).id]
      );
    }

    return apiCreated({ notification: notif, sent: !!externalId, externalId });
  } catch (err) {
    return apiServerError(err);
  }
}, { roles: ['receptionist', 'supervisor', 'admin'] });
