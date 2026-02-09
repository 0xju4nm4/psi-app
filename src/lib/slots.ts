import { addMinutes, format, parse, isAfter, isBefore, startOfDay, addDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface WorkingHoursConfig {
  [day: string]: {
    start: string; // "08:00"
    end: string;   // "18:00"
    enabled: boolean;
  };
}

interface BusySlot {
  start: string; // ISO string
  end: string;   // ISO string
}

export interface TimeSlot {
  start: string; // ISO string
  end: string;   // ISO string
  display: string; // "08:00 - 08:50"
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function computeAvailableSlots(
  date: Date,
  workingHours: WorkingHoursConfig,
  sessionDuration: number,
  bufferTime: number,
  busySlots: BusySlot[],
  timezone: string
): TimeSlot[] {
  const zonedDate = toZonedTime(date, timezone);
  const dayName = DAY_NAMES[zonedDate.getDay()];
  const dayConfig = workingHours[dayName];

  if (!dayConfig || !dayConfig.enabled) {
    return [];
  }

  const dayStart = startOfDay(zonedDate);
  const [startH, startM] = dayConfig.start.split(":").map(Number);
  const [endH, endM] = dayConfig.end.split(":").map(Number);

  const workStart = addMinutes(dayStart, startH * 60 + startM);
  const workEnd = addMinutes(dayStart, endH * 60 + endM);

  // Parse busy slots for this day
  const busyRanges = busySlots.map((b) => ({
    start: new Date(b.start),
    end: new Date(b.end),
  }));

  const slots: TimeSlot[] = [];
  let current = workStart;

  while (isBefore(addMinutes(current, sessionDuration), workEnd) || addMinutes(current, sessionDuration).getTime() === workEnd.getTime()) {
    const slotEnd = addMinutes(current, sessionDuration);

    // Check if this slot overlaps with any busy slot
    const isAvailable = !busyRanges.some(
      (busy) => isBefore(current, busy.end) && isAfter(slotEnd, busy.start)
    );

    if (isAvailable) {
      slots.push({
        start: current.toISOString(),
        end: slotEnd.toISOString(),
        display: `${format(current, "HH:mm")} - ${format(slotEnd, "HH:mm")}`,
      });
    }

    // Move to next potential slot (session + buffer)
    current = addMinutes(current, sessionDuration + bufferTime);
  }

  // Filter out past slots if the date is today
  const now = new Date();
  return slots.filter((slot) => isAfter(new Date(slot.start), now));
}
