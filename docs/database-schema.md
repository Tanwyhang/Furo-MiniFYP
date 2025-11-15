# Database Schema Design

## Overview

This document outlines the comprehensive database schema designed for the Furo x402 API marketplace platform. The schema supports the core business logic including API provider management, payment verification, token-based access control, usage tracking, and marketplace features.

## Architecture Principles

- **Security First**: All sensitive operations are auditable and replay-protected
- **Scalability**: Indexed for high-throughput API marketplace operations
- **Transparency**: Full audit trail for payments, usage, and performance
- **Flexibility**: JSON fields support evolving API requirements
- **Performance**: Optimized for common query patterns and real-time operations

## Core Models

### 1. Provider - API Owners

**Purpose**: Represents API providers who monetize their endpoints through Furo.

```sql
model Provider {
  id              String   @id @default(cuid())
  walletAddress   String   @unique     // Primary identifier and payout address
  email           String?  @unique
  name            String?
  description     String?
  website         String?
  avatarUrl       String?
  isActive        Boolean  @default(true)
  reputationScore Float    @default(0) // 0-5 rating
  totalEarnings   String   @default("0") // Wei string for precision
  totalCalls      Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Key Features**:
- `walletAddress` serves as unique identifier and payout destination
- `reputationScore` aggregates user reviews and platform metrics
- `totalEarnings` tracked in wei for cryptocurrency precision
- Soft delete via `isActive` flag preserves historical data

### 2. Api - Available Endpoints

**Purpose**: Individual API endpoints available for purchase through the platform.

```sql
model Api {
  id                  String   @id @default(cuid())
  providerId          String
  name                String
  description         String
  category            String
  endpoint            String   // Hidden provider URL
  publicPath          String   @unique  // Furo public path
  method              String   @default("GET")
  pricePerCall        String   // Price in smallest currency unit
  currency            String   @default("ETH")
  isActive            Boolean  @default(true)
  totalCalls          Int      @default(0)
  totalRevenue        String   @default("0")
  averageResponseTime Int      @default(0) // milliseconds
  uptime              Float    @default(100.0) // percentage
  documentation       Json?    // API docs and schema
  headers             Json?    // Required headers
  queryParams         Json?    // Default parameters
}
```

**Security Architecture**:
- `endpoint` contains actual provider URL (hidden from users)
- `publicPath` is the exposed Furo path (e.g., "/weather")
- All traffic is proxied through Furo to protect provider endpoints

### 3. Payment - On-Chain Transactions

**Purpose**: Records cryptocurrency payments from developers to providers.

```sql
model Payment {
  id               String    @id @default(cuid())
  providerId       String
  developerAddress String    // Payer's wallet address
  transactionHash  String    @unique  // Blockchain proof
  amount           String    // Amount in smallest currency unit
  currency         String
  numberOfTokens   Int       // Number of API calls purchased
  tokensIssued     Int       @default(0)
  blockNumber      BigInt?
  blockTimestamp   DateTime?
  isVerified       Boolean   @default(false)
  isReplay         Boolean   @default(false)  // Replay attack flag
}
```

**Payment Verification**:
- `transactionHash` provides immutable blockchain proof
- `isVerified` indicates successful on-chain confirmation
- `isReplay` flags potential duplicate transaction attempts

### 4. Token - Single-Use Access Keys

**Purpose**: Single-use tokens that grant one API call each.

```sql
model Token {
  id               String    @id @default(cuid())
  paymentId        String
  apiId            String
  providerId       String
  developerAddress String
  tokenHash        String    @unique  // Unique identifier
  isUsed           Boolean   @default(false)
  usedAt           DateTime?
  expiresAt        DateTime
  lastValidAfter   DateTime  // Replay protection
  requestMetadata  Json?     // Store request params
}
```

**Security Features**:
- `tokenHash` unique identifier prevents token duplication
- `expiresAt` ensures tokens have limited lifetime
- `lastValidAfter` prevents replay attacks with time-based validation
- One-to-one relationship with UsageLog ensures single use

### 5. UsageLog - API Call Tracking

**Purpose**: Comprehensive tracking of every API call through the platform.

```sql
model UsageLog {
  id               String   @id @default(cuid())
  tokenId          String   @unique  // One-to-one with Token
  apiId            String
  providerId       String
  developerAddress String
  requestHeaders   Json?
  requestParams    Json?
  requestBody      String?  // For POST/PUT requests
  responseStatus   Int      // HTTP status code
  responseTime     Int      // milliseconds
  responseSize     Int      // bytes
  errorMessage     String?
  success          Boolean  @default(false)
  ipAddress        String?  // Rate limiting & security
  userAgent        String?
}
```

**Analytics & Monitoring**:
- Performance metrics: response time, size, success rate
- Security tracking: IP addresses, user agents
- Error monitoring: detailed error messages and status codes
- Billing support: proof of service delivery

## Supporting Models

### 6. Favorite - User Preferences

**Purpose**: Allows developers to save preferred APIs for quick access.

```sql
model Favorite {
  id         String   @id @default(cuid())
  userId     String   // Developer wallet address
  apiId      String
  providerId String
  createdAt  DateTime @default(now())

  @@unique([userId, apiId])  // Prevent duplicates
}
```

### 7. Review - API Ratings

**Purpose**: Building trust through user ratings and reviews.

```sql
model Review {
  id              String   @id @default(cuid())
  apiId           String
  reviewerAddress String   // Wallet address
  rating          Int      // 1-5 stars
  comment         String?
  isVerified      Boolean  @default(false)  // Verified purchase
  helpfulCount    Int      @default(0)

  @@unique([apiId, reviewerAddress])  // One review per user per API
}
```

### 8. Configuration - System Settings

**Purpose**: Platform-wide configuration management.

```sql
model Configuration {
  id          String   @id @default(cuid())
  key         String   @unique
  value       Json     // Flexible configuration
  description String?
  isActive    Boolean  @default(true)
}
```

## Relationship Diagram

```
Provider (1) ←→ (*) Api
   ↓                    ↓
