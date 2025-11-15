# Entity Relationship Diagram (ERD) Documentation

## Overview

This document describes the entity relationships within the Furo API marketplace database schema. The ERD illustrates how data flows through the system, from provider registration to API consumption and payment processing.

## Visual ERD Representation

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Provider     │──────▶│       Api       │──────▶│     Payment     │
│                 │       │                 │       │                 │
│ • walletAddress │       │ • providerId    │       │ • providerId    │
│ • name          │       │ • publicPath    │       │ • developerAddr │
│ • reputation    │       │ • endpoint      │       │ • txHash        │
│ • totalEarnings │       │ • pricePerCall  │       │ • amount        │
│ • isActive      │       │ • category      │       │ • numberOfTokens│
└─────────────────┘       │ • isActive      │       │ • isVerified    │
         │                └─────────────────┘       └─────────────────┘
         │                         │                         │
         │                         │                         │
         │                         ▼                         │
         │                ┌─────────────────┐                │
         │                │      Token      │                │
         │                │                 │                │
         │                │ • paymentId     │◀───────────────┘
         │                │ • apiId         │
         │                │ • providerId    │
         │                │ • tokenHash     │
         │                │ • isUsed        │
         │                │ • expiresAt     │
         │                └─────────────────┘
         │                         │
         │                         ▼
         │                ┌─────────────────┐
         │                │   UsageLog      │
         │                │                 │
         │                │ • tokenId       │
         │                │ • responseTime  │
         │                │ • success       │
         │                │ • ipAddress     │
         │                └─────────────────┘
         │
         │
    ┌────▼────┐    ┌─────────────┐    ┌─────────────┐
    │Favorite │    │   Review    │    │Configuration│
    │         │    │             │    │             │
    │• userId │    │ • apiId     │    │ • key       │
    │• apiId  │    │ • rating    │    │ • value     │
    │• createdAt   │ │ • comment   │    │ • isActive │
    └─────────┘    └─────────────┘    └─────────────┘
```

## Relationship Details

### 1. Provider to Api (One-to-Many)

**Relationship**: One Provider can have multiple APIs
**Cardinality**: 1 Provider → * APIs
**Foreign Key**: `Api.providerId` references `Provider.id`

```sql
Provider (1) ──────→ (N) Api
```

**Business Logic**:
- Each API endpoint belongs to exactly one provider
- Providers can list multiple APIs with different pricing
- When a provider is deactivated, all their APIs become inactive

### 2. Api to Payment (One-to-Many)

**Relationship**: One API can have multiple payments
**Cardinality**: 1 Api → * Payments
**Foreign Key**: `Payment.apiId` references `Api.id`

```sql
Api (1) ──────→ (N) Payment
```

**Business Logic**:
- Each payment is for a specific API endpoint
- Multiple developers can pay for the same API
- Payment amount determines number of tokens issued

### 3. Payment to Token (One-to-Many)

**Relationship**: One payment generates multiple tokens
**Cardinality**: 1 Payment → * Tokens
**Foreign Key**: `Token.paymentId` references `Payment.id`

```sql
Payment (1) ──────→ (N) Token
```

**Business Logic**:
- Single payment can purchase multiple API calls
- Each token represents one API call
- Token count equals `Payment.numberOfTokens`

### 4. Token to UsageLog (One-to-One)

**Relationship**: Each token is used exactly once
**Cardinality**: 1 Token → 1 UsageLog
**Foreign Key**: `UsageLog.tokenId` references `Token.id`

```sql
Token (1) ──────→ (1) UsageLog
```

**Business Logic**:
- Single-use tokens prevent replay attacks
- UsageLog provides audit trail for each API call
- Token marked as used when UsageLog is created

### 5. Api to Favorite (One-to-Many)

**Relationship**: One API can be favorited by many users
**Cardinality**: 1 Api → * Favorites
**Foreign Key**: `Favorite.apiId` references `Api.id`

```sql
Api (1) ──────→ (N) Favorite
```

**Business Logic**:
- Users can favorite multiple APIs
- Unique constraint prevents duplicate favorites
- Supports user preference tracking

### 6. Api to Review (One-to-Many)

**Relationship**: One API can have multiple reviews
**Cardinality**: 1 Api → * Reviews
**Foreign Key**: `Review.apiId` references `Api.id`

```sql
Api (1) ──────→ (N) Review
```

**Business Logic**:
- Each user can review an API only once
- Reviews contribute to provider reputation
- Verified reviews require actual API usage

### 7. Provider to Favorite (One-to-Many)

**Relationship**: One provider can have APIs favorited by many users
**Cardinality**: 1 Provider → * Favorites
**Foreign Key**: `Favorite.providerId` references `Provider.id`

```sql
Provider (1) ──────→ (N) Favorite
```

**Business Logic**:
- Tracks which providers' APIs users prefer
- Supports recommendation algorithms
- Provider analytics include favorite counts

## Data Flow Scenarios

### Scenario 1: New API Provider Onboarding

```
1. Create Provider Record
   Provider {
     walletAddress: "0x123...",
     name: "Weather Co",
     reputationScore: 0.0
   }

