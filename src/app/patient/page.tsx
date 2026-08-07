'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// ─── DESIGN TOKENS ───────────────────────────────────────────
const DARK = { bg:'#07111F', s1:'#0D1B2E', s2:'#112138', border:'#1E3350',
  teal:'#00D7C8', purple:'#8B5CF6', mint:'#00E5A0', pink:'#EC4899',
  green:'#16A34A', text:'#E8F0FA', muted:'#5E7A96', urgent:'#EF4444',
  cardBg:'rgba(13,27,46,0.82)', glass:'rgba(255,255,255,0.06)' };
const LIGHT = { bg:'#EEF2F7', s1:'#FFFFFF', s2:'#F8FAFC', border:'#CBD5E1',
  teal:'#0891B2', purple:'#7C3AED', mint:'#059669', pink:'#DB2777',
  green:'#16A34A', text:'#0F1B2D', muted:'#64748B', urgent:'#DC2626',
  cardBg:'rgba(255,255,255,0.90)', glass:'rgba(255,255,255,0.7)' };

const AGENTS = [
  { id:'houda', name:'Houda', lang:'FR · AR', color:'#00D7C8', role:'Assistante médicale',   langs:['fr','ar'],    badge:'🩺' },
  { id:'said',  name:'Said',  lang:'FR · EN · AR', color:'#8B5CF6', role:'Médecine générale',  langs:['fr','en','ar'], badge:'👨‍⚕️' },
  { id:'hayet', name:'Hayet', lang:'FR · EN', color:'#EC4899', role:'Pédiatrie & Famille',  langs:['fr','en'],    badge:'👶' },
  { id:'alain', name:'Alain', lang:'FR · EN', color:'#16A34A', role:'Médecine institutionnelle', langs:['fr','en'], badge:'🏥' },
];

