"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  sessions: { startTime: string }[];
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/patients${params}`);
      if (res.ok) setPatients(await res.json());
      setLoading(false);
    };

    const debounce = setTimeout(fetchPatients, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Patients</h1>
        <Link href="/patients/new">
          <Button>Add Patient</Button>
        </Link>
      </div>

      <Input
        placeholder="Search patients by name, email, or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {loading ? (
        <p className="text-muted-foreground">Loading patients...</p>
      ) : patients.length === 0 ? (
        <p className="text-muted-foreground">
          {search ? "No patients found matching your search." : "No patients yet. Add your first patient!"}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient) => (
            <Link key={patient.id} href={`/patients/${patient.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <h3 className="font-medium">{patient.name}</h3>
                  <p className="text-sm text-muted-foreground">{patient.phone}</p>
                  {patient.email && (
                    <p className="text-sm text-muted-foreground">{patient.email}</p>
                  )}
                  {patient.sessions.length > 0 && (
                    <Badge variant="secondary" className="mt-2">
                      Next: {format(new Date(patient.sessions[0].startTime), "dd/MM HH:mm")}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
