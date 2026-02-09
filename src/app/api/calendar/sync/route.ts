import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listEvents } from "@/lib/google-calendar";
import { startOfDay, addDays } from "date-fns";

export async function POST() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const timeMin = startOfDay(now);
  const timeMax = addDays(timeMin, 30);

  const events = await listEvents(session.accessToken, timeMin, timeMax);

  let synced = 0;

  for (const event of events) {
    if (!event.id || !event.start?.dateTime || !event.end?.dateTime) continue;

    // Check if this event already exists in our DB
    const existing = await db.therapySession.findUnique({
      where: { googleEventId: event.id },
    });

    if (!existing) {
      // Create a new session from the Google Calendar event
      await db.therapySession.create({
        data: {
          userId: session.user.id,
          startTime: new Date(event.start.dateTime),
          endTime: new Date(event.end.dateTime),
          googleEventId: event.id,
          guestName: event.summary || "Calendar Event",
          status: "SCHEDULED",
        },
      });
      synced++;
    } else {
      // Update existing session if times changed
      const newStart = new Date(event.start.dateTime);
      const newEnd = new Date(event.end.dateTime);
      if (
        existing.startTime.getTime() !== newStart.getTime() ||
        existing.endTime.getTime() !== newEnd.getTime()
      ) {
        await db.therapySession.update({
          where: { id: existing.id },
          data: {
            startTime: newStart,
            endTime: newEnd,
          },
        });
        synced++;
      }
    }
  }

  return NextResponse.json({ synced, total: events.length });
}
