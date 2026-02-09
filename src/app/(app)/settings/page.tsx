"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface WorkingDay {
  start: string;
  end: string;
  enabled: boolean;
}

interface SettingsData {
  bookingSlug: string;
  sessionDuration: number;
  bufferTime: number;
  workingHours: Record<string, WorkingDay>;
  timezone: string;
  reminder24h: boolean;
  reminder1h: boolean;
  reminderMessage: string | null;
  paymentReminder: string | null;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const defaultWorkingHours: Record<string, WorkingDay> = {
  monday: { start: "08:00", end: "18:00", enabled: true },
  tuesday: { start: "08:00", end: "18:00", enabled: true },
  wednesday: { start: "08:00", end: "18:00", enabled: true },
  thursday: { start: "08:00", end: "18:00", enabled: true },
  friday: { start: "08:00", end: "18:00", enabled: true },
  saturday: { start: "08:00", end: "12:00", enabled: false },
  sunday: { start: "08:00", end: "12:00", enabled: false },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          ...data,
          workingHours: data.workingHours && Object.keys(data.workingHours).length > 0
            ? data.workingHours
            : defaultWorkingHours,
        });
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    if (res.ok) {
      toast.success("Settings saved");
    } else {
      const err = await res.json();
      toast.error(err.error?.fieldErrors?.[0] || "Failed to save settings");
    }
    setSaving(false);
  }

  function updateWorkingDay(day: string, field: keyof WorkingDay, value: string | boolean) {
    if (!settings) return;
    setSettings({
      ...settings,
      workingHours: {
        ...settings.workingHours,
        [day]: { ...settings.workingHours[day], [field]: value },
      },
    });
  }

  if (loading || !settings) return <p className="text-muted-foreground">Loading settings...</p>;

  const bookingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/book/${settings.bookingSlug}`
    : `/book/${settings.bookingSlug}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* Booking */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Page</CardTitle>
          <CardDescription>Your public booking URL for patients</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Booking slug</Label>
            <Input
              id="slug"
              value={settings.bookingSlug}
              onChange={(e) => setSettings({ ...settings, bookingSlug: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Your booking page: <span className="font-mono">{bookingUrl}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Session settings */}
      <Card>
        <CardHeader>
          <CardTitle>Session Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Session duration (min)</Label>
              <Input
                id="duration"
                type="number"
                value={settings.sessionDuration}
                onChange={(e) => setSettings({ ...settings, sessionDuration: parseInt(e.target.value) || 50 })}
                min={15}
                max={180}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buffer">Buffer between sessions (min)</Label>
              <Input
                id="buffer"
                type="number"
                value={settings.bufferTime}
                onChange={(e) => setSettings({ ...settings, bufferTime: parseInt(e.target.value) || 0 })}
                min={0}
                max={60}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Working hours */}
      <Card>
        <CardHeader>
          <CardTitle>Working Hours</CardTitle>
          <CardDescription>Set your available hours for each day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-3">
              <label className="flex w-28 items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.workingHours[day]?.enabled ?? false}
                  onChange={(e) => updateWorkingDay(day, "enabled", e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">{DAY_LABELS[day]}</span>
              </label>
              <Input
                type="time"
                value={settings.workingHours[day]?.start ?? "08:00"}
                onChange={(e) => updateWorkingDay(day, "start", e.target.value)}
                disabled={!settings.workingHours[day]?.enabled}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="time"
                value={settings.workingHours[day]?.end ?? "18:00"}
                onChange={(e) => updateWorkingDay(day, "end", e.target.value)}
                disabled={!settings.workingHours[day]?.enabled}
                className="w-32"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reminders */}
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Reminders</CardTitle>
          <CardDescription>Configure automatic reminders sent to patients via WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.reminder24h}
                onChange={(e) => setSettings({ ...settings, reminder24h: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Send reminder 24 hours before session</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.reminder1h}
                onChange={(e) => setSettings({ ...settings, reminder1h: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Send reminder 1 hour before session</span>
            </label>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="reminderMsg">Custom reminder message (optional)</Label>
            <Textarea
              id="reminderMsg"
              value={settings.reminderMessage ?? ""}
              onChange={(e) => setSettings({ ...settings, reminderMessage: e.target.value })}
              placeholder="e.g., Please arrive 5 minutes early"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMsg">Payment reminder message (optional)</Label>
            <Textarea
              id="paymentMsg"
              value={settings.paymentReminder ?? ""}
              onChange={(e) => setSettings({ ...settings, paymentReminder: e.target.value })}
              placeholder="e.g., Payment of R$200 is due before the session via PIX"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
