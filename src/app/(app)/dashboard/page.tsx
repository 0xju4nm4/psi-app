"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, endOfDay, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { SESSION_STATUS_LABELS } from "@/lib/constants";
import { Clock, ChevronRight, ChevronLeft } from "lucide-react";
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
  guestName: string | null;
  patient: Patient | null;
}

interface Settings {
  bookingSlug: string;
}

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-500/15 text-blue-700",
  CONFIRMED: "bg-green-500/15 text-green-700",
  COMPLETED: "bg-gray-400/20 text-gray-600",
  CANCELLED: "bg-red-500/15 text-red-600",
  NO_SHOW: "bg-amber-500/15 text-amber-700",
};

export default function DashboardPage() {
  const [weekSessions, setWeekSessions] = useState<TherapySession[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const today = new Date();

  const [todaySessions, setTodaySessions] = useState<TherapySession[]>([]);

  useEffect(() => {
    const weekStart = currentWeekStart.toISOString();
    const weekEnd = addDays(currentWeekStart, 7).toISOString();
    const todayStart = startOfDay(today).toISOString();
    const todayEnd = endOfDay(today).toISOString();

    Promise.all([
      fetch(`/api/sessions?from=${weekStart}&to=${weekEnd}`).then((r) => r.json()),
      fetch(`/api/sessions?from=${todayStart}&to=${todayEnd}`).then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([week, todayData, settings]) => {
      setWeekSessions(week);
      setTodaySessions(todayData);
      setSettings(settings);
      setLoading(false);
    });
  }, [currentWeekStart]);

  useEffect(() => {
    const weekEnd = addDays(currentWeekStart, 6);
    const todayInWeek = today >= currentWeekStart && today <= weekEnd;
    setSelectedDate((prev) => {
      if (prev >= currentWeekStart && prev <= weekEnd) return prev;
      return todayInWeek ? today : currentWeekStart;
    });
  }, [currentWeekStart]);

  const selectedDaySessions = weekSessions
    .filter(
      (s) =>
        format(new Date(s.startTime), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
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

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Bienvenidx</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground uppercase">
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {stats ? (
        <div className="flex w-full rounded-xl border border-[#EFEFEF] bg-card px-3 py-2.5">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5",
                i > 0 && "border-l border-[#EFEFEF]"
              )}
            >
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </span>
              <span className="text-[19px] font-bold tabular-nums leading-none">{stat.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex w-full rounded-xl border border-[#EFEFEF] bg-card px-3 py-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-1 flex-col items-center">
              <div className="h-3 w-12 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-6 w-8 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {/* Day selector + agenda */}
      <section className="w-full">
        <div className="mb-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Agenda
          </h2>
        </div>

        {/* Week navigation + day strip */}
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
                    "flex min-w-0 flex-1 flex-col items-center rounded-lg px-2 py-2 text-center transition-colors",
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

        {/* Agenda for selected day */}
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
                <Link
                  key={s.id}
                  href="/calendar"
                  className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50"
                >
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
                      {format(new Date(s.startTime), "HH:mm")} – {format(new Date(s.endTime), "HH:mm")}
                    </p>
                  </div>
                  <Badge
                    className={cn("shrink-0 text-[11px] font-medium", statusColors[s.status] ?? "")}
                    variant="secondary"
                  >
                    {SESSION_STATUS_LABELS[s.status] ?? s.status}
                  </Badge>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
          </div>
        </div>
      </section>
    </div>
  );
}
