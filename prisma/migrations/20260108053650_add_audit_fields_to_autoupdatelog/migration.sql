-- AlterTable
ALTER TABLE "AutoUpdateLog" ADD COLUMN     "confidenceThreshold" DOUBLE PRECISION,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "totalProcessed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "triggeredBy" TEXT;
