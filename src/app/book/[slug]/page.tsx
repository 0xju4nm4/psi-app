"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function BookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [practitionerName, setPractitionerName] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!date) return;

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
  }, [date, slug]);

  async function handleBook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedSlot || !date) return;

    setBooking(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const startDate = new Date(selectedSlot.start);

    const res = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        name: formData.get("name"),
        phone: formData.get("phone"),
        email: formData.get("email"),
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

  if (booked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-green-600">¡Sesión reservada!</CardTitle>
            <CardDescription>
              Tu sesión ha sido confirmada para{" "}
              {date && format(date, "EEEE, d 'de' MMMM", { locale: es })} a las {selectedSlot?.display.split(" - ")[0]}.
              Recibirás un recordatorio por WhatsApp antes de tu sesión.
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
          <CardDescription>Selecciona una fecha y hora para tu cita</CardDescription>
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

            {/* Time slots + form */}
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
                <form onSubmit={handleBook} className="space-y-3 border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tu nombre *</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Número de WhatsApp *</Label>
                    <Input id="phone" name="phone" placeholder="+5511999999999" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico (opcional)</Label>
                    <Input id="email" name="email" type="email" />
                  </div>
                  <Button type="submit" className="w-full" disabled={booking}>
                    {booking ? "Reservando..." : `Reservar ${selectedSlot.display}`}
                  </Button>
                </form>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
