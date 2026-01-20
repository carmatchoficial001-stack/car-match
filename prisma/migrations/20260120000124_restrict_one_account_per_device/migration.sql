/*
  Warnings:

  - A unique constraint covering the columns `[deviceHash]` on the table `DigitalFingerprint` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deviceHash` to the `DigitalFingerprint` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DigitalFingerprint_userId_key";

-- AlterTable
ALTER TABLE "DigitalFingerprint" ADD COLUMN     "deviceHash" TEXT NOT NULL,
ALTER COLUMN "userAgent" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DigitalFingerprint_deviceHash_key" ON "DigitalFingerprint"("deviceHash");

-- CreateIndex
CREATE INDEX "DigitalFingerprint_deviceHash_idx" ON "DigitalFingerprint"("deviceHash");
