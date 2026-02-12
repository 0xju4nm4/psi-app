"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, endOfDay, startOfWeek, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { SESSION_STATUS_LABELS } from "@/lib/constants";
import { CalendarDays, UserPlus, Link as LinkIcon, Clock } from "lucide-react";

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
  SCHEDULED: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-yellow-100 text-yellow-800",
};

export default function DashboardPage() {
  const [todaySessions, setTodaySessions] = useState<TherapySession[]>([]);
  const [weekSessions, setWeekSessions] = useState<TherapySession[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const todayStart = startOfDay(today).toISOString();
    const todayEnd = endOfDay(today).toISOString();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }).toISOString();
    const weekEnd = addDays(startOfWeek(today, { weekStartsOn: 1 }), 7).toISOString();

    Promise.all([
      fetch(`/api/sessions?from=${todayStart}&to=${todayEnd}`).then((r) => r.json()),
      fetch(`/api/sessions?from=${weekStart}&to=${weekEnd}`).then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([today, week, settings]) => {
      setTodaySessions(today);
      setWeekSessions(week);
      setSettings(settings);
      setLoading(false);
    });
  }, []);

  const upcomingToday = todaySessions.filter(
    (s) => s.status !== "CANCELLED" && new Date(s.startTime) >= new Date()
  );

  if (loading) return <p className="text-muted-foreground">Cargando panel...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Panel</h1>

      {/* Quick stats — always 3 cols, compact */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-0">
          <CardContent className="px-3 py-3 sm:px-4 sm:py-4">
            <p className="text-xs text-muted-foreground sm:text-sm">Hoy</p>
            <p className="text-2xl font-bold sm:text-3xl">
              {todaySessions.filter((s) => s.status !== "CANCELLED").length}
            </p>
          </CardContent>
        </Card>
        <Card className="p-0">
          <CardContent className="px-3 py-3 sm:px-4 sm:py-4">
            <p className="text-xs text-muted-foreground sm:text-sm">Semana</p>
            <p className="text-2xl font-bold sm:text-3xl">
              {weekSessions.filter((s) => s.status !== "CANCELLED").length}
            </p>
          </CardContent>
        </Card>
        <Card className="p-0">
          <CardContent className="px-3 py-3 sm:px-4 sm:py-4">
            <p className="text-xs text-muted-foreground sm:text-sm">Próximas</p>
            <p className="text-2xl font-bold sm:text-3xl">{upcomingToday.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/patients/new">
          <Button variant="outline" size="sm">
            <UserPlus className="mr-2 size-4" />
            Agregar paciente
          </Button>
        </Link>
        <Link href="/calendar">
          <Button variant="outline" size="sm">
            <CalendarDays className="mr-2 size-4" />
            Ver calendario
          </Button>
        </Link>
        {settings?.bookingSlug && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = `${window.location.origin}/book/${settings.bookingSlug}`;
              navigator.clipboard.writeText(url);
            }}
          >
            <LinkIcon className="mr-2 size-4" />
            Copiar enlace de reserva
          </Button>
        )}
      </div>

      {/* Today's agenda */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">
            Agenda — {format(new Date(), "EEEE d", { locale: es })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin sesiones hoy</p>
          ) : (
            <div className="divide-y">
              {todaySessions
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((s) => (
                  <div key={s.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex shrink-0 items-center gap-1.5 pt-0.5 text-sm text-muted-foreground">
                      <Clock className="size-3.5" />
                      <span className="font-mono text-xs">
                        {format(new Date(s.startTime), "HH:mm")}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {s.patient?.name || s.guestName || "Sesión"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(s.startTime), "HH:mm")} – {format(new Date(s.endTime), "HH:mm")}
                      </p>
                    </div>
                    <Badge className={`shrink-0 text-[10px] sm:text-xs ${statusColors[s.status] ?? ""}`} variant="secondary">
                      {SESSION_STATUS_LABELS[s.status] ?? s.status}
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Week overview — horizontal scroll on mobile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Esta semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: 7 }, (_, i) => {
              const day = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
              const count = weekSessions.filter(
                (s) =>
                  s.status !== "CANCELLED" &&
                  format(new Date(s.startTime), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
              ).length;
              const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

              return (
                <div
                  key={i}
                  className={`flex min-w-[3.5rem] flex-1 flex-col items-center rounded-lg border px-2 py-2.5 text-center transition-colors ${
                    isToday ? "border-primary bg-primary/5 font-semibold" : ""
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                    {format(day, "EEE", { locale: es })}
                  </span>
                  <span className="text-lg font-semibold leading-tight sm:text-xl">{format(day, "d")}</span>
                  <span className={`mt-0.5 text-[10px] sm:text-xs ${count > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
