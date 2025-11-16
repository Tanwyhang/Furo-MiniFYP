-- Create test provider and set all APIs to use it
-- Run with: pnpm prisma db execute --schema prisma/schema.prisma --file test/create-and-set-provider.sql

-- Create the test provider
INSERT INTO "Provider" (
    "id",
    "walletAddress",
    "name",
    "isActive",
    "reputationScore",
    "totalEarnings",
    "totalCalls",
    "createdAt",
    "updatedAt"
) VALUES (
    'provider_test_p2p_main',
    '0x28adcf970a21f9fe1da1f5770670a55f76c4e995',
    'Test Provider P2P',
    true,
    4.5,
    '0',
    0,
    NOW(),
    NOW()
)
ON CONFLICT ("walletAddress") DO NOTHING;

-- Now update all APIs to use this provider
UPDATE "Api"
SET "providerId" = 'provider_test_p2p_main',
    "updatedAt" = NOW();