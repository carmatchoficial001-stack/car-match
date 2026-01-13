-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "hasEmergencyService" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasHomeService" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is24Hours" BOOLEAN NOT NULL DEFAULT false;
