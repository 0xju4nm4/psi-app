"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "./conversation-list";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

interface ChatAreaProps {
  conversationId: string | null;
  onTitleChanged?: (id: string, title: string) => void;
  onConversationCreated?: (conv: Conversation) => void;
}

export function ChatArea({ conversationId, onTitleChanged, onConversationCreated }: ChatAreaProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    fetch(`/api/chat/conversations/${conversationId}`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages ?? []))
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  async function sendMessage() {
    if (!input.trim() || streaming) return;

    const userText = input.trim();
    setInput("");

    // Auto-create a conversation if none is active
    let activeId = conversationId;
    if (!activeId) {
      const res = await fetch("/api/chat/conversations", { method: "POST" });
      if (!res.ok) return;
      const conv: Conversation = await res.json();
      activeId = conv.id;
      onConversationCreated?.(conv);
    }

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "USER",
      content: userText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setStreamingContent("");

    try {
      const res = await fetch(`/api/chat/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userText }),
      });

      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamingContent(fullText);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "ASSISTANT",
          content: fullText,
          createdAt: new Date().toISOString(),
        },
      ]);
      setStreamingContent("");

      // Update sidebar title from first message
      if (messages.length === 0 && onTitleChanged) {
        const shortened = userText.slice(0, 60) + (userText.length > 60 ? "..." : "");
        onTitleChanged(activeId, shortened);
      }
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:pr-12 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground pt-16">
            <Bot className="size-10 opacity-20" />
            <p className="text-sm text-center max-w-xs leading-relaxed">
              ¿En qué te puedo ayudar hoy? Podés preguntarme sobre técnicas terapéuticas, redacción de notas, gestión del consultorio y más.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} userImage={session?.user?.image} userName={session?.user?.name} />
        ))}

        {streaming && streamingContent && (
          <MessageBubble role="ASSISTANT" content={streamingContent} isStreaming />
        )}

        {streaming && !streamingContent && (
          <div className="flex items-start gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="size-4 text-primary" />
            </div>
            <div className="flex items-center gap-1 pt-1">
              <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
              <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
              <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí tu mensaje..."
            disabled={streaming}
            rows={1}
            className="min-h-[40px] max-h-32 resize-none rounded-xl text-sm leading-relaxed"
          />
          <Button
            size="icon"
            className="size-10 shrink-0 rounded-xl"
            onClick={sendMessage}
            disabled={streaming || !input.trim()}
          >
            {streaming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  role,
  content,
  isStreaming,
  userImage,
  userName,
}: {
  role: "USER" | "ASSISTANT";
  content: string;
  isStreaming?: boolean;
  userImage?: string | null;
  userName?: string | null;
}) {
  const isUser = role === "USER";
  const initials = userName
    ? userName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full overflow-hidden",
          !isUser && "bg-primary/10"
        )}
      >
        {isUser ? (
          userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userImage} alt={userName ?? ""} className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {initials}
            </span>
          )
        ) : (
          <Bot className="size-4 text-primary" />
        )}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted rounded-tl-sm",
          isStreaming && "after:ml-0.5 after:inline-block after:h-4 after:w-0.5 after:animate-pulse after:bg-current after:align-middle"
        )}
      >
        {content}
      </div>
    </div>
  );
}
