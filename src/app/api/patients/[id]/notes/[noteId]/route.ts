import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clinicalNoteSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { noteId } = await params;

  const note = await db.clinicalNote.findUnique({
    where: { id: noteId },
    include: {
      session: {
        select: { id: true, startTime: true, status: true },
      },
    },
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json(note);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { noteId } = await params;
  const body = await req.json();
  const result = clinicalNoteSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const note = await db.clinicalNote.update({
    where: { id: noteId },
    data: {
      title: result.data.title || null,
      content: result.data.content,
      sessionId: result.data.sessionId || null,
    },
    include: {
      session: {
        select: { id: true, startTime: true, status: true },
      },
    },
  });

  return NextResponse.json(note);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { noteId } = await params;

  await db.clinicalNote.delete({
    where: { id: noteId },
  });

  return NextResponse.json({ success: true });
}
