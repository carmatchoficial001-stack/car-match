const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
console.log(`Reescribiendo: ${schemaPath}`);

const cleanContent = `generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [postgis]
}

model User {
  id                String              @id @default(cuid())
  email             String              @unique
  emailVerified     DateTime?
  name              String
  image             String?
  password          String?
  phone             String?
  city              String?
  credits           Int                 @default(1)
  isActive          Boolean             @default(true)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  accounts          Account[]
  sessions          Session[]
  
  vehicles          Vehicle[]
  businesses        Business[]
  favorites         Favorite[]
  businessFavorites BusinessFavorite[]
  dislikes          Dislike[]
  fingerprint       DigitalFingerprint?
  payments          Payment[]
  buyerChats        Chat[]              @relation("BuyerChats")
  sellerChats       Chat[]              @relation("SellerChats")
  sentMessages      Message[]
  notifications     Notification[]
  pushSubscriptions PushSubscription[]
  paymentMethods    PaymentMethod[]

  @@index([email])
  @@index([city])
}

model Account {
  id                String   @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?  @db.Text
  access_token      String?  @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?  @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Vehicle {
  id              String   @id @default(cuid())
  userId          String
  title           String
  description     String   @db.Text
  brand           String
  model           String
  year            Int
  price           Decimal  @db.Decimal(10, 2)
  city            String
  images          String[]
  status          VehicleStatus @default(ACTIVE)
  moderationStatus ModerationStatus @default(PENDING_AI)
  isFreePublication Boolean @default(true)
  publishedAt     DateTime @default(now())
  expiresAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  mileage         Int?
  transmission    String?
  fuel            String?
  engine          String?
  doors           Int?
  color           String?
  vehicleType     String?
  condition       String?
  accidents       Boolean?
  owners          Int?
  features        String[]
  searchIndex     String?  @db.Text
  
  displacement    Int?
  cargoCapacity   Float?
  operatingHours  Int?
  
  hasInvoice      Boolean?
  hasTenencia     Boolean?
  hasVerification Boolean?
  
  latitude        Float?
  longitude       Float?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  favorites Favorite[]
  dislikes  Dislike[]
  chats     Chat[]

  @@index([userId])
  @@index([city])
  @@index([status])
  @@index([vehicleType])
  @@index([brand])
  @@index([year])
  @@index([price])
  @@index([latitude, longitude])
}

enum VehicleStatus {
  ACTIVE
  INACTIVE
  SOLD
}

model Business {
  id           String        @id @default(cuid())
  userId       String
  name         String
  category     String
  description  String?       @db.Text
  phone        String?
  hours        String?
  address      String
  latitude     Float
  longitude    Float
  images       String[]
  isActive     Boolean       @default(true)
  isFreePublication Boolean   @default(true)
  publishedAt  DateTime      @default(now())
  expiresAt    DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  views             BusinessView[]
  favorites         BusinessFavorite[]

  @@index([userId])
  @@index([category])
  @@index([latitude, longitude])
  @@index([isActive])
  @@index([expiresAt])
}

enum BusinessType {
  TALLER
  CONCESIONARIO
  CARWASH
  DESPONCHADORA
  FINANCIAMIENTO
  REFACCIONES
  PINTURA
  MECANICA
  ELECTRICO
  OTRO
}

model Favorite {
  id        String   @id @default(cuid())
  userId    String
  vehicleId String
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  vehicle Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)

  @@unique([userId, vehicleId])
  @@index([userId])
}

model Dislike {
  id        String   @id @default(cuid())
  userId    String
  vehicleId String
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  vehicle Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)

  @@unique([userId, vehicleId])
  @@index([userId])
}

model BusinessView {
  id         String   @id @default(cuid())
  userId     String?
  businessId String
  createdAt  DateTime @default(now())

  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@index([businessId])
  @@index([userId])
  @@index([createdAt])
}

model BusinessFavorite {
  id         String   @id @default(cuid())
  userId     String
  businessId String
  createdAt  DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@unique([userId, businessId])
  @@index([userId])
  @@index([businessId])
}

model DigitalFingerprint {
  id          String   @id @default(cuid())
  userId      String   @unique
  ipAddress   String
  userAgent   String
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([ipAddress])
}

model Payment {
  id            String        @id @default(cuid())
  userId        String
  amount        Decimal       @db.Decimal(10, 2)
  currency      String        @default("MXN")
  status        PaymentStatus @default(PENDING)
  paymentMethod String?
  transactionId String?       @unique
  creditsAdded  Int
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum ModerationStatus {
  PENDING_AI
  APPROVED
  REJECTED
  MANUAL_REVIEW
}

model CreditPackage {
  id              String   @id @default(cuid())
  name            String
  credits         Int
  price           Decimal  @db.Decimal(10, 2)
  discountPercent Int      @default(0)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
}

model Chat {
  id         String    @id @default(cuid())
  vehicleId  String
  buyerId    String
  sellerId   String
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  
  vehicle    Vehicle   @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  buyer      User      @relation("BuyerChats", fields: [buyerId], references: [id], onDelete: Cascade)
  seller     User      @relation("SellerChats", fields: [sellerId], references: [id], onDelete: Cascade)
  messages   Message[]
  appointments Appointment[]

  @@unique([vehicleId, buyerId])
  @@index([buyerId])
  @@index([sellerId])
  @@index([vehicleId])
}

model Message {
  id        String   @id @default(cuid())
  chatId    String
  senderId  String
  content   String   @db.Text
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  
  chat      Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  sender    User     @relation(fields: [senderId], references: [id], onDelete: Cascade)

  @@index([chatId])
  @@index([senderId])
  @@index([createdAt])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  title     String
  message   String   @db.Text
  link      String?
  isRead    Boolean  @default(false)
  metadata  Json?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @db.Text
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

model SimulatedMetric {
  id          String   @id @default(cuid())
  targetId    String
  targetType  String
  month       String
  count       Int      @default(0)
  target      Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([targetId, month])
  @@index([targetType])
}

model Appointment {
  id          String   @id @default(cuid())
  chatId      String
  proposerId  String
  date        DateTime
  location    String
  address     String?
  latitude    Float?
  longitude   Float?
  status      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  chat Chat @relation(fields: [chatId], references: [id], onDelete: Cascade)
  
  @@index([chatId])
  @@index([status])
  @@index([date])
}

model PaymentMethod {
  id        String   @id @default(cuid())
  userId    String
  type      String
  last4     String
  brand     String?
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}
`;

fs.writeFileSync(schemaPath, cleanContent, { encoding: 'utf8' });
console.log('Schema escrito sin BOM');
