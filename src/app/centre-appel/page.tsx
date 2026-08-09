'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const C = {
  bg:'#07111F', s1:'#0D1B2E', s2:'#112138', border:'#1E3350',
  teal:'#00D7C8', purple:'#8B5CF6', mint:'#00E5A0', warn:'#F9A826',
  urgent:'#EF4444', text:'#E8F0FA', muted:'#5E7A96', pink:'#EC4899',
};

const AGENT_COLORS: Record<string,string> = {
  houda:C.pink, hayet:C.purple, said:C.teal, alain:C.mint,
};

const SERVICE_LABELS: Record<string,string> = {
  medecin_famille:'Médecine familiale', physiotherapie:'Physiothérapie',
  pediatrie:'Pédiatrie', urgence:'Urgence clinique', sans_rdv:'Sans RDV',
  psychologie:'Psychologie', nutrition:'Nutrition', prescription:'Prescription',
  prelevement:'Prélèvement', ergotherapie:'Ergothérapie',
};

type Conv = {
  id: number; session_id:string; agent_name:string; patient_phone:string;
  patient_name:string; service:string; practitioner:string; reason:string;
  body_part:string; pain_scale:string; language:string; status:string;
  started_at:string; ended_at:string; duration_sec:number;
  booking_code:string; booking_date:string; booking_time:string; accident_type:string;
};

type Detail = Conv & { transcript: {role:string;text:string}[] };

function Badge({ status }: { status:string }) {
  const map: Record<string,[string,string]> = {
    completed:  [C.mint,   'Complété'],
    in_progress:[C.warn,   'En cours'],
    abandoned:  [C.urgent, 'Abandonné'],
    booked:     [C.teal,   'RDV pris'],
  };
  const [color, label] = map[status] || [C.muted, status];
  return <span style={{fontSize:10,padding:'2px 8px',background:`${color}22`,color,borderRadius:20,fontWeight:700,border:`1px solid ${color}44`}}>{label}</span>;
}

function fmtDuration(sec?: number): string {
  if (!sec) return '—';
  const m = Math.floor(sec/60), s = sec%60;
  return `${m}m${s>0?` ${s}s`:''}`;
}

function fmtDate(d?: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
}

