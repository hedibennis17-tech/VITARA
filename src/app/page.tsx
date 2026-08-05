'use client';

import Header from '@/components/layout/Header';
import { Phone, Clock, Users, Calendar, Mic, PhoneMissed, UserCheck } from 'lucide-react';

const STATS = [
  { label: "Appels aujourd'hui", value: '127', delta: '+12%', icon: Phone, color: 'var(--teal)' },
  { label: 'En cours', value: '4', delta: 'actifs', icon: Mic, color: 'var(--mint)' },
  { label: 'Appels manqués', value: '3', delta: '-2 vs hier', icon: PhoneMissed, color: 'var(--urgent)' },
  { label: 'Temps moyen', value: '3m 24s', delta: 'par appel', icon: Clock, color: '#F9A826' },
  { label: 'Patients servis', value: '89', delta: "aujourd'hui", icon: UserCheck, color: '#A78BFA' },
  { label: 'Rendez-vous', value: '62', delta: 'planifiés', icon: Calendar, color: '#34D399' },
];

const RECENT_CALLS = [
  { id: 'C-001', patient: 'Marie Leclerc', phone: '(514) 555-0142', scenario: 'Prise de rendez-vous', dept: 'Physiothérapie', duration: '2m 47s', status: 'completed', lang: 'FR' },
  { id: 'C-002', patient: 'Ahmed Benali', phone: '(438) 555-0287', scenario: 'Modification rendez-vous', dept: 'Médecine familiale', duration: '1m 18s', status: 'completed', lang: 'FR' },
  { id: 'C-003', patient: 'Sarah Johnson', phone: '(514) 555-0391', scenario: "Résultats d'examen", dept: 'Laboratoire', duration: null, status: 'active', lang: 'EN' },
  { id: 'C-004', patient: 'Jean Tremblay', phone: '(450) 555-0054', scenario: 'Annulation', dept: 'Cardiologie', duration: '58s', status: 'completed', lang: 'FR' },
  { id: 'C-005', patient: 'Inconnu', phone: '(514) 555-0765', scenario: 'Nouveau patient', dept: 'Pédiatrie', duration: null, status: 'queued', lang: 'FR' },
];

const ACTIVE_CALLS = [
  { id: 'A-001', patient: 'Sarah Johnson', time: '2m 14s', scenario: 'Résultats examens', lang: 'EN' },
  { id: 'A-002', patient: 'Fatima Zahra', time: '45s', scenario: 'Prise de RDV', lang: 'AR' },
  { id: 'A-003', patient: 'Louis Bergeron', time: '3m 02s', scenario: 'Urgence mineure', lang: 'FR' },
  { id: 'A-004', patient: 'Inconnu', time: '12s', scenario: 'Identification...', lang: 'FR' },
];

const STATUS_COLORS = {
  completed: 'var(--mint)',
  active: 'var(--teal)',
  queued: '#F9A826',
  missed: 'var(--urgent)',
};

const STATUS_LABELS = {
  completed: 'Terminé',
  active: 'En cours',
  queued: 'En attente',
  missed: 'Manqué',
};

export default function DashboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Tableau de bord" subtitle="Vue en temps réel" />
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {STATS.map(({ label, value, delta, icon: Icon, color }) => (
            <div key={label} className="glass-card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>{label}</span>
                <div style={{ width: 28, height: 28, background: color + '20', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color={color} />
                </div>
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {value}
              </div>
              <div style={{ fontSize: 10, color, marginTop: 4 }}>{delta}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, minHeight: 400 }}>

          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600 }}>Appels récents</h2>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Aujourd'hui • 127 total</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['ID', 'Patient', 'Scénario', 'Département', 'Durée', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_CALLS.map((call, i) => (
                  <tr key={call.id} style={{ borderBottom: i < RECENT_CALLS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '10px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-muted)' }}>{call.id}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{call.patient}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{call.phone}</div>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text)' }}>{call.scenario}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', background: 'var(--teal-dim)', color: 'var(--teal)', borderRadius: 4 }}>{call.dept}</span>
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-muted)' }}>{call.duration ?? '—'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: STATUS_COLORS[call.status as keyof typeof STATUS_COLORS] }}>
                        <span style={{ width: 6, height: 6, background: STATUS_COLORS[call.status as keyof typeof STATUS_COLORS], borderRadius: '50%' }} />
                        {STATUS_LABELS[call.status as keyof typeof STATUS_LABELS]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600 }}>Appels actifs</h2>
              <span style={{ background: 'var(--mint-dim)', color: 'var(--mint)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>
                {ACTIVE_CALLS.length} en cours
              </span>
            </div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ACTIVE_CALLS.map((call) => (
                <div key={call.id} style={{ padding: '12px 14px', background: 'var(--midnight)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{call.patient}</span>
                    <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--teal)' }}>{call.time}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>{call.scenario}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 24 }}>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} style={{
                        width: 3, borderRadius: 2, background: 'var(--teal)', opacity: 0.5 + Math.random() * 0.5,
                        height: `${20 + Math.random() * 80}%`,
                        animation: `waveform ${0.4 + Math.random() * 0.6}s ease-in-out infinite`,
                        animationDelay: `${i * 0.04}s`,
                      }} />
                    ))}
                    <span style={{ marginLeft: 'auto', fontSize: 10, background: 'var(--teal-dim)', color: 'var(--teal)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                      {call.lang}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
