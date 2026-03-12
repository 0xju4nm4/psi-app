import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-bot-secret");
  if (!secret || secret !== process.env.BOT_SERVICE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { sessionId, patientId, transcript, summary } = body;

  if (!sessionId || !patientId || !transcript) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const note = await db.clinicalNote.create({
    data: {
      sessionId,
      patientId,
      type: "AUDIO_TRANSCRIPT",
      title: "Nota de sesión (bot)",
      content: transcript,
      summary: summary || null,
    },
  });

  await db.therapySession.update({
    where: { id: sessionId },
    data: { botStatus: "DONE" },
  });

  return NextResponse.json(note, { status: 201 });
}
