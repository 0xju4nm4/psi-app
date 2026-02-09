"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format, startOfDay, endOfDay, startOfWeek, addDays } from "date-fns";

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
  const completedToday = todaySessions.filter(
    (s) => s.status === "COMPLETED" || new Date(s.endTime) < new Date()
  );

  if (loading) return <p className="text-muted-foreground">Loading dashboard...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{todaySessions.filter((s) => s.status !== "CANCELLED").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{weekSessions.filter((s) => s.status !== "CANCELLED").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{upcomingToday.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/patients/new"><Button variant="outline">Add Patient</Button></Link>
        <Link href="/calendar"><Button variant="outline">View Calendar</Button></Link>
        {settings?.bookingSlug && (
          <Button
            variant="outline"
            onClick={() => {
              const url = `${window.location.origin}/book/${settings.bookingSlug}`;
              navigator.clipboard.writeText(url);
            }}
          >
            Copy Booking Link
          </Button>
        )}
      </div>

      <Separator />

      {/* Today's schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Schedule - {format(new Date(), "EEEE, MMMM d")}</CardTitle>
        </CardHeader>
        <CardContent>
          {todaySessions.length === 0 ? (
            <p className="text-muted-foreground">No sessions scheduled for today</p>
          ) : (
            <div className="space-y-3">
              {todaySessions
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-mono">
                        {format(new Date(s.startTime), "HH:mm")} - {format(new Date(s.endTime), "HH:mm")}
                      </div>
                      <div>
                        <p className="font-medium">{s.patient?.name || s.guestName || "Session"}</p>
                      </div>
                    </div>
                    <Badge className={statusColors[s.status] ?? ""} variant="secondary">
                      {s.status}
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Week overview */}
      <Card>
        <CardHeader>
          <CardTitle>This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
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
                  className={`rounded-md border p-2 text-center ${isToday ? "border-primary bg-primary/5" : ""}`}
                >
                  <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
                  <div className="text-lg font-semibold">{format(day, "d")}</div>
                  <div className="text-xs text-muted-foreground">{count} session{count !== 1 ? "s" : ""}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
