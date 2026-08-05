'use client';

import Header from '@/components/layout/Header';

const MONTHLY = [
  { month: 'Mars', calls: 1820, appointments: 542, patients: 389 },
  { month: 'Avr', calls: 1950, appointments: 601, patients: 421 },
  { month: 'Mai', calls: 2100, appointments: 634, patients: 448 },
  { month: 'Juin', calls: 1980, appointments: 589, patients: 410 },
  { month: 'Juil', calls: 2340, appointments: 712, patients: 501 },
  { month: 'Août', calls: 1270, appointments: 381, patients: 267 },
];

const max = Math.max(...MONTHLY.map(m => m.calls));

export default function RapportsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Rapports" subtitle="Analyses et statistiques de performance" />
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Sélecteurs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['7 jours', '30 jours', '3 mois', '6 mois', 'Cette année'].map((p, i) => (
            <button key={p} style={{
              padding: '7px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer',
              background: i === 2 ? 'var(--teal)' : 'var(--surface)',
              border: `1px solid ${i === 2 ? 'var(--teal)' : 'var(--border)'}`,
              color: i === 2 ? 'var(--midnight)' : 'var(--text-muted)',
              fontWeight: i === 2 ? 600 : 400,
            }}>
              {p}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[
            ['Appels totaux', '10 460', '+8.2%', 'var(--teal)'],
            ['Taux IA', '93.4%', '+1.1%', 'var(--mint)'],
            ['Taux satisfaction', '4.7/5', '+0.2', '#A78BFA'],
            ['RDV générés', '3 118', '+12%', '#F9A826'],
            ['Temps moy.', '3m 18s', '-14s', '#34D399'],
          ].map(([label, val, delta, color]) => (
            <div key={label as string} className="glass-card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em' }}>{val}</div>
              <div style={{ fontSize: 10, color: color as string, marginTop: 4 }}>{delta} vs période préc.</div>
            </div>
          ))}
        </div>

        {/* Charts grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

          {/* Graphe barres — appels */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600 }}>Appels par mois</h2>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, background: 'var(--teal)', borderRadius: 2, display: 'inline-block' }} /> Appels
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, background: 'var(--mint)', borderRadius: 2, display: 'inline-block' }} /> Patients
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 180 }}>
              {MONTHLY.map((m, i) => (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>{m.calls}</div>
                  <div style={{ width: '100%', display: 'flex', gap: 3, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, background: i === MONTHLY.length - 1 ? 'var(--teal)' : 'var(--teal-dim)', height: `${(m.calls / max) * 160}px`, borderRadius: '4px 4px 0 0', border: `1px solid ${i === MONTHLY.length - 1 ? 'var(--teal)' : 'var(--border-2)'}` }} />
                    <div style={{ flex: 1, background: i === MONTHLY.length - 1 ? 'var(--mint)' : 'var(--mint-dim)', height: `${(m.patients / max) * 160}px`, borderRadius: '4px 4px 0 0', border: `1px solid ${i === MONTHLY.length - 1 ? 'var(--mint)' : 'var(--border-2)'}` }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Répartition par dépôt */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Top départements</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Médecine familiale', 28, 'var(--teal)'],
                ['Physiothérapie', 19, 'var(--mint)'],
                ['Psychologie', 12, '#A78BFA'],
                ['Cardiologie', 9, '#F87171'],
                ['Nutrition', 7, '#86EFAC'],
                ['Autres', 25, 'var(--text-dim)'],
              ].map(([dept, pct, color]) => (
                <div key={dept as string}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text)' }}>{dept}</span>
                    <span style={{ fontSize: 11, color: color as string, fontWeight: 600 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--midnight)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color as string, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scénarios IA */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Scénarios IA — 3 derniers mois</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {[
              ['Prise de RDV', '4 218', 'var(--teal)'],
              ['Annulation', '892', 'var(--urgent)'],
              ['Modification', '1 041', '#F9A826'],
              ['Nouveau patient', '687', 'var(--mint)'],
              ['Résultats', '543', '#A78BFA'],
              ['Urgence mineure', '128', '#FF4F4F'],
              ['Facturation', '314', '#86EFAC'],
              ['Renseignements', '1 892', '#7DD3FC'],
              ['Transfert médecin', '201', '#F59E0B'],
              ['Téléconsulte', '344', '#818CF8'],
            ].map(([scenario, count, color]) => (
              <div key={scenario as string} style={{ padding: '12px 14px', background: 'var(--midnight)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>{scenario}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: color as string }}>{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
