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

export async function refineSummary(
  noteContent: string,
  currentSummary: string | null,
  userInstruction: string
): Promise<string> {
  const systemPrompt = currentSummary
    ? `Eres un asistente de psicología clínica. Se te proporciona una nota clínica, su resumen actual, y una instrucción del terapeuta para ajustar el resumen. Produce un resumen actualizado siguiendo la instrucción. Mantén el formato estructurado existente a menos que se indique lo contrario. Responde siempre en español.`
    : `Eres un asistente de psicología clínica. Se te proporciona una nota clínica y una instrucción del terapeuta. Genera un resumen estructurado en español siguiendo la instrucción. Incluye los puntos que el terapeuta solicite. Usa lenguaje clínico apropiado.`;

  const userContent = currentSummary
    ? `## Nota clínica:\n${noteContent}\n\n## Resumen actual:\n${currentSummary}\n\n## Instrucción:\n${userInstruction}`
    : `## Nota clínica:\n${noteContent}\n\n## Instrucción:\n${userInstruction}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content ?? "";
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
