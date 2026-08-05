'use client';

import Header from '@/components/layout/Header';
import { Settings, Mic, Phone, Globe, Shield, Bell, Database } from 'lucide-react';

const SECTIONS = [
  {
    icon: Mic,
    title: 'IA Vocale',
    color: 'var(--teal)',
    settings: [
      { label: 'Moteur STT', value: 'OpenAI Whisper', type: 'select' },
      { label: 'Moteur TTS', value: 'ElevenLabs', type: 'select' },
      { label: 'Modèle IA', value: 'GPT-4o', type: 'select' },
      { label: 'Langue par défaut', value: 'Français (CA)', type: 'select' },
      { label: 'Langues supportées', value: 'FR, EN, AR', type: 'text' },
      { label: 'Seuil confiance IA', value: '85%', type: 'range' },
    ],
  },
  {
    icon: Phone,
    title: 'Téléphonie',
    color: '#A78BFA',
    settings: [
      { label: 'Fournisseur', value: 'Twilio', type: 'select' },
      { label: 'Numéro principal', value: '+1 (514) 555-0100', type: 'text' },
      { label: 'Enregistrement appels', value: 'Activé', type: 'toggle' },
      { label: 'Transfert auto (urgent)', value: 'Activé', type: 'toggle' },
      { label: 'Max appels simultanés', value: '12', type: 'number' },
    ],
  },
  {
    icon: Globe,
    title: 'Clinique',
    color: '#00E5A0',
    settings: [
      { label: 'Nom de la clinique', value: 'Clinique Santé Montréal', type: 'text' },
      { label: 'Adresse', value: '123 rue Peel, Montréal, QC', type: 'text' },
      { label: 'Heures d\'ouverture', value: 'Lun-Ven 8h-18h', type: 'text' },
      { label: 'Urgences 24/7', value: 'Non', type: 'toggle' },
      { label: 'Fuseau horaire', value: 'America/Toronto (EST)', type: 'select' },
    ],
  },
  {
    icon: Shield,
    title: 'Sécurité',
    color: '#F9A826',
    settings: [
      { label: 'Chiffrement données', value: 'AES-256', type: 'text' },
      { label: 'Auth 2 facteurs', value: 'Activé', type: 'toggle' },
      { label: 'Journal d\'audit', value: 'Activé', type: 'toggle' },
      { label: 'Durée session', value: '8 heures', type: 'select' },
      { label: 'Conformité LPRPDE', value: 'Conforme', type: 'text' },
    ],
  },
];

export default function ParametresPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Paramètres" subtitle="Configuration du système VITARA" />
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {SECTIONS.map(({ icon: Icon, title, color, settings }) => (
            <div key={title} className="glass-card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: color + '20', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} color={color} />
                </div>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600 }}>{title}</h2>
              </div>
              <div style={{ padding: '8px 0' }}>
                {settings.map(({ label, value, type }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
                    {type === 'toggle' ? (
                      <div style={{
                        width: 36, height: 20,
                        background: value === 'Activé' ? 'var(--teal)' : 'var(--border-2)',
                        borderRadius: 10,
                        position: 'relative',
                        cursor: 'pointer',
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: 2,
                          left: value === 'Activé' ? 18 : 2,
                          width: 16, height: 16,
                          background: 'white',
                          borderRadius: '50%',
                          transition: 'left 0.2s',
                        }} />
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Version info */}
        <div className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--teal), var(--mint))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={16} color="var(--midnight)" />
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600 }}>VITARA v1.0.0-alpha</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Centre d'appel IA médical · Montréal, QC</div>
          </div>
          <button style={{ marginLeft: 'auto', padding: '7px 16px', background: 'var(--teal)', border: 'none', borderRadius: 8, color: 'var(--midnight)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