const QUICK_FR = [
  { icon:'📅', title:'Prendre rendez-vous', sub:'Réserver en ligne',   msg:'Je voudrais prendre un rendez-vous' },
  { icon:'🕐', title:'Mes rendez-vous',     sub:'Voir mes RDV',        msg:'Je veux voir mes rendez-vous' },
  { icon:'🩺', title:'Services médicaux',   sub:'Nos spécialités',    msg:'Quels services proposez-vous?' },
  { icon:'📞', title:'Appeler la clinique', sub:'Parler à un agent',   msg:'Je voudrais parler à un agent' },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
@keyframes ecg{0%{stroke-dashoffset:600}100%{stroke-dashoffset:0}}
@keyframes wave{0%,100%{height:20%}50%{height:90%}}
@keyframes blink{0%,88%,100%{transform:scaleY(1)}93%{transform:scaleY(0.06)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:.1;transform:scale(1.18)}}
@keyframes ring{0%{transform:scale(.9);opacity:.7}100%{transform:scale(1.7);opacity:0}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes dot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
@keyframes shimmer{0%{opacity:.4}50%{opacity:.9}100%{opacity:.4}}`;

// ─── SVG AVATAR PORTRAITS ────────────────────────────────────
function MedAvatar({ id, size=220, state='idle', color='#00D7C8' }: any) {
  const cfg: any = {
    houda: { skin:'#C8956C', hijab:'#9B7EC8', hijab2:'#7C5BB5', coat:'#2563EB', coatL:'#3B82F6', lips:'#C07070', f:'hijab' },
    said:  { skin:'#A07050', hair:'#1C0F05', coat:'#1E3A8A', coatL:'#2563EB', beard:'#2D1A08', lips:'#8B5050', f:'male' },
    hayet: { skin:'#D4A574', hair:'#5C3317', hair2:'#7A4929', coat:'#6D28D9', coatL:'#7C3AED', lips:'#C06080', f:'female' },
    alain: { skin:'#C4A882', hair:'#9CA3AF', hair2:'#6B7280', coat:'#1F2937', coatL:'#374151', lips:'#8B6050', f:'male-old' },
  };
  const c = cfg[id] || cfg.houda;
  const talking = state === 'speaking';
  const listening = state === 'listening';

  return (
    <svg width={size} height={size*1.25} viewBox="0 0 200 250" style={{filter:`drop-shadow(0 8px 32px ${color}30)`}}>
      <defs>
        <radialGradient id={`bg-${id}`} cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor={color} stopOpacity=".18"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
        <radialGradient id={`skin-${id}`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor={c.skin} stopOpacity=".95"/>
          <stop offset="100%" stopColor={c.skin} stopOpacity=".85"/>
        </radialGradient>
      </defs>
      {/* Glow bg */}
      <ellipse cx="100" cy="135" rx="92" ry="110" fill={`url(#bg-${id})`}/>
      {/* Body/coat */}
      <path d="M20 250 Q20 185 50 175 Q75 168 100 170 Q125 168 150 175 Q180 185 180 250Z" fill={c.coat}/>
      {/* Coat lapels */}
      <path d="M85 175 L100 215 L115 175 Q100 168 85 175Z" fill="white" opacity=".9"/>
      {/* Coat lighter shade */}
      <path d="M50 180 Q35 200 30 250 L100 250 L170 250 Q165 200 150 180 Q125 172 100 174 Q75 172 50 180Z" fill={c.coatL} opacity=".3"/>
      {/* Stethoscope */}
      <circle cx="86" cy="198" r="5.5" fill="none" stroke="#CBD5E1" strokeWidth="2"/>
      <path d="M86 203.5 Q86 218 100 222 Q114 226 114 198" fill="none" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round"/>
      {/* Name badge */}
      <rect x="58" y="190" width="36" height="14" rx="2" fill="white" opacity=".15"/>
      {/* Neck */}
      <ellipse cx="100" cy="165" rx="17" ry="20" fill={`url(#skin-${id})`}/>
      {/* Head */}
      <ellipse cx="100" cy="100" rx="54" ry="62" fill={`url(#skin-${id})`}/>

      {/* HAIR / HIJAB */}
      {c.f==='hijab' && <>
        <ellipse cx="100" cy="86" rx="58" ry="66" fill={c.hijab}/>
        <ellipse cx="100" cy="112" rx="42" ry="50" fill={`url(#skin-${id})`}/>
        <path d="M58 125 Q32 180 52 248 L100 248 L148 248 Q168 180 142 125Z" fill={c.hijab}/>
        <path d="M60 122 Q38 170 55 245" fill="none" stroke={c.hijab2} strokeWidth="2" opacity=".4"/>
        <ellipse cx="100" cy="56" rx="35" ry="18" fill={c.hijab2} opacity=".5"/>
      </>}
      {c.f==='female' && <>
        <ellipse cx="100" cy="58" rx="57" ry="38" fill={c.hair}/>
        {[55,68,82,96,112,127,140].map((x,i)=>(
          <ellipse key={i} cx={x} cy="54" rx="9" ry="12" fill={c.hair2} opacity=".9"/>
        ))}
        <ellipse cx="48" cy="95" rx="15" ry="28" fill={c.hair} opacity=".9"/>
        <ellipse cx="152" cy="95" rx="15" ry="28" fill={c.hair} opacity=".9"/>
      </>}
      {c.f==='male' && <>
        <ellipse cx="100" cy="56" rx="56" ry="33" fill={c.hair}/>
        <rect x="44" y="60" width="14" height="48" rx="7" fill={c.hair} opacity=".95"/>
        <rect x="142" y="60" width="14" height="48" rx="7" fill={c.hair} opacity=".95"/>
        <ellipse cx="100" cy="152" rx="30" ry="9" fill={c.beard} opacity=".55"/>
        <ellipse cx="100" cy="144" rx="22" ry="6" fill={c.beard} opacity=".4"/>
      </>}
      {c.f==='male-old' && <>
        <ellipse cx="100" cy="58" rx="55" ry="32" fill={c.hair}/>
        <rect x="44" y="62" width="13" height="48" rx="6" fill={c.hair}/>
        <rect x="143" y="62" width="13" height="48" rx="6" fill={c.hair}/>
        {/* Glasses */}
        <ellipse cx="82" cy="108" rx="14" ry="11" fill="none" stroke="#94A3B8" strokeWidth="2"/>
        <ellipse cx="118" cy="108" rx="14" ry="11" fill="none" stroke="#94A3B8" strokeWidth="2"/>
        <line x1="96" y1="108" x2="104" y2="108" stroke="#94A3B8" strokeWidth="2"/>
        <line x1="44" y1="106" x2="68" y2="107" stroke="#94A3B8" strokeWidth="2"/>
        <line x1="132" y1="107" x2="156" y2="106" stroke="#94A3B8" strokeWidth="2"/>
      </>}

      {/* Eyebrows */}
      <path d={`M${c.f==='hijab'?76:74} ${c.f==='male-old'?97:90} Q${c.f==='hijab'?86:84} ${c.f==='male-old'?93:86} ${c.f==='hijab'?94:94} ${c.f==='male-old'?97:90}`} stroke="#4A3020" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      <path d={`M${c.f==='hijab'?106:106} ${c.f==='male-old'?97:90} Q${c.f==='hijab'?116:116} ${c.f==='male-old'?93:86} ${c.f==='hijab'?124:126} ${c.f==='male-old'?97:90}`} stroke="#4A3020" strokeWidth="2.2" fill="none" strokeLinecap="round"/>

      {/* Eyes white */}
      <ellipse cx={c.f==='hijab'?85:83} cy={c.f==='male-old'?108:106} rx="10" ry="8" fill="white"/>
      <ellipse cx={c.f==='hijab'?115:117} cy={c.f==='male-old'?108:106} rx="10" ry="8" fill="white"/>
      {/* Iris */}
      <ellipse cx={c.f==='hijab'?85:83} cy={c.f==='male-old'?108:106} rx="5.5" ry="6" fill="#2D4A8A" style={{animation:'blink 4.5s ease-in-out infinite'}}/>
      <ellipse cx={c.f==='hijab'?115:117} cy={c.f==='male-old'?108:106} rx="5.5" ry="6" fill="#2D4A8A" style={{animation:'blink 4.5s ease-in-out infinite',animationDelay:'.15s'}}/>
      {/* Pupil */}
      <circle cx={c.f==='hijab'?85:83} cy={c.f==='male-old'?108:106} r="3" fill="#0F1A2A"/>
      <circle cx={c.f==='hijab'?115:117} cy={c.f==='male-old'?108:106} r="3" fill="#0F1A2A"/>
      {/* Shine */}
      <circle cx={c.f==='hijab'?87:85} cy={c.f==='male-old'?105:103} r="2" fill="white"/>
      <circle cx={c.f==='hijab'?117:119} cy={c.f==='male-old'?105:103} r="2" fill="white"/>

      {/* Nose */}
      <path d="M97 120 Q94 129 100 132 Q106 129 103 120" fill={c.skin} stroke={c.skin} strokeWidth="1" opacity=".6"/>

      {/* Mouth */}
      {talking
        ? <><ellipse cx="100" cy="144" rx="13" ry="8" fill="#6B2020"/><ellipse cx="100" cy="144" rx="10" ry="5" fill="#8B3030"/></>
        : <path d="M88 141 Q100 149 112 141" stroke={c.lips} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      }
      {/* Cheek blush */}
      <ellipse cx={c.f==='hijab'?72:70} cy="128" rx="12" ry="7" fill="#FF6B6B" opacity=".12"/>
      <ellipse cx={c.f==='hijab'?128:130} cy="128" rx="12" ry="7" fill="#FF6B6B" opacity=".12"/>
    </svg>
  );
}

// ─── WAVEFORM BARS ───────────────────────────────────────────
function WaveformBars({ active=false, color='#00D7C8', bars=18 }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:2.5,height:28}}>
      {Array.from({length:bars}).map((_,i)=>(
        <div key={i} style={{
          width:3, minHeight:'12%', borderRadius:2,
          background:`linear-gradient(to top,${color},${color}80)`,
          animation: active ? `wave ${.2+(i%5)*.07}s ease-in-out infinite alternate` : 'none',
          height: active ? undefined : `${15+(i%4)*8}%`,
          animationDelay:`${i*.04}s`, opacity: active ? 1 : .35,
        }}/>
      ))}
    </div>
  );
}

