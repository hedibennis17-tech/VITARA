'use client';

import Header from '@/components/layout/Header';
import { Plus, Search, Circle } from 'lucide-react';

const STAFF = [
  { id: 'S-001', firstName: 'Sophie', lastName: 'Martin', role: 'Médecin de famille', dept: 'Médecine familiale', email: 's.martin@vitara.ca', phone: '(514) 555-0001', langs: ['FR', 'EN'], status: 'available', patients: 187 },
  { id: 'S-002', firstName: 'Marc', lastName: 'Tremblay', role: 'Médecin de famille', dept: 'Médecine familiale', email: 'm.tremblay@vitara.ca', phone: '(514) 555-0002', langs: ['FR'], status: 'busy', patients: 203 },
  { id: 'S-003', firstName: 'Linh', lastName: 'Nguyen', role: 'Psychologue', dept: 'Psychologie', email: 'l.nguyen@vitara.ca', phone: '(514) 555-0003', langs: ['FR', 'EN', 'VI'], status: 'available', patients: 64 },
  { id: 'S-004', firstName: 'Émilie', lastName: 'Beaupré', role: 'Cardiologue', dept: 'Cardiologie', email: 'e.beaupre@vitara.ca', phone: '(514) 555-0004', langs: ['FR', 'EN'], status: 'off', patients: 91 },
  { id: 'S-005', firstName: 'Omar', lastName: 'Khalil', role: 'Physiothérapeute', dept: 'Physiothérapie', email: 'o.khalil@vitara.ca', phone: '(514) 555-0005', langs: ['FR', 'AR', 'EN'], status: 'available', patients: 142 },
  { id: 'S-006', firstName: 'Chantal', lastName: 'Dubois', role: 'Nutritionniste', dept: 'Nutrition clinique', email: 'c.dubois@vitara.ca', phone: '(514) 555-0006', langs: ['FR'], status: 'busy', patients: 78 },
  { id: 'S-007', firstName: 'David', lastName: 'Roy', role: 'Ergothérapeute', dept: 'Ergothérapie', email: 'd.roy@vitara.ca', phone: '(514) 555-0007', langs: ['FR', 'EN'], status: 'available', patients: 55 },
  { id: 'S-008', firstName: 'Isabelle', lastName: 'Gauthier', role: 'Infirmière', dept: 'Médecine familiale', email: 'i.gauthier@vitara.ca', phone: '(514) 555-0008', langs: ['FR', 'EN'], status: 'available', patients: 0 },
];

const ROLE_COLORS: Record<string, string> = {
  'Médecin de famille': '#00C5D4',
  'Psychologue': '#A78BFA',
  'Cardiologue': '#F87171',
  'Physiothérapeute': '#00E5A0',
  'Nutritionniste': '#86EFAC',
  'Ergothérapeute': '#34D399',
  'Infirmière': '#7DD3FC',
};

const STATUS_CONFIG = {
  available: { label: 'Disponible', color: '#00E5A0' },
  busy: { label: 'Occupé', color: '#F9A826' },
  off: { label: 'Absent', color: '#5E7A96' },
};

function getInitials(f: string, l: string) { return `${f[0]}${l[0]}`.toUpperCase(); }

export default function PersonnelPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Personnel" subtitle="Équipe médicale et administrative" />
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', flex: 1, maxWidth: 360 }}>
            <Search size={14} color="var(--text-muted)" />
            <input placeholder="Chercher un professionnel..." style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, width: '100%' }} />
          </div>
          {['Tous', 'Médecins', 'Réadaptation', 'Spécialistes', 'Infirmières'].map(f => (
            <button key={f} style={{ padding: '7px 14px', background: f === 'Tous' ? 'var(--teal)' : 'var(--surface)', border: `1px solid ${f === 'Tous' ? 'var(--teal)' : 'var(--border)'}`, borderRadius: 7, color: f === 'Tous' ? 'var(--midnight)' : 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontWeight: f === 'Tous' ? 600 : 400 }}>
              {f}
            </button>
          ))}
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--teal)', border: 'none', borderRadius: 8, color: 'var(--midnight)', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
            <Plus size={14} /> Ajouter
          </button>
        </div>

        {/* Grille cartes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {STAFF.map(member => {
            const color = ROLE_COLORS[member.role] ?? 'var(--teal)';
            const status = STATUS_CONFIG[member.status as keyof typeof STATUS_CONFIG];
            return (
              <div key={member.id} className="glass-card" style={{ padding: 18, cursor: 'pointer', transition: 'border-color 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, background: color + '20', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color, flexShrink: 0 }}>
                      {getInitials(member.firstName, member.lastName)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{member.firstName} {member.lastName}</div>
                      <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>{member.id}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Circle size={7} fill={status.color} color={status.color} />
                    <span style={{ fontSize: 10, color: status.color }}>{status.label}</span>
                  </div>
                </div>

                <div style={{ fontSize: 11, padding: '3px 8px', background: color + '15', color, borderRadius: 5, display: 'inline-block', marginBottom: 10 }}>
                  {member.role}
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{member.dept}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>{member.email}</div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {member.langs.map(l => (
                      <span key={l} style={{ fontSize: 9, background: 'var(--teal-dim)', color: 'var(--teal)', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>{l}</span>
                    ))}
                  </div>
                  {member.patients > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{member.patients} patients</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
