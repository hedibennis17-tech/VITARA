import { z } from 'zod';

// ================================================================
// Auth
// ================================================================

export const LoginSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

export const RegisterSchema = z.object({
  email:     z.string().email(),
  password:  z.string().min(8, 'Minimum 8 caractères'),
  firstName: z.string().min(2).max(100),
  lastName:  z.string().min(2).max(100),
  role:      z.enum(['admin','supervisor','receptionist','physician','therapist','nurse']),
  clinicId:  z.string().uuid().optional(),
});

// ================================================================
// Patient
// ================================================================

export const PatientSchema = z.object({
  firstName:         z.string().min(2).max(100),
  lastName:          z.string().min(2).max(100),
  dateOfBirth:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis'),
  gender:            z.enum(['M','F','other']),
  phone:             z.string().min(10).max(20),
  phoneAlt:          z.string().max(20).optional(),
  email:             z.string().email().optional().or(z.literal('')),
  language:          z.enum(['fr','en','ar','es','zh','pt']).default('fr'),
  address:           z.object({
    street:     z.string().optional(),
    city:       z.string().optional(),
    province:   z.string().optional(),
    postalCode: z.string().optional(),
    country:    z.string().default('CA'),
  }).optional(),
  ramqNumber:        z.string().max(20).optional(),
  ramqExpiry:        z.string().optional(),
  insuranceNumber:   z.string().max(100).optional(),
  insuranceProvider: z.string().max(150).optional(),
  allergies:         z.array(z.string()).default([]),
  primaryProviderId: z.string().uuid().optional(),
  emergencyContact:  z.object({
    name:     z.string().optional(),
    relation: z.string().optional(),
    phone:    z.string().optional(),
  }).optional(),
  medicalNotes:      z.string().optional(),
});

export type PatientInput = z.infer<typeof PatientSchema>;

// ================================================================
// Rendez-vous
// ================================================================

export const AppointmentSchema = z.object({
  patientId:    z.string().uuid(),
  providerId:   z.string().uuid(),
  departmentId: z.string().uuid().optional(),
  date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime:    z.string().regex(/^\d{2}:\d{2}$/),
  endTime:      z.string().regex(/^\d{2}:\d{2}$/),
  durationMin:  z.number().int().min(5).max(480).default(30),
  type:         z.enum(['in_person','teleconsult','phone']).default('in_person'),
  reason:       z.string().max(500).optional(),
  notes:        z.string().optional(),
});

export type AppointmentInput = z.infer<typeof AppointmentSchema>;

export const RescheduleSchema = z.object({
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime:   z.string().regex(/^\d{2}:\d{2}$/),
  reason:    z.string().max(300).optional(),
});

export const CancelSchema = z.object({
  reason: z.string().max(300).optional(),
});

// ================================================================
// Provider
// ================================================================

export const ProviderSchema = z.object({
  userId:         z.string().uuid().optional(),
  departmentId:   z.string().uuid().optional(),
  specialty:      z.string(),
  title:          z.string().max(50).optional(),
  licenseNumber:  z.string().max(100).optional(),
  languages:      z.array(z.enum(['fr','en','ar','es','zh','pt'])).default(['fr']),
  bio:            z.string().optional(),
  phone:          z.string().max(20).optional(),
  email:          z.string().email().optional(),
  consultationDuration: z.number().int().min(5).max(480).default(30),
});

// ================================================================
// Département
// ================================================================

export const DepartmentSchema = z.object({
  name:     z.string().min(2).max(150),
  nameEn:   z.string().max(150).optional(),
  slug:     z.string().max(100).optional(),
  category: z.enum(['medicine','rehabilitation','nutrition','womens_health','imaging','laboratory','specialists','surgery','mental_health','other']),
  icon:     z.string().max(10).optional(),
  color:    z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  description: z.string().optional(),
});

// ================================================================
// Disponibilité
// ================================================================

export const AvailabilitySchema = z.object({
  dayOfWeek:  z.number().int().min(0).max(6),
  startTime:  z.string().regex(/^\d{2}:\d{2}$/),
  endTime:    z.string().regex(/^\d{2}:\d{2}$/),
  breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  breakEnd:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

// ================================================================
// Facture
// ================================================================

export const InvoiceSchema = z.object({
  patientId:       z.string().uuid(),
  appointmentId:   z.string().uuid().optional(),
  providerId:      z.string().uuid().optional(),
  billingType:     z.enum(['ramq','private_insurance','self_pay','wsbc','cvs']),
  amount:          z.number().positive(),
  taxAmount:       z.number().min(0).default(0),
  notes:           z.string().optional(),
  dueAt:           z.string().optional(),
});

// ================================================================
// Notification
// ================================================================

export const NotificationSchema = z.object({
  patientId:     z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  channel:       z.enum(['sms','email','voice','push']),
  recipient:     z.string(),
  template:      z.string().optional(),
  subject:       z.string().optional(),
  body:          z.string().min(1),
  scheduledAt:   z.string().optional(),
});

// ================================================================
// Helpers
// ================================================================

export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): 
  { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  const msg = result.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join('; ');
  return { success: false, error: msg };
}
