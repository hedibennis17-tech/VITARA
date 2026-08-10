'use client';
// ── VITARA AvatarFace v3 — Overlays précis, pas de zoom, pas de rotation ──
import { useEffect, useRef } from 'react';

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

// Positions calibrées manuellement sur les vraies images (% du container circulaire)
// objectPosition 'center 15%' → on voit le top 65% de l'image 1254px
// Houda: yeux ~y=45%, bouche ~y=68%, écart yeux ~±16%
const FACE: Record<string, { ey:number; ex:number; ew:number; eh:number; my:number; mw:number }> = {
  houda: { ey:0.44, ex:0.16, ew:0.09, eh:0.022, my:0.68, mw:0.13 },
  said:  { ey:0.42, ex:0.15, ew:0.09, eh:0.022, my:0.66, mw:0.13 },
  hayet: { ey:0.44, ex:0.16, ew:0.09, eh:0.022, my:0.68, mw:0.13 },
  alain: { ey:0.41, ex:0.15, ew:0.09, eh:0.022, my:0.65, mw:0.13 },
};

export default function AvatarFace({ agentId, imgSrc, imgPos, color, state, audioRef, size=220 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const ampRef    = useRef(0);
  const mouthRef  = useRef(0);   // 0=fermée → 1=ouverte
  const blinkRef  = useRef(1);   // 1=ouvert → 0=fermé
  const nextBlink = useRef(0);

  // Amplitude audio
  useEffect(() => {
    if (state !== 'speaking' || !audioRef?.current) { ampRef.current=0; return; }
    let ctx: AudioContext|null=null, running=true;
    (async()=>{
      try {
        ctx = new (window.AudioContext||(window as any).webkitAudioContext)();
        const s  = ctx.createMediaElementSource(audioRef.current!);
        const an = ctx.createAnalyser(); an.fftSize=128;
        s.connect(an); an.connect(ctx.destination);
        const buf = new Uint8Array(an.frequencyBinCount);
        const tick=()=>{ if(!running)return; an.getByteTimeDomainData(buf); let v=0; for(let i=0;i<buf.length;i++) v+=Math.abs(buf[i]-128); ampRef.current=Math.min(1,(v/buf.length)/18); rafRef.current=requestAnimationFrame(tick); };
        tick();
      } catch {}
    })();
    return ()=>{ running=false; cancelAnimationFrame(rafRef.current); ctx?.close().catch(()=>{}); ampRef.current=0; };
  },[state, audioRef]);

  // Loop d'animation
  useEffect(()=>{
    const cfg = FACE[agentId]||FACE.houda;
    const W=size, H=size;

    const loop=()=>{
      const canvas=canvasRef.current;
      if(!canvas){ rafRef.current=requestAnimationFrame(loop); return; }
      const ctx=canvas.getContext('2d');
      if(!ctx){ rafRef.current=requestAnimationFrame(loop); return; }

      ctx.clearRect(0,0,W,H);
      const now=performance.now();

      // ── Blink ─────────────────────────────────────────────
      if(now > nextBlink.current){
        nextBlink.current = now + 2800 + Math.random()*2200;
        let t=0;
        const b=setInterval(()=>{ t+=16; blinkRef.current = t<70?Math.max(0,1-t/35):Math.min(1,(t-70)/65); if(t>135){blinkRef.current=1;clearInterval(b);} },16);
      }

      // ── Mouth interpolation ───────────────────────────────
      const target = state==='speaking' ? Math.max(0, ampRef.current*1.2 + Math.sin(now/90)*0.06) : 0;
      mouthRef.current += (target-mouthRef.current)*0.28;
      const mOpen = mouthRef.current;

      // ── Clip au cercle ────────────────────────────────────
      ctx.save();
      ctx.beginPath(); ctx.arc(W/2,H/2,W/2-2,0,Math.PI*2); ctx.clip();

      // ── YEUX (blink overlay) ───────────────────────────────
      // N'afficher QUE si les yeux clignotent (overlay brun semi-transparent)
      if(blinkRef.current < 0.85) {
        const bFactor = 1-blinkRef.current;
        const eyeY = H*cfg.ey;
        const eyeW = W*cfg.ew;
        const eyeH = W*cfg.eh * bFactor; // épaisseur du blink
        for(const ex of [W/2-W*cfg.ex, W/2+W*cfg.ex]) {
          ctx.fillStyle=`rgba(60,35,25,${0.7*bFactor})`;
          ctx.beginPath();
          ctx.ellipse(ex, eyeY, eyeW, eyeH, 0, 0, Math.PI*2);
          ctx.fill();
        }
      }

      // ── BOUCHE (lip-sync) ─────────────────────────────────
      if(state==='speaking' && mOpen > 0.015) {
        const mY = H*cfg.my;
        const mW = W*cfg.mw;
        const mH = mOpen * W * 0.042; // hauteur max ~4% du cercle
        const cx2= W/2;

        // Ombre douce
        ctx.shadowColor='rgba(0,0,0,0.6)';
        ctx.shadowBlur=4;

        // Intérieur bouche
        ctx.fillStyle=`rgba(25,8,8,${0.72+mOpen*0.1})`;
        ctx.beginPath();
        ctx.ellipse(cx2, mY, mW, Math.max(1,mH), 0, 0, Math.PI*2);
        ctx.fill();

        // Dents hautes (si assez ouvert)
        if(mH > 2.5) {
          ctx.shadowBlur=0;
          ctx.fillStyle=`rgba(235,220,210,${Math.min(0.75, mOpen*1.5)})`;
          ctx.beginPath();
          ctx.ellipse(cx2, mY-mH*0.2, mW*0.75, mH*0.45, 0, Math.PI, Math.PI*2);
          ctx.fill();
        }

        ctx.shadowBlur=0;
      }

      ctx.restore();

      // ── Waveform sous la photo ─────────────────────────────
      if(state==='speaking'||state==='listening'){
        const bars=20, bW=2.5, gap=2;
        const totalW=bars*(bW+gap), startX=(W-totalW)/2;
        const wY=H-12;
        ctx.globalAlpha=0.65;
        for(let i=0;i<bars;i++){
          const noise=Math.sin(now/130+i*0.6)*0.4+0.6;
          const amp2=state==='speaking'?Math.max(0.15,ampRef.current*noise+0.1):0.15;
          const bH=amp2*14+2;
          ctx.fillStyle=color;
          ctx.beginPath();
          ctx.roundRect(startX+i*(bW+gap), wY-bH/2, bW, bH, 1);
          ctx.fill();
        }
        ctx.globalAlpha=1;
      }

      rafRef.current=requestAnimationFrame(loop);
    };
    rafRef.current=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(rafRef.current);
  },[state, agentId, color, size]);

  // Halo selon état
  const haloC = state==='speaking'?color:state==='listening'?'#00E5A0':state==='thinking'?'#F9A826':`${color}55`;
  const haloA = state==='speaking'?'pulse-halo 0.9s ease-in-out infinite':state==='listening'?'pulse-halo 1.6s ease-in-out infinite':state==='thinking'?'pulse-halo 2.5s ease-in-out infinite':'none';

  return (
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      {/* Anneaux ring (speaking uniquement) */}
      {state==='speaking'&&[1,2].map(i=>(
        <div key={i} style={{position:'absolute',top:-(i*10),left:-(i*10),width:size+(i*20),height:size+(i*20),borderRadius:'50%',border:`1.5px solid ${color}44`,pointerEvents:'none',animation:`ring ${1.8+i*.4}s ease-out infinite`,animationDelay:`${i*.3}s`}}/>
      ))}

      {/* Cercle + photo — JAMAIS de scale ni de transform */}
      <div style={{
        position:'absolute',inset:0,borderRadius:'50%',overflow:'hidden',
        border:`3px solid ${haloC}`,
        boxShadow:`0 0 ${state==='speaking'?20:8}px ${haloC}77`,
        animation:haloA,
        transition:'border-color .4s, box-shadow .3s',
      }}>
        {/* Photo — transform:none absolu */}
        <img src={imgSrc} alt={agentId} style={{
          width:'100%',height:'100%',objectFit:'cover',objectPosition:imgPos,
          display:'block',transform:'none',willChange:'auto',
          filter:state==='speaking'?'brightness(1.03)':'brightness(1)',
          transition:'filter .4s',
        }}/>
        {/* Canvas overlay (yeux+bouche+waveform) */}
        <canvas ref={canvasRef} width={size} height={size} style={{
          position:'absolute',inset:0,pointerEvents:'none',borderRadius:'50%',
        }}/>
      </div>

      {/* Point statut */}
      <div style={{position:'absolute',bottom:6,right:6,width:12,height:12,borderRadius:'50%',
        background:state==='speaking'?color:state==='listening'?'#00E5A0':state==='thinking'?'#F9A826':'#5E7A96',
        border:'2.5px solid #07111F',transition:'background .3s',
        animation:state!=='idle'?'dot-blink .8s ease-in-out infinite':'none'}}/>
    </div>
  );
}
