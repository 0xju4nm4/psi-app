"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

interface Patient {
  id: string;
  name: string;
}

interface TherapySession {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  guestName: string | null;
  patient: Patient | null;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 6); // 6:00 - 19:00

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-500",
  CONFIRMED: "bg-green-500",
  COMPLETED: "bg-gray-400",
  CANCELLED: "bg-red-400",
  NO_SHOW: "bg-yellow-500",
};

export default function CalendarPage() {
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSession, setShowNewSession] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const from = currentWeek.toISOString();
    const to = addDays(currentWeek, 7).toISOString();
    const res = await fetch(`/api/sessions?from=${from}&to=${to}`);
    if (res.ok) setSessions(await res.json());
    setLoading(false);
  }, [currentWeek]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetch("/api/patients").then((r) => r.json()).then(setPatients);
  }, []);

  async function handleSync() {
    setSyncing(true);
    const res = await fetch("/api/calendar/sync", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      toast.success(`Se sincronizaron ${data.synced} eventos de Google Calendar`);
      fetchSessions();
    } else {
      toast.error("Error al sincronizar calendario");
    }
    setSyncing(false);
  }

  async function handleNewSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const duration = parseInt(formData.get("duration") as string) || 50;
    const patientId = formData.get("patientId") as string;
    const notes = formData.get("notes") as string;

    const startTime = new Date(`${date}T${time}`);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: patientId || undefined,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: notes || undefined,
      }),
    });

    if (res.ok) {
      toast.success("Sesión creada");
      setShowNewSession(false);
      fetchSessions();
    } else {
      toast.error("Error al crear sesión");
    }
  }

  function getSessionsForDayAndHour(day: Date, hour: number): TherapySession[] {
    return sessions.filter((s) => {
      const start = new Date(s.startTime);
      return isSameDay(start, day) && start.getHours() === hour;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[34px] font-bold tracking-tight">Calendario</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            {syncing ? "Sincronizando..." : "Sincronizar Google Calendar"}
          </Button>
          <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
            <DialogTrigger asChild>
              <Button size="sm">Nueva sesión</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva sesión</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleNewSession} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input id="date" name="date" type="date" required defaultValue={format(new Date(), "yyyy-MM-dd")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Hora</Label>
                    <Input id="time" name="time" type="time" required defaultValue="09:00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos)</Label>
                  <Input id="duration" name="duration" type="number" defaultValue={50} min={15} max={180} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientId">Paciente</Label>
                  <Select name="patientId">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar paciente (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea id="notes" name="notes" rows={2} />
                </div>
                <Button type="submit">Crear sesión</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            Siguiente
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">
          {format(currentWeek, "dd MMM", { locale: es })} – {format(addDays(currentWeek, 6), "dd MMM yyyy", { locale: es })}
        </span>
      </div>

      {/* Week grid */}
      <div className="overflow-x-auto rounded-xl border border-border/50">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 text-center text-xs font-medium text-muted-foreground" />
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-2 text-center text-sm font-medium ${
                  isSameDay(day, new Date()) ? "bg-primary/5 text-primary" : ""
                }`}
              >
                <div>{format(day, "EEE", { locale: es })}</div>
                <div className="text-lg">{format(day, "d")}</div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
              <div className="p-2 text-right text-xs text-muted-foreground">
                {String(hour).padStart(2, "0")}:00
              </div>
              {weekDays.map((day) => {
                const daySessions = getSessionsForDayAndHour(day, hour);
                return (
                  <div key={day.toISOString()} className="min-h-[3rem] border-l p-0.5">
                    {daySessions.map((s) => (
                      <div
                        key={s.id}
                        className={`rounded px-1.5 py-0.5 text-xs text-white ${statusColors[s.status] || "bg-blue-500"}`}
                      >
                        <div className="font-medium truncate">
                          {format(new Date(s.startTime), "HH:mm")} {s.patient?.name || s.guestName || "Sesión"}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
