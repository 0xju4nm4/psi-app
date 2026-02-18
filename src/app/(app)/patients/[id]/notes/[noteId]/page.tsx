"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  FileText,
  Mic,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { AnnotatedText } from "@/components/annotated-text";
import { SummaryRefiner } from "@/components/summary-refiner";
import { motion } from "framer-motion";

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

export default function NoteDetailPage() {
  const params = useParams();
  const patientId = params.id as string;
  const noteId = params.noteId as string;

  const [note, setNote] = useState<ClinicalNote | null>(null);
  const [comments, setComments] = useState<NoteComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/patients/${patientId}/notes/${noteId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setNote(data);
        setComments(data.comments ?? []);
      })
      .catch(() => toast.error("Error al cargar la nota"))
      .finally(() => setLoading(false));
  }, [patientId, noteId]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/patients/${patientId}/notes/${noteId}/comments`
      );
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch {
      // silently fail
    }
  }, [patientId, noteId]);

  async function handleAddComment(comment: {
    field: string;
    quotedText: string;
    startOffset: number;
    endOffset: number;
    body: string;
  }) {
    const res = await fetch(
      `/api/patients/${patientId}/notes/${noteId}/comments`,
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
      `/api/patients/${patientId}/notes/${noteId}/comments/${commentId}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comentario eliminado");
    }
  }

  function handleSummaryUpdated(newSummary: string) {
    setNote((prev) => (prev ? { ...prev, summary: newSummary } : prev));
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="space-y-4">
        <NextLink
          href={`/patients/${patientId}`}
          className="inline-flex items-center gap-2 text-[15px] font-medium text-primary transition-colors hover:text-primary/80"
        >
          <ArrowLeft className="size-4" />
          Volver
        </NextLink>
        <p className="text-muted-foreground">Nota no encontrada</p>
      </div>
    );
  }

  const contentComments = comments.filter((c) => c.field === "content");
  const summaryComments = comments.filter((c) => c.field === "summary");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <NextLink
        href={`/patients/${patientId}`}
        className="inline-flex items-center gap-2 text-[15px] font-medium text-primary transition-colors hover:text-primary/80"
      >
        <ArrowLeft className="size-4" />
        Volver al paciente
      </NextLink>

      {/* Header */}
      <div className="flex items-center gap-3">
        {note.type === "AUDIO_TRANSCRIPT" ? (
          <Mic className="size-5 text-muted-foreground" />
        ) : (
          <FileText className="size-5 text-muted-foreground" />
        )}
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">
            {note.title || "Sin título"}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            {format(new Date(note.createdAt), "dd MMM yyyy, HH:mm", {
              locale: es,
            })}
            {note.session &&
              ` — Sesión del ${format(new Date(note.session.startTime), "dd/MM/yyyy")}`}
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto text-[11px] font-medium">
          {note.type === "AUDIO_TRANSCRIPT" ? "Transcripción" : "Texto"}
        </Badge>
      </div>

      {/* Split layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: Content + Summary */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-[#EFEFEF] bg-card p-5">
            <p className="mb-3 text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
              Contenido
            </p>
            <AnnotatedText
              text={note.content}
              field="content"
              comments={contentComments}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              className="whitespace-pre-wrap text-[15px] leading-relaxed"
            />
          </div>

          {/* Summary section */}
          {note.summary && (
            <div className="overflow-hidden rounded-2xl border border-[#EFEFEF] bg-card p-5">
              <p className="mb-3 text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
                Resumen IA
              </p>
              <AnnotatedText
                text={note.summary}
                field="summary"
                comments={summaryComments}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                className="whitespace-pre-wrap text-[15px] leading-relaxed"
              />
            </div>
          )}

          <SummaryRefiner
            noteId={note.id}
            patientId={patientId}
            currentSummary={note.summary}
            onSummaryUpdated={handleSummaryUpdated}
          />
        </div>

        {/* Right: Comments sidebar (Google Docs style) */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#EFEFEF] bg-card py-12 px-4">
              <MessageSquare className="size-8 text-muted-foreground/40" />
              <p className="mt-3 text-center text-[14px] text-muted-foreground">
                Sin comentarios aún.
                <br />
                Selecciona texto para agregar uno.
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-xl border border-[#EFEFEF] bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Author row */}
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    T
                  </div>
                  <span className="text-[13px] font-semibold leading-none">
                    Terapeuta
                  </span>
                  <span className="text-[12px] leading-none text-muted-foreground">
                    {format(new Date(comment.createdAt), "H:mm d MMM", {
                      locale: es,
                    })}
                  </span>
                </div>

                {/* Comment body */}
                <p className="mt-2 text-[14px] leading-snug">{comment.body}</p>

                {/* Quoted text */}
                <div className="mt-2 border-l-2 border-amber-400 pl-2.5">
                  <p className="line-clamp-2 text-[12px] text-muted-foreground">
                    {comment.quotedText}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {comment.field === "summary" ? "Resumen" : "Contenido"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 rounded-lg px-2 text-[11px] text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
