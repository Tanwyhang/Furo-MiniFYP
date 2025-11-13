# x402 Protocol Implementation Flow

## Overview

This document details the complete x402 (HTTP 402 Payment Required) protocol implementation for the Furo API marketplace. The x402 protocol enables crypto-micropayments for API access through a standardized payment flow.

## Protocol Specification

### HTTP Status Code 402

The x402 protocol uses HTTP status code 402 "Payment Required" to indicate that an API endpoint requires payment before access can be granted. This differs from traditional 402 (deprecated) and is specifically implemented for cryptocurrency-based API payments.

### Core Components

1. **Payment Challenge**: Initial 402 response with payment metadata
2. **On-Chain Payment**: Cryptocurrency transaction to provider wallet
3. **Verification**: Blockchain transaction confirmation
4. **Token Issuance**: Single-use access tokens based on payment
5. **API Access**: Token-based request forwarding to provider

## Complete Flow Diagram

```
┌─────────────┐    1. API Request      ┌─────────────┐
│  Developer  │ ──────────────────────► │   Furo API  │
│             │                       │   Gateway   │
└─────────────┘                       └─────────────┘
      ▲                                       │ 2. 402 Response
      │                                       │    {
      │                                       │      "requiresPayment": true,
      │                                       │      "provider": "0x1234...",
      │                                       │      "amount": "1000000000000000000",
      │                                       │      "currency": "ETH",
      │                                       │      "tokens": 1
      │                                       │    }
      │                                       ▼
      │                                 ┌─────────────┐
      │                                 │   Furo API  │
      │                                 │   Gateway   │
      │                                 └─────────────┘
      │                                       │ 3. Send Payment
      │                                       │    (Blockchain)
      │                                       ▼
      │                              ┌─────────────────┐
      │                              │   Blockchain    │
      │                              │   Network       │
      │                              └─────────────────┘
      │                                       ▲ 4. Tx Confirmation
      │                                       │
      │                                       │
      │                                 ┌─────────────┐
      │                                 │   Furo API  │
      │                                 │   Gateway   │
      │                                 └─────────────┘
      │                                       │ 5. Token Issuance
      │                                       │    (Database)
      │                                       ▼
      │                              ┌─────────────────┐
      │                              │   Database      │
      │                              │   (Payment/     │
      │                              │    Token)       │
      │                              └─────────────────┘
      │                                       ▲ 6. Token Response
      │                                       │    {
      │                                       │      "token": "abc123...",
      │                                       │      "expiresAt": "2024-12-31T23:59:59Z"
      │                                       │    }
      │                                       │
      └───────────────────────────────────────┘
                                7. API Request with Token
                                   Authorization: Bearer abc123...
```

## Detailed Implementation

### Phase 1: Initial API Request

#### Request
```http
GET /weather HTTP/1.1
Host: api.furo.io
Content-Type: application/json
```

#### Response (402 Payment Required)
```http
HTTP/1.1 402 Payment Required
Content-Type: application/json
X-Payment-Required: true

{
  "requiresPayment": true,
  "paymentDetails": {
    "provider": "0x742d35Cc6634C0532925a3b8D4E7E0E0E8e4e4e4",
    "amount": "1000000000000000000",
    "currency": "ETH",
    "tokens": 1,
    "pricePerToken": "1000000000000000000"
  },
  "apiDetails": {
    "name": "Weather Data API",
    "description": "Real-time weather information",
    "publicPath": "/weather",
    "method": "GET"
  },
  "instructions": {
    "paymentAddress": "0x742d35Cc6634C0532925a3b8D4E7E0E0E8e4e4e4",
    "network": "ethereum",
    "confirmationsRequired": 1
  }
}
```

#### Database State
```
No records created yet - this is a challenge response
```

### Phase 2: Payment Processing

#### Developer Action
```javascript
// Developer sends cryptocurrency payment
const tx = await wallet.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b8D4E7E0E0E8e4e4e4",
  value: ethers.parseEther("1.0"), // 1 ETH
  gasLimit: 21000
});

const receipt = await tx.wait();
console.log("Transaction hash:", receipt.hash);
// Output: "0xabc123def456..."
```

