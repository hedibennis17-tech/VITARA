'use client';
// ── AvatarFace v4 — ZERO zoom, effets canvas visibles ────────
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

// Positions calibrées: Y=% vertical depuis le haut du circle, X=% depuis centre
const FACE: Record<string,{ey:number;ex:number;my:number;mw:number;mh:number}> = {
  houda: {ey:0.43, ex:0.155, my:0.67, mw:0.145, mh:0.05},
  said:  {ey:0.41, ex:0.14,  my:0.65, mw:0.14,  mh:0.05},
  hayet: {ey:0.43, ex:0.155, my:0.67, mw:0.145, mh:0.05},
  alain: {ey:0.40, ex:0.14,  my:0.64, mw:0.14,  mh:0.05},
};

export default function AvatarFace({agentId,imgSrc,imgPos,color,state,audioRef,size=220}:Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ampRef    = useRef(0);
  const mRef      = useRef(0);   // mouth open 0-1
  const blinkRef  = useRef(1);   // 1=open
  const nextBlink = useRef(0);
  const rafRef    = useRef(0);

  // Audio amplitude
  useEffect(()=>{
    if(state!=='speaking'||!audioRef?.current){ampRef.current=0;return;}
    let ctx:AudioContext|null=null,running=true;
    (async()=>{
      try{
        ctx=new(window.AudioContext||(window as any).webkitAudioContext)();
        const s=ctx.createMediaElementSource(audioRef.current!);
        const an=ctx.createAnalyser();an.fftSize=128;
        s.connect(an);an.connect(ctx.destination);
        const buf=new Uint8Array(an.frequencyBinCount);
        const t=()=>{if(!running)return;an.getByteTimeDomainData(buf);let v=0;for(let i=0;i<buf.length;i++)v+=Math.abs(buf[i]-128);ampRef.current=Math.min(1,(v/buf.length)/16);requestAnimationFrame(t);};t();
      }catch{}
    })();
    return()=>{running=false;ctx?.close().catch(()=>{});ampRef.current=0;};
  },[state,audioRef]);

  // Canvas animation loop
  useEffect(()=>{
    const cfg=FACE[agentId]||FACE.houda;
    const W=size,H=size,cx=W/2,cy=H/2;

    const draw=()=>{
      const canvas=canvasRef.current;
      if(!canvas){rafRef.current=requestAnimationFrame(draw);return;}
      const ctx=canvas.getContext('2d');
      if(!ctx){rafRef.current=requestAnimationFrame(draw);return;}
      ctx.clearRect(0,0,W,H);
      const now=performance.now();

      // ── Blink ────────────────────────────────────────────
      if(now>nextBlink.current){
        nextBlink.current=now+3000+Math.random()*2000;
        let t=0;const iv=setInterval(()=>{t+=16;blinkRef.current=t<65?Math.max(0,1-t/32):Math.min(1,(t-65)/55);if(t>120){blinkRef.current=1;clearInterval(iv);}},16);
      }

      // ── Mouth target ─────────────────────────────────────
      const target=state==='speaking'?Math.max(0,ampRef.current+Math.sin(now/85)*0.07):0;
      mRef.current+=(target-mRef.current)*0.32;
      const mo=mRef.current;

      // Clip au cercle
      ctx.save();
      ctx.beginPath();ctx.arc(cx,cy,cx-2,0,Math.PI*2);ctx.clip();

      // ── YEUX — blink bar (marron semi-transparent sur les paupières) ──
      if(blinkRef.current<0.9){
        const bf=1-blinkRef.current;
        const ey=H*cfg.ey;
        const ew=W*0.075;  // demi-largeur œil
        const eh=W*0.018*bf; // hauteur paupière
        for(const ex of [cx-W*cfg.ex, cx+W*cfg.ex]){
          ctx.fillStyle=`rgba(50,28,18,${0.85*bf})`;
          ctx.beginPath();
          ctx.ellipse(ex,ey,ew,Math.max(0.5,eh),0,0,Math.PI*2);
          ctx.fill();
        }
      }

      // ── BOUCHE — seulement en speaking ───────────────────
      if(state==='speaking'&&mo>0.01){
        const my=H*cfg.my;
        const mw=W*cfg.mw;
        const mh=mo*W*cfg.mh;

        ctx.shadowColor='rgba(0,0,0,0.7)';ctx.shadowBlur=6;

        // Cavité
        ctx.fillStyle=`rgba(20,5,5,${0.78})`;
        ctx.beginPath();
        ctx.ellipse(cx,my,mw,Math.max(1.5,mh),0,0,Math.PI*2);
        ctx.fill();

        // Dents hautes
        if(mh>3){
          ctx.shadowBlur=0;
          ctx.fillStyle=`rgba(240,225,215,${Math.min(0.82,mo*2)})`;
          ctx.beginPath();
          ctx.ellipse(cx,my-mh*0.22,mw*0.72,mh*0.48,0,Math.PI,Math.PI*2);
          ctx.fill();
        }

        // Lèvres
        ctx.shadowBlur=0;
        ctx.strokeStyle=`rgba(170,90,90,0.55)`;
        ctx.lineWidth=1.8;
        ctx.beginPath();
        ctx.ellipse(cx,my,mw,Math.max(1.5,mh),0,0,Math.PI*2);
        ctx.stroke();
      }

      ctx.restore();

      // ── Waveform (bas de l'avatar, hors clip) ────────────
      if(state==='speaking'||state==='listening'){
        const bars=22,bW=2.2,gap=1.8,totalW=bars*(bW+gap),sx=(W-totalW)/2;
        const baseY=H-10;
        ctx.globalAlpha=0.7;
        for(let i=0;i<bars;i++){
          const noise=Math.sin(now/140+i*0.55)*0.35+0.65;
          const amp2=state==='speaking'?Math.max(0.12,ampRef.current*noise+0.08):0.12+Math.sin(now/250+i*0.4)*0.06;
          const bH=Math.max(2,amp2*16);
          ctx.fillStyle=color;
          ctx.beginPath();
          ctx.roundRect(sx+i*(bW+gap),baseY-bH/2,bW,bH,1);
          ctx.fill();
        }
        ctx.globalAlpha=1;
      }

      rafRef.current=requestAnimationFrame(draw);
    };
    rafRef.current=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(rafRef.current);
  },[state,agentId,color,size]);

  // Halo: SEULEMENT opacity et box-shadow — JAMAIS scale/transform
  const haloC=state==='speaking'?color:state==='listening'?'#00E5A0':state==='thinking'?'#F9A826':`${color}55`;
  const glow=state==='speaking'?22:state==='listening'?14:state==='thinking'?10:6;

  return(
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      {/* Anneaux ring (speaking only) — position:absolute, NE touchent PAS le container photo */}
      {state==='speaking'&&[1,2].map(i=>(
        <div key={i} style={{position:'absolute',top:-(i*10),left:-(i*10),width:size+(i*20),height:size+(i*20),borderRadius:'50%',border:`1.5px solid ${color}44`,pointerEvents:'none',animation:`ring ${1.8+i*.4}s ease-out infinite`,animationDelay:`${i*.3}s`}}/>
      ))}

      {/* Container photo — AUCUN transform, AUCUN scale, AUCUNE animation qui scale */}
      <div style={{
        position:'absolute',inset:0,borderRadius:'50%',overflow:'hidden',
        border:`3px solid ${haloC}`,
        // Seul box-shadow anime — pas de transform
        boxShadow:`0 0 ${glow}px ${haloC}88, 0 0 ${glow*2}px ${haloC}33`,
        transition:'border-color .4s ease, box-shadow .3s ease',
      }}>
        {/* Photo — transform:none STRICT */}
        <img src={imgSrc} alt={agentId} style={{
          width:'100%',height:'100%',objectFit:'cover',objectPosition:imgPos,
          display:'block', transform:'none',
          filter:state==='speaking'?'brightness(1.04)':'brightness(1)',
          transition:'filter .5s',
        }}/>
        {/* Canvas overlay */}
        <canvas ref={canvasRef} width={size} height={size} style={{
          position:'absolute',inset:0,pointerEvents:'none',
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
