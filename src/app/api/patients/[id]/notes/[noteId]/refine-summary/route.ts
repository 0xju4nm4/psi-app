import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { refineSummary } from "@/lib/openai";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { noteId } = await params;
  const body = await req.json();
  const { instruction } = body;

  if (!instruction || typeof instruction !== "string") {
    return NextResponse.json({ error: "Instruction is required" }, { status: 400 });
  }

  const note = await db.clinicalNote.findUnique({
    where: { id: noteId },
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const newSummary = await refineSummary(note.content, note.summary, instruction);

  const updated = await db.clinicalNote.update({
    where: { id: noteId },
    data: { summary: newSummary },
    include: {
      session: {
        select: { id: true, startTime: true, status: true },
      },
    },
  });

  return NextResponse.json({ summary: updated.summary });
}
