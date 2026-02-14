"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

const HOURS = Array.from({ length: 14 }, (_, i) => i + 6);

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-500",
  CONFIRMED: "bg-green-500",
  COMPLETED: "bg-gray-400",
  CANCELLED: "bg-red-400",
  NO_SHOW: "bg-amber-500",
};

export default function CalendarPage() {
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSession, setShowNewSession] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

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
    fetch("/api/patients")
      .then((r) => r.json())
      .then(setPatients);
  }, []);

  async function handleSync() {
    setSyncing(true);
    const res = await fetch("/api/calendar/sync", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      toast.success(`Sincronizados ${data.synced} eventos`);
      fetchSessions();
    } else {
      toast.error("Error al sincronizar");
    }
    setSyncing(false);
  }

  async function handleNewSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const duration = parseInt(formData.get("duration") as string) || 50;
    const notes = formData.get("notes") as string;

    const startTime = new Date(`${date}T${time}`);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: selectedPatientId || undefined,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: notes || undefined,
      }),
    });

    if (res.ok) {
      toast.success("Sesión creada");
      setShowNewSession(false);
      setSelectedPatientId("");
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Calendario</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            {format(currentWeek, "d MMM", { locale: es })} – {format(addDays(currentWeek, 6), "d MMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-4" />
            )}
            {syncing ? "Sincronizando..." : "Google Calendar"}
          </Button>
          <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl">
                <Plus className="mr-2 size-4" />
                Nueva sesión
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nueva sesión</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleNewSession} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-[13px] font-medium">Fecha</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      required
                      defaultValue={format(new Date(), "yyyy-MM-dd")}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-[13px] font-medium">Hora</Label>
                    <Input id="time" name="time" type="time" required defaultValue="09:00" className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-[13px] font-medium">Duración (min)</Label>
                  <Input id="duration" name="duration" type="number" defaultValue={50} min={15} max={180} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientId" className="text-[13px] font-medium">Paciente</Label>
                  <Select value={selectedPatientId || undefined} onValueChange={(v) => setSelectedPatientId(v || "")}>
                    <SelectTrigger className="w-full rounded-xl">
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-[13px] font-medium">Notas</Label>
                  <Textarea id="notes" name="notes" rows={2} className="rounded-xl" />
                </div>
                <Button type="submit" className="w-full rounded-xl">Crear sesión</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 border border-[#EFEFEF]">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <span className="text-[15px] font-medium">
          {format(currentWeek, "d MMM", { locale: es })} – {format(addDays(currentWeek, 6), "d MMM", { locale: es })}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl"
            onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          >
            Hoy
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-2xl bg-card border border-[#EFEFEF]">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-8 border-b border-[#EFEFEF]">
            <div className="p-2" />
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-2 text-center",
                  isSameDay(day, new Date()) && "bg-primary/10 text-primary"
                )}
              >
                <div className="text-[12px] font-medium uppercase text-muted-foreground">
                  {format(day, "EEE", { locale: es })}
                </div>
                <div className="text-lg font-bold">{format(day, "d")}</div>
              </div>
            ))}
          </div>

          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-[#EFEFEF] last:border-b-0">
              <div className="p-2 text-right font-mono text-[12px] text-muted-foreground">
                {String(hour).padStart(2, "0")}:00
              </div>
              {weekDays.map((day) => {
                const daySessions = getSessionsForDayAndHour(day, hour);
                return (
                  <div
                    key={day.toISOString()}
                    className="min-h-[3.5rem] border-l border-[#EFEFEF] p-1"
                  >
                    {daySessions.map((s) => (
                      <div
                        key={s.id}
                        className={cn(
                          "rounded-lg px-2 py-1.5 text-[11px] text-white",
                          statusColors[s.status] || "bg-blue-500"
                        )}
                      >
                        <div className="font-medium truncate">
                          {format(new Date(s.startTime), "HH:mm")}{" "}
                          {s.patient?.name || s.guestName || "Sesión"}
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
