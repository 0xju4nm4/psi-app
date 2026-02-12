"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface TimeSlot {
  start: string;
  end: string;
  display: string;
}

interface PatientInfo {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

export default function PatientBookingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const patientId = params.patientId as string;

  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [pageError, setPageError] = useState("");
  const [loading, setLoading] = useState(true);
  const [slugValid, setSlugValid] = useState(false);

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [practitionerName, setPractitionerName] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");

  // Validate slug + fetch patient in parallel on mount
  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");

    Promise.all([
      fetch(`/api/calendar/availability?slug=${slug}&date=${today}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error && data.error === "Practitioner not found") {
            throw new Error("Profesional no encontrado");
          }
          if (data.practitionerName) setPractitionerName(data.practitionerName);
          setSlugValid(true);
        }),
      fetch(`/api/patients/${patientId}/public`)
        .then((res) => {
          if (!res.ok) throw new Error("Paciente no encontrado");
          return res.json();
        })
        .then((data) => setPatient(data)),
    ])
      .catch((err) => setPageError(err.message || "Enlace inválido"))
      .finally(() => setLoading(false));
  }, [slug, patientId]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (!date || !slugValid) return;

    setLoadingSlots(true);
    setSelectedSlot(null);
    setError("");

    fetch(`/api/calendar/availability?slug=${slug}&date=${format(date, "yyyy-MM-dd")}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setSlots([]);
        } else {
          setSlots(data.slots);
          setPractitionerName(data.practitionerName || "");
        }
      })
      .catch(() => setError("Error al cargar horarios disponibles"))
      .finally(() => setLoadingSlots(false));
  }, [date, slug, slugValid]);

  async function handleBook() {
    if (!selectedSlot || !date || !patient) return;

    setBooking(true);
    setError("");

    const startDate = new Date(selectedSlot.start);

    const res = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        name: patient.name,
        phone: patient.phone,
        email: patient.email || "",
        date: format(date, "yyyy-MM-dd"),
        time: format(startDate, "HH:mm"),
      }),
    });

    if (res.ok) {
      setBooked(true);
    } else {
      const data = await res.json();
      setError(data.error || "Error al reservar sesión");
    }
    setBooking(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (pageError || !patient || !slugValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-600">Enlace inválido</CardTitle>
            <CardDescription>
              {pageError || "No se pudo cargar la información. Verifica el enlace con tu terapeuta."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (booked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-green-600">¡Sesión reservada!</CardTitle>
            <CardDescription>
              {patient.name}, tu sesión ha sido confirmada para{" "}
              {date && format(date, "EEEE, d 'de' MMMM", { locale: es })} a las {selectedSlot?.display.split(" - ")[0]}.
              Recibirás un recordatorio por SMS antes de tu sesión.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle>
            {practitionerName ? `Reservar sesión con ${practitionerName}` : "Reservar una sesión"}
          </CardTitle>
          <CardDescription>
            Hola {patient.name}, selecciona una fecha y hora para tu cita
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Date picker */}
            <div>
              <Label className="mb-2 block">Selecciona una fecha</Label>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(d) => d < new Date() || d > addDays(new Date(), 30)}
                className="rounded-md border"
              />
            </div>

            {/* Time slots */}
            <div className="space-y-4">
              {date && (
                <>
                  <Label className="block">
                    Horarios disponibles para {format(date, "EEEE, d 'de' MMMM", { locale: es })}
                  </Label>
                  {loadingSlots ? (
                    <p className="text-sm text-muted-foreground">Cargando...</p>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin horarios disponibles en esta fecha</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {slots.map((slot) => (
                        <Button
                          key={slot.start}
                          variant={selectedSlot?.start === slot.start ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {slot.display}
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {selectedSlot && (
                <div className="border-t pt-4">
                  <Button
                    className="w-full"
                    disabled={booking}
                    onClick={handleBook}
                  >
                    {booking ? "Reservando..." : `Reservar ${selectedSlot.display}`}
                  </Button>
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
