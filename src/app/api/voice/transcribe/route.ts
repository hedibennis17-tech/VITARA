// Endpoint Groq Whisper — transcription audio serveur-side
// Fallback quand Web Speech API non disponible ou bloquée
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY manquante', code: 'NO_API_KEY' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const audio  = formData.get('audio') as File | null;
    const lang   = (formData.get('lang') as string) || 'fr';

    if (!audio) {
      return NextResponse.json({ error: 'Fichier audio manquant' }, { status: 400 });
    }

    const groqForm = new FormData();
    groqForm.append('file', audio, 'audio.webm');
    groqForm.append('model', 'whisper-large-v3');
    groqForm.append('language', lang === 'fr' ? 'fr' : lang === 'ar' ? 'ar' : 'en');
    groqForm.append('response_format', 'json');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: groqForm,
    });

    const data = await res.json() as { text?: string; error?: { message?: string } };

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || `Whisper error ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json({ text: data.text || '', lang });
  } catch (err) {
    console.error('[Whisper]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/voice/transcribe',
    method: 'POST',
    accepts: 'multipart/form-data: audio (File, audio/webm), lang (fr|en|ar)',
    model: 'whisper-large-v3',
    fallback: 'Utiliser quand Web Speech API non disponible',
  });
}
