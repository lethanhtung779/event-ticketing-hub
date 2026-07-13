-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "checkedInById" TEXT;

-- CreateIndex
CREATE INDEX "Ticket_checkedInById_idx" ON "Ticket"("checkedInById");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_checkedInById_fkey" FOREIGN KEY ("checkedInById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
