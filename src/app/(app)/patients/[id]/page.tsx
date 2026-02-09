"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";

interface TherapySession {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
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

  useEffect(() => {
    fetch(`/api/patients/${params.id}`)
      .then((res) => res.json())
      .then(setPatient)
      .finally(() => setLoading(false));
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
      toast.success("Patient updated");
    } else {
      toast.error("Failed to update patient");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to remove this patient?")) return;

    const res = await fetch(`/api/patients/${params.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Patient removed");
      router.push("/patients");
    } else {
      toast.error("Failed to remove patient");
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!patient) return <p className="text-muted-foreground">Patient not found</p>;

  const statusColors: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-800",
    CONFIRMED: "bg-green-100 text-green-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
    NO_SHOW: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{patient.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing(!editing)}>
            {editing ? "Cancel" : "Edit"}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Remove
          </Button>
        </div>
      </div>

      {editing ? (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={patient.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp Number</Label>
                <Input id="phone" name="phone" defaultValue={patient.phone} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={patient.email ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" defaultValue={patient.notes ?? ""} rows={3} />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-2 pt-6">
            <p><span className="font-medium">Phone:</span> {patient.phone}</p>
            {patient.email && <p><span className="font-medium">Email:</span> {patient.email}</p>}
            {patient.notes && <p><span className="font-medium">Notes:</span> {patient.notes}</p>}
          </CardContent>
        </Card>
      )}

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
        </CardHeader>
        <CardContent>
          {patient.sessions.length === 0 ? (
            <p className="text-muted-foreground">No sessions yet</p>
          ) : (
            <div className="space-y-2">
              {patient.sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {format(new Date(s.startTime), "dd/MM/yyyy HH:mm")} -{" "}
                      {format(new Date(s.endTime), "HH:mm")}
                    </p>
                    {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
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
    </div>
  );
}
