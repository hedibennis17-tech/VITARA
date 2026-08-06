"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const C = { midnight:"#070F1C",surface:"#0D1B2E",surface2:"#112138",border:"#1A2E47",teal:"#00C5D4",mint:"#00E5A0",text:"#E8F0FA",muted:"#5E7A96",urgent:"#FF4F4F",purple:"#A78BFA",warn:"#F9A826" };

const SYSTEM = {
fr:`Tu es VITARA, assistante IA vocale de la Clinique Santé Montréal. Réponds en JSON pur uniquement:
{"speak":"message au patient (2 phrases max, chaleureux)","intent":"welcome|identify|need|dept|slots|confirm|cancel|emergency|done","slots":null,"booking":null}
Pour intent "slots": slots=[{"id":"1","label":"Demain 10h00","provider":"M. Omar Khalil","dept":"Physiothérapie"},{"id":"2","label":"Jeudi 14h00","provider":"Dr. Jean-François Martin","dept":"Médecine familiale"},{"id":"3","label":"Vendredi 9h30","provider":"M. Omar Khalil","dept":"Physiothérapie"}]
Pour intent "confirm": booking={"date":"Jeudi 8 août 2026","time":"14h00","provider":"Dr. Jean-François Martin","dept":"Médecine familiale","code":"VIT-2847","sms":"+1(514)555-XXXX","email":"patient@courriel.ca"}
Flux: 1)Accueil chaleureux 2)Prénom+téléphone 3)Besoin 4)Département 5)3 créneaux (intent:slots) 6)Confirmation (intent:confirm avec booking rempli). Urgence grave→intent:emergency.`,
en:`You are VITARA, AI voice assistant at Clinique Santé Montréal. Respond in pure JSON only:
{"speak":"message to patient (2 sentences max, warm)","intent":"welcome|identify|need|dept|slots|confirm|cancel|emergency|done","slots":null,"booking":null}
For intent "slots": slots=[{"id":"1","label":"Tomorrow 10:00am","provider":"M. Omar Khalil","dept":"Physiotherapy"},{"id":"2","label":"Thursday 2:00pm","provider":"Dr. Jean-François Martin","dept":"Family Medicine"},{"id":"3","label":"Friday 9:30am","provider":"M. Omar Khalil","dept":"Physiotherapy"}]
For intent "confirm": booking={"date":"Thursday Aug 8, 2026","time":"2:00 PM","provider":"Dr. Jean-François Martin","dept":"Family Medicine","code":"VIT-2847","sms":"+1(514)555-XXXX","email":"patient@email.com"}
Flow: 1)Warm welcome 2)First name+phone 3)Need 4)Department 5)3 slots (intent:slots) 6)Confirm (intent:confirm). Serious emergency→intent:emergency.`,
ar:`أنت VITARA مساعدة ذكية. أجب بـ JSON نقي فقط:
{"speak":"رسالة للمريض (جملتان)","intent":"welcome|identify|need|dept|slots|confirm|cancel|emergency|done","slots":null,"booking":null}
لـ "slots": slots=[{"id":"1","label":"غداً 10 صباحاً","provider":"م. عمر خليل","dept":"علاج طبيعي"},{"id":"2","label":"الخميس 2 مساءً","provider":"د. مارتن","dept":"طب الأسرة"},{"id":"3","label":"الجمعة 9:30","provider":"م. خليل","dept":"علاج طبيعي"}]
لـ "confirm": booking={"date":"الخميس 8 أغسطس","time":"2:00 مساءً","provider":"د. مارتن","dept":"طب الأسرة","code":"VIT-2847","sms":"+1(514)555-XXXX","email":"email@example.com"}`
};

