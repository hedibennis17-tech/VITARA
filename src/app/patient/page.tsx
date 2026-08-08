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

// ── SERVICES HOME — vraies images par rubrique ───────────────
const SERVICES_HOME = [
  { id:'urgences',  title:'Urgences',            sub:'Consultation urgente · Même jour',   img:'/services/urgences.png',  color:'#EF4444', urgent:true,  msg:"J'ai besoin d'une consultation urgente aujourd'hui, c'est important",                                          full:true  },
  { id:'pediatrie', title:'Pédiatrie',            sub:'Soins pour enfants',        img:'/services/pediatrie.jpg', color:'#EC4899', urgent:false, msg:"Mon enfant a besoin de soins médicaux",                              full:false },
  { id:'rdv',       title:'Rendez-vous',          sub:'Prendre ou annuler',        img:'/services/rdv.jpg',       color:'#00D7C8', urgent:false, msg:"Je voudrais prendre un rendez-vous",                                 full:false },
  { id:'cnesst',    title:'Accident de travail',  sub:'CNESST · SAAQ',             img:'/services/cnesst.jpg',    color:'#F9A826', urgent:false, msg:"J'ai eu un accident de travail, j'ai besoin de physiothérapie CNESST", full:false },
  { id:'physio',    title:'Physiothérapie',       sub:'Réadaptation · Sport',      img:'/services/physio.jpg',    color:'#00E5A0', urgent:false, msg:"J'ai besoin de physiothérapie",                                      full:false },
  { id:'medecins',  title:'Médecins de famille',  sub:'9 médecins GMF disponibles',img:'/services/medecins.jpg', color:'#8B5CF6', urgent:false, msg:"Je veux consulter un médecin de famille",                            full:true  },
];

// Compatibilité avec les écrans Services et Messages rapides
const QUICK = SERVICES_HOME.map(s => ({ i:'', l:s.title, m:s.msg }));

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
// ── PHOTOS agents ────────────────────────────────────────────
const AGENT_PHOTO: Record<string,string> = {
  houda: '/agents/houda.png',
  said:  '/agents/said.png',
  alain: '/agents/alain.png',
  hayet: '/agents/hayet.jpg',
};
const AGENT_POS: Record<string,string> = {
  houda: 'center 22%',  // cadre déjà dans l'image (cercle ECG)
  said:  'center 15%',  // nouveau: homme costume bleu + ECG
  alain: 'center 18%',  // nouveau: homme chemise noire + ECG
  hayet: 'center 20%',  // nouveau: femme costume noir + ECG
};

// ═══════════════════════════════════════════════════════════
// VITARA AI_VOICE_PERSONAS v2.0 — Source of truth
// Chaque agent a son propre voice_id distinct + paramètres
// ═══════════════════════════════════════════════════════════
const VOICE_CONFIG: Record<string, {
  gender:  'female' | 'male';
  pitch:   number;   // Web Speech API: 0.5–2.0
  rate:    number;
  volume:  number;
  pauseMs: number;
  label:   string;
  preview: Record<string, string>; // texte preview par langue
}> = {
  houda: {
    gender:'female', pitch:1.15, rate:0.90, volume:0.95, pauseMs:250,
    label:'Voix féminine',
    preview:{
      fr:'Bonjour, je suis Houda, votre assistante médicale VITARA. Comment puis-je vous aider ?',
      en:"Hello, I'm Houda, VITARA's medical assistant. How can I help?",
      ar:'مرحباً، أنا هدى، مساعدتك الطبية في فيتارا.',
    },
  },
  hayet: {
    gender:'female', pitch:1.12, rate:0.96, volume:0.95, pauseMs:250,
    label:'Voix féminine',
    preview:{
      fr:'Bonjour, je suis Hayet. Je suis là pour vous aider à planifier vos soins.',
      en:"Hello, I'm Hayet. I'm here to help you schedule your care.",
      ar:'مرحباً، أنا حياة. أنا هنا لمساعدتك.',
    },
  },
  said: {
    gender:'male', pitch:0.80, rate:0.92, volume:0.96, pauseMs:280,
    label:'Voix masculine',
    preview:{
      fr:'Bonjour, je suis Said, votre assistant médical VITARA. Je vais vous aider à trouver le bon rendez-vous.',
      en:"Hello, I'm Said, your VITARA medical assistant. I'll help you find the right appointment.",
      ar:'مرحباً، أنا سعيد. سأساعدك في العثور على موعد مناسب.',
    },
  },
  alain: {
    gender:'male', pitch:0.70, rate:0.90, volume:0.97, pauseMs:320,
    label:'Voix masculine mature',
    preview:{
      fr:'Bonjour, je suis Alain, votre assistant VITARA. Je vais vérifier les disponibilités pour vous.',
      en:"Hello, I'm Alain, your VITARA assistant. I'll check the available appointments for you.",
      ar:'مرحباً، أنا آلان. سأتحقق من المواعيد المتاحة.',
    },
  },
};

// ── Mots-clés pour détection de genre dans le nom de voix ──
const FEMALE_KW = ['amélie','audrey','virginie','marie','alice','julie','samantha','karen','moira','fiona','victoria','tessa','female','femme','google uk english female','anna'];
const MALE_KW   = ['thomas','nicolas','daniel','alex','oliver','james','luca','henrik','male','homme','google uk english male'];