(*) Payment ←→ (*) Token ←→ (1) UsageLog
   ↓                    ↓
   ↓                (*) Favorite
   ↓                    ↓
   └─────── (*) Review ←─┘
```

**Key Relationships**:
- **Provider → Api**: One-to-many (provider owns multiple APIs)
- **Payment → Token**: One-to-many (payment generates multiple tokens)
- **Token → UsageLog**: One-to-one (each token used once creates one log)
- **Api → Favorite**: One-to-many (API can favorited by many users)
- **Api → Review**: One-to-many (API can have multiple reviews)

## x402 Protocol Implementation

The schema directly supports the x402 payment protocol flow:

### 1. Initial API Request
```
Client → Furo: GET /weather
Furo → Client: 402 Payment Required
{
  "provider": "0x1234...",
  "amount": "1000000000000000000", // 1 ETH in wei
  "currency": "ETH",
  "tokens": 1
}
```

### 2. Payment Processing
```
Client → Blockchain: Send 1 ETH to provider
Client → Furo: Retry with X-Payment: txHash
Furo: Verify transaction on-chain
Furo: Create Payment record (isVerified = true)
Furo: Generate Token records based on payment
```

### 3. API Access
```
Client → Furo: GET /weather with Authorization: Bearer <tokenHash>
Furo: Validate token (unused, not expired)
Furo: Forward request to provider endpoint
Furo: Log usage in UsageLog
Furo: Mark token as used
Furo → Client: API response
```

## Security Considerations

### 1. Replay Attack Prevention
- **Tokens**: `lastValidAfter` timestamp prevents reuse
- **Payments**: `isReplay` flag and unique `transactionHash`
- **Usage**: One-to-one Token-UsageLog relationship

### 2. Data Protection
- **Endpoints**: Provider URLs hidden from public
- **Authentication**: Wallet-based identity system
- **Audit Trail**: Complete log of all operations

### 3. Rate Limiting & Abuse Prevention
- **IP Tracking**: UsageLog records IP addresses
- **Token Expiration**: Time-limited access tokens
- **Verification**: On-chain payment verification required

## Performance Optimization

### 1. Database Indexes
Strategic indexes on frequently queried fields:
- Provider: `walletAddress`, `isActive`, `reputationScore`
- API: `providerId`, `category`, `isActive`, `publicPath`
- Payment: `providerId`, `developerAddress`, `transactionHash`
- Token: `paymentId`, `apiId`, `tokenHash`, `isUsed`, `expiresAt`

### 2. Query Patterns
- **Fast Token Lookup**: Index on `tokenHash` for real-time validation
- **Provider Analytics**: Optimized for earnings and usage queries
- **API Discovery**: Category and search performance
- **Payment Verification**: Transaction hash lookups

### 3. Data Types
- **String for Currency**: Wei strings maintain precision
- **JSON Fields**: Flexible metadata storage
- **DateTime**: ISO 8601 timestamps for consistency
- **BigInt**: Block numbers for blockchain references

## Scaling Considerations

### 1. Horizontal Scaling
- **Provider-based Sharding**: Data can be partitioned by provider
- **Time-based Partitioning**: UsageLog can be partitioned by date
- **Read Replicas**: Analytics queries can use read replicas

### 2. Archival Strategy
- **Usage Logs**: Move old logs to cold storage after analysis
- **Payment Records**: Archive verified payments after retention period
- **Token Cleanup**: Remove expired tokens after cleanup window

### 3. Caching Strategy
- **API Metadata**: Cache API details for marketplace display
- **Provider Reputation**: Cache calculated reputation scores
- **Token Validation**: In-memory cache for active tokens

## Migration Strategy

### Phase 1: Core Tables
1. Create Provider, Api, Payment, Token tables
2. Implement basic x402 flow
3. Add indexes for performance

### Phase 2: Analytics & Monitoring
1. Add UsageLog table
2. Implement monitoring and analytics
3. Create performance dashboards

### Phase 3: Marketplace Features
1. Add Favorite, Review tables
2. Implement reputation system
3. Add Configuration management

### Phase 4: Optimization
1. Add partitioning for large tables
2. Implement caching strategies
3. Optimize query performance

## Compliance & Data Governance

### 1. Data Retention
- **Usage Logs**: 90 days default, configurable per regulation
- **Payment Records**: 7 years for financial compliance
- **Personal Data**: GDPR-compliant deletion processes

### 2. Privacy Considerations
- **Wallet Addresses**: Pseudonymous identification
- **IP Addresses**: Stored for security, optional anonymization
- **Request Data**: Minimal collection, user-controlled retention

### 3. Audit Requirements
- **Financial Records**: Immutable payment tracking
- **Access Logs**: Complete audit trail for all operations
- **Change Tracking**: Version history for configuration changes

## Conclusion

This database schema provides a robust foundation for the Furo x402 API marketplace, balancing security, performance, and scalability requirements. The design supports the core business logic while maintaining flexibility for future enhancements and regulatory compliance.

The modular architecture allows for incremental implementation and testing, reducing development risk while enabling rapid iteration on core features.