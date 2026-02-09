import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingSchema } from "@/lib/validators";
import { createEvent } from "@/lib/google-calendar";
import { addMinutes } from "date-fns";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = bookingSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { slug, name, phone, email, date, time } = result.data;

  // Find practitioner settings
  const settings = await db.settings.findUnique({
    where: { bookingSlug: slug },
    include: { user: { include: { accounts: true } } },
  });

  if (!settings) {
    return NextResponse.json({ error: "Practitioner not found" }, { status: 404 });
  }

  const startTime = new Date(`${date}T${time}`);
  const endTime = addMinutes(startTime, settings.sessionDuration);

  // Double-booking prevention: check if slot is still available
  const conflicting = await db.therapySession.findFirst({
    where: {
      userId: settings.userId,
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (conflicting) {
    return NextResponse.json({ error: "This time slot is no longer available" }, { status: 409 });
  }

  // Try to match to existing patient by phone
  const existingPatient = await db.patient.findFirst({
    where: { phone, isActive: true },
  });

  // Create Google Calendar event
  const googleAccount = settings.user.accounts.find((a) => a.provider === "google");
  let googleEventId: string | null = null;

  if (googleAccount?.access_token) {
    try {
      googleEventId = await createEvent(googleAccount.access_token, {
        summary: `Session - ${name}`,
        description: `Booked via online booking page\nPhone: ${phone}${email ? `\nEmail: ${email}` : ""}`,
        start: startTime,
        end: endTime,
      });
    } catch (error) {
      console.error("Failed to create Google Calendar event:", error);
    }
  }

  const session = await db.therapySession.create({
    data: {
      userId: settings.userId,
      patientId: existingPatient?.id ?? null,
      startTime,
      endTime,
      guestName: existingPatient ? null : name,
      guestPhone: existingPatient ? null : phone,
      googleEventId,
    },
  });

  return NextResponse.json({
    id: session.id,
    startTime: session.startTime,
    endTime: session.endTime,
    message: "Session booked successfully!",
  }, { status: 201 });
}
