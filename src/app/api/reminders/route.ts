import { NextRequest, NextResponse } from "next/server";
import { processReminders } from "@/lib/reminders";

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this automatically for cron invocations)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processReminders();

  return NextResponse.json({
    message: `Sent ${result.sent24h} 24h reminders and ${result.sent1h} 1h reminders`,
    ...result,
  });
}
