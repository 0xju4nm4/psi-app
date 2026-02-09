import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFreeBusy } from "@/lib/google-calendar";
import { computeAvailableSlots } from "@/lib/slots";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const dateStr = req.nextUrl.searchParams.get("date");

  if (!slug || !dateStr) {
    return NextResponse.json({ error: "Missing slug or date" }, { status: 400 });
  }

  const settings = await db.settings.findUnique({
    where: { bookingSlug: slug },
    include: { user: { include: { accounts: true } } },
  });

  if (!settings) {
    return NextResponse.json({ error: "Practitioner not found" }, { status: 404 });
  }

  // Get access token from the user's Google account
  const googleAccount = settings.user.accounts.find((a) => a.provider === "google");
  if (!googleAccount?.access_token) {
    return NextResponse.json({ error: "Calendar not connected" }, { status: 500 });
  }

  const date = new Date(dateStr);
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // Get busy times from Google Calendar
  let busySlots: { start: string; end: string }[] = [];
  try {
    busySlots = await getFreeBusy(googleAccount.access_token, dayStart, dayEnd);
  } catch (error) {
    console.error("Failed to fetch busy times:", error);
  }

  // Also get existing sessions from DB (in case Google sync is delayed)
  const existingSessions = await db.therapySession.findMany({
    where: {
      userId: settings.userId,
      startTime: { gte: dayStart, lte: dayEnd },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
    },
  });

  const dbBusySlots = existingSessions.map((s) => ({
    start: s.startTime.toISOString(),
    end: s.endTime.toISOString(),
  }));

  // Merge busy slots
  const allBusy = [...busySlots, ...dbBusySlots];

  const workingHours = settings.workingHours as Record<string, { start: string; end: string; enabled: boolean }>;

  const slots = computeAvailableSlots(
    date,
    workingHours,
    settings.sessionDuration,
    settings.bufferTime,
    allBusy,
    settings.timezone
  );

  return NextResponse.json({
    slots,
    sessionDuration: settings.sessionDuration,
    practitionerName: settings.user.name,
  });
}
