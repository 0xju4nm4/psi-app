import { z } from "zod";

export const patientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
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
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "WhatsApp number is required"),
  email: z.string().email().optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time slot is required"),
});

export const settingsSchema = z.object({
  bookingSlug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
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

export type PatientInput = z.infer<typeof patientSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
