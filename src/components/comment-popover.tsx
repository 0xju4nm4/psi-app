"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface NoteComment {
  id: string;
  field: string;
  quotedText: string;
  startOffset: number;
  endOffset: number;
  body: string;
  resolved: boolean;
  createdAt: string;
}

interface ViewCommentPopoverProps {
  comment: NoteComment;
  onDelete: (commentId: string) => void;
  children: React.ReactNode;
}

export function ViewCommentPopover({
  comment,
  onDelete,
  children,
}: ViewCommentPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 rounded-2xl border-[#EFEFEF] p-3" side="top">
        <p className="text-[13px] text-muted-foreground">
          {format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
        </p>
        <p className="mt-1.5 whitespace-pre-wrap text-[14px]">{comment.body}</p>
        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 rounded-lg text-[12px] text-destructive"
            onClick={() => onDelete(comment.id)}
          >
            <Trash2 className="size-3" />
            Eliminar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface CreateCommentPopoverProps {
  quotedText: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (body: string) => void;
  anchorRect: { top: number; left: number } | null;
}

export function CreateCommentPopover({
  quotedText,
  open,
  onOpenChange,
  onSave,
  anchorRect,
}: CreateCommentPopoverProps) {
  const [body, setBody] = useState("");

  function handleSave() {
    if (!body.trim()) return;
    onSave(body.trim());
    setBody("");
    onOpenChange(false);
  }

  if (!open || !anchorRect) return null;

  return (
    <div
      className="fixed z-50"
      style={{ top: anchorRect.top, left: anchorRect.left }}
    >
      <div className="w-72 rounded-2xl border border-[#EFEFEF] bg-card p-3 shadow-lg">
        <div className="rounded-lg bg-muted/50 px-2.5 py-1.5">
          <p className="line-clamp-2 text-[12px] italic text-muted-foreground">
            &ldquo;{quotedText}&rdquo;
          </p>
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escribe tu comentario..."
          rows={3}
          className="mt-2 rounded-xl text-[14px]"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSave();
            }
          }}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 rounded-lg text-[12px]"
            onClick={() => {
              setBody("");
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="h-7 rounded-lg text-[12px]"
            onClick={handleSave}
            disabled={!body.trim()}
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
