export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', href: '/', icon: 'LayoutDashboard' },
  { label: 'Centre d\'appel', href: '/centre-appel', icon: 'Phone' },
  { label: 'Patients', href: '/patients', icon: 'Users' },
  { label: 'Agenda', href: '/agenda', icon: 'Calendar' },
  { label: 'Personnel', href: '/personnel', icon: 'Stethoscope' },
  { label: 'Facturation', href: '/facturation', icon: 'Receipt' },
  { label: 'Rapports', href: '/rapports', icon: 'BarChart3' },
  { label: 'Paramètres', href: '/parametres', icon: 'Settings' },
];

export const CALL_SCENARIOS = [
  'Prise de rendez-vous',
  'Annulation rendez-vous',
  'Modification rendez-vous',
  'Nouveau patient',
  'Résultats d\'examen',
  'Urgence mineure',
  'Paiement / facturation',
  'Renseignements généraux',
  'Transfert médecin',
  'Téléconsultation',
];