const QUICK = {
  fr:[{i:"📅",l:"Prendre un rendez-vous",m:"Je veux prendre un rendez-vous"},{i:"🦾",l:"Physiothérapie",m:"J'ai besoin de physiothérapie pour une douleur au dos"},{i:"🩺",l:"Médecin de famille",m:"Je voudrais voir mon médecin de famille"},{i:"👶",l:"Mon enfant est malade",m:"Mon enfant a de la fièvre, je veux un rendez-vous en pédiatrie"},{i:"❌",l:"Annuler un rendez-vous",m:"Je dois annuler mon rendez-vous"},{i:"📋",l:"Résultats d'examens",m:"J'attends mes résultats d'analyse sanguine"}],
  en:[{i:"📅",l:"Book appointment",m:"I'd like to book an appointment"},{i:"🦾",l:"Physiotherapy",m:"I need physiotherapy for back pain"},{i:"🩺",l:"Family doctor",m:"I want to see my family doctor"},{i:"👶",l:"My child is sick",m:"My child has a fever"},{i:"❌",l:"Cancel appointment",m:"I need to cancel my appointment"},{i:"📋",l:"Test results",m:"I'm waiting for my blood test results"}],
  ar:[{i:"📅",l:"حجز موعد",m:"أريد حجز موعد"},{i:"🦾",l:"علاج طبيعي",m:"أحتاج علاجاً طبيعياً لآلام الظهر"},{i:"🩺",l:"طبيب الأسرة",m:"أريد رؤية طبيب الأسرة"},{i:"👶",l:"طفلي مريض",m:"طفلي يعاني من حمى"},{i:"❌",l:"إلغاء موعد",m:"أريد إلغاء موعدي"},{i:"📋",l:"نتائج الفحوصات",m:"أنتظر نتائج تحاليلي"}]
};

