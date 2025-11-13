-- Initialize Furo database schema
-- This file runs when the PostgreSQL container starts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create additional indexes for performance
-- These will be complemented by Prisma's generated indexes

-- Wallet address indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_providers_wallet_address_lower ON providers (LOWER(wallet_address));
CREATE INDEX IF NOT EXISTS idx_payments_developer_address_lower ON payments (LOWER(developer_address));

-- JSON field indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_apis_documentation_gin ON apis USING gin (documentation);
CREATE INDEX IF NOT EXISTS idx_tokens_request_metadata_gin ON tokens USING gin (request_metadata);
CREATE INDEX IF NOT EXISTS idx_usage_logs_request_headers_gin ON usage_logs USING gin (request_headers);

-- Time-based indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_payments_created_at_desc ON payments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at_desc ON usage_logs (created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_apis_provider_active ON apis (provider_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tokens_payment_unused ON tokens (payment_id, is_used) WHERE is_used = false;

-- Add comments for documentation
COMMENT ON DATABASE furo_db IS 'Furo API Gateway and x402 Payment Protocol Database';