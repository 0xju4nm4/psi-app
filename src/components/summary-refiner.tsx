"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SummaryRefinerProps {
  noteId: string;
  patientId: string;
  currentSummary: string | null;
  onSummaryUpdated: (newSummary: string) => void;
}

export function SummaryRefiner({
  noteId,
  patientId,
  currentSummary,
  onSummaryUpdated,
}: SummaryRefinerProps) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!instruction.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/patients/${patientId}/notes/${noteId}/refine-summary`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instruction: instruction.trim() }),
        }
      );

      if (!res.ok) throw new Error("Error al procesar");

      const data = await res.json();
      onSummaryUpdated(data.summary);
      setInstruction("");
      toast.success("Resumen actualizado");
    } catch {
      toast.error("Error al ajustar el resumen");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 h-auto gap-1.5 p-0 text-[13px] text-primary"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="size-3" />
        {currentSummary ? "Ajustar resumen" : "Generar resumen con IA"}
      </Button>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <Input
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder={
          currentSummary
            ? "Ej: Ampliar la sección de estado emocional..."
            : "Ej: Generar un resumen enfocado en los temas principales..."
        }
        disabled={loading}
        className="h-9 rounded-xl text-[14px]"
        autoFocus
      />
      <Button
        size="icon"
        className="size-9 shrink-0 rounded-xl"
        onClick={handleSubmit}
        disabled={loading || !instruction.trim()}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 rounded-xl"
        onClick={() => {
          setOpen(false);
          setInstruction("");
        }}
        disabled={loading}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
