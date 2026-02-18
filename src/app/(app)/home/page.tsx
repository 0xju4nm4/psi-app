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
import { format, startOfDay, endOfDay, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { SESSION_STATUS_LABELS } from "@/lib/constants";
import { Clock, ChevronRight, ChevronLeft, Plus, RefreshCw, Loader2, LayoutList, Grid3x3 } from "lucide-react";
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
  SCHEDULED: "bg-blue-500/15 text-blue-700",
  CONFIRMED: "bg-green-500/15 text-green-700",
  COMPLETED: "bg-gray-400/20 text-gray-600",
  CANCELLED: "bg-red-500/15 text-red-600",
  NO_SHOW: "bg-amber-500/15 text-amber-700",
};

const statusColorsSolid: Record<string, string> = {
  SCHEDULED: "bg-blue-500",
  CONFIRMED: "bg-green-500",
  COMPLETED: "bg-gray-400",
  CANCELLED: "bg-red-400",
  NO_SHOW: "bg-amber-500",
};

type ViewMode = "agenda" | "week";

export default function HomePage() {
  const [weekSessions, setWeekSessions] = useState<TherapySession[]>([]);
  const [todaySessions, setTodaySessions] = useState<TherapySession[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("agenda");
  const [showNewSession, setShowNewSession] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const today = new Date();

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const weekStart = currentWeekStart.toISOString();
    const weekEnd = addDays(currentWeekStart, 7).toISOString();
    const todayStart = startOfDay(now).toISOString();
    const todayEnd = endOfDay(now).toISOString();

    const [week, todayData] = await Promise.all([
      fetch(`/api/sessions?from=${weekStart}&to=${weekEnd}`).then((r) => r.json()),
      fetch(`/api/sessions?from=${todayStart}&to=${todayEnd}`).then((r) => r.json()),
    ]);
    setWeekSessions(week);
    setTodaySessions(todayData);
    setLoading(false);
  }, [currentWeekStart]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetch("/api/patients").then((r) => r.json()).then(setPatients);
    fetch("/api/settings").then((r) => r.json());
  }, []);

  useEffect(() => {
    const weekEnd = addDays(currentWeekStart, 6);
    setSelectedDate((prev) => {
      if (prev >= currentWeekStart && prev <= weekEnd) return prev;
      const todayInWeek = today >= currentWeekStart && today <= weekEnd;
      return todayInWeek ? today : currentWeekStart;
    });
  }, [currentWeekStart]);

  const selectedDaySessions = weekSessions
    .filter(
      (s) =>
        format(new Date(s.startTime), "yyyy-MM-dd") ===
        format(selectedDate, "yyyy-MM-dd")
    )
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const upcomingToday = todaySessions.filter(
    (s) => s.status !== "CANCELLED" && new Date(s.startTime) >= new Date()
  );

  const stats = loading
    ? null
    : [
        { label: "Hoy", value: todaySessions.filter((s) => s.status !== "CANCELLED").length },
        { label: "Semana", value: weekSessions.filter((s) => s.status !== "CANCELLED").length },
        { label: "Próximas", value: upcomingToday.length },
      ];

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

  async function handleNewSession(e: React.SyntheticEvent<HTMLFormElement>) {
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
    return weekSessions.filter((s) => {
      const start = new Date(s.startTime);
      return isSameDay(start, day) && start.getHours() === hour;
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-5">
          {stats ? (
            stats.map((stat, i) => (
              <div key={stat.label} className={cn("flex flex-col gap-0.5", i > 0 && "border-l border-[#EFEFEF] pl-5")}>
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </span>
                <span className="text-[22px] font-bold tabular-nums leading-none">{stat.value}</span>
              </div>
            ))
          ) : (
            [1, 2, 3].map((i) => (
              <div key={i} className={cn("flex flex-col gap-1.5", i > 1 && "border-l border-[#EFEFEF] pl-5")}>
                <div className="h-2.5 w-10 animate-pulse rounded bg-muted" />
                <div className="h-6 w-7 animate-pulse rounded bg-muted" />
              </div>
            ))
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="size-4 animate-spin sm:mr-2" />
            ) : (
              <RefreshCw className="size-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">
              {syncing ? "Sincronizando..." : "Google Calendar"}
            </span>
          </Button>
          <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl">
                <Plus className="size-4 sm:mr-2" />
                <span className="hidden sm:inline">Nueva sesión</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nueva sesión</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleNewSession} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-[13px] font-medium">
                      Fecha
                    </Label>
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
                    <Label htmlFor="time" className="text-[13px] font-medium">
                      Hora
                    </Label>
                    <Input
                      id="time"
                      name="time"
                      type="time"
                      required
                      defaultValue="09:00"
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-[13px] font-medium">
                    Duración (min)
                  </Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    defaultValue={50}
                    min={15}
                    max={180}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientId" className="text-[13px] font-medium">
                    Paciente
                  </Label>
                  <Select
                    value={selectedPatientId || undefined}
                    onValueChange={(v) => setSelectedPatientId(v || "")}
                  >
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
                  <Label htmlFor="notes" className="text-[13px] font-medium">
                    Notas
                  </Label>
                  <Textarea id="notes" name="notes" rows={2} className="rounded-xl" />
                </div>
                <Button type="submit" className="w-full rounded-xl">
                  Crear sesión
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Agenda section */}
      <section className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Agenda
          </h2>
          <div className="flex items-center gap-1 rounded-lg border border-[#EFEFEF] bg-card p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("agenda")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                viewMode === "agenda"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutList className="size-3.5" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                viewMode === "week"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid3x3 className="size-3.5" />
              Semana
            </button>
          </div>
        </div>

        {/* Week navigation */}
        {viewMode === "agenda" ? (
          <div className="mb-4 flex w-full items-center gap-2 rounded-xl bg-card p-2 border border-[#EFEFEF]">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg"
              onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex min-w-0 flex-1 gap-1">
              {weekDays.map((day) => {
                const count = weekSessions.filter(
                  (s) =>
                    s.status !== "CANCELLED" &&
                    format(new Date(s.startTime), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                ).length;
                const selected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, today);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex min-w-0 flex-1 flex-col items-center rounded-lg px-1 py-2 text-center transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : isToday
                          ? "bg-primary/15 text-primary font-medium"
                          : "hover:bg-muted/60"
                    )}
                  >
                    <span className="text-[10px] font-medium uppercase">
                      {format(day, "EEE", { locale: es })}
                    </span>
                    <span className="mt-0.5 text-base font-bold">{format(day, "d")}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          "mt-0.5 text-[10px] font-medium",
                          selected ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg"
              onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="mb-4 flex w-full items-center justify-between rounded-xl bg-card px-3 py-2.5 border border-[#EFEFEF]">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-[14px] font-medium">
              {format(currentWeekStart, "d MMM", { locale: es })} –{" "}
              {format(addDays(currentWeekStart, 6), "d MMM", { locale: es })}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-[13px]"
                onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              >
                Hoy
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Lista view */}
        {viewMode === "agenda" && (
          <div className="overflow-hidden rounded-2xl bg-card border border-[#EFEFEF]">
            <div className="border-b border-[#EFEFEF] px-4 py-2.5">
              <p className="text-[15px] font-medium">
                {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </p>
            </div>
            <div>
              {loading ? (
                <div className="flex min-h-[120px] items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : selectedDaySessions.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-[15px] text-muted-foreground">Sin sesiones</p>
                </div>
              ) : (
                <div className="divide-y divide-[#EFEFEF]">
                  {selectedDaySessions.map((s) => (
                    <div key={s.id} className="flex items-center gap-4 px-4 py-3.5">
                      <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
                        <Clock className="size-4" />
                        <span className="font-mono text-[13px]">
                          {format(new Date(s.startTime), "HH:mm")}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {s.patient?.name || s.guestName || "Sesión"}
                        </p>
                        <p className="text-[13px] text-muted-foreground">
                          {format(new Date(s.startTime), "HH:mm")} –{" "}
                          {format(new Date(s.endTime), "HH:mm")}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "shrink-0 text-[11px] font-medium",
                          statusColors[s.status] ?? ""
                        )}
                        variant="secondary"
                      >
                        {SESSION_STATUS_LABELS[s.status] ?? s.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Semana grid view */}
        {viewMode === "week" && (
          <div className="overflow-x-auto rounded-2xl bg-card border border-[#EFEFEF]">
            {loading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="min-w-[600px]">
                <div className="grid grid-cols-8 border-b border-[#EFEFEF]">
                  <div className="p-2" />
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "p-2 text-center",
                        isSameDay(day, today) && "bg-primary/10 text-primary"
                      )}
                    >
                      <div className="text-[11px] font-medium uppercase text-muted-foreground">
                        {format(day, "EEE", { locale: es })}
                      </div>
                      <div className="text-base font-bold">{format(day, "d")}</div>
                    </div>
                  ))}
                </div>
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="grid grid-cols-8 border-b border-[#EFEFEF] last:border-b-0"
                  >
                    <div className="p-2 text-right font-mono text-[11px] text-muted-foreground">
                      {String(hour).padStart(2, "0")}:00
                    </div>
                    {weekDays.map((day) => {
                      const daySessions = getSessionsForDayAndHour(day, hour);
                      return (
                        <div
                          key={day.toISOString()}
                          className="min-h-[3rem] border-l border-[#EFEFEF] p-1"
                        >
                          {daySessions.map((s) => (
                            <div
                              key={s.id}
                              className={cn(
                                "rounded-md px-1.5 py-1 text-[10px] text-white",
                                statusColorsSolid[s.status] || "bg-blue-500"
                              )}
                            >
                              <div className="truncate font-medium">
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
            )}
          </div>
        )}
      </section>
    </div>
  );
}
