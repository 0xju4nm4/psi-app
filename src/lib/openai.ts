import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(file: File): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "es",
  });

  return transcription.text;
}

export async function summarizeTranscript(
  transcript: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Eres un asistente de psicología clínica. Dado un transcripción de sesión terapéutica, produce un resumen estructurado en español. Incluye:

- **Temas principales**: Temas clave discutidos
- **Estado emocional del paciente**: Estado emocional observado
- **Intervenciones realizadas**: Técnicas e intervenciones terapéuticas utilizadas
- **Progreso observado**: Avances o cambios notados
- **Puntos de seguimiento**: Puntos a dar seguimiento en la próxima sesión

Sé conciso y profesional. Usa lenguaje clínico apropiado para los registros de un psicólogo. Responde siempre en español.`,
      },
      {
        role: "user",
        content: transcript,
      },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content ?? "";
}
