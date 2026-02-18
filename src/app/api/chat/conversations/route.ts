import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const conversations = await db.chatConversation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true },
        },
      },
    });

    return NextResponse.json(conversations);
  } catch (err) {
    console.error("[GET /api/chat/conversations]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const title = body.title ?? "Nueva conversación";

    const conversation = await db.chatConversation.create({
      data: { userId: session.user.id, title },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (err) {
    console.error("[POST /api/chat/conversations]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
