-- AlterTable
ALTER TABLE "SearchMetric" ADD COLUMN     "color" TEXT,
ADD COLUMN     "fuel" TEXT,
ADD COLUMN     "transmission" TEXT;

-- CreateIndex
CREATE INDEX "SearchMetric_vehicleType_idx" ON "SearchMetric"("vehicleType");

-- CreateIndex
CREATE INDEX "SearchMetric_model_idx" ON "SearchMetric"("model");

-- CreateIndex
CREATE INDEX "Vehicle_model_idx" ON "Vehicle"("model");
