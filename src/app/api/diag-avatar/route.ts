import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';

export async function GET() {
  const r: Record<string, any> = { ts: new Date().toISOString() };

  // 1. Vérifier les fichiers images des agents
  const agents = ['houda', 'said', 'hayet', 'alain'];
  r.agent_images = {};
  for (const a of agents) {
    const ext = a === 'hayet' ? 'jpg' : 'png';
    const path = `/home/claude/VITARA/public/agents/${a}.${ext}`;
    const webPath = `/agents/${a}.${ext}`;
    try {
      const exists = existsSync(path);
      const size = exists ? readFileSync(path).length : 0;
      r.agent_images[a] = {
        path: webPath,
        exists: exists ? '✅' : '❌',
        size_kb: Math.round(size / 1024),
        ok: exists && size > 10000 ? '✅ Photo OK' : '❌ Manquante ou trop petite',
      };
    } catch (e: any) {
      r.agent_images[a] = { error: e.message };
    }
  }

  // 2. Vérifier le build Vercel (version deployée)
  const DB = process.env.DATABASE_URL;
  r.env_check = {
    DATABASE_URL:        DB ? '✅' : '❌',
    GROQ_API_KEY:        process.env.GROQ_API_KEY       ? '✅' : '❌',
    ELEVENLABS_API_KEY:  process.env.ELEVENLABS_API_KEY  ? '✅' : '❌',
    JWT_SECRET:          process.env.JWT_SECRET           ? '✅' : '❌',
    NODE_ENV:            process.env.NODE_ENV,
  };

  // 3. Tester ElevenLabs (voix de Houda)
  const elKey = process.env.ELEVENLABS_API_KEY;
  if (elKey) {
    try {
      const res = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': elKey },
      });
      const d = await res.json() as any;
      r.elevenlabs = {
        status: res.status,
        ok: res.ok ? '✅ API connectée' : '❌ Erreur',
        voices_count: d.voices?.length || 0,
        houda_voice: {
          id:   '21m00Tcm4TlvDq8ikWAM',
          name: 'Rachel (Houda)',
          check: '✅ ID configuré'
        },
        said_voice: {
          id:   'pNInz6obpgDQGcFmaJgB',
          name: 'Adam (Said)',
          check: '✅ ID configuré'
        },
      };
    } catch (e: any) {
      r.elevenlabs = { error: e.message };
    }
  } else {
    r.elevenlabs = '❌ ELEVENLABS_API_KEY manquante';
  }

  // 4. Tester le TTS (générer 1 seconde de son pour Houda)
  if (elKey) {
    try {
      const t = Date.now();
      const res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
        method: 'POST',
        headers: { 'xi-api-key': elKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Test vocal.',
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });
      r.tts_test = {
        status:     res.status,
        ok:         res.ok ? '✅ TTS fonctionnel' : '❌ Erreur TTS',
        latency_ms: Date.now() - t,
        content_type: res.headers.get('content-type'),
        audio_size_kb: res.ok ? Math.round(parseInt(res.headers.get('content-length')||'0') / 1024) : 0,
      };
    } catch (e: any) {
      r.tts_test = { error: e.message };
    }
  }

  // 5. Tester Groq (workflow chat)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const t = Date.now();
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: 30,
          messages: [{ role: 'user', content: 'dis juste: OK' }],
        }),
      });
      const d = await res.json() as any;
      r.groq_test = {
        status: res.status,
        ok: res.ok ? '✅ Groq fonctionnel' : '❌ Erreur',
        latency_ms: Date.now() - t,
        response: d.choices?.[0]?.message?.content?.slice(0, 30) || d.error?.message?.slice(0, 50),
      };
    } catch (e: any) {
      r.groq_test = { error: e.message };
    }
  }

  // 6. Dernier commit déployé
  try {
    const pkg = JSON.parse(readFileSync('/home/claude/VITARA/package.json', 'utf8'));
    r.app = { name: pkg.name, version: pkg.version };
  } catch {}

  // RÉSUMÉ
  const issues: string[] = [];
  for (const [agent, info] of Object.entries(r.agent_images) as any) {
    if (!info.ok?.startsWith('✅')) issues.push(`❌ Photo ${agent}: manquante`);
  }
  if (!elKey)        issues.push('❌ ElevenLabs key manquante → pas de voix');
  if (!groqKey)      issues.push('❌ Groq key manquante → pas de chat');
  if (r.tts_test?.ok?.startsWith('❌')) issues.push('❌ TTS ne répond pas');
  if (r.groq_test?.ok?.startsWith('❌')) issues.push('❌ Groq ne répond pas');

  r.DIAGNOSTIC = issues.length === 0
    ? '✅ TOUT OK — Si l\'avatar ne s\'affiche pas: vider cache navigateur (Ctrl+Shift+R)'
    : issues;

  return NextResponse.json(r);
}
