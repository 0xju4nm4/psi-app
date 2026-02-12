import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSmsReminder(
  to: string,
  patientName: string,
  sessionTime: string,
  customMessage?: string | null,
  paymentReminder?: string | null
): Promise<void> {
  const body = [
    `¡Hola ${patientName}!`,
    `Recordatorio: tienes una sesión programada para ${sessionTime}.`,
    customMessage,
    paymentReminder,
  ]
    .filter(Boolean)
    .join("\n\n");

  await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
    body,
  });
}
