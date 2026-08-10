'use client';
import { useState, useEffect } from 'react';

const AGENTS = [
  { id:'houda', color:'#00D7C8', img:'/agents/houda.png', pos:'center 15%' },
  { id:'said',  color:'#8B5CF6', img:'/agents/said.png',  pos:'center 18%' },
  { id:'hayet', color:'#EC4899', img:'/agents/hayet.jpg', pos:'center 20%' },
  { id:'alain', color:'#16A34A', img:'/agents/alain.png', pos:'center 18%' },
];
type S = 'idle'|'listening'|'thinking'|'speaking';

export default function DiagVisual() {
  const [vState, setVState] = useState<S>('idle');
  const [agent,  setAgent]  = useState(AGENTS[0]);
  const [log,    setLog]    = useState<string[]>([]);
  const [imgOk,  setImgOk]  = useState<Record<string,boolean|null>>({});
  const [cssOk,  setCssOk]  = useState<boolean|null>(null);

  const add = (m: string) => setLog(p=>[`${new Date().toLocaleTimeString()} ${m}`,...p.slice(0,30)]);

  useEffect(()=>{
    AGENTS.forEach(a=>{
      const img = new Image();
      img.onload  = ()=>{ setImgOk(p=>({...p,[a.id]:true}));  add(`✅ ${a.id}: ${img.naturalWidth}×${img.naturalHeight}px chargée`); };
      img.onerror = ()=>{ setImgOk(p=>({...p,[a.id]:false})); add(`❌ ${a.id}: ERREUR chargement`); };
      img.src = a.img+'?t='+Date.now();
    });
    setTimeout(()=>{
      const el = document.createElement('div');
      el.style.animation = 'pulse-halo 1s infinite';
      document.body.appendChild(el);
      const anim = window.getComputedStyle(el).animationName;
      const ok = anim === 'pulse-halo';
      setCssOk(ok);
      add(ok?'✅ CSS keyframe pulse-halo OK':'❌ CSS keyframe pulse-halo MANQUANT');
      document.body.removeChild(el);
    }, 800);
  },[]);

  const SIZE = 180;
  const halo = vState==='speaking'?agent.color:vState==='listening'?'#00E5A0':vState==='thinking'?'#F9A826':agent.color;
  const anim = vState==='speaking'?'pulse-halo 0.8s ease-in-out infinite':vState==='listening'?'pulse-halo 1.4s ease-in-out infinite':vState==='thinking'?'pulse-halo 2s ease-in-out infinite':'none';

  return (
    <div style={{minHeight:'100vh',background:'#07111F',color:'#E8F0FA',fontFamily:'monospace',padding:20,maxWidth:480,margin:'0 auto'}}>
      <h1 style={{color:'#00D7C8',fontSize:16,marginBottom:12}}>🔬 Diagnostic Avatar</h1>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:16,fontSize:11}}>
        {AGENTS.map(a=>(
          <div key={a.id} style={{padding:'6px 8px',background:'#0D1B2E',borderRadius:6,border:`1px solid ${imgOk[a.id]===true?'#00E5A0':imgOk[a.id]===false?'#EF4444':'#1E3350'}`,color:imgOk[a.id]===true?'#00E5A0':imgOk[a.id]===false?'#EF4444':'#5E7A96'}}>
            {imgOk[a.id]===undefined?'⏳':imgOk[a.id]?'✅':'❌'} {a.id}
          </div>
        ))}
        <div style={{padding:'6px 8px',background:'#0D1B2E',borderRadius:6,border:`1px solid ${cssOk===null?'#1E3350':cssOk?'#00E5A0':'#EF4444'}`,color:cssOk===null?'#5E7A96':cssOk?'#00E5A0':'#EF4444'}}>
          {cssOk===null?'⏳':cssOk?'✅':'❌'} CSS anim
        </div>
      </div>

      <div style={{display:'flex',gap:16,alignItems:'flex-start',marginBottom:16}}>
        {/* Avatar */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,flexShrink:0}}>
          <div style={{position:'relative',width:SIZE,height:SIZE}}>
            {vState==='speaking'&&[1,2].map(i=>(
              <div key={i} style={{position:'absolute',top:-(i*12),left:-(i*12),width:SIZE+(i*24),height:SIZE+(i*24),borderRadius:'50%',border:`1.5px solid ${agent.color}`,opacity:.5,animation:`ring ${1.8+i*.35}s ease-out infinite`,animationDelay:`${i*.3}s`,pointerEvents:'none'}}/>
            ))}
            <div style={{position:'absolute',inset:-8,borderRadius:'50%',border:`2.5px solid ${halo}`,opacity:vState==='idle'?.3:.9,animation:anim,boxShadow:`0 0 20px ${halo}66`,pointerEvents:'none'}}/>
            {/* Bordure tournante séparée */}
            <div style={{position:'absolute',inset:0,borderRadius:'50%',background:`conic-gradient(${halo} 0%,${halo}22 45%,${halo} 100%)`,animation:vState==='speaking'?'spin 3s linear infinite':'none',pointerEvents:'none'}}/>
            {/* Photo fixe */}
            <div style={{position:'absolute',inset:3,borderRadius:'50%',overflow:'hidden',background:'#07111F'}}>
              <img src={agent.img} alt={agent.id} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:agent.pos}}
                onLoad={()=>add(`✅ ${agent.id} DOM visible`)}
                onError={()=>add(`❌ ${agent.id} ERREUR DOM`)}
              />
            </div>
            <div style={{position:'absolute',bottom:6,right:6,width:14,height:14,borderRadius:'50%',background:halo,border:'2.5px solid #07111F',animation:vState!=='idle'?'dot-blink .7s ease-in-out infinite':'none'}}/>
          </div>
          <div style={{fontSize:11,color:halo,fontWeight:700}}>{agent.id} [{vState}]</div>
        </div>

        {/* Contrôles */}
        <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:11}}>
          {(['idle','listening','thinking','speaking'] as S[]).map(s=>(
            <button key={s} onClick={()=>{setVState(s);add(`→ ${s}`);}}
              style={{padding:'7px 12px',background:vState===s?`${agent.color}22`:'transparent',border:`1px solid ${vState===s?agent.color:'#1E3350'}`,borderRadius:7,color:vState===s?agent.color:'#5E7A96',cursor:'pointer',fontFamily:'monospace',fontSize:11}}>
              {s==='idle'?'⚪':s==='listening'?'🟢':s==='thinking'?'🟠':'🔵'} {s}
            </button>
          ))}
          <div style={{borderTop:'1px solid #1E3350',marginTop:4,paddingTop:4}}/>
          {AGENTS.map(a=>(
            <button key={a.id} onClick={()=>{setAgent(a);add(`→ agent: ${a.id}`);}}
              style={{padding:'5px 10px',background:agent.id===a.id?`${a.color}22`:'transparent',border:`1px solid ${agent.id===a.id?a.color:'#1E3350'}`,borderRadius:7,color:agent.id===a.id?a.color:'#5E7A96',cursor:'pointer',fontFamily:'monospace',fontSize:11}}>
              {a.id}
            </button>
          ))}
        </div>
      </div>

      {/* Log */}
      <div style={{background:'#0D1B2E',borderRadius:8,padding:10,maxHeight:250,overflowY:'auto',border:'1px solid #1E3350',fontSize:11}}>
        {log.length===0?<span style={{color:'#5E7A96'}}>En attente...</span>:log.map((l,i)=>(
          <div key={i} style={{color:l.includes('✅')?'#00E5A0':l.includes('❌')?'#EF4444':'#E8F0FA',marginBottom:2}}>{l}</div>
        ))}
      </div>

      <style>{`
        @keyframes pulse-halo{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.08);opacity:.4}}
        @keyframes dot-blink{0%,100%{transform:scale(1)}50%{transform:scale(1.6)}}
        @keyframes avatar-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.015)}}
        @keyframes ring{0%{transform:scale(.92);opacity:.6}100%{transform:scale(1.65);opacity:0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        button{font-family:monospace}
      `}</style>
    </div>
  );
}
