/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Business` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "lastSafetyCheck" TIMESTAMP(3),
ADD COLUMN     "monitoringActive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "hasMiniWeb" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSafeMeetingPoint" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "trustedContactId" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "aspiration" TEXT,
ADD COLUMN     "axles" INTEGER,
ADD COLUMN     "batteryCapacity" DOUBLE PRECISION,
ADD COLUMN     "cylinders" INTEGER,
ADD COLUMN     "hp" INTEGER,
ADD COLUMN     "moderationFeedback" TEXT,
ADD COLUMN     "range" INTEGER,
ADD COLUMN     "torque" TEXT,
ADD COLUMN     "weight" INTEGER,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(15,2);

-- CreateIndex
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");

-- CreateIndex
CREATE INDEX "Business_slug_idx" ON "Business"("slug");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_trustedContactId_fkey" FOREIGN KEY ("trustedContactId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
