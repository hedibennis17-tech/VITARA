'use client';

import Header from '@/components/layout/Header';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const DAYS = ['Lun 04', 'Mar 05', 'Mer 06', 'Jeu 07', 'Ven 08'];

const APPOINTMENTS = [
  { id: 'RDV-001', patient: 'Marie Leclerc', doctor: 'Dr. Martin', dept: 'Physiothérapie', day: 0, hour: 2, duration: 1, color: '#00E5A0', type: 'in-person' },
  { id: 'RDV-002', patient: 'Ahmed Benali', doctor: 'Dr. Tremblay', dept: 'Médecine familiale', day: 0, hour: 4, duration: 1, color: '#00C5D4', type: 'in-person' },
  { id: 'RDV-003', patient: 'Sarah Johnson', doctor: 'Dr. Beaupré', dept: 'Cardiologie', day: 1, hour: 1, duration: 2, color: '#A78BFA', type: 'teleconsult' },
  { id: 'RDV-004', patient: 'Jean Tremblay', doctor: 'Dr. Martin', dept: 'Gériatrie', day: 1, hour: 5, duration: 1, color: '#F9A826', type: 'in-person' },
  { id: 'RDV-005', patient: 'Fatima Zahra', doctor: 'Dr. Nguyen', dept: 'Psychologie', day: 2, hour: 2, duration: 2, color: '#818CF8', type: 'teleconsult' },
  { id: 'RDV-006', patient: 'Louis Bergeron', doctor: 'Dr. Tremblay', dept: 'Urgence mineure', day: 3, hour: 0, duration: 1, color: '#FF4F4F', type: 'in-person' },
  { id: 'RDV-007', patient: 'Claire Fortin', doctor: 'Dr. Martin', dept: 'Physiothérapie', day: 4, hour: 3, duration: 1, color: '#00E5A0', type: 'in-person' },
];

const UPCOMING = [
  { time: '09:00', patient: 'Marie Leclerc', dept: 'Physiothérapie', status: 'confirmed' },
  { time: '11:00', patient: 'Ahmed Benali', dept: 'Médecine fam.', status: 'scheduled' },
  { time: '13:30', patient: 'Sarah Johnson', dept: 'Cardiologie', status: 'confirmed' },
  { time: '14:00', patient: 'Jean Tremblay', dept: 'Gériatrie', status: 'waiting' },
  { time: '16:00', patient: 'Louis Bergeron', dept: 'Urgence', status: 'scheduled' },
];

const STATUS_COLORS = { confirmed: 'var(--mint)', scheduled: 'var(--teal)', waiting: '#F9A826', cancelled: 'var(--urgent)' };

export default function AgendaPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Agenda" subtitle="Calendrier des rendez-vous" />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 24, gap: 16 }}>

        {/* Sidebar agenda */}
        <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Bouton nouveau RDV */}
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', background: 'var(--teal)', border: 'none', borderRadius: 10, color: 'var(--midnight)', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
            <Plus size={16} /> Nouveau rendez-vous
          </button>

          {/* Rendez-vous du jour */}
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600 }}>Aujourd'hui — 5 août</h3>
            </div>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {UPCOMING.map((rdv) => (
                <div key={rdv.time} style={{ padding: '8px 10px', background: 'var(--midnight)', borderRadius: 7, border: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--teal)', width: 40, flexShrink: 0 }}>{rdv.time}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rdv.patient}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{rdv.dept}</div>
                  </div>
                  <div style={{ width: 6, height: 6, background: STATUS_COLORS[rdv.status as keyof typeof STATUS_COLORS], borderRadius: '50%', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="glass-card" style={{ padding: 14 }}>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cette semaine</h3>
            {[['Total RDV', '62'], ['Confirmés', '47'], ['En attente', '9'], ['Annulés', '6'], ['Téléconsulte', '14']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendrier semaine */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header calendrier */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600 }}>
                Semaine du 4 août 2026
              </span>
              <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <ChevronRight size={14} />
              </button>
            </div>
            <button style={{ padding: '5px 12px', background: 'var(--teal-dim)', border: '1px solid var(--teal)', borderRadius: 6, color: 'var(--teal)', fontSize: 11, cursor: 'pointer' }}>
              Aujourd'hui
            </button>
          </div>

          {/* Grid calendrier */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(5, 1fr)', minHeight: '100%' }}>

              {/* En-têtes jours */}
              <div style={{ gridColumn: '1/-1', display: 'grid', gridTemplateColumns: '60px repeat(5, 1fr)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 2 }}>
                <div />
                {DAYS.map((d, i) => (
                  <div key={d} style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: i === 1 ? 700 : 400,
                    color: i === 1 ? 'var(--teal)' : 'var(--text-muted)',
                    borderLeft: '1px solid var(--border)',
                    background: i === 1 ? 'var(--teal-dim)' : 'transparent',
                  }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Lignes horaires */}
              {HOURS.map((hour, hi) => (
                <div key={hour} style={{ display: 'contents' }}>
                  <div style={{ padding: '8px 8px 0', fontSize: 10, color: 'var(--text-dim)', textAlign: 'right', borderBottom: '1px solid var(--border)', alignSelf: 'stretch', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                    {hour}
                  </div>
                  {DAYS.map((_, di) => {
                    const appts = APPOINTMENTS.filter(a => a.day === di && a.hour === hi);
                    return (
                      <div key={di} style={{
                        borderLeft: '1px solid var(--border)',
                        borderBottom: '1px solid var(--border)',
                        padding: 4,
                        minHeight: 56,
                        position: 'relative',
                        background: di === 1 ? 'rgba(0,197,212,0.02)' : 'transparent',
                      }}>
                        {appts.map(appt => (
                          <div key={appt.id} style={{
                            padding: '4px 6px',
                            background: appt.color + '20',
                            border: `1px solid ${appt.color}40`,
                            borderLeft: `3px solid ${appt.color}`,
                            borderRadius: 5,
                            cursor: 'pointer',
                            height: `${appt.duration * 56 - 8}px`,
                          }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: appt.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {appt.patient}
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {appt.dept} {appt.type === 'teleconsult' ? '📹' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
