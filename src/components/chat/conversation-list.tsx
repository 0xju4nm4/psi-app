"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, Check, X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messages?: { role: string; content: string }[];
}

interface ConversationListProps {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: (conv: Conversation) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
}

export function ConversationList({
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  conversations,
  setConversations,
}: ConversationListProps) {
  const [loadingNew, setLoadingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/chat/conversations")
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setConversations(data);
      })
      .catch((err) => console.error("Failed to load conversations", err));
  }, [setConversations]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  async function createNew() {
    setLoadingNew(true);
    try {
      const res = await fetch("/api/chat/conversations", { method: "POST" });
      const conv = await res.json();
      onNew(conv);
    } finally {
      setLoadingNew(false);
    }
  }

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    onDelete(id);
    toast.success("Conversación eliminada");
  }

  function startEdit(id: string, currentTitle: string, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(id);
    setEditValue(currentTitle);
  }

  async function saveEdit(id: string) {
    const title = editValue.trim();
    if (!title) {
      cancelEdit();
      return;
    }
    await fetch(`/api/chat/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
    onRename(id, title);
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button
          className="w-full justify-start gap-2 rounded-xl"
          variant="outline"
          size="sm"
          onClick={createNew}
          disabled={loadingNew}
        >
          <Plus className="size-4" />
          Nueva conversación
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {conversations.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            No hay conversaciones
          </p>
        )}

        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              "group relative flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-sm transition-colors",
              activeId === conv.id
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50 text-foreground"
            )}
          >
            <MessageSquare className="mr-2 size-3.5 shrink-0 opacity-50" />

            {editingId === conv.id ? (
              <div
                className="flex flex-1 items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  ref={editInputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(conv.id);
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="flex-1 min-w-0 bg-transparent text-sm outline-none border-b border-primary"
                />
                <button
                  onClick={() => saveEdit(conv.id)}
                  className="p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <Check className="size-3" />
                </button>
                <button
                  onClick={cancelEdit}
                  className="p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1 truncate">{conv.title}</span>
                <div className="ml-1 hidden shrink-0 items-center gap-0.5 group-hover:flex">
                  <button
                    onClick={(e) => startEdit(conv.id, conv.title, e)}
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="rounded p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