// ── CSS injected once ──────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
@keyframes idle-orb{0%,100%{transform:scale(1);box-shadow:0 0 28px #00C5D440}50%{transform:scale(1.03);box-shadow:0 0 48px #00C5D460}}
@keyframes speak-orb{0%,100%{box-shadow:0 0 35px #00C5D450,inset 0 0 25px #00C5D412}50%{box-shadow:0 0 75px #00E5A070,inset 0 0 45px #00E5A018}}
@keyframes listen-orb{0%,100%{box-shadow:0 0 35px #00E5A055}50%{box-shadow:0 0 85px #00E5A090}}
@keyframes think-orb{0%,100%{box-shadow:0 0 25px #A78BFA40}50%{box-shadow:0 0 55px #A78BFA70}}
@keyframes ring1{0%,100%{transform:scale(0.96);opacity:.35}50%{transform:scale(1.07);opacity:.12}}
@keyframes ring2{0%,100%{transform:scale(1.06);opacity:.22}50%{transform:scale(0.94);opacity:.08}}
@keyframes ring3{0%,100%{transform:scale(1.01);opacity:.12}50%{transform:scale(1.13);opacity:.04}}
@keyframes bar{from{height:12%}to{height:92%}}
@keyframes lr{0%{transform:scale(.72);opacity:.75}100%{transform:scale(1.55);opacity:0}}
@keyframes db{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-9px)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes sup{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
@keyframes scl{from{transform:scale(.8);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
`;

// ── Avatar ────────────────────────────────────────────────────
function Orb({state,size=160}){
  const gMap={idle:C.teal,listening:C.mint,thinking:C.purple,speaking:C.teal,emergency:C.urgent};
  const g=gMap[state]||C.teal;
  const aMap={idle:'idle-orb 3s ease-in-out infinite',listening:'listen-orb 1s ease-in-out infinite',thinking:'think-orb 1.5s ease-in-out infinite',speaking:'speak-orb .8s ease-in-out infinite',emergency:'idle-orb .5s ease-in-out infinite'};
  const bars=Array.from({length:26});
  return(
    <div style={{position:'relative',width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      {[1.55,1.3,1.12].map((s,i)=>(
        <div key={i} style={{position:'absolute',width:size*s,height:size*s,borderRadius:'50%',border:`1px solid ${g}`,opacity:state!=='idle'?.22-i*.06:.07-i*.015,animation:[`ring1 ${1.4+i*.35}s ease-in-out infinite`,`ring2 ${1.9+i*.28}s ease-in-out infinite`,`ring3 ${2.4+i*.2}s ease-in-out infinite`][i]}}/>
      ))}
      <div style={{width:size,height:size,borderRadius:'50%',background:`radial-gradient(circle at 36% 32%,${g}22,${C.midnight}80)`,border:`2px solid ${g}45`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',position:'relative',animation:aMap[state],transition:'all .5s'}}>
        {state==='speaking'&&(
          <div style={{display:'flex',alignItems:'center',gap:2.5,height:size*.42}}>
            {bars.map((_,i)=>(
              <div key={i} style={{width:3,borderRadius:2,background:`linear-gradient(to top,${C.teal},${C.mint})`,animation:`bar ${.24+(i%6)*.055}s ease-in-out infinite alternate`,animationDelay:`${i*.032}s`,minHeight:'11%'}}/>
            ))}
          </div>
        )}
        {state==='listening'&&(
          <>
            {[0,1,2].map(i=>(
              <div key={i} style={{position:'absolute',width:`${42+i*23}%`,height:`${42+i*23}%`,borderRadius:'50%',border:`2px solid ${C.mint}`,opacity:.68-i*.18,animation:'lr 1.55s ease-out infinite',animationDelay:`${i*.42}s`}}/>
            ))}
            <span style={{fontSize:size*.2,zIndex:1}}>🎤</span>
          </>
        )}
        {state==='thinking'&&(
          <div style={{display:'flex',gap:6}}>
            {[0,1,2].map(i=>(
              <div key={i} style={{width:10,height:10,borderRadius:'50%',background:C.purple,animation:'db 1.1s ease-in-out infinite',animationDelay:`${i*.17}s`}}/>
            ))}
          </div>
        )}
        {state==='idle'&&(
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:size*.22,color:C.teal,animation:'idle-orb 3s ease-in-out infinite'}}>✦</div>
            <div style={{fontSize:size*.065,color:C.teal,fontFamily:"'Space Grotesk',sans-serif",letterSpacing:'.18em',fontWeight:700,marginTop:1}}>VITARA</div>
          </div>
        )}
        {state==='emergency'&&<span style={{fontSize:size*.28,animation:'blink .6s infinite'}}>🚨</span>}
      </div>
    </div>
  );
}

function Bubble({msg}){
  const ai=msg.role==='ai';
  return(
    <div style={{display:'flex',justifyContent:ai?'flex-start':'flex-end',animation:'sup .3s ease',marginBottom:9}}>
      {ai&&<div style={{width:24,height:24,borderRadius:'50%',background:`linear-gradient(135deg,${C.teal},${C.mint})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,marginRight:7,flexShrink:0,alignSelf:'flex-end'}}>✦</div>}
      <div style={{maxWidth:'78%',padding:'9px 13px',borderRadius:ai?'4px 15px 15px 15px':'15px 4px 15px 15px',background:ai?`linear-gradient(135deg,${C.surface},${C.teal}10)`:`linear-gradient(135deg,${C.teal}18,${C.mint}10)`,border:`1px solid ${ai?C.border:C.teal+'32'}`,fontSize:13,lineHeight:1.65,color:C.text,fontFamily:"'Inter',sans-serif"}}>
        {msg.text}
      </div>
    </div>
  );
}

function SlotBtn({slot,sel,onSel}){
  const on=sel===slot.id;
  return(
    <button onClick={()=>onSel(slot.id)} style={{padding:'12px 15px',background:on?C.teal+'22':C.surface,border:`1.5px solid ${on?C.teal:C.border}`,borderRadius:12,cursor:'pointer',textAlign:'left',transition:'all .2s',animation:'sup .3s ease',width:'100%'}}>
      <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:2}}>📅 {slot.label}</div>
      <div style={{fontSize:11,color:C.muted}}>{slot.provider} · {slot.dept}</div>
    </button>
  );
}

export default function PatientPage(){
  const[phase,setPhase]=useState('welcome');
  const[lang,setLang]=useState(null);
  const[av,setAv]=useState('idle');
  const[msgs,setMsgs]=useState([]);
  const[inp,setInp]=useState('');
  const[slots,setSlots]=useState(null);
  const[booking,setBooking]=useState(null);
  const[sel,setSel]=useState(null);
  const[hist,setHist]=useState([]);
  const[load,setLoad]=useState(false);
  const[vocal,setVocal]=useState(false);
  const[listen,setListen]=useState(false);
  const[vErr,setVErr]=useState('');
  const chatRef=useRef(null);
  const recRef=useRef(null);
  const synth=useRef(typeof window!=='undefined'?window.speechSynthesis:null);

  useEffect(()=>{const s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s);return()=>s.remove();},[]);
  useEffect(()=>{chatRef.current?.scrollTo({top:chatRef.current.scrollHeight,behavior:'smooth'});},[msgs,slots,load]);

  const speak=useCallback((t)=>{
    if(!synth.current)return;
    synth.current.cancel();
    const u=new SpeechSynthesisUtterance(t);
    u.lang=lang==='fr'?'fr-FR':lang==='ar'?'ar-SA':'en-US';u.rate=.93;u.pitch=1.06;
    const vs=synth.current.getVoices();
    const p=vs.find(v=>lang==='fr'?v.lang.startsWith('fr'):lang==='en'?v.lang.startsWith('en'):v.lang.startsWith('ar'));
    if(p)u.voice=p;
    u.onstart=()=>setAv('speaking');u.onend=()=>setAv('idle');u.onerror=()=>setAv('idle');
    synth.current.speak(u);
  },[lang]);

  const startListen=useCallback(()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setVErr(lang==='fr'?'Micro non supporté':'Mic not supported');return;}
    if(recRef.current)recRef.current.abort();
    const r=new SR();r.lang=lang==='fr'?'fr-FR':lang==='ar'?'ar-SA':'en-US';r.continuous=false;r.interimResults=false;
    r.onstart=()=>{setListen(true);setAv('listening');setVErr('');};
    r.onend=()=>setListen(false);
    r.onerror=()=>{setListen(false);setAv('idle');setVErr(lang==='fr'?'Micro non détecté':'Mic error');};
    r.onresult=(e)=>{const t=e.results[0][0].transcript;setListen(false);if(t.trim())send(t);};
    recRef.current=r;r.start();
  },[lang]);

  const stopListen=useCallback(()=>{recRef.current?.stop();setListen(false);setAv('idle');},[]);

  const send=useCallback(async(txt)=>{
    if(!txt.trim()||load)return;
    synth.current?.cancel();setSlots(null);setSel(null);
    const um={role:'user',content:txt};
    const nh=[...hist,um];
    setHist(nh);setMsgs(p=>[...p,{role:'patient',text:txt}]);setInp('');setLoad(true);setAv('thinking');
    try{
      const res=await fetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:800,system:SYSTEM[lang]||SYSTEM.fr,messages:nh})});
      const data=await res.json();
      const raw=(data.content?.[0]?.text||'{}').replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
      let parsed;try{parsed=JSON.parse(raw);}catch{parsed={speak:raw,intent:'info'};}
      const aiTxt=parsed.speak||'Je suis là pour vous aider.';
      setHist(p=>[...p,{role:'assistant',content:aiTxt}]);
      setMsgs(p=>[...p,{role:'ai',text:aiTxt}]);
      if(parsed.slots)setSlots(parsed.slots);
      if(parsed.booking){setBooking(parsed.booking);setTimeout(()=>setPhase('done'),1100);}
      setAv(parsed.intent==='emergency'?'emergency':'speaking');
      speak(aiTxt);
    }catch{
      const e=lang==='fr'?'Désolée, une erreur est survenue.':'Sorry, an error occurred.';
      setMsgs(p=>[...p,{role:'ai',text:e}]);setAv('idle');
    }finally{setLoad(false);}
  },[hist,lang,load,speak]);

  const confirmSlot=useCallback(()=>{
    if(!sel)return;
    const s=slots.find(x=>x.id===sel);
    const m=lang==='fr'?`Je confirme le ${s.label} avec ${s.provider} en ${s.dept}.`:lang==='ar'?`أؤكد ${s.label} مع ${s.provider}.`:`I confirm ${s.label} with ${s.provider} for ${s.dept}.`;
    setSlots(null);send(m);
  },[sel,slots,lang,send]);

  const start=useCallback((l)=>{
    setLang(l);setPhase('chat');
    const greet={fr:"Bonjour ! Je suis VITARA, votre assistante médicale virtuelle de la Clinique Santé Montréal. Comment puis-je vous aider aujourd'hui ?",en:"Hello! I'm VITARA, your virtual medical assistant at Clinique Santé Montréal. How can I help you today?",ar:"مرحباً! أنا VITARA، مساعدتك الطبية الافتراضية في عيادة كلينيك سانتي مونتريال. كيف يمكنني مساعدتك اليوم؟"};
    const t=greet[l];setMsgs([{role:'ai',text:t}]);setHist([{role:'assistant',content:t}]);
    setTimeout(()=>{setAv('speaking');speak(t);},400);
  },[speak]);

  const reset=useCallback(()=>{synth.current?.cancel();setPhase('welcome');setLang(null);setMsgs([]);setHist([]);setBooking(null);setSlots(null);setSel(null);setAv('idle');},[]);

  const base={minHeight:'100vh',background:C.midnight,fontFamily:"'Inter',sans-serif",color:C.text};

  // WELCOME
  if(phase==='welcome')return(
    <div style={{...base,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 20px',gap:0}}>
      <div style={{textAlign:'center',marginBottom:28}}>
        <div style={{fontSize:10,color:C.muted,letterSpacing:'.22em',textTransform:'uppercase',fontWeight:500,marginBottom:5}}>Clinique Santé Montréal</div>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:40,fontWeight:700,background:`linear-gradient(135deg,${C.teal},${C.mint})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:'-.03em',lineHeight:1}}>VITARA</div>
        <div style={{fontSize:11,color:C.muted,marginTop:4}}>Assistant IA Médical · AI Medical Assistant</div>
      </div>
      <Orb state="idle" size={155}/>
      <div style={{margin:'28px 0 22px',textAlign:'center',padding:'13px 20px',background:C.surface,border:`1px solid ${C.border}`,borderRadius:13,maxWidth:370,width:'100%'}}>
        <div style={{fontSize:13,color:C.text,fontWeight:500,marginBottom:4}}>Choisissez votre langue · Choose your language</div>
        <div style={{fontSize:11,color:C.muted}}>Dites <b style={{color:C.teal}}>FRANÇAIS</b> · Say <b style={{color:C.teal}}>ENGLISH</b> · قل <b style={{color:C.teal}}>عربي</b></div>
      </div>
      <div style={{display:'flex',gap:9,marginBottom:28}}>
        {[{l:'fr',f:'🇫🇷',n:'Français',c:C.teal},{l:'en',f:'🇬🇧',n:'English',c:C.mint},{l:'ar',f:'🇸🇦',n:'العربية',c:C.purple}].map(({l,f,n,c})=>(
          <button key={l} onClick={()=>start(l)} style={{padding:'12px 18px',background:c+'14',border:`1.5px solid ${c}42`,borderRadius:13,color:c,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Space Grotesk',sans-serif",transition:'all .2s'}}>
            {f} {n}
          </button>
        ))}
      </div>
      <div style={{width:'100%',maxWidth:420,background:C.surface,border:`1px solid ${C.border}`,borderRadius:17,padding:18}}>
        <div style={{fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'.12em',marginBottom:12,fontWeight:600}}>Accès rapide · Quick Access</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
          {[{i:'🎤',t:'Parler avec VITARA',s:'Agent vocal IA'},{i:'💬',t:'Discuter par chat',s:'Chat IA texte'},{i:'📅',t:'Mes rendez-vous',s:'Voir · Modifier'},{i:'📞',t:'Appeler la clinique',s:'+1 (514) 555-0100'},{i:'🔍',t:'Trouver un spécialiste',s:'30+ professionnels'},{i:'👤',t:'Mon compte patient',s:'Connexion · Dossier'}].map(({i,t,s})=>(
            <button key={t} onClick={()=>start('fr')} style={{padding:'10px 11px',background:C.midnight,border:`1px solid ${C.border}`,borderRadius:10,cursor:'pointer',textAlign:'left',transition:'border-color .2s'}}>
              <div style={{fontSize:17,marginBottom:4}}>{i}</div>
              <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:1}}>{t}</div>
              <div style={{fontSize:10,color:C.muted}}>{s}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // CONFIRMATION
  if(phase==='done'&&booking)return(
    <div style={{...base,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:26}}>
      <div style={{width:84,height:84,borderRadius:'50%',background:`linear-gradient(135deg,${C.teal}22,${C.mint}14)`,border:`3px solid ${C.mint}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,marginBottom:20,animation:'scl .5s ease'}}>✓</div>
      <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:20,fontWeight:700,marginBottom:5,textAlign:'center'}}>
        {lang==='fr'?'Rendez-vous confirmé !':lang==='ar'?'تم تأكيد الموعد!':'Appointment confirmed!'}
      </h2>
      <p style={{color:C.muted,fontSize:12,textAlign:'center',marginBottom:24}}>
        {lang==='fr'?'📱 SMS et 📧 email de confirmation envoyés.':lang==='ar'?'تم إرسال SMS وبريد إلكتروني.':'📱 SMS and 📧 confirmation email sent.'}
      </p>
      <div style={{width:'100%',maxWidth:390,background:C.surface,border:`1.5px solid ${C.teal}38`,borderRadius:18,padding:20,marginBottom:18,animation:'sup .4s ease .1s both'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
          <div>
            <div style={{fontSize:9,color:C.muted,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:2}}>{lang==='fr'?'Rendez-vous':lang==='ar'?'الموعد':'Appointment'}</div>
            <div style={{fontSize:17,fontWeight:700}}>{booking.date}</div>
            <div style={{fontSize:14,color:C.teal,fontWeight:600}}>{booking.time}</div>
          </div>
          <div style={{padding:'3px 11px',background:C.mint+'1e',border:`1px solid ${C.mint}38`,borderRadius:18,fontSize:9,color:C.mint,fontWeight:700}}>{lang==='fr'?'CONFIRMÉ':lang==='ar'?'مؤكد':'CONFIRMED'}</div>
        </div>
        {[['👨‍⚕️',lang==='fr'?'Professionnel':lang==='ar'?'المختص':'Provider',booking.provider],['🏥',lang==='fr'?'Département':lang==='ar'?'القسم':'Department',booking.dept],['📱','SMS',booking.sms],['📧','Email',booking.email],['🔑',lang==='fr'?'Code':lang==='ar'?'رمز التأكيد':'Code',booking.code]].map(([ic,lb,vl])=>(
          <div key={lb} style={{display:'flex',alignItems:'center',gap:9,padding:'7px 0',borderBottom:`1px solid ${C.border}`}}>
            <span style={{fontSize:14}}>{ic}</span><span style={{fontSize:11,color:C.muted,flex:1}}>{lb}</span><span style={{fontSize:12,fontWeight:600}}>{vl}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        {['📱 Twilio SMS','📧 SendGrid'].map(b=><div key={b} style={{padding:'4px 11px',background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,fontSize:10,color:C.muted}}>{b}</div>)}
      </div>
      <div style={{display:'flex',gap:9}}>
        <button onClick={()=>{setPhase('chat');setBooking(null);setMsgs([]);setHist([]);}} style={{padding:'10px 18px',background:C.teal+'1e',border:`1px solid ${C.teal}`,borderRadius:11,color:C.teal,fontSize:13,fontWeight:600,cursor:'pointer'}}>
          {lang==='fr'?'Autre demande':lang==='ar'?'طلب آخر':'New request'}
        </button>
        <button onClick={reset} style={{padding:'10px 18px',background:C.teal,border:'none',borderRadius:11,color:C.midnight,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Space Grotesk',sans-serif"}}>
          {lang==='fr'?'Terminer':lang==='ar'?'إنهاء':'Done'}
        </button>
      </div>
    </div>
  );

  // CHAT
  const ql=QUICK[lang]||QUICK.fr;
  return(
    <div style={{height:'100vh',background:C.midnight,display:'flex',flexDirection:'column',maxWidth:500,margin:'0 auto',fontFamily:"'Inter',sans-serif"}}>
      {/* Header */}
      <div style={{padding:'11px 16px',background:C.surface,borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:11,flexShrink:0}}>
        <div style={{width:32,height:32,borderRadius:'50%',background:`linear-gradient(135deg,${C.teal},${C.mint})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:C.midnight,fontWeight:700}}>✦</div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600,fontFamily:"'Space Grotesk',sans-serif"}}>VITARA</div>
          <div style={{fontSize:10,color:av!=='idle'?C.teal:C.muted}}>
            {av==='speaking'?(lang==='fr'?'Parle...':lang==='ar'?'تتحدث...':'Speaking...'):av==='listening'?(lang==='fr'?'Écoute...':lang==='ar'?'تستمع...':'Listening...'):av==='thinking'?(lang==='fr'?'Analyse...':lang==='ar'?'تحلل...':'Processing...'):lang==='fr'?'Assistante IA · En ligne':lang==='ar'?'متصلة':'AI Assistant · Online'}
          </div>
        </div>
        <button onClick={()=>setVocal(!vocal)} style={{padding:'4px 10px',background:vocal?C.teal+'22':C.midnight,border:`1px solid ${vocal?C.teal:C.border}`,borderRadius:18,fontSize:10,color:vocal?C.teal:C.muted,cursor:'pointer',fontWeight:600}}>
          {vocal?'🎤 Vocal':'💬 Chat'}
        </button>
        <button onClick={reset} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,fontSize:17,padding:'2px 5px'}}>←</button>
      </div>

      {/* Avatar en mode vocal */}
      {vocal&&(
        <div style={{padding:'22px 0 14px',display:'flex',flexDirection:'column',alignItems:'center',background:`radial-gradient(ellipse at center,${C.teal}05 0%,transparent 60%)`,flexShrink:0}}>
          <Orb state={av} size={140}/>
          <div style={{marginTop:12,fontSize:11,color:av!=='idle'?C.teal:C.muted,fontWeight:500}}>
            {av==='speaking'?(lang==='fr'?'VITARA parle...':lang==='ar'?'VITARA تتحدث...':'VITARA speaking...'):av==='listening'?(lang==='fr'?"J'écoute...":lang==='ar'?'أستمع...':'Listening...'):av==='thinking'?(lang==='fr'?'Analyse...':lang==='ar'?'يحلل...':'Processing...'):lang==='fr'?'Prêt · Appuyez pour parler':lang==='ar'?'جاهزة':'Ready · Press to speak'}
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={chatRef} style={{flex:1,overflowY:'auto',padding:'13px 13px 5px',display:'flex',flexDirection:'column'}}>
        {msgs.map((m,i)=><Bubble key={i} msg={m}/>)}
        {slots&&(
          <div style={{animation:'sup .3s ease',marginBottom:11}}>
            <div style={{fontSize:11,color:C.muted,textAlign:'center',marginBottom:7}}>{lang==='fr'?'📅 Choisissez un créneau':lang==='ar'?'📅 اختر موعداً':'📅 Choose a time slot'}</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>{slots.map(s=><SlotBtn key={s.id} slot={s} sel={sel} onSel={setSel}/>)}</div>
            {sel&&<button onClick={confirmSlot} style={{width:'100%',marginTop:9,padding:'11px',background:C.teal,border:'none',borderRadius:11,color:C.midnight,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Space Grotesk',sans-serif",animation:'sup .2s ease'}}>
              {lang==='fr'?'✓ Confirmer ce rendez-vous':lang==='ar'?'✓ تأكيد الموعد':'✓ Confirm this appointment'}
            </button>}
          </div>
        )}
        {load&&(
          <div style={{display:'flex',alignItems:'center',gap:5,padding:'5px 9px',animation:'sup .2s ease'}}>
            <div style={{width:22,height:22,borderRadius:'50%',background:`linear-gradient(135deg,${C.teal},${C.mint})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,marginRight:4}}>✦</div>
            {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:C.teal,animation:'db 1.1s ease-in-out infinite',animationDelay:`${i*.14}s`}}/>)}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      {msgs.length<=1&&!load&&(
        <div style={{padding:'0 11px 7px',flexShrink:0}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
            {ql.map(q=>(
              <button key={q.l} onClick={()=>send(q.m)} style={{padding:'8px 10px',background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,cursor:'pointer',textAlign:'left',fontSize:11,color:C.text,display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:13}}>{q.i}</span>{q.l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{padding:'9px 11px 14px',background:C.surface,borderTop:`1px solid ${C.border}`,flexShrink:0}}>
        {vErr&&<div style={{fontSize:11,color:C.urgent,textAlign:'center',marginBottom:5}}>{vErr}</div>}
        {vocal?(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:9}}>
            <button onClick={listen?stopListen:startListen} disabled={load} style={{width:64,height:64,borderRadius:'50%',background:listen?`linear-gradient(135deg,${C.mint},${C.teal})`:load?C.border:`linear-gradient(135deg,${C.teal},${C.mint})`,border:'none',cursor:load?'not-allowed':'pointer',fontSize:24,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:listen?`0 0 28px ${C.mint}55`:`0 0 16px ${C.teal}28`,animation:listen?'listen-orb 1s ease-in-out infinite':'none',transition:'all .3s'}}>
              {listen?'⬛':load?'⋯':'🎤'}
            </button>
            <div style={{fontSize:11,color:C.muted,textAlign:'center'}}>
              {listen?(lang==='fr'?'Parlez... (⬛ pour envoyer)':lang==='ar'?'تحدث...':'Speak... (⬛ to send)'):load?(lang==='fr'?'Traitement...':lang==='ar'?'معالجة...':'Processing...'):lang==='fr'?'Appuyez pour parler':lang==='ar'?'اضغط للتحدث':'Press to speak'}
            </div>
          </div>
        ):(
          <div style={{display:'flex',gap:6}}>
            <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send(inp)} placeholder={lang==='fr'?'Écrivez votre message...':lang==='ar'?'اكتب رسالتك...':'Type your message...'} disabled={load} style={{flex:1,padding:'10px 13px',background:C.midnight,border:`1px solid ${C.border}`,borderRadius:11,color:C.text,fontSize:13,outline:'none',fontFamily:"'Inter',sans-serif",dir:lang==='ar'?'rtl':'ltr'}}/>
            <button onClick={listen?stopListen:startListen} disabled={load} style={{width:40,height:40,borderRadius:10,background:listen?C.mint+'28':C.midnight,border:`1px solid ${listen?C.mint:C.border}`,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              {listen?'⬛':'🎤'}
            </button>
            <button onClick={()=>send(inp)} disabled={!inp.trim()||load} style={{width:40,height:40,borderRadius:10,background:inp.trim()&&!load?C.teal:C.border,border:'none',cursor:inp.trim()&&!load?'pointer':'not-allowed',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background .2s'}}>
              ▸
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
