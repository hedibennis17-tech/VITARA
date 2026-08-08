'use client';
import { useState, useEffect } from 'react';

// ── DESIGN TOKENS ─────────────────────────────────────────────
const C = {
  bg:      '#07111F',
  s1:      '#0D1B2E',
  s2:      '#112138',
  border:  '#1E3350',
  teal:    '#00D7C8',
  purple:  '#8B5CF6',
  mint:    '#00E5A0',
  pink:    '#EC4899',
  warn:    '#F9A826',
  urgent:  '#EF4444',
  text:    '#E8F0FA',
  muted:   '#5E7A96',
  glass:   'rgba(255,255,255,0.05)',
};

// ── MOCK DATA ─────────────────────────────────────────────────
const PATIENT = {
  name: 'Marie Leclerc',
  initials: 'ML',
  dob: '12 mars 1985',
  ramq: 'LECM 8503 1298',
  dossier: 'VIT-2024-00142',
  phone: '(514) 555-0142',
  email: 'marie.leclerc@email.com',
  lang: 'Français',
  doctor: 'Dr. Fahd Awada',
  completion: 78,
};

const DEMO_APPOINTMENTS = [
  { id:'a1', date:'Lun 11 août 2026', time:'10h00', type:'Physiothérapie', provider:'Shaheer Haider, PT', status:'confirmed', dept:'Réadaptation', color:C.mint, reason:'Genou gauche — CNESST', mode:'En clinique', code:'VIT-8841' },
  { id:'a2', date:'Mar 19 août 2026', time:'14h30', type:'Médecine familiale', provider:'Dr. Fahd Awada', status:'scheduled', dept:'Soins primaires', color:C.teal, reason:'Bilan annuel', mode:'En clinique', code:'VIT-8902' },
  { id:'a3', date:'Jeu 28 août 2026', time:'09h00', type:'Psychologie', provider:'Dr. Amira Hassan', status:'scheduled', dept:'Santé mentale', color:C.purple, reason:'Suivi TCC', mode:'Téléconsultation', code:'VIT-9011' },
];

const PAST_APPTS = [
  { id:'p1', date:'14 juil 2026', time:'11h00', type:'Physiothérapie', provider:'Shaheer Haider, PT', status:'completed', color:C.mint },
  { id:'p2', date:'2 juin 2026',  time:'09h30', type:'Prise de sang',   provider:'Technicien lab.',   status:'completed', color:C.warn },
];

const ALLERGIES = [
  { allergen:'Pénicilline', reaction:'Anaphylaxie', severity:'Sévère', notes:'Éviter toutes les bêtalactamines' },
  { allergen:'Aspirine',    reaction:'Urticaire',   severity:'Modérée', notes:'' },
];

const MEDICATIONS = [
  { name:'Metformine 500 mg', dose:'500 mg', frequency:'2x/jour', prescriber:'Dr. Fahd Awada', start:'Jan 2025' },
  { name:'Vitamine D 1000 UI', dose:'1000 UI', frequency:'1x/jour', prescriber:'Auto', start:'Mar 2025' },
];

const CONDITIONS = [
  { name:'Diabète type 2', status:'Actif', date:'2023-01', notes:'Suivi trimestriel' },
  { name:'Hypertension', status:'Contrôlé', date:'2021-06', notes:'Médication stable' },
];

const INSURANCE = [
  { type:'RAMQ', label:'Régie de l\'assurance maladie', number:'LECM 8503 1298', expiry:'2027-03', status:'Valide', color:C.teal },
  { type:'Privée', label:'Croix Bleue Canassurance', number:'CB-4820-7731', expiry:'2026-12', status:'Valide', color:C.purple },
  { type:'CNESST', label:'Commission des normes du travail', number:'CNESST-2024-991827', employer:'Construction ABC Inc.', incident:'2024-09-15', status:'Actif', color:C.warn },
];

