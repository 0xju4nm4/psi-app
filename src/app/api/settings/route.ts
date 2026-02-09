import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { settingsSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let settings = await db.settings.findUnique({
    where: { userId: session.user.id },
  });

  // Create default settings if none exist
  if (!settings) {
    const slug = session.user.name
      ?.toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") || `practitioner-${Date.now()}`;

    settings = await db.settings.create({
      data: {
        userId: session.user.id,
        bookingSlug: slug,
        workingHours: {
          monday: { start: "08:00", end: "18:00", enabled: true },
          tuesday: { start: "08:00", end: "18:00", enabled: true },
          wednesday: { start: "08:00", end: "18:00", enabled: true },
          thursday: { start: "08:00", end: "18:00", enabled: true },
          friday: { start: "08:00", end: "18:00", enabled: true },
          saturday: { start: "08:00", end: "12:00", enabled: false },
          sunday: { start: "08:00", end: "12:00", enabled: false },
        },
      },
    });
  }

  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = settingsSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const settings = await db.settings.upsert({
    where: { userId: session.user.id },
    update: {
      bookingSlug: result.data.bookingSlug,
      sessionDuration: result.data.sessionDuration,
      bufferTime: result.data.bufferTime,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
      workingHours: result.data.workingHours as any,
      timezone: result.data.timezone,
      reminder24h: result.data.reminder24h,
      reminder1h: result.data.reminder1h,
      reminderMessage: result.data.reminderMessage || null,
      paymentReminder: result.data.paymentReminder || null,
    },
    create: {
      userId: session.user.id,
      bookingSlug: result.data.bookingSlug,
      sessionDuration: result.data.sessionDuration,
      bufferTime: result.data.bufferTime,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
      workingHours: result.data.workingHours as any,
      timezone: result.data.timezone,
      reminder24h: result.data.reminder24h,
      reminder1h: result.data.reminder1h,
      reminderMessage: result.data.reminderMessage || null,
      paymentReminder: result.data.paymentReminder || null,
    },
  });

  return NextResponse.json(settings);
}