// ─── ECG LINE SVG ────────────────────────────────────────────
function ECGLine({ color='#00D7C8', opacity=.18 }) {
  return (
    <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none" style={{position:'absolute',bottom:0,left:0,opacity}}>
      <path d="M0 35 L60 35 L75 35 L85 5 L95 55 L105 35 L120 35 L135 35 L145 15 L155 50 L165 35 L200 35 L215 35 L225 8 L235 52 L245 35 L260 35 L280 35 L295 18 L305 48 L315 35 L340 35 L355 35 L365 12 L375 52 L385 35 L400 35"
        fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="600" strokeDashoffset="0"
        style={{animation:'ecg 3s linear infinite'}}/>
    </svg>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function PatientPage() {
  const [screen, setScreen] = useState<'home'|'agents'|'chat'|'done'>('home');
  const [theme, setTheme] = useState<'dark'|'light'>('dark');
  const [agent, setAgent] = useState(AGENTS[0]);
  const [lang, setLang] = useState('fr');
  const [voiceState, setVoiceState] = useState<'idle'|'listening'|'thinking'|'speaking'>('idle');
  const [msgs, setMsgs] = useState<{role:string;text:string}[]>([]);
  const [hist, setHist] = useState<{role:string;content:string}[]>([]);
  const [inp, setInp] = useState('');
  const [slots, setSlots] = useState<any[]|null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [sel, setSel] = useState<string|null>(null);
  const [load, setLoad] = useState(false);
  const [agentIdx, setAgentIdx] = useState(0);
  const [vocal, setVocal] = useState(false);
  const [listen, setListen] = useState(false);
  const [vErr, setVErr] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const synth = useRef(typeof window!=='undefined'?window.speechSynthesis:null);
  const T = theme === 'dark' ? DARK : LIGHT;

  useEffect(()=>{ const s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s);return()=>s.remove(); },[]);
  useEffect(()=>{ chatRef.current?.scrollTo({top:chatRef.current.scrollHeight,behavior:'smooth'}); },[msgs,slots,load]);

  const speak = useCallback((t:string)=>{
    if(!synth.current)return; synth.current.cancel();
    const u=new SpeechSynthesisUtterance(t);
    u.lang=lang==='fr'?'fr-FR':lang==='ar'?'ar-SA':'en-US'; u.rate=.92; u.pitch=1.05;
    const vs=synth.current.getVoices();
    const p=vs.find((v:any)=>lang==='fr'?v.lang.startsWith('fr'):lang==='ar'?v.lang.startsWith('ar'):v.lang.startsWith('en'));
    if(p)u.voice=p;
    u.onstart=()=>setVoiceState('speaking'); u.onend=()=>setVoiceState('idle'); u.onerror=()=>setVoiceState('idle');
    synth.current.speak(u);
  },[lang]);

  const startListen = useCallback(()=>{
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!SR){setVErr('Microphone non supporté');return;}
    if(recRef.current)recRef.current.abort();
    const r=new SR(); r.lang=lang==='fr'?'fr-FR':lang==='ar'?'ar-SA':'en-US'; r.continuous=false; r.interimResults=false;
    r.onstart=()=>{setListen(true);setVoiceState('listening');setVErr('');};
    r.onend=()=>{setListen(false);};
    r.onerror=()=>{setListen(false);setVoiceState('idle');setVErr('Micro non détecté');};
    r.onresult=(e:any)=>{const t=e.results[0][0].transcript;setListen(false);if(t.trim())sendMsg(t);};
    recRef.current=r; r.start();
  },[lang]);

  const stopListen = useCallback(()=>{ recRef.current?.stop(); setListen(false); setVoiceState('idle'); },[]);

  const sendMsg = useCallback(async(txt:string)=>{
    if(!txt.trim()||load)return;
    synth.current?.cancel(); setSlots(null); setSel(null);
    const um={role:'user',content:txt};
    const nh=[...hist,um];
    setHist(nh); setMsgs(p=>[...p,{role:'patient',text:txt}]); setInp(''); setLoad(true); setVoiceState('thinking');
    try{
      const res=await fetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({messages:nh,language:lang,max_tokens:800})});
      if(!res.ok){
        const err=await res.json() as any;
        const m=err.code==='NO_API_KEY'?'⚠️ Clé GROQ manquante sur Vercel':err.error||`Erreur ${res.status}`;
        setMsgs(p=>[...p,{role:'ai',text:m}]); setVoiceState('idle'); return;
      }
      const data=await res.json();
      const raw=(data.content?.[0]?.text||'{}').replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
      let parsed:any; try{parsed=JSON.parse(raw);}catch{parsed={speak:raw,intent:'info'};}
      const aiTxt=parsed.speak||(lang==='ar'?'أنا هنا لمساعدتك.':lang==='en'?"I'm here to help.":'Je suis là pour vous aider.');
      setHist(p=>[...p,{role:'assistant',content:aiTxt}]);
      setMsgs(p=>[...p,{role:'ai',text:aiTxt}]);
      if(parsed.slots)setSlots(parsed.slots);
      if(parsed.booking){setBooking(parsed.booking);setTimeout(()=>setScreen('done'),900);}
      setVoiceState(parsed.intent==='emergency'?'idle':'speaking'); speak(aiTxt);
    }catch(e:any){ setMsgs(p=>[...p,{role:'ai',text:'⚠️ '+e.message}]); setVoiceState('idle'); }
    finally{setLoad(false);}
  },[hist,lang,load,speak]);

  const confirmSlot = useCallback(()=>{
    if(!sel||!slots)return;
    const s=slots.find(x=>x.id===sel); if(!s)return; setSlots(null);
    sendMsg(lang==='fr'?`Je confirme le créneau: ${s.label} avec ${s.provider}.`:`I confirm: ${s.label} with ${s.provider}.`);
  },[sel,slots,lang,sendMsg]);

  const startChat = useCallback((a:typeof AGENTS[0], l:string='fr')=>{
    setAgent(a); setLang(l); setScreen('chat');
    const greet={fr:`Bonjour ! Je suis ${a.name}, votre assistante médicale IA. Êtes-vous un nouveau patient ou avez-vous déjà un dossier chez nous ?`,
      en:`Hello! I'm ${a.name}, your AI medical assistant. Are you a new or existing patient?`,
      ar:`مرحباً! أنا ${a.name}، مساعدتك الطبية الذكية. هل أنت مريض جديد؟`}[l]||'';
    setMsgs([{role:'ai',text:greet}]); setHist([{role:'assistant',content:greet}]);
    setTimeout(()=>{setVoiceState('speaking');speak(greet);},500);
  },[speak]);

  const resetAll = useCallback(()=>{
    synth.current?.cancel(); setScreen('home'); setMsgs([]); setHist([]);
    setBooking(null); setSlots(null); setSel(null); setVoiceState('idle');
  },[]);

  const bg = (alpha=1) => theme==='dark' ? `rgba(7,17,31,${alpha})` : `rgba(238,242,247,${alpha})`;

  // ── SCREEN: HOME ───────────────────────────────────────────
  if(screen==='home') return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:"'Inter',sans-serif",color:T.text,display:'flex',flexDirection:'column',maxWidth:420,margin:'0 auto',position:'relative',overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'16px 20px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,background:`linear-gradient(135deg,${T.teal},${T.purple})`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>✚</div>
          <div>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15,letterSpacing:'-.01em',background:`linear-gradient(135deg,${T.teal},${T.purple})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>VITARA</div>
            <div style={{fontSize:8,color:T.muted,letterSpacing:'.12em',textTransform:'uppercase'}}>CLINIQUE SANTÉ MONTRÉAL</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} style={{padding:'5px 10px',background:T.glass,border:`1px solid ${T.border}`,borderRadius:20,fontSize:10,color:T.text,cursor:'pointer',backdropFilter:'blur(8px)'}}>
            {theme==='dark'?'☀️ Clair':'🌙 Sombre'}
          </button>
          <div style={{width:34,height:34,background:T.glass,border:`1px solid ${T.border}`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)',cursor:'pointer',position:'relative'}}>
            🔔<div style={{position:'absolute',top:6,right:6,width:7,height:7,background:T.teal,borderRadius:'50%'}}/>
          </div>
        </div>
      </div>

      {/* Avatar hero section */}
      <div style={{position:'relative',flex:'0 0 auto',display:'flex',flexDirection:'column',alignItems:'center',padding:'0 20px 0',minHeight:300}}>
        {/* Greeting */}
        <div style={{alignSelf:'flex-start',marginBottom:12,animation:'fadeUp .5s ease'}}>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:26,fontWeight:700,color:T.teal,lineHeight:1}}>Bonjour,</div>
          <div style={{fontSize:15,color:T.text,fontWeight:400,marginTop:3,opacity:.85}}>Comment puis-je vous aider aujourd'hui ?</div>
        </div>

        {/* Avatar with ECG */}
        <div style={{position:'relative',width:'100%',display:'flex',justifyContent:'center'}}>
          {/* Glow behind avatar */}
          <div style={{position:'absolute',top:'10%',width:200,height:200,borderRadius:'50%',background:`radial-gradient(circle,${agent.color}22 0%,transparent 70%)`,zIndex:0}}/>
          {/* ECG decoration */}
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:60,zIndex:1}}>
            <ECGLine color={agent.color} opacity={.22}/>
          </div>
          <div style={{position:'relative',zIndex:2,animation:'float 4s ease-in-out infinite'}}>
            <MedAvatar id={agent.id} size={190} state={voiceState} color={agent.color}/>
          </div>
          {/* Pulse rings */}
          {voiceState!=='idle' && [1,2].map(i=>(
            <div key={i} style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:180+i*40,height:180+i*40,borderRadius:'50%',border:`1.5px solid ${agent.color}`,animation:`ring 2s ease-out infinite`,animationDelay:`${i*.4}s`,zIndex:0}}/>
          ))}
        </div>

        {/* Voice status bar */}
        <div style={{width:'100%',marginTop:8,padding:'10px 16px',background:T.glass,border:`1px solid ${T.border}`,borderRadius:14,backdropFilter:'blur(12px)',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:T.mint,boxShadow:`0 0 8px ${T.mint}`,flexShrink:0,animation:'shimmer 1.5s ease-in-out infinite'}}/>
          <span style={{fontSize:12,color:T.text,fontWeight:500,flex:1}}>
            {voiceState==='speaking'?`${agent.name} parle...`:voiceState==='listening'?'Je vous écoute...':voiceState==='thinking'?'Analyse en cours...':'Je vous écoute...'}
          </span>
          <WaveformBars active={voiceState!=='idle'} color={agent.color} bars={16}/>
        </div>
      </div>

      {/* Agent selector card */}
      <div style={{padding:'12px 20px 0',flex:'0 0 auto'}}>
        <button onClick={()=>setScreen('agents')} style={{width:'100%',padding:'14px 16px',background:T.glass,border:`1px solid ${T.border}`,borderRadius:16,backdropFilter:'blur(12px)',display:'flex',alignItems:'center',gap:12,cursor:'pointer',textAlign:'left'}}>
          <div style={{display:'flex',gap:-8}}>
            {AGENTS.map((a,i)=>(
              <div key={a.id} style={{width:28,height:28,borderRadius:'50%',background:`linear-gradient(135deg,${a.color},${a.color}80)`,border:`2px solid ${T.bg}`,marginLeft:i?-8:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>{a.badge}</div>
            ))}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:"'Space Grotesk',sans-serif"}}>Choisir votre agent</div>
            <div style={{fontSize:10,color:T.muted,marginTop:1}}>Glissez pour découvrir nos assistants</div>
          </div>
          <div style={{width:28,height:28,borderRadius:'50%',background:`linear-gradient(135deg,${T.teal},${T.purple})`,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:14,fontWeight:700}}>→</div>
        </button>
      </div>

      {/* Quick access */}
      <div style={{padding:'14px 20px 0',flex:'0 0 auto'}}>
        <div style={{fontSize:11,fontWeight:600,color:T.muted,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Accès rapide</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {QUICK_FR.map(q=>(
            <button key={q.title} onClick={()=>startChat(agent,'fr')} style={{padding:'12px 14px',background:T.glass,border:`1px solid ${T.border}`,borderRadius:12,backdropFilter:'blur(8px)',cursor:'pointer',textAlign:'left'}}>
              <div style={{fontSize:18,marginBottom:5}}>{q.icon}</div>
              <div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:2,fontFamily:"'Space Grotesk',sans-serif"}}>{q.title}</div>
              <div style={{fontSize:10,color:T.muted}}>{q.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Trust badges */}
      <div style={{padding:'14px 20px 80px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
        {[{i:'🔒',t:'Sécurisé',s:'Données protégées'},{i:'🛡️',t:'Confidentiel',s:'Vie privée'},{i:'🤖',t:'IA Fiable',s:'Technologie avancée'},{i:'🕐',t:'Disponible',s:'24h/24 · 7j/7'}].map(b=>(
          <div key={b.t} style={{textAlign:'center',padding:'8px 4px',background:T.glass,border:`1px solid ${T.border}`,borderRadius:10,backdropFilter:'blur(6px)'}}>
            <div style={{fontSize:16,marginBottom:3}}>{b.i}</div>
            <div style={{fontSize:9,fontWeight:600,color:T.text}}>{b.t}</div>
            <div style={{fontSize:8,color:T.muted,marginTop:1}}>{b.s}</div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <BottomNav active="home" onMic={()=>startChat(agent,'fr')} T={T} onNav={(v:string)=>{if(v==='rdv')startChat(agent,'fr');}} theme={theme}/>
    </div>
  );

  // ── SCREEN: AGENTS ─────────────────────────────────────────
  if(screen==='agents') return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:"'Inter',sans-serif",color:T.text,display:'flex',flexDirection:'column',maxWidth:420,margin:'0 auto',overflow:'hidden'}}>
      <div style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
        <button onClick={()=>setScreen('home')} style={{background:'none',border:'none',cursor:'pointer',color:T.muted,fontSize:20,padding:4}}>←</button>
        <div style={{flex:1,textAlign:'center'}}>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:16,color:T.text}}>Choisir votre agent</div>
          <div style={{fontSize:10,color:T.muted}}>Faites glisser pour découvrir nos assistants</div>
        </div>
        <div style={{display:'flex',gap:6}}>
          {['🔊','🌐','☀️'].map((ic,i)=>(
            <button key={i} onClick={i===2?()=>setTheme(t=>t==='dark'?'light':'dark'):undefined} style={{width:32,height:32,borderRadius:8,background:T.glass,border:`1px solid ${T.border}`,fontSize:14,cursor:'pointer',backdropFilter:'blur(6px)'}}>{ic}</button>
          ))}
        </div>
      </div>

      {/* Agent cards carousel */}
      <div style={{padding:'0 20px',display:'flex',gap:10,overflowX:'auto',scrollSnapType:'x mandatory',scrollbarWidth:'none',flexShrink:0}}>
        {AGENTS.map((a,i)=>(
          <button key={a.id} onClick={()=>setAgentIdx(i)} style={{flex:'0 0 100px',scrollSnapAlign:'start',padding:'12px',background:agentIdx===i?`${a.color}18`:T.glass,border:`1.5px solid ${agentIdx===i?a.color:T.border}`,borderRadius:16,backdropFilter:'blur(8px)',cursor:'pointer',textAlign:'center',transition:'all .3s'}}>
            <div style={{fontSize:28,marginBottom:6}}>{a.badge}</div>
            <div style={{fontSize:13,fontWeight:700,color:agentIdx===i?a.color:T.text,fontFamily:"'Space Grotesk',sans-serif"}}>{a.name}</div>
            <div style={{fontSize:9,color:T.muted,marginTop:2}}>{a.lang}</div>
            {agentIdx===i&&<div style={{width:24,height:3,borderRadius:2,background:a.color,margin:'6px auto 0'}}/>}
          </button>
        ))}
      </div>

      {/* Selected agent detail */}
      <div style={{flex:1,padding:'16px 20px 80px',display:'flex',flexDirection:'column',gap:12,overflow:'auto'}}>
        {[AGENTS[agentIdx]].map(a=>(
          <div key={a.id} style={{animation:'slideIn .4s ease'}}>
            {/* Large avatar card */}
            <div style={{background:T.glass,border:`1px solid ${a.color}40`,borderRadius:24,backdropFilter:'blur(16px)',overflow:'hidden',position:'relative',marginBottom:12}}>
              <div style={{position:'absolute',inset:0,background:`radial-gradient(circle at 50% 20%,${a.color}12,transparent 70%)`}}/>
              <div style={{display:'flex',justifyContent:'center',padding:'16px 0 0',position:'relative'}}>
                <MedAvatar id={a.id} size={160} state="idle" color={a.color}/>
              </div>
              <div style={{padding:'8px 16px 16px',textAlign:'center',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:4}}>
                  <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:20,fontWeight:700,color:T.text}}>{a.name}</span>
                  <span style={{fontSize:10,padding:'2px 8px',background:`${a.color}20`,color:a.color,borderRadius:20,fontWeight:600,border:`1px solid ${a.color}40`}}>● En ligne</span>
                </div>
                <div style={{fontSize:12,color:T.muted,marginBottom:12}}>{a.role}</div>
                <div style={{padding:'10px 14px',background:T.s1,borderRadius:12,fontSize:12,color:T.text,textAlign:'left',lineHeight:1.6,border:`1px solid ${T.border}`}}>
                  {lang==='fr'?`Bonjour ! Je suis ${a.name}, votre assistante médicale IA. Comment puis-je vous aider aujourd'hui ?`:`Hello! I'm ${a.name}, your AI medical assistant. How can I help you today?`}
                </div>
              </div>
            </div>

            {/* Language selector */}
            <div style={{background:T.glass,border:`1px solid ${T.border}`,borderRadius:16,backdropFilter:'blur(8px)',padding:'14px 16px',marginBottom:10}}>
              <div style={{fontSize:10,color:T.muted,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Langue</div>
              <div style={{display:'flex',gap:6}}>
                {[{l:'fr',flag:'🇫🇷',n:'Français'},{l:'en',flag:'🇬🇧',n:'English'},{l:'ar',flag:'🇸🇦',n:'العربية'}].map(({l,flag,n})=>(
                  a.langs.includes(l) && (
                    <button key={l} onClick={()=>setLang(l)} style={{flex:1,padding:'8px 6px',background:lang===l?`${a.color}20`:T.s2,border:`1.5px solid ${lang===l?a.color:T.border}`,borderRadius:10,cursor:'pointer',textAlign:'center'}}>
                      <div style={{fontSize:18}}>{flag}</div>
                      <div style={{fontSize:9,color:lang===l?a.color:T.muted,marginTop:2,fontWeight:600}}>{n}</div>
                    </button>
                  )
                ))}
              </div>
            </div>

            {/* Start button */}
            <button onClick={()=>startChat(a,lang)} style={{width:'100%',padding:'15px',background:`linear-gradient(135deg,${a.color},${a.color}CC)`,border:'none',borderRadius:16,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'Space Grotesk',sans-serif",boxShadow:`0 8px 24px ${a.color}40`,letterSpacing:'-.01em'}}>
              🎤 Parler avec {a.name}
            </button>
          </div>
        ))}
        {/* Dot nav */}
        <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:4}}>
          {AGENTS.map((_,i)=>(
            <div key={i} style={{width:i===agentIdx?20:6,height:6,borderRadius:3,background:i===agentIdx?AGENTS[agentIdx].color:T.border,transition:'all .3s'}}/>
          ))}
        </div>
      </div>
      <BottomNav active="agents" onMic={()=>startChat(AGENTS[agentIdx],lang)} T={T} onNav={()=>{}} theme={theme}/>
    </div>
  );

  // ── SCREEN: DONE ───────────────────────────────────────────
  if(screen==='done'&&booking) return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,fontFamily:"'Inter',sans-serif",color:T.text,maxWidth:420,margin:'0 auto'}}>
      <div style={{width:72,height:72,borderRadius:'50%',background:`linear-gradient(135deg,${T.mint}22,${T.teal}14)`,border:`3px solid ${T.mint}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,marginBottom:16,animation:'fadeUp .5s ease'}}>✓</div>
      <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:20,fontWeight:700,marginBottom:4,textAlign:'center',animation:'fadeUp .5s ease .1s both'}}>Rendez-vous confirmé !</h2>
      <p style={{color:T.muted,fontSize:12,marginBottom:20,animation:'fadeUp .5s ease .2s both'}}>📱 SMS et 📧 email envoyés</p>
      <div style={{width:'100%',background:T.glass,border:`1.5px solid ${agent.color}30`,borderRadius:20,padding:20,marginBottom:16,backdropFilter:'blur(12px)',animation:'fadeUp .5s ease .3s both'}}>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:9,color:T.muted,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:3}}>Rendez-vous</div>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:18,fontWeight:700,color:T.text}}>{booking.date}</div>
          <div style={{fontSize:14,color:agent.color,fontWeight:600}}>{booking.time}{booking.duration?' · '+booking.duration:''}</div>
        </div>
        {[['👨‍⚕️','Professionnel',booking.provider],['🏥','Département',booking.dept],['💳','Payeur',booking.payer||'RAMQ'],['🩺','Service',booking.service],['📱','SMS',booking.sms],['📧','Email',booking.email],['🔑','Code',booking.code]].filter(([,,v])=>v).map(([ic,lb,vl])=>(
          <div key={String(lb)} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontSize:14}}>{ic}</span>
            <span style={{fontSize:11,color:T.muted,flex:1}}>{lb}</span>
            <span style={{fontSize:11,fontWeight:600,color:T.text}}>{vl}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,width:'100%'}}>
        <button onClick={()=>{setScreen('chat');setBooking(null);setMsgs([]);setHist([]);}} style={{flex:1,padding:'12px',background:T.glass,border:`1px solid ${T.teal}`,borderRadius:12,color:T.teal,fontSize:13,fontWeight:600,cursor:'pointer',backdropFilter:'blur(6px)'}}>Autre demande</button>
        <button onClick={resetAll} style={{flex:1,padding:'12px',background:`linear-gradient(135deg,${T.teal},${T.purple})`,border:'none',borderRadius:12,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Terminer</button>
      </div>
    </div>
  );

  // ── SCREEN: CHAT ───────────────────────────────────────────
  return (
    <div style={{height:'100vh',background:T.bg,display:'flex',flexDirection:'column',maxWidth:420,margin:'0 auto',fontFamily:"'Inter',sans-serif",color:T.text}}>
      {/* Chat header */}
      <div style={{padding:'10px 16px',background:T.glass,borderBottom:`1px solid ${T.border}`,backdropFilter:'blur(12px)',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <button onClick={resetAll} style={{background:'none',border:'none',cursor:'pointer',color:T.muted,fontSize:18,padding:2}}>←</button>
        <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${agent.color},${agent.color}80)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{agent.badge}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600,fontFamily:"'Space Grotesk',sans-serif",color:T.text}}>{agent.name}</div>
          <div style={{fontSize:10,color:voiceState!=='idle'?agent.color:T.mint}}>
            {voiceState==='speaking'?'Parle...':voiceState==='listening'?'Écoute...':voiceState==='thinking'?'Analyse...':'● En ligne · Workflow 10 étapes'}
          </div>
        </div>
        <button onClick={()=>setVocal(!vocal)} style={{padding:'4px 10px',background:vocal?`${agent.color}20`:T.glass,border:`1px solid ${vocal?agent.color:T.border}`,borderRadius:16,fontSize:10,color:vocal?agent.color:T.muted,cursor:'pointer',backdropFilter:'blur(6px)',fontWeight:600}}>
          {vocal?'🎤 Vocal':'💬 Chat'}
        </button>
        <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} style={{width:30,height:30,background:T.glass,border:`1px solid ${T.border}`,borderRadius:8,cursor:'pointer',fontSize:13,backdropFilter:'blur(6px)'}}>
          {theme==='dark'?'☀️':'🌙'}
        </button>
      </div>

      {/* Voice orb (if vocal mode) */}
      {vocal && (
        <div style={{padding:'16px 0 10px',display:'flex',flexDirection:'column',alignItems:'center',background:`radial-gradient(ellipse at center,${agent.color}08 0%,transparent 60%)`,flexShrink:0,position:'relative',minHeight:180}}>
          <ECGLine color={agent.color} opacity={.12}/>
          <div style={{position:'relative',width:140,height:140,display:'flex',alignItems:'center',justifyContent:'center'}}>
            {[1,2].map(i=>(
              <div key={i} style={{position:'absolute',width:140+i*35,height:140+i*35,borderRadius:'50%',border:`1px solid ${agent.color}`,animation:`ring ${1.8+i*.3}s ease-out infinite`,animationDelay:`${i*.3}s`,opacity:voiceState!=='idle'?.6:.2}}/>
            ))}
            <div style={{width:120,height:120,borderRadius:'50%',background:`radial-gradient(circle at 35% 35%,${agent.color}25,${T.bg}90)`,border:`2px solid ${agent.color}40`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 0 30px ${agent.color}30`}}>
              <span style={{fontSize:40}}>{agent.badge}</span>
            </div>
          </div>
          <div style={{marginTop:6,fontSize:11,color:agent.color,fontWeight:500}}>
            {voiceState==='speaking'?`${agent.name} parle...`:voiceState==='listening'?'Écoute...':voiceState==='thinking'?'Analyse...':'Appuyez pour parler'}
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={chatRef} style={{flex:1,overflowY:'auto',padding:'12px 14px 6px',display:'flex',flexDirection:'column',gap:8}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',justifyContent:m.role==='ai'?'flex-start':'flex-end',animation:'fadeUp .3s ease',direction:lang==='ar'?'rtl':'ltr'}}>
            {m.role==='ai' && <div style={{width:26,height:26,borderRadius:8,background:`linear-gradient(135deg,${agent.color},${agent.color}80)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,marginRight:6,flexShrink:0,alignSelf:'flex-end'}}>{agent.badge}</div>}
            <div style={{maxWidth:'80%',padding:'10px 14px',borderRadius:m.role==='ai'?'4px 14px 14px 14px':'14px 4px 14px 14px',background:m.role==='ai'?T.glass:`linear-gradient(135deg,${agent.color}20,${agent.color}10)`,border:`1px solid ${m.role==='ai'?T.border:agent.color+'40'}`,fontSize:13,lineHeight:1.65,color:T.text,backdropFilter:'blur(8px)'}}>
              {m.text}
            </div>
          </div>
        ))}
        {slots && (
          <div style={{animation:'fadeUp .3s ease',marginTop:4}}>
            <div style={{fontSize:11,color:T.muted,textAlign:'center',marginBottom:8}}>📅 Choisissez un créneau :</div>
            {slots.map((s:any)=>(
              <button key={s.id} onClick={()=>setSel(s.id)} style={{width:'100%',marginBottom:6,padding:'12px 14px',background:sel===s.id?`${agent.color}18`:T.glass,border:`1.5px solid ${sel===s.id?agent.color:T.border}`,borderRadius:12,cursor:'pointer',textAlign:'left',backdropFilter:'blur(8px)',transition:'all .2s'}}>
                <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:2}}>📅 {s.label}</div>
                <div style={{fontSize:11,color:T.muted}}>{s.provider} · {s.dept}{s.duration?' · '+s.duration:''}</div>
              </button>
            ))}
            {sel && <button onClick={confirmSlot} style={{width:'100%',padding:'11px',background:`linear-gradient(135deg,${agent.color},${agent.color}CC)`,border:'none',borderRadius:12,color:'white',fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:`0 4px 16px ${agent.color}40`}}>✓ Confirmer ce créneau</button>}
          </div>
        )}
        {load && (
          <div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 8px'}}>
            <div style={{width:24,height:24,borderRadius:8,background:`linear-gradient(135deg,${agent.color},${agent.color}80)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,marginRight:4}}>{agent.badge}</div>
            {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:agent.color,animation:`dot 1s ease-in-out infinite`,animationDelay:`${i*.15}s`}}/>)}
          </div>
        )}
      </div>

      {/* Quick replies (first message) */}
      {msgs.length<=1&&!load&&(
        <div style={{padding:'0 14px 6px',flexShrink:0}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
            {(lang==='fr'?[
              {i:'📅',l:'Prendre RDV',m:'Je voudrais prendre un rendez-vous'},
              {i:'🦵',l:'Physiothérapie',m:"J'ai mal au genou depuis 2 semaines"},
              {i:'👶',l:'Mon enfant est malade',m:"Mon enfant a de la fièvre"},
              {i:'🦺',l:'Accident CNESST',m:"J'ai eu un accident de travail"},
            ]:lang==='en'?[
              {i:'📅',l:'Book appointment',m:"I'd like to book an appointment"},
              {i:'🦵',l:'Physiotherapy',m:'I have knee pain for 2 weeks'},
              {i:'👶',l:'Child sick',m:'My child has a fever'},
              {i:'🚗',l:'SAAQ accident',m:'Car accident, need physiotherapy'},
            ]:[
              {i:'📅',l:'حجز موعد',m:'أريد حجز موعد'},
              {i:'🦵',l:'علاج طبيعي',m:'أشعر بألم في ركبتي'},
              {i:'👶',l:'طفلي مريض',m:'طفلي عنده حمى'},
              {i:'📋',l:'ملف طبي',m:'أريد معرفة خدماتكم'},
            ]).map((q:any)=>(
              <button key={q.l} onClick={()=>sendMsg(q.m)} style={{padding:'8px 10px',background:T.glass,border:`1px solid ${T.border}`,borderRadius:10,cursor:'pointer',textAlign:'left',fontSize:11,color:T.text,display:'flex',alignItems:'center',gap:6,backdropFilter:'blur(6px)'}}>
                <span style={{fontSize:14}}>{q.i}</span><span style={{fontWeight:500}}>{q.l}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div style={{padding:'8px 14px 16px',background:T.glass,borderTop:`1px solid ${T.border}`,backdropFilter:'blur(12px)',flexShrink:0}}>
        {vErr&&<div style={{fontSize:10,color:T.urgent,textAlign:'center',marginBottom:5}}>{vErr}</div>}
        {vocal ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
            <WaveformBars active={listen} color={agent.color} bars={20}/>
            <button onClick={listen?stopListen:startListen} disabled={load} style={{width:60,height:60,borderRadius:'50%',background:listen?`linear-gradient(135deg,${T.mint},${T.teal})`:load?T.border:`linear-gradient(135deg,${agent.color},${agent.color}CC)`,border:'none',cursor:load?'not-allowed':'pointer',fontSize:22,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:listen?`0 0 20px ${T.mint}50`:`0 0 16px ${agent.color}40`,transition:'all .3s'}}>
              {listen?'⏹':load?'⋯':'🎤'}
            </button>
            <div style={{fontSize:10,color:T.muted}}>{listen?'Parlez maintenant...':load?'Traitement...':'Appuyer pour parler'}</div>
          </div>
        ) : (
          <div style={{display:'flex',gap:6}}>
            <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMsg(inp)}
              placeholder={lang==='fr'?'Écrivez votre message...':lang==='ar'?'اكتب رسالتك...':'Type your message...'}
              disabled={load} dir={lang==='ar'?'rtl':'ltr'}
              style={{flex:1,padding:'10px 14px',background:T.s1,border:`1px solid ${T.border}`,borderRadius:12,color:T.text,fontSize:13,outline:'none',fontFamily:"'Inter',sans-serif"}}/>
            <button onClick={listen?stopListen:startListen} disabled={load} style={{width:40,height:40,borderRadius:11,background:listen?`${T.mint}22`:T.glass,border:`1px solid ${listen?T.mint:T.border}`,cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)'}}>
              {listen?'⏹':'🎤'}
            </button>
            <button onClick={()=>sendMsg(inp)} disabled={!inp.trim()||load}
              style={{width:40,height:40,borderRadius:11,background:inp.trim()&&!load?`linear-gradient(135deg,${agent.color},${agent.color}CC)`:T.border,border:'none',cursor:inp.trim()&&!load?'pointer':'not-allowed',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',color:'white',transition:'background .2s'}}>
              ▸
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ──────────────────────────────────────────────
function BottomNav({ active, onMic, T, onNav, theme }: any) {
  const items = [
    {id:'home', icon:'🏠', label:'Accueil'},
    {id:'rdv',  icon:'📅', label:'Rendez-vous'},
    {id:'mic',  icon:'🎤', label:'', special:true},
    {id:'svc',  icon:'🩺', label:'Services'},
    {id:'prof', icon:'👤', label:'Profil'},
  ];
  return (
    <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:420,padding:'6px 16px 12px',background:T.glass,borderTop:`1px solid ${T.border}`,backdropFilter:'blur(16px)',display:'flex',alignItems:'center',justifyContent:'space-around',zIndex:100}}>
      {items.map(item=>(
        item.special
          ? <button key="mic" onClick={onMic} style={{width:52,height:52,borderRadius:'50%',background:`linear-gradient(135deg,${T.teal},${T.purple})`,border:'3px solid '+T.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,cursor:'pointer',boxShadow:`0 4px 16px ${T.teal}50`,marginTop:-14}}>🎤</button>
          : <button key={item.id} onClick={()=>onNav(item.id)} style={{background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'4px 6px'}}>
              <span style={{fontSize:18,opacity:active===item.id?1:.5}}>{item.icon}</span>
              <span style={{fontSize:9,color:active===item.id?T.teal:T.muted,fontWeight:active===item.id?600:400}}>{item.label}</span>
            </button>
      ))}
    </div>
  );
}
