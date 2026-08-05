import { Department } from '@/types';

export const DEPARTMENTS: Department[] = [
  // ── Médecine ──
  { id: 'med-familiale', name: 'Médecine familiale', nameEn: 'Family Medicine', category: 'medicine', icon: '🩺', color: '#00C5D4', staffIds: [] },
  { id: 'urgence-mineure', name: 'Urgence mineure', nameEn: 'Minor Emergency', category: 'medicine', icon: '🚑', color: '#FF4F4F', staffIds: [] },
  { id: 'pediatrie', name: 'Pédiatrie', nameEn: 'Pediatrics', category: 'medicine', icon: '👶', color: '#F9A826', staffIds: [] },
  { id: 'geriatrie', name: 'Gériatrie', nameEn: 'Geriatrics', category: 'medicine', icon: '🧓', color: '#A78BFA', staffIds: [] },
  // ── Santé mentale ──
  { id: 'psychiatrie', name: 'Psychiatrie', nameEn: 'Psychiatry', category: 'mental-health', icon: '🧠', color: '#818CF8', staffIds: [] },
  { id: 'psychologie', name: 'Psychologie', nameEn: 'Psychology', category: 'mental-health', icon: '💭', color: '#A78BFA', staffIds: [] },
  // ── Réadaptation ──
  { id: 'physio', name: 'Physiothérapie', nameEn: 'Physiotherapy', category: 'rehabilitation', icon: '🦾', color: '#00E5A0', staffIds: [] },
  { id: 'ergo', name: 'Ergothérapie', nameEn: 'Occupational Therapy', category: 'rehabilitation', icon: '🖐️', color: '#34D399', staffIds: [] },
  { id: 'kinesiologie', name: 'Kinésiologie', nameEn: 'Kinesiology', category: 'rehabilitation', icon: '🏃', color: '#6EE7B7', staffIds: [] },
  { id: 'osteopathie', name: 'Ostéopathie', nameEn: 'Osteopathy', category: 'rehabilitation', icon: '🦴', color: '#A7F3D0', staffIds: [] },
  { id: 'chiropratique', name: 'Chiropratique', nameEn: 'Chiropractic', category: 'rehabilitation', icon: '🔧', color: '#D1FAE5', staffIds: [] },
  { id: 'massotherapie', name: 'Massothérapie', nameEn: 'Massage Therapy', category: 'rehabilitation', icon: '💆', color: '#BAE6FD', staffIds: [] },
  // ── Nutrition ──
  { id: 'nutrition', name: 'Nutrition clinique', nameEn: 'Clinical Nutrition', category: 'nutrition', icon: '🥗', color: '#86EFAC', staffIds: [] },
  { id: 'diabete', name: 'Diabète', nameEn: 'Diabetes', category: 'nutrition', icon: '💉', color: '#F9A826', staffIds: [] },
  { id: 'poids', name: 'Perte de poids', nameEn: 'Weight Management', category: 'nutrition', icon: '⚖️', color: '#FDE68A', staffIds: [] },
  // ── Femmes ──
  { id: 'gynecologie', name: 'Gynécologie', nameEn: 'Gynecology', category: 'womens-health', icon: '🌸', color: '#F9A8D4', staffIds: [] },
  { id: 'obstetrique', name: 'Obstétrique', nameEn: 'Obstetrics', category: 'womens-health', icon: '🤰', color: '#FBCFE8', staffIds: [] },
  { id: 'fertilite', name: 'Fertilité', nameEn: 'Fertility', category: 'womens-health', icon: '🌱', color: '#DDD6FE', staffIds: [] },
  // ── Imagerie ──
  { id: 'radiologie', name: 'Radiologie', nameEn: 'Radiology', category: 'imaging', icon: '🔬', color: '#7DD3FC', staffIds: [] },
  { id: 'echographie', name: 'Échographie', nameEn: 'Ultrasound', category: 'imaging', icon: '📡', color: '#93C5FD', staffIds: [] },
  { id: 'irm', name: 'IRM', nameEn: 'MRI', category: 'imaging', icon: '🧲', color: '#C4B5FD', staffIds: [] },
  { id: 'scanner', name: 'Scanner (TDM)', nameEn: 'CT Scan', category: 'imaging', icon: '💿', color: '#A5B4FC', staffIds: [] },
  // ── Laboratoire ──
  { id: 'lab-sang', name: 'Prise de sang', nameEn: 'Blood Work', category: 'laboratory', icon: '🩸', color: '#FCA5A5', staffIds: [] },
  { id: 'lab-analyse', name: 'Analyses', nameEn: 'Lab Analysis', category: 'laboratory', icon: '🔭', color: '#FCD34D', staffIds: [] },
  { id: 'ecg', name: 'ECG', nameEn: 'ECG', category: 'laboratory', icon: '💓', color: '#F87171', staffIds: [] },
  // ── Spécialistes ──
  { id: 'cardiologie', name: 'Cardiologie', nameEn: 'Cardiology', category: 'specialists', icon: '❤️', color: '#EF4444', staffIds: [] },
  { id: 'neurologie', name: 'Neurologie', nameEn: 'Neurology', category: 'specialists', icon: '🧬', color: '#8B5CF6', staffIds: [] },
  { id: 'dermatologie', name: 'Dermatologie', nameEn: 'Dermatology', category: 'specialists', icon: '🩹', color: '#F59E0B', staffIds: [] },
  { id: 'orl', name: 'ORL', nameEn: 'ENT', category: 'specialists', icon: '👂', color: '#6EE7B7', staffIds: [] },
  { id: 'gastro', name: 'Gastroentérologie', nameEn: 'Gastroenterology', category: 'specialists', icon: '🫁', color: '#34D399', staffIds: [] },
  { id: 'endocrino', name: 'Endocrinologie', nameEn: 'Endocrinology', category: 'specialists', icon: '⚗️', color: '#A78BFA', staffIds: [] },
  // ── Chirurgie ──
  { id: 'chir-generale', name: 'Chirurgie générale', nameEn: 'General Surgery', category: 'surgery', icon: '🔪', color: '#64748B', staffIds: [] },
  { id: 'orthopedie', name: 'Orthopédie', nameEn: 'Orthopedics', category: 'surgery', icon: '🦴', color: '#94A3B8', staffIds: [] },
  { id: 'chir-plastique', name: 'Chirurgie plastique', nameEn: 'Plastic Surgery', category: 'surgery', icon: '✨', color: '#CBD5E1', staffIds: [] },
];

export const DEPARTMENT_CATEGORIES = {
  medicine: { label: 'Médecine', color: '#00C5D4' },
  rehabilitation: { label: 'Réadaptation', color: '#00E5A0' },
  nutrition: { label: 'Nutrition', color: '#86EFAC' },
  'womens-health': { label: 'Santé des femmes', color: '#F9A8D4' },
  imaging: { label: 'Imagerie', color: '#7DD3FC' },
  laboratory: { label: 'Laboratoire', color: '#FCA5A5' },
  specialists: { label: 'Spécialistes', color: '#A78BFA' },
  surgery: { label: 'Chirurgie', color: '#94A3B8' },
  'mental-health': { label: 'Santé mentale', color: '#818CF8' },
};
