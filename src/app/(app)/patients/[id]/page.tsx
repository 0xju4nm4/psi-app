"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SESSION_STATUS_LABELS } from "@/lib/constants";
import {
  ArrowLeft,
  FileText,
  Mic,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Square,
  Link,
  Check,
} from "lucide-react";
import NextLink from "next/link";
import { cn } from "@/lib/utils";

interface TherapySession {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
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
}

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  notes: string | null;
  sessions: TherapySession[];
}

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-500/15 text-blue-700",
  CONFIRMED: "bg-green-500/15 text-green-700",
  COMPLETED: "bg-gray-400/20 text-gray-600",
  CANCELLED: "bg-red-500/15 text-red-600",
  NO_SHOW: "bg-amber-500/15 text-amber-700",
};

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ClinicalNote | null>(null);
  const [noteSaving, setNoteSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [bookingSlug, setBookingSlug] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetch(`/api/patients/${params.id}`)
      .then((res) => res.json())
      .then(setPatient)
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.bookingSlug) setBookingSlug(data.bookingSlug);
      })
      .catch(() => {});
  }, []);

  function fetchNotes() {
    setNotesLoading(true);
    fetch(`/api/patients/${params.id}/notes`)
      .then((res) => res.json())
      .then(setNotes)
      .finally(() => setNotesLoading(false));
  }

  useEffect(() => {
    fetchNotes();
  }, [params.id]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      notes: formData.get("notes") as string,
    };

    const res = await fetch(`/api/patients/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const updated = await res.json();
      setPatient({ ...patient!, ...updated });
      setEditing(false);
      toast.success("Paciente actualizado");
    } else {
      toast.error("Error al actualizar paciente");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("¿Estás segura de que deseas eliminar este paciente?")) return;

    const res = await fetch(`/api/patients/${params.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Paciente eliminado");
      router.push("/patients");
    } else {
      toast.error("Error al eliminar paciente");
    }
  }

  function copyBookingLink() {
    if (!bookingSlug || !patient) return;
    const link = `${window.location.origin}/book/${bookingSlug}/${patient.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true);
      toast.success("Enlace copiado");
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  async function handleSaveNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNoteSaving(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      sessionId: (formData.get("sessionId") as string) || undefined,
    };

    const url = editingNote
      ? `/api/patients/${params.id}/notes/${editingNote.id}`
      : `/api/patients/${params.id}/notes`;

    const res = await fetch(url, {
      method: editingNote ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success(editingNote ? "Nota actualizada" : "Nota creada");
      setNoteDialogOpen(false);
      setEditingNote(null);
      fetchNotes();
    } else {
      toast.error("Error al guardar nota");
    }
    setNoteSaving(false);
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm("¿Eliminar esta nota?")) return;

    const res = await fetch(`/api/patients/${params.id}/notes/${noteId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Nota eliminada");
      fetchNotes();
    } else {
      toast.error("Error al eliminar nota");
    }
  }

  async function transcribeBlob(blob: Blob) {
    setTranscribing(true);

    const file = new File([blob], "recording.webm", { type: blob.type });
    const formData = new FormData();
    formData.append("audio", file);
    formData.append("title", `Grabación — ${format(new Date(), "dd/MM/yyyy")}`);

    const res = await fetch(`/api/patients/${params.id}/notes/transcribe`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      toast.success("Audio transcrito");
      fetchNotes();
    } else {
      toast.error("Error al transcribir");
    }

    setTranscribing(false);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        transcribeBlob(blob);
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error("No se pudo acceder al micrófono");
    }
  }

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function toggleExpanded(noteId: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      return next;
    });
  }

  if (loading)
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  if (!patient) return <p className="text-muted-foreground">Paciente no encontrado</p>;

  return (
    <div className="space-y-6">
      <NextLink
        href="/patients"
        className="inline-flex items-center gap-2 text-[15px] font-medium text-primary transition-colors hover:text-primary/80"
      >
        <ArrowLeft className="size-4" />
        Pacientes
      </NextLink>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">{patient.name}</h1>
            <p className="text-[15px] text-muted-foreground">{patient.phone}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {bookingSlug && (
            <Button variant="outline" size="sm" className="rounded-xl" onClick={copyBookingLink}>
              {linkCopied ? <Check className="mr-2 size-4 text-green-600" /> : <Link className="mr-2 size-4" />}
              {linkCopied ? "¡Copiado!" : "Enlace de reserva"}
            </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setEditing(!editing)}>
            {editing ? "Cancelar" : "Editar"}
          </Button>
          <Button variant="destructive" size="sm" className="rounded-xl" onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList className="rounded-xl bg-muted p-1">
          <TabsTrigger value="sessions" className="rounded-lg">Sesiones</TabsTrigger>
          <TabsTrigger value="clinical-history" className="rounded-lg">Historia Clínica</TabsTrigger>
          <TabsTrigger value="info" className="rounded-lg">Información</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          {editing ? (
            <div className="overflow-hidden rounded-2xl bg-card border border-[#EFEFEF]">
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[13px] font-medium">Nombre</Label>
                  <Input id="name" name="name" defaultValue={patient.name} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[13px] font-medium">Teléfono</Label>
                  <Input id="phone" name="phone" defaultValue={patient.phone} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[13px] font-medium">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={patient.email ?? ""} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-[13px] font-medium">Notas</Label>
                  <Textarea id="notes" name="notes" defaultValue={patient.notes ?? ""} rows={3} className="rounded-xl" />
                </div>
                <Button type="submit" disabled={saving} className="rounded-xl">
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </form>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-card border border-[#EFEFEF]">
              <div className="divide-y divide-[#EFEFEF]">
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[13px] text-muted-foreground">Teléfono</span>
                  <span className="font-medium">{patient.phone}</span>
                </div>
                {patient.email && (
                  <div className="flex justify-between px-4 py-3.5">
                    <span className="text-[13px] text-muted-foreground">Correo</span>
                    <span className="font-medium">{patient.email}</span>
                  </div>
                )}
                {patient.notes && (
                  <div className="px-4 py-3.5">
                    <span className="text-[13px] text-muted-foreground">Notas</span>
                    <p className="mt-1 text-[15px]">{patient.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="clinical-history" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() => {
                setEditingNote(null);
                setNoteDialogOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Nueva nota
            </Button>
            {transcribing ? (
              <Button variant="outline" size="sm" disabled className="rounded-xl">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Transcribiendo...
              </Button>
            ) : recording ? (
              <Button variant="destructive" size="sm" onClick={stopRecording} className="animate-pulse rounded-xl">
                <Square className="mr-2 size-4" />
                Detener — {String(Math.floor(recordingTime / 60)).padStart(2, "0")}:{String(recordingTime % 60).padStart(2, "0")}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={startRecording} className="rounded-xl">
                <Mic className="mr-2 size-4" />
                Grabar
              </Button>
            )}
          </div>

          {notesLoading ? (
            <div className="flex min-h-[120px] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#EFEFEF] py-12">
              <FileText className="size-10 text-muted-foreground/50" />
              <p className="mt-3 text-[15px] text-muted-foreground">Sin notas clínicas aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => {
                const isExpanded = expandedNotes.has(note.id);
                return (
                  <div
                    key={note.id}
                    className="overflow-hidden rounded-2xl bg-card border border-[#EFEFEF]"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {note.type === "AUDIO_TRANSCRIPT" ? (
                              <Mic className="size-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <FileText className="size-4 shrink-0 text-muted-foreground" />
                            )}
                            <span className="font-medium">{note.title || "Sin título"}</span>
                            <Badge variant="secondary" className="text-[11px] font-medium">
                              {note.type === "AUDIO_TRANSCRIPT" ? "Transcripción" : "Texto"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-[13px] text-muted-foreground">
                            {format(new Date(note.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                            {note.session && ` — ${format(new Date(note.session.startTime), "dd/MM/yyyy")}`}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg"
                            onClick={() => {
                              setEditingNote(note);
                              setNoteDialogOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="whitespace-pre-wrap text-[15px]">
                          {isExpanded
                            ? note.content
                            : note.content.length > 200
                              ? note.content.slice(0, 200) + "..."
                              : note.content}
                        </p>

                        {isExpanded && note.summary && (
                          <>
                            <Separator className="my-3" />
                            <p className="text-[13px] font-medium uppercase tracking-wider text-muted-foreground">Resumen IA</p>
                            <p className="mt-1 whitespace-pre-wrap text-[15px]">{note.summary}</p>
                          </>
                        )}

                        {(note.content.length > 200 || note.summary) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-auto p-0 text-[13px]"
                            onClick={() => toggleExpanded(note.id)}
                          >
                            {isExpanded ? <><ChevronUp className="mr-1 size-3" /> Ver menos</> : <><ChevronDown className="mr-1 size-3" /> Ver más</>}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingNote ? "Editar nota" : "Nueva nota"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveNote} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="note-title" className="text-[13px] font-medium">Título</Label>
                  <Input
                    id="note-title"
                    name="title"
                    defaultValue={editingNote?.title ?? ""}
                    placeholder="Notas de sesión..."
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note-content" className="text-[13px] font-medium">Contenido</Label>
                  <Textarea
                    id="note-content"
                    name="content"
                    defaultValue={editingNote?.content ?? ""}
                    rows={6}
                    required
                    placeholder="Escribe tus notas clínicas..."
                    className="rounded-xl"
                  />
                </div>
                {patient.sessions.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="note-session" className="text-[13px] font-medium">Vincular a sesión</Label>
                    <select
                      id="note-session"
                      name="sessionId"
                      defaultValue={editingNote?.sessionId ?? ""}
                      className="bg-card h-11 w-full rounded-xl px-4 text-[15px] border border-[#EFEFEF]"
                    >
                      <option value="">Sin sesión</option>
                      {patient.sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {format(new Date(s.startTime), "dd/MM/yyyy HH:mm")} — {SESSION_STATUS_LABELS[s.status] ?? s.status}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={noteSaving} className="rounded-xl">
                    {noteSaving ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="sessions">
          <div className="overflow-hidden rounded-2xl bg-card border border-[#EFEFEF]">
            <div className="border-b border-[#EFEFEF] px-4 py-3">
              <h3 className="font-semibold">Historial de sesiones</h3>
            </div>
            {patient.sessions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[15px] text-muted-foreground">Sin sesiones aún</p>
              </div>
            ) : (
              <div className="divide-y divide-[#EFEFEF]">
                {patient.sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3.5">
                    <div>
                      <p className="font-medium">
                        {format(new Date(s.startTime), "dd MMM yyyy", { locale: es })} — {format(new Date(s.startTime), "HH:mm")}–{format(new Date(s.endTime), "HH:mm")}
                      </p>
                      {s.notes && <p className="text-[13px] text-muted-foreground">{s.notes}</p>}
                    </div>
                    <Badge className={cn("text-[11px] font-medium", statusColors[s.status] ?? "")} variant="secondary">
                      {SESSION_STATUS_LABELS[s.status] ?? s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
