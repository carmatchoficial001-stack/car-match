-- CreateTable
CREATE TABLE "ReportMessage" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportMessage_reportId_idx" ON "ReportMessage"("reportId");

-- CreateIndex
CREATE INDEX "ReportMessage_senderId_idx" ON "ReportMessage"("senderId");

-- AddForeignKey
ALTER TABLE "ReportMessage" ADD CONSTRAINT "ReportMessage_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportMessage" ADD CONSTRAINT "ReportMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