const ACTIVITIES = [
  { icon:'📅', text:'Rendez-vous confirmé — Physio Shaheer Haider (11 août)', time:'Il y a 2h', color:C.mint },
  { icon:'💬', text:'Conversation VITARA complétée — Prise de RDV physiothérapie', time:'Il y a 2h', color:C.teal },
  { icon:'📄', text:'Document disponible — Compte-rendu physiothérapie', time:'14 juil', color:C.purple },
  { icon:'🔐', text:'Connexion depuis iPhone · Montréal', time:'Il y a 2 jours', color:C.muted },
  { icon:'💊', text:'Profil santé mis à jour — Médicaments', time:'Il y a 5 jours', color:C.warn },
];

const DOCS = [
  { name:'Compte-rendu physio — juil 2026', type:'medical_report', date:'14 juil 2026', size:'312 KB' },
  { name:'Ordonnance Metformine', type:'prescription', date:'10 jan 2025', size:'89 KB' },
  { name:'Carte d\'assurance RAMQ', type:'health_card', date:'—', size:'45 KB' },
  { name:'Formulaire CNESST AT-31', type:'insurance', date:'18 sept 2024', size:'220 KB' },
];

type Nav = 'accueil'|'rdv'|'dossier'|'assurances'|'documents'|'activites'|'profil'|'messages';

const NAV_ITEMS: { id:Nav; icon:string; label:string }[] = [
  { id:'accueil',    icon:'🏠', label:'Accueil' },
  { id:'rdv',        icon:'📅', label:'Mes rendez-vous' },
  { id:'dossier',    icon:'🗂️',  label:'Mon dossier' },
  { id:'assurances', icon:'🛡️',  label:'Assurances' },
  { id:'documents',  icon:'📄', label:'Documents' },
  { id:'activites',  icon:'📊', label:'Activités' },
  { id:'profil',     icon:'👤', label:'Mon profil' },
  { id:'messages',   icon:'💬', label:'Messages' },
];

// ── STATUS BADGE ──────────────────────────────────────────────
function Badge({ status }: { status:string }) {
  const map: Record<string,[string,string]> = {
    confirmed:  ['#00E5A0','Confirmé'],
    scheduled:  [C.teal,'Planifié'],
    completed:  ['#34D399','Complété'],
    cancelled:  [C.urgent,'Annulé'],
    Valide:     [C.mint,'Valide'],
    Actif:      [C.warn,'Actif'],
    Contrôlé:  [C.teal,'Contrôlé'],
  };
  const [color, label] = map[status] || [C.muted, status];
  return (
    <span style={{ fontSize:10, padding:'2px 8px', background:color+'22', color, borderRadius:20, fontWeight:600, border:`1px solid ${color}44` }}>
      {label}
    </span>
  );
}

// ── CARD ──────────────────────────────────────────────────────
function Card({ children, style={} }: any) {
  return (
    <div style={{ background:C.s1, border:`1px solid ${C.border}`, borderRadius:14, ...style }}>
      {children}
    </div>
  );
}

