import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transcribeAudio, summarizeTranscript } from "@/lib/openai";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const formData = await req.formData();
  const audioFile = formData.get("audio") as File | null;
  const title = formData.get("title") as string | null;
  const sessionId = formData.get("sessionId") as string | null;

  if (!audioFile) {
    return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
  }

  const transcript = await transcribeAudio(audioFile);
  const summary = await summarizeTranscript(transcript);

  const note = await db.clinicalNote.create({
    data: {
      patientId: id,
      type: "AUDIO_TRANSCRIPT",
      title: title || "Audio transcription",
      content: transcript,
      summary,
      sessionId: sessionId || null,
    },
    include: {
      session: {
        select: { id: true, startTime: true, status: true },
      },
    },
  });

  return NextResponse.json(note, { status: 201 });
}
