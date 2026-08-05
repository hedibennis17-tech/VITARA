'use client';
import{useEffect,useState}from'react';
import{useRouter}from'next/navigation';
import Header from'@/components/layout/Header';
import{Search,Plus,AlertCircle,Phone,Mail}from'lucide-react';

export default function PatientsPage(){
  const router=useRouter();
  const[patients,setPatients]=useState<Record<string,unknown>[]>([]);
  const[loading,setLoading]=useState(true);
  const[search,setSearch]=useState('');

  useEffect(()=>{
    fetch('/api/patients?limit=20').then(r=>{if(r.status===401){router.push('/login');return null;}return r.json();}).then(d=>{if(d?.success)setPatients(d.data.patients);}).finally(()=>setLoading(false));
  },[router]);

  function gi(f:string,l:string){return`${f?.[0]??''}${l?.[0]??''}`.toUpperCase();}
  function age(d:string){return Math.floor((Date.now()-new Date(d).getTime())/(365.25*24*3600*1000));}
  const filtered=patients.filter((p:Record<string,unknown>)=>!search||(String(p.first_name)+' '+String(p.last_name)).toLowerCase().includes(search.toLowerCase())||String(p.phone).includes(search));

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden'}}>
      <Header title="Patients" subtitle="Gestion des dossiers patients"/>
      <div style={{flex:1,overflowY:'auto',padding:24,display:'flex',flexDirection:'column',gap:16}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 14px',flex:1,maxWidth:400}}>
            <Search size={14} color="var(--text-muted)"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nom, téléphone, RAMQ..." style={{background:'none',border:'none',outline:'none',color:'var(--text)',fontSize:13,width:'100%'}}/>
          </div>
          <button style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',background:'var(--teal)',border:'none',borderRadius:8,color:'var(--midnight)',fontSize:12,fontWeight:600,cursor:'pointer',marginLeft:'auto'}}>
            <Plus size={14}/>Nouveau patient
          </button>
        </div>
        {loading?<div style={{padding:40,textAlign:'center',color:'var(--text-muted)'}}>Chargement...</div>:(
        <div className="glass-card" style={{overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
              {['Patient','Âge','Contact','Médecin','Département','Allergies',''].map(h=>(
                <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:10,fontWeight:500,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((p:Record<string,unknown>,i:number)=>(
                <tr key={String(p.id)} style={{borderBottom:i<filtered.length-1?'1px solid var(--border)':'none',cursor:'pointer'}}>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:32,height:32,background:'var(--teal-dim)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'var(--teal)',flexShrink:0}}>
                        {gi(String(p.first_name),String(p.last_name))}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>{String(p.first_name)} {String(p.last_name)}</div>
                        <div style={{fontSize:10,color:'var(--text-muted)',fontFamily:"'JetBrains Mono',monospace"}}>{String(p.id).slice(0,8)}</div>
                      </div>
                      <span style={{fontSize:10,background:'var(--teal-dim)',color:'var(--teal)',padding:'1px 5px',borderRadius:4,fontWeight:600}}>{String(p.language||'fr').toUpperCase()}</span>
                    </div>
                  </td>
                  <td style={{padding:'12px 16px',fontSize:13,color:'var(--text)'}}>{p.date_of_birth?age(String(p.date_of_birth)):'-'} ans</td>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{display:'flex',flexDirection:'column',gap:3}}>
                      <span style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--text)'}}><Phone size={10} color="var(--text-muted)"/>{String(p.phone)}</span>
                      {p.email&&<span style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--text-muted)'}}><Mail size={10}/>{String(p.email)}</span>}
                    </div>
                  </td>
                  <td style={{padding:'12px 16px',fontSize:12,color:'var(--text)'}}>{String(p.primary_provider||'-')}</td>
                  <td style={{padding:'12px 16px'}}><span style={{fontSize:11,padding:'2px 8px',background:'var(--teal-dim)',color:'var(--teal)',borderRadius:4}}>{String(p.department_name||'-')}</span></td>
                  <td style={{padding:'12px 16px'}}>
                    {Array.isArray(p.allergies)&&p.allergies.length>0
                      ?<div style={{display:'flex',alignItems:'center',gap:5}}><AlertCircle size={12} color="var(--urgent)"/><span style={{fontSize:11,color:'var(--urgent)'}}>{(p.allergies as string[]).join(', ')}</span></div>
                      :<span style={{fontSize:11,color:'var(--text-muted)'}}>Aucune</span>}
                  </td>
                  <td style={{padding:'12px 16px'}}><button style={{fontSize:11,padding:'4px 10px',background:'var(--teal-dim)',border:'1px solid var(--teal)',borderRadius:6,color:'var(--teal)',cursor:'pointer'}}>Dossier</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
