"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
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

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <Label className="text-[15px] font-normal shrink-0">{label}</Label>
      {children}
    </div>
  );
}

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
          workingHours:
            data.workingHours && Object.keys(data.workingHours).length > 0
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
      body: JSON.stringify({ ...settings, reminder1h: false }),
    });

    if (res.ok) {
      toast.success("Configuración guardada");
    } else {
      const err = await res.json();
      toast.error(err.error?.fieldErrors?.[0] || "Error al guardar");
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

  if (loading || !settings)
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );

  return (
    <div className="flex flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-[26px] font-bold tracking-tight">Ajustes</h1>
        <p className="text-[15px] text-muted-foreground">Configura tu consultorio</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
        {/* Left: Sesiones + Horario laboral */}
        <div className="flex flex-col gap-6">
          <section className="space-y-2">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sesiones
            </h2>
            <div className="overflow-hidden rounded-xl bg-card border border-[#EFEFEF]">
              <div className="divide-y divide-[#EFEFEF]">
                <SettingRow label="Duración (min)">
                  <Input
                    type="number"
                    value={settings.sessionDuration}
                    onChange={(e) =>
                      setSettings({ ...settings, sessionDuration: parseInt(e.target.value) || 50 })
                    }
                    min={15}
                    max={180}
                    className="h-9 w-24 rounded-lg text-right text-[15px]"
                  />
                </SettingRow>
                <SettingRow label="Buffer (min)">
                  <Input
                    type="number"
                    value={settings.bufferTime}
                    onChange={(e) =>
                      setSettings({ ...settings, bufferTime: parseInt(e.target.value) || 0 })
                    }
                    min={0}
                    max={60}
                    className="h-9 w-24 rounded-lg text-right text-[15px]"
                  />
                </SettingRow>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              Horario laboral
            </h2>
            <div className="overflow-hidden rounded-xl bg-card border border-[#EFEFEF]">
              <div className="divide-y divide-[#EFEFEF]">
                {DAYS.map((day) => (
                  <div key={day} className="flex items-center gap-3 px-4 py-2">
                    <label className="flex w-24 cursor-pointer items-center gap-2 shrink-0">
                      <input
                        type="checkbox"
                        checked={settings.workingHours[day]?.enabled ?? false}
                        onChange={(e) => updateWorkingDay(day, "enabled", e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                      <span className="text-[15px]">{DAY_LABELS[day]}</span>
                    </label>
                    <div className="flex flex-1 items-center gap-2 min-w-[160px]">
                      <Input
                        type="time"
                        value={settings.workingHours[day]?.start ?? "08:00"}
                        onChange={(e) => updateWorkingDay(day, "start", e.target.value)}
                        disabled={!settings.workingHours[day]?.enabled}
                        className="h-9 w-[7rem] shrink-0 rounded-lg text-[15px] tabular-nums [&::-webkit-datetime-edit]:text-[15px]"
                      />
                      <span className="text-[14px] text-muted-foreground shrink-0">–</span>
                      <Input
                        type="time"
                        value={settings.workingHours[day]?.end ?? "18:00"}
                        onChange={(e) => updateWorkingDay(day, "end", e.target.value)}
                        disabled={!settings.workingHours[day]?.enabled}
                        className="h-9 w-[7rem] shrink-0 rounded-lg text-[15px] tabular-nums [&::-webkit-datetime-edit]:text-[15px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right: Recordatorios */}
        <section className="space-y-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recordatorios
          </h2>
          <div className="overflow-hidden rounded-xl bg-card border border-[#EFEFEF]">
            <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={settings.reminder24h}
                onChange={(e) => setSettings({ ...settings, reminder24h: e.target.checked })}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-[15px]">24h antes</span>
            </label>
            <div className="border-t border-[#EFEFEF] space-y-3 p-4">
              <div>
                <Label className="text-[13px] font-medium text-muted-foreground">
                  Mensaje (opcional)
                </Label>
                <Textarea
                  value={settings.reminderMessage ?? ""}
                  onChange={(e) => setSettings({ ...settings, reminderMessage: e.target.value })}
                  placeholder="ej., Llega 5 min antes"
                  rows={3}
                  className="mt-1 min-h-[80px] rounded-lg text-[15px]"
                />
              </div>
              <div>
                <Label className="text-[13px] font-medium text-muted-foreground">
                  Pago (opcional)
                </Label>
                <Textarea
                  value={settings.paymentReminder ?? ""}
                  onChange={(e) => setSettings({ ...settings, paymentReminder: e.target.value })}
                  placeholder="ej., Pago vence antes"
                  rows={3}
                  className="mt-1 min-h-[80px] rounded-lg text-[15px]"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Guardando...
          </>
        ) : (
          "Guardar"
        )}
      </Button>
    </div>
  );
}
