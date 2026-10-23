-- AlterTable
ALTER TABLE "ContentPlan" ADD COLUMN IF NOT EXISTS "revisionNote" TEXT;
ALTER TABLE "ContentPlan" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);