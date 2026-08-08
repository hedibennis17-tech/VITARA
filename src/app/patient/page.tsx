'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const DARK  = { bg:'#07111F',s1:'#0D1B2E',s2:'#112138',border:'#1E3350',teal:'#00D7C8',purple:'#8B5CF6',mint:'#00E5A0',pink:'#EC4899',green:'#16A34A',text:'#E8F0FA',muted:'#5E7A96',urgent:'#EF4444',glass:'rgba(255,255,255,0.06)' };
const LIGHT = { bg:'#EEF2F7',s1:'#FFFFFF',s2:'#F8FAFC',border:'#CBD5E1',teal:'#0891B2',purple:'#7C3AED',mint:'#059669',pink:'#DB2777',green:'#16A34A',text:'#0F1B2D',muted:'#64748B',urgent:'#DC2626',glass:'rgba(255,255,255,0.75)' };

const AGENTS = [
  { id:'houda', name:'Houda', lang:'FR · AR',     color:'#00D7C8', role:'Assistante médicale',        langs:['fr','ar'],     badge:'🩺' },
  { id:'said',  name:'Said',  lang:'FR · EN · AR', color:'#8B5CF6', role:'Médecine générale',          langs:['fr','en','ar'], badge:'👨‍⚕️' },
  { id:'hayet', name:'Hayet', lang:'FR · EN',      color:'#EC4899', role:'Pédiatrie & Famille',        langs:['fr','en'],     badge:'👶' },
  { id:'alain', name:'Alain', lang:'FR · EN',      color:'#16A34A', role:'Médecine institutionnelle',  langs:['fr','en'],     badge:'🏥' },
];

