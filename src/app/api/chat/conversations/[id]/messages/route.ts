import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { streamChat } from "@/lib/openai";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { content } = body;

  if (!content || typeof content !== "string") {
    return new Response(JSON.stringify({ error: "Content is required" }), { status: 400 });
  }

  // Verify conversation belongs to user
  const conversation = await db.chatConversation.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!conversation) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  // Save user message
  await db.chatMessage.create({
    data: { conversationId: id, role: "USER", content: content.trim() },
  });

  // Auto-title the conversation on first message
  if (conversation.title === "Nueva conversación") {
    const shortTitle = content.trim().slice(0, 60) + (content.trim().length > 60 ? "..." : "");
    await db.chatConversation.update({
      where: { id },
      data: { title: shortTitle },
    });
  }

  // Fetch conversation history for context (last 20 messages)
  const history = await db.chatMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { role: true, content: true },
  });

  const messages = history.map((m) => ({
    role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));

  // Stream response from OpenAI
  const aiStream = await streamChat(messages);

  // We need to save the full reply after streaming. Use a TransformStream to capture it.
  const chunks: string[] = [];
  const decoder = new TextDecoder();

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();

  // Pipe aiStream → writable, capturing text along the way
  const writer = writable.getWriter();
  const reader = aiStream.getReader();

  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(decoder.decode(value, { stream: true }));
        await writer.write(value);
      }
      await writer.close();

      // Save assistant message after stream completes
      const fullReply = chunks.join("");
      if (fullReply) {
        await db.chatMessage.create({
          data: { conversationId: id, role: "ASSISTANT", content: fullReply },
        });
        await db.chatConversation.update({
          where: { id },
          data: { updatedAt: new Date() },
        });
      }
    } catch {
      await writer.abort();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
