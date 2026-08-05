'use client';

import { Bell, Search, ChevronDown } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const now = new Date().toLocaleDateString('fr-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <header style={{
      height: 64,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      flexShrink: 0,
    }}>
      {/* Title */}
      <div style={{ flex: 1 }}>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 17,
          fontWeight: 600,
          color: 'var(--text)',
          letterSpacing: '-0.02em',
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Date */}
      <div style={{
        fontSize: 11,
        color: 'var(--text-muted)',
        textTransform: 'capitalize',
      }}>
        {now}
      </div>

      {/* Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--midnight)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '6px 12px',
        width: 200,
      }}>
        <Search size={13} color="var(--text-muted)" />
        <input
          placeholder="Rechercher..."
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontSize: 12,
            width: '100%',
          }}
        />
      </div>

      {/* Notifs */}
      <button style={{
        position: 'relative',
        background: 'var(--midnight)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 8,
        cursor: 'pointer',
        color: 'var(--text-muted)',
        display: 'flex',
      }}>
        <Bell size={15} />
        <span style={{
          position: 'absolute',
          top: 4, right: 4,
          width: 7, height: 7,
          background: 'var(--urgent)',
          borderRadius: '50%',
          border: '1.5px solid var(--surface)',
        }} />
      </button>

      {/* User */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: 8,
      }}>
        <div style={{
          width: 30, height: 30,
          background: 'linear-gradient(135deg, var(--teal), var(--mint))',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: 'var(--midnight)',
        }}>
          AD
        </div>
        <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
          Admin
        </span>
        <ChevronDown size={13} color="var(--text-muted)" />
      </div>
    </header>
  );
}
