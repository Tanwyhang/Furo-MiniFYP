-- Set all APIs to be owned by a single provider for testing
-- Run with: pnpm prisma db execute --schema prisma/schema.prisma --file test/set-single-provider.sql

-- Update all APIs to use the test provider with the known wallet address
UPDATE "Api"
SET "providerId" = (
    SELECT id FROM "Provider"
    WHERE "walletAddress" = '0x28adcf970a21f9fe1da1f5770670a55f76c4e995'
    LIMIT 1
),
"updatedAt" = NOW();