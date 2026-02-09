import { db } from "@/lib/db";
import { sendWhatsAppReminder } from "@/lib/twilio";
import { format } from "date-fns";

export async function processReminders(): Promise<{ sent24h: number; sent1h: number }> {
  const now = new Date();
  const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  // Find sessions needing reminders
  const sessions = await db.therapySession.findMany({
    where: {
      startTime: { lte: in25Hours, gt: now },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      OR: [
        { reminder24hSent: false },
        { reminder1hSent: false },
      ],
    },
    include: {
      patient: true,
      user: { include: { settings: true } },
    },
  });

  let sent24h = 0;
  let sent1h = 0;

  for (const session of sessions) {
    const hoursUntil = (session.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const phone = session.patient?.phone ?? session.guestPhone;
    const name = session.patient?.name ?? session.guestName ?? "Patient";
    const settings = session.user.settings;

    if (!phone) continue;

    const sessionTimeStr = format(session.startTime, "dd/MM/yyyy 'at' HH:mm");

    // 24h reminder (send when 1-25 hours out and not yet sent)
    if (settings?.reminder24h && !session.reminder24hSent && hoursUntil <= 25 && hoursUntil > 1.5) {
      try {
        await sendWhatsAppReminder(
          phone,
          name,
          sessionTimeStr,
          settings.reminderMessage,
          settings.paymentReminder
        );
        await db.therapySession.update({
          where: { id: session.id },
          data: { reminder24hSent: true },
        });
        sent24h++;
      } catch (error) {
        console.error(`Failed to send 24h reminder for session ${session.id}:`, error);
      }
    }

    // 1h reminder (send when 0-1.5 hours out and not yet sent)
    if (settings?.reminder1h && !session.reminder1hSent && hoursUntil <= 1.5 && hoursUntil > 0) {
      try {
        await sendWhatsAppReminder(
          phone,
          name,
          sessionTimeStr,
          settings.reminderMessage,
          settings.paymentReminder
        );
        await db.therapySession.update({
          where: { id: session.id },
          data: { reminder1hSent: true },
        });
        sent1h++;
      } catch (error) {
        console.error(`Failed to send 1h reminder for session ${session.id}:`, error);
      }
    }
  }

  return { sent24h, sent1h };
}
