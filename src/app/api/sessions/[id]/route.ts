import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateEvent, deleteEvent } from "@/lib/google-calendar";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const therapySession = await db.therapySession.findUnique({
    where: { id },
    include: { patient: true },
  });

  if (!therapySession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(therapySession);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await db.therapySession.findUnique({
    where: { id },
    include: { patient: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Update Google Calendar event if it exists
  if (existing.googleEventId && (body.startTime || body.endTime || body.notes)) {
    try {
      await updateEvent(session.accessToken, existing.googleEventId, {
        start: body.startTime ? new Date(body.startTime) : undefined,
        end: body.endTime ? new Date(body.endTime) : undefined,
        description: body.notes,
      });
    } catch (error) {
      console.error("Failed to update Google Calendar event:", error);
    }
  }

  const updated = await db.therapySession.update({
    where: { id },
    data: {
      ...(body.startTime && { startTime: new Date(body.startTime) }),
      ...(body.endTime && { endTime: new Date(body.endTime) }),
      ...(body.status && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.patientId !== undefined && { patientId: body.patientId }),
    },
    include: { patient: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.therapySession.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Delete from Google Calendar
  if (existing.googleEventId) {
    try {
      await deleteEvent(session.accessToken, existing.googleEventId);
    } catch (error) {
      console.error("Failed to delete Google Calendar event:", error);
    }
  }

  await db.therapySession.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ success: true });
}
