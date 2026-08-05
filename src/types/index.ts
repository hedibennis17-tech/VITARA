// ============================================================
// VITARA — Types centralisés
// ============================================================

export type Language = 'fr' | 'en' | 'ar';
export type CallStatus = 'queued' | 'active' | 'completed' | 'transferred' | 'missed';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show' | 'waiting';
export type Gender = 'M' | 'F' | 'other';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

// ─── Patient ────────────────────────────────────────────────
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  phoneAlt?: string;
  email?: string;
  address: Address;
  ramqNumber?: string;
  insuranceNumber?: string;
  insuranceProvider?: string;
  allergies: string[];
  primaryDoctorId?: string;
  language: Language;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}

// ─── Staff / Personnel ──────────────────────────────────────
export type StaffRole =
  | 'physician' | 'nurse' | 'physiotherapist'
  | 'psychologist' | 'nutritionist' | 'occupational-therapist'
  | 'kinesiologist' | 'osteopath' | 'chiropractor'
  | 'massage-therapist' | 'secretary' | 'admin';

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  departmentId: string;
  phone?: string;
  email: string;
  licenseNumber?: string;
  languages: Language[];
  schedule: WeeklySchedule;
  avatar?: string;
  isActive: boolean;
}

export interface WeeklySchedule {
  mon?: DaySchedule;
  tue?: DaySchedule;
  wed?: DaySchedule;
  thu?: DaySchedule;
  fri?: DaySchedule;
  sat?: DaySchedule;
  sun?: DaySchedule;
}

export interface DaySchedule {
  start: string;
  end: string;
  breaks?: { start: string; end: string }[];
}

// ─── Département ────────────────────────────────────────────
export interface Department {
  id: string;
  name: string;
  nameEn: string;
  category: DepartmentCategory;
  icon: string;
  color: string;
  staffIds: string[];
}

export type DepartmentCategory =
  | 'medicine' | 'rehabilitation' | 'nutrition'
  | 'womens-health' | 'imaging' | 'laboratory'
  | 'specialists' | 'surgery' | 'mental-health';

// ─── Rendez-vous ────────────────────────────────────────────
export interface Appointment {
  id: string;
  patientId: string;
  staffId: string;
  departmentId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  type: 'in-person' | 'teleconsult';
  reason?: string;
  notes?: string;
  callId?: string;
  createdAt: string;
}

// ─── Appel ──────────────────────────────────────────────────
export interface Call {
  id: string;
  patientId?: string;
  phone: string;
  status: CallStatus;
  language: Language;
  startTime: string;
  endTime?: string;
  duration?: number;
  scenario?: string;
  aiTranscript?: string;
  aiSummary?: string;
  transferredToId?: string;
  recordingUrl?: string;
  priority: Priority;
}

// ─── Facturation ────────────────────────────────────────────
export type BillingType = 'ramq' | 'private-insurance' | 'self-pay';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refused' | 'refunded';

export interface Invoice {
  id: string;
  patientId: string;
  appointmentId: string;
  amount: number;
  billingType: BillingType;
  insuranceClaimNumber?: string;
  status: PaymentStatus;
  issuedAt: string;
  paidAt?: string;
}

// ─── Dashboard Stats ─────────────────────────────────────────
export interface DashboardStats {
  callsToday: number;
  callsActive: number;
  callsMissed: number;
  avgWaitTime: number;
  avgCallDuration: number;
  appointmentsToday: number;
  appointmentsPending: number;
  patientsServedToday: number;
  agentsAvailable: number;
}
