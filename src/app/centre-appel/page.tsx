'use client';

import Header from '@/components/layout/Header';
import { Phone, PhoneOff, PhoneForwarded, Mic, MicOff, User, Clock, Volume2 } from 'lucide-react';

const QUEUE = [
  { id: 'Q-001', phone: '(514) 555-0142', wait: '1m 22s', lang: 'FR', priority: 'normal' },
  { id: 'Q-002', phone: '(438) 555-0891', wait: '45s', lang: 'EN', priority: 'high' },
  { id: 'Q-003', phone: '(450) 555-0034', wait: '12s', lang: 'FR', priority: 'urgent' },
];

const ACTIVE = [
  { id: 'A-001', patient: 'Marie Leclerc', phone: '(514) 555-0142', time: '3m 47s', scenario: 'Prise de rendez-vous — Physiothérapie', lang: 'FR', ai: true },
  { id: 'A-002', patient: 'Ahmed Benali', phone: '(438) 555-0287', time: '1m 18s', scenario: 'Résultats d\'examen — Laboratoire', lang: 'FR', ai: true },
  { id: 'A-003', patient: 'Sarah Johnson', phone: '(514) 555-0391', time: '5m 02s', scenario: 'Transfert en cours → Dr. Martin', lang: 'EN', ai: false },
];

const PRIORITY_COLORS = { urgent: '#FF4F4F', high: '#F9A826', normal: 'var(--teal)' };
const PRIORITY_LABELS = { urgent: 'Urgent', high: 'Priorité', normal: 'Normal' };

export default function CentreAppelPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Centre d'appel" subtitle="Gestion des appels en temps réel" />

      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', gap: 16 }}>

        {/* File d'attente */}
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600 }}>File d'attente</h2>
              <span style={{ background: '#F9A82620', color: '#F9A826', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>
                {QUEUE.length} en attente
              </span>
            </div>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {QUEUE.map((q) => (
                <div key={q.id} style={{
                  padding: '10px 12px',
                  background: 'var(--midnight)',
                  borderRadius: 8,
                  border: `1px solid ${q.priority === 'urgent' ? '#FF4F4F40' : 'var(--border)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--text)' }}>{q.phone}</span>
                    <span style={{
                      fontSize: 10,
                      background: PRIORITY_COLORS[q.priority as keyof typeof PRIORITY_COLORS] + '20',
                      color: PRIORITY_COLORS[q.priority as keyof typeof PRIORITY_COLORS],
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontWeight: 600,
                    }}>
                      {PRIORITY_LABELS[q.priority as keyof typeof PRIORITY_LABELS]}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                    <Clock size={10} />
                    <span>{q.wait}</span>
                    <span style={{ marginLeft: 'auto', background: 'var(--teal-dim)', color: 'var(--teal)', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{q.lang}</span>
                  </div>
                  <button style={{
                    background: 'var(--teal)',
                    color: 'var(--midnight)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '5px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    marginTop: 2,
                  }}>
                    <Phone size={11} /> Répondre
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Stats rapides */}
          <div className="glass-card" style={{ padding: 16 }}>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)' }}>
              STATS DU JOUR
            </h3>
            {[
              ['Appels traités', '127'],
              ['Par l\'IA', '118 (93%)'],
              ['Transférés', '9 (7%)'],
              ['Durée moy.', '3m 24s'],
              ['Appels manqués', '3'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Appels actifs */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600 }}>Appels actifs</h2>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ACTIVE.length} appels simultanés</span>
          </div>

          {ACTIVE.map((call) => (
            <div key={call.id} className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 36, height: 36,
                      background: 'var(--teal-dim)',
                      borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <User size={16} color="var(--teal)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{call.patient}</div>
                      <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>{call.phone}</div>
                    </div>
                    <div style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ background: call.ai ? 'var(--teal-dim)' : 'var(--warn-dim)', color: call.ai ? 'var(--teal)' : '#F9A826', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>
                        {call.ai ? '🤖 IA' : '👤 Humain'}
                      </span>
                      <span style={{ background: 'var(--teal-dim)', color: 'var(--teal)', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}>{call.lang}</span>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--teal)' }}>
                      <Clock size={12} />
                      {call.time}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{call.scenario}</div>

                  {/* Waveform */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 32, marginBottom: 14 }}>
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div key={i} style={{
                        width: 3, borderRadius: 2, background: 'var(--teal)',
                        height: `${15 + Math.random() * 85}%`,
                        opacity: 0.3 + Math.random() * 0.7,
                        animation: `waveform ${0.3 + Math.random() * 0.7}s ease-in-out infinite`,
                        animationDelay: `${i * 0.03}s`,
                      }} />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'var(--urgent-dim)', border: '1px solid var(--urgent)', borderRadius: 8, color: 'var(--urgent)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                    <PhoneOff size={13} /> Raccrocher
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'var(--teal-dim)', border: '1px solid var(--teal)', borderRadius: 8, color: 'var(--teal)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                    <PhoneForwarded size={13} /> Transférer
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                    <Mic size={13} /> Sourdine
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                    <Volume2 size={13} /> Écouter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
