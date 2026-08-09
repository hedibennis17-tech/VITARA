'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Phone, Clock, Mic, PhoneMissed, UserCheck, Calendar, TrendingUp, Wifi, WifiOff } from 'lucide-react';

interface DashboardData {
  calls: { calls_today: number; calls_active: number; calls_missed: number; calls_queued: number; calls_ai: number; avg_duration_sec: number };
  appointments: { appointments_today: number; confirmed: number; completed: number; cancelled: number; pending: number };
  patients: { patients_served_today: number };
  activeCalls: Array<{ id: string; caller_phone: string; status: string; language: string; ai_intent?: string; scenario?: string; patient_name?: string; elapsed_sec?: number; handled_by_ai: boolean }>;
  upcomingAppointments: Array<{ id: string; start_time: string; patient_name: string; provider_name: string; department_name: string; department_color: string; status: string; type: string }>;
  demoMode?: boolean;
}

const STATUS_COLORS: Record<string, string> = { confirmed: 'var(--mint)', scheduled: 'var(--teal)', completed: '#34D399', cancelled: 'var(--urgent)', no_show: '#F9A826', waiting: '#F9A826' };
const STATUS_LABELS: Record<string, string> = { confirmed: 'Confirmé', scheduled: 'Planifié', completed: 'Complété', cancelled: 'Annulé', no_show: 'Absent', waiting: 'En attente' };

