'use client';
// ── VITARA AvatarFace — Lip sync + Eye + Head animation ──────
// Canvas overlay sur la photo réelle. Pas de rotation de l'image.
import { useEffect, useRef, useCallback } from 'react';

export type AgentState = 'idle'|'listening'|'thinking'|'speaking';

interface Props {
  agentId:   string;
  imgSrc:    string;
  imgPos:    string;
  color:     string;
  state:     AgentState;
  audioRef?: React.RefObject<HTMLAudioElement|null>;
  size?:     number;
}

// Positions des features selon l'agent (% du cercle rogné)
const FACE_CONFIG: Record<string, { mouthY:number; eyeY:number; eyeSpread:number }> = {
  houda: { mouthY:0.72, eyeY:0.38, eyeSpread:0.14 },
  said:  { mouthY:0.68, eyeY:0.36, eyeSpread:0.13 },
  hayet: { mouthY:0.70, eyeY:0.37, eyeSpread:0.14 },
  alain: { mouthY:0.67, eyeY:0.35, eyeSpread:0.13 },
};

export default function AvatarFace({ agentId, imgSrc, imgPos, color, state, audioRef, size=220 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const ampRef    = useRef(0);
  const blinkRef  = useRef(1);   // 1=open, 0=closed
  const blinkTimerRef = useRef(0);
  const headTiltRef   = useRef(0);
  const mouthRef  = useRef(0);   // 0=closed, 1=open

  const cfg = FACE_CONFIG[agentId] || FACE_CONFIG.houda;

  // ── Amplitude depuis l'audio (lip-sync) ─────────────────────
  useEffect(() => {
    if (state !== 'speaking' || !audioRef?.current) { ampRef.current=0; return; }
    let ctx: AudioContext|null=null, running=true;
    const init = async () => {
      try {
        ctx = new (window.AudioContext||(window as any).webkitAudioContext)();
        const src = ctx.createMediaElementSource(audioRef.current!);
        const an  = ctx.createAnalyser(); an.fftSize=128;
        src.connect(an); an.connect(ctx.destination);
        const buf = new Uint8Array(an.frequencyBinCount);
        const tick = () => {
          if(!running) return;
          an.getByteTimeDomainData(buf);
          let s=0; for(let i=0;i<buf.length;i++) s+=Math.abs(buf[i]-128);
          ampRef.current = Math.min(1,(s/buf.length)/20);
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {}
    };
    init();
    return ()=>{ running=false; cancelAnimationFrame(rafRef.current); ctx?.close().catch(()=>{}); ampRef.current=0; };
  },[state, audioRef]);

  // ── Boucle d'animation Canvas ────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);

    const amp = ampRef.current;
    const now  = performance.now();

    // ── Blink naturel ─────────────────────────────────────────
    if (now > blinkTimerRef.current) {
      blinkTimerRef.current = now + 2500 + Math.random()*2000;
      // Animation blink rapide (150ms)
      let t=0;
      const blinkAnim = setInterval(()=>{
        t+=16;
        blinkRef.current = t<80 ? Math.max(0,1-t/40) : Math.min(1,(t-80)/70);
        if(t>150){ blinkRef.current=1; clearInterval(blinkAnim); }
      },16);
    }

    // ── Head tilt subtil ─────────────────────────────────────
    const targetTilt = state==='thinking' ? Math.sin(now/2000)*0.03
                     : state==='speaking' ? Math.sin(now/1200)*0.015+Math.cos(now/800)*0.01
                     : Math.sin(now/3000)*0.008;
    headTiltRef.current += (targetTilt - headTiltRef.current)*0.05;

    // ── Mouth amplitude target ────────────────────────────────
    const targetMouth = state==='speaking'
      ? Math.max(0, amp*1.4 + Math.sin(now/80)*0.08)
      : 0;
    mouthRef.current += (targetMouth - mouthRef.current)*0.3;

    // ── Centre visage ─────────────────────────────────────────
    const cx = W/2, cy = H/2;
    const r  = W/2 - 2;

    // ── Appliquer head tilt (canvas transform) ────────────────
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(headTiltRef.current);
    ctx.translate(-cx, -cy);

    // ── YEUX ─────────────────────────────────────────────────
    const eyeY = H*cfg.eyeY;
    const eyeX = W*cfg.eyeSpread;
    const eyeW = W*0.065;
    const eyeH = W*0.028 * blinkRef.current;

    for(const ex of [cx-eyeX, cx+eyeX]) {
      if(state==='idle'||state==='speaking'||state==='listening') {
        // Micro-saccade des yeux
        const sx = state==='thinking' ? Math.sin(now/400)*3 : Math.sin(now/600)*1;
        const sy = Math.sin(now/700)*0.5;
        ctx.save();
        ctx.translate(ex+sx, eyeY+sy);
        ctx.scale(1, blinkRef.current);
        // Overlay blanc semi-transparent (simuler l'éclat)
        ctx.beginPath();
        ctx.ellipse(0, 0, eyeW, eyeH, 0, 0, Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,0.12)';
        ctx.fill();
        ctx.restore();
      }
    }

    // ── BOUCHE (lip-sync) ─────────────────────────────────────
    if(state==='speaking' && mouthRef.current > 0.02) {
      const mouthY = H*cfg.mouthY;
      const mouthW = W*0.14 + mouthRef.current*W*0.08;
      const mouthH = mouthRef.current * W*0.055;
      const mouthR = W*0.012;

      ctx.save();
      ctx.translate(cx, mouthY);

      // Ombre douce autour de la bouche
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur  = 8;

      // Intérieur bouche (sombre)
      ctx.beginPath();
      ctx.ellipse(0, 0, mouthW*0.5, Math.max(2, mouthH*0.8), 0, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(30,10,10,0.75)';
      ctx.fill();

      // Dents (si bouche assez ouverte)
      if(mouthH > W*0.012) {
        ctx.beginPath();
        ctx.ellipse(0, -mouthH*0.15, mouthW*0.38, mouthH*0.35, 0, Math.PI, Math.PI*2);
        ctx.fillStyle='rgba(240,230,220,0.7)';
        ctx.fill();
      }

      // Contour lèvres
      ctx.shadowBlur=0;
      ctx.beginPath();
      ctx.ellipse(0, 0, mouthW*0.5, Math.max(2, mouthH*0.8), 0, 0, Math.PI*2);
      ctx.strokeStyle='rgba(180,100,100,0.5)';
      ctx.lineWidth=1.5;
      ctx.stroke();

      ctx.restore();
    } else if(state!=='speaking') {
      // Bouche au repos — légère ligne naturelle
      const mouthY = H*cfg.mouthY;
      const mouthW = W*0.10;
      ctx.beginPath();
      ctx.moveTo(cx-mouthW*0.5, mouthY);
      ctx.quadraticCurveTo(cx, mouthY+(state==='listening'?2:0), cx+mouthW*0.5, mouthY);
      ctx.strokeStyle='rgba(150,80,80,0.25)';
      ctx.lineWidth=1.2;
      ctx.stroke();
    }

    ctx.restore(); // head tilt

    // ── Halo / Waveform selon l'état ─────────────────────────
    if(state==='speaking'||state==='listening') {
      const waveAmp = state==='speaking' ? 0.3+amp*0.5 : 0.2;
      const bars=24, barW=2, gap=1;
      const waveW=(bars*(barW+gap));
      ctx.save();
      ctx.globalAlpha=0.7;
      for(let i=0;i<bars;i++){
        const h=state==='speaking'
          ? (waveAmp+Math.sin(now/120+i*0.5)*0.15)*12
          : (0.12+Math.sin(now/200+i*0.4)*0.08)*8;
        const x=cx-waveW/2+i*(barW+gap);
        const y=H-16;
        ctx.fillStyle=color;
        ctx.beginPath();
        ctx.roundRect(x,y-h/2,barW,h,1);
        ctx.fill();
      }
      ctx.restore();
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [state, color, cfg]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // ── Couleur halo ──────────────────────────────────────────
  const haloColor = state==='speaking'?color:state==='listening'?'#00E5A0':state==='thinking'?'#F9A826':color+'66';
  const haloAnim  = state==='speaking'?'pulse-halo 0.8s ease-in-out infinite'
                  : state==='listening'?'pulse-halo 1.5s ease-in-out infinite'
                  : state==='thinking'?'pulse-halo 2.5s ease-in-out infinite'
                  : 'none';

  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>

      {/* Anneaux only when speaking */}
      {state==='speaking'&&[1,2].map(i=>(
        <div key={i} style={{
          position:'absolute', top:-(i*10), left:-(i*10),
          width:size+(i*20), height:size+(i*20), borderRadius:'50%',
          border:`1.5px solid ${color}44`, pointerEvents:'none',
          animation:`ring ${1.8+i*.4}s ease-out infinite`,
          animationDelay:`${i*.3}s`,
        }}/>
      ))}

      {/* Cercle avec clip et photo — NE TOURNE JAMAIS */}
      <div style={{
        position:'absolute', inset:0,
        borderRadius:'50%', overflow:'hidden',
        border:`3px solid ${haloColor}`,
        boxShadow:`0 0 ${state==='speaking'?22:10}px ${haloColor}66`,
        animation: haloAnim,
        transition:'border-color .4s, box-shadow .3s',
      }}>
        {/* Photo fixe — jamais de transform */}
        <img
          src={imgSrc}
          alt={agentId}
          style={{
            width:'100%', height:'100%',
            objectFit:'cover', objectPosition:imgPos,
            display:'block',
          }}
        />
        {/* Canvas overlay pour lip-sync + yeux + tête */}
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{
            position:'absolute', inset:0,
            borderRadius:'50%',
            mixBlendMode:'screen',
          }}
        />
      </div>

      {/* Point statut */}
      <div style={{
        position:'absolute', bottom:6, right:6,
        width:13, height:13, borderRadius:'50%',
        background:haloColor.replace('66',''),
        border:'2.5px solid #07111F',
        animation:state!=='idle'?'dot-blink .7s ease-in-out infinite':'none',
        transition:'background .3s',
      }}/>
    </div>
  );
}
