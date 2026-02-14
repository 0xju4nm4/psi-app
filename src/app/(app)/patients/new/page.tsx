"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      notes: formData.get("notes") as string,
    };

    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success("Paciente creado");
      router.push("/patients");
    } else {
      const err = await res.json();
      toast.error(err.error?.fieldErrors?.name?.[0] || "Error al crear paciente");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href="/patients"
        className="inline-flex items-center gap-2 text-[15px] font-medium text-primary transition-colors hover:text-primary/80"
      >
        <ArrowLeft className="size-4" />
        Pacientes
      </Link>

      <div>
        <h1 className="text-[28px] font-bold tracking-tight">Nuevo paciente</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">Añade los datos del paciente</p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card border border-[#EFEFEF]">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[13px] font-medium">Nombre *</Label>
            <Input id="name" name="name" required className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[13px] font-medium">Teléfono *</Label>
            <Input id="phone" name="phone" placeholder="+5491199999999" required className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[13px] font-medium">Correo electrónico</Label>
            <Input id="email" name="email" type="email" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-[13px] font-medium">Notas</Label>
            <Textarea id="notes" name="notes" rows={3} className="rounded-xl" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1 rounded-xl">
              {loading ? "Creando..." : "Crear paciente"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl">
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
