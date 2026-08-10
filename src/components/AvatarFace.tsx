'use client';
import { useEffect, useRef } from 'react';
export type AgentState = 'idle'|'listening'|'thinking'|'speaking';
interface Props { agentId:string; imgSrc:string; imgPos:string; color:string; state:AgentState; audioRef?:React.RefObject<HTMLAudioElement|null>; size?:number; }

export default function AvatarFace({agentId,imgSrc,imgPos,color,state,audioRef,size=220}:Props) {
  const ampRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(()=>{
    if(state!=='speaking'||!audioRef?.current){ampRef.current=0;return;}
    let ctx:AudioContext|null=null,running=true;
    (async()=>{
      try{
        ctx=new(window.AudioContext||(window as any).webkitAudioContext)();
        const s=ctx.createMediaElementSource(audioRef.current!);
        const an=ctx.createAnalyser();an.fftSize=128;s.connect(an);an.connect(ctx.destination);
        const buf=new Uint8Array(an.frequencyBinCount);
        const t=()=>{if(!running)return;an.getByteTimeDomainData(buf);let v=0;for(const b of buf)v+=Math.abs(b-128);ampRef.current=Math.min(1,(v/buf.length)/16);requestAnimationFrame(t);};t();
      }catch{}
    })();
    return()=>{running=false;ctx?.close().catch(()=>{});ampRef.current=0;};
  },[state,audioRef]);

  const haloC = state==='speaking'?color:state==='listening'?'#00E5A0':state==='thinking'?'#F9A826':`${color}55`;
  const glow  = state==='speaking'?24:state==='listening'?14:state==='thinking'?10:6;
  const scale = state==='speaking'?1.08:state==='listening'?1.02:1;

  return(
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      {state==='speaking'&&[1,2].map(i=>(
        <div key={i} style={{position:'absolute',top:-(i*10),left:-(i*10),width:size+(i*20),height:size+(i*20),borderRadius:'50%',border:`1.5px solid ${color}44`,pointerEvents:'none',animation:`ring ${1.8+i*.4}s ease-out infinite`,animationDelay:`${i*.3}s`}}/>
      ))}
      <div style={{
        position:'absolute',inset:0,borderRadius:'50%',overflow:'hidden',
        border:`3px solid ${haloC}`,
        boxShadow:`0 0 ${glow}px ${haloC}99, 0 0 ${glow*2}px ${haloC}44`,
        transition:'border-color .4s, box-shadow .3s',
        transform:`scale(${scale})`,
        transition:'transform .3s ease, border-color .4s, box-shadow .3s',
      }}>
        <img src={imgSrc} alt={agentId} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:imgPos,display:'block'}}/>
      </div>
      <div style={{position:'absolute',bottom:6,right:6,width:12,height:12,borderRadius:'50%',background:state==='speaking'?color:state==='listening'?'#00E5A0':state==='thinking'?'#F9A826':'#5E7A96',border:'2.5px solid #07111F',transition:'background .3s',animation:state!=='idle'?'dot-blink .8s ease-in-out infinite':'none'}}/>
    </div>
  );
}
