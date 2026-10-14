-- AlterTable
ALTER TABLE "sermon" ADD COLUMN     "submittedById" TEXT;

-- AlterTable
ALTER TABLE "track" ADD COLUMN     "submittedById" TEXT;

-- AddForeignKey
ALTER TABLE "track" ADD CONSTRAINT "track_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sermon" ADD CONSTRAINT "sermon_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
