-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SOLD');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('TALLER', 'CONCESIONARIO', 'CARWASH', 'DESPONCHADORA', 'FINANCIAMIENTO', 'REFACCIONES', 'PINTURA', 'MECANICA', 'ELECTRICO', 'OTRO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING_AI', 'APPROVED', 'REJECTED', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('VEHICLE_FAVORITED', 'VEHICLE_VIEWED', 'BUSINESS_VIEWED', 'BUSINESS_SEARCHED', 'PROFILE_VIEWED', 'MESSAGE_RECEIVED', 'APPOINTMENT_SCHEDULED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "image" TEXT,
    "password" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLatitude" DOUBLE PRECISION,
    "lastLongitude" DOUBLE PRECISION,
    "lastLocationUpdate" TIMESTAMP(3),
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "city" TEXT NOT NULL,
    "colony" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'MX',
    "images" TEXT[],
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING_AI',
    "isFreePublication" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mileage" INTEGER,
    "transmission" TEXT,
    "fuel" TEXT,
    "engine" TEXT,
    "doors" INTEGER,
    "color" TEXT,
    "vehicleType" TEXT,
    "condition" TEXT,
    "accidents" BOOLEAN,
    "owners" INTEGER,
    "features" TEXT[],
    "searchIndex" TEXT,
    "displacement" INTEGER,
    "cargoCapacity" DOUBLE PRECISION,
    "operatingHours" INTEGER,
    "hasInvoice" BOOLEAN,
    "hasTenencia" BOOLEAN,
    "hasVerification" BOOLEAN,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "phone" TEXT,
    "additionalPhones" TEXT[],
    "whatsapp" TEXT,
    "telegram" TEXT,
    "website" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "hours" TEXT,
    "address" TEXT NOT NULL,
    "street" TEXT,
    "streetNumber" TEXT,
    "colony" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT DEFAULT 'MX',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "images" TEXT[],
    "services" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFreePublication" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dislike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dislike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessView" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalFingerprint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigitalFingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "creditsAdded" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isFake" BOOLEAN NOT NULL DEFAULT false,
    "vehicleId" TEXT,
    "businessId" TEXT,
    "fromUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulatedMetric" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulatedMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "proposerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "brand" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "relatedId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FakeNotificationCounter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "targetCount" INTEGER NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "lastGenerated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FakeNotificationCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "confidence" DOUBLE PRECISION,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "yearIntroduced" INTEGER,
    "yearDiscontinued" INTEGER,
    "isElectric" BOOLEAN NOT NULL DEFAULT false,
    "isHybrid" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "confidence" DOUBLE PRECISION,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoUpdateLog" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "brandsAdded" INTEGER NOT NULL DEFAULT 0,
    "modelsAdded" INTEGER NOT NULL DEFAULT 0,
    "typesAdded" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "executionTime" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoUpdateLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_city_idx" ON "User"("city");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Vehicle_userId_idx" ON "Vehicle"("userId");

-- CreateIndex
CREATE INDEX "Vehicle_city_idx" ON "Vehicle"("city");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE INDEX "Vehicle_vehicleType_idx" ON "Vehicle"("vehicleType");

-- CreateIndex
CREATE INDEX "Vehicle_brand_idx" ON "Vehicle"("brand");

-- CreateIndex
CREATE INDEX "Vehicle_year_idx" ON "Vehicle"("year");

-- CreateIndex
CREATE INDEX "Vehicle_price_idx" ON "Vehicle"("price");

-- CreateIndex
CREATE INDEX "Vehicle_latitude_longitude_idx" ON "Vehicle"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Vehicle_status_createdAt_idx" ON "Vehicle"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Vehicle_status_price_idx" ON "Vehicle"("status", "price");

-- CreateIndex
CREATE INDEX "Vehicle_status_year_idx" ON "Vehicle"("status", "year");

-- CreateIndex
CREATE INDEX "Vehicle_status_brand_idx" ON "Vehicle"("status", "brand");

-- CreateIndex
CREATE INDEX "Vehicle_status_vehicleType_idx" ON "Vehicle"("status", "vehicleType");

-- CreateIndex
CREATE INDEX "Business_userId_idx" ON "Business"("userId");

-- CreateIndex
CREATE INDEX "Business_category_idx" ON "Business"("category");

-- CreateIndex
CREATE INDEX "Business_city_idx" ON "Business"("city");

-- CreateIndex
CREATE INDEX "Business_latitude_longitude_idx" ON "Business"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Business_isActive_idx" ON "Business"("isActive");

