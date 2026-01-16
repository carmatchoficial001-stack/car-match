-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "missedResponseCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "notifiedMilestones" TEXT[];

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "fakeFavorites" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "BusinessAnalytics" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "realViews" INTEGER NOT NULL DEFAULT 0,
    "realClicks" INTEGER NOT NULL DEFAULT 0,
    "realSearches" INTEGER NOT NULL DEFAULT 0,
    "fakeViews" INTEGER NOT NULL DEFAULT 0,
    "fakeSearches" INTEGER NOT NULL DEFAULT 0,
    "lastFakeNotification" TIMESTAMP(3),
    "monthlyFakeCount" INTEGER NOT NULL DEFAULT 0,
    "currentMonth" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessNotificationLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SOSAlert" (
    "id" TEXT NOT NULL,
    "victimId" TEXT NOT NULL,
    "counterpartId" TEXT,
    "chatId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "victimLat" DOUBLE PRECISION,
    "victimLng" DOUBLE PRECISION,
    "counterpartLat" DOUBLE PRECISION,
    "counterpartLng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SOSAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessAnalytics_businessId_key" ON "BusinessAnalytics"("businessId");

-- CreateIndex
CREATE INDEX "BusinessAnalytics_businessId_idx" ON "BusinessAnalytics"("businessId");

-- CreateIndex
CREATE INDEX "BusinessNotificationLog_businessId_createdAt_idx" ON "BusinessNotificationLog"("businessId", "createdAt");

-- AddForeignKey
ALTER TABLE "BusinessAnalytics" ADD CONSTRAINT "BusinessAnalytics_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessNotificationLog" ADD CONSTRAINT "BusinessNotificationLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOSAlert" ADD CONSTRAINT "SOSAlert_victimId_fkey" FOREIGN KEY ("victimId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOSAlert" ADD CONSTRAINT "SOSAlert_counterpartId_fkey" FOREIGN KEY ("counterpartId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
