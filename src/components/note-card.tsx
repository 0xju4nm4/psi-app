"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  FileText,
  Mic,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
} from "lucide-react";
import NextLink from "next/link";
import { AnnotatedText } from "@/components/annotated-text";
import { SummaryRefiner } from "@/components/summary-refiner";

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

interface ClinicalNote {
  id: string;
  type: "TEXT" | "AUDIO_TRANSCRIPT";
  title: string | null;
  content: string;
  summary: string | null;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
  session: { id: string; startTime: string; status: string } | null;
  comments?: NoteComment[];
}

interface NoteCardProps {
  note: ClinicalNote;
  patientId: string;
  onDelete: (noteId: string) => void;
  onNoteUpdated: (updatedNote: ClinicalNote) => void;
}

export function NoteCard({
  note,
  patientId,
  onDelete,
  onNoteUpdated,
}: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState<NoteComment[]>(note.comments ?? []);

  useEffect(() => {
    if (note.comments) {
      setComments(note.comments);
    }
  }, [note.comments]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/patients/${patientId}/notes/${note.id}/comments`
      );
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch {
      // silently fail
    }
  }, [patientId, note.id]);

  useEffect(() => {
    if (isExpanded && !note.comments) {
      fetchComments();
    }
  }, [isExpanded, note.comments, fetchComments]);

  function startEditing() {
    setEditContent(note.content);
    setEditing(true);
    setIsExpanded(true);
  }

  async function handleSaveEdit() {
    setSaving(true);
    const res = await fetch(
      `/api/patients/${patientId}/notes/${note.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: note.title,
          content: editContent,
          sessionId: note.sessionId || undefined,
        }),
      }
    );

    if (res.ok) {
      const updated = await res.json();
      onNoteUpdated({ ...note, ...updated });
      setEditing(false);
      toast.success("Nota actualizada");
    } else {
      toast.error("Error al guardar");
    }
    setSaving(false);
  }

  function cancelEdit() {
    setEditContent(note.content);
    setEditing(false);
  }

  async function handleAddComment(comment: {
    field: string;
    quotedText: string;
    startOffset: number;
    endOffset: number;
    body: string;
  }) {
    const res = await fetch(
      `/api/patients/${patientId}/notes/${note.id}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comment),
      }
    );

    if (res.ok) {
      const newComment = await res.json();
      setComments((prev) => [...prev, newComment]);
      toast.success("Comentario agregado");
    } else {
      toast.error("Error al agregar comentario");
    }
  }

  async function handleDeleteComment(commentId: string) {
    const res = await fetch(
      `/api/patients/${patientId}/notes/${note.id}/comments/${commentId}`,
      {
        method: "DELETE",
      }
    );

    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comentario eliminado");
    }
  }

  function handleSummaryUpdated(newSummary: string) {
    onNoteUpdated({ ...note, summary: newSummary });
  }

  const contentComments = comments.filter((c) => c.field === "content");
  const summaryComments = comments.filter((c) => c.field === "summary");

  return (
    <div className="overflow-hidden rounded-2xl border border-[#EFEFEF] bg-card">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {note.type === "AUDIO_TRANSCRIPT" ? (
                <Mic className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <FileText className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="font-medium">
                {note.title || "Sin título"}
              </span>
              <Badge
                variant="secondary"
                className="text-[11px] font-medium"
              >
                {note.type === "AUDIO_TRANSCRIPT"
                  ? "Transcripción"
                  : "Texto"}
              </Badge>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {format(new Date(note.createdAt), "dd/MM/yyyy HH:mm", {
                locale: es,
              })}
              {note.session &&
                ` — ${format(new Date(note.session.startTime), "dd/MM/yyyy")}`}
            </p>
          </div>
          <div className="flex gap-1">
            <NextLink href={`/patients/${patientId}/notes/${note.id}`}>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
              >
                <Eye className="size-4" />
              </Button>
            </NextLink>
            {!editing && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
                onClick={startEditing}
              >
                <Pencil className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => onDelete(note.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3">
          {editing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                className="rounded-xl text-[15px]"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="rounded-xl"
                  onClick={handleSaveEdit}
                  disabled={saving || !editContent.trim()}
                >
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  <X className="mr-1 size-3" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : isExpanded ? (
            <AnnotatedText
              text={note.content}
              field="content"
              comments={contentComments}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              className="whitespace-pre-wrap text-[15px]"
            />
          ) : (
            <p className="whitespace-pre-wrap text-[15px]">
              {note.content.length > 200
                ? note.content.slice(0, 200) + "..."
                : note.content}
            </p>
          )}

          {isExpanded && !editing && note.summary && (
            <>
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
                  Resumen IA
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-[13px]"
                  onClick={() => setIsExpanded(false)}
                >
                  <ChevronUp className="mr-1 size-3" /> Ver menos
                </Button>
              </div>
              <AnnotatedText
                text={note.summary}
                field="summary"
                comments={summaryComments}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                className="mt-1 whitespace-pre-wrap text-[15px]"
              />
            </>
          )}

          {isExpanded && !editing && (
            <SummaryRefiner
              noteId={note.id}
              patientId={patientId}
              currentSummary={note.summary}
              onSummaryUpdated={handleSummaryUpdated}
            />
          )}

          {!isExpanded && !editing && (note.content.length > 200 || note.summary) && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-auto p-0 text-[13px]"
              onClick={() => setIsExpanded(true)}
            >
              <ChevronDown className="mr-1 size-3" /> Ver más
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
