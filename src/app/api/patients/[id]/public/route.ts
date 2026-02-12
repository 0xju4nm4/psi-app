import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const patient = await db.patient.findFirst({
    where: { id, isActive: true },
    select: { id: true, name: true, phone: true, email: true },
  });

  if (!patient) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
  }

  return NextResponse.json(patient);
}