// ── SECTION HEADER ────────────────────────────────────────────
function SectionHeader({ title, sub, action }: { title:string; sub?:string; action?:React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
      <div>
        <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:C.text }}>{title}</h2>
        {sub && <p style={{ fontSize:11, color:C.muted, marginTop:2 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ── ACCUEIL ───────────────────────────────────────────────────
function Accueil({ onNav, appointments, newRdvCount }: { onNav:(n:Nav)=>void; appointments:any[]; newRdvCount:number }) {
  const next = appointments[0];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Bannière nouveau RDV depuis VITARA AI */}
      {newRdvCount > 0 && (
        <div style={{ padding:'12px 16px', background:`${C.teal}18`, border:`1px solid ${C.teal}44`, borderRadius:12, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>🤖</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.teal }}>
              {newRdvCount} rendez-vous ajouté{newRdvCount>1?'s':''} par VITARA AI aujourd'hui
            </div>
            <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>Réservé via l'agent vocal · Synchronisé automatiquement</div>
          </div>
          <button onClick={()=>onNav('rdv')} style={{ padding:'6px 12px', background:C.teal, border:'none', borderRadius:8, color:C.bg, fontSize:11, fontWeight:700, cursor:'pointer' }}>Voir →</button>
        </div>
      )}

      {/* Prochain RDV */}
      <Card style={{ padding:20, background:`linear-gradient(135deg,${C.s2},${C.s1})`, border:`1px solid ${next.color}44`, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, right:0, width:120, height:120, background:`radial-gradient(circle,${next.color}18,transparent 70%)` }}/>
        <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:8 }}>Prochain rendez-vous</div>
        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700, color:C.text, marginBottom:2 }}>{next.type}</div>
        <div style={{ fontSize:13, color:next.color, fontWeight:600, marginBottom:8 }}>{next.date} à {next.time}</div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>👨‍⚕️ {next.provider}</div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>📍 {next.mode} · {next.reason}</div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={{ flex:1, padding:'9px 14px', background:next.color, border:'none', borderRadius:9, color:C.bg, fontSize:12, fontWeight:700, cursor:'pointer' }}>Confirmer présence</button>
          <button style={{ padding:'9px 14px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:9, color:C.muted, fontSize:12, cursor:'pointer' }}>Annuler</button>
        </div>
        <div style={{ marginTop:8, fontSize:10, color:C.muted }}>Code: {next.code}</div>
      </Card>

      {/* Profil complétion */}
      {PATIENT.completion < 100 && (
        <Card style={{ padding:14, display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:4 }}>Complétez votre profil — {PATIENT.completion}%</div>
            <div style={{ height:5, background:C.s2, borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${PATIENT.completion}%`, background:`linear-gradient(90deg,${C.teal},${C.purple})`, borderRadius:3 }}/>
            </div>
          </div>
          <button onClick={()=>onNav('profil')} style={{ padding:'7px 12px', background:C.s2, border:`1px solid ${C.border}`, borderRadius:8, color:C.teal, fontSize:11, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>Compléter →</button>
        </Card>
      )}

      {/* Actions rapides */}
      <div>
        <div style={{ fontSize:10, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:10 }}>Actions rapides</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {[
            { i:'📅', l:'Prendre RDV',     color:C.teal },
            { i:'🔄', l:'Modifier RDV',    color:C.purple },
            { i:'❌', l:'Annuler RDV',     color:C.urgent },
            { i:'🦵', l:'Physiothérapie', color:C.mint },
            { i:'👶', l:'Mon enfant',      color:C.pink },
            { i:'🦺', l:'CNESST / SAAQ',  color:C.warn },
          ].map(q=>(
            <button key={q.l} onClick={()=>onNav('rdv')} style={{ padding:'12px 8px', background:C.glass, border:`1px solid ${C.border}`, borderRadius:11, cursor:'pointer', textAlign:'left', transition:'all .2s' }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{q.i}</div>
              <div style={{ fontSize:10, fontWeight:600, color:C.text, lineHeight:1.2 }}>{q.l}</div>
            </button>
          ))}
        </div>
      </div>

      {/* VITARA AI */}
      <button onClick={()=>window.open('/patient','_blank')} style={{ width:'100%', padding:'16px', background:`linear-gradient(135deg,${C.teal}22,${C.purple}22)`, border:`1px solid ${C.teal}55`, borderRadius:14, cursor:'pointer', display:'flex', alignItems:'center', gap:14, textAlign:'left' }}>
        <div style={{ width:44, height:44, borderRadius:12, background:`linear-gradient(135deg,${C.teal},${C.purple})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🎤</div>
        <div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:700, color:C.text }}>Parler à VITARA</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Prendre RDV, poser une question, obtenir de l'aide</div>
        </div>
        <div style={{ marginLeft:'auto', fontSize:18, color:C.teal }}>→</div>
      </button>

      {/* Médecin de famille + Assurances */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Card style={{ padding:14 }}>
          <div style={{ fontSize:10, color:C.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:'.08em' }}>Mon médecin</div>
          <div style={{ fontSize:22, marginBottom:4 }}>👨‍⚕️</div>
          <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{PATIENT.doctor}</div>
          <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>Médecine familiale</div>
          <div style={{ fontSize:10, color:C.teal, marginTop:6, cursor:'pointer' }}>Consulter →</div>
        </Card>
        <Card style={{ padding:14 }}>
          <div style={{ fontSize:10, color:C.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:'.08em' }}>Assurances</div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {INSURANCE.map(ins=>(
              <div key={ins.type} style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:ins.color, flexShrink:0 }}/>
                <span style={{ fontSize:10, color:C.text }}>{ins.type}</span>
                <Badge status={ins.status}/>
              </div>
            ))}
          </div>
          <div style={{ fontSize:10, color:C.teal, marginTop:8, cursor:'pointer' }} onClick={()=>onNav('assurances')}>Gérer →</div>
        </Card>
      </div>
    </div>
  );
}

// ── MES RDV ───────────────────────────────────────────────────
function MesRdv({ appointments }: { appointments: any[] }) {
  const [tab, setTab] = useState<'upcoming'|'past'>('upcoming');
  return (
    <div>
      <SectionHeader title="Mes rendez-vous" sub={`${appointments.length} à venir`} action={
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <a href="/patient" style={{ padding:'8px 12px', background:C.s2, border:`1px solid ${C.teal}44`, borderRadius:9, color:C.teal, fontSize:11, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:5 }}>🎤 VITARA</a>
          <button style={{ padding:'8px 14px', background:`linear-gradient(135deg,${C.teal},${C.purple})`, border:'none', borderRadius:9, color:'white', fontSize:12, fontWeight:700, cursor:'pointer' }}>+ Nouveau RDV</button>
        </div>
      }/>
      <div style={{ display:'flex', gap:4, marginBottom:16, background:C.s2, borderRadius:10, padding:4 }}>
        {[['upcoming','À venir'],['past','Passés']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k as any)} style={{ flex:1, padding:'8px', border:'none', borderRadius:8, background:tab===k?C.s1:'transparent', color:tab===k?C.text:C.muted, fontSize:12, fontWeight:tab===k?600:400, cursor:'pointer' }}>{l}</button>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {(tab==='upcoming'?appointments:PAST_APPTS).map(a=>(
          <Card key={a.id} style={{ padding:16, borderLeft:`3px solid ${a.color}`, position:'relative' }}>
            {(a as any).source === 'vitara_ai' && (
              <span style={{ position:'absolute', top:10, right:10, fontSize:9, padding:'2px 7px', background:`${C.teal}22`, color:C.teal, borderRadius:20, fontWeight:700, border:`1px solid ${C.teal}33` }}>🤖 Via VITARA</span>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:700, color:C.text }}>{a.type}</div>
                <div style={{ fontSize:12, color:a.color, fontWeight:600, marginTop:2 }}>{a.date} · {a.time}</div>
              </div>
              <Badge status={a.status}/>
            </div>
            <div style={{ fontSize:11, color:C.muted }}>👨‍⚕️ {a.provider}</div>
            {'reason' in a && <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>📋 {(a as any).reason}</div>}
            {'mode' in a && <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>📍 {(a as any).mode}</div>}
            {tab==='upcoming' && (
              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                <button style={{ flex:1, padding:'7px', background:C.s2, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:11, cursor:'pointer' }}>Modifier</button>
                <button style={{ flex:1, padding:'7px', background:'transparent', border:`1px solid ${C.urgent}44`, borderRadius:8, color:C.urgent, fontSize:11, cursor:'pointer' }}>Annuler</button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── MON DOSSIER ───────────────────────────────────────────────
function MonDossier() {
  const [tab, setTab] = useState('allergies');
  const tabs = [
    { id:'allergies',  label:'⚠️ Allergies' },
    { id:'medic',      label:'💊 Médicaments' },
    { id:'conditions', label:'🏥 Conditions' },
  ];
  return (
    <div>
      <SectionHeader title="Mon dossier de santé" sub="Informations médicales confidentielles"/>
      <div style={{ display:'flex', gap:4, marginBottom:16, overflowX:'auto', scrollbarWidth:'none' }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'7px 12px', border:'none', borderRadius:20, background:tab===t.id?C.teal:C.s2, color:tab===t.id?C.bg:C.muted, fontSize:11, fontWeight:tab===t.id?700:400, cursor:'pointer', whiteSpace:'nowrap' }}>{t.label}</button>
        ))}
      </div>

      {tab==='allergies' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {ALLERGIES.map((a,i)=>(
            <Card key={i} style={{ padding:14, borderLeft:`3px solid ${C.urgent}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:700, color:C.text }}>{a.allergen}</div>
                <span style={{ fontSize:10, padding:'2px 8px', background:a.severity==='Sévère'?`${C.urgent}22`:`${C.warn}22`, color:a.severity==='Sévère'?C.urgent:C.warn, borderRadius:20, fontWeight:600 }}>{a.severity}</span>
              </div>
              <div style={{ fontSize:11, color:C.muted }}>Réaction: {a.reaction}</div>
              {a.notes && <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>⚠️ {a.notes}</div>}
            </Card>
          ))}
          <button style={{ padding:'10px', background:'transparent', border:`1px dashed ${C.border}`, borderRadius:10, color:C.teal, fontSize:12, cursor:'pointer' }}>+ Ajouter une allergie</button>
        </div>
      )}

      {tab==='medic' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {MEDICATIONS.map((m,i)=>(
            <Card key={i} style={{ padding:14, borderLeft:`3px solid ${C.teal}` }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:700, color:C.text, marginBottom:4 }}>{m.name}</div>
              <div style={{ fontSize:11, color:C.muted }}>💊 {m.dose} · {m.frequency}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>👨‍⚕️ {m.prescriber} · Depuis {m.start}</div>
            </Card>
          ))}
          <button style={{ padding:'10px', background:'transparent', border:`1px dashed ${C.border}`, borderRadius:10, color:C.teal, fontSize:12, cursor:'pointer' }}>+ Ajouter un médicament</button>
        </div>
      )}

      {tab==='conditions' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {CONDITIONS.map((c,i)=>(
            <Card key={i} style={{ padding:14, borderLeft:`3px solid ${C.purple}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:700, color:C.text }}>{c.name}</div>
                <Badge status={c.status}/>
              </div>
              <div style={{ fontSize:11, color:C.muted }}>Diagnostiqué: {c.date}</div>
              {c.notes && <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{c.notes}</div>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ASSURANCES ────────────────────────────────────────────────
function Assurances() {
  return (
    <div>
      <SectionHeader title="Assurances et réclamations" sub="RAMQ · Privée · CNESST · SAAQ" action={
        <button style={{ padding:'7px 12px', background:C.s2, border:`1px solid ${C.border}`, borderRadius:8, color:C.teal, fontSize:11, fontWeight:600, cursor:'pointer' }}>+ Ajouter</button>
      }/>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {INSURANCE.map((ins,i)=>(
          <Card key={i} style={{ padding:18, borderLeft:`3px solid ${ins.color}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div>
                <span style={{ fontSize:10, padding:'2px 8px', background:`${ins.color}22`, color:ins.color, borderRadius:20, fontWeight:700, marginRight:8 }}>{ins.type}</span>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:700, color:C.text, marginTop:6 }}>{ins.label}</div>
              </div>
              <Badge status={ins.status}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {ins.type==='RAMQ' && <>
                <div><div style={{ fontSize:9, color:C.muted, textTransform:'uppercase' }}>Numéro</div><div style={{ fontSize:12, color:C.text, fontFamily:'monospace' }}>{ins.number}</div></div>
                <div><div style={{ fontSize:9, color:C.muted, textTransform:'uppercase' }}>Expiration</div><div style={{ fontSize:12, color:C.text }}>{ins.expiry}</div></div>
              </>}
              {ins.type==='Privée' && <>
                <div><div style={{ fontSize:9, color:C.muted, textTransform:'uppercase' }}>Police</div><div style={{ fontSize:12, color:C.text, fontFamily:'monospace' }}>{ins.number}</div></div>
                <div><div style={{ fontSize:9, color:C.muted, textTransform:'uppercase' }}>Expiration</div><div style={{ fontSize:12, color:C.text }}>{ins.expiry}</div></div>
              </>}
              {ins.type==='CNESST' && <>
                <div><div style={{ fontSize:9, color:C.muted, textTransform:'uppercase' }}>N° Réclamation</div><div style={{ fontSize:12, color:C.text, fontFamily:'monospace' }}>{ins.number}</div></div>
                <div><div style={{ fontSize:9, color:C.muted, textTransform:'uppercase' }}>Date incident</div><div style={{ fontSize:12, color:C.text }}>{(ins as any).incident}</div></div>
                <div style={{ gridColumn:'1/-1' }}><div style={{ fontSize:9, color:C.muted, textTransform:'uppercase' }}>Employeur</div><div style={{ fontSize:12, color:C.text }}>{(ins as any).employer}</div></div>
              </>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── DOCUMENTS ─────────────────────────────────────────────────
const DOC_ICONS: Record<string,string> = { medical_report:'📋', prescription:'💊', health_card:'🪪', insurance:'🛡️', other:'📄' };

function Documents() {
  return (
    <div>
      <SectionHeader title="Mes documents" sub={`${DOCS.length} fichiers`} action={
        <button style={{ padding:'8px 14px', background:`linear-gradient(135deg,${C.teal},${C.purple})`, border:'none', borderRadius:9, color:'white', fontSize:12, fontWeight:700, cursor:'pointer' }}>+ Téléverser</button>
      }/>
      <Card style={{ overflow:'hidden' }}>
        {DOCS.map((d,i)=>(
          <div key={i} style={{ padding:'14px 16px', borderBottom:i<DOCS.length-1?`1px solid ${C.border}`:'none', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:9, background:C.s2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
              {DOC_ICONS[d.type]||'📄'}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{d.name}</div>
              <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{d.date} · {d.size}</div>
            </div>
            <button style={{ padding:'6px 10px', background:C.s2, border:`1px solid ${C.border}`, borderRadius:7, color:C.teal, fontSize:11, cursor:'pointer' }}>⬇ Voir</button>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── ACTIVITÉS ─────────────────────────────────────────────────
function Activites({ aiAppointments }: { aiAppointments: any[] }) {
  // Générer des entrées d'activité depuis les RDV IA
  const aiActivities = aiAppointments.map((a: any) => ({
    icon: '🤖', color: C.teal,
    text: `RDV confirmé via VITARA AI — ${a.type} avec ${a.provider} (${a.code})`,
    time: new Date(a.bookedAt).toLocaleString('fr-CA', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }),
  }));

  const allActivities = [...aiActivities, ...ACTIVITIES];
  return (
    <div>
      <SectionHeader title="Journal d'activité" sub="Historique de votre compte"/>
      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
        {allActivities.map((a,i)=>(
          <div key={i} style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:i<allActivities.length-1?`1px solid ${C.border}22`:'none' }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`${a.color}18`, border:`1px solid ${a.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{a.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:C.text, lineHeight:1.4 }}>{a.text}</div>
              <div style={{ fontSize:10, color:C.muted, marginTop:3 }}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MON PROFIL ────────────────────────────────────────────────
function MonProfil() {
  return (
    <div>
      <SectionHeader title="Informations personnelles"/>

      {/* Avatar */}
      <Card style={{ padding:20, marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ width:60, height:60, borderRadius:'50%', background:`linear-gradient(135deg,${C.teal},${C.purple})`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, color:'white', flexShrink:0 }}>{PATIENT.initials}</div>
        <div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:17, fontWeight:700, color:C.text }}>{PATIENT.name}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>Dossier: {PATIENT.dossier}</div>
          <div style={{ fontSize:11, color:C.muted }}>RAMQ: {PATIENT.ramq}</div>
        </div>
        <button style={{ marginLeft:'auto', padding:'7px 12px', background:C.s2, border:`1px solid ${C.border}`, borderRadius:8, color:C.teal, fontSize:11, cursor:'pointer' }}>Modifier</button>
      </Card>

      {/* Infos */}
      {[
        { label:'Contact', fields:[
          { k:'Téléphone',  v:PATIENT.phone },
          { k:'Courriel',   v:PATIENT.email },
        ]},
        { label:'Personnel', fields:[
          { k:'Date de naissance', v:PATIENT.dob },
          { k:'Langue préférée',   v:PATIENT.lang },
        ]},
        { label:'Médecin de famille', fields:[
          { k:'Professionnel', v:PATIENT.doctor },
          { k:'Clinique',      v:'VITARA — Laval' },
        ]},
      ].map(section=>(
        <Card key={section.label} style={{ padding:16, marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>{section.label}</div>
          {section.fields.map(f=>(
            <div key={f.k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${C.border}44` }}>
              <span style={{ fontSize:12, color:C.muted }}>{f.k}</span>
              <span style={{ fontSize:12, color:C.text, fontWeight:500 }}>{f.v}</span>
            </div>
          ))}
        </Card>
      ))}

      <button style={{ width:'100%', padding:'12px', background:'transparent', border:`1px solid ${C.urgent}44`, borderRadius:10, color:C.urgent, fontSize:12, cursor:'pointer' }}>Supprimer mon compte</button>
    </div>
  );
}

// ── MESSAGES ──────────────────────────────────────────────────
function Messages() {
  return (
    <div>
      <SectionHeader title="Messages" sub="Boîte de réception sécurisée"/>
      <div style={{ padding:60, textAlign:'center', color:C.muted }}>
        <div style={{ fontSize:40, marginBottom:12 }}>💬</div>
        <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:6 }}>Aucun message pour l'instant</div>
        <div style={{ fontSize:12 }}>Les messages de votre clinique apparaîtront ici.</div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────
export default function PatientPortal() {
  const [nav, setNav]             = useState<Nav>('accueil');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiAppointments, setAiAppointments] = useState<any[]>([]);
  const [newRdvCount, setNewRdvCount] = useState(0);

  // ── Charger les RDV confirmés par VITARA AI depuis localStorage ──
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('vitara_appointments') || '[]');
      if (stored.length > 0) {
        setAiAppointments(stored);
        // Compter les RDV ajoutés dans les dernières 24h
        const recent = stored.filter((a: any) => {
          const bookedAt = new Date(a.bookedAt).getTime();
          return Date.now() - bookedAt < 24 * 60 * 60 * 1000;
        });
        setNewRdvCount(recent.length);
      }
    } catch { /* localStorage non dispo */ }
  }, []);

  // Fusionner RDV IA + démo (dédupliqués par code)
  const APPOINTMENTS = [
    ...aiAppointments.map((a: any) => ({
      id: a.id, date: a.date, time: a.time,
      type: a.type, provider: a.provider, dept: a.dept || a.type,
      status: 'confirmed', color: a.color || C.teal,
      reason: a.service, mode: a.mode, code: a.code,
      source: 'vitara_ai',
    })),
    ...DEMO_APPOINTMENTS.filter(d => !aiAppointments.some((a: any) => a.code === d.code)),
  ];

  const content: Record<Nav, JSX.Element> = {
    accueil:    <Accueil onNav={setNav} appointments={APPOINTMENTS} newRdvCount={newRdvCount}/>,
    rdv:        <MesRdv appointments={APPOINTMENTS}/>,
    dossier:    <MonDossier/>,
    assurances: <Assurances/>,
    documents:  <Documents/>,
    activites:  <Activites aiAppointments={aiAppointments}/>,
    profil:     <MonProfil/>,
    messages:   <Messages/>,
  };

  const currentLabel = NAV_ITEMS.find(n=>n.id===nav)?.label || 'Portail patient';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${C.s1}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
      `}</style>

      <div style={{ display:'flex', height:'100vh', background:C.bg, fontFamily:"'Inter',sans-serif", color:C.text, maxWidth:1200, margin:'0 auto' }}>

        {/* ── Sidebar desktop ── */}
        <aside style={{ width:240, flexShrink:0, background:C.s1, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Logo */}
          <div style={{ padding:'20px 18px 16px', borderBottom:`1px solid ${C.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.teal},${C.purple})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>✚</div>
              <div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:15, background:`linear-gradient(135deg,${C.teal},${C.purple})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>VITARA</div>
                <div style={{ fontSize:9, color:C.muted, letterSpacing:'.1em', textTransform:'uppercase' }}>Portail patient</div>
              </div>
            </div>
          </div>

          {/* Avatar user */}
          <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${C.teal},${C.purple})`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, color:'white', flexShrink:0 }}>{PATIENT.initials}</div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{PATIENT.name}</div>
              <div style={{ fontSize:10, color:C.muted }}>Dossier {PATIENT.dossier}</div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ flex:1, padding:'10px 0', overflowY:'auto' }}>
            {NAV_ITEMS.map(item=>{
              const active = nav===item.id;
              return (
                <button key={item.id} onClick={()=>setNav(item.id)} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 18px', margin:'1px 0', background:active?`${C.teal}18`:'transparent', borderLeft:active?`2px solid ${C.teal}`:'2px solid transparent', border:'none', borderRadius:0, color:active?C.teal:C.muted, fontSize:12, fontWeight:active?600:400, cursor:'pointer', textAlign:'left' }}>
                  <span style={{ fontSize:15 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom links */}
          <div style={{ padding:'12px 18px', borderTop:`1px solid ${C.border}` }}>
            <button onClick={()=>window.open('/patient','_blank')} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 12px', background:`${C.teal}18`, border:`1px solid ${C.teal}33`, borderRadius:9, color:C.teal, fontSize:11, fontWeight:600, cursor:'pointer' }}>
              🎤 <span>Parler à VITARA</span>
            </button>
            <div style={{ marginTop:8, fontSize:10, color:C.muted }}>v1.0 · Portail patient</div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Header */}
          <header style={{ height:56, background:C.s1, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', padding:'0 24px', gap:16, flexShrink:0 }}>
            <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:C.text, flex:1 }}>{currentLabel}</h1>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <button style={{ position:'relative', width:34, height:34, background:C.s2, border:`1px solid ${C.border}`, borderRadius:9, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
                🔔
                <span style={{ position:'absolute', top:6, right:6, width:7, height:7, background:C.teal, borderRadius:'50%' }}/>
              </button>
              <div style={{ width:32, height:32, borderRadius:'50%', background:`linear-gradient(135deg,${C.teal},${C.purple})`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:700, color:'white', cursor:'pointer' }}>{PATIENT.initials}</div>
            </div>
          </header>

          {/* Content */}
          <div style={{ flex:1, overflowY:'auto', padding:24 }}>
            {content[nav]}
          </div>
        </main>
      </div>
    </>
  );
}