-- CreateIndex
CREATE INDEX "Business_expiresAt_idx" ON "Business"("expiresAt");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_vehicleId_key" ON "Favorite"("userId", "vehicleId");

-- CreateIndex
CREATE INDEX "Dislike_userId_idx" ON "Dislike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Dislike_userId_vehicleId_key" ON "Dislike"("userId", "vehicleId");

-- CreateIndex
CREATE INDEX "BusinessView_businessId_idx" ON "BusinessView"("businessId");

-- CreateIndex
CREATE INDEX "BusinessView_userId_idx" ON "BusinessView"("userId");

-- CreateIndex
CREATE INDEX "BusinessView_createdAt_idx" ON "BusinessView"("createdAt");

-- CreateIndex
CREATE INDEX "BusinessFavorite_userId_idx" ON "BusinessFavorite"("userId");

-- CreateIndex
CREATE INDEX "BusinessFavorite_businessId_idx" ON "BusinessFavorite"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessFavorite_userId_businessId_key" ON "BusinessFavorite"("userId", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalFingerprint_userId_key" ON "DigitalFingerprint"("userId");

-- CreateIndex
CREATE INDEX "DigitalFingerprint_userId_idx" ON "DigitalFingerprint"("userId");

-- CreateIndex
CREATE INDEX "DigitalFingerprint_ipAddress_idx" ON "DigitalFingerprint"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Chat_buyerId_idx" ON "Chat"("buyerId");

-- CreateIndex
CREATE INDEX "Chat_sellerId_idx" ON "Chat"("sellerId");

-- CreateIndex
CREATE INDEX "Chat_vehicleId_idx" ON "Chat"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_vehicleId_buyerId_key" ON "Chat"("vehicleId", "buyerId");

-- CreateIndex
CREATE INDEX "Message_chatId_idx" ON "Message"("chatId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "SimulatedMetric_targetType_idx" ON "SimulatedMetric"("targetType");

-- CreateIndex
CREATE UNIQUE INDEX "SimulatedMetric_targetId_month_key" ON "SimulatedMetric"("targetId", "month");

-- CreateIndex
CREATE INDEX "Appointment_chatId_idx" ON "Appointment"("chatId");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");

-- CreateIndex
CREATE INDEX "PaymentMethod_userId_idx" ON "PaymentMethod"("userId");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");

-- CreateIndex
CREATE INDEX "CreditTransaction_createdAt_idx" ON "CreditTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "FakeNotificationCounter_monthYear_idx" ON "FakeNotificationCounter"("monthYear");

-- CreateIndex
CREATE UNIQUE INDEX "FakeNotificationCounter_userId_monthYear_key" ON "FakeNotificationCounter"("userId", "monthYear");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_entityType_idx" ON "AnalyticsEvent"("entityType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE INDEX "Brand_category_idx" ON "Brand"("category");

-- CreateIndex
CREATE INDEX "Brand_isActive_idx" ON "Brand"("isActive");

-- CreateIndex
CREATE INDEX "Brand_source_idx" ON "Brand"("source");

-- CreateIndex
CREATE INDEX "Model_brandId_idx" ON "Model"("brandId");

-- CreateIndex
CREATE INDEX "Model_isActive_idx" ON "Model"("isActive");

-- CreateIndex
CREATE INDEX "Model_yearIntroduced_idx" ON "Model"("yearIntroduced");

-- CreateIndex
CREATE UNIQUE INDEX "Model_brandId_name_key" ON "Model"("brandId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleType_name_key" ON "VehicleType"("name");

-- CreateIndex
CREATE INDEX "VehicleType_category_idx" ON "VehicleType"("category");

-- CreateIndex
CREATE INDEX "VehicleType_isActive_idx" ON "VehicleType"("isActive");

-- CreateIndex
CREATE INDEX "AutoUpdateLog_status_idx" ON "AutoUpdateLog"("status");

-- CreateIndex
CREATE INDEX "AutoUpdateLog_createdAt_idx" ON "AutoUpdateLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dislike" ADD CONSTRAINT "Dislike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dislike" ADD CONSTRAINT "Dislike_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessView" ADD CONSTRAINT "BusinessView_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessFavorite" ADD CONSTRAINT "BusinessFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessFavorite" ADD CONSTRAINT "BusinessFavorite_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalFingerprint" ADD CONSTRAINT "DigitalFingerprint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FakeNotificationCounter" ADD CONSTRAINT "FakeNotificationCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
