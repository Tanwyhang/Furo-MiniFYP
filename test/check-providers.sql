-- Check current provider state
-- Run with: pnpm prisma db execute --schema prisma/schema.prisma --file test/check-providers.sql

-- Show all current providers
SELECT
    id,
    name,
    "walletAddress",
    "isActive",
    "reputationScore",
    "totalCalls",
    "totalEarnings"
FROM "Provider"
ORDER BY "createdAt" DESC;

-- Show all APIs and their providers
SELECT
    a.name as api_name,
    a."publicPath",
    a."pricePerCall",
    p.name as provider_name,
    p."walletAddress"
FROM "Api" a
LEFT JOIN "Provider" p ON a."providerId" = p.id
ORDER BY a."createdAt" DESC;