const QUICK = [
  { i:'📅', l:'Prendre rendez-vous',  m:'Je voudrais prendre un rendez-vous' },
  { i:'🩺', l:'Physiothérapie',       m:"J'ai une douleur au genou depuis 2 semaines" },
  { i:'👶', l:'Mon enfant est malade',m:"Mon enfant de 2 ans a de la fièvre" },
  { i:'🦺', l:'Accident CNESST',      m:"J'ai eu un accident de travail, j'ai besoin de physiothérapie" },
  { i:'❌', l:'Annuler un RDV',       m:'Je dois annuler mon rendez-vous' },
  { i:'💊', l:'Renouvellement ordo',  m:"Je dois renouveler mon ordonnance" },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
@keyframes ecg{0%{stroke-dashoffset:600}100%{stroke-dashoffset:0}}
@keyframes wave{0%,100%{height:18%}50%{height:88%}}
@keyframes blink{0%,85%,100%{transform:scaleY(1)}91%{transform:scaleY(0.05)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes ring{0%{transform:scale(.92);opacity:.6}100%{transform:scale(1.65);opacity:0}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
@keyframes dot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
@keyframes glow{0%,100%{opacity:.5}50%{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}`;

// ── AVATAR SVG ────────────────────────────────────────────────
// ── VRAIES PHOTOS agents ─────────────────────────────────────
const AGENT_PHOTO: Record<string,string> = {
  houda: '/agents/houda.png',
  said:  '/agents/said.png',
  alain: '/agents/alain.png',
  hayet: '/agents/hayet.jpg',
};
const AGENT_POS: Record<string,string> = {
  houda: 'center 20%',
  said:  'center 10%',
  alain: 'center 12%',
  hayet: 'center 18%',
};

function Avatar({ id, size=200, talking=false, color='#00D7C8' }: any) {
  const src = AGENT_PHOTO[id] || AGENT_PHOTO.houda;
  const pos = AGENT_POS[id]  || 'center center';
  const border = 3;
  const inner = size - border * 2;

  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      {/* Anneaux pulsants quand parle */}
      {talking && [1,2].map(i => (
        <div key={i} style={{
          position:'absolute',
          top:-(i*11), left:-(i*11),
          width:size+(i*22), height:size+(i*22),
          borderRadius:'50%',
          border:`1.5px solid ${color}`,
          opacity:.5,
          animation:`ring ${1.8+i*.35}s ease-out infinite`,
          animationDelay:`${i*.3}s`,
          pointerEvents:'none',
        }}/>
      ))}
      {/* Contour coloré — tourne quand parle */}
      <div style={{
        width:size, height:size, borderRadius:'50%',
        background:`conic-gradient(${color} 0%, ${color}44 45%, ${color} 100%)`,
        padding:border, boxSizing:'border-box',
        animation: talking ? 'spin 3s linear infinite' : 'none',
        boxShadow:`0 0 ${talking?22:10}px ${color}${talking?'80':'38'}`,
        transition:'box-shadow .4s',
      }}>
        <div style={{ width:inner, height:inner, borderRadius:'50%', overflow:'hidden', background:'#07111F' }}>
          <img src={src} alt={id} style={{
            width:'100%', height:'100%', objectFit:'cover', objectPosition:pos, display:'block',
            filter: talking ? `brightness(1.08)` : 'brightness(1)',
            transition:'filter .3s',
          }}/>
        </div>
      </div>
      {/* Point vert "parle" */}
      {talking && (
        <div style={{
          position:'absolute', bottom:4, right:4,
          width:13, height:13, borderRadius:'50%',
          background:color, border:'2px solid #07111F',
          animation:'glow 1s ease-in-out infinite',
        }}/>
      )}
    </div>
  );
}
function Bars({ active=false, color='#00D7C8', n=16 }:any) {
  return <div style={{display:'flex',alignItems:'center',gap:2.5,height:26}}>{Array.from({length:n}).map((_,i)=><div key={i} style={{width:3,minHeight:'12%',borderRadius:2,background:`linear-gradient(to top,${color},${color}80)`,animation:active?`wave ${.2+(i%5)*.07}s ease-in-out infinite alternate`:'none',height:active?undefined:`${16+(i%4)*8}%`,animationDelay:`${i*.04}s`,opacity:active?1:.3}}/> )}</div>;
}

function ECG({ color='#00D7C8', op=.2 }:any) {
  return <svg width="100%" height="56" viewBox="0 0 400 56" preserveAspectRatio="none" style={{position:'absolute',bottom:0,left:0,opacity:op,pointerEvents:'none'}}>
    <path d="M0 33 L62 33 L76 33 L86 4 L96 52 L106 33 L125 33 L145 15 L155 50 L165 33 L205 33 L222 8 L233 51 L243 33 L265 33 L290 33 L303 16 L313 50 L323 33 L350 33 L362 10 L372 52 L382 33 L400 33" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="600" style={{animation:'ecg 3s linear infinite'}}/>
  </svg>;
}

// ── MAIN ─────────────────────────────────────────────────────
export default function PatientPage() {
  const [mounted,  setMounted]    = useState(false);
  const [screen,   setScreen]     = useState<'home'|'agents'|'chat'|'done'|'rdv'|'services'|'profil'>('home');
  const [theme,    setTheme]      = useState<'dark'|'light'>('dark');
  const [agent,    setAgent]      = useState(AGENTS[0]);
  const [lang,     setLang]       = useState('fr');
  const [vState,   setVState]     = useState<'idle'|'listening'|'thinking'|'speaking'>('idle');
  const [msgs,     setMsgs]       = useState<{role:string;text:string}[]>([]);
  const [hist,     setHist]       = useState<{role:string;content:string}[]>([]);
  const [inp,      setInp]        = useState('');
  const [slots,    setSlots]      = useState<any[]|null>(null);
  const [booking,  setBooking]    = useState<any>(null);
  const [sel,      setSel]        = useState<string|null>(null);
  const [load,     setLoad]       = useState(false);
  const [aIdx,     setAIdx]       = useState(0);
  const [vocal,    setVocal]      = useState(false);
  const [listen,   setListen]     = useState(false);
  const [vErr,     setVErr]       = useState('');

  const chatRef    = useRef<HTMLDivElement>(null);
  const recRef     = useRef<any>(null);
  const recorderRef= useRef<MediaRecorder|null>(null);
  const chunksRef  = useRef<Blob[]>([]);
  const synthRef   = useRef<SpeechSynthesis|null>(null);
  const greeted    = useRef(false);  // ← UNE SEULE bienvenue par session
  // Refs miroirs pour éviter stale-closures dans les callbacks
  const histRef    = useRef(hist);
  const langRef    = useRef(lang);

  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    setMounted(true);
    synthRef.current = typeof window !== 'undefined' ? window.speechSynthesis : null;
    return () => { s.remove(); };
  }, []);

  useEffect(() => { histRef.current = hist; }, [hist]);
  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }); }, [msgs, slots, load]);

  const T = theme === 'dark' ? DARK : LIGHT;

  // ── Synthèse vocale ──────────────────────────────────────
  const speak = useCallback((t: string) => {
    if (!synthRef.current || !mounted) return;
    try {
      synthRef.current.cancel();
      const u = new SpeechSynthesisUtterance(t);
      const l = langRef.current;
      u.lang = l === 'fr' ? 'fr-FR' : l === 'ar' ? 'ar-SA' : 'en-US';
      u.rate = .92; u.pitch = 1.05;
      const vs = synthRef.current.getVoices();
      const p = vs.find((v: any) => l === 'fr' ? v.lang.startsWith('fr') : l === 'ar' ? v.lang.startsWith('ar') : v.lang.startsWith('en'));
      if (p) u.voice = p;
      u.onstart = () => setVState('speaking');
      u.onend   = () => setVState('idle');
      u.onerror = () => setVState('idle');
      synthRef.current.speak(u);
    } catch { setVState('idle'); }
  }, [mounted]);

  // ── Envoi message (partagé chat+vocal, préserve hist) ────
  const sendMsg = useCallback(async (txt: string) => {
    if (!txt.trim() || load) return;
    synthRef.current?.cancel();
    setSlots(null); setSel(null);
    const currentLang = langRef.current;

    // Ajouter le message user à l'historique complet
    const um = { role: 'user', content: txt };
    const fullHist = [...histRef.current, um];
    setHist(fullHist); histRef.current = fullHist;
    setMsgs(p => [...p, { role: 'patient', text: txt }]);
    setInp(''); setLoad(true); setVState('thinking');

    try {
      // Garde-fou: max 10 messages → évite de dépasser la context window Groq
      const trimmed = fullHist.slice(-10);
      const safeHist = trimmed[0]?.role !== 'user' ? trimmed.slice(1) : trimmed;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: safeHist, language: currentLang, max_tokens: 600 }),
      });

      const data = await res.json() as any;
      const raw = (data.content?.[0]?.text || '{}')
        .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let parsed: any;
      try { parsed = JSON.parse(raw); } catch { parsed = { speak: raw, intent: 'info' }; }

      if (data.code === 'NO_API_KEY') {
        setMsgs(p => [...p, { role: 'ai', text: '⚠️ Clé GROQ_API_KEY manquante sur Vercel' }]);
        setVState('idle'); return;
      }

      const aiTxt = parsed.speak
        || (currentLang === 'ar' ? 'أنا هنا.' : currentLang === 'en' ? "I'm here." : 'Je vous écoute.');

      const newH = [...fullHist, { role: 'assistant', content: aiTxt }];
      setHist(newH); histRef.current = newH;
      setMsgs(p => [...p, { role: 'ai', text: aiTxt }]);

      if (parsed.slots) setSlots(parsed.slots);
      if (parsed.booking) { setBooking(parsed.booking); setTimeout(() => setScreen('done'), 900); }
      setVState(parsed.intent === 'emergency' ? 'idle' : 'speaking');
      speak(aiTxt);

    } catch (e: any) {
      setMsgs(p => [...p, { role: 'ai', text: '⚠️ ' + (e.message || 'Erreur réseau — réessayez') }]);
      setVState('idle');
    } finally {
      setLoad(false);
    }
  }, [load, speak]);

  // ── Micro : Web Speech API + fallback Whisper ────────────
  const stopListen = useCallback(() => {
    try { recRef.current?.abort(); } catch {}
    try { if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop(); } catch {}
    recRef.current = null; recorderRef.current = null;
    setListen(false); setVState('idle');
  }, []);

  const startWhisper = useCallback(async () => {
    if (!mounted) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size < 1000) { setVState('idle'); return; }
        setVState('thinking');
        const fd = new FormData();
        fd.append('audio', blob, 'audio.webm');
        fd.append('lang', langRef.current);
        try {
          const r = await fetch('/api/voice/transcribe', { method: 'POST', body: fd });
          const d = await r.json() as { text?: string; error?: string };
          if (d.text?.trim()) sendMsg(d.text);
          else { setVErr('Transcription vide'); setVState('idle'); }
        } catch { setVErr('Erreur transcription'); setVState('idle'); }
      };
      rec.start();
      recorderRef.current = rec;
      setListen(true); setVState('listening'); setVErr('');
    } catch (e: any) {
      setVErr(e.name === 'NotAllowedError' ? '⚠️ Permission micro refusée' : '⚠️ Micro non disponible');
    }
  }, [mounted, sendMsg]);

  const startMic = useCallback(() => {
    if (!mounted) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { startWhisper(); return; }
    try {
      const r = new SR();
      r.lang = langRef.current === 'fr' ? 'fr-FR' : langRef.current === 'ar' ? 'ar-SA' : 'en-US';
      r.continuous = false; r.interimResults = false;
      r.onstart = () => { setListen(true); setVState('listening'); setVErr(''); };
      r.onend   = () => setListen(false);
      r.onerror = (e: any) => {
        setListen(false); setVState('idle');
        if (e.error === 'not-allowed') { setVErr('⚠️ Permission micro refusée'); }
        else if (e.error === 'no-speech') { setVErr('Aucun son détecté'); }
        else { startWhisper(); } // fallback Whisper
      };
      r.onresult = (e: any) => {
        const t = e.results[0][0].transcript;
        setListen(false);
        if (t.trim()) sendMsg(t);
      };
      recRef.current = r;
      r.start();
    } catch { startWhisper(); }
  }, [mounted, sendMsg, startWhisper]);

  const toggleMic = useCallback(() => {
    if (listen) stopListen();
    else startMic();
  }, [listen, stopListen, startMic]);

  // ── Démarrer une session chat (UNE SEULE bienvenue) ──────
  const startSession = useCallback((a: typeof AGENTS[0], l: string = 'fr') => {
    synthRef.current?.cancel();
    setAgent(a); setLang(l); langRef.current = l;
    setScreen('chat'); setVocal(false);
    // Ne réinitialiser que si pas déjà dans une session
    if (!greeted.current) {
      greeted.current = true;
      setMsgs([]); setHist([]); histRef.current = [];
      setBooking(null); setSlots(null); setSel(null);
      const g = l === 'fr'
        ? `Bonjour ! Je suis ${a.name}, votre assistante médicale. Êtes-vous un nouveau patient ou avez-vous déjà un dossier chez nous ?`
        : l === 'en'
        ? `Hello! I'm ${a.name}, your medical assistant. Are you a new or existing patient?`
        : `مرحباً! أنا ${a.name}، مساعدتك الطبية. هل أنت مريض جديد؟`;
      // BUG FIX: le greeting va dans msgs (affichage) mais PAS dans hist
      // Groq rejette si messages[0].role === 'assistant'
      // hist reste vide → le premier appel API aura messages[0].role === 'user' ✓
      setMsgs([{ role: 'ai', text: g }]);
      setHist([]); histRef.current = [];
      setTimeout(() => speak(g), 500);
    }
  }, [speak]);

  const confirmSlot = useCallback(() => {
    if (!sel || !slots) return;
    const s = slots.find((x: any) => x.id === sel);
    if (!s) return;
    setSlots(null);
    sendMsg(langRef.current === 'fr'
      ? `Je confirme le créneau : ${s.label} avec ${s.provider}.`
      : `I confirm: ${s.label} with ${s.provider}.`);
  }, [sel, slots, sendMsg]);

  const resetAll = useCallback(() => {
    synthRef.current?.cancel();
    stopListen();
    greeted.current = false;
    setScreen('home'); setMsgs([]); setHist([]); histRef.current = [];
    setBooking(null); setSlots(null); setSel(null);
    setVState('idle'); setVocal(false); setInp(''); setVErr('');
  }, [stopListen]);

  // ── RENDER HELPERS ────────────────────────────────────────
  const curAgent = AGENTS[aIdx];


  // ── ÉCRANS NAVIGATION ────────────────────────────────────────
  const navHandler = (v: string) => {
    if (v==='home') setScreen('home');
    if (v==='rdv')  setScreen('rdv');
    if (v==='svc')  setScreen('services');
    if (v==='prof') setScreen('profil');
  };
  const bookHandler = () => { greeted.current=false; startSession(agent,'fr'); };

  if (screen === 'rdv') return (
    <ScreenRdv T={T} onBack={()=>setScreen('home')} onBook={bookHandler} onNav={navHandler}/>
  );

  if (screen === 'services') return (
    <ScreenServices T={T} onBack={()=>setScreen('home')} onBook={bookHandler} onNav={navHandler}
      onSelectService={(msg:string)=>{
        greeted.current=false;
        startSession(agent, lang);
        setTimeout(()=>sendMsg(msg), 700);
      }}/>
  );

  if (screen === 'profil') return (
    <ScreenProfil T={T} onBack={()=>setScreen('home')} onNav={navHandler} theme={theme} setTheme={setTheme}/>
  );

  // ── HOME ─────────────────────────────────────────────────
  if (screen === 'home') return (
    <div style={{height:'100vh',background:T.bg,fontFamily:"'Inter',sans-serif",color:T.text,display:'flex',flexDirection:'column',maxWidth:420,margin:'0 auto'}}>

      {/* Header */}
      <div style={{padding:'12px 18px 8px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:'flex',alignItems:'center',gap:9}}>
          <div style={{width:34,height:34,background:`linear-gradient(135deg,${T.teal},${T.purple})`,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>✚</div>
          <div>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:14,background:`linear-gradient(135deg,${T.teal},${T.purple})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>VITARA</div>
            <div style={{fontSize:7,color:T.muted,letterSpacing:'.12em',textTransform:'uppercase'}}>CLINIQUE SANTÉ MONTRÉAL</div>
          </div>
        </div>
        <div style={{display:'flex',gap:6}}>
          <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} style={{padding:'4px 9px',background:T.glass,border:`1px solid ${T.border}`,borderRadius:18,fontSize:10,color:T.text,cursor:'pointer',backdropFilter:'blur(8px)'}}>
            {theme==='dark'?'☀️':'🌙'}
          </button>
          <div style={{width:32,height:32,background:T.glass,border:`1px solid ${T.border}`,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',cursor:'pointer',backdropFilter:'blur(8px)'}}>
            🔔<div style={{position:'absolute',top:6,right:6,width:6,height:6,background:T.teal,borderRadius:'50%'}}/>
          </div>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div style={{flex:1,overflowY:'auto',paddingBottom:72}}>

        {/* Greeting + Avatar */}
        <div style={{padding:'10px 18px 0'}}>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:22,fontWeight:700,color:T.teal}}>Bonjour,</div>
          <div style={{fontSize:13,color:T.text,opacity:.8,marginTop:1}}>Comment puis-je vous aider aujourd'hui ?</div>
        </div>

        {/* Avatar hero */}
        <div style={{position:'relative',display:'flex',justifyContent:'center',alignItems:'center',height:200,margin:'4px 0 0'}}>
          <div style={{position:'absolute',width:150,height:150,borderRadius:'50%',background:`radial-gradient(circle,${agent.color}18 0%,transparent 70%)`}}/>
          <ECG color={agent.color} op={.15}/>
          <div style={{position:'relative',zIndex:2,animation:'float 4s ease-in-out infinite'}}>
            <Avatar id={agent.id} size={155} talking={vState==='speaking'} color={agent.color}/>
          </div>
        </div>

        {/* Status bar */}
        <div style={{padding:'0 18px'}}>
          <div style={{padding:'8px 13px',background:T.glass,border:`1px solid ${T.border}`,borderRadius:11,backdropFilter:'blur(12px)',display:'flex',alignItems:'center',gap:9}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:T.mint,boxShadow:`0 0 7px ${T.mint}`,animation:'glow 1.5s ease-in-out infinite',flexShrink:0}}/>
            <span style={{fontSize:11,color:T.text,fontWeight:500,flex:1}}>{agent.name} · Je vous écoute…</span>
            <Bars active={vState!=='idle'} color={agent.color} n={12}/>
          </div>
        </div>

        {/* Agent selector */}
        <div style={{padding:'9px 18px 0'}}>
          <button onClick={()=>setScreen('agents')} style={{width:'100%',padding:'11px 14px',background:T.glass,border:`1px solid ${T.border}`,borderRadius:12,backdropFilter:'blur(12px)',display:'flex',alignItems:'center',gap:10,cursor:'pointer',textAlign:'left'}}>
            <div style={{display:'flex'}}>{AGENTS.map((a,i)=>(
              <div key={a.id} style={{width:23,height:23,borderRadius:'50%',background:`linear-gradient(135deg,${a.color},${a.color}80)`,border:`2px solid ${T.bg}`,marginLeft:i?-6:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10}}>{a.badge}</div>
            ))}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:T.text,fontFamily:"'Space Grotesk',sans-serif"}}>Choisir votre agent</div>
              <div style={{fontSize:10,color:T.muted,marginTop:1}}>Houda · Said · Hayet · Alain · FR EN AR</div>
            </div>
            <div style={{width:23,height:23,borderRadius:'50%',background:`linear-gradient(135deg,${T.teal},${T.purple})`,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:11}}>→</div>
          </button>
        </div>

        {/* Accès rapide */}
        <div style={{padding:'9px 18px 0'}}>
          <div style={{fontSize:10,fontWeight:600,color:T.muted,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:7}}>Accès rapide</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
            {QUICK.map(q=>(
              <button key={q.l}
                onClick={()=>{ greeted.current=false; startSession(agent,'fr'); setTimeout(()=>sendMsg(q.m),700); }}
                style={{padding:'10px 8px',background:T.glass,border:`1px solid ${T.border}`,borderRadius:10,backdropFilter:'blur(8px)',cursor:'pointer',textAlign:'left'}}>
                <div style={{fontSize:16,marginBottom:3}}>{q.i}</div>
                <div style={{fontSize:10,fontWeight:600,color:T.text,lineHeight:1.2}}>{q.l}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <NavBar active="home" T={T}
        onMic={()=>{ greeted.current=false; startSession(agent,'fr'); }}
        onNav={(v:string)=>{
          if(v==='rdv')     { setScreen('rdv'); }
          if(v==='svc')     { setScreen('services'); }
          if(v==='prof')    { setScreen('profil'); }
          if(v==='home')    { setScreen('home'); }
        }}
        inChat={false}/>
    </div>
  );


  // ── AGENTS ────────────────────────────────────────────────
  if (screen === 'agents') return (
    <div style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:"'Inter',sans-serif",display:'flex',flexDirection:'column',maxWidth:420,margin:'0 auto',overflow:'hidden'}}>
      <div style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>setScreen('home')} style={{background:'none',border:'none',cursor:'pointer',color:T.muted,fontSize:20}}>←</button>
        <div style={{flex:1,textAlign:'center',fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15}}>Choisir votre agent</div>
        <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} style={{width:32,height:32,background:T.glass,border:`1px solid ${T.border}`,borderRadius:8,cursor:'pointer',fontSize:14,backdropFilter:'blur(6px)'}}>
          {theme==='dark'?'☀️':'🌙'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:8,padding:'0 18px',overflowX:'auto',scrollbarWidth:'none',flexShrink:0}}>
        {AGENTS.map((a,i)=>(
          <button key={a.id} onClick={()=>setAIdx(i)} style={{flex:'0 0 90px',padding:'10px 8px',background:aIdx===i?`${a.color}18`:T.glass,border:`1.5px solid ${aIdx===i?a.color:T.border}`,borderRadius:14,cursor:'pointer',textAlign:'center',backdropFilter:'blur(8px)',transition:'all .3s'}}>
            <div style={{fontSize:24,marginBottom:4}}>{a.badge}</div>
            <div style={{fontSize:12,fontWeight:700,color:aIdx===i?a.color:T.text,fontFamily:"'Space Grotesk',sans-serif"}}>{a.name}</div>
            <div style={{fontSize:9,color:T.muted,marginTop:1}}>{a.lang}</div>
            {aIdx===i&&<div style={{width:20,height:3,background:a.color,borderRadius:2,margin:'5px auto 0'}}/>}
          </button>
        ))}
      </div>

      {/* Detail */}
      <div style={{flex:1,padding:'14px 18px 80px',overflow:'auto'}}>
        <div key={curAgent.id} style={{animation:'slideIn .3s ease'}}>
          <div style={{background:T.glass,border:`1px solid ${curAgent.color}35`,borderRadius:22,backdropFilter:'blur(14px)',overflow:'hidden',marginBottom:12,position:'relative'}}>
            <div style={{position:'absolute',inset:0,background:`radial-gradient(circle at 50% 20%,${curAgent.color}10,transparent 70%)`}}/>
            <div style={{display:'flex',justifyContent:'center',padding:'14px 0 0',position:'relative'}}>
              <Avatar id={curAgent.id} size={155} talking={false} color={curAgent.color}/>
            </div>
            <div style={{padding:'6px 16px 16px',textAlign:'center',position:'relative'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,marginBottom:3}}>
                <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:18,fontWeight:700,color:T.text}}>{curAgent.name}</span>
                <span style={{fontSize:9,padding:'2px 8px',background:`${curAgent.color}20`,color:curAgent.color,borderRadius:20,fontWeight:600}}>● En ligne</span>
              </div>
              <div style={{fontSize:11,color:T.muted,marginBottom:10}}>{curAgent.role}</div>
            </div>
          </div>

          {/* Langue */}
          <div style={{background:T.glass,border:`1px solid ${T.border}`,borderRadius:14,padding:'12px 14px',marginBottom:10,backdropFilter:'blur(8px)'}}>
            <div style={{fontSize:10,color:T.muted,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Langue de préférence</div>
            <div style={{display:'flex',gap:6}}>
              {[{l:'fr',f:'🇫🇷',n:'Français'},{l:'en',f:'🇬🇧',n:'English'},{l:'ar',f:'🇸🇦',n:'العربية'}].map(({l,f,n})=>(
                curAgent.langs.includes(l) && (
                  <button key={l} onClick={()=>setLang(l)} style={{flex:1,padding:'8px 4px',background:lang===l?`${curAgent.color}20`:T.s2,border:`1.5px solid ${lang===l?curAgent.color:T.border}`,borderRadius:10,cursor:'pointer',textAlign:'center'}}>
                    <div style={{fontSize:18}}>{f}</div>
                    <div style={{fontSize:9,color:lang===l?curAgent.color:T.muted,marginTop:2,fontWeight:600}}>{n}</div>
                  </button>
                )
              ))}
            </div>
          </div>

          <button onClick={()=>{ greeted.current=false; startSession(curAgent,lang); }} style={{width:'100%',padding:'14px',background:`linear-gradient(135deg,${curAgent.color},${curAgent.color}CC)`,border:'none',borderRadius:15,color:'white',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Space Grotesk',sans-serif",boxShadow:`0 6px 20px ${curAgent.color}40`}}>
            🎤 Parler avec {curAgent.name}
          </button>
        </div>
        {/* Dots */}
        <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:14}}>
          {AGENTS.map((_,i)=><div key={i} style={{width:i===aIdx?18:6,height:6,borderRadius:3,background:i===aIdx?AGENTS[aIdx].color:T.border,transition:'all .3s'}}/>)}
        </div>
      </div>
      <NavBar active="agents" T={T}
        onMic={()=>{ greeted.current=false; startSession(curAgent,lang); }}
        onNav={(v:string)=>{ if(v==='home') setScreen('home'); if(v==='rdv') setScreen('rdv'); if(v==='svc') setScreen('services'); if(v==='prof') setScreen('profil'); }}
        inChat={false}/>
    </div>
  );

  // ── DONE ─────────────────────────────────────────────────
  // ── Sauvegarder le RDV dans localStorage dès l'arrivée sur 'done' ──
  if (screen === 'done' && booking) {
    try {
      const saved = JSON.parse(localStorage.getItem('vitara_appointments') || '[]');
      const exists = saved.some((a: any) => a.code === booking.code);
      if (!exists) {
        const appt = {
          id:       `ai-${Date.now()}`,
          code:     booking.code,
          date:     booking.date,
          time:     booking.time,
          type:     booking.service || booking.dept,
          provider: booking.provider,
          dept:     booking.dept,
          payer:    booking.payer || 'RAMQ',
          mode:     booking.mode,
          duration: booking.duration,
          room:     booking.room,
          status:   'confirmed',
          color:    agent.color,
          source:   'vitara_ai',
          bookedAt: new Date().toISOString(),
        };
        localStorage.setItem('vitara_appointments', JSON.stringify([appt, ...saved].slice(0, 20)));
      }
    } catch { /* localStorage non dispo */ }
  }

  if (screen === 'done' && booking) return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,color:T.text,fontFamily:"'Inter',sans-serif",maxWidth:420,margin:'0 auto'}}>
      <div style={{width:70,height:70,borderRadius:'50%',background:`linear-gradient(135deg,${T.mint}22,${T.teal}14)`,border:`3px solid ${T.mint}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,marginBottom:16}}>✓</div>
      <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:19,fontWeight:700,marginBottom:4,textAlign:'center'}}>Rendez-vous confirmé !</h2>
      <p style={{color:T.muted,fontSize:12,marginBottom:20}}>📱 SMS · 📧 Email envoyés</p>

      <div style={{width:'100%',background:T.glass,border:`1.5px solid ${agent.color}30`,borderRadius:18,padding:18,marginBottom:12,backdropFilter:'blur(12px)'}}>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:16,fontWeight:700,fontFamily:"'Space Grotesk',sans-serif"}}>{booking.date}</div>
          <div style={{fontSize:13,color:agent.color,fontWeight:600}}>{booking.time}{booking.duration?' · '+booking.duration:''}</div>
        </div>
        {[['👨‍⚕️','Professionnel',booking.provider],['🏥','Département',booking.dept],['💳','Payeur',booking.payer||'RAMQ'],['🩺','Service',booking.service],['📱','SMS',booking.sms],['📧','Email',booking.email],['🔑','Code',booking.code]]
          .filter(([,,v])=>v)
          .map(([ic,lb,vl])=>(
          <div key={String(lb)} style={{display:'flex',alignItems:'center',gap:9,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontSize:14}}>{ic}</span>
            <span style={{fontSize:11,color:T.muted,flex:1}}>{lb}</span>
            <span style={{fontSize:11,fontWeight:600}}>{vl}</span>
          </div>
        ))}
      </div>

      {/* Lien portail patient */}
      <a href="/patient-portal" style={{display:'block',width:'100%',marginBottom:12,padding:'13px',background:`linear-gradient(135deg,${T.teal}22,${T.purple}22)`,border:`1px solid ${T.teal}44`,borderRadius:12,textDecoration:'none',textAlign:'center',color:T.teal,fontSize:13,fontWeight:700}}>
        📋 Voir dans mon portail patient →
      </a>

      <div style={{display:'flex',gap:8,width:'100%'}}>
        <button onClick={()=>{ setScreen('chat'); setBooking(null); }} style={{flex:1,padding:'11px',background:T.glass,border:`1px solid ${T.teal}`,borderRadius:11,color:T.teal,fontSize:13,fontWeight:600,cursor:'pointer',backdropFilter:'blur(6px)'}}>Autre demande</button>
        <button onClick={resetAll} style={{flex:1,padding:'11px',background:`linear-gradient(135deg,${T.teal},${T.purple})`,border:'none',borderRadius:11,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Terminer</button>
      </div>
    </div>
  );

  // ── CHAT ─────────────────────────────────────────────────
  return (
    <div style={{height:'100vh',background:T.bg,display:'flex',flexDirection:'column',maxWidth:420,margin:'0 auto',color:T.text,fontFamily:"'Inter',sans-serif"}}>
      {/* Header chat */}
      <div style={{padding:'9px 14px',background:T.glass,borderBottom:`1px solid ${T.border}`,backdropFilter:'blur(14px)',display:'flex',alignItems:'center',gap:9,flexShrink:0}}>
        <button onClick={resetAll} style={{background:'none',border:'none',cursor:'pointer',color:T.muted,fontSize:18,padding:2}}>←</button>
        <div style={{width:32,height:32,borderRadius:9,background:`linear-gradient(135deg,${agent.color},${agent.color}80)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>{agent.badge}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600,fontFamily:"'Space Grotesk',sans-serif"}}>{agent.name}</div>
          <div style={{fontSize:10,color:vState!=='idle'?agent.color:T.mint}}>
            {vState==='speaking'?'Parle...':vState==='listening'?'Écoute...':vState==='thinking'?'Analyse...':'● En ligne · Workflow 10 étapes'}
          </div>
        </div>
        {/* Toggle vocal/texte — NE RÉINITIALISE PAS le chat */}
        <button onClick={()=>setVocal(v=>!v)} style={{padding:'4px 10px',background:vocal?`${agent.color}20`:T.glass,border:`1px solid ${vocal?agent.color:T.border}`,borderRadius:14,fontSize:10,color:vocal?agent.color:T.muted,cursor:'pointer',backdropFilter:'blur(6px)',fontWeight:600}}>
          {vocal?'🎤 Vocal':'💬 Chat'}
        </button>
        <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} style={{width:28,height:28,background:T.glass,border:`1px solid ${T.border}`,borderRadius:7,cursor:'pointer',fontSize:13,backdropFilter:'blur(6px)'}}>
          {theme==='dark'?'☀️':'🌙'}
        </button>
      </div>

      {/* Orbe vocal (uniquement si mode vocal activé) */}
      {vocal && (
        <div style={{padding:'14px 0 8px',display:'flex',flexDirection:'column',alignItems:'center',background:`radial-gradient(ellipse at center,${agent.color}07 0%,transparent 65%)`,flexShrink:0,position:'relative',minHeight:170}}>
          <ECG color={agent.color} op={.12}/>
          <div style={{position:'relative',width:130,height:130,display:'flex',alignItems:'center',justifyContent:'center'}}>
            {[1,2].map(i=><div key={i} style={{position:'absolute',width:130+i*32,height:130+i*32,borderRadius:'50%',border:`1px solid ${agent.color}`,animation:`ring ${1.9+i*.3}s ease-out infinite`,animationDelay:`${i*.35}s`,opacity:vState!=='idle'?.55:.18}}/>)}
            <div style={{width:112,height:112,borderRadius:'50%',background:`radial-gradient(circle at 35% 35%,${agent.color}20,${T.bg}88)`,border:`2px solid ${agent.color}38`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 0 26px ${agent.color}28`}}>
              <span style={{fontSize:36}}>{agent.badge}</span>
            </div>
          </div>
          <div style={{marginTop:6,fontSize:11,color:agent.color,fontWeight:500}}>
            {vState==='speaking'?`${agent.name} parle…`:vState==='listening'?'Je vous écoute…':vState==='thinking'?'Analyse…':'Appuyez sur le mic pour parler'}
          </div>
        </div>
      )}

      {/* Messages — PARTAGÉS entre vocal et texte */}
      <div ref={chatRef} style={{flex:1,overflowY:'auto',padding:'10px 13px 6px',display:'flex',flexDirection:'column',gap:7}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',justifyContent:m.role==='ai'?'flex-start':'flex-end',animation:'fadeUp .28s ease',direction:lang==='ar'?'rtl':'ltr'}}>
            {m.role==='ai'&&<div style={{width:24,height:24,borderRadius:7,background:`linear-gradient(135deg,${agent.color},${agent.color}80)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,marginRight:6,flexShrink:0,alignSelf:'flex-end'}}>{agent.badge}</div>}
            <div style={{maxWidth:'80%',padding:'9px 13px',borderRadius:m.role==='ai'?'4px 13px 13px 13px':'13px 4px 13px 13px',background:m.role==='ai'?T.glass:`linear-gradient(135deg,${agent.color}1A,${agent.color}0D)`,border:`1px solid ${m.role==='ai'?T.border:agent.color+'35'}`,fontSize:13,lineHeight:1.65,color:T.text,backdropFilter:'blur(8px)'}}>
              {m.text}
            </div>
          </div>
        ))}
        {/* Créneaux */}
        {slots&&(
          <div style={{animation:'fadeUp .3s ease',marginTop:4}}>
            <div style={{fontSize:11,color:T.muted,textAlign:'center',marginBottom:7}}>📅 Choisissez un créneau :</div>
            {slots.map((s:any)=>(
              <button key={s.id} onClick={()=>setSel(s.id)} style={{width:'100%',marginBottom:6,padding:'11px 13px',background:sel===s.id?`${agent.color}18`:T.glass,border:`1.5px solid ${sel===s.id?agent.color:T.border}`,borderRadius:11,cursor:'pointer',textAlign:'left',backdropFilter:'blur(8px)',transition:'all .2s'}}>
                <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:2}}>📅 {s.label}</div>
                <div style={{fontSize:11,color:T.muted}}>{s.provider} · {s.dept}{s.duration?' · '+s.duration:''}</div>
              </button>
            ))}
            {sel&&<button onClick={confirmSlot} style={{width:'100%',padding:'11px',background:`linear-gradient(135deg,${agent.color},${agent.color}CC)`,border:'none',borderRadius:11,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>✓ Confirmer ce créneau</button>}
          </div>
        )}
        {load&&<div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 6px'}}>
          <div style={{width:22,height:22,borderRadius:7,background:`linear-gradient(135deg,${agent.color},${agent.color}80)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,marginRight:3}}>{agent.badge}</div>
          {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:agent.color,animation:`dot 1s ease-in-out infinite`,animationDelay:`${i*.14}s`}}/>)}
        </div>}
      </div>

      {/* Réponses rapides (premier msg seulement) */}
      {msgs.length<=1&&!load&&(
        <div style={{padding:'0 12px 5px',flexShrink:0}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
            {(lang==='ar'?[
              {i:'📅',l:'حجز موعد',m:'أريد حجز موعد'},
              {i:'🦵',l:'علاج طبيعي',m:'ألم في الركبة منذ أسبوعين'},
              {i:'👶',l:'طفلي مريض',m:'طفلي عنده حمى'},
              {i:'🏥',l:'حادث CNESST',m:'تعرضت لحادث في العمل'},
            ]:lang==='en'?[
              {i:'📅',l:'Book appointment',m:"I'd like to book an appointment"},
              {i:'🦵',l:'Physiotherapy',m:'Knee pain for 2 weeks'},
              {i:'👶',l:'Child sick',m:'My child has a fever'},
              {i:'🚗',l:'SAAQ accident',m:'Car accident, need physiotherapy'},
            ]:QUICK).map((q:any)=>(
              <button key={q.l} onClick={()=>sendMsg(q.m)} style={{padding:'8px 10px',background:T.glass,border:`1px solid ${T.border}`,borderRadius:9,cursor:'pointer',textAlign:'left',fontSize:11,color:T.text,display:'flex',alignItems:'center',gap:6,backdropFilter:'blur(6px)'}}>
                <span style={{fontSize:14}}>{q.i}</span><span style={{fontWeight:500}}>{q.l}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Barre d'entrée */}
      <div style={{padding:'7px 12px 14px',background:T.glass,borderTop:`1px solid ${T.border}`,backdropFilter:'blur(14px)',flexShrink:0}}>
        {vErr&&<div style={{fontSize:10,color:T.urgent,textAlign:'center',marginBottom:5}}>{vErr}</div>}
        {vocal ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
            <Bars active={listen} color={agent.color} n={20}/>
            <button onClick={toggleMic} disabled={load} style={{width:58,height:58,borderRadius:'50%',background:listen?`linear-gradient(135deg,${T.mint},${T.teal})`:load?T.border:`linear-gradient(135deg,${agent.color},${agent.color}CC)`,border:'none',cursor:load?'not-allowed':'pointer',fontSize:22,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:listen?`0 0 22px ${T.mint}55`:`0 0 14px ${agent.color}38`,transition:'all .3s'}}>
              {listen?'⏹':load?'⋯':'🎤'}
            </button>
            <div style={{fontSize:10,color:T.muted}}>
              {listen?'Parlez… (appuyez ⏹ pour arrêter)':load?'Traitement…':'Appuyer pour parler'}
            </div>
          </div>
        ) : (
          <div style={{display:'flex',gap:6}}>
            <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMsg(inp)}
              placeholder={lang==='fr'?'Écrivez votre message…':lang==='ar'?'اكتب رسالتك…':'Type your message…'}
              disabled={load} dir={lang==='ar'?'rtl':'ltr'}
              style={{flex:1,padding:'10px 13px',background:T.s1,border:`1px solid ${T.border}`,borderRadius:11,color:T.text,fontSize:13,outline:'none'}}/>
            {/* Mic dans chat texte → bascule en mode vocal */}
            <button onClick={()=>setVocal(true)} style={{width:40,height:40,borderRadius:10,background:T.glass,border:`1px solid ${T.border}`,cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)'}}>
              🎤
            </button>
            <button onClick={()=>sendMsg(inp)} disabled={!inp.trim()||load}
              style={{width:40,height:40,borderRadius:10,background:inp.trim()&&!load?`linear-gradient(135deg,${agent.color},${agent.color}CC)`:T.border,border:'none',cursor:inp.trim()&&!load?'pointer':'not-allowed',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',color:'white',transition:'background .2s'}}>
              ▸
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ÉCRAN RDV ────────────────────────────────────────────────
function ScreenRdv({ T, onBack, onBook, onNav }: any) {
  const [appts, setAppts] = useState<any[]>([]);
  useEffect(() => {
    try { setAppts(JSON.parse(localStorage.getItem('vitara_appointments') || '[]')); } catch {}
  }, []);
  const STATUS: Record<string,[string,string]> = {
    confirmed: [T.mint,'Confirmé'], scheduled: [T.teal,'Planifié'], completed:['#34D399','Complété'],
  };
  return (
    <div style={{height:'100vh',background:T.bg,display:'flex',flexDirection:'column',maxWidth:420,margin:'0 auto',color:T.text,fontFamily:"'Inter',sans-serif"}}>
      <div style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:12,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:T.muted,fontSize:18}}>←</button>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:16,color:T.text,flex:1}}>Mes rendez-vous</div>
        <button onClick={onBook} style={{padding:'7px 12px',background:`linear-gradient(135deg,${T.teal},${T.purple})`,border:'none',borderRadius:9,color:'white',fontSize:11,fontWeight:700,cursor:'pointer'}}>+ Nouveau</button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'14px 16px 80px'}}>
        {appts.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 20px'}}>
            <div style={{fontSize:48,marginBottom:16}}>📅</div>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:16,fontWeight:700,color:T.text,marginBottom:8}}>Aucun rendez-vous</div>
            <div style={{fontSize:12,color:T.muted,marginBottom:24}}>Parlez à VITARA pour prendre un rendez-vous</div>
            <button onClick={onBook} style={{padding:'13px 28px',background:`linear-gradient(135deg,${T.teal},${T.purple})`,border:'none',borderRadius:13,color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>🎤 Parler à VITARA</button>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {appts.map((a:any,i:number) => {
              const [sc, sl] = STATUS[a.status] || [T.muted, a.status];
              return (
                <div key={i} style={{padding:'16px',background:T.s1,border:`1px solid ${T.border}`,borderRadius:14,borderLeft:`3px solid ${a.color||T.teal}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <div>
                      <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:14,fontWeight:700,color:T.text}}>{a.type}</div>
                      <div style={{fontSize:12,color:a.color||T.teal,fontWeight:600,marginTop:2}}>{a.date} · {a.time}</div>
                    </div>
                    <span style={{fontSize:10,padding:'2px 8px',background:`${sc}22`,color:sc,borderRadius:20,fontWeight:600}}>{sl}</span>
                  </div>
                  <div style={{fontSize:11,color:T.muted}}>👨‍⚕️ {a.provider}</div>
                  {a.mode && <div style={{fontSize:11,color:T.muted,marginTop:3}}>📍 {a.mode}</div>}
                  {a.code && <div style={{fontSize:10,color:T.muted,marginTop:3,fontFamily:'monospace'}}>{a.code}</div>}
                  <div style={{display:'flex',gap:8,marginTop:12}}>
                    <button style={{flex:1,padding:'8px',background:T.glass,border:`1px solid ${T.border}`,borderRadius:9,color:T.text,fontSize:11,cursor:'pointer',backdropFilter:'blur(6px)'}}>Modifier</button>
                    <button style={{flex:1,padding:'8px',background:'transparent',border:`1px solid ${T.urgent}44`,borderRadius:9,color:T.urgent,fontSize:11,cursor:'pointer'}}>Annuler</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <NavBar active="rdv" T={T} onMic={onBook} onNav={onNav} inChat={false}/>
    </div>
  );
}

// ── ÉCRAN SERVICES ────────────────────────────────────────────
const SERVICES_LIST = [
  { icon:'👨‍⚕️', title:'Médecine familiale',     sub:'Dr. Awada, Caricevic, Fruchtermann…', color:'#00D7C8', msg:'Je voudrais voir un médecin de famille' },
  { icon:'🦵', title:'Physiothérapie',          sub:'CNESST · SAAQ · Sport · Post-op',    color:'#00E5A0', msg:"J'ai besoin de physiothérapie" },
  { icon:'🧠', title:'Psychologie',             sub:'TCC · Anxiété · Dépression',          color:'#8B5CF6', msg:'Je voudrais consulter un psychologue' },
  { icon:'🍎', title:'Nutrition',               sub:'Diabète · Poids · Cholestérol',       color:'#F9A826', msg:'Je veux voir une nutritionniste' },
  { icon:'👶', title:'Pédiatrie',               sub:'Enfants · Vaccination · Urgence',     color:'#EC4899', msg:'Mon enfant a besoin de soins' },
  { icon:'🩸', title:'Prises de sang',          sub:'Ordonnance requise · 15 min',         color:'#EF4444', msg:'Je veux faire une prise de sang' },
  { icon:'🦺', title:'CNESST / Accident travail',sub:'Physio · Ergo · Dossier',            color:'#F9A826', msg:"J'ai eu un accident de travail, j'ai besoin de physiothérapie CNESST" },
  { icon:'🚗', title:'SAAQ / Accident auto',    sub:'Physio · Réadaptation · Réclamation', color:'#00D7C8', msg:"J'ai eu un accident de voiture, j'ai besoin de physiothérapie SAAQ" },
  { icon:'💊', title:'Renouvellement ordo',     sub:'24-48h · Votre médecin',              color:'#00E5A0', msg:'Je dois renouveler mon ordonnance' },
  { icon:'🌡️', title:'Clinique sans RDV',       sub:'Urgences mineures · Même jour',       color:'#EC4899', msg:"J'ai besoin d'une consultation urgente aujourd'hui" },
];

function ScreenServices({ T, onBack, onBook, onNav, onSelectService }: any) {
  return (
    <div style={{height:'100vh',background:T.bg,display:'flex',flexDirection:'column',maxWidth:420,margin:'0 auto',color:T.text,fontFamily:"'Inter',sans-serif"}}>
      <div style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:12,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:T.muted,fontSize:18}}>←</button>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:16,color:T.text,flex:1}}>Nos services</div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'12px 14px 80px',display:'flex',flexDirection:'column',gap:8}}>
        {SERVICES_LIST.map((s,i)=>(
          <button key={i} onClick={()=>onSelectService(s.msg)} style={{width:'100%',padding:'14px 16px',background:T.s1,border:`1px solid ${T.border}`,borderRadius:13,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:14,borderLeft:`3px solid ${s.color}`}}>
            <div style={{width:40,height:40,borderRadius:11,background:`${s.color}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{s.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:700,color:T.text}}>{s.title}</div>
              <div style={{fontSize:11,color:T.muted,marginTop:2}}>{s.sub}</div>
            </div>
            <div style={{fontSize:16,color:T.muted}}>→</div>
          </button>
        ))}
      </div>
      <NavBar active="svc" T={T} onMic={onBook} onNav={onNav} inChat={false}/>
    </div>
  );
}

// ── ÉCRAN PROFIL ──────────────────────────────────────────────
function ScreenProfil({ T, onBack, onNav, theme, setTheme }: any) {
  const [profile, setProfile] = useState({ name:'', phone:'', email:'', lang:'fr' });
  useEffect(() => {
    try { const p = JSON.parse(localStorage.getItem('vitara_profile') || '{}'); if(p.name) setProfile(p); } catch {}
  }, []);
  const appointments = (() => { try { return JSON.parse(localStorage.getItem('vitara_appointments') || '[]'); } catch { return []; } })();

  return (
    <div style={{height:'100vh',background:T.bg,display:'flex',flexDirection:'column',maxWidth:420,margin:'0 auto',color:T.text,fontFamily:"'Inter',sans-serif"}}>
      <div style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:12,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:T.muted,fontSize:18}}>←</button>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:16,color:T.text,flex:1}}>Mon profil</div>
        <button onClick={()=>setTheme((t:string)=>t==='dark'?'light':'dark')} style={{padding:'5px 10px',background:T.glass,border:`1px solid ${T.border}`,borderRadius:18,fontSize:11,color:T.text,cursor:'pointer',backdropFilter:'blur(8px)'}}>
          {theme==='dark'?'☀️ Clair':'🌙 Sombre'}
        </button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'16px 16px 80px'}}>

        {/* Avatar */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'20px 0 24px'}}>
          <div style={{width:72,height:72,borderRadius:'50%',background:`linear-gradient(135deg,${T.teal},${T.purple})`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Space Grotesk',sans-serif",fontSize:26,fontWeight:700,color:'white',marginBottom:12}}>
            {profile.name ? profile.name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:17,fontWeight:700,color:T.text}}>{profile.name || 'Invité'}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:3}}>Patient VITARA</div>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
          {[
            { label:'RDV pris', value: appointments.length, icon:'📅', color:T.teal },
            { label:'Via VITARA AI', value: appointments.length, icon:'🤖', color:T.purple },
          ].map(s=>(
            <div key={s.label} style={{padding:'14px',background:T.s1,border:`1px solid ${T.border}`,borderRadius:12,textAlign:'center'}}>
              <div style={{fontSize:24,marginBottom:4}}>{s.icon}</div>
              <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:22,fontWeight:700,color:s.color}}>{s.value}</div>
              <div style={{fontSize:10,color:T.muted}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Infos */}
        <div style={{background:T.s1,border:`1px solid ${T.border}`,borderRadius:13,overflow:'hidden',marginBottom:12}}>
          {[
            { icon:'📱', label:'Téléphone',   value: profile.phone || 'Non renseigné' },
            { icon:'📧', label:'Courriel',    value: profile.email || 'Non renseigné' },
            { icon:'🌐', label:'Langue',      value: profile.lang === 'fr' ? 'Français' : profile.lang === 'en' ? 'English' : 'العربية' },
          ].map((f,i,arr)=>(
            <div key={f.label} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',borderBottom:i<arr.length-1?`1px solid ${T.border}`:'none'}}>
              <span style={{fontSize:16}}>{f.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:T.muted}}>{f.label}</div>
                <div style={{fontSize:13,color:T.text,fontWeight:500}}>{f.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Liens */}
        <a href="/patient-portal" style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:T.s1,border:`1px solid ${T.border}`,borderRadius:13,textDecoration:'none',marginBottom:10,cursor:'pointer'}}>
          <span style={{fontSize:18}}>🏥</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:T.text}}>Portail patient complet</div>
            <div style={{fontSize:11,color:T.muted}}>Dossier · Assurances · Documents</div>
          </div>
          <span style={{color:T.teal,fontSize:16}}>→</span>
        </a>

        <button onClick={()=>{ localStorage.removeItem('vitara_appointments'); localStorage.removeItem('vitara_profile'); window.location.reload(); }}
          style={{width:'100%',padding:'12px',background:'transparent',border:`1px solid ${T.urgent}44`,borderRadius:11,color:T.urgent,fontSize:12,cursor:'pointer'}}>
          Effacer mes données locales
        </button>
      </div>
      <NavBar active="prof" T={T} onMic={()=>{}} onNav={onNav} inChat={false}/>
    </div>
  );
}


