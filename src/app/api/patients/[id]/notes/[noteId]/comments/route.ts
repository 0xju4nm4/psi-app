import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { noteCommentSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { noteId } = await params;

  const comments = await db.noteComment.findMany({
    where: { clinicalNoteId: noteId, resolved: false },
    orderBy: { startOffset: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { noteId } = await params;
  const body = await req.json();
  const result = noteCommentSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const comment = await db.noteComment.create({
    data: {
      clinicalNoteId: noteId,
      field: result.data.field,
      quotedText: result.data.quotedText,
      startOffset: result.data.startOffset,
      endOffset: result.data.endOffset,
      body: result.data.body,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
