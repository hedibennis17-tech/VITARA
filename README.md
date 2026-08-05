# VITARA — Centre d'appel IA Médical

> Plateforme omnicanale d'intelligence artificielle pour la gestion des appels d'une clinique médicale multiservices.

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Style | Tailwind CSS + CSS Variables |
| UI | Lucide Icons |
| Déploiement | Vercel |
| Base de données | Firebase / PostgreSQL (à venir) |
| Téléphonie | Twilio (à venir) |
| IA vocale STT | OpenAI Whisper (à venir) |
| IA vocale TTS | ElevenLabs (à venir) |
| Agent IA | GPT-4o (à venir) |

## Modules

- **Dashboard** — Vue temps réel : appels actifs, stats, file d'attente
- **Centre d'appel** — Gestion des appels, file d'attente, waveform IA
- **Patients** — Dossiers, recherche, historique, allergies
- **Agenda** — Calendrier semaine, rendez-vous, téléconsultes
- **Personnel** — Médecins, thérapeutes, infirmières, langues parlées
- **Facturation** — RAMQ, assurances privées, paiements directs
- **Rapports** — Statistiques, scénarios IA, performance
- **Paramètres** — Config IA, téléphonie, sécurité, clinique

## Départements couverts (30+)

Médecine familiale · Urgence mineure · Pédiatrie · Gériatrie · Psychiatrie · Psychologie · Physiothérapie · Ergothérapie · Kinésiologie · Ostéopathie · Chiropratique · Massothérapie · Nutrition clinique · Diabète · Gynécologie · Obstétrique · Fertilité · Radiologie · Échographie · IRM · Scanner · Prise de sang · ECG · Cardiologie · Neurologie · Dermatologie · ORL · Gastroentérologie · Endocrinologie · Chirurgie générale · Orthopédie · Chirurgie plastique

## Scénarios IA (100+)

Accueil · Prise/Modification/Annulation de RDV · Physiothérapie · Ergothérapie · Nutrition · Pédiatrie · Psychologie · Examens · Résultats · Paiements · Coordonnées · Dossier · Rappels · Personnel · Services · Téléconsultation · Urgences

## Langues supportées

- 🇫🇷 Français (CA)
- 🇬🇧 Anglais
- 🇸🇦 Arabe
- Extensible à d'autres langues

## Installation

```bash
npm install
npm run dev
```

## Structure

```
src/
├── app/                  # Pages (App Router)
│   ├── page.tsx          # Dashboard
│   ├── centre-appel/     # Centre d'appel
│   ├── patients/         # Gestion patients
│   ├── agenda/           # Calendrier
│   ├── personnel/        # Équipe médicale
│   ├── facturation/      # Billing
│   ├── rapports/         # Analytics
│   └── parametres/       # Configuration
├── components/           # Composants réutilisables
│   ├── layout/           # Sidebar, Header
│   └── ui/               # Composants UI
├── types/                # Types TypeScript
└── lib/                  # Utilitaires, constantes
    └── constants/
        ├── departments.ts  # 30+ départements
        └── navigation.ts   # Navigation
```

---

Développé par **hedibennis17-tech** · Montréal, QC
