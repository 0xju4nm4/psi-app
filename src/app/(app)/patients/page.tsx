"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { UserPlus, Search, ChevronRight, Users } from "lucide-react";

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Pacientes</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">Gestiona tu lista de pacientes</p>
        </div>
        <Link href="/patients/new">
          <Button size="sm" className="rounded-xl">
            <UserPlus className="mr-2 size-4" />
            Agregar paciente
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, correo o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#EFEFEF] py-16">
          <Users className="size-12 text-muted-foreground/50" />
          <p className="mt-4 text-[15px] font-medium">
            {search ? "No hay resultados" : "Sin pacientes aún"}
          </p>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {search
              ? "Prueba con otro término de búsqueda"
              : "Agrega tu primer paciente para comenzar"}
          </p>
          {!search && (
            <Link href="/patients/new" className="mt-4">
              <Button size="sm" className="rounded-xl">
                <UserPlus className="mr-2 size-4" />
                Agregar paciente
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card border border-[#EFEFEF]">
          <div className="divide-y divide-[#EFEFEF]">
            {patients.map((patient) => (
              <Link
                key={patient.id}
                href={`/patients/${patient.id}`}
                className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{patient.name}</p>
                  <p className="text-[13px] text-muted-foreground">{patient.phone}</p>
                  {patient.email && (
                    <p className="truncate text-[12px] text-muted-foreground">{patient.email}</p>
                  )}
                  {patient.sessions.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="mt-1.5 text-[11px] font-medium bg-primary/10 text-primary border-0"
                    >
                      Próxima: {format(new Date(patient.sessions[0].startTime), "dd MMM HH:mm", { locale: es })}
                    </Badge>
                  )}
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
