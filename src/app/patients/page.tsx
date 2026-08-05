'use client';

import Header from '@/components/layout/Header';
import { Search, Plus, Filter, Phone, Mail, Calendar, AlertCircle } from 'lucide-react';

const PATIENTS = [
  { id: 'P-0001', firstName: 'Marie', lastName: 'Leclerc', dob: '1985-03-12', phone: '(514) 555-0142', email: 'marie.leclerc@email.com', doctor: 'Dr. Martin', dept: 'Physiothérapie', lang: 'FR', lastVisit: '2026-07-28', allergies: ['Pénicilline'], status: 'active' },
  { id: 'P-0002', firstName: 'Ahmed', lastName: 'Benali', dob: '1978-11-04', phone: '(438) 555-0287', email: 'a.benali@email.com', doctor: 'Dr. Tremblay', dept: 'Médecine familiale', lang: 'AR', lastVisit: '2026-07-15', allergies: [], status: 'active' },
  { id: 'P-0003', firstName: 'Sarah', lastName: 'Johnson', dob: '1992-06-29', phone: '(514) 555-0391', email: 'sjohnson@email.com', doctor: 'Dr. Beaupré', dept: 'Cardiologie', lang: 'EN', lastVisit: '2026-08-01', allergies: ['Aspirine', 'Codéine'], status: 'active' },
  { id: 'P-0004', firstName: 'Jean', lastName: 'Tremblay', dob: '1960-01-17', phone: '(450) 555-0054', email: null, doctor: 'Dr. Martin', dept: 'Gériatrie', lang: 'FR', lastVisit: '2026-06-30', allergies: [], status: 'inactive' },
  { id: 'P-0005', firstName: 'Fatima', lastName: 'Zahra', dob: '2001-08-22', phone: '(514) 555-0918', email: 'f.zahra@email.com', doctor: 'Dr. Nguyen', dept: 'Psychologie', lang: 'AR', lastVisit: '2026-07-20', allergies: ['Latex'], status: 'active' },
  { id: 'P-0006', firstName: 'Louis', lastName: 'Bergeron', dob: '1975-04-08', phone: '(438) 555-0632', email: 'louis.b@email.com', doctor: 'Dr. Tremblay', dept: 'Urgence mineure', lang: 'FR', lastVisit: '2026-08-05', allergies: [], status: 'active' },
];

function getInitials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

function getAge(dob: string) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export default function PatientsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Patients" subtitle="Gestion des dossiers patients" />
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', flex: 1, maxWidth: 400 }}>
            <Search size={14} color="var(--text-muted)" />
            <input placeholder="Nom, téléphone, RAMQ..." style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, width: '100%' }} />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
            <Filter size={13} /> Filtres
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--teal)', border: 'none', borderRadius: 8, color: 'var(--midnight)', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
            <Plus size={14} /> Nouveau patient
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            ['Total patients', '2 847'],
            ['Actifs ce mois', '341'],
            ['Nouveaux (août)', '47'],
            ['Avec allergies', '312'],
          ].map(([label, val]) => (
            <div key={label} className="glass-card" style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Patient', 'Âge / Naissance', 'Contact', 'Médecin / Dép.', 'Dernière visite', 'Allergies', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PATIENTS.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < PATIENTS.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32,
                        background: 'var(--teal-dim)',
                        borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: 'var(--teal)',
                        flexShrink: 0,
                      }}>
                        {getInitials(p.firstName, p.lastName)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.firstName} {p.lastName}</div>
                        <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>{p.id}</div>
                      </div>
                      <span style={{ fontSize: 10, background: 'var(--teal-dim)', color: 'var(--teal)', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>{p.lang}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{getAge(p.dob)} ans</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(p.dob).toLocaleDateString('fr-CA')}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text)' }}>
                        <Phone size={10} color="var(--text-muted)" /> {p.phone}
                      </span>
                      {p.email && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                          <Mail size={10} /> {p.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{p.doctor}</div>
                    <span style={{ fontSize: 10, background: 'var(--teal-dim)', color: 'var(--teal)', padding: '1px 6px', borderRadius: 4 }}>{p.dept}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                      <Calendar size={11} />
                      {new Date(p.lastVisit).toLocaleDateString('fr-CA')}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {p.allergies.length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <AlertCircle size={12} color="var(--urgent)" />
                        <span style={{ fontSize: 11, color: 'var(--urgent)' }}>{p.allergies.join(', ')}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Aucune</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button style={{ fontSize: 11, padding: '4px 10px', background: 'var(--teal-dim)', border: '1px solid var(--teal)', borderRadius: 6, color: 'var(--teal)', cursor: 'pointer' }}>
                      Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
