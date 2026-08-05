'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { success: boolean; error?: { message: string } };

      if (!res.ok || !data.success) {
        setError(data.error?.message ?? 'Erreur de connexion');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Erreur réseau — veuillez réessayer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--midnight)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, var(--teal), var(--mint))',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Mic size={26} color="#070F1C" strokeWidth={2.5} />
          </div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, var(--teal), var(--mint))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            VITARA
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.1em' }}>
            CENTRE D'APPEL IA MÉDICAL
          </div>
        </div>

        {/* Formulaire */}
        <div className="glass-card" style={{ padding: 32 }}>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 8,
          }}>
            Connexion
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
            Accédez à votre espace VITARA
          </p>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px',
              background: 'var(--urgent-dim)',
              border: '1px solid var(--urgent)',
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 13,
              color: 'var(--urgent)',
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Adresse courriel
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@clinique.ca"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--midnight)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 14px',
                    background: 'var(--midnight)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text)',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    display: 'flex',
                  }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? 'var(--border)' : 'var(--teal)',
                border: 'none',
                borderRadius: 8,
                color: loading ? 'var(--text-muted)' : 'var(--midnight)',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 8,
                transition: 'all 0.15s',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Roles info */}
          <div style={{
            marginTop: 24,
            padding: '12px 16px',
            background: 'var(--midnight)',
            borderRadius: 8,
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Rôles disponibles
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Administrateur', 'Superviseur', 'Réceptionniste', 'Médecin', 'Thérapeute', 'Infirmière'].map(r => (
                <span key={r} style={{
                  fontSize: 10, padding: '2px 8px',
                  background: 'var(--teal-dim)', color: 'var(--teal)',
                  borderRadius: 4,
                }}>
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--text-dim)' }}>
          VITARA v1.0.0 · Clinique Santé Montréal
        </p>
      </div>
    </div>
  );
}
