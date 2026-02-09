import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsAppReminder(
  to: string,
  patientName: string,
  sessionTime: string,
  customMessage?: string | null,
  paymentReminder?: string | null
): Promise<void> {
  const body = [
    `Ola ${patientName}!`,
    `Lembrete: voce tem uma sessao agendada para ${sessionTime}.`,
    customMessage,
    paymentReminder,
  ]
    .filter(Boolean)
    .join("\n\n");

  await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${to}`,
    body,
  });
}