function voiceGender(v: SpeechSynthesisVoice): 'female'|'male'|'unknown' {
  const n = v.name.toLowerCase();
  if (MALE_KW.some(k   => n.includes(k))) return 'male';
  if (FEMALE_KW.some(k => n.includes(k))) return 'female';
  return 'unknown';
}

// ── Assigner des voice_id DISTINCTS à chaque agent ───────────
// Appelé une fois quand les voix sont chargées
function buildVoiceAssignments(
  voices: SpeechSynthesisVoice[],
  lang:   string
): Record<string, SpeechSynthesisVoice | null> {
  const code = lang === 'ar' ? 'ar' : lang === 'en' ? 'en' : 'fr';
  const pool  = voices.filter(v => v.lang.toLowerCase().startsWith(code));
  const src   = pool.length > 0 ? pool : voices;

  // Séparer par genre détecté
  const females  = src.filter(v => voiceGender(v) === 'female');
  const males    = src.filter(v => voiceGender(v) === 'male');
  const unknowns = src.filter(v => voiceGender(v) === 'unknown');

  // Voix féminine (Houda, Hayet) — même pool, pitch différenciera
  const femVoice  = females[0] || unknowns[0] || src[0];

  // Voix masculines — DEUX voice_id DISTINCTS si possible
  const male1 = males[0]  || unknowns[1] || src[Math.min(1, src.length - 1)];
  const male2 = males[1]  // deuxième voix masculine = DIFFERENT de male1
              || males[0]  // si une seule voix male → même voix, pitch compensera
              || unknowns[2]
              || src[Math.min(2, src.length - 1)];

  return {
    houda: femVoice,
    hayet: femVoice,   // même voix femelle, pitch/rate différents
    said:  male1,      // voice_id 1 masculin
    alain: male2,      // voice_id 2 masculin (distinct si possible)
  };
}

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
  const greeted    = useRef(false);
  const histRef    = useRef(hist);
  const langRef    = useRef(lang);
  const agentRef   = useRef(agent);
  const voiceMap   = useRef<Record<string, SpeechSynthesisVoice | null>>({});
  const convState  = useRef<Record<string,any>>({});
  const skipDisplay = useRef(false); // évite double affichage msg patient (startSession + sendMsg)

  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    setMounted(true);
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;

      // Charger et assigner les voix dès qu'elles sont disponibles
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          voiceMap.current = buildVoiceAssignments(voices, langRef.current);
          // Log pour debug
          console.log('[VITARA Voices]', {
            houda: voiceMap.current.houda?.name,
            hayet: voiceMap.current.hayet?.name,
            said:  voiceMap.current.said?.name,
            alain: voiceMap.current.alain?.name,
          });
        }
      };

      // Les voix se chargent de façon asynchrone sur certains navigateurs
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => { s.remove(); };
  }, []);

  // Réassigner les voix quand la langue change
  useEffect(() => {
    langRef.current = lang;
    if (synthRef.current) {
      const voices = synthRef.current.getVoices();
      if (voices.length > 0) {
        voiceMap.current = buildVoiceAssignments(voices, lang);
      }
    }
  }, [lang]);

  useEffect(() => { histRef.current  = hist;  }, [hist]);
  useEffect(() => { agentRef.current = agent; }, [agent]);
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }); }, [msgs, slots, load]);

  const T = theme === 'dark' ? DARK : LIGHT;

  // ── Synthèse vocale ──────────────────────────────────────
  // Référence à l'audio ElevenLabs en cours
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (t: string) => {
    if (!mounted) return;
    const agentId = agentRef.current.id;

    // Arrêter tout audio en cours
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    synthRef.current?.cancel();

    // ── 1. ElevenLabs (vraies voix humaines) ─────────────────
    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t, agent: agentId }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onplay   = () => setVState('speaking');
        audio.onended  = () => { setVState('idle'); URL.revokeObjectURL(url); audioRef.current = null; };
        audio.onerror  = () => { setVState('idle'); URL.revokeObjectURL(url); audioRef.current = null; };
        try {
          await audio.play();
          return; // ← ElevenLabs OK, on s'arrête ici
        } catch (playErr) {
          // Autoplay bloqué par le navigateur (mobile) → fallback Web Speech
          console.warn('[TTS] Autoplay bloqué:', playErr);
          URL.revokeObjectURL(url);
          audioRef.current = null;
        }
      }
      // 501 = clé manquante → fallback Web Speech sans log d'erreur
      if (res.status !== 501) console.warn('[TTS] ElevenLabs error', res.status);
    } catch (e) {
      console.warn('[TTS] ElevenLabs fetch failed:', e);
    }

    // ── 2. Fallback: Web Speech API (si ElevenLabs non dispo) ─
    if (!synthRef.current) { setVState('idle'); return; }
    try {
      const cfg = VOICE_CONFIG[agentId] || VOICE_CONFIG.houda;
      const l   = langRef.current;
      const u   = new SpeechSynthesisUtterance(t);
      u.lang    = l === 'ar' ? 'ar-SA' : l === 'en' ? 'en-US' : 'fr-FR';
      u.pitch   = cfg.pitch;
      u.rate    = cfg.rate;
      u.volume  = cfg.volume;
      const v   = voiceMap.current[agentId];
      if (v) u.voice = v;
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

    // N'ajouter le message au chat QUE si startSession ne l'a pas déjà affiché
    if (skipDisplay.current) {
      skipDisplay.current = false; // reset pour les prochains messages
    } else {
      setMsgs(p => [...p, { role: 'patient', text: txt }]);
    }
    setInp(''); setLoad(true); setVState('thinking');

    try {
      // Garde-fou: max 10 messages → évite de dépasser la context window Groq
      const trimmed = fullHist.slice(-10);
      const safeHist = trimmed[0]?.role !== 'user' ? trimmed.slice(1) : trimmed;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:           safeHist,
          language:           currentLang,
          max_tokens:         300,
          agent:              agentRef.current.id,
          gender:             agentRef.current.id === 'said' || agentRef.current.id === 'alain' ? 'male' : 'female',
          conversation_state: convState.current,  // ← Envoyer l'état actuel
        }),
      });

      const data = await res.json() as any;
      const raw = (data.content?.[0]?.text || '{}')
        .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let parsed: any;
      try { parsed = JSON.parse(raw); } catch { parsed = { speak: raw, intent: 'info' }; }

      // ── Mettre à jour Conversation Memory ────────────────────
      // L'IA retourne les champs extraits dans parsed.state
      if (parsed.state && typeof parsed.state === 'object' && Object.keys(parsed.state).length > 0) {
        convState.current = { ...convState.current, ...parsed.state };
      }
      // L'API retourne aussi conversation_state mis à jour côté serveur
      if (data.conversation_state && typeof data.conversation_state === 'object') {
        convState.current = { ...convState.current, ...data.conversation_state };
      }

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

      // Valider que le booking est complet avant de naviguer vers 'done'
      // Groq peut retourner un booking partiel → crash si on navigue trop tôt
      const b = parsed.booking;
      if (b && b.date && b.time && b.provider && b.code) {
        setBooking(b);
        setTimeout(() => setScreen('done'), 900);
      }

      setVState(parsed.intent === 'emergency' ? 'idle' : 'speaking');

      // speak() est async — on ne l'attend pas pour ne pas bloquer l'UI
      // mais on attrape toute erreur non-catchée
      speak(aiTxt).catch((e: any) => {
        console.warn('[speak]', e);
        setVState('idle');
      });

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
  const startSession = useCallback((a: typeof AGENTS[0], l: string = 'fr', initialMsg?: string) => {
    synthRef.current?.cancel();
    setAgent(a); setLang(l); langRef.current = l;
    setScreen('chat'); setVocal(false);
    // Ne réinitialiser que si pas déjà dans une session
    if (!greeted.current) {
      greeted.current = true;
      setMsgs([]); setHist([]); histRef.current = [];
      setBooking(null); setSlots(null); setSel(null);
      convState.current = {}; // Reset Conversation Memory pour nouvelle session

      // Genre de l'agent — said et alain = masculin, houda et hayet = féminin
      const isMale = a.id === 'said' || a.id === 'alain';
      const g = l === 'fr'
        ? `Bonjour ! Je suis ${a.name}, votre ${isMale ? 'assistant médical' : 'assistante médicale'}. Êtes-vous un nouveau patient ou avez-vous déjà un dossier chez nous ?`
        : l === 'en'
        ? `Hello! I'm ${a.name}, your medical assistant. Are you a new or existing patient?`
        : isMale
          ? `مرحباً! أنا ${a.name}، مساعدك الطبي. هل أنت مريض جديد؟`
          : `مرحباً! أنا ${a.name}، مساعدتك الطبية. هل أنت مريض جديد؟`;
      // BUG FIX: le greeting va dans msgs (affichage) mais PAS dans hist
      // Groq rejette si messages[0].role === 'assistant'
      // hist reste vide → le premier appel API aura messages[0].role === 'user' ✓
      if (initialMsg) {
        // Service card: afficher le message patient SEULEMENT
        // Le greeting est parlé vocalement mais PAS ajouté au chat ici
        // sendMsg ajoutera la réponse de l'agent comme 1er message chat
        setMsgs([{ role: 'patient', text: initialMsg }]);
        skipDisplay.current = true; // sendMsg ne doit PAS rajouter le même message
        // Parler le greeting vocalement avec un léger délai
        setTimeout(() => speak(g), 300);
      } else {
        // Chat direct (mic ou bouton): afficher le greeting dans le chat
        setMsgs([{ role: 'ai', text: g }]);
        setTimeout(() => speak(g), 500);
      }
      setHist([]); histRef.current = [];
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
        startSession(agent, lang, msg);
        setTimeout(()=>sendMsg(msg), 900);
      }}/>
  );

  if (screen === 'profil') return (
    <ScreenProfil T={T} onBack={()=>setScreen('home')} onNav={navHandler} theme={theme} setTheme={setTheme}/>
  );

  // ── HOME ─────────────────────────────────────────────────
  if (screen === 'home') return (
    <div style={{height:'100vh',background:T.bg,fontFamily:"'Inter',sans-serif",color:T.text,display:'flex',flexDirection:'column',maxWidth:420,margin:'0 auto'}}>

      {/* Header */}
      <div style={{padding:'12px 18px 10px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,borderBottom:`1px solid ${T.border}`}}>
        <div>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:15,color:T.text,lineHeight:1.15}}>Clinique Médicale JOLIBOURG</div>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:600,fontSize:12,color:T.teal,marginTop:1}}>Laval</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:8,color:T.muted}}>Créé par</div>
            <div style={{fontSize:10,color:T.teal,fontWeight:700,fontFamily:"'Space Grotesk',sans-serif"}}>Hedi Bennis</div>
          </div>
          <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} style={{width:28,height:28,background:T.glass,border:`1px solid ${T.border}`,borderRadius:8,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'}}>
            {theme==='dark'?'☀️':'🌙'}
          </button>
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
            {/* Vraies photos rondes superposées */}
            <div style={{display:'flex',alignItems:'center'}}>
              {AGENTS.map((a,i)=>{
                const ext=a.id==='hayet'?'jpg':'png';
                return (
                  <div key={a.id} style={{
                    width:30,height:30,borderRadius:'50%',
                    border:`2px solid ${T.bg}`,
                    marginLeft:i?-9:0,
                    overflow:'hidden',
                    background:T.s2,
                    flexShrink:0,
                    boxShadow:`0 0 0 1px ${a.color}66`,
                  }}>
                    <img src={`/agents/${a.id}.${ext}`} alt={a.name}
                      style={{width:'100%',height:'100%',objectFit:'cover',
                        objectPosition:a.id==='houda'?'center 20%':a.id==='said'?'center 12%':a.id==='alain'?'center 15%':'center 18%'
                      }}/>
                  </div>
                );
              })}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:T.text,fontFamily:"'Space Grotesk',sans-serif"}}>Choisir votre agent</div>
              <div style={{fontSize:10,color:T.muted,marginTop:1}}>Houda · Said · Hayet · Alain · FR EN AR</div>
            </div>
            <div style={{width:23,height:23,borderRadius:'50%',background:`linear-gradient(135deg,${T.teal},${T.purple})`,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:11}}>→</div>
          </button>
        </div>

        {/* ── Rubriques services avec vraies images ── */}
        <div style={{padding:'10px 14px 0'}}>
          <div style={{fontSize:10,fontWeight:600,color:T.muted,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Nos services</div>

          {/* URGENCES — pleine largeur, rouge, proéminent */}
          <button onClick={()=>{ greeted.current=false; startSession(agent,'fr',"J'ai besoin d'une consultation urgente aujourd'hui"); setTimeout(()=>sendMsg("J'ai besoin d'une consultation urgente aujourd'hui"),900); }}
            style={{width:'100%',height:90,borderRadius:14,overflow:'hidden',position:'relative',border:'none',cursor:'pointer',padding:0,marginBottom:8,display:'block'}}>
            <img src="/services/urgences.png" alt="Urgences" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}}/>
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to right,rgba(239,68,68,0.75),rgba(0,0,0,0.4))'}}/>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',padding:'0 20px',gap:12}}>
              <span style={{fontSize:28}}>🚨</span>
              <div style={{textAlign:'left'}}>
                <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:18,fontWeight:800,color:'white',letterSpacing:'-.01em'}}>URGENCES</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.85)'}}>Appelez le 911 si situation vitale</div>
              </div>
            </div>
            <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:'#EF4444'}}/>
          </button>

          {/* Grille 2 colonnes */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {SERVICES_HOME.filter(s=>!s.full).map(s=>(
              <button key={s.id}
                onClick={()=>{ greeted.current=false; startSession(agent,'fr',s.msg); setTimeout(()=>sendMsg(s.msg),900); }}
                style={{height:130,borderRadius:13,overflow:'hidden',position:'relative',border:'none',cursor:'pointer',padding:0}}>
                <img src={s.img} alt={s.title} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}}/>
                {/* Gradient sombre en bas */}
                <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,rgba(0,0,0,0.05) 30%,rgba(0,0,0,0.80) 100%)'}}/>
                {/* Texte */}
                <div style={{position:'absolute',bottom:10,left:11,right:11,textAlign:'left'}}>
                  <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,fontWeight:700,color:'white',lineHeight:1.2}}>{s.title}</div>
                  <div style={{fontSize:9,color:'rgba(255,255,255,0.75)',marginTop:2}}>{s.sub}</div>
                </div>
                {/* Barre couleur en bas */}
                <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:s.color}}/>
              </button>
            ))}
          </div>

          {/* Médecins de famille — pleine largeur */}
          {SERVICES_HOME.filter(s=>s.full && s.id!=='urgences').map(s=>(
            <button key={s.id}
              onClick={()=>{ greeted.current=false; startSession(agent,'fr',s.msg); setTimeout(()=>sendMsg(s.msg),900); }}
              style={{width:'100%',height:110,borderRadius:13,overflow:'hidden',position:'relative',border:'none',cursor:'pointer',padding:0,marginTop:8,display:'block'}}>
              <img src={s.img} alt={s.title} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 20%'}}/>
              <div style={{position:'absolute',inset:0,background:'linear-gradient(to right,rgba(139,92,246,0.75) 0%,rgba(0,0,0,0.3) 60%)'}}/>
              <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',padding:'0 20px',gap:14}}>
                <span style={{fontSize:26}}>👨‍⚕️</span>
                <div style={{textAlign:'left'}}>
                  <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:15,fontWeight:700,color:'white'}}>{s.title}</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.82)'}}>{s.sub}</div>
                </div>
                <div style={{marginLeft:'auto',width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'white'}}>→</div>
              </div>
              <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:s.color}}/>
            </button>
          ))}
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
      {/* Crédit — visible en bas de l'accueil */}
      <div style={{textAlign:'center',padding:'6px 0 72px',background:'transparent'}}>
        <span style={{fontSize:9,color:T.muted,letterSpacing:'.06em'}}>Créé par </span>
        <span style={{fontSize:9,color:T.teal,fontWeight:700,letterSpacing:'.06em'}}>Hedi Bennis</span>
      </div>
    </div>
  );


  // ── AGENTS ────────────────────────────────────────────────
  if (screen === 'agents') return (
    <div style={{height:'100vh',background:T.bg,color:T.text,fontFamily:"'Inter',sans-serif",display:'flex',flexDirection:'column',maxWidth:420,margin:'0 auto',overflow:'hidden'}}>

      {/* Header */}
      <div style={{padding:'14px 18px 10px',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <button onClick={()=>setScreen('home')} style={{background:'none',border:'none',cursor:'pointer',color:T.muted,fontSize:20,padding:4}}>←</button>
        <div style={{flex:1,textAlign:'center',fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15}}>Choisir votre agent</div>
        <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} style={{width:32,height:32,background:T.glass,border:`1px solid ${T.border}`,borderRadius:9,cursor:'pointer',fontSize:14,backdropFilter:'blur(6px)'}}>
          {theme==='dark'?'☀️':'🌙'}
        </button>
      </div>

      {/* ── Sélecteur horizontal — photos rondes ── */}
      <div style={{display:'flex',justifyContent:'center',gap:16,padding:'4px 18px 16px',flexShrink:0}}>
        {AGENTS.map((a,i)=>{
          const ext=a.id==='hayet'?'jpg':'png';
          const active=aIdx===i;
          return (
            <button key={a.id} onClick={()=>setAIdx(i)}
              style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',padding:'2px',flexShrink:0}}>
              <div style={{width:70,height:70,borderRadius:'50%',padding:active?3:2,
                background:active?`conic-gradient(${a.color},${a.color}66,${a.color})`:`${T.border}`,
                boxShadow:active?`0 0 18px ${a.color}55`:'none',transition:'all .35s'}}>
                <div style={{width:'100%',height:'100%',borderRadius:'50%',overflow:'hidden',background:T.s2}}>
                  <img src={`/agents/${a.id}.${ext}`} alt={a.name} style={{width:'100%',height:'100%',objectFit:'cover',
                    objectPosition:a.id==='houda'?'center 22%':a.id==='said'?'center 15%':a.id==='alain'?'center 18%':'center 20%'}}/>
                </div>
              </div>
              <div style={{fontSize:11,fontWeight:active?700:500,color:active?a.color:T.muted,fontFamily:"'Space Grotesk',sans-serif",transition:'color .3s'}}>{a.name}</div>
              <div style={{width:active?18:4,height:4,borderRadius:2,background:active?a.color:'transparent',transition:'all .35s'}}/>
            </button>
          );
        })}
      </div>

      {/* ── Carte détail ── */}
      <div style={{flex:1,overflowY:'auto',padding:'0 14px 80px'}}>
        <div key={curAgent.id} style={{animation:'slideIn .3s ease'}}>

          {/* Photo + infos */}
          <div style={{background:T.glass,border:`1px solid ${curAgent.color}44`,borderRadius:22,overflow:'hidden',marginBottom:12,position:'relative',backdropFilter:'blur(16px)'}}>
            <div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse at 50% 0%,${curAgent.color}18,transparent 60%)`}}/>

            {/* Grande photo ronde centrée */}
            <div style={{display:'flex',justifyContent:'center',padding:'22px 0 16px',position:'relative',zIndex:1}}>
              <div style={{width:150,height:150,borderRadius:'50%',padding:3,
                background:`conic-gradient(${curAgent.color},${curAgent.color}55,${curAgent.color})`,
                boxShadow:`0 0 30px ${curAgent.color}50`}}>
                <div style={{width:'100%',height:'100%',borderRadius:'50%',overflow:'hidden',background:T.bg}}>
                  <img src={`/agents/${curAgent.id}.${curAgent.id==='hayet'?'jpg':'png'}`} alt={curAgent.name}
                    style={{width:'100%',height:'100%',objectFit:'cover',
                      objectPosition:curAgent.id==='houda'?'center 22%':curAgent.id==='said'?'center 15%':curAgent.id==='alain'?'center 18%':'center 20%'}}/>
                </div>
              </div>
            </div>

            {/* Nom + statut */}
            <div style={{textAlign:'center',padding:'0 20px 18px',position:'relative',zIndex:1}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:3}}>
                <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:22,fontWeight:800,color:T.text}}>{curAgent.name}</span>
                <span style={{fontSize:9,padding:'3px 9px',background:`${curAgent.color}22`,color:curAgent.color,borderRadius:20,fontWeight:700,border:`1px solid ${curAgent.color}44`}}>● En ligne</span>
              </div>
              <div style={{fontSize:12,color:T.muted,marginBottom:12}}>{curAgent.role}</div>

              {/* Langues disponibles — flags + labels */}
              <div style={{display:'flex',justifyContent:'center',gap:7,flexWrap:'wrap',marginBottom:10}}>
                {[{l:'fr',f:'🇫🇷',n:'Français'},{l:'en',f:'🇬🇧',n:'English'},{l:'ar',f:'🇸🇦',n:'العربية'}]
                  .filter(({l})=>curAgent.langs.includes(l))
                  .map(({l,f,n})=>(
                  <div key={l} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',background:`${curAgent.color}15`,border:`1px solid ${curAgent.color}33`,borderRadius:20}}>
                    <span style={{fontSize:15}}>{f}</span>
                    <span style={{fontSize:11,color:curAgent.color,fontWeight:600}}>{n}</span>
                  </div>
                ))}
              </div>

              {/* Badge voix */}
              <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 14px',
                background:VOICE_CONFIG[curAgent.id]?.gender==='female'?`${T.pink}18`:`${T.teal}18`,
                border:`1px solid ${VOICE_CONFIG[curAgent.id]?.gender==='female'?T.pink:T.teal}44`,borderRadius:20}}>
                <span style={{fontSize:13}}>🎙️</span>
                <span style={{fontSize:11,fontWeight:600,color:VOICE_CONFIG[curAgent.id]?.gender==='female'?T.pink:T.teal}}>
                  {VOICE_CONFIG[curAgent.id]?.label || 'Voix IA'}
                </span>
              </div>
            </div>
          </div>

          {/* Sélection langue */}
          <div style={{background:T.glass,border:`1px solid ${T.border}`,borderRadius:14,padding:'14px',marginBottom:10,backdropFilter:'blur(8px)'}}>
            <div style={{fontSize:10,color:T.muted,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10,textAlign:'center'}}>Langue de conversation</div>
            <div style={{display:'flex',gap:8}}>
              {[{l:'fr',f:'🇫🇷',n:'Français'},{l:'en',f:'🇬🇧',n:'English'},{l:'ar',f:'🇸🇦',n:'العربية'}].map(({l,f,n})=>(
                curAgent.langs.includes(l) && (
                  <button key={l} onClick={()=>setLang(l)}
                    style={{flex:1,padding:'10px 6px',background:lang===l?`${curAgent.color}22`:T.s2,
                      border:`2px solid ${lang===l?curAgent.color:T.border}`,borderRadius:11,cursor:'pointer',textAlign:'center',transition:'all .2s'}}>
                    <div style={{fontSize:22,marginBottom:4}}>{f}</div>
                    <div style={{fontSize:10,color:lang===l?curAgent.color:T.muted,fontWeight:lang===l?700:400}}>{n}</div>
                  </button>
                )
              ))}
            </div>
          </div>

          {/* Écouter voix */}
          <button onClick={()=>{ const cfg=VOICE_CONFIG[curAgent.id]; speak(cfg?.preview?.[lang]||cfg?.preview?.fr||`Bonjour, je suis ${curAgent.name}.`); }}
            style={{width:'100%',marginBottom:10,padding:'12px',background:T.glass,border:`1.5px solid ${curAgent.color}66`,borderRadius:13,color:curAgent.color,fontSize:13,fontWeight:600,cursor:'pointer',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            🔊 Écouter la voix — 5 secondes
          </button>

          {/* CTA */}
          <button onClick={()=>{ greeted.current=false; startSession(curAgent,lang); }}
            style={{width:'100%',padding:'16px',background:`linear-gradient(135deg,${curAgent.color},${curAgent.color}BB)`,border:'none',borderRadius:15,color:'white',fontSize:15,fontWeight:800,cursor:'pointer',fontFamily:"'Space Grotesk',sans-serif",boxShadow:`0 8px 28px ${curAgent.color}50`,display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
            🎤 Parler avec {curAgent.name}
          </button>

          {/* Dots */}
          <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:16}}>
            {AGENTS.map((_,i)=><div key={i} style={{width:i===aIdx?22:6,height:5,borderRadius:3,background:i===aIdx?AGENTS[aIdx].color:T.border,transition:'all .3s'}}/>)}
          </div>
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
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',flexDirection:'column',color:T.text,fontFamily:'Inter,sans-serif',maxWidth:420,margin:'0 auto',overflowY:'auto'}}>

      {/* Header succès */}
      <div style={{background:'linear-gradient(135deg,rgba(0,215,200,.12),rgba(139,92,246,.12))',borderBottom:`1px solid ${T.border}`,padding:'24px 20px 16px',textAlign:'center'}}>
        <div style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#00E5A0,#00D7C8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,margin:'0 auto 12px',boxShadow:'0 0 24px rgba(0,215,200,.4)'}}>✓</div>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:20,fontWeight:800,color:T.text}}>Rendez-vous confirmé !</div>
        <div style={{fontSize:12,color:T.muted,marginTop:4}}>📱 SMS · 📧 Email envoyés à la clinique</div>
        {booking.code && (
          <div style={{marginTop:10,padding:'6px 16px',background:'rgba(0,215,200,.15)',border:'1px solid rgba(0,215,200,.35)',borderRadius:20,display:'inline-block'}}>
            <span style={{fontSize:11,color:T.muted}}>N° confirmation : </span>
            <span style={{fontSize:13,color:T.teal,fontWeight:800,fontFamily:'monospace'}}>{booking.code}</span>
          </div>
        )}
      </div>

      <div style={{padding:'14px 16px 100px',display:'flex',flexDirection:'column',gap:10}}>

        {/* RDV */}
        <div style={{background:T.s1,border:`2px solid ${agent.color}44`,borderRadius:14,overflow:'hidden'}}>
          <div style={{background:`${agent.color}18`,padding:'10px 14px',borderBottom:`1px solid ${agent.color}33`}}>
            <span style={{fontSize:11,fontWeight:700,color:agent.color,textTransform:'uppercase' as const,letterSpacing:'.08em'}}>📅 Rendez-vous</span>
          </div>
          <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:8}}>
            {([
              ['Date',          booking.date],
              ['Heure',         (booking.time||'') + (booking.duration?' · '+booking.duration:'')],
              ['Professionnel', booking.provider],
              ['Service',       booking.service || booking.dept],
              ['Mode',          booking.mode ? (booking.mode + (booking.room?' · '+booking.room:'')) : null],
              ['Payeur',        booking.payer],
            ] as [string,string|null][]).filter(([,v])=>v).map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}44`}}>
                <span style={{fontSize:11,color:T.muted}}>{k}</span>
                <span style={{fontSize:12,fontWeight:600,color:T.text,textAlign:'right',maxWidth:'60%'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Motif */}
        {(booking.reason || booking.body_part || booking.accident_type) && (
          <div style={{background:T.s1,border:`1px solid ${T.border}`,borderRadius:14,overflow:'hidden'}}>
            <div style={{background:'rgba(249,168,38,.1)',padding:'10px 14px',borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:11,fontWeight:700,color:'#F9A826',textTransform:'uppercase' as const,letterSpacing:'.08em'}}>🩺 Motif</span>
            </div>
            <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:7}}>
              {([
                ['Raison',    booking.reason],
                ['Zone',      booking.body_part],
                ['Type',      booking.accident_type && booking.accident_type !== 'null' ? booking.accident_type : null],
                ['N° dossier',booking.claim_number && booking.claim_number !== 'null' ? booking.claim_number : null],
              ] as [string,string|null][]).filter(([,v])=>v).map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:11,color:T.muted}}>{k}</span>
                  <span style={{fontSize:12,color:T.text,textAlign:'right',maxWidth:'65%'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Infos patient */}
        {(booking.patient_name || convState.current?.full_name?.value) && (
          <div style={{background:T.s1,border:`1px solid ${T.border}`,borderRadius:14,overflow:'hidden'}}>
            <div style={{background:'rgba(139,92,246,.1)',padding:'10px 14px',borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:11,fontWeight:700,color:T.purple,textTransform:'uppercase' as const,letterSpacing:'.08em'}}>👤 Patient</span>
            </div>
            <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:7}}>
              {([
                ['Nom',      booking.patient_name  || convState.current?.full_name?.value],
                ['Tél.',     booking.patient_phone  || convState.current?.phone?.value],
                ['Courriel', booking.patient_email  || convState.current?.email?.value],
                ['RAMQ',     booking.ramq           || (convState.current?.ramq_number?.value ? '****'+String(convState.current.ramq_number.value).slice(-4) : null)],
              ] as [string,string|null][]).filter(([,v])=>v).map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:11,color:T.muted}}>{k}</span>
                  <span style={{fontSize:12,color:T.text}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact clinique */}
        <div style={{background:T.s1,border:`1px solid ${T.border}`,borderRadius:14,padding:'12px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:T.text}}>Clinique Médicale JOLIBOURG</div>
            <div style={{fontSize:10,color:T.muted,marginTop:2}}>{booking.sms || '(514) 555-0100'}</div>
          </div>
          <a href="tel:5145550100" style={{padding:'7px 14px',background:'rgba(0,215,200,.15)',border:'1px solid rgba(0,215,200,.35)',borderRadius:9,color:T.teal,fontSize:11,fontWeight:700,textDecoration:'none'}}>📞 Appeler</a>
        </div>

        <a href="/patient-portal" style={{display:'block',padding:'13px',background:'linear-gradient(135deg,rgba(0,215,200,.15),rgba(139,92,246,.15))',border:'1px solid rgba(0,215,200,.35)',borderRadius:12,textDecoration:'none',textAlign:'center',color:T.teal,fontSize:13,fontWeight:700}}>
          📋 Voir dans mon portail patient →
        </a>

        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>{ setScreen('chat'); setBooking(null); }} style={{flex:1,padding:'12px',background:T.glass,border:`1px solid ${T.teal}`,borderRadius:11,color:T.teal,fontSize:13,fontWeight:600,cursor:'pointer',backdropFilter:'blur(6px)'}}>Autre demande</button>
          <button onClick={resetAll} style={{flex:1,padding:'12px',background:'linear-gradient(135deg,#00D7C8,#8B5CF6)',border:'none',borderRadius:11,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Terminer</button>
        </div>
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
        {/* Créneaux cliquables — confirmer au clic ou avec ✓ */}
        {slots&&(
          <div style={{animation:'fadeUp .3s ease',marginTop:4}}>
            <div style={{fontSize:11,color:T.muted,textAlign:'center',marginBottom:8,fontWeight:600}}>📅 Choisissez votre créneau :</div>
            {slots.map((s:any)=>(
              <button key={s.id} onClick={()=>{
                setSel(s.id);
                // Confirmer immédiatement au 2e clic ou après sélection
                if(sel === s.id) { confirmSlot(); }
              }} style={{width:'100%',marginBottom:8,padding:'13px 14px',background:sel===s.id?`${agent.color}22`:T.glass,border:`2px solid ${sel===s.id?agent.color:T.border}`,borderRadius:12,cursor:'pointer',textAlign:'left',backdropFilter:'blur(8px)',transition:'all .2s',position:'relative'}}>
                {sel===s.id&&<span style={{position:'absolute',top:10,right:12,fontSize:16,color:agent.color}}>✓</span>}
                <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:14,fontWeight:700,color:sel===s.id?agent.color:T.text,marginBottom:3}}>{s.label}</div>
                <div style={{fontSize:11,color:T.muted}}>{s.provider}</div>
                <div style={{fontSize:10,color:T.muted,marginTop:2}}>{s.dept}{s.duration?' · '+s.duration:''}</div>
              </button>
            ))}
            {sel&&(
              <button onClick={confirmSlot} style={{width:'100%',padding:'13px',background:`linear-gradient(135deg,${agent.color},${agent.color}CC)`,border:'none',borderRadius:12,color:'white',fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                ✓ Confirmer ce créneau
              </button>
            )}
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

        {/* Crédit */}
        <div style={{textAlign:'center',marginTop:20,paddingTop:16,borderTop:`1px solid ${T.border}`}}>
          <div style={{fontSize:10,color:T.muted}}>VITARA v1.0 · Clinique Médicale JOLIBOURG de Laval</div>
          <div style={{fontSize:11,color:T.teal,fontWeight:600,marginTop:4,fontFamily:"'Space Grotesk',sans-serif"}}>
            Créé par Hedi Bennis
          </div>
        </div>
      </div>
      <NavBar active="prof" T={T} onMic={()=>{}} onNav={onNav} inChat={false}/>
    </div>
  );
}


function NavBar({ active, T, onMic, onNav, inChat }:any) {
  const items = [
    {id:'home',icon:'🏠',label:'Accueil'},
    {id:'rdv', icon:'📅',label:'RDV'},
    {id:'mic', label:'',special:true},
    {id:'svc', icon:'🩺',label:'Services'},
    {id:'prof',icon:'👤',label:'Profil'},
  ];
  return (
    <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:420,
      padding:'0 10px 10px',background:T.glass,borderTop:`1px solid ${T.border}`,backdropFilter:'blur(20px)',
      display:'flex',alignItems:'flex-end',justifyContent:'space-around',zIndex:100,height:64}}>
      {items.map(item=>(
        item.special
          ? (
            /* ── Bouton mic — vrai cercle flottant surélevé ── */
            <div key="mic-wrap" style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:4}}>
              <button onClick={onMic} style={{
                width:58,height:58,borderRadius:'50%',
                background:'linear-gradient(135deg,#00D7C8,#8B5CF6)',
                border:'none',
                display:'flex',alignItems:'center',justifyContent:'center',
                cursor:'pointer',
                /* Surélevé au dessus de la barre */
                marginTop:-36,
                boxShadow:'0 6px 24px rgba(0,215,200,0.55), 0 2px 8px rgba(0,0,0,0.3)',
                position:'relative',
                flexShrink:0,
              }}>
                {/* Cercle intérieur blanc subtil */}
                <div style={{
                  position:'absolute',inset:4,borderRadius:'50%',
                  background:'rgba(255,255,255,0.12)',
                }}/>
                <span style={{fontSize:22,position:'relative',zIndex:1}}>🎤</span>
              </button>
              <span style={{fontSize:8,color:T.muted,marginTop:4,letterSpacing:'.04em'}}>VITARA</span>
            </div>
          )
          : (
            <button key={item.id} onClick={()=>onNav(item.id)}
              style={{background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'8px 8px 2px',flex:1}}>
              <span style={{fontSize:18,opacity:active===item.id?1:.4,transition:'opacity .2s'}}>{item.icon}</span>
              <span style={{fontSize:9,color:active===item.id?T.teal:T.muted,fontWeight:active===item.id?700:400,letterSpacing:'.02em'}}>{item.label}</span>
              {active===item.id && <div style={{width:16,height:3,borderRadius:2,background:T.teal,marginTop:1}}/>}
            </button>
          )
      ))}
    </div>
  );
}
