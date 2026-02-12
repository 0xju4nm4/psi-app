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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Pacientes</h1>
        <Link href="/patients/new">
          <Button size="sm">Agregar paciente</Button>
        </Link>
      </div>

      <Input
        placeholder="Buscar pacientes por nombre, correo o teléfono..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {loading ? (
        <p className="text-muted-foreground">Cargando pacientes...</p>
      ) : patients.length === 0 ? (
        <p className="text-muted-foreground">
          {search ? "No se encontraron pacientes con esa búsqueda." : "Sin pacientes aún. ¡Agrega tu primer paciente!"}
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient) => (
            <Link key={patient.id} href={`/patients/${patient.id}`}>
              <Card className="cursor-pointer p-0 transition-shadow hover:shadow-md">
                <CardContent className="px-3 py-2.5">
                  <h3 className="text-sm font-medium">{patient.name}</h3>
                  <p className="text-xs text-muted-foreground">{patient.phone}</p>
                  {patient.email && (
                    <p className="truncate text-xs text-muted-foreground">{patient.email}</p>
                  )}
                  {patient.sessions.length > 0 && (
                    <Badge variant="secondary" className="mt-1.5 text-[10px]">
                      Próxima: {format(new Date(patient.sessions[0].startTime), "dd/MM HH:mm")}
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
