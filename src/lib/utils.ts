import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function formatDate(isoDate: string, locale = 'fr-CA'): string {
  return new Date(isoDate).toLocaleDateString(locale, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('fr-CA', {
    hour: '2-digit', minute: '2-digit',
  });
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export function elapsedSeconds(isoStart: string): number {
  return Math.floor((Date.now() - new Date(isoStart).getTime()) / 1000);
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case 'urgent': return '#FF4F4F';
    case 'high': return '#F9A826';
    case 'normal': return '#00C5D4';
    default: return '#5E7A96';
  }
}

export function callStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    queued: 'En attente',
    active: 'En cours',
    completed: 'Terminé',
    transferred: 'Transféré',
    missed: 'Manqué',
  };
  return labels[status] ?? status;
}

export function appointmentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    scheduled: 'Planifié',
    confirmed: 'Confirmé',
    completed: 'Complété',
    cancelled: 'Annulé',
    'no-show': 'Absent',
    waiting: 'En attente',
  };
  return labels[status] ?? status;
}

export function languageLabel(lang: string): string {
  const labels: Record<string, string> = {
    fr: 'Français',
    en: 'English',
    ar: 'العربية',
  };
  return labels[lang] ?? lang;
}
