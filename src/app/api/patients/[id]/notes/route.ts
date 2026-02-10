import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clinicalNoteSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const notes = await db.clinicalNote.findMany({
    where: { patientId: id },
    orderBy: { createdAt: "desc" },
    include: {
      session: {
        select: { id: true, startTime: true, status: true },
      },
    },
  });

  return NextResponse.json(notes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const result = clinicalNoteSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const note = await db.clinicalNote.create({
    data: {
      patientId: id,
      type: "TEXT",
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

  return NextResponse.json(note, { status: 201 });
}
