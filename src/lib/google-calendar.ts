import { google, calendar_v3 } from "googleapis";

function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

export async function getFreeBusy(
  accessToken: string,
  timeMin: Date,
  timeMax: Date
): Promise<{ start: string; end: string }[]> {
  const calendar = getCalendarClient(accessToken);

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: "primary" }],
    },
  });

  const busy = res.data.calendars?.primary?.busy ?? [];
  return busy.map((b) => ({
    start: b.start!,
    end: b.end!,
  }));
}

export async function listEvents(
  accessToken: string,
  timeMin: Date,
  timeMax: Date
): Promise<calendar_v3.Schema$Event[]> {
  const calendar = getCalendarClient(accessToken);

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return res.data.items ?? [];
}

export async function createEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    start: Date;
    end: Date;
    attendeeEmail?: string;
  }
): Promise<string> {
  const calendar = getCalendarClient(accessToken);

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.start.toISOString() },
      end: { dateTime: event.end.toISOString() },
      attendees: event.attendeeEmail
        ? [{ email: event.attendeeEmail }]
        : undefined,
    },
  });

  return res.data.id!;
}

export async function updateEvent(
  accessToken: string,
  eventId: string,
  event: {
    summary?: string;
    description?: string;
    start?: Date;
    end?: Date;
  }
): Promise<void> {
  const calendar = getCalendarClient(accessToken);

  const requestBody: calendar_v3.Schema$Event = {};
  if (event.summary) requestBody.summary = event.summary;
  if (event.description) requestBody.description = event.description;
  if (event.start) requestBody.start = { dateTime: event.start.toISOString() };
  if (event.end) requestBody.end = { dateTime: event.end.toISOString() };

  await calendar.events.patch({
    calendarId: "primary",
    eventId,
    requestBody,
  });
}

export async function deleteEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const calendar = getCalendarClient(accessToken);

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
}
