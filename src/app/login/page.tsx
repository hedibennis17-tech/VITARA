'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Eye, EyeOff, AlertCircle, Users } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { email: 'admin@vitara.ca',       role: 'Administrateur',  color: '#FF4F4F' },
  { email: 'superviseur@vitara.ca', role: 'Superviseur',     color: '#F9A826' },
  { email: 'reception@vitara.ca',   role: 'Réceptionniste',  color: '#00C5D4' },
  { email: 'dr.martin@vitara.ca',   role: 'Médecin',         color: '#A78BFA' },
  { email: 'o.khalil@vitara.ca',    role: 'Physiothérapeute',color: '#00E5A0' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('admin@vitara.ca');
  const [password, setPassword] = useState('Admin1234!');
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
    <div style={{ minHeight: '100vh', background: 'var(--midnight)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 32 }}>

      {/* Panneau comptes démo */}
      <div style={{ width: 280 }}>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Comptes de test</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DEMO_ACCOUNTS.map(acc => (
            <button key={acc.email} onClick={() => { setEmail(acc.email); setPassword('Admin1234!'); setError(''); }}
              style={{ padding: '10px 14px', background: email === acc.email ? 'var(--surface-2)' : 'var(--surface)', border: `1px solid ${email === acc.email ? acc.color + '60' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: acc.color, marginBottom: 2 }}>{acc.role}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono',monospace" }}>{acc.email}</div>
            </button>
          ))}
          <div style={{ padding: '8px 14px', background: 'var(--midnight)', border: '1px dashed var(--border)', borderRadius: 8, marginTop: 4 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Mot de passe pour tous :</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal)', fontFamily: "'JetBrains Mono',monospace" }}>Admin1234!</div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, var(--teal), var(--mint))', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Mic size={26} color="#070F1C" strokeWidth={2.5} />
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', background: 'linear-gradient(135deg, var(--teal), var(--mint))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>VITARA</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.1em' }}>CENTRE D'APPEL IA MÉDICAL</div>
        </div>

        <div className="glass-card" style={{ padding: 32 }}>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Connexion</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>Sélectionnez un compte ou entrez vos identifiants</p>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--urgent-dim)', border: '1px solid var(--urgent)', borderRadius: 8, marginBottom: 18, fontSize: 12, color: 'var(--urgent)' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Adresse courriel</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: '100%', padding: '10px 14px', background: 'var(--midnight)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  style={{ width: '100%', padding: '10px 40px 10px 14px', background: 'var(--midnight)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ padding: '12px', background: loading ? 'var(--border)' : 'var(--teal)', border: 'none', borderRadius: 8, color: loading ? 'var(--text-muted)' : 'var(--midnight)', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, fontFamily: "'Space Grotesk',sans-serif" }}>
              {loading ? 'Connexion...' : 'Se connecter →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
