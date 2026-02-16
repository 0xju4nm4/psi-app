-- CreateTable
CREATE TABLE "note_comments" (
    "id" TEXT NOT NULL,
    "clinical_note_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "quoted_text" TEXT NOT NULL,
    "start_offset" INTEGER NOT NULL,
    "end_offset" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "note_comments_clinical_note_id_idx" ON "note_comments"("clinical_note_id");

-- AddForeignKey
ALTER TABLE "note_comments" ADD CONSTRAINT "note_comments_clinical_note_id_fkey" FOREIGN KEY ("clinical_note_id") REFERENCES "clinical_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
