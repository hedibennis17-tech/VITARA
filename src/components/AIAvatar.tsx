'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error' | 'offline';

interface Agent { id:string; name:string; color:string; img:string; gender:'male'|'female' }
interface T { bg:string; s1:string; border:string; teal:string; text:string; muted:string }

interface Props {
  agent:    Agent;
  state:    AvatarState;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  T:        T;
  size?:    number;
}

// Labels par état
const STATE_LABELS: Record<AvatarState, string> = {
  idle:      '● En ligne',
  listening: '🎤 Je vous écoute...',
  thinking:  '⏳ Analyse en cours...',
  speaking:  '🔊 Répond...',
  error:     '⚠️ Erreur',
  offline:   '○ Hors ligne',
};

export default function AIAvatar({ agent, state, audioRef, T, size=220 }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef      = useRef<number>(0);
  const [amplitude, setAmplitude] = useState(0);
  const [blink, setBlink]         = useState(false);

  // Blink naturel toutes les 3-5 secondes
  useEffect(() => {
    const blink = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    };
    const interval = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Analyser l'audio pour l'amplitude (lip-sync)
  useEffect(() => {
    if (state !== 'speaking' || !audioRef.current) { setAmplitude(0); return; }
    try {
      const ctx     = new AudioContext();
      const source  = ctx.createMediaElementSource(audioRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += Math.abs(data[i] - 128);
        setAmplitude(Math.min(1, (sum / data.length) / 30));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(rafRef.current);
        ctx.close().catch(()=>{});
        setAmplitude(0);
      };
    } catch { setAmplitude(0); }
  }, [state, audioRef]);

  // Waveform canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state !== 'speaking' && state !== 'listening') return;

    const bars   = 32;
    const w      = canvas.width / bars;
    const color  = agent.color;
    ctx.fillStyle = color + '99';
    for (let i = 0; i < bars; i++) {
      const noise  = (Math.sin(Date.now() / 200 + i * 0.5) + 1) / 2;
      const h      = state === 'speaking'
        ? (0.15 + amplitude * 0.7 + noise * 0.15) * canvas.height
        : (0.1 + noise * 0.2) * canvas.height;
      ctx.fillRect(i * w + 1, (canvas.height - h) / 2, w - 2, h);
    }
  }, [amplitude, state, agent.color]);

  // Waveform animation loop
  useEffect(() => {
    if (state !== 'speaking' && state !== 'listening') return;
    let running = true;
    const loop = () => {
      if (!running) return;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const bars = 32;
          const w    = canvas.width / bars;
          ctx.fillStyle = agent.color + '99';
          for (let i = 0; i < bars; i++) {
            const noise = (Math.sin(Date.now() / 200 + i * 0.5) + 1) / 2;
            const h = state === 'speaking'
              ? (0.15 + amplitude * 0.7 + noise * 0.15) * canvas.height
              : (0.1 + noise * 0.2) * canvas.height;
            ctx.fillRect(i * w + 1, (canvas.height - h) / 2, w - 2, h);
          }
        }
      }
      requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; };
  }, [state, amplitude, agent.color]);

  // Couleurs halo par état
  const haloColor = state === 'speaking'  ? agent.color
                  : state === 'listening' ? '#00E5A0'
                  : state === 'thinking'  ? '#F9A826'
                  : state === 'error'     ? '#EF4444'
                  : state === 'offline'   ? '#5E7A96'
                  : T.border;

  const haloOpacity = state === 'offline' ? 0.2
                    : state === 'idle'    ? 0.3
                    : 0.8;

  // Pulse animation selon l'état
  const avatarScale = state === 'speaking'
    ? `scale(${1 + amplitude * 0.03})`
    : 'scale(1)';

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>

      {/* Halo + photo */}
      <div style={{ position:'relative', width:size, height:size }}>

        {/* Halo externe pulsant */}
        <div style={{
          position:'absolute', inset:-8,
          borderRadius:'50%',
          border:`3px solid ${haloColor}`,
          opacity: haloOpacity,
          animation: state==='speaking' ? 'pulse-ring 1s ease-in-out infinite'
                   : state==='listening'? 'pulse-ring 1.5s ease-in-out infinite'
                   : state==='thinking' ? 'pulse-ring 2s ease-in-out infinite'
                   : 'none',
          boxShadow:`0 0 ${state==='speaking'?24:12}px ${haloColor}${state==='speaking'?'88':'44'}`,
          transition:'all .3s ease',
        }}/>

        {/* Halo interne */}
        <div style={{
          position:'absolute', inset:-3,
          borderRadius:'50%',
          background:`radial-gradient(circle, ${haloColor}15 0%, transparent 70%)`,
          opacity: state==='offline' ? 0 : 1,
          transition:'all .3s ease',
        }}/>

        {/* Photo de l'agent */}
        <div style={{
          width:size, height:size,
          borderRadius:'50%',
          overflow:'hidden',
          border:`3px solid ${haloColor}`,
          transform: avatarScale,
          transition:'transform .1s ease, border-color .3s ease',
          boxShadow:`0 8px 32px ${haloColor}44`,
          position:'relative',
        }}>
          <img
            src={agent.img}
            alt={agent.name}
            style={{
              width:'100%', height:'100%',
              objectFit:'cover',
              objectPosition:'center top',
              filter: state==='offline' ? 'grayscale(0.8)' : 'none',
              transform: state==='idle' ? 'translateY(0)' : 'translateY(0)',
              transition:'filter .5s, transform .1s',
            }}
          />

          {/* Overlay œil clignotant */}
          {blink && (
            <div style={{
              position:'absolute', inset:0,
              background:'rgba(0,0,0,0.05)',
              borderRadius:'50%',
            }}/>
          )}

          {/* Overlay speaking — simulation bouche */}
          {state === 'speaking' && amplitude > 0.05 && (
            <div style={{
              position:'absolute',
              bottom:'18%',
              left:'50%',
              transform:'translateX(-50%)',
              width:`${12 + amplitude * 20}px`,
              height:`${4 + amplitude * 10}px`,
              borderRadius:'0 0 50% 50%',
              background:'rgba(0,0,0,0.15)',
              transition:'all .05s ease',
            }}/>
          )}

          {/* Badge état offline */}
          {state === 'offline' && (
            <div style={{
              position:'absolute', inset:0,
              background:'rgba(0,0,0,0.5)',
              borderRadius:'50%',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:32, color:'#5E7A96',
            }}>○</div>
          )}
        </div>

        {/* Indicateur état (coin bas-droit) */}
        <div style={{
          position:'absolute', bottom:4, right:4,
          width:14, height:14,
          borderRadius:'50%',
          background: state==='offline'?'#5E7A96'
                    : state==='error'  ?'#EF4444'
                    : state==='thinking'?'#F9A826'
                    : '#00E5A0',
          border:`2px solid ${T.bg}`,
          boxShadow:`0 0 6px ${haloColor}88`,
          animation: state==='speaking'||state==='listening' ? 'dot-pulse .8s ease-in-out infinite' : 'none',
        }}/>
      </div>

      {/* Nom + état */}
      <div style={{ textAlign:'center' }}>
        <div style={{
          fontFamily:"'Space Grotesk',sans-serif",
          fontWeight:700, fontSize:15, color:T.text,
        }}>{agent.name}</div>
        <div style={{
          fontSize:11, color:agent.color, marginTop:2, fontWeight:600,
          minHeight:16,
          animation: state==='speaking'||state==='listening' ? 'none' : 'none',
        }}>
          {STATE_LABELS[state]}
        </div>
      </div>

      {/* Waveform */}
      <canvas
        ref={canvasRef}
        width={size}
        height={32}
        style={{
          borderRadius:8,
          opacity: state==='speaking'||state==='listening' ? 1 : 0,
          transition:'opacity .3s ease',
        }}
      />

      {/* CSS keyframes */}
      <style>{`
        @keyframes pulse-ring {
          0%   { transform:scale(1);    opacity:${haloOpacity}; }
          50%  { transform:scale(1.05); opacity:${haloOpacity*0.6}; }
          100% { transform:scale(1);    opacity:${haloOpacity}; }
        }
        @keyframes dot-pulse {
          0%,100% { transform:scale(1); }
          50%     { transform:scale(1.4); }
        }
      `}</style>
    </div>
  );
}