#### Blockchain Transaction
```
Transaction Hash: 0xabc123def456789...
From: 0x9876... (Developer wallet)
To: 0x742d35Cc6634C0532925a3b8D4E7E0E0E8e4e4e4 (Provider wallet)
Value: 1.000000000000000000 ETH
Gas Used: 21,000
Block Number: 18,123,456
Block Timestamp: 2024-11-13T10:30:00Z
```

### Phase 3: Payment Verification & Token Issuance

#### Request with Payment Proof
```http
GET /weather HTTP/1.1
Host: api.furo.io
Content-Type: application/json
X-Payment: 0xabc123def456789abcdef123456789abcdef123456789abcdef123456789abc
X-Payment-Network: ethereum
X-Payment-Currency: ETH
```

#### Server-Side Verification
```typescript
async function verifyPayment(txHash: string, expectedAmount: string, expectedRecipient: string) {
  // 1. Get transaction from blockchain
  const tx = await provider.getTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);

  // 2. Verify transaction details
  const isValid =
    tx.to.toLowerCase() === expectedRecipient.toLowerCase() &&
    tx.value.toString() === expectedAmount &&
    receipt.status === 1; // Success

  if (!isValid) {
    throw new Error('Invalid payment transaction');
  }

  // 3. Check for replay attacks
  const existingPayment = await db.payment.findUnique({
    where: { transactionHash: txHash }
  });

  if (existingPayment) {
    throw new Error('Payment already processed');
  }

  return { tx, receipt };
}
```

#### Database Record Creation
```sql
-- Create Payment Record
INSERT INTO Payment (
  id, providerId, developerAddress, transactionHash,
  amount, currency, numberOfTokens, isVerified,
  blockNumber, blockTimestamp
) VALUES (
  'payment_123',
  'provider_456',
  '0x9876...',
  '0xabc123...',
  '1000000000000000000',
  'ETH',
  1,
  true,
  18123456,
  '2024-11-13T10:30:00Z'
);

-- Create Token Record
INSERT INTO Token (
  id, paymentId, apiId, providerId, developerAddress,
  tokenHash, expiresAt, lastValidAfter
) VALUES (
  'token_789',
  'payment_123',
  'api_weather',
  'provider_456',
  '0x9876...',
  'tkn_weather_abc123def456_20241113',
  '2024-12-13T10:30:00Z',  // 30 days expiry
  '2024-11-13T10:30:00Z'   // Valid immediately
);
```

#### Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "payment": {
    "transactionHash": "0xabc123...",
    "amount": "1.0 ETH",
    "verified": true
  },
  "token": {
    "tokenHash": "tkn_weather_abc123def456_20241113",
    "expiresAt": "2024-12-13T10:30:00Z",
    "apiPath": "/weather"
  },
  "instructions": {
    "usage": "Include token in Authorization header as Bearer token",
    "expiresIn": 2592000
  }
}
```

### Phase 4: API Access with Token

#### Request with Token
```http
GET /weather?city=NewYork&units=metric HTTP/1.1
Host: api.furo.io
Authorization: Bearer tkn_weather_abc123def456_20241113
Content-Type: application/json
```

#### Token Validation
```typescript
async function validateToken(tokenHash: string, apiPath: string) {
  const token = await db.token.findUnique({
    where: { tokenHash },
    include: {
      api: true,
      provider: true
    }
  });

  if (!token) {
    throw new Error('Invalid token');
  }

  if (token.isUsed) {
    throw new Error('Token already used');
  }

  if (new Date() > token.expiresAt) {
    throw new Error('Token expired');
  }

  if (token.api.publicPath !== apiPath) {
    throw new Error('Token not valid for this API');
  }

  return token;
}
```

#### Request Forwarding
```typescript
async function forwardToProvider(token: Token, originalRequest: Request) {
  const startTime = Date.now();

  try {
    // Forward request to actual provider endpoint
    const response = await fetch(token.api.endpoint, {
      method: originalRequest.method,
      headers: {
        ...token.api.headers, // Provider-specific headers
        'User-Agent': originalRequest.headers.get('User-Agent'),
        'Content-Type': originalRequest.headers.get('Content-Type')
      },
      body: originalRequest.body
    });

    const responseTime = Date.now() - startTime;
    const responseData = await response.text();

    // Create usage log
    await db.usageLog.create({
      data: {
        tokenId: token.id,
        apiId: token.apiId,
        providerId: token.providerId,
        developerAddress: token.developerAddress,
        requestHeaders: JSON.stringify(Object.fromEntries(originalRequest.headers)),
        requestParams: originalRequest.url,
        responseStatus: response.status,
        responseTime,
        responseSize: responseData.length,
        success: response.ok,
        ipAddress: request.ip,
        userAgent: request.headers.get('User-Agent')
      }
    });

    // Mark token as used
    await db.token.update({
      where: { id: token.id },
      data: {
        isUsed: true,
        usedAt: new Date()
      }
    });

    return new Response(responseData, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'X-Furo-Token-Used': token.tokenHash
      }
    });

  } catch (error) {
    // Log error but don't mark token as used for server errors
    await db.usageLog.create({
      data: {
        tokenId: token.id,
        apiId: token.apiId,
        providerId: token.providerId,
        developerAddress: token.developerAddress,
        responseStatus: 500,
        responseTime: Date.now() - startTime,
        success: false,
        errorMessage: error.message
      }
    });

    throw error;
  }
}
```

#### Final Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Furo-Token-Used: tkn_weather_abc123def456_20241113
X-Furo-Response-Time: 150

{
  "location": "New York, NY",
  "temperature": 22.5,
  "humidity": 65,
  "conditions": "Partly Cloudy",
  "timestamp": "2024-11-13T10:35:00Z"
}
```

## Error Handling Scenarios

### Invalid Token
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Invalid or expired token",
  "code": "TOKEN_INVALID",
  "message": "The provided token is not valid or has expired"
}
```

### Already Used Token
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Token already used",
  "code": "TOKEN_USED",
  "message": "This token has already been used for an API call",
  "originalUsage": "2024-11-13T10:35:00Z"
}
```

### Insufficient Payment
```http
HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "error": "Insufficient payment",
  "code": "PAYMENT_INSUFFICIENT",
  "message": "Payment amount is below required minimum",
  "required": "1000000000000000000",
  "provided": "500000000000000000",
  "shortfall": "500000000000000000"
}
```

### Replay Attack Prevention
```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "error": "Payment already processed",
  "code": "PAYMENT_REPLAY",
  "message": "This transaction hash has already been used to purchase tokens",
  "originalPayment": "2024-11-13T10:30:00Z"
}
```

## Multi-Token Purchases

### Payment for Multiple API Calls
```javascript
// Developer purchases 5 API calls
const tx = await wallet.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b8D4E7E0E0E8e4e4e4",
  value: ethers.parseEther("5.0"), // 5 ETH for 5 tokens
  gasLimit: 21000
});
```

#### Token Generation
```sql
-- Create single payment record
INSERT INTO Payment (
  id, amount, numberOfTokens
) VALUES (
  'payment_multi_123',
  '5000000000000000000', -- 5 ETH
  5 -- 5 tokens
);

-- Create 5 token records
INSERT INTO Token (paymentId, tokenHash, expiresAt) VALUES
  ('payment_multi_123', 'tkn_batch1_token1', '2024-12-13T10:30:00Z'),
  ('payment_multi_123', 'tkn_batch1_token2', '2024-12-13T10:30:00Z'),
  ('payment_multi_123', 'tkn_batch1_token3', '2024-12-13T10:30:00Z'),
  ('payment_multi_123', 'tkn_batch1_token4', '2024-12-13T10:30:00Z'),
  ('payment_multi_123', 'tkn_batch1_token5', '2024-12-13T10:30:00Z');
```

