-- CreateTable
CREATE TABLE "SearchMetric" (
    "id" TEXT NOT NULL,
    "query" TEXT,
    "category" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityLog" (
    "id" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchMetric_latitude_longitude_idx" ON "SearchMetric"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "SearchMetric_createdAt_idx" ON "SearchMetric"("createdAt");

-- CreateIndex
CREATE INDEX "OpportunityLog_latitude_longitude_idx" ON "OpportunityLog"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "OpportunityLog_createdAt_idx" ON "OpportunityLog"("createdAt");
