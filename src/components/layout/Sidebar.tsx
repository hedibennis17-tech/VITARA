'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Phone, Users, Calendar,
  Stethoscope, Receipt, BarChart3, Settings,
  Activity, Mic
} from 'lucide-react';

const NAV = [
  { label: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { label: 'Centre d\'appel', href: '/centre-appel', icon: Phone, badge: 3 },
  { label: 'Patients', href: '/patients', icon: Users },
  { label: 'Agenda', href: '/agenda', icon: Calendar },
  { label: "Centre d'appel", href: '/centre-appel', icon: Phone },
  { label: 'Personnel', href: '/personnel', icon: Stethoscope },
  { label: 'Facturation', href: '/facturation', icon: Receipt },
  { label: 'Rapports', href: '/rapports', icon: BarChart3 },
  { label: 'Paramètres', href: '/parametres', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 240,
        minHeight: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, var(--teal), var(--mint))',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mic size={18} color="#070F1C" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, var(--teal), var(--mint))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              VITARA
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: -2 }}>
              CENTRE D'APPEL IA
            </div>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div style={{
        margin: '12px 16px',
        padding: '8px 12px',
        background: 'rgba(0, 229, 160, 0.08)',
        border: '1px solid rgba(0, 229, 160, 0.2)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{ position: 'relative', width: 8, height: 8 }}>
          <div style={{
            width: 8, height: 8,
            background: 'var(--mint)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'var(--mint)',
            borderRadius: '50%',
            animation: 'pulse-ring 1.5s ease-out infinite',
          }} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--mint)', fontWeight: 500 }}>
          IA opérationnelle
        </span>
        <Activity size={12} color="var(--mint)" style={{ marginLeft: 'auto' }} />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {NAV.map(({ label, href, icon: Icon, badge }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 20px',
                margin: '1px 8px',
                borderRadius: 8,
                textDecoration: 'none',
                color: isActive ? 'var(--teal)' : 'var(--text-muted)',
                background: isActive ? 'var(--teal-dim)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--teal)' : '2px solid transparent',
                fontWeight: isActive ? 500 : 400,
                fontSize: 13,
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge && (
                <span style={{
                  background: 'var(--teal)',
                  color: 'var(--midnight)',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 10,
                  minWidth: 18,
                  textAlign: 'center',
                }}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom info */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border)',
        fontSize: 11,
        color: 'var(--text-dim)',
      }}>
        <div style={{ marginBottom: 2, fontWeight: 500 }}>v1.0.0-alpha</div>
        <div>Clinique Médicale JOLIBOURG de Laval</div>
      </div>
    </aside>
  );
}
