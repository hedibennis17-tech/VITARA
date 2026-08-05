import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiError, apiServerError } from '@/lib/auth/middleware';
import { queryOne } from '@/lib/db';

// POST /api/voice-ai/message
// Reçoit le message du patient et génère la réponse IA
export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const { callId, message, language = 'fr' } = body;
    if (!callId || !message) return apiError('callId et message requis', 400);

    // Récupérer la conversation
    const conv = await queryOne<{
      id: string; messages: Array<{ role: string; content: string; timestamp: string }>;
      context: Record<string, unknown>;
    }>(
      `SELECT ac.id, ac.messages, ac.context
       FROM ai_conversations ac
       JOIN phone_calls pc ON ac.call_id = pc.id
       WHERE ac.call_id = $1 AND pc.clinic_id = $2`,
      [callId, user.clinicId]
    );
    if (!conv) return apiError('Conversation introuvable', 404);

    // Appel OpenAI GPT-4o
    const systemPrompt = language === 'fr'
      ? buildSystemPromptFr()
      : buildSystemPromptEn();

    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...conv.messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    let aiResponse = '';
    let detectedIntent = 'unknown';

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 300,
          temperature: 0.5,
          messages: openaiMessages,
          response_format: { type: 'json_object' },
        }),
      });

      if (res.ok) {
        const data = await res.json() as {
          choices: Array<{ message: { content: string } }>;
        };
        const parsed = JSON.parse(data.choices[0].message.content) as {
          response: string;
          intent: string;
        };
        aiResponse = parsed.response;
        detectedIntent = parsed.intent ?? 'unknown';
      } else {
        // Fallback si pas d'API key
        aiResponse = getFallbackResponse(message, language);
      }
    } catch {
      aiResponse = getFallbackResponse(message, language);
    }

    // Mettre à jour la conversation
    const newMessages = [
      ...conv.messages,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() },
    ];

    await queryOne(
      `UPDATE ai_conversations SET messages = $1, intent = $2, updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(newMessages), detectedIntent, conv.id]
    );

    // Mettre à jour l'intent de l'appel
    await queryOne(
      `UPDATE phone_calls SET ai_intent = $1, status = 'active', answered_at = COALESCE(answered_at, NOW())
       WHERE id = $2`,
      [detectedIntent, callId]
    );

    return apiSuccess({
      response: aiResponse,
      intent:   detectedIntent,
      callId,
    });
  } catch (err) {
    return apiServerError(err);
  }
});

function buildSystemPromptFr(): string {
  return `Tu es VITARA, une assistante virtuelle professionnelle pour une clinique médicale à Montréal.
Tu réponds TOUJOURS en JSON avec le format: {"response": "...", "intent": "..."}.
Les intents possibles: book_appointment, cancel_appointment, reschedule_appointment, new_patient, 
exam_results, billing, general_info, transfer_to_human, emergency, teleconsult, unknown.
Pour les urgences (douleur thoracique, difficulté respiratoire, AVC), retourne immédiatement intent="emergency".
Sois professionnelle, chaleureuse et concise. Maximum 2-3 phrases par réponse.`;
}

function buildSystemPromptEn(): string {
  return `You are VITARA, a professional virtual assistant for a medical clinic in Montreal.
Always respond in JSON: {"response": "...", "intent": "..."}.
Intents: book_appointment, cancel_appointment, reschedule_appointment, new_patient,
exam_results, billing, general_info, transfer_to_human, emergency, teleconsult, unknown.
For emergencies (chest pain, breathing difficulty, stroke), immediately return intent="emergency".
Be professional, warm and concise. Maximum 2-3 sentences per response.`;
}

function getFallbackResponse(message: string, lang: string): string {
  const lower = message.toLowerCase();
  if (lang === 'fr') {
    if (lower.includes('rendez-vous') || lower.includes('rdv')) return 'Je peux vous aider à prendre un rendez-vous. Avec quel professionnel souhaitez-vous consulter ?';
    if (lower.includes('annul')) return 'Je vais vous aider à annuler votre rendez-vous. Pouvez-vous me donner votre nom complet ?';
    if (lower.includes('résultat')) return 'Pour vos résultats, je vais vous transférer à notre équipe médicale.';
    return 'Je suis à votre écoute. En quoi puis-je vous aider aujourd\'hui ?';
  }
  if (lower.includes('appointment')) return 'I can help you schedule an appointment. Which specialist would you like to see?';
  if (lower.includes('cancel')) return 'I\'ll help you cancel your appointment. Can you provide your full name?';
  return 'How can I help you today?';
}
