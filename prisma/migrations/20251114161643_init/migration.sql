-- CreateTable
CREATE TABLE "Api" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "publicPath" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "pricePerCall" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETH',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalCalls" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" TEXT NOT NULL DEFAULT '0',
    "averageResponseTime" INTEGER NOT NULL DEFAULT 0,
    "uptime" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "documentation" JSONB,
    "headers" JSONB,
    "queryParams" JSONB,
    "internalEndpoint" TEXT,
    "internalAuth" JSONB,
    "relayConfiguration" JSONB,
    "isDirectRelay" BOOLEAN NOT NULL DEFAULT false,
    "fallbackEndpoint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Api_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "lastUsed" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "permissions" JSONB,
    "rateLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "developerAddress" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "numberOfTokens" INTEGER NOT NULL,
    "tokensIssued" INTEGER NOT NULL DEFAULT 0,
    "blockNumber" BIGINT,
    "blockTimestamp" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isReplay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "apiId" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "description" TEXT,
    "website" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEarnings" TEXT NOT NULL DEFAULT '0',
    "totalCalls" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "reviewerAddress" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "developerAddress" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastValidAfter" TIMESTAMP(3) NOT NULL,
    "requestMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageLog" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "developerAddress" TEXT NOT NULL,
    "requestHeaders" JSONB,
    "requestParams" JSONB,
    "requestBody" TEXT,
    "responseStatus" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "responseSize" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Api_publicPath_key" ON "Api"("publicPath");

-- CreateIndex
CREATE INDEX "Api_category_idx" ON "Api"("category");

-- CreateIndex
CREATE INDEX "Api_isActive_idx" ON "Api"("isActive");

-- CreateIndex
CREATE INDEX "Api_pricePerCall_idx" ON "Api"("pricePerCall");

-- CreateIndex
CREATE INDEX "Api_providerId_idx" ON "Api"("providerId");

-- CreateIndex
CREATE INDEX "Api_totalCalls_idx" ON "Api"("totalCalls");

-- CreateIndex
CREATE INDEX "Api_isDirectRelay_idx" ON "Api"("isDirectRelay");

-- CreateIndex
CREATE INDEX "Api_publicPath_idx" ON "Api"("publicPath");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_isActive_idx" ON "ApiKey"("isActive");

-- CreateIndex
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_providerId_idx" ON "ApiKey"("providerId");

-- CreateIndex
CREATE INDEX "ApiKey_expiresAt_idx" ON "ApiKey"("expiresAt");

-- CreateIndex
CREATE INDEX "Favorite_apiId_idx" ON "Favorite"("apiId");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_apiId_key" ON "Favorite"("userId", "apiId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionHash_key" ON "Payment"("transactionHash");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_developerAddress_idx" ON "Payment"("developerAddress");

-- CreateIndex
CREATE INDEX "Payment_isVerified_idx" ON "Payment"("isVerified");

-- CreateIndex
CREATE INDEX "Payment_providerId_idx" ON "Payment"("providerId");

-- CreateIndex
CREATE INDEX "Payment_transactionHash_idx" ON "Payment"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_walletAddress_key" ON "Provider"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_email_key" ON "Provider"("email");

-- CreateIndex
CREATE INDEX "Provider_isActive_idx" ON "Provider"("isActive");

-- CreateIndex
CREATE INDEX "Provider_reputationScore_idx" ON "Provider"("reputationScore");

-- CreateIndex
CREATE INDEX "Provider_walletAddress_idx" ON "Provider"("walletAddress");

-- CreateIndex
CREATE INDEX "Review_apiId_idx" ON "Review"("apiId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "Review_reviewerAddress_idx" ON "Review"("reviewerAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Review_apiId_reviewerAddress_key" ON "Review"("apiId", "reviewerAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Token_tokenHash_key" ON "Token"("tokenHash");

-- CreateIndex
CREATE INDEX "Token_apiId_idx" ON "Token"("apiId");

-- CreateIndex
CREATE INDEX "Token_developerAddress_idx" ON "Token"("developerAddress");

-- CreateIndex
CREATE INDEX "Token_expiresAt_idx" ON "Token"("expiresAt");

-- CreateIndex
CREATE INDEX "Token_isUsed_idx" ON "Token"("isUsed");

-- CreateIndex
CREATE INDEX "Token_paymentId_idx" ON "Token"("paymentId");

-- CreateIndex
CREATE INDEX "Token_providerId_idx" ON "Token"("providerId");

-- CreateIndex
CREATE INDEX "Token_tokenHash_idx" ON "Token"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "UsageLog_tokenId_key" ON "UsageLog"("tokenId");

-- CreateIndex
CREATE INDEX "UsageLog_apiId_idx" ON "UsageLog"("apiId");

-- CreateIndex
CREATE INDEX "UsageLog_createdAt_idx" ON "UsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "UsageLog_developerAddress_idx" ON "UsageLog"("developerAddress");

-- CreateIndex
CREATE INDEX "UsageLog_providerId_idx" ON "UsageLog"("providerId");

-- CreateIndex
CREATE INDEX "UsageLog_success_idx" ON "UsageLog"("success");

-- CreateIndex
CREATE INDEX "UsageLog_tokenId_idx" ON "UsageLog"("tokenId");

-- AddForeignKey
ALTER TABLE "Api" ADD CONSTRAINT "Api_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE CASCADE ON UPDATE CASCADE;
