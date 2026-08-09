'use client';
import { useEffect, useState } from 'react';

export default function Diag() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const r: Record<string, any> = {};

      // Test 1: API chat
      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }], language: 'fr', agent: 'houda', gender: 'female', conversation_state: {} }),
        });
        const d = await res.json();
        r.api_chat = { status: res.status, ok: res.ok, response: d.content?.[0]?.text?.slice(0, 100) };
      } catch (e: any) { r.api_chat = { error: e.message }; }

      // Test 2: DB patients
      try {
        const res = await fetch('/api/patients?phone=0000000000');
        const d = await res.json();
        r.api_patients = { status: res.status, ok: res.ok, db: d.db !== false };
      } catch (e: any) { r.api_patients = { error: e.message }; }

      // Test 3: DB conversations
      try {
        const res = await fetch('/api/conversations?limit=1');
        const d = await res.json();
        r.api_conversations = { status: res.status, ok: res.ok, total: d.total, db: d.db !== false };
      } catch (e: any) { r.api_conversations = { error: e.message }; }

      // Test 4: React hydration
      r.react = { mounted: true, window: typeof window !== 'undefined' };

      // Test 5: localStorage
      try {
        localStorage.setItem('__test', '1');
        localStorage.removeItem('__test');
        r.localstorage = { ok: true };
      } catch { r.localstorage = { ok: false }; }

      setResults(r);
      setLoading(false);
    };
    run();
  }, []);

  const C = { bg: '#07111F', s1: '#0D1B2E', border: '#1E3350', teal: '#00D7C8', text: '#E8F0FA', muted: '#5E7A96', mint: '#00E5A0', urgent: '#EF4444' };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: 24, fontFamily: 'monospace', color: C.text }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: C.teal }}>🔬 VITARA Diagnostic</h1>
      {loading ? (
        <p style={{ color: C.muted }}>Tests en cours...</p>
      ) : (
        Object.entries(results).map(([key, val]) => {
          const ok = val.ok !== false && !val.error;
          return (
            <div key={key} style={{ background: C.s1, border: `1px solid ${ok ? C.mint : C.urgent}44`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: ok ? C.mint : C.urgent, marginBottom: 8 }}>
                {ok ? '✅' : '❌'} {key}
              </div>
              <pre style={{ fontSize: 11, color: C.muted, overflow: 'auto', margin: 0 }}>
                {JSON.stringify(val, null, 2)}
              </pre>
            </div>
          );
        })
      )}
      <div style={{ marginTop: 20, padding: 14, background: C.s1, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <p style={{ color: C.muted, fontSize: 12 }}>Patient app: <a href="/patient" style={{ color: C.teal }}>/patient</a></p>
        <p style={{ color: C.muted, fontSize: 12 }}>DB setup: <a href="/api/db-setup" style={{ color: C.teal }}>/api/db-setup</a></p>
      </div>
    </div>
  );
}
