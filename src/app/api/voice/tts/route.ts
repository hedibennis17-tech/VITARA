// ── ElevenLabs TTS — vraies voix humaines par agent ──────────
import { NextRequest, NextResponse } from 'next/server';

// Voice IDs ElevenLabs — UN voice_id UNIQUE par agent
// Modèle: eleven_multilingual_v2 (FR/EN/AR natif)
const VOICES: Record<string, { id:string; name:string; desc:string }> = {
  houda: { id:'21m00Tcm4TlvDq8ikWAM', name:'Rachel',  desc:'Féminine, chaleureuse' },
  hayet: { id:'AZnzlk1XvdvUeBnXmlld', name:'Domi',    desc:'Féminine, vive' },
  said:  { id:'pNInz6obpgDQGcFmaJgB', name:'Adam',    desc:'Masculine, professionnel' },
  alain: { id:'VR6AewLTigWG4xSOukaG', name:'Arnold',  desc:'Masculine, mature/grave' },
};

// Paramètres vocaux par agent (stability + similarity)
const VOICE_PARAMS: Record<string, { stability:number; similarity:number; style?:number }> = {
  houda: { stability:0.55, similarity:0.80 },
  hayet: { stability:0.50, similarity:0.75 },
  said:  { stability:0.65, similarity:0.80, style:0.10 },
  alain: { stability:0.75, similarity:0.85, style:0.05 },
};

export const maxDuration = 20;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  // Sans clé → 501 Not Implemented (fallback côté client)
  if (!apiKey) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY manquante — ajoutez-la sur Vercel', code: 'NO_KEY' }, { status: 501 });
  }

  try {
    const { text, agent = 'houda' } = await req.json() as { text: string; agent: string };
    if (!text?.trim()) return NextResponse.json({ error: 'text vide' }, { status: 400 });

    const voice  = VOICES[agent]       || VOICES.houda;
    const params = VOICE_PARAMS[agent] || VOICE_PARAMS.houda;

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`,
      {
        method: 'POST',
        headers: {
          'Accept':         'audio/mpeg',
          'xi-api-key':     apiKey,
          'Content-Type':   'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability:        params.stability,
            similarity_boost: params.similarity,
            style:            params.style ?? 0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('[ElevenLabs]', res.status, err.slice(0,200));
      return NextResponse.json({ error: `ElevenLabs ${res.status}` }, { status: res.status });
    }

    const audio = await res.arrayBuffer();
    return new NextResponse(audio, {
      headers: {
        'Content-Type':  'audio/mpeg',
        'Cache-Control': 'no-cache',
        'X-Voice-Name':  voice.name,
        'X-Agent':       agent,
      },
    });

  } catch (err) {
    console.error('[TTS]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    engine: 'ElevenLabs eleven_multilingual_v2',
    voices: Object.entries(VOICES).map(([agent,v]) => ({
      agent, voiceId: v.id, name: v.name, desc: v.desc
    })),
    setup: 'Ajouter ELEVENLABS_API_KEY sur Vercel → Settings → Environment Variables',
    free_tier: '10 000 caractères/mois',
    signup: 'https://elevenlabs.io',
  });
}
