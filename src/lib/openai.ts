import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(file: File): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "pt",
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
        content: `You are a clinical psychology assistant. Given a therapy session transcript, produce a structured summary in Portuguese (Brazil). Include:

- **Temas principais**: Key topics discussed
- **Estado emocional do paciente**: Patient's emotional state
- **Intervenções realizadas**: Therapeutic interventions used
- **Progresso observado**: Progress or changes noted
- **Pontos para acompanhamento**: Follow-up points for next session

Be concise and professional. Use clinical language appropriate for a psychologist's records.`,
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