2. Create API Records
   Api {
     providerId: "provider_123",
     publicPath: "/weather",
     endpoint: "https://api.weatherco.com/v1",
     pricePerCall: "100000000000000000"
   }

3. Provider becomes discoverable in marketplace
```

### Scenario 2: Developer Purchase Flow

```
1. Developer discovers API
   GET /marketplace/apis/weather

2. Developer initiates payment
   Payment {
     providerId: "provider_123",
     apiId: "api_456",
     developerAddress: "0x789...",
     transactionHash: "0xabc...",
     amount: "500000000000000000", // 0.5 ETH
     numberOfTokens: 5
   }

3. Payment verified on-chain
   Payment.isVerified = true

4. Tokens generated
   Token (5 records) {
     paymentId: "payment_xyz",
     apiId: "api_456",
     tokenHash: "token_1",
     expiresAt: "2024-12-31T23:59:59Z"
   }
```

### Scenario 3: API Consumption

```
1. Developer makes API call
   GET /weather
   Authorization: Bearer token_1

2. Token validation
   Token {
     tokenHash: "token_1",
     isUsed: false,
     expiresAt > now()
   }

3. Request relayed to provider
   → https://api.weatherco.com/v1?city=NYC

4. Response received and logged
   UsageLog {
     tokenId: "token_1",
     responseStatus: 200,
     responseTime: 150,
     success: true
   }

5. Token marked as used
   Token.isUsed = true
```

### Scenario 4: User Engagement

```
1. Developer favorites API
   Favorite {
     userId: "0x789...",
     apiId: "api_456",
     providerId: "provider_123"
   }

2. Developer leaves review
   Review {
     apiId: "api_456",
     reviewerAddress: "0x789...",
     rating: 5,
     isVerified: true,
     comment: "Excellent weather API!"
   }

3. Provider reputation updated
   Provider.reputationScore = 4.8
```

## Integrity Constraints

### Primary Keys
- All tables use `@id @default(cuid())` for unique identification
- Ensures globally unique identifiers across the system

### Unique Constraints
- `Provider.walletAddress` - Prevents duplicate provider accounts
- `Api.publicPath` - Ensures unique marketplace URLs
- `Payment.transactionHash` - Prevents duplicate blockchain transactions
- `Token.tokenHash` - Ensures unique access tokens
- `Favorite[userId, apiId]` - Prevents duplicate favorites
- `Review[apiId, reviewerAddress]` - One review per user per API

### Foreign Key Constraints
- All relationships maintain referential integrity
- `onDelete: Cascade` ensures clean data removal
- Prevents orphaned records across related tables

### Check Constraints
- `Provider.reputationScore` - Valid rating range (0-5)
- `Review.rating` - Valid star rating (1-5)
- `Token.expiresAt` - Future expiration dates
- `Api.uptime` - Valid percentage range (0-100)

## Performance Considerations

### Query Optimization
1. **Token Lookup**: Index on `Token.tokenHash` for O(1) validation
2. **Provider Analytics**: Composite indexes on earnings and usage
3. **API Discovery**: Category and price range indexes
4. **Payment Verification**: Transaction hash indexing

### Join Performance
- Foreign key relationships indexed by default
- Strategic composite indexes for common query patterns
- Partitioning strategy for large tables (UsageLog, Payment)

### Caching Strategy
- **API Metadata**: Cache for marketplace display
- **Provider Stats**: Pre-calculated reputation scores
- **Active Tokens**: In-memory cache for rapid validation

## Security Model

### Access Control
- **Row-Level Security**: Providers can only access their own data
- **Token-Based Access**: API access controlled by valid tokens
- **Wallet Authentication**: All operations tied to wallet addresses

### Audit Trail
- **Complete Logging**: Every operation creates audit records
- **Immutable Records**: Payment and UsageLog cannot be modified
- **Timestamp Tracking**: Full temporal audit capabilities

### Data Protection
- **Endpoint Security**: Provider URLs hidden from public
- **Rate Limiting**: IP-based request throttling
- **Replay Prevention**: Token expiration and one-time use

## Summary

The ERD provides a comprehensive foundation for the Furo API marketplace, ensuring:

- **Data Integrity**: Proper constraints and relationships
- **Performance**: Optimized for high-throughput operations
- **Security**: Robust access control and audit capabilities
- **Scalability**: Designed for horizontal scaling
- **Flexibility**: Supports evolving business requirements

The relationship structure directly supports the x402 protocol flow while maintaining complete audit trails and enabling rich marketplace features.