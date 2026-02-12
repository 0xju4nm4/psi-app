"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { SESSION_STATUS_LABELS } from "@/lib/constants";
import {
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

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Clinical notes state
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
      toast.success("Enlace copiado al portapapeles");
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
    formData.append("title", `Grabación de sesión — ${format(new Date(), "dd/MM/yyyy")}`);

    const res = await fetch(`/api/patients/${params.id}/notes/transcribe`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      toast.success("Audio transcrito exitosamente");
      fetchNotes();
    } else {
      toast.error("Error al transcribir audio");
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function toggleExpanded(noteId: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  }

  if (loading) return <p className="text-muted-foreground">Cargando...</p>;
  if (!patient) return <p className="text-muted-foreground">Paciente no encontrado</p>;

  const statusColors: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-800",
    CONFIRMED: "bg-green-100 text-green-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
    NO_SHOW: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{patient.name}</h1>
        <div className="flex gap-2">
          {bookingSlug && (
            <Button variant="outline" onClick={copyBookingLink}>
              {linkCopied ? (
                <Check className="mr-2 size-4 text-green-600" />
              ) : (
                <Link className="mr-2 size-4" />
              )}
              {linkCopied ? "¡Copiado!" : "Enlace de reserva"}
            </Button>
          )}
          <Button variant="outline" onClick={() => setEditing(!editing)}>
            {editing ? "Cancelar" : "Editar"}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="clinical-history">Historia Clínica</TabsTrigger>
          <TabsTrigger value="sessions">Sesiones</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info">
          {editing ? (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" name="name" defaultValue={patient.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Número de teléfono</Label>
                    <Input id="phone" name="phone" defaultValue={patient.phone} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={patient.email ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      defaultValue={patient.notes ?? ""}
                      rows={3}
                    />
                  </div>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="space-y-2 pt-6">
                <p>
                  <span className="font-medium">Teléfono:</span> {patient.phone}
                </p>
                {patient.email && (
                  <p>
                    <span className="font-medium">Correo:</span> {patient.email}
                  </p>
                )}
                {patient.notes && (
                  <p>
                    <span className="font-medium">Notas:</span> {patient.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Clinical History Tab */}
        <TabsContent value="clinical-history">
          <div className="space-y-4">
            {/* Action bar */}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setEditingNote(null);
                  setNoteDialogOpen(true);
                }}
              >
                <Plus className="mr-2 size-4" />
                Nueva nota
              </Button>
              {transcribing ? (
                <Button variant="outline" disabled>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Transcribiendo...
                </Button>
              ) : recording ? (
                <Button
                  variant="destructive"
                  onClick={stopRecording}
                  className="animate-pulse"
                >
                  <Square className="mr-2 size-4" />
                  Detener — {String(Math.floor(recordingTime / 60)).padStart(2, "0")}:
                  {String(recordingTime % 60).padStart(2, "0")}
                </Button>
              ) : (
                <Button variant="outline" onClick={startRecording}>
                  <Mic className="mr-2 size-4" />
                  Grabar
                </Button>
              )}
            </div>

            {/* Notes timeline */}
            {notesLoading ? (
              <p className="text-muted-foreground">Cargando notas...</p>
            ) : notes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Sin notas clínicas aún. Crea una nota de texto o graba un audio.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => {
                  const isExpanded = expandedNotes.has(note.id);
                  return (
                    <Card key={note.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {note.type === "AUDIO_TRANSCRIPT" ? (
                                <Mic className="text-muted-foreground size-4 shrink-0" />
                              ) : (
                                <FileText className="text-muted-foreground size-4 shrink-0" />
                              )}
                              <span className="truncate font-medium">
                                {note.title || "Sin título"}
                              </span>
                              <Badge variant="secondary" className="shrink-0 text-xs">
                                {note.type === "AUDIO_TRANSCRIPT" ? "Transcripción" : "Texto"}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mt-1 text-xs">
                              {format(new Date(note.createdAt), "dd/MM/yyyy HH:mm")}
                              {note.session &&
                                ` — Sesión: ${format(new Date(note.session.startTime), "dd/MM/yyyy")}`}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingNote(note);
                                setNoteDialogOpen(true);
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Content preview / expanded */}
                        <div className="mt-3">
                          <p className="text-sm whitespace-pre-wrap">
                            {isExpanded
                              ? note.content
                              : note.content.length > 200
                                ? note.content.slice(0, 200) + "..."
                                : note.content}
                          </p>

                          {isExpanded && note.summary && (
                            <>
                              <Separator className="my-3" />
                              <div>
                                <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase tracking-wide">
                                  Resumen IA
                                </p>
                                <p className="text-sm whitespace-pre-wrap">{note.summary}</p>
                              </div>
                            </>
                          )}

                          {(note.content.length > 200 || note.summary) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 h-auto p-0 text-xs"
                              onClick={() => toggleExpanded(note.id)}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="mr-1 size-3" />
                                  Ver menos
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="mr-1 size-3" />
                                  Ver más
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Note Dialog (create/edit) */}
          <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingNote ? "Editar nota" : "Nueva nota"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveNote} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="note-title">Título</Label>
                  <Input
                    id="note-title"
                    name="title"
                    defaultValue={editingNote?.title ?? ""}
                    placeholder="Notas de sesión, ingreso, seguimiento..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note-content">Contenido</Label>
                  <Textarea
                    id="note-content"
                    name="content"
                    defaultValue={editingNote?.content ?? ""}
                    rows={8}
                    required
                    placeholder="Escribe tus notas clínicas aquí..."
                  />
                </div>
                {patient.sessions.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="note-session">Vincular a sesión (opcional)</Label>
                    <select
                      id="note-session"
                      name="sessionId"
                      defaultValue={editingNote?.sessionId ?? ""}
                      className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
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
                  <Button type="submit" disabled={noteSaving}>
                    {noteSaving ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Historial de sesiones</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.sessions.length === 0 ? (
                <p className="text-muted-foreground">Sin sesiones aún</p>
              ) : (
                <div className="space-y-2">
                  {patient.sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {format(new Date(s.startTime), "dd/MM/yyyy HH:mm")} -{" "}
                          {format(new Date(s.endTime), "HH:mm")}
                        </p>
                        {s.notes && (
                          <p className="text-muted-foreground text-xs">{s.notes}</p>
                        )}
                      </div>
                      <Badge className={statusColors[s.status] ?? ""} variant="secondary">
                        {SESSION_STATUS_LABELS[s.status] ?? s.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
