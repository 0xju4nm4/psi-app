import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const conversation = await db.chatConversation.findFirst({
      where: { id, userId: session.user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(conversation);
  } catch (err) {
    console.error("[GET /api/chat/conversations/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { title } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const conversation = await db.chatConversation.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.chatConversation.update({
      where: { id },
      data: { title: title.trim() },
      select: { id: true, title: true, updatedAt: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/chat/conversations/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const conversation = await db.chatConversation.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.chatConversation.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/chat/conversations/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
