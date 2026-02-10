-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('TEXT', 'AUDIO_TRANSCRIPT');

-- CreateTable
CREATE TABLE "clinical_notes" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "session_id" TEXT,
    "type" "NoteType" NOT NULL DEFAULT 'TEXT',
    "title" TEXT,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clinical_notes_patient_id_idx" ON "clinical_notes"("patient_id");

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "therapy_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
