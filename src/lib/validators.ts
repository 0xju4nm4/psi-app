import { z } from "zod";

export const patientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  notes: z.string().optional(),
});

export const sessionSchema = z.object({
  patientId: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const bookingSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().min(10, "El número de WhatsApp es requerido"),
  email: z.string().email().optional().or(z.literal("")),
  date: z.string().min(1, "La fecha es requerida"),
  time: z.string().min(1, "El horario es requerido"),
});

export const settingsSchema = z.object({
  bookingSlug: z.string().min(3, "El slug debe tener al menos 3 caracteres").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  sessionDuration: z.number().min(15).max(180),
  bufferTime: z.number().min(0).max(60),
  workingHours: z.record(z.string(), z.object({
    start: z.string(),
    end: z.string(),
    enabled: z.boolean(),
  })),
  timezone: z.string(),
  reminder24h: z.boolean(),
  reminder1h: z.boolean(),
  reminderMessage: z.string().optional(),
  paymentReminder: z.string().optional(),
});

export const clinicalNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "El contenido es requerido"),
  sessionId: z.string().optional(),
});

export type PatientInput = z.infer<typeof patientSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type ClinicalNoteInput = z.infer<typeof clinicalNoteSchema>;