export default function CentreAppel() {
  const router = useRouter();
  const [convs,   setConvs]   = useState<Conv[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [detail,  setDetail]  = useState<Detail|null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [db, setDb] = useState(true);

  const fetchConvs = useCallback(async (q='') => {
    setLoading(true);
    try {
      const r = await fetch(`/api/conversations?limit=50&search=${encodeURIComponent(q)}`,{credentials:'include'});
      if (r.status===401) { router.push('/login'); return; }
      const d = await r.json();
      if (d.db===false) setDb(false);
      setConvs(d.conversations||[]); setTotal(d.total||0);
    } catch { setDb(false); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchConvs(); }, [fetchConvs]);

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const r = await fetch(`/api/conversations/${id}`,{credentials:'include'});
      const d = await r.json();
      setDetail(d.conversation);
    } catch {}
    finally { setDetailLoading(false); }
  };

  return (
    <div style={{minHeight:'100vh',background:C.bg,color:C.text,fontFamily:'Inter,sans-serif'}}>
      {/* Header */}
      <div style={{padding:'20px 24px 16px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:16}}>
        <div>
          <h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:20,fontWeight:800,color:C.text}}>📞 Centre d'appel</h1>
          <p style={{fontSize:12,color:C.muted,marginTop:3}}>{total} conversations enregistrées</p>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:10,alignItems:'center'}}>
          {!db && <span style={{fontSize:11,padding:'4px 10px',background:`${C.warn}22`,color:C.warn,borderRadius:20,border:`1px solid ${C.warn}44`}}>⚠️ DB non connectée — mode démo</span>}
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&fetchConvs(search)}
            placeholder="Rechercher patient, service..."
            style={{padding:'8px 14px',background:C.s2,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:12,width:220,outline:'none'}}
          />
          <button onClick={()=>fetchConvs(search)} style={{padding:'8px 14px',background:C.teal,border:'none',borderRadius:9,color:C.bg,fontSize:12,fontWeight:700,cursor:'pointer'}}>🔍</button>
          <button onClick={()=>fetchConvs('')} style={{padding:'8px 12px',background:C.s2,border:`1px solid ${C.border}`,borderRadius:9,color:C.muted,fontSize:12,cursor:'pointer'}}>↺</button>
        </div>
      </div>

      {/* Tableau */}
      <div style={{overflowX:'auto'}}>
        {loading ? (
          <div style={{textAlign:'center',padding:60,color:C.muted}}>Chargement...</div>
        ) : convs.length===0 ? (
          <div style={{textAlign:'center',padding:60}}>
            <div style={{fontSize:40,marginBottom:12}}>📞</div>
            <div style={{fontSize:16,fontWeight:600,color:C.text,marginBottom:8}}>
              {db ? 'Aucune conversation pour le moment' : 'Base de données non connectée'}
            </div>
            <div style={{fontSize:12,color:C.muted}}>
              {db ? 'Les conversations apparaîtront ici dès qu\'un patient utilise VITARA.'
                  : 'Configurez DATABASE_URL sur Vercel, puis visitez /api/db-setup'}
            </div>
          </div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:C.s2,fontSize:11,color:C.muted,textTransform:'uppercase',letterSpacing:'.07em'}}>
                {['Agent','Patient','Téléphone','Service','Médecin assigné','Motif','Durée','Statut','Date','Détails'].map(h=>(
                  <th key={h} style={{padding:'10px 14px',textAlign:'left',borderBottom:`1px solid ${C.border}`,fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {convs.map((c,i)=>(
                <tr key={c.id} style={{borderBottom:`1px solid ${C.border}22`,background:i%2===0?'transparent':C.s1+'44',transition:'background .15s'}}
                  onMouseEnter={e=>(e.currentTarget.style.background=C.s2)}
                  onMouseLeave={e=>(e.currentTarget.style.background=i%2===0?'transparent':C.s1+'44')}>
                  {/* Agent */}
                  <td style={{padding:'12px 14px'}}>
                    <span style={{fontSize:12,fontWeight:700,color:AGENT_COLORS[c.agent_name?.toLowerCase()]||C.teal,textTransform:'capitalize'}}>
                      {c.agent_name||'—'}
                    </span>
                  </td>
                  {/* Patient */}
                  <td style={{padding:'12px 14px',fontSize:13,fontWeight:600,color:C.text}}>{c.patient_name||'—'}</td>
                  {/* Téléphone */}
                  <td style={{padding:'12px 14px',fontSize:11,color:C.muted,fontFamily:'monospace'}}>
                    {c.patient_phone ? c.patient_phone.replace(/(\d{3})(\d{3})(\d{4})/,'($1) $2-$3') : '—'}
                  </td>
                  {/* Service */}
                  <td style={{padding:'12px 14px'}}>
                    <span style={{fontSize:11,padding:'3px 8px',background:`${C.teal}18`,color:C.teal,borderRadius:20}}>
                      {SERVICE_LABELS[c.service]||c.service||'—'}
                    </span>
                  </td>
                  {/* Médecin */}
                  <td style={{padding:'12px 14px',fontSize:12,color:C.text}}>{c.practitioner||'—'}</td>
                  {/* Motif */}
                  <td style={{padding:'12px 14px',fontSize:12,color:C.muted,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {[c.reason,c.body_part].filter(Boolean).join(' — ')||'—'}
                  </td>
                  {/* Durée */}
                  <td style={{padding:'12px 14px',fontSize:12,color:C.muted,fontFamily:'monospace'}}>{fmtDuration(c.duration_sec)}</td>
                  {/* Statut */}
                  <td style={{padding:'12px 14px'}}><Badge status={c.status}/></td>
                  {/* Date */}
                  <td style={{padding:'12px 14px',fontSize:11,color:C.muted,whiteSpace:'nowrap'}}>{fmtDate(c.started_at)}</td>
                  {/* Détails */}
                  <td style={{padding:'12px 14px'}}>
                    <button onClick={()=>openDetail(c.id)}
                      style={{padding:'5px 12px',background:`${C.purple}22`,border:`1px solid ${C.purple}44`,borderRadius:8,color:C.purple,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                      📋 Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal détail */}
      {(detail||detailLoading) && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
          onClick={e=>e.target===e.currentTarget&&setDetail(null)}>
          <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:18,width:'100%',maxWidth:760,maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column'}}>
            {/* Header modal */}
            <div style={{padding:'16px 20px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:12}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:16,fontWeight:700,color:C.text}}>
                  📋 Rapport de conversation
                </div>
                {detail && <div style={{fontSize:11,color:C.muted,marginTop:3}}>Session: {detail.session_id}</div>}
              </div>
              <button onClick={()=>setDetail(null)} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,fontSize:20,padding:4}}>✕</button>
            </div>

            {detailLoading ? (
              <div style={{padding:40,textAlign:'center',color:C.muted}}>Chargement...</div>
            ) : detail && (
              <div style={{overflowY:'auto',flex:1}}>
                {/* Infos résumé */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,padding:'16px 20px',borderBottom:`1px solid ${C.border}`}}>
                  {[
                    ['Agent',    detail.agent_name],
                    ['Patient',  detail.patient_name],
                    ['Téléphone',detail.patient_phone?.replace(/(\d{3})(\d{3})(\d{4})/,'($1) $2-$3')],
                    ['Service',  SERVICE_LABELS[detail.service]||detail.service],
                    ['Médecin',  detail.practitioner],
                    ['Motif',    detail.reason],
                    ['Zone',     detail.body_part],
                    ['Douleur',  detail.pain_scale ? `${detail.pain_scale}/10`:'—'],
                    ['Accident', detail.accident_type||'—'],
                    ['Durée',    fmtDuration(detail.duration_sec)],
                    ['Statut',   detail.status],
                    ['RDV',      detail.booking_code||'—'],
                  ].map(([k,v])=>(
                    <div key={String(k)} style={{background:C.s2,padding:'10px 12px',borderRadius:10}}>
                      <div style={{fontSize:9,color:C.muted,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4}}>{k}</div>
                      <div style={{fontSize:12,color:C.text,fontWeight:600}}>{v||'—'}</div>
                    </div>
                  ))}
                </div>

                {/* Transcription */}
                <div style={{padding:'16px 20px'}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:12}}>
                    💬 Transcription
                  </div>
                  {(!detail.transcript||detail.transcript.length===0) ? (
                    <div style={{fontSize:12,color:C.muted,textAlign:'center',padding:20}}>Aucune transcription enregistrée</div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      {detail.transcript.map((msg,i)=>(
                        <div key={i} style={{display:'flex',gap:10,justifyContent:msg.role==='patient'?'flex-end':'flex-start'}}>
                          <div style={{
                            maxWidth:'75%',padding:'10px 14px',borderRadius:12,
                            background:msg.role==='patient'?`${C.teal}22`:C.s2,
                            border:`1px solid ${msg.role==='patient'?C.teal+'44':C.border}`,
                            fontSize:12,color:C.text,lineHeight:1.5,
                          }}>
                            <div style={{fontSize:9,color:C.muted,marginBottom:4,textTransform:'uppercase',fontWeight:600}}>
                              {msg.role==='patient'?'Patient':'Agent IA'}
                            </div>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
