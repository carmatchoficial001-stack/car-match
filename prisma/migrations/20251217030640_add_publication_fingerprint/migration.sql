-- CreateTable
CREATE TABLE "PublicationFingerprint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicationType" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "deviceHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationFingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublicationFingerprint_userId_idx" ON "PublicationFingerprint"("userId");

-- CreateIndex
CREATE INDEX "PublicationFingerprint_publicationType_idx" ON "PublicationFingerprint"("publicationType");

-- CreateIndex
CREATE INDEX "PublicationFingerprint_latitude_longitude_idx" ON "PublicationFingerprint"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "PublicationFingerprint_deviceHash_idx" ON "PublicationFingerprint"("deviceHash");

-- CreateIndex
CREATE INDEX "PublicationFingerprint_ipAddress_idx" ON "PublicationFingerprint"("ipAddress");

-- CreateIndex
CREATE INDEX "PublicationFingerprint_publicationId_idx" ON "PublicationFingerprint"("publicationId");

-- AddForeignKey
ALTER TABLE "PublicationFingerprint" ADD CONSTRAINT "PublicationFingerprint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
