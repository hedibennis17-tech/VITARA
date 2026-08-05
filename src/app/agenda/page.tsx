'use client';
import{useEffect,useState}from'react';
import{useRouter}from'next/navigation';
import Header from'@/components/layout/Header';
import{ChevronLeft,ChevronRight,Plus}from'lucide-react';

const SC:Record<string,string>={confirmed:'var(--mint)',scheduled:'var(--teal)',waiting:'#F9A826',cancelled:'var(--urgent)',completed:'#34D399'};
const SL:Record<string,string>={confirmed:'Confirmé',scheduled:'Planifié',waiting:'En attente',cancelled:'Annulé',completed:'Complété'};

export default function AgendaPage(){
  const router=useRouter();
  const[appts,setAppts]=useState<Record<string,unknown>[]>([]);
  const[loading,setLoading]=useState(true);
  const today=new Date().toISOString().slice(0,10);

  useEffect(()=>{
    fetch(`/api/appointments?date=${today}`).then(r=>{if(r.status===401){router.push('/login');return null;}return r.json();}).then(d=>{if(d?.success)setAppts(d.data.appointments);}).finally(()=>setLoading(false));
  },[router,today]);

  const HOURS=['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden'}}>
      <Header title="Agenda" subtitle="Calendrier des rendez-vous"/>
      <div style={{flex:1,display:'flex',overflow:'hidden',padding:24,gap:16}}>
        <div style={{width:240,flexShrink:0,display:'flex',flexDirection:'column',gap:12}}>
          <button style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px',background:'var(--teal)',border:'none',borderRadius:10,color:'var(--midnight)',fontSize:13,fontWeight:600,cursor:'pointer',width:'100%'}}>
            <Plus size={16}/>Nouveau rendez-vous
          </button>
          <div className="glass-card" style={{overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
              <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,fontWeight:600}}>Aujourd&apos;hui — {today}</h3>
            </div>
            <div style={{padding:10,display:'flex',flexDirection:'column',gap:4}}>
              {loading?<div style={{padding:16,textAlign:'center',color:'var(--text-muted)',fontSize:12}}>Chargement...</div>:
                appts.map(a=>(
                  <div key={String(a.id)} style={{padding:'8px 10px',background:'var(--midnight)',borderRadius:7,border:'1px solid var(--border)',display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--teal)',width:40,flexShrink:0}}>{String(a.start_time||'').slice(0,5)}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:500,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{String(a.patient_name||'-')}</div>
                      <div style={{fontSize:10,color:'var(--text-muted)'}}>{String(a.department_name||'-')}</div>
                    </div>
                    <div style={{width:7,height:7,background:SC[String(a.status)]||'var(--border)',borderRadius:'50%',flexShrink:0}}/>
                  </div>
                ))
              }
            </div>
          </div>
          <div className="glass-card" style={{padding:14}}>
            {[['Total aujourd\'hui',String(appts.length)],['Confirmés',String(appts.filter(a=>a.status==='confirmed').length)],['En attente',String(appts.filter(a=>a.status==='scheduled').length)],['Vidéo',String(appts.filter(a=>a.type==='teleconsult').length)]].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
                <span style={{color:'var(--text-muted)'}}>{k}</span><span style={{color:'var(--text)',fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:16}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <button style={{background:'none',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',cursor:'pointer',color:'var(--text-muted)',display:'flex'}}><ChevronLeft size={14}/></button>
              <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:14,fontWeight:600}}>Semaine du {today}</span>
              <button style={{background:'none',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',cursor:'pointer',color:'var(--text-muted)',display:'flex'}}><ChevronRight size={14}/></button>
            </div>
            <button style={{padding:'5px 12px',background:'var(--teal-dim)',border:'1px solid var(--teal)',borderRadius:6,color:'var(--teal)',fontSize:11,cursor:'pointer'}}>Aujourd&apos;hui</button>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:20}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                {['Heure','Patient','Professionnel','Département','Type','Statut'].map(h=>(
                  <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:500,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {loading?<tr><td colSpan={6} style={{padding:32,textAlign:'center',color:'var(--text-muted)'}}>Chargement...</td></tr>:
                  appts.map((a,i)=>(
                    <tr key={String(a.id)} style={{borderBottom:i<appts.length-1?'1px solid var(--border)':'none'}}>
                      <td style={{padding:'10px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:600,color:'var(--teal)'}}>{String(a.start_time||'').slice(0,5)}</td>
                      <td style={{padding:'10px 12px',fontSize:13,fontWeight:500,color:'var(--text)'}}>{String(a.patient_name||'-')}</td>
                      <td style={{padding:'10px 12px',fontSize:11,color:'var(--text-muted)'}}>{String(a.provider_name||'-')}</td>
                      <td style={{padding:'10px 12px'}}><span style={{fontSize:11,padding:'2px 8px',background:(String(a.department_color||'#00C5D4'))+'20',color:String(a.department_color||'#00C5D4'),borderRadius:4}}>{String(a.department_name||'-')}</span></td>
                      <td style={{padding:'10px 12px'}}><span style={{fontSize:11,padding:'2px 6px',background:a.type==='teleconsult'?'#818CF820':'var(--teal-dim)',color:a.type==='teleconsult'?'#818CF8':'var(--teal)',borderRadius:4}}>{a.type==='teleconsult'?'📹 Vidéo':'🏥 Présentiel'}</span></td>
                      <td style={{padding:'10px 12px'}}><span style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:SC[String(a.status)]||'var(--text-muted)'}}><span style={{width:6,height:6,background:SC[String(a.status)]||'var(--border)',borderRadius:'50%'}}/>{SL[String(a.status)]||String(a.status)}</span></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
