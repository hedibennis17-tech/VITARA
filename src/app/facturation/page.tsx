'use client';

import Header from '@/components/layout/Header';
import { DollarSign, FileText, CreditCard, CheckCircle, Clock, XCircle } from 'lucide-react';

const INVOICES = [
  { id: 'INV-1042', patient: 'Marie Leclerc', date: '2026-08-04', dept: 'Physiothérapie', type: 'ramq', amount: 85.00, status: 'paid' },
  { id: 'INV-1043', patient: 'Ahmed Benali', date: '2026-08-04', dept: 'Médecine familiale', type: 'ramq', amount: 70.00, status: 'pending' },
  { id: 'INV-1044', patient: 'Sarah Johnson', date: '2026-08-03', dept: 'Cardiologie', type: 'private', amount: 250.00, status: 'paid' },
  { id: 'INV-1045', patient: 'Jean Tremblay', date: '2026-08-03', dept: 'Gériatrie', type: 'ramq', amount: 95.00, status: 'refused' },
  { id: 'INV-1046', patient: 'Fatima Zahra', date: '2026-08-02', dept: 'Psychologie', type: 'private', amount: 180.00, status: 'pending' },
  { id: 'INV-1047', patient: 'Louis Bergeron', date: '2026-08-02', dept: 'Urgence mineure', type: 'self-pay', amount: 120.00, status: 'paid' },
];

const TYPE_LABELS = { ramq: 'RAMQ', private: 'Assurance privée', 'self-pay': 'Paiement direct' };
const TYPE_COLORS = { ramq: '#00C5D4', private: '#A78BFA', 'self-pay': '#F9A826' };
const STATUS_ICON = {
  paid: { icon: CheckCircle, color: 'var(--mint)', label: 'Payé' },
  pending: { icon: Clock, color: '#F9A826', label: 'En attente' },
  refused: { icon: XCircle, color: 'var(--urgent)', label: 'Refusé' },
};

export default function FacturationPage() {
  const total = INVOICES.reduce((s, i) => s + i.amount, 0);
  const paid = INVOICES.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Facturation" subtitle="RAMQ · Assurances · Paiements" />
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Revenus ce mois', value: `${total.toFixed(2)} $`, icon: DollarSign, color: 'var(--mint)' },
            { label: 'Encaissé', value: `${paid.toFixed(2)} $`, icon: CheckCircle, color: 'var(--teal)' },
            { label: 'En attente', value: `${(total - paid).toFixed(2)} $`, icon: Clock, color: '#F9A826' },
            { label: 'Factures émises', value: `${INVOICES.length}`, icon: FileText, color: '#A78BFA' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                <div style={{ width: 28, height: 28, background: color + '20', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={13} color={color} />
                </div>
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Table factures */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600 }}>Factures récentes</h2>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--teal)', border: 'none', borderRadius: 7, color: 'var(--midnight)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <CreditCard size={13} /> Nouvelle facture
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['N° Facture', 'Patient', 'Date', 'Département', 'Type', 'Montant', 'Statut', ''].map(h => (
                  <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv, i) => {
                const s = STATUS_ICON[inv.status as keyof typeof STATUS_ICON];
                return (
                  <tr key={inv.id} style={{ borderBottom: i < INVOICES.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '10px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--teal)' }}>{inv.id}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{inv.patient}</td>
                    <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--text-muted)' }}>{new Date(inv.date).toLocaleDateString('fr-CA')}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', background: 'var(--teal-dim)', color: 'var(--teal)', borderRadius: 4 }}>{inv.dept}</span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', background: TYPE_COLORS[inv.type as keyof typeof TYPE_COLORS] + '20', color: TYPE_COLORS[inv.type as keyof typeof TYPE_COLORS], borderRadius: 4 }}>
                        {TYPE_LABELS[inv.type as keyof typeof TYPE_LABELS]}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {inv.amount.toFixed(2)} $
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: s.color }}>
                        <s.icon size={12} /> {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <button style={{ fontSize: 11, padding: '4px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer' }}>
                        Voir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
