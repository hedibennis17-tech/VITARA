'use client';
import Header from'@/components/layout/Header';
export default function Page(){
  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden'}}>
      <Header title="Rapports" subtitle="Statistiques et analyses"/>
      <div style={{flex:1,overflowY:'auto',padding:24}}>
        <div className="glass-card" style={{padding:40,textAlign:'center'}}>
          <div style={{fontSize:32,marginBottom:16}}>🚧</div>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:18,fontWeight:600,marginBottom:8}}>Rapports</div>
          <div style={{color:'var(--text-muted)',fontSize:13}}>Module en développement actif.</div>
        </div>
      </div>
    </div>
  );
}
