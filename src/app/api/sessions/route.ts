import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessionSchema } from "@/lib/validators";
import { createEvent } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const sessions = await db.therapySession.findMany({
    where: {
      userId: session.user.id,
      ...(from && to
        ? { startTime: { gte: new Date(from), lte: new Date(to) } }
        : {}),
    },
    include: { patient: true },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = sessionSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { patientId, startTime, endTime, guestName, guestPhone, notes } = result.data;

  // Get patient name for calendar event
  let eventSummary = "Therapy Session";
  if (patientId) {
    const patient = await db.patient.findUnique({ where: { id: patientId } });
    if (patient) eventSummary = `Session - ${patient.name}`;
  } else if (guestName) {
    eventSummary = `Session - ${guestName}`;
  }

  // Create Google Calendar event
  let googleEventId: string | null = null;
  try {
    googleEventId = await createEvent(session.accessToken, {
      summary: eventSummary,
      description: notes || undefined,
      start: new Date(startTime),
      end: new Date(endTime),
    });
  } catch (error) {
    console.error("Failed to create Google Calendar event:", error);
  }

  const therapySession = await db.therapySession.create({
    data: {
      userId: session.user.id,
      patientId: patientId || null,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      guestName: guestName || null,
      guestPhone: guestPhone || null,
      notes: notes || null,
      googleEventId,
    },
    include: { patient: true },
  });

  return NextResponse.json(therapySession, { status: 201 });
}
