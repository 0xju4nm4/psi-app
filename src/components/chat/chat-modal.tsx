"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ConversationList, type Conversation } from "./conversation-list";
import { ChatArea } from "./chat-area";
import { Bot, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatModal({ open, onOpenChange }: ChatModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleNew(conv: Conversation) {
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setSidebarOpen(false);
  }

  function handleDelete(id: string) {
    if (activeId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveId(remaining[0]?.id ?? null);
    }
  }

  function handleTitleChanged(id: string, title: string) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  }

  function handleSelect(id: string) {
    setActiveId(id);
    setSidebarOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-dvh w-screen max-w-screen sm:h-[85vh] sm:w-[66vw] sm:max-w-[66vw] flex-col gap-0 p-0 overflow-hidden rounded-none sm:rounded-2xl">
        <DialogTitle className="sr-only">Asistente de IA</DialogTitle>
        <div className="relative flex h-full overflow-hidden">

          {/* Mobile overlay when sidebar open */}
          {sidebarOpen && (
            <div
              className="absolute inset-0 z-10 bg-black/30 sm:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div
            className={cn(
              "absolute inset-y-0 left-0 z-20 flex w-72 shrink-0 flex-col border-r bg-card transition-transform duration-200 sm:static sm:z-auto sm:w-60 sm:translate-x-0",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <Bot className="size-4 text-primary" />
              <span className="text-sm font-medium">Asistente</span>
              <button
                className="ml-auto rounded p-1 text-muted-foreground hover:text-foreground sm:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <PanelLeftClose className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConversationList
                activeId={activeId}
                onSelect={handleSelect}
                onNew={handleNew}
                onDelete={handleDelete}
                onRename={(id, title) => handleTitleChanged(id, title)}
                conversations={conversations}
                setConversations={setConversations}
              />
            </div>
          </div>

          {/* Chat area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Mobile header bar */}
            <div className="flex items-center gap-2 border-b px-3 py-2.5 sm:hidden">
              <button
                className="rounded p-1 text-muted-foreground hover:text-foreground"
                onClick={() => setSidebarOpen(true)}
              >
                <PanelLeftOpen className="size-4" />
              </button>
              <span className="truncate text-sm font-medium">
                {activeId
                  ? (conversations.find((c) => c.id === activeId)?.title ?? "Conversación")
                  : "Asistente"}
              </span>
            </div>
            <ChatArea
              conversationId={activeId}
              onTitleChanged={handleTitleChanged}
              onConversationCreated={handleNew}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
