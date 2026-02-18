"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { ChatModal } from "./chat-modal";

export function ChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-6 right-6 size-13 rounded-full shadow-lg z-50"
        onClick={() => setOpen(true)}
        aria-label="Abrir asistente de IA"
      >
        <MessageSquare className="size-5" />
      </Button>
      <ChatModal open={open} onOpenChange={setOpen} />
    </>
  );
}
