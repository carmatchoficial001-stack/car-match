-- AlterTable
ALTER TABLE "SearchMetric" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "maxPrice" DOUBLE PRECISION,
ADD COLUMN     "maxYear" INTEGER,
ADD COLUMN     "minPrice" DOUBLE PRECISION,
ADD COLUMN     "minYear" INTEGER,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "vehicleType" TEXT;

-- CreateIndex
CREATE INDEX "SearchMetric_brand_idx" ON "SearchMetric"("brand");

-- CreateIndex
CREATE INDEX "SearchMetric_category_idx" ON "SearchMetric"("category");
