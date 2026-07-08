/*
  Warnings:

  - The `category` column on the `Activity` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('DOKUMENTASI_KEGIATAN', 'PODCAST', 'STREAMING', 'PEMBERITAAN');

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "category",
ADD COLUMN     "category" "ActivityCategory" NOT NULL DEFAULT 'DOKUMENTASI_KEGIATAN';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN';

-- CreateTable
CREATE TABLE "ExternalLoan" (
    "id" SERIAL NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "borrowerName" TEXT NOT NULL,
    "borrowerPhone" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "borrowDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "actualReturnDate" TIMESTAMP(3),
    "status" "LoanStatus" NOT NULL DEFAULT 'DIPINJAM',
    "notes" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ExternalLoan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalLoan_status_borrowDate_idx" ON "ExternalLoan"("status", "borrowDate");

-- CreateIndex
CREATE INDEX "ExternalLoan_borrowerPhone_idx" ON "ExternalLoan"("borrowerPhone");

-- CreateIndex
CREATE INDEX "ExternalLoan_createdById_idx" ON "ExternalLoan"("createdById");

-- CreateIndex
CREATE INDEX "ExternalLoan_deletedAt_idx" ON "ExternalLoan"("deletedAt");

-- AddForeignKey
ALTER TABLE "ExternalLoan" ADD CONSTRAINT "ExternalLoan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
