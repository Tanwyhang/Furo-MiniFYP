-- Update Test Providers SQL Script
--
-- This SQL script updates all providers to use the test wallet address
-- for P2P direct payment testing.
--
-- Run with: psql your_database_url < test/update-test-providers.sql

-- Test wallet address for P2P testing
\set TEST_WALLET_ADDRESS '0x28adcf970a21f9fe1da1f5770670a55f76c4e995';

-- Display current state before update
SELECT
    COUNT(*) as total_providers,
    COUNT(DISTINCT "walletAddress") as unique_wallets
FROM "Provider";

-- Update all providers to use test wallet address
UPDATE "Provider"
SET
    "walletAddress" = :'TEST_WALLET_ADDRESS',
    "updatedAt" = NOW()
WHERE "walletAddress" != :'TEST_WALLET_ADDRESS';

-- Create test provider if it doesn't exist
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
    'provider_test_p2p_' || EXTRACT(EPOCH FROM NOW()) * 1000 + RANDOM() * 999,
    :'TEST_WALLET_ADDRESS',
    'Test Provider P2P',
    true,
    4.5,
    '0',
    0,
    NOW(),
    NOW()
) ON CONFLICT ("walletAddress") DO NOTHING;

-- Update all APIs to use the test provider
UPDATE "Api"
SET
    "providerId" = (
        SELECT "id"
        FROM "Provider"
        WHERE "walletAddress" = :'TEST_WALLET_ADDRESS'
        LIMIT 1
    ),
    "updatedAt" = NOW()
WHERE "providerId" NOT IN (
    SELECT "id"
    FROM "Provider"
    WHERE "walletAddress" = :'TEST_WALLET_ADDRESS'
);

-- Create test API if none exist
INSERT INTO "Api" (
    "id",
    "providerId",
    "name",
    "description",
    "category",
    "endpoint",
    "publicPath",
    "method",
    "pricePerCall",
    "currency",
    "isActive",
    "totalCalls",
    "totalRevenue",
    "averageResponseTime",
    "uptime",
    "documentation",
    "createdAt",
    "updatedAt"
) SELECT
    'api_test_p2p_' || EXTRACT(EPOCH FROM NOW()) * 1000 + RANDOM() * 999,
    p."id",
    'Test P2P API',
    'Test API for P2P direct payment testing. This API demonstrates zero-fee direct payments from developers to providers.',
    'Testing',
    'https://api.example.com/test',
    '/test-p2p-api',
    'GET',
    '10000000000000', -- 0.00001 ETH
    'ETH',
    true,
    0,
    '0',
    100,
    99.9,
    '{
        "description": "Test API for P2P direct payments",
        "pricing": "0.00001 ETH per call",
        "example": {
            "method": "GET",
            "url": "/test-p2p-api",
            "response": {
                "message": "Hello from P2P Test API!",
                "timestamp": "2024-01-01T00:00:00Z",
                "provider": "Test Provider P2P"
            }
        }
    }'::jsonb,
    NOW(),
    NOW()
FROM "Provider" p
WHERE p."walletAddress" = :'TEST_WALLET_ADDRESS'
AND NOT EXISTS (
    SELECT 1 FROM "Api" a
    WHERE a."providerId" = p."id"
    LIMIT 1
);

-- Display final state after update
SELECT
    COUNT(*) as total_providers_with_test_wallet,
    "walletAddress" as test_wallet_address
FROM "Provider"
WHERE "walletAddress" = :'TEST_WALLET_ADDRESS';

-- Display APIs linked to test provider
SELECT
    COUNT(*) as total_apis,
    "name" as api_name,
    "publicPath",
    "pricePerCall",
    "isActive"
FROM "Api"
WHERE "providerId" IN (
    SELECT "id" FROM "Provider" WHERE "walletAddress" = :'TEST_WALLET_ADDRESS'
)
GROUP BY "name", "publicPath", "pricePerCall", "isActive"
ORDER BY "name";

-- Display summary
\echo '=== P2P Testing Setup Complete ===';
\echo 'Test Wallet Address: ' || :'TEST_WALLET_ADDRESS';
\echo 'Make sure this wallet has test ETH for testing!';