function fmtDuration(sec?: number | null): string {
  if (!sec) return '—';
  const m = Math.floor(sec / 60); const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard', { credentials: 'include' });
        if (res.status === 401) { router.push('/login'); return; }
        if (!res.ok) throw new Error('Erreur API');
        const json = await res.json() as { success: boolean; data: DashboardData };
        if (json.success) setData(json.data);
        else throw new Error('Données invalides');
      } catch (e) {
        setError('Impossible de charger les données. Reconnectez-vous.');
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [router]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header title="Tableau de bord" subtitle="Chargement..." />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTop: '3px solid var(--teal)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Connexion à la base de données...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header title="Tableau de bord" />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <p style={{ color: 'var(--urgent)', marginBottom: 16 }}>{error}</p>
          <button onClick={() => router.push('/login')} style={{ padding: '8px 20px', background: 'var(--teal)', border: 'none', borderRadius: 8, color: 'var(--midnight)', fontWeight: 600, cursor: 'pointer' }}>
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );

  if (!data) return null;

  const c = data.calls; const a = data.appointments;

  const STATS = [
    { label: "Appels aujourd'hui", value: String(c.calls_today ?? 0), delta: `${c.calls_ai ?? 0} par IA`, icon: Phone, color: 'var(--teal)' },
    { label: 'En cours', value: String(c.calls_active ?? 0), delta: `${c.calls_queued ?? 0} en attente`, icon: Mic, color: 'var(--mint)' },
    { label: 'Appels manqués', value: String(c.calls_missed ?? 0), delta: 'aujourd\'hui', icon: PhoneMissed, color: 'var(--urgent)' },
    { label: 'Durée moyenne', value: fmtDuration(c.avg_duration_sec), delta: 'par appel', icon: Clock, color: '#F9A826' },
    { label: 'Patients servis', value: String(data.patients?.patients_served_today ?? 0), delta: 'aujourd\'hui', icon: UserCheck, color: '#A78BFA' },
    { label: 'Rendez-vous', value: String(a.appointments_today ?? 0), delta: `${a.confirmed ?? 0} confirmés`, icon: Calendar, color: '#34D399' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Tableau de bord" subtitle={data.demoMode ? '⚡ Mode démo — données représentatives' : 'Données en temps réel'} />

      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Bannière mode démo */}
        {data.demoMode && (
          <div style={{ padding: '10px 16px', background: 'rgba(249,168,38,0.1)', border: '1px solid rgba(249,168,38,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
            <WifiOff size={14} color="#F9A826" />
            <span style={{ color: '#F9A826', fontWeight: 500 }}>Mode démo actif</span>
            <span style={{ color: 'var(--text-muted)' }}>— Connectez PostgreSQL via DATABASE_URL pour des données réelles</span>
            <a href="/login" style={{ marginLeft: 'auto', color: 'var(--teal)', fontSize: 11, textDecoration: 'none' }}>Changer de compte →</a>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {STATS.map(({ label, value, delta, icon: Icon, color }) => (
            <div key={label} className="glass-card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>{label}</span>
                <div style={{ width: 28, height: 28, background: color + '20', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color={color} />
                </div>
              </div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 10, color, marginTop: 4 }}>{delta}</div>
            </div>
          ))}
        </div>

        {/* Content grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, flex: 1 }}>

          {/* Rendez-vous du jour */}
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, fontWeight: 600 }}>Rendez-vous du jour</h2>
              <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                {[['confirmed','Confirmés',a.confirmed??0,'var(--mint)'],['pending','En attente',a.pending??0,'#F9A826'],['completed','Complétés',a.completed??0,'var(--teal)']].map(([k,l,v,c]) => (
                  <span key={k as string} style={{ color: c as string }}>{l}: <b>{v}</b></span>
                ))}
              </div>
            </div>
            {data.upcomingAppointments.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Aucun rendez-vous restant aujourd'hui</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Heure','Patient','Professionnel','Département','Type','Statut'].map(h => (
                      <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.upcomingAppointments.map((appt, i) => (
                    <tr key={appt.id} style={{ borderBottom: i < data.upcomingAppointments.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '10px 16px', fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 600, color: 'var(--teal)' }}>
                        {String(appt.start_time).slice(0, 5)}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{appt.patient_name}</td>
                      <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--text-muted)' }}>{appt.provider_name}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', background: (appt.department_color || 'var(--teal)') + '20', color: appt.department_color || 'var(--teal)', borderRadius: 4 }}>
                          {appt.department_name}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 11, padding: '2px 6px', background: appt.type === 'teleconsult' ? '#818CF820' : 'var(--teal-dim)', color: appt.type === 'teleconsult' ? '#818CF8' : 'var(--teal)', borderRadius: 4 }}>
                          {appt.type === 'teleconsult' ? '📹 Vidéo' : '🏥 Présentiel'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: STATUS_COLORS[appt.status] ?? 'var(--text-muted)' }}>
                          <span style={{ width: 6, height: 6, background: STATUS_COLORS[appt.status] ?? 'var(--border)', borderRadius: '50%' }} />
                          {STATUS_LABELS[appt.status] ?? appt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Appels actifs */}
          <div className="glass-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, fontWeight: 600 }}>Appels actifs</h2>
              <span style={{ background: 'var(--mint-dim)', color: 'var(--mint)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>
                {data.activeCalls.length} en cours
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.activeCalls.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Aucun appel en cours</div>
              ) : (
                data.activeCalls.map(call => (
                  <div key={call.id} style={{ padding: '12px 14px', background: 'var(--midnight)', borderRadius: 10, border: `1px solid ${call.status === 'active' ? 'var(--border-2)' : 'var(--border)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                        {call.patient_name ?? call.caller_phone}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {call.elapsed_sec && (
                          <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: 'var(--teal)' }}>
                            {fmtDuration(call.elapsed_sec)}
                          </span>
                        )}
                        <span style={{ fontSize: 9, background: call.status === 'active' ? 'var(--teal-dim)' : '#F9A82620', color: call.status === 'active' ? 'var(--teal)' : '#F9A826', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                          {call.status === 'active' ? 'EN COURS' : 'EN ATTENTE'}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
                      {call.scenario ?? (call.ai_intent ? call.ai_intent.replace(/_/g, ' ') : 'Identification en cours...')}
                    </div>
                    {call.status === 'active' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 20 }}>
                        {Array.from({ length: 28 }).map((_, i) => (
                          <div key={i} style={{ width: 3, borderRadius: 2, background: 'var(--teal)', height: '60%', opacity: 0.3 + ((i * 7) % 10) / 15, animation: `waveform ${0.4 + (i % 5) * 0.1}s ease-in-out infinite`, animationDelay: `${i * 0.04}s` }} />
                        ))}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                          <span style={{ fontSize: 9, background: call.handled_by_ai ? 'var(--teal-dim)' : '#F9A82620', color: call.handled_by_ai ? 'var(--teal)' : '#F9A826', padding: '2px 5px', borderRadius: 3, fontWeight: 600 }}>
                            {call.handled_by_ai ? '🤖 IA' : '👤'}
                          </span>
                          <span style={{ fontSize: 9, background: 'var(--surface-2)', color: 'var(--text-muted)', padding: '2px 5px', borderRadius: 3, fontWeight: 600 }}>
                            {call.language?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Mini stats en bas */}
            <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['Total', String(c.calls_today ?? 0), 'var(--text)'], ['IA', `${c.calls_ai ?? 0}`, 'var(--teal)'], ['Manqués', String(c.calls_missed ?? 0), 'var(--urgent)']].map(([l, v, color]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: "'Space Grotesk',sans-serif" }}>{v}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