function NavBar({ active, T, onMic, onNav, inChat }:any) {
  const items = [
    {id:'home',icon:'🏠',label:'Accueil'},
    {id:'rdv', icon:'📅',label:'RDV'},
    {id:'mic', icon:'🎤',label:'',special:true},
    {id:'svc', icon:'🩺',label:'Services'},
    {id:'prof',icon:'👤',label:'Profil'},
  ];
  return (
    <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:420,padding:'5px 16px 11px',background:T.glass,borderTop:`1px solid ${T.border}`,backdropFilter:'blur(16px)',display:'flex',alignItems:'center',justifyContent:'space-around',zIndex:100}}>
      {items.map(item=>(
        item.special
          ? <button key="mic" onClick={onMic} style={{width:50,height:50,borderRadius:'50%',background:`linear-gradient(135deg,#00D7C8,#8B5CF6)`,border:`3px solid transparent`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,cursor:'pointer',boxShadow:'0 4px 14px rgba(0,215,200,.45)',marginTop:-13}}>🎤</button>
          : <button key={item.id} onClick={()=>onNav(item.id)} style={{background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'4px 5px'}}>
              <span style={{fontSize:17,opacity:active===item.id?1:.45}}>{item.icon}</span>
              <span style={{fontSize:9,color:active===item.id?T.teal:T.muted,fontWeight:active===item.id?600:400}}>{item.label}</span>
            </button>
      ))}
    </div>
  );
}