#### Token Management Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "payment": {
    "transactionHash": "0xdef456...",
    "amount": "5.0 ETH",
    "tokensPurchased": 5
  },
  "tokens": [
    {
      "tokenHash": "tkn_batch1_token1",
      "expiresAt": "2024-12-13T10:30:00Z"
    },
    {
      "tokenHash": "tkn_batch1_token2",
      "expiresAt": "2024-12-13T10:30:00Z"
    },
    {
      "tokenHash": "tkn_batch1_token3",
      "expiresAt": "2024-12-13T10:30:00Z"
    },
    {
      "tokenHash": "tkn_batch1_token4",
      "expiresAt": "2024-12-13T10:30:00Z"
    },
    {
      "tokenHash": "tkn_batch1_token5",
      "expiresAt": "2024-12-13T10:30:00Z"
    }
  ],
  "totalTokensAvailable": 5
}
```

## Security Considerations

### 1. Token Security
- **Uniqueness**: Each token hash is cryptographically unique
- **Expiration**: Tokens have configurable expiration times
- **Single Use**: One-to-one relationship with usage logs prevents replay
- **Binding**: Tokens bound to specific APIs and developers

### 2. Payment Security
- **On-Chain Verification**: All payments verified on blockchain
- **Replay Prevention**: Transaction hashes tracked to prevent reuse
- **Amount Validation**: Payment amounts strictly validated
- **Recipient Verification**: Payments only to registered provider wallets

### 3. Network Security
- **Rate Limiting**: IP-based request throttling
- **Request Size Limits**: Prevent DoS attacks
- **Timeout Protection**: Configurable timeouts for provider endpoints
- **Error Handling**: Graceful degradation for provider failures

## Performance Optimizations

### 1. Token Validation Caching
```typescript
// Cache active tokens in memory for fast validation
const tokenCache = new Map<string, Token>();

async function getCachedToken(tokenHash: string): Promise<Token | null> {
  // Check cache first
  if (tokenCache.has(tokenHash)) {
    return tokenCache.get(tokenHash)!;
  }

  // Load from database
  const token = await db.token.findUnique({
    where: { tokenHash }
  });

  if (token && !token.isUsed && token.expiresAt > new Date()) {
    tokenCache.set(tokenHash, token);
    return token;
  }

  return null;
}
```

### 2. Payment Verification Optimization
```typescript
// Batch verify multiple payments
async function batchVerifyPayments(txHashes: string[]) {
  const results = await Promise.allSettled(
    txHashes.map(hash => verifyPayment(hash))
  );

  return results.map((result, index) => ({
    hash: txHashes[index],
    verified: result.status === 'fulfilled',
    error: result.status === 'rejected' ? result.reason : null
  }));
}
```

### 3. Connection Pooling
```typescript
// Reuse HTTP connections to provider endpoints
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 100,
  maxFreeSockets: 10
});

async function forwardRequest(url: string, options: RequestOptions) {
  return fetch(url, {
    ...options,
    agent: httpsAgent
  });
}
```

## Monitoring & Analytics

### 1. Payment Metrics
- Transaction verification success rate
- Average payment confirmation time
- Revenue by provider and API
- Payment failure analysis

### 2. Token Usage Analytics
- Token redemption rates
- Average token lifetime
- API call frequency patterns
- Geographic usage distribution

### 3. Performance Monitoring
- API response times by provider
- Error rates and categorization
- Token validation performance
- Network latency measurements

## Compliance & Audit

### 1. Financial Records
- Immutable payment transaction logs
- Complete audit trail for all operations
- Revenue reporting and tax documentation
- Anti-money laundering (AML) compliance

### 2. Data Privacy
- GDPR-compliant data handling
- Minimal data collection principles
- User consent management
- Data retention policies

### 3. Security Auditing
- Regular penetration testing
- Smart contract security audits
- Access control reviews
- Incident response procedures

## Conclusion

The x402 protocol implementation provides a secure, scalable, and user-friendly method for cryptocurrency-based API payments. The standardized flow ensures consistency across all APIs while maintaining flexibility for different use cases and business requirements.

The design prioritizes security through on-chain verification, replay attack prevention, and comprehensive audit trails while maintaining excellent performance through caching, connection pooling, and optimized database operations.