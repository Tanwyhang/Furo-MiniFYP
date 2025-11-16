-- Update all provider addresses to use test wallet
-- Run with: pnpm prisma db execute --schema prisma/schema.prisma --file test/update-providers-simple.sql

-- Get the test provider ID first
WITH test_provider AS (
    SELECT id FROM "Provider"
    WHERE "walletAddress" = '0x28adcf970a21f9fe1da1f5770670a55f76c4e995'
    LIMIT 1
)
-- Update all APIs to use the test provider
UPDATE "Api"
SET "providerId" = (SELECT id FROM test_provider),
    "updatedAt" = NOW()
WHERE "providerId" != (SELECT id FROM test_provider);

-- Update all remaining providers to use test wallet address
UPDATE "Provider"
SET "walletAddress" = '0x28adcf970a21f9fe1da1f5770670a55f76c4e995',
    "updatedAt" = NOW()
WHERE "walletAddress" != '0x28adcf970a21f9fe1da1f5770670a55f76c4e995';

-- Set name for providers that don't have one
UPDATE "Provider"
SET name = 'Test Provider P2P',
    "updatedAt" = NOW()
WHERE "walletAddress" = '0x28adcf970a21f9fe1da1f5770670a55f76c4e995'
AND (name IS NULL OR name = '');