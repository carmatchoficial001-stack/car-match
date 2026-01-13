-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lifetimeBusinessCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lifetimeVehicleCount" INTEGER NOT NULL DEFAULT 0;
