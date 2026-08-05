import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiError, apiServerError } from '@/lib/auth/middleware';
import { queryOne } from '@/lib/db';

export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const { callId, durationSec } = body;
    if (!callId) return apiError('callId requis', 400);

    // Récupérer la conversation pour générer un résumé
    const conv = await queryOne<{
      messages: Array<{ role: string; content: string }>;
    }>(
      `SELECT ac.messages FROM ai_conversations ac
       JOIN phone_calls pc ON ac.call_id = pc.id
       WHERE ac.call_id = $1 AND pc.clinic_id = $2`,
      [callId, user.clinicId]
    );

    let summary = 'Appel traité par l\'IA VITARA.';

    if (conv && conv.messages.length > 2) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            max_tokens: 150,
            messages: [
              {
                role: 'system',
                content: 'Génère un résumé professionnel de 2-3 phrases de cet appel médical. Inclus: motif de l\'appel, action réalisée, résultat.',
              },
              {
                role: 'user',
                content: `Transcription:\n${conv.messages.map(m => `${m.role}: ${m.content}`).join('\n')}`,
              },
            ],
          }),
        });
        if (res.ok) {
          const data = await res.json() as {
            choices: Array<{ message: { content: string } }>;
          };
          summary = data.choices[0].message.content;
        }
      } catch {
        // Résumé fallback
      }
    }

    // Mettre à jour l'appel
    const call = await queryOne(
      `UPDATE phone_calls SET
         status = 'completed', ended_at = NOW(),
         duration_sec = $3, ai_summary = $4
       WHERE id = $1 AND clinic_id = $2
       RETURNING id, status, duration_sec, ai_intent, ai_summary`,
      [callId, user.clinicId, durationSec ?? null, summary]
    );

    return apiSuccess({ call, summary });
  } catch (err) {
    return apiServerError(err);
  }
});
